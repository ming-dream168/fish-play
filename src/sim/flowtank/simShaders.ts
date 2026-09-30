// GPU flow tank: simulation passes (GLSL ES 3.00, used with THREE.RawShaderMaterial + GLSL3).
//
// Grid layout (MAC / staggered):
//   Nx x Nz cells over the domain. Grid coordinate g = ((x - xMin) / dx, (z - zMin) / dz),
//   cell (i, j) centre sits at g = (i + 0.5, j + 0.5).
//   Velocity texture is (Nx + 1) x (Nz + 1), RG32F:
//     R = u (x-velocity) on the x-face (i, j) at g = (i, j + 0.5)   (valid for j < Nz)
//     G = w (z-velocity) on the z-face (i, j) at g = (i + 0.5, j)   (valid for i < Nx)
//   Pressure / divergence / obstacle live at cell centres (Nx x Nz). Vorticity is evaluated at nodes.
// Sign convention: omega = omega_y = du/dz - dw/dx  (> 0 = counter-clockwise seen from +y).
// Velocities are stored in world units / s.
//
// Per sub-step: obstacle -> advect(+forces, BCs, immersed boundary) -> prepare -> m x fused RB-SOR -> gradient.
// Per frame: particles (internally sub-stepped) and the display/export field.
// (On ANGLE/Metal the fixed cost per pass dominates, so work is fused into as few passes as possible.)

export const SIM_VERT = /* glsl */ `
precision highp float;
in vec3 position;
void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const HEADER = /* glsl */ `
precision highp float;
precision highp int;
precision highp sampler2D;
uniform ivec2 uN;    // cell count (Nx, Nz)
uniform vec2 uH;     // cell size (dx, dz) in world units
uniform vec2 uMin;   // (xMin, zMin)
uniform float uU;    // free-stream speed (+x)
out vec4 oColor;
`;

// Staggered velocity access + RK2 back-tracing (grid coordinates).
const MAC = /* glsl */ `
float fetchU(sampler2D t, ivec2 c) { return texelFetch(t, clamp(c, ivec2(0), ivec2(uN.x, uN.y - 1)), 0).r; }
float fetchW(sampler2D t, ivec2 c) { return texelFetch(t, clamp(c, ivec2(0), ivec2(uN.x - 1, uN.y)), 0).g; }
float sampleU(sampler2D t, vec2 g) {
  vec2 q = g - vec2(0.0, 0.5);
  vec2 fq = floor(q);
  vec2 f = q - fq;
  ivec2 i0 = ivec2(fq);
  float a = fetchU(t, i0);
  float b = fetchU(t, i0 + ivec2(1, 0));
  float c = fetchU(t, i0 + ivec2(0, 1));
  float d = fetchU(t, i0 + ivec2(1, 1));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float sampleW(sampler2D t, vec2 g) {
  vec2 q = g - vec2(0.5, 0.0);
  vec2 fq = floor(q);
  vec2 f = q - fq;
  ivec2 i0 = ivec2(fq);
  float a = fetchW(t, i0);
  float b = fetchW(t, i0 + ivec2(1, 0));
  float c = fetchW(t, i0 + ivec2(0, 1));
  float d = fetchW(t, i0 + ivec2(1, 1));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
vec2 sampleVel(sampler2D t, vec2 g) { return vec2(sampleU(t, g), sampleW(t, g)); }
// Midpoint (RK2) trace in grid space.
vec2 traceRK2(sampler2D t, vec2 g, float dt) {
  vec2 v1 = sampleVel(t, g) / uH;
  vec2 v2 = sampleVel(t, g - 0.5 * dt * v1) / uH;
  return g - dt * v2;
}
`;

// Advection interpolants: 6-point Lagrange (quintic, default) or Catmull-Rom (cubic), each with an optional
// monotone limiter that clamps the result to the 4 nearest lattice values.
// The semi-Lagrangian step runs 4-5 times per frame, so interpolation damping adds up quickly: after 1 s at U = 3
// on the default grid a feature 8 cells across keeps ~0.1-0.45 of its amplitude with Catmull-Rom but ~0.75-0.86
// with the quintic. That is the difference between shed vortex sheets that roll up and sheets that smear out.
const CUBIC = /* glsl */ `
uniform float uLimiter; // 1 = clamp to the 4 nearest lattice values (monotone), 0 = unlimited
uniform float uQuintic; // 1 = 6-point Lagrange (6x6 taps), 0 = Catmull-Rom (4x4 taps)
vec4 crW(float t) {
  float t2 = t * t;
  float t3 = t2 * t;
  return 0.5 * vec4(-t3 + 2.0 * t2 - t, 3.0 * t3 - 5.0 * t2 + 2.0, -3.0 * t3 + 4.0 * t2 + t, t3 - t2);
}
// Lagrange weights for the nodes -2..3 evaluated at t in [0, 1): (w-2, w-1, w0) and (w1, w2, w3)
void l6W(float t, out vec3 wa, out vec3 wb) {
  float a = t + 2.0;
  float b = t + 1.0;
  float d = t - 1.0;
  float e = t - 2.0;
  float f = t - 3.0;
  float ab = a * b;
  float td = t * d;
  float ef = e * f;
  wa = vec3(-b * td * ef / 120.0, a * td * ef / 24.0, -ab * d * ef / 12.0);
  wb = vec3(ab * t * ef / 12.0, -ab * td * f / 24.0, ab * td * e / 120.0);
}
float cubicU(sampler2D t, vec2 g) {
  vec2 q = g - vec2(0.0, 0.5);
  vec2 fq = floor(q);
  ivec2 i0 = ivec2(fq);
  vec4 wx = crW(q.x - fq.x);
  vec4 wz = crW(q.y - fq.y);
  float acc = 0.0;
  float mn = 1e30;
  float mx = -1e30;
  for (int j = 0; j < 4; j++) {
    ivec2 b = i0 + ivec2(-1, j - 1);
    vec4 v = vec4(fetchU(t, b), fetchU(t, b + ivec2(1, 0)), fetchU(t, b + ivec2(2, 0)), fetchU(t, b + ivec2(3, 0)));
    acc += wz[j] * dot(wx, v);
    if (j == 1 || j == 2) { mn = min(mn, min(v.y, v.z)); mx = max(mx, max(v.y, v.z)); }
  }
  return mix(acc, clamp(acc, mn, mx), uLimiter);
}
float cubicW(sampler2D t, vec2 g) {
  vec2 q = g - vec2(0.5, 0.0);
  vec2 fq = floor(q);
  ivec2 i0 = ivec2(fq);
  vec4 wx = crW(q.x - fq.x);
  vec4 wz = crW(q.y - fq.y);
  float acc = 0.0;
  float mn = 1e30;
  float mx = -1e30;
  for (int j = 0; j < 4; j++) {
    ivec2 b = i0 + ivec2(-1, j - 1);
    vec4 v = vec4(fetchW(t, b), fetchW(t, b + ivec2(1, 0)), fetchW(t, b + ivec2(2, 0)), fetchW(t, b + ivec2(3, 0)));
    acc += wz[j] * dot(wx, v);
    if (j == 1 || j == 2) { mn = min(mn, min(v.y, v.z)); mx = max(mx, max(v.y, v.z)); }
  }
  return mix(acc, clamp(acc, mn, mx), uLimiter);
}
float quinticU(sampler2D t, vec2 g) {
  vec2 q = g - vec2(0.0, 0.5);
  vec2 fq = floor(q);
  ivec2 i0 = ivec2(fq);
  vec3 xa, xb, za, zb;
  l6W(q.x - fq.x, xa, xb);
  l6W(q.y - fq.y, za, zb);
  float wz[6] = float[6](za.x, za.y, za.z, zb.x, zb.y, zb.z);
  float acc = 0.0;
  float mn = 1e30;
  float mx = -1e30;
  for (int j = 0; j < 6; j++) {
    ivec2 b = i0 + ivec2(-2, j - 2);
    vec3 va = vec3(fetchU(t, b), fetchU(t, b + ivec2(1, 0)), fetchU(t, b + ivec2(2, 0)));
    vec3 vb = vec3(fetchU(t, b + ivec2(3, 0)), fetchU(t, b + ivec2(4, 0)), fetchU(t, b + ivec2(5, 0)));
    acc += wz[j] * (dot(xa, va) + dot(xb, vb));
    if (j == 2 || j == 3) { mn = min(mn, min(va.z, vb.x)); mx = max(mx, max(va.z, vb.x)); }
  }
  return mix(acc, clamp(acc, mn, mx), uLimiter);
}
float quinticW(sampler2D t, vec2 g) {
  vec2 q = g - vec2(0.5, 0.0);
  vec2 fq = floor(q);
  ivec2 i0 = ivec2(fq);
  vec3 xa, xb, za, zb;
  l6W(q.x - fq.x, xa, xb);
  l6W(q.y - fq.y, za, zb);
  float wz[6] = float[6](za.x, za.y, za.z, zb.x, zb.y, zb.z);
  float acc = 0.0;
  float mn = 1e30;
  float mx = -1e30;
  for (int j = 0; j < 6; j++) {
    ivec2 b = i0 + ivec2(-2, j - 2);
    vec3 va = vec3(fetchW(t, b), fetchW(t, b + ivec2(1, 0)), fetchW(t, b + ivec2(2, 0)));
    vec3 vb = vec3(fetchW(t, b + ivec2(3, 0)), fetchW(t, b + ivec2(4, 0)), fetchW(t, b + ivec2(5, 0)));
    acc += wz[j] * (dot(xa, va) + dot(xb, vb));
    if (j == 2 || j == 3) { mn = min(mn, min(va.z, vb.x)); mx = max(mx, max(va.z, vb.x)); }
  }
  return mix(acc, clamp(acc, mn, mx), uLimiter);
}
float interpU(sampler2D t, vec2 g) { return uQuintic > 0.5 ? quinticU(t, g) : cubicU(t, g); }
float interpW(sampler2D t, vec2 g) { return uQuintic > 0.5 ? quinticW(t, g) : cubicW(t, g); }
`;

const OBST = /* glsl */ `
uniform sampler2D uObst; // cell centred: R = signed distance (world), GB = body velocity, A = local body half-width
vec4 obst(ivec2 c) { return texelFetch(uObst, clamp(c, ivec2(0), uN - 1), 0); }
bool solidAt(ivec2 c) { return texelFetch(uObst, clamp(c, ivec2(0), uN - 1), 0).r < 0.0; }
`;

// ---------------------------------------------------------------------------------------------
// Obstacle rasterisation: union of tapered capsules along the midline polyline.
// Body data texture rows: 0 = prev (x, z, halfWidth), 1 = prev (vx, vz), 2 = cur pos, 3 = cur vel.
export const OBSTACLE_FRAG = HEADER + /* glsl */ `
uniform sampler2D uBody;
uniform int uCount;
uniform float uLerp;
uniform float uMinHalf;
uniform vec4 uBox;     // AABB of the body (xMin, zMin, xMax, zMax), already padded
uniform float uPad;
vec3 bpos(int i) { return mix(texelFetch(uBody, ivec2(i, 0), 0).xyz, texelFetch(uBody, ivec2(i, 2), 0).xyz, uLerp); }
vec2 bvel(int i) { return mix(texelFetch(uBody, ivec2(i, 1), 0).xy, texelFetch(uBody, ivec2(i, 3), 0).xy, uLerp); }
void main() {
  vec2 p = uMin + gl_FragCoord.xy * uH;
  vec2 q = max(max(uBox.xy - p, p - uBox.zw), 0.0);
  float boxDist = length(q);
  if (uCount < 2 || boxDist > 0.0) {
    oColor = vec4(uPad + boxDist, 0.0, 0.0, 1.0);
    return;
  }
  float best = 1e9;
  vec2 bv = vec2(0.0);
  float bestR = 0.0;
  vec3 a = bpos(0);
  vec2 va = bvel(0);
  for (int i = 1; i < uCount; i++) {
    vec3 b = bpos(i);
    vec2 vb = bvel(i);
    vec2 ab = b.xy - a.xy;
    float l2 = dot(ab, ab);
    float t = l2 > 1e-12 ? clamp(dot(p - a.xy, ab) / l2, 0.0, 1.0) : 0.0;
    float r0 = mix(a.z, b.z, t);
    float r = max(r0, uMinHalf);
    float d = length(p - (a.xy + t * ab)) - r;
    if (d < best) { best = d; bv = mix(va, vb, t); bestR = r0; }
    a = b;
    va = vb;
  }
  oColor = vec4(best, bv, bestR);
}
`;

// ---------------------------------------------------------------------------------------------
// Advection (RK2 back-trace + clamped quintic / cubic interpolation) + outflow sponge + inflow / wall boundary conditions
// + immersed-boundary face velocities.
//   every face with a solid neighbour cell gets the wall velocity: body velocity along the SDF normal plus
//   slip x the tangential fluid velocity sampled just outside the surface (0 = no-slip, 1 = free-slip);
//   slip = uSlip on the body, uFinSlip where the body is thinner than uThin (caudal fin plate).
export const ADVECT_FRAG = HEADER + MAC + CUBIC + OBST + /* glsl */ `
uniform sampler2D uVel;
uniform float uDt;
uniform vec3 uSponge;      // (xStart, xEnd, rate 1/s)
uniform float uInflowPert; // relative inflow perturbation (symmetry breaking)
uniform float uTime;
uniform float uHmin;
uniform float uSlip;
uniform float uFinSlip;
uniform float uThin;       // body half-width (world units) below which the wall counts as a thin fin

float spongeK(float x) {
  float s = clamp((x - uSponge.x) / max(uSponge.y - uSponge.x, 1e-6), 0.0, 1.0);
  return 1.0 - exp(-uSponge.z * s * s * uDt);
}

// Wall model for faces touching the body: normal velocity = body velocity (along the SDF normal),
// tangential velocity = body + uSlip * (fluid - body), fluid sampled just outside the surface.
vec2 wallVelocity(vec2 g, float dFace, vec2 grad, vec2 vb, float halfWidth) {
  float slip = mix(uFinSlip, uSlip, smoothstep(uThin, 2.0 * uThin, halfWidth));
  float gl = length(grad);
  if (slip <= 0.0 || gl < 0.5) return vb;
  vec2 n = grad / gl;
  vec2 gOut = g + n * (abs(dFace) + 1.25 * uHmin) / uH;
  vec2 rel = sampleVel(uVel, gOut) - vb;
  return vb + slip * (rel - dot(rel, n) * n);
}

float updateU(ivec2 c) {
  if (c.x == 0) {
    float z = uMin.y + (float(c.y) + 0.5) * uH.y;
    return uU * (1.0 + uInflowPert * sin(z * 4.1 + uTime * 3.7) * sin(uTime * 1.31 + 0.4));
  }
  vec4 oa = obst(c - ivec2(1, 0));
  vec4 ob = obst(c);
  bool sa = oa.r < 0.0;
  bool sb = c.x < uN.x && ob.r < 0.0;
  if (sa || sb) {
    vec2 vb = sa && sb ? 0.5 * (oa.gb + ob.gb) : (sa ? oa.gb : ob.gb);
    vec2 grad = vec2(
      (ob.r - oa.r) / uH.x,
      (obst(c + ivec2(-1, 1)).r + obst(c + ivec2(0, 1)).r - obst(c + ivec2(-1, -1)).r - obst(c + ivec2(0, -1)).r) / (4.0 * uH.y));
    return wallVelocity(vec2(float(c.x), float(c.y) + 0.5), 0.5 * (oa.r + ob.r), grad, vb, min(oa.a, ob.a)).x;
  }
  vec2 g = vec2(float(c.x), float(c.y) + 0.5);
  float x = uMin.x + float(c.x) * uH.x;
  float val = interpU(uVel, traceRK2(uVel, g, uDt));
  return mix(val, uU, spongeK(x));
}

float updateW(ivec2 c) {
  if (c.y == 0 || c.y == uN.y) return 0.0;
  vec4 oa = obst(c - ivec2(0, 1));
  vec4 ob = obst(c);
  bool sa = oa.r < 0.0;
  bool sb = ob.r < 0.0;
  if (sa || sb) {
    vec2 vb = sa && sb ? 0.5 * (oa.gb + ob.gb) : (sa ? oa.gb : ob.gb);
    vec2 grad = vec2(
      (obst(c + ivec2(1, -1)).r + obst(c + ivec2(1, 0)).r - obst(c + ivec2(-1, -1)).r - obst(c + ivec2(-1, 0)).r) / (4.0 * uH.x),
      (ob.r - oa.r) / uH.y);
    return wallVelocity(vec2(float(c.x) + 0.5, float(c.y)), 0.5 * (oa.r + ob.r), grad, vb, min(oa.a, ob.a)).y;
  }
  vec2 g = vec2(float(c.x) + 0.5, float(c.y));
  float x = uMin.x + (float(c.x) + 0.5) * uH.x;
  float val = interpW(uVel, traceRK2(uVel, g, uDt));
  return mix(val, 0.0, spongeK(x));
}

void main() {
  ivec2 c = ivec2(gl_FragCoord.xy);
  float u = c.y < uN.y ? updateU(c) : 0.0;
  float w = c.x < uN.x ? updateW(c) : 0.0;
  oColor = vec4(u, w, 0.0, 1.0);
}
`;

// ---------------------------------------------------------------------------------------------
// Divergence + face classification for the pressure Poisson equation.
// Output: R = divergence, G = fluid-neighbour flags (1 L, 2 R, 4 B, 8 T), B = diagonal, A = solid.
export const PREPARE_FRAG = HEADER + OBST + /* glsl */ `
uniform sampler2D uVel;
void main() {
  ivec2 c = ivec2(gl_FragCoord.xy);
  if (texelFetch(uObst, c, 0).r < 0.0) { oColor = vec4(0.0, 0.0, 0.0, 1.0); return; }
  float uL = texelFetch(uVel, c, 0).r;
  float uR = texelFetch(uVel, c + ivec2(1, 0), 0).r;
  float wB = texelFetch(uVel, c, 0).g;
  float wT = texelFetch(uVel, c + ivec2(0, 1), 0).g;
  float div = (uR - uL) / uH.x + (wT - wB) / uH.y;
  float ax = 1.0 / (uH.x * uH.x);
  float az = 1.0 / (uH.y * uH.y);
  float fl = 0.0;
  float diag = 0.0;
  if (c.x > 0 && !solidAt(c - ivec2(1, 0))) { fl += 1.0; diag += ax; }
  if (c.x == uN.x - 1) { fl += 2.0; diag += ax; }                 // outflow: Dirichlet p = 0
  else if (!solidAt(c + ivec2(1, 0))) { fl += 2.0; diag += ax; }
  if (c.y > 0 && !solidAt(c - ivec2(0, 1))) { fl += 4.0; diag += az; }
  if (c.y < uN.y - 1 && !solidAt(c + ivec2(0, 1))) { fl += 8.0; diag += az; }
  oColor = vec4(div, fl, diag, 0.0);
}
`;

// ---------------------------------------------------------------------------------------------
// Fused red-black SOR: one full iteration (red then black) per pass. Black cells recompute the
// updated values of their four red neighbours locally. uWarm rescales the warm start when dt changes.
export const SOR_FRAG = HEADER + /* glsl */ `
uniform sampler2D uP;
uniform sampler2D uCoef;
uniform float uOmega;
uniform float uWarm;
float P0(ivec2 c) { return texelFetch(uP, clamp(c, ivec2(0), uN - 1), 0).r * uWarm; }
float relax(ivec2 c, vec4 k, float pc, float pL, float pR, float pB, float pT) {
  if (k.a > 0.5) return 0.25 * (pL + pR + pB + pT);
  int fl = int(k.g + 0.5);
  float ax = 1.0 / (uH.x * uH.x);
  float az = 1.0 / (uH.y * uH.y);
  float s = 0.0;
  if ((fl & 1) != 0) s += ax * pL;
  if ((fl & 2) != 0) s += ax * pR;
  if ((fl & 4) != 0) s += az * pB;
  if ((fl & 8) != 0) s += az * pT;
  float pgs = k.b > 0.0 ? (s - k.r) / k.b : 0.0;
  return mix(pc, pgs, uOmega);
}
// updated value of a red cell from old (black) neighbours
float redNew(ivec2 c) {
  if (c.x < 0 || c.y < 0 || c.y >= uN.y) return 0.0;
  if (c.x >= uN.x) return 0.0; // outflow ghost, Dirichlet
  vec4 k = texelFetch(uCoef, c, 0);
  float pR = c.x == uN.x - 1 ? 0.0 : P0(c + ivec2(1, 0));
  return relax(c, k, P0(c), P0(c - ivec2(1, 0)), pR, P0(c - ivec2(0, 1)), P0(c + ivec2(0, 1)));
}
void main() {
  ivec2 c = ivec2(gl_FragCoord.xy);
  if (((c.x + c.y) & 1) == 0) {
    oColor = vec4(redNew(c), 0.0, 0.0, 1.0);
    return;
  }
  vec4 k = texelFetch(uCoef, c, 0);
  float pc = P0(c);
  float pL = c.x > 0 ? redNew(c - ivec2(1, 0)) : pc;
  float pR = redNew(c + ivec2(1, 0));
  float pB = c.y > 0 ? redNew(c - ivec2(0, 1)) : pc;
  float pT = c.y < uN.y - 1 ? redNew(c + ivec2(0, 1)) : pc;
  oColor = vec4(relax(c, k, pc, pL, pR, pB, pT), 0.0, 0.0, 1.0);
}
`;

// ---------------------------------------------------------------------------------------------
// Projection (pressure-gradient subtraction on fluid faces) followed by the explicit forces, evaluated
// on the advected field u* (sequential splitting: advect -> project -> force). curl(u*) equals the curl
// of the projected field and lap(u*) differs from it only by a gradient, removed by the next projection.
// Prescribed faces (inflow, walls, body) stay as set by the advection pass.
export const GRADIENT_FRAG = HEADER + MAC + OBST + /* glsl */ `
uniform sampler2D uVel;
uniform sampler2D uP;
uniform float uDt;
uniform float uConfine;    // vorticity confinement epsilon (dimensionless, times cell size)
uniform vec2 uConfineW;    // |omega| ramp (1/s) where confinement switches on
uniform float uNu;         // explicit kinematic viscosity (world^2 / s)
uniform vec3 uSponge;
uniform float uHmin;
float P(ivec2 c) { return texelFetch(uP, c, 0).r; }
float nodeW(ivec2 n) {
  return (fetchU(uVel, n) - fetchU(uVel, n - ivec2(0, 1))) / uH.y
       - (fetchW(uVel, n) - fetchW(uVel, n - ivec2(1, 0))) / uH.x;
}
float confMask(float wf, float dmin, float x) {
  float m = smoothstep(uConfineW.x, uConfineW.y, abs(wf));
  m *= smoothstep(1.5 * uHmin, 4.0 * uHmin, dmin);
  m *= 1.0 - smoothstep(uSponge.x - 0.15 * (uSponge.y - uSponge.x), uSponge.x, x);
  return m;
}
float forceU(ivec2 c, float dmin) {
  float f = 0.0;
  float x = uMin.x + float(c.x) * uH.x;
  if (uConfine > 0.0) {
    float w0 = nodeW(c);
    float w1 = nodeW(c + ivec2(0, 1));
    float wf = 0.5 * (w0 + w1);
    float gx = (abs(nodeW(c + ivec2(1, 0))) + abs(nodeW(c + ivec2(1, 1)))
              - abs(nodeW(c - ivec2(1, 0))) - abs(nodeW(c + ivec2(-1, 1)))) / (4.0 * uH.x);
    float gz = (abs(w1) - abs(w0)) / uH.y;
    float gl = length(vec2(gx, gz));
    if (gl > 1e-6) f += -uConfine * uHmin * (gz / gl) * wf * confMask(wf, dmin, x);
  }
  if (uNu > 0.0) {
    float u0 = fetchU(uVel, c);
    f += uNu * ((fetchU(uVel, c + ivec2(1, 0)) + fetchU(uVel, c - ivec2(1, 0)) - 2.0 * u0) / (uH.x * uH.x)
              + (fetchU(uVel, c + ivec2(0, 1)) + fetchU(uVel, c - ivec2(0, 1)) - 2.0 * u0) / (uH.y * uH.y));
  }
  return f;
}
float forceW(ivec2 c, float dmin) {
  float f = 0.0;
  float x = uMin.x + (float(c.x) + 0.5) * uH.x;
  if (uConfine > 0.0) {
    float w0 = nodeW(c);
    float w1 = nodeW(c + ivec2(1, 0));
    float wf = 0.5 * (w0 + w1);
    float gx = (abs(w1) - abs(w0)) / uH.x;
    float gz = (abs(nodeW(c + ivec2(0, 1))) + abs(nodeW(c + ivec2(1, 1)))
              - abs(nodeW(c - ivec2(0, 1))) - abs(nodeW(c + ivec2(1, -1)))) / (4.0 * uH.y);
    float gl = length(vec2(gx, gz));
    if (gl > 1e-6) f += uConfine * uHmin * (gx / gl) * wf * confMask(wf, dmin, x);
  }
  if (uNu > 0.0) {
    float w0v = fetchW(uVel, c);
    f += uNu * ((fetchW(uVel, c + ivec2(1, 0)) + fetchW(uVel, c - ivec2(1, 0)) - 2.0 * w0v) / (uH.x * uH.x)
              + (fetchW(uVel, c + ivec2(0, 1)) + fetchW(uVel, c - ivec2(0, 1)) - 2.0 * w0v) / (uH.y * uH.y));
  }
  return f;
}
void main() {
  ivec2 c = ivec2(gl_FragCoord.xy);
  vec2 v = texelFetch(uVel, c, 0).rg;
  float u = v.x;
  float w = v.y;
  if (c.y < uN.y) {
    if (c.x == 0) {
      // inflow face: prescribed
    } else if (c.x == uN.x) {
      ivec2 cl = ivec2(uN.x - 1, c.y);
      if (!solidAt(cl)) u += P(cl) / uH.x;
    } else {
      ivec2 cl = c - ivec2(1, 0);
      vec4 oa = obst(cl);
      vec4 ob = obst(c);
      if (oa.r >= 0.0 && ob.r >= 0.0) u += uDt * forceU(c, min(oa.r, ob.r)) - (P(c) - P(cl)) / uH.x;
    }
  } else {
    u = 0.0;
  }
  if (c.x < uN.x) {
    if (c.y == 0 || c.y == uN.y) {
      w = 0.0;
    } else {
      ivec2 cb = c - ivec2(0, 1);
      vec4 oa = obst(cb);
      vec4 ob = obst(c);
      if (oa.r >= 0.0 && ob.r >= 0.0) w += uDt * forceW(c, min(oa.r, ob.r)) - (P(c) - P(cb)) / uH.y;
    }
  } else {
    w = 0.0;
  }
  oColor = vec4(u, w, 0.0, 1.0);
}
`;

// ---------------------------------------------------------------------------------------------
// Cell-centred export / display field: RGBA16F = (vx, vz, omega_y, signed distance to the body).
export const DISPLAY_FRAG = HEADER + MAC + OBST + /* glsl */ `
uniform sampler2D uVel;
uniform float uHmin;
uniform float uSigma;   // gaussian vorticity averaging radius in cells (PIV-like interrogation window)
float nodeOmega(ivec2 n) {
  return (fetchU(uVel, n) - fetchU(uVel, n - ivec2(0, 1))) / uH.y
       - (fetchW(uVel, n) - fetchW(uVel, n - ivec2(1, 0))) / uH.x;
}
void main() {
  ivec2 c = ivec2(gl_FragCoord.xy);
  float vx = 0.5 * (fetchU(uVel, c) + fetchU(uVel, c + ivec2(1, 0)));
  float vz = 0.5 * (fetchW(uVel, c) + fetchW(uVel, c + ivec2(0, 1)));
  float om;
  if (uSigma < 0.3) {
    om = 0.25 * (nodeOmega(c) + nodeOmega(c + ivec2(1, 0)) + nodeOmega(c + ivec2(0, 1)) + nodeOmega(c + ivec2(1, 1)));
  } else {
    // nodes (c.x + i, c.y + j), i, j in [-2, 3], sit at offsets (i - 0.5, j - 0.5) cells from the cell centre
    float k = -0.5 / (uSigma * uSigma);
    float acc = 0.0;
    float wsum = 0.0;
    for (int j = -2; j <= 3; j++) {
      for (int i = -2; i <= 3; i++) {
        vec2 o = vec2(float(i) - 0.5, float(j) - 0.5);
        float w = exp(k * dot(o, o));
        acc += w * nodeOmega(c + ivec2(i, j));
        wsum += w;
      }
    }
    om = acc / wsum;
  }
  // A = signed distance to the body (world units, < 0 inside), clamped to +-8 cells
  float d = clamp(texelFetch(uObst, c, 0).r, -8.0 * uHmin, 8.0 * uHmin);
  oColor = vec4(vx, vz, om, d);
}
`;

// ---------------------------------------------------------------------------------------------
// Fill / reset the staggered velocity field with the free stream.
export const FILL_VEL_FRAG = HEADER + /* glsl */ `
void main() {
  ivec2 c = ivec2(gl_FragCoord.xy);
  oColor = vec4(c.y < uN.y ? uU : 0.0, 0.0, 0.0, 1.0);
}
`;

export const FILL_ZERO_FRAG = HEADER + /* glsl */ `
void main() { oColor = vec4(0.0); }
`;

// Down-sampled probe field (box filter of the display field), read back asynchronously.
export const PROBE_FRAG = /* glsl */ `
precision highp float;
precision highp sampler2D;
uniform sampler2D uSrc;
uniform float uFactor;
out vec4 oColor;
void main() {
  ivec2 base = ivec2(floor(gl_FragCoord.xy) * uFactor);
  ivec2 lim = textureSize(uSrc, 0) - 1;
  vec4 acc = vec4(0.0);
  float n = 0.0;
  for (int j = 0; j < 4; j++) {
    for (int i = 0; i < 4; i++) {
      if (float(i) < uFactor && float(j) < uFactor) {
        acc += texelFetch(uSrc, min(base + ivec2(i, j), lim), 0);
        n += 1.0;
      }
    }
  }
  oColor = acc / max(n, 1.0);
}
`;

// ---------------------------------------------------------------------------------------------
// Tracer particles: RGBA32F = (x, z, age, generation). RK2 through the staggered field,
// sub-stepped inside the shader (one pass per frame).
export const HASH_GLSL = /* glsl */ `
uint pcg(uint v) {
  uint state = v * 747796405u + 2891336453u;
  uint word = ((state >> ((state >> 28u) + 4u)) ^ state) * 277803737u;
  return (word >> 22u) ^ word;
}
float u01(uint h) { return float(h >> 8u) * (1.0 / 16777216.0); }
`;

export const PARTICLE_FRAG = HEADER + MAC + OBST + HASH_GLSL + /* glsl */ `
uniform sampler2D uState;
uniform sampler2D uVel;
uniform float uDt;        // frame dt
uniform int uSteps;       // internal RK2 sub-steps
uniform int uInit;
uniform uint uSeed;
uniform vec2 uLife;       // lifetime range (s)
uniform ivec2 uStateSize;
uniform vec4 uDomain;     // xMin, zMin, xMax, zMax
uniform sampler2D uField; // previous display field (cell-centred velocity, linear filtered)
uniform float uInertia;   // particle response time tau (s): v_p = u - tau (u.grad)u (heavy tracers leave vortex cores)

float lifeOf(uint id, float gen) { return mix(uLife.x, uLife.y, u01(pcg(id * 3u + pcg(uint(gen) + 17u)))); }
vec2 world2grid(vec2 p) { return (p - uMin) / uH; }

void main() {
  ivec2 tc = ivec2(gl_FragCoord.xy);
  uint id = uint(tc.y * uStateSize.x + tc.x);
  vec4 s = texelFetch(uState, tc, 0);
  vec2 p = s.xy;
  float age = s.z;
  float gen = s.w;
  uint h = pcg(id ^ pcg(uSeed));
  vec2 span = uDomain.zw - uDomain.xy;
  if (uInit == 1) {
    gen = float(pcg(id) & 1023u);
    p = uDomain.xy + vec2(u01(pcg(h + 1u)), u01(pcg(h + 2u))) * span;
    age = u01(pcg(h + 3u)) * lifeOf(id, gen);
    oColor = vec4(p, age, gen);
    return;
  }
  // inertial drift (first-order Maxey-Riley), clamped so tracers stay tracers
  vec2 drift = vec2(0.0);
  if (uInertia > 0.0) {
    vec2 uv = (p - uDomain.xy) / span;
    vec2 ex = vec2(1.0 / float(uN.x), 0.0);
    vec2 ez = vec2(0.0, 1.0 / float(uN.y));
    vec2 u0 = texture(uField, uv).xy;
    vec2 ddx = (texture(uField, uv + ex).xy - texture(uField, uv - ex).xy) / (2.0 * uH.x);
    vec2 ddz = (texture(uField, uv + ez).xy - texture(uField, uv - ez).xy) / (2.0 * uH.y);
    drift = -uInertia * (u0.x * ddx + u0.y * ddz);
    float dl = length(drift);
    float dmax = 0.25 * max(uU, 0.1);
    if (dl > dmax) drift *= dmax / dl;
  }
  float h1 = uDt / float(max(uSteps, 1));
  for (int k = 0; k < 16; k++) {
    if (k >= uSteps) break;
    vec2 v1 = sampleVel(uVel, world2grid(p)) + drift;
    vec2 v2 = sampleVel(uVel, world2grid(p + 0.5 * h1 * v1)) + drift;
    p += h1 * v2;
  }
  age += uDt;
  bool respawn = false;
  bool inflow = false;
  if (p.x > uDomain.z) { respawn = true; inflow = true; }
  else if (age > lifeOf(id, gen) || p.x < uDomain.x || p.y < uDomain.y || p.y > uDomain.w) respawn = true;
  else if (solidAt(ivec2(floor(world2grid(p))))) respawn = true;
  if (respawn) {
    gen += 1.0;
    float rz = u01(pcg(h + 5u));
    if (inflow) {
      p = vec2(uDomain.x + u01(pcg(h + 6u)) * max(uU * uDt, uH.x), uDomain.y + rz * span.y);
    } else {
      p = uDomain.xy + vec2(u01(pcg(h + 7u)), rz) * span;
    }
    age = 0.0;
  }
  oColor = vec4(p, age, gen);
}
`;
