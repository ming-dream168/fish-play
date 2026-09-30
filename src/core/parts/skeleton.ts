// 骨骼系统. 每个结构都从 BodyModel 推导位置, 数量上限固定, 超出物种实际数量的槽位塌缩.

import * as THREE from 'three';
import type { BodyModel } from '../body';
import { GeomBuilder, InstanceWriter, tube, type GeomData, type InstanceData } from '../geom';
import { clamp, lerp, smoothstep } from '../math';
import { finFrame, FIN_RES } from './fins';

export const MAX_VERT = 130;

// ---------- 小工具 ----------
type Ex = Record<string, number | number[]>;

/** 两点间的锥形杆 (可带弯曲). */
function rod(
  b: GeomBuilder,
  p0: THREE.Vector3,
  p1: THREE.Vector3,
  r0: number,
  r1: number,
  opts: { segs?: number; radial?: number; bend?: THREE.Vector3; ex?: Ex; squash?: number } = {},
) {
  const segs = opts.segs ?? 4;
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < segs; i++) {
    const t = i / (segs - 1);
    const p = p0.clone().lerp(p1, t);
    if (opts.bend) p.addScaledVector(opts.bend, Math.sin(Math.PI * t));
    pts.push(p);
  }
  tube(b, pts, (i) => lerp(r0, r1, i / (segs - 1)), opts.radial ?? 4, { capRings: 1, ex: () => opts.ex ?? {}, squash: opts.squash });
}

function pathTube(b: GeomBuilder, pts: THREE.Vector3[], r: (t: number) => number, radial = 5, ex?: (t: number) => Ex, squash?: number) {
  const n = pts.length;
  tube(b, pts, (i) => r(i / (n - 1)), radial, { capRings: 2, ex: ex ? (i) => ex(i / (n - 1)) : undefined, squash });
}

function catmull(ctrl: THREE.Vector3[], n: number) {
  let len = 0;
  for (let i = 1; i < ctrl.length; i++) len += ctrl[i].distanceTo(ctrl[i - 1]);
  if (len < 1e-7) return Array.from({ length: n }, () => ctrl[0].clone());
  const c = new THREE.CatmullRomCurve3(ctrl, false, 'catmullrom', 0.5);
  return Array.from({ length: n }, (_, i) => c.getPoint(i / (n - 1)));
}

/** 椎体中心线. */
/** 歪尾 (鲨): 脊柱一直伸进尾鳍上叶. 其它鱼的脊柱止于尾鳍基部. */
export function spineEnd(body: BodyModel) {
  const sk = body.spec.skeleton;
  return 0.985 + (sk.caudalUp > 0.3 ? sk.caudalExt * 0.85 : 0);
}

export function vertebraS(body: BodyModel, i: number) {
  const sk = body.spec.skeleton;
  const n = Math.max(1, sk.vertebrae);
  const s0 = sk.spineStart;
  const s1 = spineEnd(body);
  return s0 + (s1 - s0) * ((i + 0.5) / n);
}

export function spinePoint(body: BodyModel, s: number, out = new THREE.Vector3()) {
  const sk = body.spec.skeleton;
  let y = body.spineY(Math.min(s, 1));
  // 末端上翘 (尾杆骨 / 歪尾)
  const up = smoothstep(0.9, 1.0, s) * sk.caudalUp * body.height(Math.min(s, 1));
  y += up;
  // 伸出身体之后沿尾鳍上叶的方向继续上扬 (矛尾鱼 caudalUp = 0, 直直伸进中央小尾叶)
  let x = s;
  if (s > 1) {
    const a = Math.min(1.0, sk.caudalUp * 1.3);
    const d = s - 1;
    x = 1 + d * Math.cos(a);
    y += d * Math.sin(a);
  }
  return out.set((x - 0.5) * body.L, y * body.L, 0);
}

export function centrumR(body: BodyModel, s: number) {
  const sk = body.spec.skeleton;
  const h = body.height(clamp(s, 0.2, 1));
  const hMax = Math.max(body.height(0.35), body.height(0.5));
  return sk.centrumR * body.L * (0.45 + 0.55 * Math.sqrt(clamp(h / hMax, 0, 1)));
}

// ---------- 椎体 (实例化) ----------
export function buildCentrumUnit(): GeomData {
  // 双凹形椎体: 沿 x 的沙漏形, 两端内凹
  const b = new GeomBuilder();
  const seg = 14;
  const rings = 10;
  const P = new THREE.Vector3();
  const N = new THREE.Vector3();
  for (let j = 0; j <= rings; j++) {
    const t = j / rings;
    const x = t - 0.5;
    const r = 1 - 0.3 * (1 - Math.pow(2 * x, 2));
    for (let i = 0; i <= seg; i++) {
      const a = (i / seg) * Math.PI * 2;
      P.set(x, Math.cos(a) * r, Math.sin(a) * r);
      N.set(0.6 * x * 0.3 * 4, Math.cos(a), Math.sin(a)).normalize();
      b.add(P, N, t, i / seg);
    }
  }
  const row = seg + 1;
  for (let j = 0; j < rings; j++) for (let i = 0; i < seg; i++) {
    const a = j * row + i;
    b.quad(a, a + 1, a + row + 1, a + row);
  }
  // 两端内凹的锥面
  for (const side of [-1, 1]) {
    const c = b.add(new THREE.Vector3(side * 0.28, 0, 0), new THREE.Vector3(side, 0, 0), 0.5, 0.5);
    const ringStart = side < 0 ? 0 : rings * row;
    for (let i = 0; i < seg; i++) {
      if (side < 0) b.tri(c, ringStart + i + 1, ringStart + i);
      else b.tri(c, ringStart + i, ringStart + i + 1);
    }
  }
  return b.build();
}

export function buildCentra(body: BodyModel): InstanceData {
  const sk = body.spec.skeleton;
  const w = new InstanceWriter(MAX_VERT);
  const n = Math.min(MAX_VERT, Math.round(sk.vertebrae));
  const q = new THREE.Quaternion();
  const zAxis = new THREE.Vector3(0, 0, 1);
  const vis = 1 - sk.notochord;
  for (let i = 0; i < n; i++) {
    const s = vertebraS(body, i);
    const p = spinePoint(body, s);
    const p2 = spinePoint(body, s + 0.004);
    const ang = Math.atan2(p2.y - p.y, p2.x - p.x);
    q.setFromAxisAngle(zAxis, ang);
    const len = ((spineEnd(body) - sk.spineStart) / Math.max(1, sk.vertebrae)) * body.L * 0.86;
    const r = centrumR(body, s);
    w.push(p, q.clone(), new THREE.Vector3(len * vis, r * vis, r * vis));
  }
  return w.finish(spinePoint(body, 0.985));
}

// ---------- 脊索 (腔棘鱼) ----------
export function buildNotochord(body: BodyModel): GeomData {
  const sk = body.spec.skeleton;
  const b = new GeomBuilder();
  const pts: THREE.Vector3[] = [];
  const n = 60;
  for (let i = 0; i < n; i++) {
    const s = lerp(sk.spineStart - 0.02, 0.985 + sk.caudalExt, i / (n - 1));
    pts.push(spinePoint(body, s));
  }
  pathTube(b, pts, (t) => centrumR(body, lerp(sk.spineStart, 1, t)) * 1.35 * sk.notochord, 12);
  return b.build();
}

// ---------- 髓弓 / 脉弓 ----------
/** 棘长上限: 棘尖后倾到更靠后的位置, 那里身体更矮; 按棘尖所在 s 迭代, 棘尖留在皮下 0.003 L 以内. */
function capSpine(body: BodyModel, s: number, base: THREE.Vector3, lean: number, len: number, up: 1 | -1) {
  const L = body.L;
  let l = len;
  for (let it = 0; it < 3; it++) {
    const ts = Math.min(1, s + (Math.sin(lean) * l) / L);
    const edge = up > 0 ? (body.axis(ts) + body.top(ts)) * L : (body.axis(ts) - body.bottom(ts)) * L;
    const room = (up > 0 ? edge - base.y : base.y - edge) - 0.003 * L;
    const maxLen = Math.max(0, room) / Math.max(0.2, Math.cos(lean));
    if (l <= maxLen) break;
    l = maxLen;
  }
  return l;
}


export function buildNeuralArches(body: BodyModel): GeomData {
  const sk = body.spec.skeleton;
  const b = new GeomBuilder();
  const L = body.L;
  const n = Math.min(MAX_VERT, Math.round(sk.vertebrae));
  for (let i = 0; i < MAX_VERT; i++) {
    const active = i < n;
    const s = active ? vertebraS(body, i) : 0.985;
    const c = spinePoint(body, s);
    const r = active ? centrumR(body, s) : 0;
    const topY = (body.axis(Math.min(s, 1)) + body.top(Math.min(s, 1))) * L;
    const lean = sk.spineLean + 0.35 * smoothstep(0.55, 1.0, s);
    const reach = Math.max(0, topY - c.y - r) * sk.neuralLen;
    const base = c.clone().add(new THREE.Vector3(0, r * 1.25, 0));
    const len = active ? capSpine(body, s, base, lean, reach / Math.cos(lean), 1) : 0;
    const tip = base.clone().add(new THREE.Vector3(Math.sin(lean) * len, Math.cos(lean) * len, 0));
    const th = Math.max(0.0012 * L, r * 0.22) * (active ? 1 : 0);
    // 髓弓两足 (跨在脊髓上)
    for (const z of [1, -1]) {
      rod(b, c.clone().add(new THREE.Vector3(-r * 0.2, r * 0.35, z * r * 0.85)), base, th * 0.9, th * 0.9, { segs: 3, radial: 3 });
    }
    rod(b, base, tip, th, th * 0.35, { segs: 5, radial: 4, bend: new THREE.Vector3(-len * 0.04, 0, 0) });
  }
  return b.build();
}

export function buildHaemalArches(body: BodyModel): GeomData {
  const sk = body.spec.skeleton;
  const b = new GeomBuilder();
  const L = body.L;
  const n = Math.min(MAX_VERT, Math.round(sk.vertebrae));
  const pre = Math.round(sk.precaudal);
  for (let i = 0; i < MAX_VERT; i++) {
    const active = i < n;
    const s = active ? vertebraS(body, i) : 0.985;
    const c = spinePoint(body, s);
    const r = active ? centrumR(body, s) : 0;
    const caudal = i >= pre;
    const botY = (body.axis(Math.min(s, 1)) - body.bottom(Math.min(s, 1))) * L;
    const lean = sk.spineLean + 0.3 * smoothstep(0.6, 1.0, s);
    const reach = Math.max(0, c.y - r - botY) * sk.haemalLen;
    const base = c.clone().add(new THREE.Vector3(0, -r * 1.25, 0));
    const len = active && caudal ? capSpine(body, s, base, lean, reach / Math.cos(lean), -1) : 0;
    const tip = base.clone().add(new THREE.Vector3(Math.sin(lean) * len, -Math.cos(lean) * len, 0));
    const th = Math.max(0.0012 * L, r * 0.22) * (active ? 1 : 0);
    // 腹椎: 只有短的椎体横突 (肋骨附着点)
    const leg = caudal ? 1 : 0.55;
    for (const z of [1, -1]) {
      const foot = c.clone().add(new THREE.Vector3(-r * 0.2, -r * 0.35, z * r * 0.85));
      const end = caudal ? base : c.clone().add(new THREE.Vector3(r * 0.1, -r * 0.9, z * r * 1.45));
      rod(b, foot, end, th * 0.9 * leg, th * 0.8 * leg, { segs: 3, radial: 3 });
    }
    rod(b, base, tip, th, th * 0.35, { segs: 5, radial: 4, bend: new THREE.Vector3(-len * 0.04, 0, 0) });
  }
  return b.build();
}

// ---------- 肋骨 ----------
export const MAX_RIBS = 44;
export function buildRibs(body: BodyModel): GeomData {
  const sk = body.spec.skeleton;
  const cav = body.spec.organs.cavity;
  const b = new GeomBuilder();
  const L = body.L;
  const n = Math.min(MAX_VERT, Math.round(sk.vertebrae));
  const pts: THREE.Vector3[] = [];
  let made = 0;
  for (let k = 0; k < MAX_RIBS; k++) {
    const i = k + 2;
    const rc = Math.min(sk.ribCount, sk.precaudal - 2);
    const s = vertebraS(body, Math.min(i, n - 1));
    const inCav = s > cav.s0 + 0.004 && s < cav.s1 - 0.01;
    const active = k < rc && inCav && sk.ribs > 0.01;
    for (const side of [1, -1]) {
      pts.length = 0;
      const c = spinePoint(body, s);
      const r = centrumR(body, s);
      const start = c.clone().add(new THREE.Vector3(r * 0.1, -r * 0.9, side * r * 1.45));
      pts.push(start);
      const m = 7;
      for (let j = 1; j <= m; j++) {
        const t = j / m;
        // 沿体腔外壁向下, 同时向后倾斜
        const sj = Math.min(cav.s1 - 0.005, s + 0.03 * t);
        const v = lerp(0.8, 0.85 - 1.7 * sk.ribs, t);
        const p = body.cavityPoint(sj, v, side * 1.07);
        pts.push(active ? p : start.clone());
      }
      const R = active ? Math.max(0.0011 * L, r * 0.2) : 0;
      pathTube(b, catmull(pts, 9), (t) => R * (1 - 0.6 * t), 4);
      made++;
    }
  }
  void made;
  return b.build();
}

// ---------- 肌间骨 ----------
export function buildIntermuscular(body: BodyModel): GeomData {
  const sk = body.spec.skeleton;
  const b = new GeomBuilder();
  const L = body.L;
  const n = Math.min(MAX_VERT, Math.round(sk.vertebrae));
  const lim = 90;
  for (let k = 0; k < lim; k++) {
    const i = k + 1;
    const active = i < n - 6 && sk.intermuscular > 0.01;
    const s = vertebraS(body, Math.min(i, n - 1));
    const c = spinePoint(body, s);
    const r = centrumR(body, s);
    const hTop = body.top(Math.min(s, 1)) * L;
    const hBot = body.bottom(Math.min(s, 1)) * L;
    const w = body.width(Math.min(s, 1)) * L;
    for (const side of [1, -1]) {
      for (const up of [1, -1]) {
        if (up < 0 && i > sk.precaudal + 12) {
          rod(b, c, c, 0, 0, { segs: 2, radial: 3 });
          continue;
        }
        const p0 = c.clone().add(new THREE.Vector3(0, up * r * 1.1, side * r * 0.9));
        const len = (up > 0 ? hTop : hBot) * 0.42 * sk.intermuscular;
        const d = new THREE.Vector3(0.78, up * 0.4, side * 0.55 * Math.min(1, (w * 2.2) / Math.max(1e-6, len))).normalize();
        const p1 = p0.clone().addScaledVector(d, active ? len : 0);
        rod(b, p0, p1, active ? 0.0007 * L : 0, active ? 0.0003 * L : 0, { segs: 2, radial: 3 });
      }
    }
  }
  return b.build();
}

// ---------- 担鳍骨 ----------
export function buildPterygiophores(body: BodyModel): GeomData {
  const b = new GeomBuilder();
  const L = body.L;
  for (const id of ['dorsalFin', 'secondDorsalFin', 'analFin'] as const) {
    const f = body.spec.fins.find((x) => x.id === id)!;
    const res = FIN_RES[id];
    const frame = finFrame(body, f);
    const n = Math.min(res.maxRays, f.rays);
    const up = f.kind === 'dorsal' ? 1 : -1;
    for (let k = 0; k < res.maxRays; k++) {
      const u = n > 1 ? k / (n - 1) : 0.5;
      const p0 = frame.point(u, 0, 1, new THREE.Vector3());
      // 长度近 0 的鳍条槽位 (鮟鱇用背鳍槽位表达分散的头棘) 下面没有担鳍骨
      const rayLen = frame.point(u, 1, 1, new THREE.Vector3()).distanceTo(p0);
      const active = k < n && f.present > 0.01 && f.lobe <= 0 && rayLen > 0.004 * L;
      const s = p0.x / L + 0.5;
      const spY = spinePoint(body, s).y;
      const reach = Math.abs(p0.y - spY) * 0.62;
      const p1 = p0.clone().add(new THREE.Vector3(-0.1 * reach, -up * reach, 0));
      const R = active ? 0.0012 * L : 0;
      rod(b, p0, p1, R, R * 0.4, { segs: 3, radial: 4 });
    }
  }
  return b.build();
}

// ---------- 头骨 ----------
function opEdge(body: BodyModel, h: number) {
  return body.opEdgeS(h);
}

/** 贴合皮下的骨板 (鳃盖骨系, 颅顶). 两侧对称, 闭合成薄壳. */
function conformPlate(
  b: GeomBuilder,
  body: BodyModel,
  sAt: (u: number, v: number) => number,
  hAt: (u: number, v: number) => number,
  inset: number,
  thick: number,
  nu: number,
  nv: number,
  scale: number,
  ex?: (s: number, h: number, side: number) => Ex,
) {
  const P = new THREE.Vector3();
  const N = new THREE.Vector3();
  for (const side of [1, -1]) {
    const layers: number[] = [];
    for (const layer of [0, 1]) {
      const base = b.count;
      layers.push(base);
      for (let j = 0; j <= nv; j++) {
        for (let i = 0; i <= nu; i++) {
          const u = i / nu;
          const v = j / nv;
          const s = sAt(u, v);
          const h = hAt(u, v);
          const th = body.thetaAt(s, h);
          const ins = inset + layer * thick * scale;
          body.surface(s, th, ins, P);
          body.surfaceNormal(s, th, ins, N);
          if (scale <= 0) {
            // 没有这块骨 (鲨): 整块板缩成体内一点, 面积为零, 透明染色时不会留下一块红板
            P.copy(body.bodyPoint(sAt(0.5, 0.5), hAt(0.5, 0.5), 0.3));
          }
          if (layer === 1) N.negate();
          if (side < 0) {
            P.z = -P.z;
            N.z = -N.z;
          }
          b.add(P, N, u, v, ex?.(s, h, side));
        }
      }
    }
    const row = nu + 1;
    const flip = side < 0;
    for (let layer = 0; layer < 2; layer++) {
      const base = layers[layer];
      const f = flip !== (layer === 1);
      for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
        const a = base + j * row + i;
        const c = a + row;
        if (f) b.quad(a, c, c + 1, a + 1);
        else b.quad(a, a + 1, c + 1, c);
      }
    }
    // 侧壁 (四条边)
    const edges: [number, number][][] = [[], [], [], []];
    for (let i = 0; i <= nu; i++) {
      edges[0].push([layers[0] + i, layers[1] + i]);
      edges[2].push([layers[0] + nv * row + i, layers[1] + nv * row + i]);
    }
    for (let j = 0; j <= nv; j++) {
      edges[1].push([layers[0] + j * row + nu, layers[1] + j * row + nu]);
      edges[3].push([layers[0] + j * row, layers[1] + j * row]);
    }
    for (let e = 0; e < 4; e++) {
      const E = edges[e];
      for (let k = 0; k < E.length - 1; k++) {
        const [o0, i0] = E[k];
        const [o1, i1] = E[k + 1];
        if ((e === 0 || e === 1) !== flip) b.quad(o0, i0, i1, o1);
        else b.quad(o0, o1, i1, i0);
      }
    }
  }
}

function operWeight(body: BodyModel, s: number, h: number, side: number) {
  const g = body.spec.gill;
  if (g.slits > 0 || g.flare <= 0) return 0;
  const se = body.opEdgeS(h);
  const vert = smoothstep(g.top, g.top - 0.25, h) * smoothstep(g.bottom, g.bottom + 0.2, h);
  return smoothstep(se - 0.09, se - 0.005, s) * vert * side;
}

export function buildNeurocranium(body: BodyModel): GeomData {
  const sp = body.spec;
  const sk = sp.skeleton;
  const b = new GeomBuilder();
  const L = body.L;
  const e = sp.eye;
  const sA = 0.012;
  const sB = sk.spineStart + 0.004;
  const rings = 44;
  const radial = 28;
  const P = new THREE.Vector3();
  const N = new THREE.Vector3();
  const pinch = (s: number) => Math.exp(-Math.pow((s - e.s) / (e.r * 1.6 + 0.012), 2));
  const frame = (s: number) => {
    const t = (s - sA) / (sB - sA);
    const top = (body.axis(s) + body.top(s)) * L - 0.006 * L;
    const hn = body.top(s) * L * lerp(0.22, 0.42, smoothstep(0, 0.6, t)) * sk.skullScale;
    const wf = lerp(0.3, 0.72, smoothstep(0.35, 0.9, t)) * (1 - 0.55 * pinch(s));
    const wn = body.width(s) * L * wf * sk.skullScale;
    const cap = Math.sqrt(Math.max(0, 1 - Math.pow(1 - smoothstep(0, 0.06, t), 2))) * Math.sqrt(Math.max(0, 1 - Math.pow(smoothstep(0.92, 1.0, t), 2)));
    return { yc: top - hn, hn: hn * cap, wn: wn * cap };
  };
  const pt = (s: number, a: number, out: THREE.Vector3) => {
    const f = frame(s);
    const c = Math.cos(a);
    const sn = Math.sin(a);
    // 顶部隆起的枕嵴
    const crest = sn > 0 ? 1 + 0.25 * smoothstep(0.6, 1, (s - sA) / (sB - sA)) * Math.pow(sn, 8) : 1;
    return out.set((s - 0.5) * L, f.yc + Math.sign(sn) * Math.pow(Math.abs(sn), 0.8) * f.hn * crest, Math.sign(c) * Math.pow(Math.abs(c), 0.8) * f.wn);
  };
  const q0 = new THREE.Vector3();
  const q1 = new THREE.Vector3();
  const r0 = new THREE.Vector3();
  const r1 = new THREE.Vector3();
  const base = b.count;
  for (let i = 0; i <= rings; i++) {
    const s = lerp(sA, sB, i / rings);
    for (let k = 0; k <= radial; k++) {
      const a = -Math.PI / 2 + (k / radial) * Math.PI * 2;
      pt(s, a, P);
      pt(Math.max(sA, s - 0.001), a, q0);
      pt(Math.min(sB, s + 0.001), a, q1);
      pt(s, a - 0.02, r0);
      pt(s, a + 0.02, r1);
      N.crossVectors(q1.sub(q0), r1.sub(r0));
      if (N.lengthSq() < 1e-16) N.set(i === 0 ? -1 : 1, 0, 0);
      N.normalize();
      b.add(P, N, i / rings, k / radial);
    }
  }
  const row = radial + 1;
  for (let i = 0; i < rings; i++) for (let k = 0; k < radial; k++) {
    const a = base + i * row + k;
    b.quad(a, a + row, a + row + 1, a + 1);
  }
  // 副蝶骨: 颅底长杆
  const f0 = frame(e.s);
  const f1 = frame(sB - 0.01);
  rod(b, new THREE.Vector3((e.s - 0.03 - 0.5) * L, f0.yc - f0.hn * 0.9, 0), new THREE.Vector3((sB - 0.01 - 0.5) * L, f1.yc - f1.hn * 0.95, 0), 0.0022 * L, 0.0016 * L, { segs: 5, radial: 5 });
  // 围眶骨: 环绕眼眶, 上方开口
  const ec = body.eyeCenter(new THREE.Vector3());
  const er = e.r * L * 1.18;
  for (const side of [1, -1]) {
    const ring: THREE.Vector3[] = [];
    for (let k = 0; k < 22; k++) {
      const a = lerp(0.35, Math.PI * 2 - 0.35, k / 21) + Math.PI / 2;
      const p = new THREE.Vector3(ec.x + Math.cos(a) * er * 1.05, ec.y + Math.sin(a) * er, ec.z * side - side * er * 0.15);
      ring.push(p);
    }
    pathTube(b, ring, (t) => 0.0018 * L * (1 + 0.8 * Math.exp(-Math.pow((t - 0.35) / 0.12, 2))), 4, undefined, 0.5);
  }
  // 吻软骨 (软骨鱼): 三根支撑吻部
  const ro = sk.rostrum;
  const f2 = frame(sA + 0.03);
  const tip = new THREE.Vector3((0.004 - 0.5) * L, body.axis(0.004) * L, 0);
  for (const z of [0, 1, -1]) {
    const start = new THREE.Vector3((sA + 0.03 - 0.5) * L, f2.yc + (z === 0 ? f2.hn * 0.8 : -f2.hn * 0.6), z * f2.wn * 0.8);
    rod(b, start, start.clone().lerp(tip, ro > 0 ? 1 : 0), 0.0028 * L * ro, 0.0018 * L * ro, { segs: 4, radial: 5 });
  }
  return b.build();
}

/** 颌骨: 上颌 (前颌骨 + 上颌骨), 下颌 (齿骨 + 关节骨), 带 aJaw 权重. */
export function buildJaws(body: BodyModel): GeomData {
  const sp = body.spec;
  const m = sp.mouth;
  const sk = sp.skeleton;
  const b = new GeomBuilder({ aJaw: 1 });
  const L = body.L;
  const beak = sk.beak;
  for (const lower of [0, 1]) {
    for (const side of [1, -1]) {
      const pts: THREE.Vector3[] = [];
      const n = 14;
      const sEnd = lower ? m.corner + m.jawLen : m.corner + 0.004;
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        const s = lerp(0.006, sEnd, t);
        const sm = Math.min(s, m.corner);
        const hm = body.mouthH(sm) + (lower ? -0.08 : 0.07) * (1 - 0.4 * t);
        const th = body.thetaAt(s, hm);
        const p = body.surface(s, th, 0.007 + 0.004 * t, new THREE.Vector3());
        p.z *= side;
        if (i === 0) p.z *= 0.4;
        pts.push(p);
      }
      const R0 = 0.0026 * L * sk.jawBone;
      pathTube(
        b,
        pts,
        (t) => R0 * (lower ? lerp(0.7, 1.35, t) : lerp(0.8, 1.2, Math.sin(Math.PI * t))) * (1 + beak * 0.8 * (1 - t)),
        6,
        () => ({ aJaw: lower }),
        0.7,
      );
    }
  }
  return b.build();
}

/** 鳃盖骨系与悬器: 贴合颊部的骨板, 随鳃盖外张. */
export function buildOpercular(body: BodyModel): GeomData {
  const sp = body.spec;
  const sk = sp.skeleton;
  const g = sp.gill;
  const b = new GeomBuilder({ aOper: 1 });
  const sc = sk.opercle;
  const ex = (s: number, h: number, side: number): Ex => ({ aOper: operWeight(body, s, h, side) });
  const top = Math.min(g.top, 0.7);
  // 主鳃盖骨
  conformPlate(
    b,
    body,
    (u, v) => {
      const h = lerp(-0.12, top - 0.05, v);
      const se = opEdge(body, h);
      return lerp(se - 0.05, se - 0.004, u);
    },
    (_u, v) => lerp(-0.12, top - 0.05, v),
    0.0035,
    0.0022,
    8,
    8,
    sc,
    ex,
  );
  // 下鳃盖骨
  conformPlate(
    b,
    body,
    (u, v) => {
      const h = lerp(g.bottom + 0.1, -0.14, v);
      const se = opEdge(body, h);
      return lerp(se - 0.065, se - 0.004, u);
    },
    (_u, v) => lerp(g.bottom + 0.1, -0.14, v),
    0.0035,
    0.002,
    8,
    6,
    sc,
    ex,
  );
  // 前鳃盖骨 (新月形)
  conformPlate(
    b,
    body,
    (u, v) => {
      const h = lerp(-0.75, 0.32, v);
      const se = opEdge(body, h);
      const pre = se - 0.036 - 0.012 * (1 - h);
      return lerp(pre - 0.012, pre + 0.006, u);
    },
    (_u, v) => lerp(-0.75, 0.32, v),
    0.0038,
    0.0026,
    3,
    10,
    sc,
    ex,
  );
  // 间鳃盖骨
  conformPlate(
    b,
    body,
    (u, v) => {
      const h = lerp(-0.9, -0.62, v);
      const se = opEdge(body, h);
      return lerp(se - 0.1, se - 0.045, u);
    },
    (_u, v) => lerp(-0.9, -0.62, v),
    0.004,
    0.0018,
    6,
    3,
    sc,
    ex,
  );
  // 舌颌骨 + 方骨 (悬器): 较深的骨板, 连接颅骨与下颌关节
  conformPlate(
    b,
    body,
    (u, v) => {
      const h = lerp(sp.mouth.cornerH - 0.1, sp.eye.h + 0.15, v);
      const se = opEdge(body, h);
      const pre = se - 0.05;
      return lerp(sp.mouth.corner + 0.01 + 0.03 * v, pre, u);
    },
    (_u, v) => lerp(sp.mouth.cornerH - 0.1, sp.eye.h + 0.15, v),
    0.018,
    0.0022,
    6,
    6,
    sc,
    () => ({ aOper: 0 }),
  );
  return b.build();
}

/** 鳃弓路径 (左侧, 第 k 弓, k=0..4). 鳃丝与鳃弓骨共用. */
export function gillArchPath(body: BodyModel, k: number, side: number, n = 12): THREE.Vector3[] {
  const g = body.spec.gill;
  const t = k / 4;
  const sk = lerp(g.arches[0], g.arches[1], t);
  const ctrl = [
    body.bodyPoint(sk - 0.016, -0.7, side * 0.1),
    body.bodyPoint(sk - 0.004, -0.55, side * 0.42),
    body.bodyPoint(sk + 0.012, -0.28, side * 0.66),
    body.bodyPoint(sk + 0.018, -0.02, side * 0.7),
    body.bodyPoint(sk + 0.01, 0.2, side * 0.52),
    body.bodyPoint(sk - 0.004, 0.34, side * 0.26),
  ];
  // 越靠后的弓越小
  const shrink = 1 - 0.18 * t;
  const c0 = ctrl[3].clone();
  for (const p of ctrl) p.sub(c0).multiplyScalar(shrink).add(c0);
  return catmull(ctrl, n);
}

export function buildGillArches(body: BodyModel): GeomData {
  const sp = body.spec;
  const b = new GeomBuilder();
  const L = body.L;
  const nArch = sp.gill.slits > 0 ? 5 : 4;
  for (let k = 0; k < 5; k++) {
    for (const side of [1, -1]) {
      const pts = gillArchPath(body, k, side, 14);
      const R = k < nArch ? 0.0021 * L * (k === 4 && nArch === 4 ? 0.5 : 1) : 0.0011 * L;
      pathTube(b, pts, (t) => R * (0.8 + 0.4 * Math.sin(Math.PI * t)), 5);
      // 鳃耙: 弓内侧的短刺
      for (let r = 0; r < 10; r++) {
        const i = 1 + Math.floor((r / 10) * 12);
        const p = pts[i];
        const inward = new THREE.Vector3(0.3, 0, -side).normalize();
        rod(b, p, p.clone().addScaledVector(inward, 0.008 * L), R * 0.35, R * 0.12, { segs: 2, radial: 3 });
      }
    }
  }
  // 舌弓 (角舌骨)
  const m = sp.mouth;
  for (const side of [1, -1]) {
    const a = body.bodyPoint(m.corner + 0.01, -0.72, side * 0.12);
    const c = body.bodyPoint(sp.gill.arches[0] + 0.015, -0.82, side * 0.5);
    rod(b, a, c, 0.0028 * L, 0.0024 * L, { segs: 5, radial: 5, bend: new THREE.Vector3(0, -0.004 * L, 0) });
  }
  return b.build();
}

export function buildBranchiostegals(body: BodyModel): GeomData {
  const sp = body.spec;
  const b = new GeomBuilder();
  const L = body.L;
  const n = 14;
  const cnt = Math.min(n, Math.round(sp.skeleton.branchiostegals));
  for (let k = 0; k < n; k++) {
    const active = k < cnt;
    const t = cnt > 1 ? k / (cnt - 1) : 0;
    for (const side of [1, -1]) {
      const sStart = lerp(sp.mouth.corner + 0.02, sp.gill.arches[0] + 0.02, t);
      const hEnd = lerp(-0.95, -0.55, t);
      const sEnd = opEdge(body, hEnd) - 0.004;
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i < 6; i++) {
        const u = i / 5;
        const s = lerp(sStart, sEnd, u);
        const h = lerp(-0.84, hEnd, u);
        const p = body.surface(s, body.thetaAt(s, h), 0.005, new THREE.Vector3());
        p.z *= side;
        pts.push(active ? p : pts[0] ?? p);
      }
      pathTube(b, pts, (u) => (active ? 0.0012 * L * (1 - 0.5 * u) : 0), 4);
    }
  }
  return b.build();
}

export function buildOtoliths(body: BodyModel): GeomData {
  const sp = body.spec;
  const b = new GeomBuilder();
  const L = body.L;
  const sB = sp.skeleton.spineStart;
  const s0 = lerp(sp.eye.s, sB, 0.62);
  const sizes = [
    { ds: 0, h: 0.05, r: [0.0055, 0.0032, 0.0014] },
    { ds: -0.012, h: 0.18, r: [0.0022, 0.0018, 0.001] },
    { ds: 0.008, h: 0.1, r: [0.0022, 0.0016, 0.0009] },
  ];
  const k = sp.skeleton.cartilage > 0.5 ? 0.25 : 1;
  // 石首鱼科的矢耳石特别大, 其余两对不变
  const big = sp.skeleton.otolith;
  sizes[0] = { ds: -0.004 * (big - 1), h: 0.05 - 0.05 * (big - 1), r: sizes[0].r.map((x) => x * big) };
  for (const side of [1, -1]) {
    for (const o of sizes) {
      const c = body.bodyPoint(s0 + o.ds, o.h, side * 0.32);
      const P = new THREE.Vector3();
      const N = new THREE.Vector3();
      const seg = 12;
      const rings = 8;
      const base = b.count;
      for (let j = 0; j <= rings; j++) {
        const ph = (j / rings) * Math.PI;
        for (let i = 0; i <= seg; i++) {
          const th = (i / seg) * Math.PI * 2;
          const d = new THREE.Vector3(Math.cos(ph), Math.sin(ph) * Math.cos(th), Math.sin(ph) * Math.sin(th));
          // 矢耳石的锯齿缘
          const wob = 1 + 0.12 * Math.sin(th * 7) * Math.sin(ph);
          P.set(d.x * o.r[0], d.y * o.r[1] * wob, d.z * o.r[2]).multiplyScalar(L * k).add(c);
          N.set(d.x / o.r[0], d.y / o.r[1], d.z / o.r[2]).normalize();
          b.add(P, N, i / seg, j / rings);
        }
      }
      const row = seg + 1;
      for (let j = 0; j < rings; j++) for (let i = 0; i < seg; i++) {
        const a = base + j * row + i;
        b.quad(a, a + row, a + row + 1, a + 1);
      }
    }
  }
  return b.build();
}

export function buildPectoralGirdle(body: BodyModel): GeomData {
  const sp = body.spec;
  const b = new GeomBuilder();
  const L = body.L;
  const g = sp.gill;
  const fin = sp.fins.find((f) => f.id === 'pectoralFin')!;
  for (const side of [1, -1]) {
    // 匙骨 (或软骨鱼的肩带): 沿鳃盖后缘内侧, 由背侧弯到腹中线
    const pts: THREE.Vector3[] = [];
    const n = 14;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const h = lerp(Math.min(0.6, g.top - 0.1), -0.97, t);
      const s = opEdge(body, Math.max(h, g.bottom + 0.02)) + 0.006 - 0.012 * smoothstep(0.75, 1, t);
      const p = body.surface(s, body.thetaAt(s, h), 0.009, new THREE.Vector3());
      p.z *= side * (1 - 0.8 * smoothstep(0.85, 1, t));
      pts.push(p);
    }
    pathTube(b, pts, (t) => 0.0034 * L * (0.7 + 0.5 * Math.sin(Math.PI * t)), 6, undefined, 0.6);
    // 上匙骨 + 后颞骨: 连到颅骨后部
    const top = pts[0];
    const skull = body.bodyPoint(sp.skeleton.spineStart - 0.008, 0.62, side * 0.4);
    rod(b, top, skull, 0.0024 * L, 0.0018 * L, { segs: 4, radial: 4 });
    // 肩胛骨 / 乌喙骨 + 4 根辐状骨: 连到胸鳍基部
    const fb = finFrame(body, fin);
    const baseP = fb.base.clone();
    baseP.z *= side;
    const mid = pts[Math.round(n * 0.62)];
    for (let r = 0; r < 4; r++) {
      const off = new THREE.Vector3(0, (r - 1.5) * 0.004 * L, 0);
      rod(b, mid.clone().add(off), baseP.clone().add(off.multiplyScalar(0.6)), 0.0016 * L * fin.present, 0.0012 * L * fin.present, { segs: 3, radial: 4 });
    }
  }
  return b.build();
}

export function buildPelvicGirdle(body: BodyModel): GeomData {
  const sp = body.spec;
  const b = new GeomBuilder();
  const L = body.L;
  const fin = sp.fins.find((f) => f.id === 'pelvicFin')!;
  const fb = finFrame(body, fin);
  for (const side of [1, -1]) {
    const p0 = fb.base.clone();
    p0.z *= side;
    const s = p0.x / L + 0.5;
    const p1 = body.bodyPoint(s - 0.055, -0.86, side * 0.12);
    const k = fin.present;
    rod(b, p0, p0.clone().lerp(p1, k), 0.0026 * L * k, 0.0012 * L * k, { segs: 4, radial: 5, squash: 0.5 });
    const p2 = body.bodyPoint(s - 0.02, -0.9, side * 0.02);
    rod(b, p0, p0.clone().lerp(p2, k), 0.0016 * L * k, 0.001 * L * k, { segs: 3, radial: 4 });
  }
  return b.build();
}

export function buildCaudalSkeleton(body: BodyModel): GeomData {
  const sp = body.spec;
  const sk = sp.skeleton;
  const b = new GeomBuilder();
  const L = body.L;
  const cf = sp.fins.find((f) => f.id === 'caudalFin')!;
  const frame = finFrame(body, cf);
  // 尾杆骨: 最后一节上翘延伸
  const u0 = spinePoint(body, 0.975);
  const u1 = spinePoint(body, 0.985 + sk.caudalExt);
  rod(b, u0, u1, centrumR(body, 0.98) * 0.8, centrumR(body, 0.98) * 0.3, { segs: 4, radial: 6 });
  // 尾下骨: 扇形排列的扁平骨片, 托住尾鳍鳍条
  const nH = 6;
  for (let k = 0; k < nH; k++) {
    const u = (k + 0.5) / nH;
    const tip = frame.point(u * 0.9 + 0.05, 0, 1, new THREE.Vector3());
    const base = spinePoint(body, 0.965 + 0.01 * (k / nH));
    base.y -= 0.004 * L * (nH / 2 - k) * 0.4;
    rod(b, base, tip, 0.0024 * L * cf.present, 0.0032 * L * cf.present, { segs: 3, radial: 5, squash: 0.35 });
  }
  // 尾上骨
  for (let k = 0; k < 2; k++) {
    const base = spinePoint(body, 0.955 + 0.012 * k);
    const tip = frame.point(0.98, 0, 1, new THREE.Vector3()).lerp(base, 0.35 + 0.2 * k);
    rod(b, base, tip, 0.0014 * L * cf.present, 0.0008 * L * cf.present, { segs: 3, radial: 4 });
  }
  return b.build();
}

/** 肉鳍内骨骼 (腔棘鱼): 与四足动物的肱骨, 尺骨, 桡骨同源. */
export function buildLobedFinSkeleton(body: BodyModel): GeomData {
  const sp = body.spec;
  const b = new GeomBuilder();
  const L = body.L;
  for (const id of ['pectoralFin', 'pelvicFin', 'secondDorsalFin', 'analFin'] as const) {
    const f = sp.fins.find((x) => x.id === id)!;
    const frame = finFrame(body, f);
    const sides = f.kind === 'paired' ? [1, -1] : [1];
    for (const side of sides) {
      const a = frame.base.clone();
      const e = (frame.lobeEnd ?? frame.base).clone();
      if (side < 0) {
        a.z = -a.z;
        e.z = -e.z;
      }
      const k = f.lobe > 0 ? f.present : 0;
      // 中轴: 3 节 (类似肱骨 → 尺骨 → 远端)
      for (let j = 0; j < 3; j++) {
        const p0 = a.clone().lerp(e, j / 3 + 0.03);
        const p1 = a.clone().lerp(e, (j + 1) / 3 - 0.03);
        rod(b, p0, p1, 0.004 * L * k * (1 - 0.2 * j), 0.0034 * L * k * (1 - 0.2 * j), { segs: 3, radial: 6 });
        // 旁侧辐状骨 (类似桡骨)
        const d = e.clone().sub(a);
        const perp = new THREE.Vector3(0, 1, 0).cross(d).normalize();
        if (perp.lengthSq() < 0.5) perp.set(0, 0, 1);
        const q0 = p0.clone().addScaledVector(perp, 0.004 * L);
        const q1 = p1.clone().addScaledVector(perp, 0.0055 * L);
        rod(b, q0, q1, 0.0018 * L * k, 0.0014 * L * k, { segs: 3, radial: 4 });
      }
    }
  }
  return b.build();
}
