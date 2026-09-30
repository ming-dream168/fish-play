// FlowTank: real-time 2D incompressible flow around an undulating fish, seen in the fish's frame
// (a "digital flow tank"): the fish is held in place and water streams past it from head to tail.
// Rendered as a vorticity map and/or a PIV-style laser-sheet particle image.
//
// Coordinates (fish-local, world units): simulation plane y = 0, x = head -> tail (free stream +x),
// z = lateral. Default domain x in [-1.6, 4.4], z in [-1.5, 1.5] for body length L = 2.
// Vorticity sign: omega = omega_y = dvx/dz - dvz/dx, > 0 = counter-clockwise seen from +y.
//
// Numerics (all on the GPU, WebGL2 float render targets, see simShaders.ts):
//   staggered MAC grid; RK2 back-trace + clamped 6-point Lagrange (quintic) advection; voxelised immersed
//   boundary (union of tapered capsules along the midline, thin caudal fin rasterised as a plate of >= 1.7
//   cells) with the body velocity imposed on every face touching a solid cell and a tunable wall slip
//   (partial slip on the body = thin boundary layer, no-slip on the fin plate = proper trailing-edge shedding);
//   fused red-black SOR pressure solve (warm started); explicit viscosity + vorticity confinement;
//   uniform inflow, p = 0 outflow with a sponge layer, free-slip side walls. Sub-stepped to CFL <= maxCFL,
//   body positions interpolated across sub-steps.
//
// Outputs:
//   mesh             Group (plane in y = 0 covering the domain + instanced PIV particles). Add it as a
//                    child of the fish root. Transparent, depthWrite false, depthTest true.
//   velocityTexture  HalfFloat RGBA, linear filtered, one texel per cell, uv = ((x - xMin) / W, (z - zMin) / H):
//                    R, G = vx, vz (world units / s), B = omega_y (1/s, smoothed like a PIV window),
//                    A = signed distance to the body (world units, < 0 inside, clamped to +-8 cells).
//                    Updated once per step().

import * as THREE from 'three';
import * as SIM from './simShaders';
import { PLANE_FRAG, PLANE_VERT, PARTICLE_FRAG, PARTICLE_VERT } from './visualShaders';

export interface BodySample {
  x: number;
  z: number;
  halfWidth: number;
  vx: number;
  vz: number;
}

export interface FlowTankColors {
  /** counter-clockwise vorticity seen from +y (omega_y > 0). Default #3D8BFF (alcian blue). */
  positive?: THREE.ColorRepresentation;
  /** clockwise vorticity seen from +y (omega_y < 0). Default #EF3E6D (alizarin crimson). */
  negative?: THREE.ColorRepresentation;
  /** PIV particle colour. Default #7CFF6B (laser-sheet green). */
  piv?: THREE.ColorRepresentation;
  /** PIV particle colour at high speed. Default #F4FFF0. */
  pivFast?: THREE.ColorRepresentation;
  /** laser-sheet background glow. Default #7CFF6B. */
  sheet?: THREE.ColorRepresentation;
  /** velocity-perturbation haze. Default #8FB3E0. */
  haze?: THREE.ColorRepresentation;
}

export interface FlowTankParams {
  /** advective CFL target used to pick the number of sub-steps */
  maxCFL: number;
  maxSubsteps: number;
  /** full red-black SOR iterations per sub-step (one render pass each) */
  pressureIterations: number;
  /** lower bound on SOR iterations per frame (spread over the sub-steps) */
  minPressureIterationsPerFrame: number;
  sorOmega: number;
  /** advection interpolant: 5 = 6-point Lagrange (default, far less numerical damping), 3 = Catmull-Rom */
  advectionOrder: 3 | 5;
  /** 1 = clamp the interpolant to the 4 nearest lattice values (monotone), 0 = unlimited (can overshoot) */
  advectionLimiter: number;
  /** tangential wall condition on the body: 0 = no-slip, 1 = free-slip (partial slip models a thin boundary layer) */
  bodySlip: number;
  /** same for thin parts (half-width below minHalfThicknessCells, i.e. the caudal fin plate); low = strong shedding */
  finSlip: number;
  /** vorticity confinement epsilon (dimensionless, multiplied by the cell size) */
  confinement: number;
  /** |omega| ramp (1/s) over which confinement fades in */
  confinementRamp: [number, number];
  /** explicit kinematic viscosity (world^2/s); 0 = numerical viscosity only */
  viscosity: number;
  /** outflow sponge length (world units) and damping rate (1/s) */
  spongeLength: number;
  spongeRate: number;
  /** relative amplitude of the inflow perturbation (breaks symmetry of a stationary body) */
  inflowPerturbation: number;
  /** min body half-thickness in cells (thin caudal fin is rasterised as a plate this thick) */
  minHalfThicknessCells: number;
  /** gaussian averaging radius (cells) of the displayed / exported vorticity, like a PIV interrogation window */
  vorticitySmoothing: number;
  /** |omega| (1/s) at which the colour map saturates; 0 = auto (12 U / Lref, Lref = domain width / 3) */
  vorticityScale: number;
  coreBoost: number;
  /** 0..1: dims pure-shear vorticity sheets relative to rotating vortex cores (Q-criterion weighting) */
  swirlEmphasis: number;
  hazeStrength: number;
  sheetStrength: number;
  /** particle gaussian sigma in CSS px */
  particleSize: number;
  /** particle streak exposure (s) */
  particleExposure: number;
  particleIntensity: number;
  /** 0 = streaks in the fish frame, 1 = streaks relative to the free stream */
  particleStreakFrame: number;
  particleLife: [number, number];
  /** tracer response time (s): slightly heavy particles drift out of vortex cores (dark cores, as in real PIV) */
  particleInertia: number;
  /** particle colour goes green -> white over this |v| / U range */
  pivWhiteSpeed: [number, number];
  /** soft edge fade widths in world units: [xMin side, xMax side, zMin side, zMax side] */
  edgeFade: [number, number, number, number];
  /** visual mode cross-fade time constant (s) */
  transitionTime: number;
}

export interface FlowTankOptions {
  /** grid cells (x, z); default [384, 192] */
  resolution?: [number, number];
  /** default x in [-1.6, 4.4], z in [-1.5, 1.5] (for L = 2) */
  domain?: { xMin: number; xMax: number; zMin: number; zMax: number };
  /** number of PIV tracer particles, default 65536 */
  particleCount?: number;
  colors?: FlowTankColors;
  params?: Partial<FlowTankParams>;
  /** measure GPU time of step() with EXT_disjoint_timer_query_webgl2 (stats.gpuMs). Default false. */
  gpuTimer?: boolean;
}

export type FlowVisual = 'vorticity' | 'piv' | 'both';

export interface FlowTankStats {
  substeps: number;
  dtSub: number;
  cfl: number;
  /** CPU time spent issuing the last step() (ms) */
  cpuMs: number;
  /** GPU time of the last measured step() (ms), -1 unless options.gpuTimer and the extension are available */
  gpuMs: number;
  simTime: number;
  passes: number;
}

type RT = THREE.WebGLRenderTarget;
type Uniforms = Record<string, THREE.IUniform>;

const MAX_SAMPLES = 512;

const DEFAULT_PARAMS: FlowTankParams = {
  maxCFL: 1.0,
  maxSubsteps: 8,
  pressureIterations: 8,
  minPressureIterationsPerFrame: 24,
  sorOmega: 1.4,
  advectionOrder: 5,
  advectionLimiter: 1,
  bodySlip: 0.85,
  finSlip: 0,
  confinement: 0.6,
  confinementRamp: [2.0, 8.0],
  viscosity: 0.0015,
  spongeLength: 0.4,
  spongeRate: 14,
  inflowPerturbation: 0.004,
  minHalfThicknessCells: 0.85,
  vorticitySmoothing: 1.5,
  vorticityScale: 0,
  coreBoost: 0.7,
  swirlEmphasis: 0.8,
  hazeStrength: 1.0,
  sheetStrength: 1.0,
  particleSize: 0.55,
  particleExposure: 0.008,
  particleIntensity: 1.5,
  particleStreakFrame: 0,
  particleLife: [2.0, 6.0],
  particleInertia: 0.004,
  pivWhiteSpeed: [1.05, 1.55],
  edgeFade: [0.3, 0.5, 0.3, 0.3],
  transitionTime: 0.18,
};

const MODE_WEIGHTS: Record<FlowVisual, { vort: number; sheet: number; haze: number; part: number }> = {
  vorticity: { vort: 1, sheet: 0, haze: 1, part: 0 },
  piv: { vort: 0, sheet: 1, haze: 0, part: 1 },
  both: { vort: 0.62, sheet: 0.45, haze: 0.2, part: 0.8 },
};

function u<T>(value: T): THREE.IUniform<T> {
  return { value };
}

export class FlowTank {
  readonly mesh: THREE.Group;
  readonly velocityTexture: THREE.Texture;
  readonly params: FlowTankParams;
  readonly stats: FlowTankStats = { substeps: 0, dtSub: 0, cfl: 0, cpuMs: 0, gpuMs: -1, simTime: 0, passes: 0 };
  readonly domain: { xMin: number; xMax: number; zMin: number; zMax: number };
  readonly resolution: [number, number];

  private readonly renderer: THREE.WebGLRenderer;
  private readonly nx: number;
  private readonly nz: number;
  private readonly dx: number;
  private readonly dz: number;
  private freeStream = 3.0;

  // render targets
  private vel: [RT, RT];
  private obst: RT;
  private coef: RT;
  private pres: [RT, RT];
  private display: RT;
  private part: [RT, RT];
  private probeRT: RT;
  private readonly partSize: number;
  private readonly partCount: number;

  // pass machinery
  private readonly quad: THREE.Mesh;
  private readonly quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private readonly common: Uniforms;
  private readonly mats: Record<string, THREE.RawShaderMaterial> = {};

  // body
  private readonly bodyData = new Float32Array(MAX_SAMPLES * 4 * 4);
  private readonly bodyTex: THREE.DataTexture;
  private bodyCount = 0;
  private bodyFresh = false;
  private bodySpeedMax = 0;

  // display objects
  private readonly planeMat: THREE.ShaderMaterial;
  private readonly partMat: THREE.ShaderMaterial;
  private readonly planeMesh: THREE.Mesh;
  private readonly partMesh: THREE.Mesh;
  private visual: FlowVisual = 'vorticity';
  private readonly weights = { vort: 1, sheet: 0, haze: 1, part: 0 };
  private opacity = 1;
  private lastVisualTime = -1;

  // bookkeeping
  private lastDtSub = 0;
  private seed = 1;
  private frame = 0;
  private readonly vp = new THREE.Vector4();

  // probe readback
  private probeWanted = false;
  private probeBusy = false;
  private probeData: Float32Array | null = null;
  private readonly probeFactor = 2;
  private probeW = 0;
  private probeH = 0;

  // GPU timer
  private readonly gl: WebGL2RenderingContext;
  private readonly timerExt: { TIME_ELAPSED_EXT: number; GPU_DISJOINT_EXT: number } | null;
  private timerQuery: WebGLQuery | null = null;
  private timerPending = false;
  private readonly onContextRestored: () => void;

  constructor(renderer: THREE.WebGLRenderer, opts: FlowTankOptions = {}) {
    this.renderer = renderer;
    this.gl = renderer.getContext() as WebGL2RenderingContext;
    const res = opts.resolution ?? [384, 192];
    this.resolution = [Math.max(16, Math.round(res[0])), Math.max(16, Math.round(res[1]))];
    this.nx = this.resolution[0];
    this.nz = this.resolution[1];
    this.domain = { ...(opts.domain ?? { xMin: -1.6, xMax: 4.4, zMin: -1.5, zMax: 1.5 }) };
    this.dx = (this.domain.xMax - this.domain.xMin) / this.nx;
    this.dz = (this.domain.zMax - this.domain.zMin) / this.nz;
    this.params = { ...DEFAULT_PARAMS, ...(opts.params ?? {}) };

    const count = Math.max(1, Math.floor(opts.particleCount ?? 65536));
    this.partSize = Math.ceil(Math.sqrt(count));
    this.partCount = count;

    // --- render targets -------------------------------------------------------------------
    const nx = this.nx;
    const nz = this.nz;
    this.vel = [this.makeRT(nx + 1, nz + 1, THREE.RGFormat), this.makeRT(nx + 1, nz + 1, THREE.RGFormat)];
    this.obst = this.makeRT(nx, nz, THREE.RGBAFormat);
    this.coef = this.makeRT(nx, nz, THREE.RGBAFormat);
    this.pres = [this.makeRT(nx, nz, THREE.RedFormat), this.makeRT(nx, nz, THREE.RedFormat)];
    this.display = this.makeRT(nx, nz, THREE.RGBAFormat, THREE.HalfFloatType, THREE.LinearFilter);
    this.part = [
      this.makeRT(this.partSize, this.partSize, THREE.RGBAFormat),
      this.makeRT(this.partSize, this.partSize, THREE.RGBAFormat),
    ];
    this.probeW = Math.ceil(nx / this.probeFactor);
    this.probeH = Math.ceil(nz / this.probeFactor);
    this.probeRT = this.makeRT(this.probeW, this.probeH, THREE.RGBAFormat);
    this.velocityTexture = this.display.texture;

    // --- body data texture ----------------------------------------------------------------
    this.bodyTex = new THREE.DataTexture(this.bodyData, MAX_SAMPLES, 4, THREE.RGBAFormat, THREE.FloatType);
    this.bodyTex.minFilter = THREE.NearestFilter;
    this.bodyTex.magFilter = THREE.NearestFilter;
    this.bodyTex.generateMipmaps = false;
    this.bodyTex.needsUpdate = true;

    // --- simulation materials -------------------------------------------------------------
    this.common = {
      uN: u(new THREE.Vector2(nx, nz)),
      uH: u(new THREE.Vector2(this.dx, this.dz)),
      uMin: u(new THREE.Vector2(this.domain.xMin, this.domain.zMin)),
      uU: u(this.freeStream),
    };
    const hmin = Math.min(this.dx, this.dz);
    const tex = (): THREE.IUniform<THREE.Texture | null> => u<THREE.Texture | null>(null);
    this.mats.obstacle = this.makeMat(SIM.OBSTACLE_FRAG, {
      uBody: u(this.bodyTex),
      uCount: u(0),
      uLerp: u(1),
      uMinHalf: u(hmin),
      uBox: u(new THREE.Vector4()),
      uPad: u(0),
    });
    const sponge = u(new THREE.Vector3());
    this.mats.advect = this.makeMat(SIM.ADVECT_FRAG, {
      uVel: tex(),
      uObst: tex(),
      uDt: u(0),
      uSlip: u(0),
      uLimiter: u(1),
      uQuintic: u(1),
      uFinSlip: u(0),
      uThin: u(hmin),
      uSponge: sponge,
      uInflowPert: u(0),
      uTime: u(0),
      uHmin: u(hmin),
    });
    this.mats.prepare = this.makeMat(SIM.PREPARE_FRAG, { uVel: tex(), uObst: tex() });
    this.mats.sor = this.makeMat(SIM.SOR_FRAG, {
      uP: tex(),
      uCoef: tex(),
      uOmega: u(1.8),
      uWarm: u(1),
    });
    this.mats.gradient = this.makeMat(SIM.GRADIENT_FRAG, {
      uVel: tex(),
      uP: tex(),
      uObst: tex(),
      uDt: u(0),
      uConfine: u(0),
      uConfineW: u(new THREE.Vector2()),
      uNu: u(0),
      uSponge: sponge,
      uHmin: u(hmin),
    });
    this.mats.display = this.makeMat(SIM.DISPLAY_FRAG, { uVel: tex(), uObst: tex(), uHmin: u(hmin), uSigma: u(1) });
    this.mats.fillVel = this.makeMat(SIM.FILL_VEL_FRAG, {});
    this.mats.zero = this.makeMat(SIM.FILL_ZERO_FRAG, {});
    this.mats.probe = this.makeMat(SIM.PROBE_FRAG, { uSrc: tex(), uFactor: u(this.probeFactor) });
    this.mats.particles = this.makeMat(SIM.PARTICLE_FRAG, {
      uState: tex(),
      uVel: tex(),
      uObst: tex(),
      uDt: u(0),
      uSteps: u(1),
      uInit: u(0),
      uSeed: u(1),
      uLife: u(new THREE.Vector2()),
      uStateSize: u(new THREE.Vector2(this.partSize, this.partSize)),
      uDomain: u(new THREE.Vector4(this.domain.xMin, this.domain.zMin, this.domain.xMax, this.domain.zMax)),
      uField: u(this.display.texture),
      uInertia: u(0),
    });

    const quadGeo = new THREE.BufferGeometry();
    quadGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
    this.quad = new THREE.Mesh(quadGeo, this.mats.zero);
    this.quad.frustumCulled = false;

    // --- display objects ------------------------------------------------------------------
    const c = opts.colors ?? {};
    const color = (v: THREE.ColorRepresentation | undefined, d: string) => new THREE.Color(v ?? d);
    const fadeUv = this.fadeUv();
    this.planeMat = new THREE.ShaderMaterial({
      vertexShader: PLANE_VERT,
      fragmentShader: PLANE_FRAG,
      uniforms: {
        uField: u(this.display.texture),
        uFieldSize: u(new THREE.Vector2(nx, nz)),
        uColPos: u(color(c.positive, '#3D8BFF')),
        uColNeg: u(color(c.negative, '#EF3E6D')),
        uColSheet: u(color(c.sheet, '#7CFF6B')),
        uColHaze: u(color(c.haze, '#8FB3E0')),
        uOmegaScale: u(10),
        uU: this.common.uU,
        uVort: u(1),
        uSheet: u(0),
        uHaze: u(1),
        uOpacity: u(1),
        uCoreBoost: u(this.params.coreBoost),
        uSwirl: u(this.params.swirlEmphasis),
        uCell: u(new THREE.Vector2(this.dx, this.dz)),
        uFade: u(fadeUv),
      },
      transparent: true,
      depthWrite: false,
      depthTest: true,
      premultipliedAlpha: true,
      blending: THREE.NormalBlending,
      side: THREE.DoubleSide,
    });
    const d = this.domain;
    const planeGeo = new THREE.BufferGeometry();
    planeGeo.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array([d.xMin, 0, d.zMin, d.xMax, 0, d.zMin, d.xMax, 0, d.zMax, d.xMin, 0, d.zMax]), 3),
    );
    planeGeo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0]), 3));
    planeGeo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]), 2));
    planeGeo.setIndex([0, 2, 1, 0, 3, 2]);
    this.planeMesh = new THREE.Mesh(planeGeo, this.planeMat);
    this.planeMesh.name = 'FlowTankField';
    this.planeMesh.renderOrder = 0;
    this.planeMesh.frustumCulled = false;

    this.partMat = new THREE.ShaderMaterial({
      vertexShader: PARTICLE_VERT,
      fragmentShader: PARTICLE_FRAG,
      uniforms: {
        uState: u(this.part[0].texture),
        uStateSize: u(new THREE.Vector2(this.partSize, this.partSize)),
        uField: u(this.display.texture),
        uDomain: u(new THREE.Vector4(d.xMin, d.zMin, d.xMax, d.zMax)),
        uResolution: u(new THREE.Vector2(1, 1)),
        uPixelRatio: u(1),
        uSize: u(this.params.particleSize),
        uExposure: u(this.params.particleExposure),
        uIntensity: u(this.params.particleIntensity),
        uOpacity: u(0),
        uU: this.common.uU,
        uStreakFrame: u(0),
        uLife: u(new THREE.Vector2()),
        uWhite: u(new THREE.Vector2()),
        uColA: u(color(c.piv, '#7CFF6B')),
        uColB: u(color(c.pivFast, '#F4FFF0')),
        uHmin: u(hmin),
        uFade: u(fadeUv.clone()),
      },
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
    });
    const partGeo = new THREE.InstancedBufferGeometry();
    partGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, -1, 0, 0, 1, 0, 1, -1, 0, 1, 1, 0]), 3));
    partGeo.setIndex([0, 2, 1, 2, 3, 1]);
    partGeo.instanceCount = this.partCount;
    this.partMesh = new THREE.Mesh(partGeo, this.partMat);
    this.partMesh.name = 'FlowTankParticles';
    this.partMesh.renderOrder = 1;
    this.partMesh.frustumCulled = false;
    this.partMesh.visible = false;

    this.planeMesh.onBeforeRender = (r) => this.beforeRender(r);
    this.partMesh.onBeforeRender = (r) => this.beforeRender(r);

    this.mesh = new THREE.Group();
    this.mesh.name = 'FlowTank';
    this.mesh.add(this.planeMesh, this.partMesh);

    // --- GPU timer (opt-in: only one TIME_ELAPSED query may be active per context) ----------
    this.timerExt = opts.gpuTimer
      ? (this.gl.getExtension('EXT_disjoint_timer_query_webgl2') as { TIME_ELAPSED_EXT: number; GPU_DISJOINT_EXT: number } | null)
      : null;

    // render targets lose their contents with the context: start over when it comes back
    this.onContextRestored = () => {
      this.timerQuery = null;
      this.timerPending = false;
      this.reset();
    };
    renderer.domElement.addEventListener('webglcontextrestored', this.onContextRestored);

    this.reset();
  }

  // ---------------------------------------------------------------------------------------
  // public API

  /** Free-stream speed U (world units / s, flowing +x). */
  setFreeStream(speed: number): void {
    this.freeStream = Math.max(0, speed);
    this.common.uU.value = this.freeStream;
  }

  get freeStreamSpeed(): number {
    return this.freeStream;
  }

  /**
   * Midline polyline snout -> tail tip in fish-local coordinates (y = 0 plane), with half-thickness and the
   * midline velocity in the fish frame. Call every frame before step(); positions are interpolated between
   * consecutive calls across the internal sub-steps. More than 512 samples are decimated.
   */
  setBody(samples: BodySample[]): void {
    const total = samples.length;
    const n = Math.min(total, MAX_SAMPLES);
    const data = this.bodyData;
    const W = MAX_SAMPLES;
    // valid history (same sample count): current -> previous (rows 2,3 -> rows 0,1)
    if (this.bodyCount === n && n > 0) data.copyWithin(0, 2 * W * 4, 4 * W * 4);
    let speed = 0;
    for (let i = 0; i < n; i++) {
      const s = samples[total > n ? Math.round((i * (total - 1)) / (n - 1)) : i];
      const o = (2 * W + i) * 4;
      data[o] = s.x;
      data[o + 1] = s.z;
      data[o + 2] = Math.max(0, s.halfWidth);
      data[o + 3] = 0;
      const v = (3 * W + i) * 4;
      data[v] = s.vx;
      data[v + 1] = s.vz;
      data[v + 2] = 0;
      data[v + 3] = 0;
      speed = Math.max(speed, Math.hypot(s.vx, s.vz));
    }
    // no valid history: previous = current
    if (this.bodyCount !== n) data.copyWithin(0, 2 * W * 4, 4 * W * 4);
    this.bodyCount = n;
    this.bodySpeedMax = speed;
    this.bodyFresh = true;
    this.bodyTex.needsUpdate = true;
    this.updateBodyBox();
  }

  /** Removes the body (open channel). */
  clearBody(): void {
    this.bodyCount = 0;
    this.bodySpeedMax = 0;
    this.bodyFresh = false;
  }

  /** Advances the flow by dt seconds (clamped to 1/30 s), sub-stepping so the advective CFL stays <= maxCFL. */
  step(dt: number): void {
    if (!(dt > 0)) return;
    const t0 = performance.now();
    dt = Math.min(dt, 1 / 30);
    const p = this.params;
    const hmin = Math.min(this.dx, this.dz);
    const vmax = Math.max(this.freeStream, this.bodySpeedMax, 0.05);
    const n = Math.min(Math.max(1, Math.ceil((dt * vmax) / (p.maxCFL * hmin))), Math.max(1, Math.floor(p.maxSubsteps)));
    const h = dt / n;

    if (!this.bodyFresh) {
      // body not updated since last step: hold it still (prev = cur)
      this.bodyData.copyWithin(0, 2 * MAX_SAMPLES * 4, 4 * MAX_SAMPLES * 4);
      this.bodyTex.needsUpdate = true;
    }

    this.syncParams();
    const timing = this.beginTimer();
    let passes = 0;
    this.withSimState(() => {
      const iters = Math.max(Math.round(p.pressureIterations), Math.ceil(p.minPressureIterationsPerFrame / n), 1);
      for (let k = 1; k <= n; k++) {
        passes += this.substep(h, k / n, iters);
      }
      this.particlePass(dt, n);
      this.pass(this.mats.display, this.display, { uVel: this.vel[0].texture, uObst: this.obst.texture });
      passes += 2;
      if (this.probeWanted && !this.probeBusy && this.frame % 4 === 0) {
        this.pass(this.mats.probe, this.probeRT, { uSrc: this.display.texture });
        passes++;
        this.readProbe();
      }
    });
    this.endTimer(timing);

    // after the step the body history is consumed: prev = cur
    this.bodyFresh = false;
    this.frame++;
    this.stats.substeps = n;
    this.stats.dtSub = h;
    this.stats.cfl = (h * vmax) / hmin;
    this.stats.simTime += dt;
    this.stats.passes = passes;
    this.stats.cpuMs = performance.now() - t0;
  }

  /** Switches the visual mode; cross-fades over params.transitionTime unless immediate. */
  setVisual(v: FlowVisual, immediate = false): void {
    this.visual = v;
    if (immediate) {
      Object.assign(this.weights, MODE_WEIGHTS[v]);
      this.syncDisplayUniforms();
    }
  }

  /** Updates display colours at runtime (any subset). */
  setColors(c: FlowTankColors): void {
    const set = (k: string, v: THREE.ColorRepresentation | undefined, m: THREE.ShaderMaterial) => {
      if (v !== undefined) (m.uniforms[k].value as THREE.Color).set(v);
    };
    set('uColPos', c.positive, this.planeMat);
    set('uColNeg', c.negative, this.planeMat);
    set('uColSheet', c.sheet, this.planeMat);
    set('uColHaze', c.haze, this.planeMat);
    set('uColA', c.piv, this.partMat);
    set('uColB', c.pivFast, this.partMat);
  }

  getVisual(): FlowVisual {
    return this.visual;
  }

  /** Global 0..1 fade of the whole flow layer (mode transitions). */
  setOpacity(a: number): void {
    this.opacity = Math.min(1, Math.max(0, a));
    this.syncDisplayUniforms();
  }

  /** Restarts the flow from a uniform stream at the current free-stream speed and re-seeds the tracers. */
  reset(): void {
    this.withSimState(() => {
      for (const t of this.vel) this.pass(this.mats.fillVel, t, {});
      for (const t of this.pres) this.pass(this.mats.zero, t, {});
      this.pass(this.mats.zero, this.coef, {});
      // obstacle: rasterise current body (or nothing)
      this.pass(this.mats.obstacle, this.obst, {});
      this.pass(this.mats.display, this.display, { uVel: this.vel[0].texture, uObst: this.obst.texture });
      this.mats.particles.uniforms.uInit.value = 1;
      this.particlePass(0, 1);
      this.mats.particles.uniforms.uInit.value = 0;
    });
    this.lastDtSub = 0;
    this.stats.simTime = 0;
    this.probeData = null;
  }

  /**
   * Approximate CPU-side sample of the flow (bilinear on a half-resolution field that is read back
   * asynchronously every few frames once probing has been requested). Returns null until data exists
   * or when (x, z) is outside the domain. vorticity = omega_y (1/s, > 0 = counter-clockwise from +y).
   */
  getProbe(x: number, z: number): { vx: number; vz: number; vorticity: number } | null {
    this.probeWanted = true;
    const data = this.probeData;
    const d = this.domain;
    if (!data || x < d.xMin || x > d.xMax || z < d.zMin || z > d.zMax) return null;
    const W = this.probeW;
    const H = this.probeH;
    const gx = ((x - d.xMin) / (d.xMax - d.xMin)) * W - 0.5;
    const gz = ((z - d.zMin) / (d.zMax - d.zMin)) * H - 0.5;
    const x0 = Math.min(Math.max(Math.floor(gx), 0), W - 1);
    const z0 = Math.min(Math.max(Math.floor(gz), 0), H - 1);
    const x1 = Math.min(x0 + 1, W - 1);
    const z1 = Math.min(z0 + 1, H - 1);
    const fx = Math.min(Math.max(gx - x0, 0), 1);
    const fz = Math.min(Math.max(gz - z0, 0), 1);
    const at = (i: number, j: number, c: number) => data[(j * W + i) * 4 + c];
    const lerp = (c: number) =>
      (at(x0, z0, c) * (1 - fx) + at(x1, z0, c) * fx) * (1 - fz) + (at(x0, z1, c) * (1 - fx) + at(x1, z1, c) * fx) * fz;
    return { vx: lerp(0), vz: lerp(1), vorticity: lerp(2) };
  }

  /** Debug helper: reads back the divergence of the current velocity field (1/s). Slow (sync). */
  measureDivergence(): { maxAbs: number; rms: number; fluidCells: number; maxAt: [number, number] } {
    const buf = new Float32Array(this.nx * this.nz * 4);
    this.withSimState(() => {
      this.pass(this.mats.prepare, this.coef, { uVel: this.vel[0].texture, uObst: this.obst.texture });
    });
    this.renderer.readRenderTargetPixels(this.coef, 0, 0, this.nx, this.nz, buf);
    let maxAbs = 0;
    let sum = 0;
    let n = 0;
    const maxAt: [number, number] = [0, 0];
    for (let j = 0; j < this.nz; j++) {
      for (let i = 1; i < this.nx - 1; i++) {
        const o = (j * this.nx + i) * 4;
        if (buf[o + 3] > 0.5) continue;
        const v = buf[o];
        if (Math.abs(v) > maxAbs) {
          maxAbs = Math.abs(v);
          maxAt[0] = this.domain.xMin + (i + 0.5) * this.dx;
          maxAt[1] = this.domain.zMin + (j + 0.5) * this.dz;
        }
        sum += v * v;
        n++;
      }
    }
    return { maxAbs, rms: Math.sqrt(sum / Math.max(1, n)), fluidCells: n, maxAt };
  }

  /**
   * Debug helper: synchronous full-resolution read-back of the display field
   * (per cell: vx, vz, omega_y, signed distance). Slow; for tests and tuning only.
   */
  debugReadField(): Float32Array {
    const rt = this.makeRT(this.nx, this.nz, THREE.RGBAFormat);
    const buf = new Float32Array(this.nx * this.nz * 4);
    this.withSimState(() => {
      const m = this.mats.probe;
      const f = m.uniforms.uFactor.value;
      m.uniforms.uFactor.value = 1;
      this.pass(m, rt, { uSrc: this.display.texture });
      m.uniforms.uFactor.value = f;
    });
    this.renderer.readRenderTargetPixels(rt, 0, 0, this.nx, this.nz, buf);
    rt.dispose();
    return buf;
  }

  /** Frees all GPU resources and detaches the mesh. */
  dispose(): void {
    const rts: RT[] = [...this.vel, this.obst, this.coef, ...this.pres, this.display, ...this.part, this.probeRT];
    for (const t of rts) t.dispose();
    for (const m of Object.values(this.mats)) m.dispose();
    this.quad.geometry.dispose();
    this.planeMesh.geometry.dispose();
    this.partMesh.geometry.dispose();
    this.planeMat.dispose();
    this.partMat.dispose();
    this.bodyTex.dispose();
    if (this.timerQuery) this.gl.deleteQuery(this.timerQuery);
    this.renderer.domElement.removeEventListener('webglcontextrestored', this.onContextRestored);
    this.mesh.removeFromParent();
  }

  // ---------------------------------------------------------------------------------------
  // simulation internals

  private substep(h: number, lerp: number, iters: number): number {
    const m = this.mats;
    const p = this.params;
    const warm = this.lastDtSub > 0 ? h / this.lastDtSub : 1;
    this.lastDtSub = h;

    // 1. immersed body -> signed distance + body velocity
    m.obstacle.uniforms.uLerp.value = lerp;
    m.obstacle.uniforms.uCount.value = this.bodyCount >= 2 ? this.bodyCount : 0;
    this.pass(m.obstacle, this.obst, {});
    // 2. advection + forces + boundary conditions + body velocity on solid faces
    m.advect.uniforms.uDt.value = h;
    m.advect.uniforms.uTime.value = this.stats.simTime;
    this.pass(m.advect, this.vel[1], { uVel: this.vel[0].texture, uObst: this.obst.texture });
    this.swapVel();
    // 3. divergence + Poisson coefficients
    this.pass(m.prepare, this.coef, { uVel: this.vel[0].texture, uObst: this.obst.texture });
    // 4. fused red-black SOR (warm started)
    m.sor.uniforms.uOmega.value = p.sorOmega;
    for (let i = 0; i < iters; i++) {
      m.sor.uniforms.uWarm.value = i === 0 ? warm : 1;
      this.pass(m.sor, this.pres[1], { uP: this.pres[0].texture, uCoef: this.coef.texture });
      this.swapPres();
    }
    // 5. projection + explicit forces (viscosity, vorticity confinement)
    m.gradient.uniforms.uDt.value = h;
    this.pass(m.gradient, this.vel[1], { uVel: this.vel[0].texture, uP: this.pres[0].texture, uObst: this.obst.texture });
    this.swapVel();
    return 4 + iters;
  }

  private particlePass(dt: number, steps: number): void {
    const m = this.mats.particles;
    m.uniforms.uDt.value = dt;
    m.uniforms.uSteps.value = Math.min(16, Math.max(1, steps));
    m.uniforms.uSeed.value = (this.seed = (this.seed * 1664525 + 1013904223) >>> 0);
    this.pass(m, this.part[1], { uState: this.part[0].texture, uVel: this.vel[0].texture, uObst: this.obst.texture });
    const t = this.part[0];
    this.part[0] = this.part[1];
    this.part[1] = t;
    this.partMat.uniforms.uState.value = this.part[0].texture;
  }

  private swapVel(): void {
    const t = this.vel[0];
    this.vel[0] = this.vel[1];
    this.vel[1] = t;
  }

  private swapPres(): void {
    const t = this.pres[0];
    this.pres[0] = this.pres[1];
    this.pres[1] = t;
  }

  private syncParams(): void {
    const p = this.params;
    const c = this.mats.advect.uniforms;
    c.uSlip.value = p.bodySlip;
    c.uFinSlip.value = p.finSlip;
    c.uThin.value = p.minHalfThicknessCells * Math.max(this.dx, this.dz);
    c.uLimiter.value = p.advectionLimiter;
    c.uQuintic.value = p.advectionOrder >= 5 ? 1 : 0;
    const xEnd = this.domain.xMax;
    (c.uSponge.value as THREE.Vector3).set(xEnd - p.spongeLength, xEnd, p.spongeRate);
    c.uInflowPert.value = p.inflowPerturbation;
    const g = this.mats.gradient.uniforms;
    g.uConfine.value = p.confinement;
    (g.uConfineW.value as THREE.Vector2).set(p.confinementRamp[0], p.confinementRamp[1]);
    g.uNu.value = p.viscosity;
    this.mats.obstacle.uniforms.uMinHalf.value = p.minHalfThicknessCells * Math.max(this.dx, this.dz);
    (this.mats.particles.uniforms.uLife.value as THREE.Vector2).set(p.particleLife[0], p.particleLife[1]);
    this.mats.particles.uniforms.uInertia.value = p.particleInertia;
    this.mats.display.uniforms.uSigma.value = p.vorticitySmoothing;
    this.updateBodyBox();
  }

  private updateBodyBox(): void {
    const n = this.bodyCount;
    const W = MAX_SAMPLES;
    const data = this.bodyData;
    const minHalf = this.params.minHalfThicknessCells * Math.max(this.dx, this.dz);
    let x0 = Infinity;
    let z0 = Infinity;
    let x1 = -Infinity;
    let z1 = -Infinity;
    for (const row of [0, 2]) {
      for (let i = 0; i < n; i++) {
        const o = (row * W + i) * 4;
        const r = Math.max(data[o + 2], minHalf);
        x0 = Math.min(x0, data[o] - r);
        x1 = Math.max(x1, data[o] + r);
        z0 = Math.min(z0, data[o + 1] - r);
        z1 = Math.max(z1, data[o + 1] + r);
      }
    }
    const pad = 6 * Math.max(this.dx, this.dz);
    const u = this.mats.obstacle.uniforms;
    if (n >= 2) {
      (u.uBox.value as THREE.Vector4).set(x0 - pad, z0 - pad, x1 + pad, z1 + pad);
    } else {
      (u.uBox.value as THREE.Vector4).set(1e9, 1e9, -1e9, -1e9);
    }
    u.uPad.value = pad;
  }

  private makeRT(
    w: number,
    h: number,
    format: THREE.PixelFormat,
    type: THREE.TextureDataType = THREE.FloatType,
    filter: THREE.MagnificationTextureFilter = THREE.NearestFilter,
  ): RT {
    const rt = new THREE.WebGLRenderTarget(w, h, {
      type,
      format,
      minFilter: filter,
      magFilter: filter,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      depthBuffer: false,
      stencilBuffer: false,
      generateMipmaps: false,
    });
    rt.texture.name = 'FlowTankRT';
    return rt;
  }

  private makeMat(frag: string, uniforms: Uniforms): THREE.RawShaderMaterial {
    return new THREE.RawShaderMaterial({
      vertexShader: SIM.SIM_VERT,
      fragmentShader: frag,
      glslVersion: THREE.GLSL3,
      uniforms: { ...this.common, ...uniforms },
      depthTest: false,
      depthWrite: false,
      blending: THREE.NoBlending,
    });
  }

  private pass(mat: THREE.RawShaderMaterial, target: RT, textures: Record<string, THREE.Texture>): void {
    for (const k in textures) mat.uniforms[k].value = textures[k];
    this.quad.material = mat;
    this.renderer.setRenderTarget(target);
    this.renderer.render(this.quad, this.quadCam);
  }

  private withSimState(fn: () => void): void {
    const r = this.renderer;
    const prevTarget = r.getRenderTarget();
    const prevFace = r.getActiveCubeFace();
    const prevMip = r.getActiveMipmapLevel();
    const prevAutoClear = r.autoClear;
    const prevXr = r.xr.enabled;
    r.autoClear = false;
    r.xr.enabled = false;
    try {
      fn();
    } finally {
      r.setRenderTarget(prevTarget, prevFace, prevMip);
      r.autoClear = prevAutoClear;
      r.xr.enabled = prevXr;
    }
  }

  private fadeUv(): THREE.Vector4 {
    const d = this.domain;
    const W = d.xMax - d.xMin;
    const H = d.zMax - d.zMin;
    const f = this.params.edgeFade;
    return new THREE.Vector4(f[0] / W, f[1] / W, f[2] / H, f[3] / H);
  }

  // ---------------------------------------------------------------------------------------
  // display

  private beforeRender(r: THREE.WebGLRenderer): void {
    // visual cross-fade (real time so it also works while paused)
    const now = performance.now() / 1000;
    if (this.lastVisualTime !== now) {
      const dt = this.lastVisualTime < 0 ? 1 : Math.min(now - this.lastVisualTime, 0.25);
      this.lastVisualTime = now;
      const target = MODE_WEIGHTS[this.visual];
      const k = 1 - Math.exp(-dt / Math.max(this.params.transitionTime, 1e-3));
      const w = this.weights;
      w.vort += (target.vort - w.vort) * k;
      w.sheet += (target.sheet - w.sheet) * k;
      w.haze += (target.haze - w.haze) * k;
      w.part += (target.part - w.part) * k;
      this.syncDisplayUniforms();
    }
    r.getCurrentViewport(this.vp);
    (this.partMat.uniforms.uResolution.value as THREE.Vector2).set(this.vp.z, this.vp.w);
    this.partMat.uniforms.uPixelRatio.value = r.getPixelRatio();
  }

  private syncDisplayUniforms(): void {
    const p = this.params;
    const w = this.weights;
    const pu = this.planeMat.uniforms;
    const lref = (this.domain.xMax - this.domain.xMin) / 3;
    pu.uOmegaScale.value = p.vorticityScale > 0 ? p.vorticityScale : Math.max(1, (12 * Math.max(this.freeStream, 0.5)) / lref);
    pu.uSwirl.value = p.swirlEmphasis;
    pu.uVort.value = w.vort;
    pu.uSheet.value = w.sheet * p.sheetStrength;
    pu.uHaze.value = w.haze * p.hazeStrength;
    pu.uOpacity.value = this.opacity;
    pu.uCoreBoost.value = p.coreBoost;
    const fade = this.fadeUv();
    (pu.uFade.value as THREE.Vector4).copy(fade);
    const q = this.partMat.uniforms;
    q.uOpacity.value = this.opacity * w.part;
    q.uSize.value = p.particleSize;
    q.uExposure.value = p.particleExposure;
    q.uIntensity.value = p.particleIntensity;
    q.uStreakFrame.value = p.particleStreakFrame;
    (q.uLife.value as THREE.Vector2).set(p.particleLife[0], p.particleLife[1]);
    (q.uWhite.value as THREE.Vector2).set(p.pivWhiteSpeed[0], p.pivWhiteSpeed[1]);
    (q.uFade.value as THREE.Vector4).copy(fade);
    this.partMesh.visible = w.part * this.opacity > 0.004;
    this.planeMesh.visible = this.opacity > 0.002 || this.partMesh.visible;
  }

  // ---------------------------------------------------------------------------------------
  // probe readback + GPU timing

  private readProbe(): void {
    this.probeBusy = true;
    const buf = new Float32Array(this.probeW * this.probeH * 4);
    this.renderer
      .readRenderTargetPixelsAsync(this.probeRT, 0, 0, this.probeW, this.probeH, buf)
      .then(() => {
        this.probeData = buf;
      })
      .catch(() => {
        /* context lost or unsupported: keep last data */
      })
      .finally(() => {
        this.probeBusy = false;
      });
  }

  private beginTimer(): boolean {
    const ext = this.timerExt;
    if (!ext) return false;
    const gl = this.gl;
    if (this.timerPending && this.timerQuery) {
      const available = gl.getQueryParameter(this.timerQuery, gl.QUERY_RESULT_AVAILABLE) as boolean;
      const disjoint = gl.getParameter(ext.GPU_DISJOINT_EXT) as boolean;
      if (available) {
        if (!disjoint) this.stats.gpuMs = (gl.getQueryParameter(this.timerQuery, gl.QUERY_RESULT) as number) / 1e6;
        this.timerPending = false;
      } else {
        return false;
      }
    }
    if (!this.timerQuery) this.timerQuery = gl.createQuery();
    if (!this.timerQuery) return false;
    gl.beginQuery(ext.TIME_ELAPSED_EXT, this.timerQuery);
    return true;
  }

  private endTimer(started: boolean): void {
    if (!started || !this.timerExt) return;
    this.gl.endQuery(this.timerExt.TIME_ELAPSED_EXT);
    this.timerPending = true;
  }
}
