// 内脏器官. 位置用体腔坐标 (s, v, u) 或身体坐标 (s, h, u) 给出, 自动贴合不同物种体形.

import * as THREE from 'three';
import type { BodyModel } from '../body';
import { GeomBuilder, tube, type GeomData } from '../geom';
import { clamp, lerp, rng, smoothstep } from '../math';
import { centrumR, gillArchPath, spinePoint } from './skeleton';

type CavPt = [number, number, number]; // s, v, u

function smoothPath(ctrl: THREE.Vector3[], n: number) {
  let len = 0;
  for (let i = 1; i < ctrl.length; i++) len += ctrl[i].distanceTo(ctrl[i - 1]);
  if (len < 1e-7) return Array.from({ length: n }, () => ctrl[0].clone());
  const c = new THREE.CatmullRomCurve3(ctrl, false, 'centripetal', 0.5);
  return Array.from({ length: n }, (_, i) => c.getPoint(i / (n - 1)));
}

/** 沿体腔内路径的管状器官, 截面为椭圆 (横向 ru, 竖向 rv, 单位: 世界). */
function cavTube(
  b: GeomBuilder,
  body: BodyModel,
  ctrl: CavPt[],
  n: number,
  radial: number,
  r: (t: number) => [number, number],
  ex?: (t: number) => Record<string, number | number[]>,
) {
  const pts = smoothPath(
    ctrl.map(([s, v, u]) => body.cavityPoint(s, v, u)),
    n,
  );
  const rr = (i: number) => r(i / (n - 1));
  tube(b, pts, (i) => Math.max(1e-6, rr(i)[0]), radial, {
    capRings: 3,
    squash: (i) => clamp(rr(i)[1] / Math.max(1e-6, rr(i)[0]), 0.05, 20),
    ex: ex ? (i) => ex(i / (n - 1)) : undefined,
  });
  return pts;
}

/** 体腔特征尺度 (世界单位): 在 s 处体腔半高与半宽. */
function cavScale(body: BodyModel, s: number) {
  const f = body.cavityFrame(clamp(s, body.spec.organs.cavity.s0 + 0.02, body.spec.organs.cavity.s1 - 0.02));
  return { hh: f.hh * body.L, hw: f.hw * body.L };
}

const bell = (t: number, p = 0.6) => Math.pow(Math.max(0, Math.sin(Math.PI * clamp(t, 0, 1))), p);

// ---------- 肝 ----------
export function buildLiver(body: BodyModel): GeomData {
  const o = body.spec.organs;
  const lv = o.liver;
  const b = new GeomBuilder();
  const mid = (lv.s0 + lv.s1) / 2;
  const sc = cavScale(body, mid);
  for (const [u, k] of [
    [0.42, 1],
    [-0.42, 1],
    [0, lv.lobes >= 3 ? 0.7 : 0],
  ] as [number, number][]) {
    const kk = k * lv.size;
    cavTube(
      b,
      body,
      [
        [lv.s0, -0.05, u * 0.6],
        [lerp(lv.s0, lv.s1, 0.35), -0.2, u],
        [lerp(lv.s0, lv.s1, 0.75), -0.35, u * 1.05],
        [lv.s1, -0.45, u * 0.8],
      ],
      24,
      14,
      (t) => [sc.hw * 0.42 * kk * bell(t, 0.5), sc.hh * 0.5 * kk * bell(t, 0.55)],
    );
  }
  return b.build();
}

export function buildGallBladder(body: BodyModel): GeomData {
  const lv = body.spec.organs.liver;
  const b = new GeomBuilder();
  const L = body.L;
  const c = body.cavityPoint(lerp(lv.s0, lv.s1, 0.55), -0.5, -0.12);
  const r = 0.0085 * L * lv.size;
  const pts = [c.clone().add(new THREE.Vector3(-r * 0.8, r * 0.6, 0)), c, c.clone().add(new THREE.Vector3(r * 0.9, -r * 0.3, 0))];
  tube(b, smoothPath(pts, 8), (i) => r * (0.35 + 0.65 * bell(i / 7, 0.4)), 10, { capRings: 3 });
  return b.build();
}

// ---------- 消化道 ----------
function stomachCtrl(body: BodyModel): CavPt[] {
  const st = body.spec.organs.stomach;
  const a = st.s0;
  const e = st.s1;
  const deep = st.shape > 0.5 ? 1.0 : 0.78;
  return [
    [a - 0.03, 0.45, 0.05],
    [a, 0.35, 0.12],
    [lerp(a, e, 0.45), 0.0, 0.18],
    [lerp(a, e, deep), -0.35, 0.12],
    [lerp(a, e, deep * 0.98) , -0.1, -0.05],
    [lerp(a, e, 0.55), 0.08, -0.2],
    [lerp(a, e, 0.42), 0.12, -0.25],
  ];
}

export function pylorus(body: BodyModel) {
  const c = stomachCtrl(body);
  const [s, v, u] = c[c.length - 1];
  return { s, v, u };
}

export function buildStomach(body: BodyModel): GeomData {
  const o = body.spec.organs;
  const st = o.stomach;
  const b = new GeomBuilder();
  const sc = cavScale(body, (st.s0 + st.s1) / 2);
  const L = body.L;
  const ctrl = stomachCtrl(body);
  const k = st.size;
  cavTube(b, body, ctrl, 40, 14, (t) => {
    // 贲门部粗, 幽门部细
    const r = lerp(0.3, 0.13, clamp((t - 0.45) / 0.45, 0, 1)) * (0.55 + 0.45 * bell(t, 0.25));
    return [sc.hw * r * k, sc.hh * r * 0.9 * k];
  });
  // 食道: 从咽部 (末鳃弓之后) 到胃
  const g = body.spec.gill;
  const p0 = body.bodyPoint(g.arches[1] + 0.012, 0.05, 0);
  const p1 = body.cavityPoint(ctrl[0][0], ctrl[0][1], ctrl[0][2]);
  const pts = smoothPath([p0, p0.clone().lerp(p1, 0.5).add(new THREE.Vector3(0, 0.004 * L, 0)), p1], 10);
  tube(b, pts, () => 0.006 * L * Math.max(0.3, k * 0.8), 10, { capRings: 2 });
  return b.build();
}

export const MAX_CAECA = 64;
export function buildCaeca(body: BodyModel): GeomData {
  const o = body.spec.organs;
  const b = new GeomBuilder();
  const L = body.L;
  const py = pylorus(body);
  const n = Math.min(MAX_CAECA, Math.round(o.caeca.count));
  const R = rng(7);
  const base = body.cavityPoint(py.s, py.v, py.u);
  for (let i = 0; i < MAX_CAECA; i++) {
    const active = i < n;
    const t = i / MAX_CAECA;
    // 沿幽门之后的肠道起始段排布, 指向后下方
    const sb = py.s + 0.035 * t;
    const p0 = body.cavityPoint(sb, py.v - 0.05 - 0.1 * R(), py.u + (R() - 0.5) * 0.3);
    const dir = new THREE.Vector3(0.6 + R() * 0.6, -0.4 - R() * 0.8, (R() - 0.5) * 1.6).normalize();
    const len = o.caeca.len * L * (0.6 + 0.6 * R()) * (active ? 1 : 0);
    const p1 = p0.clone().addScaledVector(dir, len);
    const p2 = p1.clone().add(new THREE.Vector3(len * 0.3 * (R() - 0.3), -len * 0.25, len * 0.25 * (R() - 0.5)));
    const pts = smoothPath([p0, p1, p2], 5);
    tube(b, pts, () => (active ? 0.0022 * L : 0), 5, { capRings: 2 });
  }
  void base;
  return b.build();
}

export function intestinePathCtrl(body: BodyModel): CavPt[] {
  const o = body.spec.organs;
  const py = pylorus(body);
  const end = o.intestine.end;
  const loops = o.intestine.loops;
  const c0 = o.cavity.s0;
  const pts: CavPt[] = [
    [py.s, py.v, py.u],
    [py.s + 0.02, py.v - 0.25, py.u - 0.1],
  ];
  // 可选的盘曲: 在腹腔中下部来回
  const span = end - py.s;
  for (let k = 0; k < 3; k++) {
    const a = loops * (k + 1) / 3;
    const s = lerp(py.s + 0.03, end - 0.04, (k + 1) / 4);
    pts.push([s - 0.05 * a, -0.55 + 0.25 * a * ((k % 2) * 2 - 1), 0.3 * a * (k % 2 ? 1 : -1)]);
  }
  pts.push([end - 0.02, -0.55, 0.0], [end - 0.003, -0.9, 0]);
  void span;
  void c0;
  return pts;
}

export function buildIntestine(body: BodyModel): GeomData {
  const o = body.spec.organs;
  const b = new GeomBuilder();
  const sc = cavScale(body, (pylorus(body).s + o.intestine.end) / 2);
  cavTube(b, body, intestinePathCtrl(body), 70, 10, (t) => {
    const r = 0.11 * o.intestine.size * (1 + o.intestine.spiral * 1.6 * clamp((t - 0.55) / 0.2, 0, 1) * (1 - clamp((t - 0.9) / 0.1, 0, 1)));
    return [sc.hw * r, sc.hw * r];
  });
  return b.build();
}

export function buildSpleen(body: BodyModel): GeomData {
  const o = body.spec.organs;
  const b = new GeomBuilder();
  const L = body.L;
  const st = o.stomach;
  const c = body.cavityPoint(lerp(st.s0, st.s1, 0.65), 0.05, 0.42);
  const r = 0.011 * L * o.spleen.size;
  tube(b, smoothPath([c.clone().add(new THREE.Vector3(-r, 0, 0)), c, c.clone().add(new THREE.Vector3(r * 1.2, -r * 0.3, 0))], 8), (i) => r * 0.6 * (0.5 + 0.5 * bell(i / 7, 0.5)), 10, {
    capRings: 3,
    squash: 0.6,
  });
  return b.build();
}

// ---------- 鳔 ----------
/** 石首鱼式鳔: 前端圆钝, 向后渐尖, 像一根胡萝卜 */
const carrot = (t: number) => Math.pow(clamp(t / 0.14, 0, 1), 0.45) * (1 - 0.88 * Math.pow(clamp((t - 0.14) / 0.86, 0, 1), 1.15));

/** 鲤科的两室鳔: 前室短而圆, 后室长而向后渐尖, 中间一道细颈 */
const NECK = 0.38;
const NECK_GAP = 0.035;
const twoChamber = (t: number) => {
  const f0 = NECK - NECK_GAP;
  const b0 = NECK + NECK_GAP;
  const front = t < f0 ? Math.pow(Math.sin((Math.PI * t) / f0), 0.55) : 0;
  const u = (t - b0) / (1 - b0);
  const back = t > b0 ? Math.pow(Math.sin(Math.PI * Math.min(1, u * 0.82 + 0.02)), 0.5) * (1 - 0.72 * Math.pow(u, 1.4)) * 0.96 : 0;
  const neck = 0.12 * (1 - smoothstep(NECK_GAP, NECK_GAP + 0.03, Math.abs(t - NECK)));
  return Math.max(front, back, neck);
};

function bladderShape(kind: number, t: number) {
  if (kind === 2) return bell(t, 0.45);
  if (kind === 4) return carrot(t);
  if (kind === 5) return twoChamber(t);
  return bell(t, 0.3) * (1 - 0.35 * t);
}

export const MAX_BLADDER_BRANCHES = 36;

export function buildSwimBladder(body: BodyModel): GeomData {
  const o = body.spec.organs;
  const sb = o.swimBladder;
  const b = new GeomBuilder({ aPulse: 1 });
  const L = body.L;
  const k = sb.kind === 0 ? 0 : sb.size;
  const fat = sb.kind === 3;
  const sc = cavScale(body, (sb.s0 + sb.s1) / 2);
  const v = fat ? 0.2 : sb.v;
  const rOf = (t: number): [number, number] => {
    const shape = bladderShape(sb.kind, t);
    return [sc.hw * 0.55 * k * shape, sc.hh * (fat ? 0.25 : 0.34) * k * shape];
  };
  const axis = cavTube(
    b,
    body,
    [
      [sb.s0, v - 0.05, 0],
      [lerp(sb.s0, sb.s1, 0.3), v, 0],
      [lerp(sb.s0, sb.s1, 0.7), v, 0],
      [sb.s1, v - 0.08, 0],
    ],
    36,
    18,
    rOf,
    () => ({ aPulse: 0 }),
  );
  // 鳔管 (喉鳔类): 连到食道. 鲤科的鳔管从后室前端伸出
  const duct = sb.kind === 1 || sb.kind === 5 ? 1 : 0;
  const g = body.spec.gill;
  const p0 = body.cavityPoint(lerp(sb.s0, sb.s1, sb.kind === 5 ? NECK + 0.06 : 0.08), v - 0.3, 0.05);
  const p1 = body.bodyPoint(g.arches[1] + 0.03, 0.02, 0.05);
  const pts = smoothPath([p0, p0.clone().lerp(p1, 0.5).add(new THREE.Vector3(0, -0.006 * L, 0)), p1], 12);
  tube(b, pts, () => 0.0016 * L * duct * k, 6, { capRings: 1, ex: () => ({ aPulse: 1 }) });

  // 石首鱼的侧枝: 每条从鳔侧壁伸出, 先分出背枝与腹枝, 腹枝再分成前后两小枝, 贴着体壁排成梳状.
  // 拓扑固定 (没有侧枝的物种半径为零), 以便逐顶点变形.
  const n = sb.kind === 4 ? Math.min(MAX_BLADDER_BRANCHES, Math.round(sb.branches)) : 0;
  const at = (t: number) => {
    const f = clamp(t, 0, 1) * (axis.length - 1);
    const i = Math.min(axis.length - 2, Math.floor(f));
    return axis[i].clone().lerp(axis[i + 1], f - i);
  };
  const ex = () => ({ aPulse: 0 });
  for (let i = 0; i < MAX_BLADDER_BRANCHES; i++) {
    const on = i < n ? k : 0;
    const t = n > 0 ? lerp(0.1, 0.84, (i + 0.5) / n) : 0.5;
    const [rw, rh] = rOf(t);
    const c = at(t);
    const sAt = lerp(sb.s0, sb.s1, t);
    const wall = body.cavityFrame(clamp(sAt, o.cavity.s0 + 0.01, o.cavity.s1 - 0.01)).hw * L;
    const gap = Math.max(wall * 0.92 - rw, 0.2 * rw);
    // 越往后侧枝越短
    const len = (0.55 + 0.45 * (1 - t)) * sc.hh * 0.34 * k;
    const r0 = 0.0021 * L * on;
    for (const side of [1, -1]) {
      const V = (dx: number, dy: number, dz: number) => new THREE.Vector3(dx * L, dy, dz * side);
      const root = c.clone().add(new THREE.Vector3(0, -0.12 * rh, side * rw * 0.94));
      const fork = root.clone().add(V(0.0025, -0.18 * len, 0.55 * gap));
      const dTip = fork.clone().add(V(-0.003, 0.95 * len, 0.4 * gap));
      const vMid = fork.clone().add(V(0.002, -0.7 * len, 0.38 * gap));
      const aTip = vMid.clone().add(V(-0.006, -0.85 * len, 0.06 * gap));
      const pTip = vMid.clone().add(V(0.006, -0.7 * len, 0.06 * gap));
      const seg = (a: THREE.Vector3, z: THREE.Vector3, bend: THREE.Vector3, r1: number, r2: number) => {
        const path = smoothPath([a, a.clone().lerp(z, 0.5).add(bend), z], 6);
        tube(b, path, (j) => lerp(r1, r2, j / 5), 5, { capRings: 1, ex });
      };
      const out = V(0, 0, 0.12 * gap);
      seg(root, fork, V(0, -0.05 * len, 0), r0, r0 * 0.85);
      seg(fork, dTip, out, r0 * 0.75, r0 * 0.35);
      seg(fork, vMid, out, r0 * 0.8, r0 * 0.6);
      seg(vMid, aTip, V(0, 0, 0.04 * gap), r0 * 0.55, r0 * 0.25);
      seg(vMid, pTip, V(0, 0, 0.04 * gap), r0 * 0.55, r0 * 0.25);
    }
  }
  return b.build();
}

/** 发声肌: 鳔两侧贴着体壁的一对薄带状红肌, 快速收缩时带动鳔壁振动. */
export function buildSonicMuscle(body: BodyModel): GeomData {
  const o = body.spec.organs;
  const sb = o.swimBladder;
  const b = new GeomBuilder({ aPulse: 1 });
  const k = o.sonicMuscle;
  const sc = cavScale(body, (sb.s0 + sb.s1) / 2);
  const s0 = lerp(sb.s0, sb.s1, 0.03);
  const s1 = lerp(sb.s0, sb.s1, 0.7);
  // 贴在鳔腹外侧的体壁上, 比鳔略靠下, 让鳔的上半部和背侧的侧枝露出来
  for (const side of [1, -1]) {
    cavTube(
      b,
      body,
      [
        [s0, sb.v - 0.3, side * 0.88],
        [lerp(s0, s1, 0.3), sb.v - 0.24, side * 0.94],
        [lerp(s0, s1, 0.7), sb.v - 0.28, side * 0.94],
        [s1, sb.v - 0.36, side * 0.88],
      ],
      24,
      10,
      (t) => {
        const r = bell(t, 0.35);
        return [sc.hw * 0.04 * k * r + 1e-6, sc.hh * 0.14 * k * r + 1e-6];
      },
      () => ({ aPulse: 0 }),
    );
  }
  return b.build();
}

export function swimBladderCenter(body: BodyModel) {
  const sb = body.spec.organs.swimBladder;
  // 胡萝卜形的鳔体积集中在前半段
  const t = sb.kind === 4 ? 0.32 : 0.5;
  return body.cavityPoint(lerp(sb.s0, sb.s1, t), sb.kind === 3 ? 0.2 : sb.v, 0);
}

// ---------- 肾, 膀胱, 性腺 ----------
export function buildKidney(body: BodyModel): GeomData {
  const o = body.spec.organs;
  const sk = body.spec.skeleton;
  const b = new GeomBuilder();
  const L = body.L;
  const n = 40;
  const s0 = sk.spineStart + 0.005;
  const s1 = o.cavity.s1 - 0.005;
  const pts: THREE.Vector3[] = [];
  const rad: number[] = [];
  const sq: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const s = lerp(s0, s1, t);
    const r = centrumR(body, s);
    const headK = Math.exp(-Math.pow((t - 0.04) / 0.08, 2));
    const rr = (0.0045 * L + headK * 0.006 * L) * o.kidney.size * (0.6 + 0.4 * bell(t, 0.2));
    const p = spinePoint(body, s).add(new THREE.Vector3(0, -r * 1.35 - rr * 0.55, 0));
    pts.push(p);
    rad.push(rr * 1.6);
    sq.push(0.38);
  }
  tube(b, pts, (i) => rad[i], 12, { capRings: 3, squash: (i) => sq[i], up: new THREE.Vector3(0, 0, 1) });
  return b.build();
}

export function buildUrinaryBladder(body: BodyModel): GeomData {
  const o = body.spec.organs;
  const b = new GeomBuilder();
  const L = body.L;
  const c = body.cavityPoint(o.cavity.s1 - 0.02, -0.1, 0);
  const r = 0.007 * L;
  tube(b, smoothPath([c.clone().add(new THREE.Vector3(-r, r, 0)), c, c.clone().add(new THREE.Vector3(r, -r * 1.5, 0))], 8), (i) => r * bell(i / 7, 0.4) + r * 0.05, 10, { capRings: 3 });
  return b.build();
}

export function buildGonads(body: BodyModel): GeomData {
  const o = body.spec.organs;
  const gd = o.gonad;
  const b = new GeomBuilder();
  const sc = cavScale(body, (gd.s0 + gd.s1) / 2);
  for (const side of [1, -1]) {
    cavTube(
      b,
      body,
      [
        [gd.s0, 0.25, side * 0.3],
        [lerp(gd.s0, gd.s1, 0.4), 0.05, side * 0.55],
        [lerp(gd.s0, gd.s1, 0.8), -0.05, side * 0.45],
        [gd.s1, 0.05, side * 0.2],
      ],
      32,
      12,
      (t) => [sc.hw * 0.3 * gd.size * bell(t, 0.45), sc.hh * 0.36 * gd.size * bell(t, 0.5)],
    );
  }
  return b.build();
}

// ---------- 心脏 ----------
export function heartCenter(body: BodyModel) {
  const h = body.spec.organs.heart;
  return body.bodyPoint(h.s, h.h, 0);
}

export const HEART_CHAMBERS = [
  { name: 'sinus', off: [0.85, 0.45, 0], rad: [0.42, 0.32, 1.05], color: '#5a1b2a' },
  { name: 'atrium', off: [0.05, 0.42, 0.18], rad: [0.78, 0.52, 0.78], color: '#8a1f2c' },
  { name: 'ventricle', off: [0.12, -0.38, 0], rad: [0.72, 0.62, 0.64], color: '#a3232a' },
  { name: 'bulbus', off: [-0.95, -0.12, 0], rad: [0.5, 0.33, 0.33], color: '#e6c9c2' },
];

export function heartScale(body: BodyModel) {
  return 0.022 * body.L * body.spec.organs.heart.size;
}

export function buildHeart(body: BodyModel): GeomData {
  const b = new GeomBuilder({ aPulse: 1, color: 3 });
  const c = heartCenter(body);
  const r = heartScale(body);
  const P = new THREE.Vector3();
  const N = new THREE.Vector3();
  HEART_CHAMBERS.forEach((ch, gi) => {
    const col = new THREE.Color(ch.color);
    const cc = c.clone().add(new THREE.Vector3(ch.off[0] * r, ch.off[1] * r, ch.off[2] * r));
    const seg = 20;
    const rings = 14;
    const base = b.count;
    for (let j = 0; j <= rings; j++) {
      const ph = (j / rings) * Math.PI;
      for (let i = 0; i <= seg; i++) {
        const th = (i / seg) * Math.PI * 2;
        const d = new THREE.Vector3(Math.cos(th) * Math.sin(ph), Math.cos(ph), Math.sin(th) * Math.sin(ph));
        let k = 1;
        // 心室: 尖端朝后下方的圆锥形
        if (ch.name === 'ventricle') k = 1 + 0.35 * Math.max(0, d.x * 0.6 - d.y * 0.8);
        // 动脉球: 前端收细成腹主动脉
        if (ch.name === 'bulbus') k = 1 - 0.45 * Math.max(0, -d.x);
        P.set(d.x * ch.rad[0] * r * k, d.y * ch.rad[1] * r * k, d.z * ch.rad[2] * r * k).add(cc);
        N.set(d.x / ch.rad[0], d.y / ch.rad[1], d.z / ch.rad[2]).normalize();
        b.add(P, N, i / seg, j / rings, { aPulse: gi, color: [col.r, col.g, col.b] });
      }
    }
    const row = seg + 1;
    for (let j = 0; j < rings; j++) for (let i = 0; i < seg; i++) {
      const a = base + j * row + i;
      b.quad(a, a + 1, a + row + 1, a + row);
    }
  });
  return b.build();
}

export function heartChamberCenters(body: BodyModel) {
  const c = heartCenter(body);
  const r = heartScale(body);
  return HEART_CHAMBERS.map((ch) => c.clone().add(new THREE.Vector3(ch.off[0] * r, ch.off[1] * r, ch.off[2] * r)));
}

// ---------- 脑与脊髓 ----------
export function brainCenter(body: BodyModel) {
  const br = body.spec.organs.brain;
  const L = body.L;
  const s = br.s;
  const yTop = (body.axis(s) + body.top(s)) * L - 0.012 * L;
  const rb = 0.011 * L * br.size;
  return new THREE.Vector3((s - 0.5) * L, yTop - rb * 1.5, 0);
}

export function buildBrain(body: BodyModel): GeomData {
  const br = body.spec.organs.brain;
  const b = new GeomBuilder({ color: 3 });
  const L = body.L;
  const rb = 0.011 * L * br.size;
  const c = brainCenter(body);
  const lobes: { o: [number, number, number]; r: [number, number, number]; col: string; pair?: boolean }[] = [
    { o: [-2.25, -0.05, 0.3], r: [0.36, 0.26, 0.24], col: '#e8c7b8', pair: true }, // 嗅球
    { o: [-1.65, 0, 0.42], r: [0.62, 0.5, 0.45], col: '#e9c0b0', pair: true }, // 端脑
    { o: [-0.25, 0.15, 0.55], r: [0.9 * br.tectum, 0.72 * br.tectum, 0.62 * br.tectum], col: '#e7b6a6', pair: true }, // 视顶盖
    { o: [1.05, 0.42, 0], r: [0.62, 0.55, 0.55], col: '#ecc9b7' }, // 小脑
    { o: [1.9, -0.18, 0], r: [0.95, 0.42, 0.45], col: '#eed3c4' }, // 延脑
    { o: [-0.3, -0.75, 0], r: [0.45, 0.3, 0.35], col: '#e0a99a' }, // 下丘脑
  ];
  for (const lb of lobes) {
    const sides = lb.pair ? [1, -1] : [1];
    const col = new THREE.Color(lb.col);
    for (const side of sides) {
      const cc = c.clone().add(new THREE.Vector3(lb.o[0] * rb, lb.o[1] * rb, lb.o[2] * rb * side));
      const seg = 16;
      const rings = 10;
      const base = b.count;
      for (let j = 0; j <= rings; j++) {
        const ph = (j / rings) * Math.PI;
        for (let i = 0; i <= seg; i++) {
          const th = (i / seg) * Math.PI * 2;
          const d = new THREE.Vector3(Math.cos(th) * Math.sin(ph), Math.cos(ph), Math.sin(th) * Math.sin(ph));
          const P = new THREE.Vector3(d.x * lb.r[0] * rb, d.y * lb.r[1] * rb, d.z * lb.r[2] * rb).add(cc);
          const N = new THREE.Vector3(d.x / lb.r[0], d.y / lb.r[1], d.z / lb.r[2]).normalize();
          b.add(P, N, i / seg, j / rings, { color: [col.r, col.g, col.b] });
        }
      }
      const row = seg + 1;
      for (let j = 0; j < rings; j++) for (let i = 0; i < seg; i++) {
        const a = base + j * row + i;
        b.quad(a, a + 1, a + row + 1, a + row);
      }
    }
  }
  // 视神经: 从眼球后方到视交叉
  const ec = body.eyeCenter(new THREE.Vector3());
  const chiasm = c.clone().add(new THREE.Vector3(-0.9 * rb, -0.85 * rb, 0));
  const nc = new THREE.Color('#efe0cf');
  for (const side of [1, -1]) {
    const e = ec.clone();
    e.z *= side;
    e.x += body.spec.eye.r * L * 0.4;
    e.z -= side * body.spec.eye.r * L * 0.7;
    const pts = smoothPath([e, e.clone().lerp(chiasm, 0.5).add(new THREE.Vector3(0, -0.2 * rb, 0)), chiasm], 10);
    tube(b, pts, () => 0.18 * rb, 6, { capRings: 1, ex: () => ({ color: [nc.r, nc.g, nc.b] }) });
  }
  return b.build();
}

export function buildSpinalCord(body: BodyModel): GeomData {
  const sk = body.spec.skeleton;
  const b = new GeomBuilder();
  const L = body.L;
  const c = brainCenter(body);
  const rb = 0.011 * L * body.spec.organs.brain.size;
  const pts: THREE.Vector3[] = [c.clone().add(new THREE.Vector3(2.4 * rb, -0.15 * rb, 0))];
  const n = 56;
  for (let i = 0; i < n; i++) {
    const s = lerp(sk.spineStart, 0.975, i / (n - 1));
    pts.push(spinePoint(body, s).add(new THREE.Vector3(0, centrumR(body, s) * 1.55, 0)));
  }
  const P = smoothPath(pts, 64);
  tube(b, P, (i) => 0.0022 * L * (1 - 0.6 * (i / 63)), 6, { capRings: 2 });
  return b.build();
}

// ---------- 鳃丝 ----------
export function buildGillFilaments(body: BodyModel): GeomData {
  const sp = body.spec;
  const b = new GeomBuilder({ aPulse: 1 });
  const L = body.L;
  const nArch = sp.gill.slits > 0 ? 5 : 4;
  const per = 22;
  const P = new THREE.Vector3();
  const N = new THREE.Vector3();
  for (let k = 0; k < 5; k++) {
    const active = k < nArch ? sp.organs.gills.size : 0;
    for (const side of [1, -1]) {
      const path = gillArchPath(body, k, side, per + 2);
      for (let i = 1; i <= per; i++) {
        const t = i / (per + 1);
        const p = path[i];
        const tan = path[i + 1].clone().sub(path[i - 1]).normalize();
        const out = new THREE.Vector3(0.55, 0, side * 0.85).normalize();
        out.addScaledVector(tan, -out.dot(tan)).normalize();
        const len = 0.03 * L * active * Math.pow(Math.sin(Math.PI * t), 0.5) * (1 - 0.12 * k);
        const w = 0.0028 * L * active;
        for (const row of [-1, 1]) {
          // 两排鳃丝呈 V 形张开
          const d = out.clone().applyAxisAngle(tan, row * 0.32).normalize();
          const nrm = tan.clone().cross(d).normalize();
          const base = b.count;
          const segs = 4;
          for (let j = 0; j <= segs; j++) {
            const f = j / segs;
            const c = p.clone().addScaledVector(d, len * f);
            const ww = w * (1 - 0.7 * f);
            for (const e of [-1, 1]) {
              P.copy(c).addScaledVector(tan, (e * ww) / 2);
              N.copy(nrm);
              b.add(P, N, f, e > 0 ? 1 : 0, { aPulse: 0 });
            }
          }
          for (let j = 0; j < segs; j++) {
            const a = base + j * 2;
            b.quad(a, a + 1, a + 3, a + 2);
          }
        }
      }
    }
  }
  return b.build();
}

// ---------- 红肌 ----------
// 多数鱼: 沿水平隔 (侧线) 分布在皮下的一条薄带; 金枪鱼: 深入体内靠近脊柱, 便于保温.
export function buildRedMuscle(body: BodyModel): GeomData {
  const o = body.spec.organs;
  const b = new GeomBuilder();
  const L = body.L;
  const deep = o.redMuscleDepth;
  for (const side of [1, -1]) {
    const pts: THREE.Vector3[] = [];
    const rad: number[] = [];
    const n = 50;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const s = lerp(0.24, 0.97, t);
      const h = lerp(body.lateralH(s), body.spineH(s), deep);
      const u = lerp(0.9, 0.3, deep);
      pts.push(body.bodyPoint(s, h, side * u));
      rad.push(Math.max(1e-6, o.redMuscle * body.height(s) * L * lerp(0.55, 0.75, deep) * bell(t, 0.3)));
    }
    tube(b, pts, (i) => rad[i], 10, { capRings: 2, squash: lerp(0.28, 0.85, deep), up: new THREE.Vector3(0, 0, 1) });
  }
  return b.build();
}
