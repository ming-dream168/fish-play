// 入口: 渲染器, 场景, 鱼, 观察模式, 界面与交互.

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Fish, type Part } from './core/fish';
import { addAnatomy } from './core/anatomy';
import { getSpecies, hasSpecies } from './core/species';
import type { BodyModel } from './core/body';
import { finFrame } from './core/parts/fins';
import { lureTip } from './core/parts/extras';
import { lerp, clamp, Curve } from './core/math';
import { Environment } from './render/environment';
import { ModeController, type Mode, type AnatomyView } from './render/modes';
import { XRayRenderer } from './render/xray';
import { Picker } from './render/picker';
import { AtlasUI, type App } from './ui/ui';
import { SPECIES_ORDER, isCrustacean, type SpeciesId } from './data/types';
import { Crustacean, type CrustaceanId } from './core/crustacean';
import { AudioEngine, type SceneFlavor } from './audio/AudioEngine';
import { FlowTank, type BodySample } from './sim/flowtank/FlowTank';

const params = new URLSearchParams(location.search);
const noUi = params.get('ui') === '0';

// ---------- 渲染器与场景 ----------
const canvas = document.querySelector('#stage') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', stencil: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const BASE_FOV = 30;
const T_HALF = Math.tan(THREE.MathUtils.degToRad(BASE_FOV / 2));
const camera = new THREE.PerspectiveCamera(BASE_FOV, innerWidth / innerHeight, 0.05, 200);
// 略微俯视的侧视图: 既是图鉴的标准侧面, 又能看见身体的左右摆动
camera.position.set(0.5, 1.7, 7.6);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 0.6;
controls.maxDistance = 60;
const env = new Environment(renderer, scene);

const startId = ((): SpeciesId => {
  const q = params.get('species') as SpeciesId | null;
  return q && (hasSpecies(q) || isCrustacean(q)) ? q : 'largeyellow';
})();
// 甲壳动物不是鱼体蓝图: 鱼先按大黄鱼生成并藏起来, 甲壳动物用单独的模型
const fish = new Fish(getSpecies(isCrustacean(startId) ? 'largeyellow' : startId));
addAnatomy(fish);
scene.add(fish.root);
const crust = new Crustacean();
crust.root.visible = false;
scene.add(crust.root);
// 饵球的生物光: 在深海里照亮鮟鱇自己的牙齿
const escaLight = new THREE.PointLight('#7ef7ff', 0, 0, 2);
fish.root.add(escaLight);
// 饵球光晕: 加法混合的径向渐变, 代替整屏泛光
const haloTex = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.12, 'rgba(255,255,255,0.55)');
  grd.addColorStop(0.35, 'rgba(255,255,255,0.14)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
})();
const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, color: '#7ef7ff', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }));
halo.renderOrder = 5;
fish.root.add(halo);
const modes = new ModeController(fish, env);
const xray = new XRayRenderer(renderer);
const picker = new Picker(renderer);
const audio = new AudioEngine();

// ---------- 数字水槽 (二维 GPU 流体, 鱼体作为运动边界) ----------
let tank: FlowTank | null = null;
let tankOpacity = 0;
const FLOW_L = 4.4;
function ensureTank() {
  if (tank) return tank;
  const k = FLOW_L / 2;
  tank = new FlowTank(renderer, { domain: { xMin: -1.6 * k, xMax: 4.4 * k, zMin: -1.5 * k, zMax: 1.5 * k } });
  tank.setVisual(app.flowVisual, true);
  tank.setOpacity(0);
  fish.root.add(tank.mesh);
  return tank;
}
const flowSamples: BodySample[] = Array.from({ length: 128 }, () => ({ x: 0, z: 0, halfWidth: 0, vx: 0, vz: 0 }));
function feedTank(t: FlowTank) {
  // 水平切面上的尾鳍长度取中央鳍条
  const finLen = (sp: typeof fish.specA) => {
    const f = sp.fins.find((x) => x.id === 'caudalFin')!;
    return Math.max(0.03, new Curve(f.len).at(0.5)) * f.present;
  };
  const tipS = 1 + lerp(finLen(fish.specA), finLen(fish.specB), fish.morph);
  const n = flowSamples.length;
  const L = fish.L;
  for (let i = 0; i < n; i++) {
    const sv = (i / (n - 1)) * tipS;
    const m = fish.midline.sample(sv);
    const o = flowSamples[i];
    o.x = m.x;
    o.z = m.z;
    o.halfWidth = sv <= 1 ? lerp(fish.bodyA.width(sv), fish.bodyB.width(sv), fish.morph) * L : 0;
    o.vx = m.vx;
    o.vz = m.vz;
  }
  t.setBody(flowSamples);
}

const sz = new THREE.Vector2();
renderer.getDrawingBufferSize(sz);
xray.setSize(sz.x, sz.y);

// ---------- 取景: 鱼放在左右面板之间的空白处 ----------
/** 静止姿态下的外轮廓点 (体背, 腹缘, 各鳍尖), 用于取景与标注排布. */
function extentPoints(b: BodyModel): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 18; i++) {
    const s = (i / 18) * b.sEnd;
    pts.push(b.bodyPoint(s, 1, 0), b.bodyPoint(s, -1, 0));
  }
  for (const f of b.spec.fins) {
    const fr = finFrame(b, f);
    for (const u of [0, 0.5, 1]) {
      const tip = fr.point(u, 1, 1, new THREE.Vector3());
      pts.push(fr.base.clone().lerp(tip, clamp(f.present, 0, 1)));
    }
  }
  // 鮟鱇的饵球 (没有钓竿的物种这个点落在头顶体表上)
  pts.push(lureTip(b));
  return pts;
}
let extA = extentPoints(fish.bodyA);
let extB = extA;

function restBounds(a: THREE.Vector3[], b: THREE.Vector3[], t: number) {
  const box = new THREE.Box3();
  const p = new THREE.Vector3();
  for (let i = 0; i < a.length; i++) box.expandByPoint(p.copy(a[i]).lerp(b[i] ?? a[i], t));
  return box;
}

function layoutRect() {
  const W = innerWidth;
  const H = innerHeight;
  if (noUi) return { left: 0, right: 0, top: 0, bottom: 0 };
  if (W < 860) {
    const card = document.querySelector('.card') as HTMLElement | null;
    const top = card ? card.getBoundingClientRect().top : H * 0.62;
    return { left: 0, right: 0, top: 124, bottom: Math.max(140, H - top + 6) };
  }
  const idx = document.querySelector('.index') as HTMLElement | null;
  const card = document.querySelector('.card') as HTMLElement | null;
  const left = idx ? idx.getBoundingClientRect().right + 12 : 290;
  const right = card ? W - card.getBoundingClientRect().left + 12 : 380;
  return { left, right, top: 60, bottom: 104 };
}

function applyView() {
  const W = innerWidth;
  const H = innerHeight;
  const r = layoutRect();
  const cx = (r.left + W - r.right) / 2;
  const cy = (r.top + H - r.bottom) / 2;
  const dx = cx - W / 2;
  const dy = cy - H / 2;
  const fullW = W + 2 * Math.abs(dx);
  const fullH = H + 2 * Math.abs(dy);
  camera.aspect = fullW / fullH;
  camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan((T_HALF * fullH) / H));
  camera.setViewOffset(fullW, fullH, Math.abs(dx) - dx, Math.abs(dy) - dy, W, H);
}

/** 让整条鱼 (含鳍) 在空白区内放得下, 且上下各留两排标注的位置. */
function fitDistance(box: THREE.Box3) {
  const W = innerWidth;
  const H = innerHeight;
  const r = layoutRect();
  const freeW = Math.max(160, W - r.left - r.right);
  const freeH = Math.max(160, H - r.top - r.bottom);
  const sx = box.max.x - box.min.x;
  const sy = box.max.y - box.min.y;
  const labelRoom = W < 860 ? 40 : 170;
  const ppu = Math.min((0.88 * freeW) / sx, Math.max(80, freeH - labelRoom) / sy);
  return H / (2 * ppu * T_HALF);
}

interface CamTween {
  t: number;
  dur: number;
  fromT: THREE.Vector3;
  toT: THREE.Vector3;
  fromD: number;
  toD: number;
  fromDir?: THREE.Vector3;
  toDir?: THREE.Vector3;
}
// 标准侧视 (略俯视) 与流场的俯视
const SIDE_DIR = new THREE.Vector3(0.5, 1.7, 7.6).normalize();
const FLOW_DIR = new THREE.Vector3(0, 0.93, 0.36).normalize();
let camTw: CamTween | null = null;
const easeIO = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

function frameTo(box: THREE.Box3, dur: number, dolly = 1, focus?: THREE.Vector3, dir?: THREE.Vector3) {
  const c = box.getCenter(new THREE.Vector3());
  const toT = focus ? c.clone().lerp(focus, 0.75) : c;
  const toD = fitDistance(box) * dolly;
  if (dur <= 0) {
    const d = dir ?? camera.position.clone().sub(controls.target).normalize();
    controls.target.copy(toT);
    camera.position.copy(toT).addScaledVector(d, toD);
    camTw = null;
    return;
  }
  const fromDir = camera.position.clone().sub(controls.target).normalize();
  camTw = { t: 0, dur, fromT: controls.target.clone(), toT, fromD: camera.position.distanceTo(controls.target), toD, fromDir: dir ? fromDir : undefined, toDir: dir };
}

/** 流场模式: 俯视, 视野向后延伸包住尾迹. 竖直方向用鱼的左右宽度代替高度来取景. */
function flowBox(b = restBounds(extA, extB, fish.morph)) {
  const L = fish.L;
  b.max.x += 0.95 * L;
  b.min.x -= 0.1 * L;
  b.min.y = -0.42 * L;
  b.max.y = 0.42 * L;
  return b;
}
/** 当前模式下的全景取景框. */
function homeBox(b = restBounds(extA, extB, fish.morph)) {
  if (crust.active) return crust.box.clone();
  return modes.mode === 'flow' ? flowBox(b) : tiltBox(b);
}
controls.addEventListener('start', () => (camTw = null));

// ---------- 状态 ----------
let morphing: { id: string; t: number; dur: number } | null = null;
let hovered: Part | null = null;
let startle = -1; // C 形逃逸反射的计时, <0 表示未触发
const specCache = new Map<SpeciesId, ReturnType<typeof getSpecies> | null>();

const app: App = {
  fish,
  modes,
  camera,
  species: startId,
  selected: null,
  paused: false,
  soundOn: false,
  flowVisual: 'both',
  get xrayExposure() {
    return xray.exposure;
  },
  set xrayExposure(v: number) {
    xray.exposure = v;
  },
  specOf(id) {
    if (!specCache.has(id)) specCache.set(id, hasSpecies(id) ? getSpecies(id) : null);
    return specCache.get(id) ?? null;
  },
  get crustacean() {
    return crust.active ? crust : null;
  },
  selectSpecies(id) {
    if (morphing || (id === app.species && !variant)) return;
    if (isCrustacean(id)) {
      showCrustacean(id as CrustaceanId);
      return;
    }
    if (!hasSpecies(id)) return;
    if (crust.active) {
      // 从甲壳动物回到鱼: 鱼直接换成目标物种再显示, 不做插值
      crust.hide();
      fish.root.visible = true;
      app.select(null, false);
      variant = null;
      resetTilt(true);
      fish.setTarget(getSpecies(id));
      extB = extentPoints(fish.bodyB);
      morphing = { id, t: 0.999, dur: 0.01 };
      app.species = id;
      frameTo(tiltBox(restBounds(extB, extB, 0)), 1.2, 1, undefined, SIDE_DIR);
      ui?.syncSpecies();
      ui?.syncMode();
      return;
    }
    app.select(null, false);
    variant = null;
    resetTilt();
    morphTo(id, 2.6);
    app.species = id;
    ui?.syncSpecies();
  },
  setMode(m: Mode) {
    const prev = modes.mode;
    if (m === prev) return;
    if (crust.active && m !== 'living') {
      ui?.toast('甲壳动物没有鱼的内骨骼与鳔, 这里只提供活体模型.');
      return;
    }
    modes.setMode(m);
    // 新模式下看不到/点不到的选中结构 (例如透视时的皮肤) 直接取消
    if (app.selected && !pickable(app.selected)) app.select(null, false);
    ui?.syncMode();
    syncAudioScene();
    if (m === 'flow') {
      resetTilt(true);
      ensureTank().reset();
      frameTo(flowBox(), 1.6, 1, undefined, FLOW_DIR);
      ui?.toast('水平激光片切过鱼体中线. 尾鳍每摆一次甩出一个涡, 左右交替排成反向卡门涡街, 中间夹着一股向后的射流, 这股射流就是推力.', 6500);
    } else if (prev === 'flow') {
      frameTo(restBounds(extA, extB, fish.morph), 1.4, 1, undefined, SIDE_DIR);
    }
  },
  select(p, focus = true) {
    if (app.selected) app.selected.local.uHighlight.value.setRGB(0, 0, 0);
    app.selected = p;
    if (!p) {
      ui?.hideStructure();
      if (focus) frameTo(homeBox(), 1.2);
      return;
    }
    ui?.showStructure(p.sid);
    const a = fish.anchorWorld(p);
    // 流场模式保持俯视全景, 不推近
    if (focus && a && modes.mode !== 'flow') frameTo(restBounds(extA, extB, fish.morph), 1.2, 0.8, a);
  },
  relayout() {
    applyView();
    frameTo(homeBox(), 0.7);
  },
  hover(p) {
    if (hovered && hovered !== app.selected) hovered.local.uHighlight.value.setRGB(0, 0, 0);
    hovered = p;
    ui?.setHover(p ? p.sid : null);
  },
  setPaused(b) {
    app.paused = b;
    ui?.syncTools();
  },
  setSpeed(k) {
    fish.swimScale = k;
  },
  async toggleSound() {
    app.soundOn = !app.soundOn;
    if (app.soundOn) {
      await audio.init();
      audio.setEnabled(true);
      syncAudioScene();
    } else audio.setEnabled(false);
  },
  demo(id) {
    runDemo(id);
  },
  demoFor(sp, i) {
    return DEMOS[sp]?.[i] ?? null;
  },
  setFlowVisual(v) {
    app.flowVisual = v;
    tank?.setVisual(v);
  },
  sfx(kind) {
    if (app.soundOn) audio.ui(kind);
  },
};

// 甲壳动物: 藏起鱼, 显示单独的程序化模型, 只保留活体模式
const CRUST_DIRS: Record<CrustaceanId, THREE.Vector3> = {
  mittencrab: new THREE.Vector3(0.3, 6, 4.4).normalize(), // 蟹从斜上方看背甲
  riverprawn: new THREE.Vector3(0.4, 3.2, 5.6).normalize(),
};
function showCrustacean(id: CrustaceanId) {
  app.select(null, false);
  variant = null;
  resetTilt(true);
  if (modes.mode !== 'living') {
    modes.setMode('living');
  }
  crust.show(id);
  fish.root.visible = false;
  app.species = id;
  ui?.syncSpecies();
  ui?.syncMode();
  frameTo(crust.box.clone(), 1.2, 1, undefined, CRUST_DIRS[id]);
}

function audioFlavor(): SceneFlavor {
  const m = modes.mode;
  const abyss = lerp(fish.specA.lighting.abyss, fish.specB.lighting.abyss, fish.morph);
  if ((m === 'living' || m === 'flow') && abyss > 0.5) return 'abyss';
  return m;
}
function syncAudioScene() {
  if (!app.soundOn) return;
  audio.setScene(audioFlavor());
  audio.setDepth(lerp(fish.specA.physiology.depthM, fish.specB.physiology.depthM, fish.morph));
}

/** 平滑变形到任意物种或变体 (同拓扑, 逐顶点插值). */
let variant: string | null = null;
function morphTo(key: string, dur: number) {
  fish.setTarget(getSpecies(key));
  extB = extentPoints(fish.bodyB);
  morphing = { id: key, t: 0, dur };
  if (app.soundOn) audio.morph(dur);
  frameTo(homeBox(restBounds(extB, extB, 0)), dur * 0.9);
}
function toggleVariant(key: string, base: SpeciesId, onMsg: string, offMsg: string) {
  if (morphing) return;
  if (variant === key) {
    variant = null;
    morphTo(base, 2.2);
    ui?.toast(offMsg);
  } else {
    variant = key;
    morphTo(key, 2.4);
    ui?.toast(onMsg, 4200);
  }
  if (key === 'puffer-inflated' && app.soundOn) audio.inflate(variant ? 1 : 0);
}

// 每个物种三条要点对应的演示 (顺序与资料里的三条要点一一对应)
const DEMOS: Partial<Record<SpeciesId, ({ id: string; label: string } | null)[]>> = {
  whaleshark: [
    { id: 'whale-filter', label: '张嘴滤食' },
    { id: 'whale-spots', label: '看斑点' },
    { id: 'liver', label: '看肝脏' },
  ],
  sturgeon: [
    { id: 'scutes', label: '看骨板' },
    { id: 'sturgeon-cs', label: '染色看软骨' },
    { id: 'barbels', label: '看触须' },
  ],
  carp: [
    { id: 'weberian', label: '看韦伯氏器' },
    { id: 'pharyngeal', label: '看咽齿' },
    { id: 'carp-bladder', label: '看鳔' },
  ],
  chum: [
    { id: 'chum-spawn', label: '看婚姻色' },
    { id: 'chum-kype', label: '看钩吻' },
    { id: 'chum-gut', label: '看消化道' },
  ],
  bluefin: [
    { id: 'rete', label: '看奇网' },
    { id: 'red-muscle', label: '剖开看红肌' },
    { id: 'heart', label: '看心脏' },
  ],
  hairtail: [
    { id: 'vertical', label: '让它竖起来' },
    { id: 'fangs', label: '看牙' },
    { id: 'guanine', label: '看体表' },
  ],
  ricefield: [
    { id: 'sex-change', label: '看性逆转' },
    { id: 'gulp-air', label: '看它吸气' },
    { id: 'ricefield-xray', label: 'X 光看身体' },
  ],
  largeyellow: [
    { id: 'otolith-xray', label: 'X 光看耳石' },
    { id: 'croaker-drum', label: '听它叫' },
    { id: 'croaker-bladder', label: '看鳔' },
  ],
  goosefish: [
    { id: 'lure', label: '看钓竿' },
    { id: 'gape', label: '张大嘴' },
    { id: 'walk', label: '看它走路' },
  ],
  puffer: [
    { id: 'inflate', label: '让它膨胀' },
    { id: 'toxin', label: '看毒素在哪' },
    { id: 'beak', label: '看喙' },
  ],
};

// ---------- 石首鱼鸣叫: 画面上鳔的颤动与声音用同一张时间表 ----------
let drumRun: { t: number; calls: [number, number][]; end: number } | null = null;
let sonicLit = false;
function startDrum() {
  const d = fish.specA.extras.drum;
  if (!d.f0 || morphing) return;
  const per = d.pulses / d.rate;
  const gap = Math.max(0.3, per * 0.9);
  const calls: [number, number][] = Array.from({ length: d.calls }, (_, i) => [i * (per + gap), per]);
  drumRun = { t: 0, calls, end: (d.calls - 1) * (per + gap) + per + 0.3 };
  if (app.soundOn) audio.drum({ f0: d.f0, rate: d.rate, pulses: d.pulses, calls: d.calls, gap });
}

function partByKey(key: string) {
  return fish.parts.find((p) => p.key === key) ?? null;
}
function focusPart(key: string, mode?: Mode) {
  if (mode && modes.mode !== mode) app.setMode(mode);
  const p = partByKey(key);
  if (!p) return;
  // 等模式切换的溶解动画走完一半再选中, 视线跟着过去
  setTimeout(() => app.select(p, true), mode ? 450 : 0);
}
function focusPoint(local: THREE.Vector3, dolly: number) {
  const w = local.clone();
  fish.midline.deform(w, w);
  fish.root.localToWorld(w);
  frameTo(restBounds(extA, extB, fish.morph), 1.3, dolly, w);
}

/** 张嘴再合上: 张到 v, 停 hold 秒. */
function gapeFor(v: number, hold: number) {
  modes.tween(
    () => fish.gapeExtra,
    (x) => (fish.gapeExtra = x),
    v,
    0.35,
    0,
    () => modes.tween(() => fish.gapeExtra, (x) => (fish.gapeExtra = x), 0, 1.4, hold),
  );
}
function living() {
  if (modes.mode !== 'living') app.setMode('living');
}
/** 选中某结构并把镜头推近到它. */
function zoomPart(key: string, mode: Mode | undefined, dolly: number) {
  if (mode && modes.mode !== mode) app.setMode(mode);
  const p = partByKey(key);
  if (!p) return;
  setTimeout(() => {
    app.select(p, false);
    const a = fish.anchorWorld(p);
    if (a) frameTo(restBounds(extA, extB, fish.morph), 1.3, dolly, a);
  }, mode ? 450 : 0);
}
/** 解剖模式的透视图, 剖去左半颅骨与鳃盖, 看头部深处的结构. */
function headCutaway(key: string, dolly: number) {
  modes.cutaway = true;
  modes.layers.skeleton = true;
  if (modes.view !== 'ghost') modes.setView('ghost');
  else if (modes.mode === 'anatomy') modes.apply();
  zoomPart(key, 'anatomy', dolly);
  ui?.syncTools();
}
/** 解剖模式剖开看某个器官, 暂时关掉骨骼层免得挡住. */
function dissectTo(key: string, msg: string, skeleton = false) {
  if (modes.mode !== 'anatomy') app.setMode('anatomy');
  modes.setView('dissect');
  modes.setLayer('skeleton', skeleton);
  setTimeout(() => focusPart(key), 900);
  ui?.toast(msg, 4800);
}

function runDemo(id: string) {
  switch (id) {
    case 'startle':
      triggerStartle();
      break;
    // ---- 鲸鲨 ----
    case 'whale-filter': {
      // 斜前方看宽阔的口: 张到最大时能看进口腔
      living();
      const hp = fish.bodyA.bodyPoint(0.08, 0, 0);
      fish.midline.deform(hp, hp);
      fish.root.localToWorld(hp);
      frameTo(restBounds(extA, extB, fish.morph), 1.4, 0.5, hp, new THREE.Vector3(-0.72, 0.22, 0.66).normalize());
      setTimeout(() => gapeFor(0.55, 5), 800);
      // 张开后皮肤变透明, 点亮咽腔两侧的滤食垫
      setTimeout(() => {
        if (modes.mode !== 'living' || app.species !== 'whaleshark') return;
        app.setMode('anatomy');
        modes.setView('ghost');
        modes.setLayer('vessels', false);
        glowParts(['filterPads'], 5);
      }, 3000);
      ui?.toast('张开宽大的口, 海水连同浮游生物一起涌入, 鳃弓内侧的滤食垫把食物截留下来, 水从五对鳃裂排出', 6500);
      break;
    }
    case 'whale-spots':
      living();
      focusPoint(fish.bodyA.bodyPoint(0.27, 0.35, 1), 0.5);
      ui?.toast('每条鲸鲨身上的浅色斑点排列都不一样, 而且长期稳定. 研究者把天文学里比对星图的算法拿来, 靠斑点认出个体', 5200);
      break;
    case 'liver':
      focusPart('liver', 'anatomy');
      break;
    // ---- 中华鲟 ----
    case 'scutes':
      focusPart('scutes', 'living');
      ui?.toast('背部 1 行, 体侧和腹侧左右各 1 行, 一共五行骨板, 每块都带一个棘状突起. 骨板之间的皮肤没有普通的鳞片', 5200);
      break;
    case 'sturgeon-cs':
      app.setMode('cleared');
      ui?.toast('阿利新蓝染软骨, 茜素红染硬骨: 鲟的骨骼大多是蓝色的软骨, 中轴是终生保留的脊索, 没有骨化的椎体', 5600);
      break;
    case 'barbels': {
      if (modes.mode !== 'living') app.setMode('living');
      const p = partByKey('barbels');
      if (p) {
        app.select(p, false);
        const a = fish.anchorWorld(p);
        frameTo(restBounds(extA, extB, fish.morph), 1.3, 0.42, a ?? undefined, new THREE.Vector3(-0.45, -0.3, 0.85).normalize());
      }
      ui?.toast('口前方并排 4 根吻须. 口开在头的腹面, 是一条能伸成筒状的横裂', 5200);
      break;
    }
    // ---- 鲤 ----
    case 'weberian':
      headCutaway('weberian', 0.36);
      ui?.toast('鳔的振动经过 4 块小骨传到内耳: 三脚骨贴着鳔前室, 再经间插骨, 舟骨, 闩骨, 鳔就成了放大声音的鼓膜', 5600);
      break;
    case 'pharyngeal':
      headCutaway('pharyngealTeeth', 0.36);
      ui?.toast('鲤的上下颌没有牙. 最后一对鳃弓特化成下咽骨, 上面的臼齿状咽齿和颅底的角质垫对磨, 把食物碾碎', 5600);
      break;
    case 'carp-bladder':
      modes.layers.skeleton = false;
      if (modes.view !== 'ghost') modes.setView('ghost');
      else if (modes.mode === 'anatomy') modes.apply();
      zoomPart('swimBladder', 'anatomy', 0.6);
      ui?.syncTools();
      ui?.toast('鳔分前后两室, 中间细窄处有小孔相通. 前室贴着韦伯氏器, 后室发出鳔管通到食道背面', 5200);
      break;
    // ---- 大麻哈鱼 ----
    case 'chum-spawn':
      living();
      toggleVariant('chum-spawn', 'chum', '进入淡水后: 银亮的体色褪去, 体侧浮出红, 黑, 绿相间的不规则横纹, 雄鱼吻部弯成钩, 牙齿变大. 再点一次变回海洋期.', '变回海洋期的银色大麻哈鱼');
      break;
    case 'chum-kype':
      living();
      if (variant !== 'chum-spawn') toggleVariant('chum-spawn', 'chum', '繁殖期雄鱼: 上下颌弯成钩吻, 牙齿明显增大, 像犬牙', '');
      setTimeout(() => focusPoint(fish.bodyB.bodyPoint(0.05, 0.1, 1), 0.45), 2500);
      break;
    case 'chum-gut':
      dissectTo('stomach', '洄游进入淡水后它基本不再进食, 胃肠逐渐萎缩, 靠体内储存的脂肪和蛋白质游到产卵场');
      break;
    // ---- 太平洋蓝鳍金枪鱼 ----
    case 'rete':
      modes.layers.vessels = true;
      focusPart('rete', 'anatomy');
      ui?.toast('覆盖红肌的外侧奇网: 红色动脉与蓝色静脉交替平行排列, 血流方向相反, 热量留在体内');
      break;
    case 'red-muscle':
      if (modes.mode !== 'anatomy') app.setMode('anatomy');
      modes.setView('dissect');
      setTimeout(() => focusPart('redMuscle'), 1200);
      break;
    case 'heart':
      focusPart('heart', 'anatomy');
      break;
    // ---- 带鱼 ----
    case 'vertical':
      // 野外加速度记录里体轴与水平面夹角的峰值在 77 度
      if (modes.mode === 'flow') app.setMode('living');
      setTilt(tilt.target < -1 ? 0 : -THREE.MathUtils.degToRad(77));
      ui?.toast(tilt.target < -1 ? '头朝上竖在水中, 这时它几乎不动, 水族馆里可见它缓缓波动长长的背鳍. 加速度记录里体轴超过 60 度的约占 58%. 再点一次放平' : '放平了', 5600);
      break;
    case 'fangs':
      living();
      focusPoint(fish.bodyA.bodyPoint(0.04, 0, 1), 0.4);
      gapeFor(0.4, 2.5);
      ui?.toast('口大, 下颌比上颌长, 上颌前端有两对带倒钩的大犬齿. 它性极贪食, 主要吃小鱼和甲壳类', 5200);
      break;
    case 'guanine':
      living();
      focusPoint(fish.bodyA.bodyPoint(0.35, 0.3, 1), 0.38);
      ui?.toast('带鱼的鳞已退化. 银白色来自表皮里发亮的颗粒, 主要成分是鸟嘌呤, 日本曾用它做仿珍珠的珠光原料', 5600);
      break;
    // ---- 黄鳝 ----
    case 'sex-change': {
      // 透视, 镜头从斜下方推到体中段的性腺: 卵巢是橙色颗粒, 精巢光滑乳白
      if (modes.mode !== 'anatomy') app.setMode('anatomy');
      modes.setView('ghost');
      modes.setLayer('skeleton', false);
      modes.setLayer('vessels', false);
      setTimeout(() => {
        const gp = partByKey('gonad');
        if (!gp) return;
        app.select(gp, false);
        const w = fish.anchorWorld(gp);
        if (w) frameTo(restBounds(extA, extB, fish.morph), 1.4, 0.17, w, new THREE.Vector3(0.05, -0.35, 0.94).normalize());
      }, 900);
      toggleVariant('ricefield-male', 'ricefield', '先雌后雄: 黄鳝先当雌鱼, 经过卵巢与精巢并存的间性期, 最后变成雄鱼. 再点一次变回雌性.', '变回雌性');
      break;
    }
    case 'gulp-air':
      living();
      setTilt(-0.42);
      setTimeout(() => {
        gapeFor(0.45, 0.8);
        if (app.soundOn) audio.ui('open');
      }, 900);
      setTimeout(() => setTilt(0), 3200);
      ui?.toast('鳃已经退化. 它把头伸出水面吞一口气, 靠口腔和咽部布满血管的内壁交换气体', 5200);
      break;
    case 'ricefield-xray':
      app.setMode('xray');
      ui?.toast('X 光片上看不到胸鳍和腹鳍的骨骼: 成鱼没有偶鳍, 背鳍和臀鳍也只剩低矮的皮褶', 5200);
      break;
    // ---- 大黄鱼 ----
    case 'otolith-xray': {
      app.setMode('xray');
      const ot = partByKey('otoliths');
      const b = fish.bodyA;
      const at = b.bodyPoint(lerp(b.spec.eye.s, b.spec.skeleton.spineStart, 0.62), 0.05, 0.32);
      setTimeout(() => {
        if (ot) app.select(ot, false);
        focusPoint(at, 0.42);
      }, 450);
      ui?.toast('头骨两侧各藏着一枚大耳石, 在 X 光片上最亮. 石首鱼的名字就来自这对石头');
      break;
    }
    case 'croaker-drum': {
      const go = () => {
        if (modes.mode !== 'anatomy') app.setMode('anatomy');
        const sm = partByKey('sonicMuscle');
        if (sm) setTimeout(() => app.select(sm, true), 450);
        setTimeout(startDrum, 1300);
      };
      if (!app.soundOn) {
        void app.toggleSound().then(() => {
          ui?.syncTools();
          go();
        });
        ui?.toast('已打开声音. 鳔两侧的发声肌快速收缩, 鳔像鼓面一样振动', 4200);
      } else {
        go();
        ui?.toast('鳔两侧的发声肌快速收缩, 鳔像鼓面一样振动', 4200);
      }
      break;
    }
    case 'croaker-bladder':
      dissectTo('swimBladder', '鳔前端圆钝, 后端尖长, 两侧各有 31 至 33 条侧肢, 每条分出背支和腹支. 干制后就是鱼肚');
      break;
    // ---- 黄鮟鱇 ----
    case 'lure': {
      living();
      fish.lureTwitch = 1;
      escaFlash = 2.5;
      const tip = partByKey('esca');
      if (tip) setTimeout(() => app.select(tip, true), 100);
      ui?.toast('第一背鳍棘移到吻背成了钓竿. 同属鮟鱇的钓竿顶端是一片叶状皮瓣, 猎物靠近时竖起, 在口前来回抖动', 5200);
      break;
    }
    case 'gape':
      living();
      gapeFor(0.85, 0.9);
      ui?.toast('鮟鱇属的口巨大, 朝上开, 牙细长而弯, 全朝喉咙内倾. 它们能吞下几乎和自己一样大的鱼', 5200);
      break;
    case 'walk':
      living();
      focusPoint(fish.bodyA.bodyPoint(0.4, -0.8, 1), 0.6);
      ui?.toast('鮟鱇科的胸鳍基部由伸长的腕骨撑成肉臂, 每条臂只有两块骨头. 水族馆里的同属鮟鱇常用胸鳍和腹鳍撑着海底行走', 5200);
      break;
    // ---- 暗纹东方鲀 ----
    case 'inflate':
      if (modes.mode !== 'living' && modes.mode !== 'xray') app.setMode('living');
      toggleVariant('puffer-inflated', 'puffer', '受刺激后快速反复吞入水或空气, 灌进一个柔韧的囊, 胀成球形, 河鲀类的体积可达平时的三到四倍. 这个囊常被称为胃, 对本种的解剖认为它是特化食道的一部分. 再点一次放掉水', '把水吐掉, 恢复原状');
      break;
    case 'toxin':
      if (modes.mode !== 'anatomy') app.setMode('anatomy');
      modes.setView('dissect');
      modes.setLayer('skeleton', false);
      glowParts(['gonad', 'liver', 'intestine'], 6);
      ui?.toast('野生暗纹东方鲀的毒素以卵巢最强, 肝, 皮肤和肠也高, 肌肉和精巢很低. 一般认为毒素源自细菌, 经食物链累积; 用无毒饲料养大的鱼几乎无毒', 7000);
      break;
    case 'beak': {
      // 活体, 从斜前方看吻端: 4 块齿板和中线的缝, 张一下嘴
      living();
      const bp = fish.bodyA.surface(0.004, fish.bodyA.mouthTheta(0.004), 0, new THREE.Vector3());
      fish.midline.deform(bp, bp);
      fish.root.localToWorld(bp);
      frameTo(restBounds(extA, extB, fish.morph), 1.4, 0.3, bp, new THREE.Vector3(-0.5, 0.22, 0.84).normalize());
      setTimeout(() => gapeFor(0.3, 3), 900);
      ui?.toast('鲀科的牙在上下颌各自愈合成喙, 中线处有一道缝, 合起来共 4 颗愈合的牙. 科名 Tetraodontidae 的词根就是四颗牙', 5200);
      break;
    }
  }
}

// ---------- 姿态: 绕体长中点在竖直面内转动 (带鱼竖游, 黄鳝探头吸气) ----------
const tilt = { v: 0, target: 0 };
let tiltSpeed = 1;
function setTilt(a: number) {
  if (tilt.target === a) return;
  const wasBig = Math.abs(tilt.target) > 1;
  tilt.target = a;
  const big = Math.abs(a) > 1;
  if (big && !wasBig) {
    tiltSpeed = fish.swimScale;
    app.setSpeed(0.25);
  } else if (!big && wasBig) app.setSpeed(tiltSpeed);
  if (big !== wasBig) {
    frameTo(homeBox(), 1.6);
    ui?.syncTools();
  }
}
function resetTilt(now = false) {
  if (Math.abs(tilt.target) > 1) {
    app.setSpeed(tiltSpeed);
    ui?.syncTools();
  }
  tilt.target = 0;
  if (now) tilt.v = 0;
}
/** 把局部坐标的包围盒按当前目标姿态转到世界坐标. */
function tiltBox(b: THREE.Box3, a = tilt.target) {
  if (Math.abs(a) < 1e-3) return b;
  const out = new THREE.Box3();
  const q = new THREE.Vector3();
  const c = Math.cos(a);
  const sn = Math.sin(a);
  for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) out.expandByPoint(q.set(x * c - y * sn, x * sn + y * c, z));
  return out;
}

// ---------- 同时点亮几个结构 (河鲀毒素所在) ----------
let glow: { keys: string[]; t: number; dur: number } | null = null;
function glowParts(keys: string[], dur: number) {
  glow = { keys, t: 0, dur };
}

let escaFlash = 0;

function triggerStartle() {
  startle = 0;
  if (app.soundOn) audio.escape();
  ui?.toast('马氏细胞触发的 C 形逃逸: 感知到刺激约 10 毫秒内身体弯成 C 字');
}

// ---------- 界面 ----------
const ui = noUi ? null : new AtlasUI(app);
modes.onChange = () => ui?.refreshLabels();

// ---------- URL 参数 (截图与调试) ----------
const cam = params.get('cam');
const tgt = params.get('target');
if (params.get('still')) fish.swimScale = 0;
const lay = params.get('layers');
if (lay) {
  for (const k of Object.keys(modes.layers) as (keyof typeof modes.layers)[]) modes.layers[k] = lay.split(',').includes(k);
  modes.apply(true);
}

function resize() {
  renderer.setSize(innerWidth, innerHeight);
  applyView();
  renderer.getDrawingBufferSize(sz);
  xray.setSize(sz.x, sz.y);
}
addEventListener('resize', () => {
  resize();
  frameTo(homeBox(), 0);
});
applyView();
frameTo(restBounds(extA, extA, 0), 0, 1, undefined, SIDE_DIR);
if (isCrustacean(startId)) {
  showCrustacean(startId as CrustaceanId);
  frameTo(crust.box.clone(), 0, 1, undefined, CRUST_DIRS[startId as CrustaceanId]);
}
const m0 = params.get('mode') as Mode | null;
if (m0) app.setMode(m0);
const v0 = params.get('view') as AnatomyView | null;
if (v0) modes.setView(v0);
const demo0 = params.get('demo');
if (demo0) setTimeout(() => runDemo(demo0), 600);
if (cam) {
  const [x, y, z] = cam.split(',').map(Number);
  camera.position.set(x, y, z);
}
if (tgt) {
  const [x, y, z] = tgt.split(',').map(Number);
  controls.target.set(x, y, z);
}

// ---------- 指针: 悬停拾取, 点击选择 ----------
const pointer = { x: -1, y: -1, inside: false, down: false, dx: 0, dy: 0, moved: 0 };
canvas.addEventListener('pointermove', (e) => {
  pointer.x = e.clientX;
  pointer.y = e.clientY;
  pointer.inside = true;
  if (pointer.down) pointer.moved += Math.abs(e.movementX) + Math.abs(e.movementY);
});
canvas.addEventListener('pointerleave', () => {
  pointer.inside = false;
  app.hover(null);
});
canvas.addEventListener('pointerdown', (e) => {
  pointer.down = true;
  pointer.moved = 0;
  pointer.dx = e.clientX;
  pointer.dy = e.clientY;
});
canvas.addEventListener('pointerup', (e) => {
  pointer.down = false;
  if (Math.hypot(e.clientX - pointer.dx, e.clientY - pointer.dy) > 5 || pointer.moved > 8) return;
  const hit = pickAt(e.clientX, e.clientY);
  if (!hit) {
    if (app.selected) app.select(null);
    return;
  }
  if (modes.mode === 'living' && hit.key === 'skin') triggerStartle();
  app.select(hit, modes.mode !== 'living');
});

function pickable(p: Part) {
  const md = modes.mode;
  if (p.key === 'cavity') return false;
  if (md === 'xray') return p.layer === 'skeleton' || p.key === 'swimBladder' || p.key === 'eye' || p.key === 'teeth';
  if (!p.mesh.visible) return false;
  const outer = p.layer === 'skin' || p.layer === 'fins';
  if (md === 'anatomy' && modes.view === 'ghost' && outer && p.key !== 'teeth') return false;
  if (md === 'cleared' && outer && p.key !== 'teeth') return false;
  return true;
}

function pickAt(x: number, y: number) {
  if (crust.active) return null;
  const r = picker.pick(fish, camera, x, y, innerWidth, innerHeight, pickable);
  return r ? r.part : null;
}

// ---------- 主循环 ----------
const screenBox = { top: 0, bottom: 0, cy: 0 };
const tmp = new THREE.Vector3();
function updateScreenBox() {
  let top = Infinity;
  let bottom = -Infinity;
  const t = fish.morph;
  if (crust.active) {
    const b = crust.box;
    for (const x of [b.min.x, b.max.x])
      for (const y of [b.min.y, b.max.y])
        for (const z of [b.min.z, b.max.z]) {
          tmp.set(x, y, z).project(camera);
          const sy = (-tmp.y * 0.5 + 0.5) * innerHeight;
          top = Math.min(top, sy);
          bottom = Math.max(bottom, sy);
        }
  }
  for (let i = 0; i < (crust.active ? 0 : extA.length); i++) {
    tmp.copy(extA[i]);
    if (t > 0 && extB[i]) tmp.lerp(extB[i], t);
    fish.midline.deform(tmp, tmp);
    fish.root.localToWorld(tmp);
    tmp.project(camera);
    const y = (-tmp.y * 0.5 + 0.5) * innerHeight;
    top = Math.min(top, y);
    bottom = Math.max(bottom, y);
  }
  // 平滑, 避免标注随尾鳍摆动上下跳
  const k = screenBox.bottom === 0 ? 1 : 0.08;
  screenBox.top += (top - screenBox.top) * k;
  screenBox.bottom += (bottom - screenBox.bottom) * k;
  screenBox.cy = (screenBox.top + screenBox.bottom) / 2;
}

function startleCurve(t: number) {
  // 第一阶段: 约 60 ms 弯成 C 形; 第二阶段: 反向摆尾推进; 随后恢复巡游
  if (t < 0.07) return 1.5 * easeIO(t / 0.07);
  if (t < 0.2) return lerp(1.5, -0.7, easeIO((t - 0.07) / 0.13));
  if (t < 0.6) return lerp(-0.7, 0, easeIO((t - 0.2) / 0.4));
  return 0;
}

let last = performance.now();
let frames = 0;
let baseSpeed = fish.swimScale;
function loop() {
  const now = performance.now();
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const fdt = app.paused ? 0 : dt;

  // 物种过渡
  if (morphing) {
    morphing.t = Math.min(1, morphing.t + dt / morphing.dur);
    fish.setMorph(easeIO(morphing.t));
    if (morphing.t >= 1) {
      fish.commit();
      extA = extB;
      morphing = null;
      ui?.refreshSilhouettes();
      modes.stainRules();
      modes.updateWindow();
      ui?.refreshLabels();
      syncAudioScene();
    }
  }
  // 逃逸反射
  if (startle >= 0) {
    startle += fdt;
    fish.curl = startleCurve(startle);
    fish.swimScale = startle < 1.2 ? Math.max(baseSpeed, 1.8 - startle) : baseSpeed;
    if (startle > 1.4) {
      startle = -1;
      fish.curl = 0;
      fish.swimScale = baseSpeed;
    }
  } else baseSpeed = fish.swimScale;

  if (drumRun) {
    drumRun.t += dt;
    const tt = drumRun.t;
    const on = drumRun.calls.some(([s, d]) => tt >= s && tt <= s + d);
    fish.drum += ((on ? 1 : 0) - fish.drum) * Math.min(1, dt * 25);
    if (tt > drumRun.end) {
      drumRun = null;
      fish.drum = 0;
    }
  }

  tilt.v += (tilt.target - tilt.v) * Math.min(1, dt * 2.2);
  fish.root.rotation.z = tilt.v;
  if (fish.lureTwitch > 0) fish.lureTwitch = Math.max(0, fish.lureTwitch - dt / 3.5);

  const heartBefore = fish.heart;
  const breathBefore = fish.breath;
  fish.update(fdt);
  crust.update(fdt, fish.swimScale);
  modes.update(dt);
  if (app.soundOn && !app.paused) {
    // 心室收缩 (相位 0.42) 时发一声心跳, 每个呼吸周期一次鳃流
    if (Math.floor(fish.heart - 0.42) > Math.floor(heartBefore - 0.42)) audio.heartbeat(modes.mode === 'anatomy' ? 0.75 : 0.5);
    if (Math.floor(fish.breath - 0.3) > Math.floor(breathBefore - 0.3)) audio.gillPulse();
    audio.setSwimSpeed(clamp(fish.swimScale * 0.6, 0, 1));
  }
  env.flow = fish.swim.speed * fish.L * 0.35 * fish.swimScale * (app.paused ? 0 : 1);
  env.abyss = modes.mode === 'living' || modes.mode === 'flow' ? lerp(fish.specA.lighting.abyss, fish.specB.lighting.abyss, fish.morph) : 0;
  env.warm = modes.mode === 'living' ? lerp(fish.specA.lighting.warm, fish.specB.lighting.warm, fish.morph) : 0;
  escaLight.position.copy(fish.escaPos);
  escaLight.color.set(fish.specA.extras.lure.glow).lerp(new THREE.Color(fish.specB.extras.lure.glow), fish.morph);
  if (escaFlash > 0) escaFlash = Math.max(0, escaFlash - dt);
  const flash = 1 + 2.5 * Math.pow(Math.sin(Math.min(1, escaFlash / 2.5) * Math.PI), 2);
  const lit = modes.mode === 'living' || modes.mode === 'flow' ? 1 : modes.mode === 'anatomy' ? 0.3 : 0;
  escaLight.intensity = fish.escaGlow * flash * lit * 14;
  halo.position.copy(fish.escaPos);
  halo.material.color.copy(escaLight.color);
  halo.material.opacity = Math.min(1, fish.escaGlow * flash * lit * 0.9);
  halo.scale.setScalar(fish.L * (0.16 + 0.06 * flash));
  halo.visible = halo.material.opacity > 0.01;
  env.update(dt, fish.time, camera);

  if (modes.mode === 'flow') ensureTank();
  if (tank) {
    const target = modes.mode === 'flow' ? 1 : 0;
    tankOpacity += (target - tankOpacity) * Math.min(1, dt * 2.5);
    tank.setOpacity(tankOpacity);
    tank.mesh.visible = tankOpacity > 0.01;
    if (tank.mesh.visible && !app.paused) {
      tank.setFreeStream(fish.swim.speed * fish.L * Math.max(0.15, fish.swimScale));
      feedTank(tank);
      tank.step(dt);
    }
  }
  if (camTw) {
    camTw.t = Math.min(1, camTw.t + dt / camTw.dur);
    const e = easeIO(camTw.t);
    const dir = camTw.toDir && camTw.fromDir ? camTw.fromDir.clone().lerp(camTw.toDir, e).normalize() : camera.position.clone().sub(controls.target).normalize();
    controls.target.lerpVectors(camTw.fromT, camTw.toT, e);
    camera.position.copy(controls.target).addScaledVector(dir, lerp(camTw.fromD, camTw.toD, e));
    if (camTw.t >= 1) camTw = null;
  }
  controls.update();

  // 悬停拾取 (隔帧)
  if (pointer.inside && !pointer.down && frames % 3 === 0) {
    const p = pickAt(pointer.x, pointer.y);
    if (p !== hovered) app.hover(p);
  }
  // 高亮: 悬停淡光, 选中呼吸光
  if (hovered && hovered !== app.selected) hovered.local.uHighlight.value.setRGB(0.05, 0.045, 0.035);
  if (app.selected) {
    const k = 0.07 + 0.05 * Math.sin(now * 0.005);
    app.selected.local.uHighlight.value.setRGB(k * 1.2, k * 0.55, k * 0.6);
  }
  if (glow) {
    glow.t += dt;
    const on = glow.t < glow.dur;
    const k = on ? (0.1 + 0.07 * Math.sin(now * 0.007)) * Math.min(1, glow.t * 1.5) : 0;
    for (const key of glow.keys) {
      const p = partByKey(key);
      if (p && p !== app.selected && p !== hovered) p.local.uHighlight.value.setRGB(k * 1.5, k * 0.3, k * 0.22);
    }
    if (!on) glow = null;
  }
  // 鸣叫时发声肌随每次收缩闪亮
  const sonic = fish.drum > 0.01 || sonicLit ? partByKey('sonicMuscle') : null;
  if (sonic) {
    const g = fish.drum * fish.drumVib;
    if (fish.drum > 0.01) sonic.local.uHighlight.value.setRGB(0.4 * g, 0.07 * g, 0.09 * g);
    else if (sonic !== app.selected && sonic !== hovered) sonic.local.uHighlight.value.setRGB(0, 0, 0);
    sonicLit = fish.drum > 0.01;
  }

  if (modes.mode === 'xray') xray.render(fish, camera, null, fish.time, () => true);
  else renderer.render(scene, camera);

  if (ui) {
    updateScreenBox();
    ui.update(dt, screenBox);
  }
  frames++;
  if (frames === 30) {
    (window as unknown as Record<string, unknown>).__ready = true;
    document.querySelector('.veil')?.classList.add('gone');
  }
  requestAnimationFrame(loop);
}
loop();

(window as unknown as Record<string, unknown>).__app = { fish, camera, scene, renderer, controls, env, modes, xray, app, ui, SPECIES_ORDER, escaLight, halo, flowBox, layoutRect, fitDistance };
