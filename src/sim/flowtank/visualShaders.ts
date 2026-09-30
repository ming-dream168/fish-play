// GPU flow tank: display shaders (THREE.ShaderMaterial, GLSL1-style syntax compiled as GLSL ES 3.00
// by three.js, so texelFetch / gl_InstanceID / uint are available).

import { HASH_GLSL } from './simShaders';

const EDGE_FADE = /* glsl */ `
uniform vec4 uFade; // fade widths in uv units: xMin edge, xMax edge, zMin edge, zMax edge
float edgeFade(vec2 uv) {
  float fx = smoothstep(0.0, uFade.x, uv.x) * smoothstep(0.0, uFade.y, 1.0 - uv.x);
  float fz = smoothstep(0.0, uFade.z, uv.y) * smoothstep(0.0, uFade.w, 1.0 - uv.y);
  float f = fx * fz;
  return f * f * (3.0 - 2.0 * f);
}
`;

export const PLANE_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const PLANE_FRAG = /* glsl */ `
uniform sampler2D uField;     // (vx, vz, omega_y, signed distance) at cell centres, linear filtered
uniform vec2 uFieldSize;
uniform vec3 uColPos;
uniform vec3 uColNeg;
uniform vec3 uColSheet;
uniform vec3 uColHaze;
uniform float uOmegaScale;
uniform float uU;
uniform float uVort;
uniform float uSheet;
uniform float uHaze;
uniform float uOpacity;
uniform float uCoreBoost;
uniform float uSwirl;         // 0..1: dim pure-shear sheets relative to rotating vortex cores (Q-criterion)
uniform vec2 uCell;           // cell size (dx, dz)
varying vec2 vUv;
${EDGE_FADE}

// Cubic B-spline filtering with 4 bilinear taps: smooth, ringing-free magnification.
vec4 cubicW(float v) {
  vec4 n = vec4(1.0, 2.0, 3.0, 4.0) - v;
  vec4 s = n * n * n;
  float x = s.x;
  float y = s.y - 4.0 * s.x;
  float z = s.z - 4.0 * s.y + 6.0 * s.x;
  float w = 6.0 - x - y - z;
  return vec4(x, y, z, w) * (1.0 / 6.0);
}
vec4 bicubic(sampler2D t, vec2 uv, vec2 size) {
  vec2 inv = 1.0 / size;
  vec2 st = uv * size - 0.5;
  vec2 f = fract(st);
  st -= f;
  vec4 xc = cubicW(f.x);
  vec4 yc = cubicW(f.y);
  vec4 c = st.xxyy + vec2(-0.5, 1.5).xyxy;
  vec4 s = vec4(xc.xz + xc.yw, yc.xz + yc.yw);
  vec4 o = (c + vec4(xc.yw, yc.yw) / s) * inv.xxyy;
  vec4 s0 = texture2D(t, o.xz);
  vec4 s1 = texture2D(t, o.yz);
  vec4 s2 = texture2D(t, o.xw);
  vec4 s3 = texture2D(t, o.yw);
  float sx = s.x / (s.x + s.y);
  float sy = s.z / (s.z + s.w);
  return mix(mix(s3, s2, sx), mix(s1, s0, sx), sy);
}

void main() {
  vec4 f = bicubic(uField, vUv, uFieldSize);
  float hmin = min(uCell.x, uCell.y);
  float fluid = smoothstep(-0.25 * hmin, 0.75 * hmin, f.w);
  float nearBody = 1.0 - smoothstep(1.5 * hmin, 5.0 * hmin, f.w);
  float om = f.z;
  float t = abs(om) / uOmegaScale;

  // diverging vorticity map: transparent near zero, soft ramp, brighter cores
  float a = smoothstep(0.04, 1.0, t);
  a = pow(a, 0.8);
  if (uSwirl > 0.0) {
    // swirl ratio r = (w^2 - s^2) / (w^2 + s^2): 1 in a vortex core, 0 in a shear layer, -1 in pure strain
    vec2 tx = vec2(1.0 / uFieldSize.x, 0.0);
    vec2 tz = vec2(0.0, 1.0 / uFieldSize.y);
    vec2 dvdx = (texture2D(uField, vUv + tx).xy - texture2D(uField, vUv - tx).xy) / (2.0 * uCell.x);
    vec2 dvdz = (texture2D(uField, vUv + tz).xy - texture2D(uField, vUv - tz).xy) / (2.0 * uCell.y);
    float w2 = (dvdz.x - dvdx.y) * (dvdz.x - dvdx.y);
    float s2 = (dvdx.x - dvdz.y) * (dvdx.x - dvdz.y) + (dvdz.x + dvdx.y) * (dvdz.x + dvdx.y);
    float r = (w2 - s2) / (w2 + s2 + 1e-6);
    // near the body the voxelised wall adds tiny spurious swirls: blend back to a soft, dimmed layer there
    a *= mix(mix(1.0 - uSwirl, 1.0, smoothstep(-0.35, 0.55, r)), 0.55, nearBody);
  }
  vec3 base = om > 0.0 ? uColPos : uColNeg;
  float core = smoothstep(0.85, 2.6, t);
  vec3 col = mix(base, vec3(1.0), 0.2 * core) * (1.0 + uCoreBoost * core);
  float aV = min(a * 0.92, 0.94) * uVort;
  vec3 C = col * aV;
  float A = aV;

  // faint haze from the velocity perturbation magnitude (reveals the wake jet)
  float dv = length(f.xy - vec2(uU, 0.0)) / max(uU, 0.1);
  float hz = uHaze * 0.13 * smoothstep(0.05, 0.75, dv);
  C += uColHaze * hz * (1.0 - A);
  A += hz * (1.0 - A);

  // laser-sheet glow (PIV): faint, with soft striations along the beam direction
  float zs = vUv.y * uFieldSize.y * uCell.y;
  float stri = 0.78 + 0.22 * (0.6 * sin(zs * 37.0 + 1.3) * sin(zs * 11.0) + 0.4 * sin(zs * 83.0 + 0.7));
  float sh = uSheet * 0.04 * stri;
  C += uColSheet * sh * (1.0 - A);
  A += sh * (1.0 - A);

  float m = edgeFade(vUv) * fluid * uOpacity;
  C *= m;
  A *= m;
  if (A < 1.0 / 1024.0) discard;
  vec3 c = C / A;
  gl_FragColor = vec4(linearToOutputTexel(vec4(c, 1.0)).rgb * A, A); // premultiplied
}
`;

export const PARTICLE_VERT = /* glsl */ `
uniform sampler2D uState;      // (x, z, age, generation)
uniform ivec2 uStateSize;
uniform sampler2D uField;
uniform vec4 uDomain;          // xMin, zMin, xMax, zMax
uniform vec2 uResolution;      // current viewport, physical px
uniform float uPixelRatio;
uniform float uSize;           // gaussian sigma in CSS px
uniform float uExposure;       // streak exposure time (s)
uniform float uIntensity;
uniform float uOpacity;
uniform float uU;
uniform float uStreakFrame;    // 0 = streaks in the fish frame, 1 = relative to the free stream
uniform vec2 uLife;
uniform vec2 uWhite;           // speed / U range mapping green -> white
uniform vec3 uColA;
uniform vec3 uColB;
uniform float uHmin;
varying vec2 vLocal;
varying float vLen;
varying float vSigma;
varying float vAmp;
varying float vTrail;
varying vec3 vBase;
${HASH_GLSL}
${EDGE_FADE}
float lifeOf(uint id, float gen) { return mix(uLife.x, uLife.y, u01(pcg(id * 3u + pcg(uint(gen) + 17u)))); }
void cull() {
  gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
  vLocal = vec2(0.0); vLen = 0.0; vSigma = 1.0; vAmp = 0.0; vTrail = 0.0; vBase = vec3(0.0);
}
void main() {
  int id = gl_InstanceID;
  ivec2 tc = ivec2(id % uStateSize.x, id / uStateSize.x);
  vec4 s = texelFetch(uState, tc, 0);
  vec2 p = s.xy;
  float age = s.z;
  float gen = s.w;
  vec2 uvp = (p - uDomain.xy) / (uDomain.zw - uDomain.xy);
  vec4 f = texture2D(uField, uvp);
  uint uid = uint(id);
  float life = lifeOf(uid, gen);
  uint h = pcg(uid * 7919u + uint(gen) * 104729u);
  float r1 = u01(pcg(h + 11u));
  float r2 = u01(pcg(h + 12u));
  float sparkle = step(0.965, u01(pcg(h + 13u)));   // a few large, bright particles
  float fade = smoothstep(0.0, 0.3, age) * (1.0 - smoothstep(life - 0.4, life, age));
  float alpha = fade * edgeFade(uvp) * smoothstep(0.0, 1.5 * uHmin, f.w) * uOpacity;
  if (alpha < 0.002) { cull(); return; }

  vec2 vs = f.xy - vec2(uU * uStreakFrame, 0.0);
  vec4 cA = projectionMatrix * modelViewMatrix * vec4(p.x - vs.x * uExposure, 0.0, p.y - vs.y * uExposure, 1.0);
  vec4 cB = projectionMatrix * modelViewMatrix * vec4(p.x, 0.0, p.y, 1.0);
  if (cA.w < 1e-4 || cB.w < 1e-4) { cull(); return; }
  vec2 hres = 0.5 * uResolution;
  vec2 sA = cA.xy / cA.w * hres;
  vec2 sB = cB.xy / cB.w * hres;
  vec2 d = sB - sA;
  float len = length(d);
  vec2 dir = len > 1e-3 ? d / len : vec2(1.0, 0.0);
  vec2 nrm = vec2(-dir.y, dir.x);
  float sigma = max(uSize * uPixelRatio * mix(0.6, 1.25, r1) * (1.0 + 0.6 * sparkle), 0.5);
  float ext = sigma * 3.0 + 0.75;
  float al = position.x;
  vec2 sP = mix(sA, sB, al) + dir * (al * 2.0 - 1.0) * ext + nrm * position.y * ext;
  vec4 cc = mix(cA, cB, al);
  gl_Position = vec4(sP / hres * cc.w, cc.z, cc.w);

  vLocal = vec2(al * len + (al * 2.0 - 1.0) * ext, position.y * ext);
  vLen = len;
  vSigma = sigma;
  float speed = length(f.xy) / max(uU, 0.1);
  vBase = mix(uColA, uColB, smoothstep(uWhite.x, uWhite.y, speed));
  float bright = mix(0.1, 0.85, r2 * r2 * r2) + 0.9 * sparkle;
  vAmp = bright * alpha * uIntensity;
  vTrail = 0.6 / sqrt(1.0 + len / (4.0 * sigma));
}
`;

export const PARTICLE_FRAG = /* glsl */ `
varying vec2 vLocal;   // (along the streak from its tail end, across) in px
varying float vLen;
varying float vSigma;
varying float vAmp;
varying float vTrail;
varying vec3 vBase;
void main() {
  // comet profile: gaussian head at the current position + a dimmer trail fading over the exposure
  float ax = vLocal.x;
  float ay2 = vLocal.y * vLocal.y;
  float inv = 0.5 / (vSigma * vSigma);
  float dh = ax - vLen;
  float head = exp(-(dh * dh + ay2) * inv);
  float t = clamp(ax / max(vLen, 1e-3), 0.0, 1.0);
  float trail = ax >= 0.0 && ax <= vLen ? exp(-ay2 * inv) * t * t * vTrail : 0.0;
  float k = vAmp * max(head, trail);
  if (k < 1.0 / 2048.0) discard;
  gl_FragColor = vec4(linearToOutputTexel(vec4(vBase, 1.0)).rgb * k, 1.0);
}
`;
