// Standalone demo for FlowTank: synthetic carangiform swimmer held in a flow tank.
// URL params: mode=vorticity|piv|both  swim=0|1  cam=top|persp  fish=3d  U=3  f=2  lambda=0.95
//             fixed=1 (dt = 1/60 per frame)  res=384x192  particles=65536  hud=0  dpr=1
//             zoom=1 cx= cz= (top view framing)  fin=arc|short  p.<param>=value (FlowTank.params overrides)
// Keys: 1/2/3 or V visual mode, Space pause, S swim on/off, R reset, C camera, Up/Down U, Left/Right f,
//       F fade test, H hud.

import * as THREE from 'three';
import { FlowTank, type BodySample, type FlowVisual } from './FlowTank';

const qs = new URLSearchParams(location.search);
const num = (k: string, d: number) => {
  const v = parseFloat(qs.get(k) ?? '');
  return Number.isFinite(v) ? v : d;
};

// ---- kinematics (carangiform) ------------------------------------------------------------
const L = 2.0;
const LAMBDA = num('lambda', 0.95);
let freq = num('f', 2.0);
let U = num('U', 3.0);
const S_TIP = 1.24;
const N_SAMPLES = 128;
let swimming = qs.get('swim') !== '0';
// fin=arc (default): x = L (s - 0.5), tip at 0.74 L;  fin=short: fin chord compressed so the tip sits at 0.62 L
const FIN_X_SCALE = qs.get('fin') === 'short' ? 0.5 : 1.0;
const xOf = (s: number) => (s <= 1 ? L * (s - 0.5) : L * 0.5 + L * (s - 1) * FIN_X_SCALE);

const amp = (s: number) => 0.02 - 0.08 * s + 0.16 * s * s;
const halfWidth = (s: number) => (s <= 1 ? L * 0.055 * Math.pow(Math.sin(Math.PI * Math.min(Math.max(s, 0), 1)), 0.6) : 0);

function midline(t: number, out: BodySample[]): BodySample[] {
  const w = 2 * Math.PI * freq;
  for (let i = 0; i < N_SAMPLES; i++) {
    const s = (S_TIP * i) / (N_SAMPLES - 1);
    const ph = 2 * Math.PI * (s / LAMBDA - freq * t);
    const a = swimming ? L * amp(s) : 0;
    const o = out[i] ?? (out[i] = { x: 0, z: 0, halfWidth: 0, vx: 0, vz: 0 });
    o.x = xOf(s);
    o.z = a * Math.sin(ph);
    o.halfWidth = halfWidth(s);
    o.vx = 0;
    o.vz = -a * w * Math.cos(ph);
  }
  return out;
}

const strouhal = () => (freq * 2 * amp(S_TIP) * L) / U;

// ---- renderer / scene ----------------------------------------------------------------------
const app = document.getElementById('app')!;
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(num('dpr', window.devicePixelRatio || 1), 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x05090f, 1);
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05090f);

const resParam = (qs.get('res') ?? '').split('x').map((v) => parseInt(v, 10));
const tank = new FlowTank(renderer, {
  resolution: resParam.length === 2 && resParam.every((v) => v > 8) ? [resParam[0], resParam[1]] : undefined,
  particleCount: qs.has('particles') ? Math.max(1, Math.round(num('particles', 65536))) : undefined,
  gpuTimer: true,
});
tank.setFreeStream(U);
// tuning overrides: ?p.confinement=0.3&p.edgeFade=0.3,0.5,0.3,0.3
qs.forEach((value, key) => {
  if (!key.startsWith('p.')) return;
  const name = key.slice(2) as keyof typeof tank.params;
  if (!(name in tank.params)) return;
  const parsed = value.split(',').map(Number);
  if (parsed.some((v) => !Number.isFinite(v))) return;
  (tank.params as unknown as Record<string, number | number[]>)[name] = parsed.length > 1 ? parsed : parsed[0];
});
let mode: FlowVisual = (['vorticity', 'piv', 'both'] as const).find((m) => m === qs.get('mode')) ?? 'both';
tank.setVisual(mode);

// fish root (host apps add tank.mesh as a child of the fish root)
const fishRoot = new THREE.Group();
scene.add(fishRoot);
fishRoot.add(tank.mesh);

// fish silhouette (top view): filled body + rim + caudal-fin plate
const bodyGeo = new THREE.BufferGeometry();
const bodyPos = new Float32Array(N_SAMPLES * 2 * 3);
bodyGeo.setAttribute('position', new THREE.BufferAttribute(bodyPos, 3));
{
  const idx: number[] = [];
  for (let i = 0; i < N_SAMPLES - 1; i++) {
    const a = 2 * i;
    idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
  }
  bodyGeo.setIndex(idx);
}
const bodyMesh = new THREE.Mesh(
  bodyGeo,
  new THREE.MeshBasicMaterial({ color: 0x16222f, side: THREE.DoubleSide }),
);
bodyMesh.frustumCulled = false;
bodyMesh.position.y = 0.02;
fishRoot.add(bodyMesh);
const rimPos = new Float32Array((N_SAMPLES * 2 + 1) * 3);
const rimGeo = new THREE.BufferGeometry();
rimGeo.setAttribute('position', new THREE.BufferAttribute(rimPos, 3));
const rim = new THREE.Line(rimGeo, new THREE.LineBasicMaterial({ color: 0x8aa3bf, transparent: true, opacity: 0.85 }));
rim.frustumCulled = false;
rim.position.y = 0.03;
fishRoot.add(rim);
// eye dot for orientation
const eye = new THREE.Mesh(new THREE.CircleGeometry(0.018, 16), new THREE.MeshBasicMaterial({ color: 0x8aa3bf }));
eye.rotation.x = -Math.PI / 2;
eye.position.y = 0.04;
fishRoot.add(eye);

// lit 3D fish (perspective view / ?fish=3d): elliptic tube along the midline + caudal-fin plate,
// used to check that the flow layer composites well over a shaded body crossing the y = 0 plane
const RING = 18;
const tubePos = new Float32Array(N_SAMPLES * RING * 3);
const tubeGeo = new THREE.BufferGeometry();
tubeGeo.setAttribute('position', new THREE.BufferAttribute(tubePos, 3));
{
  const idx: number[] = [];
  for (let i = 0; i < N_SAMPLES - 1; i++) {
    for (let k = 0; k < RING; k++) {
      const a = i * RING + k;
      const b = i * RING + ((k + 1) % RING);
      idx.push(a, a + RING, b, b, a + RING, b + RING);
    }
  }
  tubeGeo.setIndex(idx);
}
const fish3d = new THREE.Mesh(
  tubeGeo,
  new THREE.MeshStandardMaterial({ color: 0x8ea6bd, roughness: 0.42, metalness: 0.18, side: THREE.DoubleSide }),
);
fish3d.frustumCulled = false;
fishRoot.add(fish3d);
scene.add(new THREE.HemisphereLight(0xbcd7ff, 0x0a121c, 1.1));
const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.position.set(-2, 6, 3);
scene.add(sun);
const fishHalfHeight = (s: number) =>
  s <= 1 ? Math.max(1.55 * halfWidth(s), 0.035 * Math.min(1, s / 0.05)) : 0.035 + ((s - 1) / (S_TIP - 1)) * 0.23;
const force3d = qs.get('fish') === '3d';

const samples: BodySample[] = [];
function updateFish(t: number) {
  midline(t, samples);
  if (fish3d.visible) {
    for (let i = 0; i < N_SAMPLES; i++) {
      const a = samples[Math.max(i - 1, 0)];
      const b = samples[Math.min(i + 1, N_SAMPLES - 1)];
      const tl = Math.hypot(b.x - a.x, b.z - a.z) || 1;
      const nx = -(b.z - a.z) / tl;
      const nz = (b.x - a.x) / tl;
      const sm = (S_TIP * i) / (N_SAMPLES - 1);
      const hw = Math.max(samples[i].halfWidth, 0.006);
      const hh = fishHalfHeight(sm);
      for (let k = 0; k < RING; k++) {
        const th = (k / RING) * Math.PI * 2;
        const c = Math.cos(th) * hw;
        const o = (i * RING + k) * 3;
        tubePos[o] = samples[i].x + nx * c;
        tubePos[o + 1] = Math.sin(th) * hh;
        tubePos[o + 2] = samples[i].z + nz * c;
      }
    }
    tubeGeo.attributes.position.needsUpdate = true;
    tubeGeo.computeVertexNormals();
  }
  for (let i = 0; i < N_SAMPLES; i++) {
    const a = samples[Math.max(i - 1, 0)];
    const b = samples[Math.min(i + 1, N_SAMPLES - 1)];
    let tx = b.x - a.x;
    let tz = b.z - a.z;
    const tl = Math.hypot(tx, tz) || 1;
    tx /= tl;
    tz /= tl;
    const nx = -tz;
    const nz = tx;
    const s = samples[i];
    const hw = Math.max(s.halfWidth, 0.007);
    bodyPos.set([s.x + nx * hw, 0, s.z + nz * hw], (2 * i) * 3);
    bodyPos.set([s.x - nx * hw, 0, s.z - nz * hw], (2 * i + 1) * 3);
    rimPos.set([s.x + nx * hw, 0, s.z + nz * hw], i * 3);
    rimPos.set([s.x - nx * hw, 0, s.z - nz * hw], (2 * N_SAMPLES - 1 - i) * 3);
  }
  rimPos.set(rimPos.subarray(0, 3), N_SAMPLES * 2 * 3);
  bodyGeo.attributes.position.needsUpdate = true;
  rimGeo.attributes.position.needsUpdate = true;
  const e = samples[Math.round(0.09 * (N_SAMPLES - 1) / S_TIP)];
  eye.position.set(e.x, 0.04, e.z);
}

// ---- cameras --------------------------------------------------------------------------------
const d = tank.domain;
const zoom = Math.max(0.25, num('zoom', 1));
const cx = num('cx', (d.xMin + d.xMax) / 2);
const cz = num('cz', (d.zMin + d.zMax) / 2);
const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 50);
ortho.position.set(cx, 10, cz);
ortho.up.set(0, 0, -1);
ortho.lookAt(cx, 0, cz);
const persp = new THREE.PerspectiveCamera(34, 1, 0.05, 100);
persp.position.set(cx - 0.6, 5.4, cz + 5.2);
persp.lookAt(cx - 0.1, 0, cz);
let camera: THREE.Camera = qs.get('cam') === 'persp' ? persp : ortho;
function syncFishStyle() {
  const solid = force3d || camera === persp;
  fish3d.visible = solid;
  bodyMesh.visible = rim.visible = eye.visible = !solid;
}
syncFishStyle();

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h);
  const aspect = w / h;
  const spanX = d.xMax - d.xMin + 0.3;
  const spanZ = d.zMax - d.zMin + 0.3;
  let hw = spanX / 2;
  let hh = hw / aspect;
  if (hh < spanZ / 2) {
    hh = spanZ / 2;
    hw = hh * aspect;
  }
  hw /= zoom;
  hh /= zoom;
  ortho.left = -hw;
  ortho.right = hw;
  ortho.top = hh;
  ortho.bottom = -hh;
  ortho.updateProjectionMatrix();
  persp.aspect = aspect;
  persp.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

// ---- HUD --------------------------------------------------------------------------------------
const hud = document.getElementById('hud')!;
const legend = document.getElementById('legend')!;
const keys = document.getElementById('keys')!;
if (qs.get('hud') === '0') document.body.classList.add('nohud');
legend.innerHTML =
  `<span class="sw" style="background:var(--pos)"></span>ω > 0  counter-clockwise (seen from above)\n` +
  `<span class="sw" style="background:var(--neg)"></span>ω < 0  clockwise\n` +
  `<span class="sw" style="background:var(--piv)"></span>PIV tracers, laser sheet y = 0`;
keys.textContent =
  '1 vorticity  2 PIV  3 both  V cycle\nSpace pause  S swim  R reset  C camera\n↑↓ U   ←→ f   F fade   H hud';

const mouse = new THREE.Vector2(9, 9);
const ray = new THREE.Raycaster();
const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const hit = new THREE.Vector3();
window.addEventListener('pointermove', (e) => {
  mouse.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
});

let paused = false;
let fading = false;
let fade = 1;
window.addEventListener('keydown', (e) => {
  const modes: FlowVisual[] = ['vorticity', 'piv', 'both'];
  switch (e.key) {
    case '1':
    case '2':
    case '3':
      mode = modes[parseInt(e.key, 10) - 1];
      tank.setVisual(mode);
      break;
    case 'v':
    case 'V':
      mode = modes[(modes.indexOf(mode) + 1) % 3];
      tank.setVisual(mode);
      break;
    case ' ':
      paused = !paused;
      break;
    case 's':
    case 'S':
      swimming = !swimming;
      break;
    case 'r':
    case 'R':
      tank.reset();
      break;
    case 'c':
    case 'C':
      camera = camera === ortho ? persp : ortho;
      syncFishStyle();
      updateFish(simT);
      break;
    case 'f':
    case 'F':
      fading = !fading;
      break;
    case 'h':
    case 'H':
      document.body.classList.toggle('nohud');
      break;
    case 'ArrowUp':
      U = Math.min(6, U + 0.25);
      tank.setFreeStream(U);
      break;
    case 'ArrowDown':
      U = Math.max(0.25, U - 0.25);
      tank.setFreeStream(U);
      break;
    case 'ArrowRight':
      freq = Math.min(5, +(freq + 0.1).toFixed(2));
      break;
    case 'ArrowLeft':
      freq = Math.max(0.2, +(freq - 0.1).toFixed(2));
      break;
    default:
      return;
  }
  e.preventDefault();
});

// ---- loop -------------------------------------------------------------------------------------
const fixed = qs.get('fixed') === '1';
let simT = 0;
let last = performance.now();
let fpsFrames = 0;
let fpsT0 = last;
let fps = 0;
let cpuAcc = 0;
let cpuN = 0;
let cpuAvg = 0;
let hudT = 0;

const state = {
  get simTime() {
    return simT;
  },
  get fps() {
    return fps;
  },
  get stats() {
    return { ...tank.stats, cpuAvg };
  },
  tank,
  frames: 0,
  /** scripted capture: pause / resume the live loop */
  setPaused(v: boolean) {
    paused = v;
  },
  /** scripted tests: advance the simulation synchronously by one step of `dt` seconds */
  advanceDt(dt: number) {
    dt = Math.min(dt, 1 / 30); // same clamp as the live loop (FlowTank's contract: dt <= 1/30 s)
    simT += dt;
    updateFish(simT);
    tank.setBody(samples);
    tank.step(dt);
  },
  /** scripted capture: advance the simulation synchronously by `seconds` in 1/60 s steps */
  advance(seconds: number) {
    const n = Math.max(0, Math.round(seconds * 60));
    for (let i = 0; i < n; i++) {
      simT += 1 / 60;
      updateFish(simT);
      tank.setBody(samples);
      tank.step(1 / 60);
    }
    renderer.setRenderTarget(null);
    renderer.render(scene, camera);
  },
};
(window as unknown as { __flowtank: typeof state }).__flowtank = state;

function frame(now: number) {
  requestAnimationFrame(frame);
  const realDt = Math.min((now - last) / 1000, 0.1);
  last = now;
  const dt = fixed ? 1 / 60 : Math.min(realDt, 1 / 30);

  if (!paused) {
    simT += dt;
    updateFish(simT);
    tank.setBody(samples);
    tank.step(dt);
    cpuAcc += tank.stats.cpuMs;
    cpuN++;
  }
  fade += ((fading ? 0 : 1) - fade) * Math.min(1, realDt * 4);
  tank.setOpacity(fade);

  renderer.setRenderTarget(null);
  renderer.render(scene, camera);
  state.frames++;

  fpsFrames++;
  if (now - fpsT0 > 500) {
    fps = (fpsFrames * 1000) / (now - fpsT0);
    fpsFrames = 0;
    fpsT0 = now;
    cpuAvg = cpuN ? cpuAcc / cpuN : 0;
    cpuAcc = 0;
    cpuN = 0;
  }
  if (now - hudT > 250) {
    hudT = now;
    const st = tank.stats;
    let probe = '';
    ray.setFromCamera(mouse, camera);
    if (ray.ray.intersectPlane(plane, hit)) {
      const p = tank.getProbe(hit.x, hit.z);
      if (p) {
        probe = `\n<span class="k">probe</span>  (${hit.x.toFixed(2)}, ${hit.z.toFixed(2)})  v = (${p.vx.toFixed(2)}, ${p.vz.toFixed(2)})  ω = ${p.vorticity.toFixed(1)}`;
      }
    }
    hud.innerHTML =
      `<div class="title">DIGITAL FLOW TANK  ·  ${mode.toUpperCase()}${paused ? '  ·  PAUSED' : ''}</div>` +
      `<span class="k">fps</span>      ${fps.toFixed(0).padStart(4)}\n` +
      `<span class="k">sim cpu</span>  ${cpuAvg.toFixed(2)} ms   <span class="k">gpu</span> ${st.gpuMs >= 0 ? st.gpuMs.toFixed(2) + ' ms' : 'n/a'}\n` +
      `<span class="k">grid</span>     ${tank.resolution[0]}×${tank.resolution[1]}  ${st.substeps} substeps  CFL ${st.cfl.toFixed(2)}  ${st.passes} passes\n` +
      `<span class="k">U</span>        ${U.toFixed(2)} u/s = ${(U / L).toFixed(2)} L/s   <span class="k">f</span> ${freq.toFixed(2)} Hz\n` +
      `<span class="k">St</span>       ${swimming ? strouhal().toFixed(3) : '—'}  (tail-tip p-p ${(2 * amp(S_TIP) * L).toFixed(3)})   ${swimming ? 'swimming' : 'stationary'}\n` +
      `<span class="k">t</span>        ${simT.toFixed(2)} s` +
      probe;
  }
}
updateFish(0);
tank.setBody(samples);
requestAnimationFrame(frame);
