// 物种特化结构: 金枪鱼小鳍, 刺鲀棘刺, 鮟鱇钓竿与饵球, 附着雄鱼, 腔棘鱼吻器, 鲨直肠腺, 金枪鱼奇网.
// 与其它部件一样固定拓扑: 物种没有该结构时缩为零, 仍可逐顶点插值.

import * as THREE from 'three';
import type { BodyModel } from '../body';
import { GeomBuilder, InstanceWriter, ellipsoid, recomputeNormals, tube, type GeomData, type InstanceData } from '../geom';
import { clamp, lerp, rng } from '../math';
import { centrumR, spinePoint } from './skeleton';

function smooth(ctrl: THREE.Vector3[], n: number) {
  let len = 0;
  for (let i = 1; i < ctrl.length; i++) len += ctrl[i].distanceTo(ctrl[i - 1]);
  if (len < 1e-7) return Array.from({ length: n }, () => ctrl[0].clone());
  const c = new THREE.CatmullRomCurve3(ctrl, false, 'centripetal', 0.5);
  return Array.from({ length: n }, (_, i) => c.getPoint(i / (n - 1)));
}

// ---------- 小鳍 (金枪鱼第二背鳍与臀鳍之后的一串黄色小鳍) ----------
export const FINLET_MAX = 10;

export function buildFinlets(body: BodyModel): GeomData {
  const fl = body.spec.extras.finlets;
  const L = body.L;
  const b = new GeomBuilder({ color: 3 });
  const yellow = new THREE.Color(fl.color);
  const dark = new THREE.Color('#15171b');
  const P = new THREE.Vector3();
  const N = new THREE.Vector3(0, 0, 1);
  for (const up of [1, -1]) {
    const count = Math.round(up > 0 ? fl.dorsal : fl.ventral);
    for (let i = 0; i < FINLET_MAX; i++) {
      const on = i < count && fl.size > 0;
      const t = count > 1 ? i / (count - 1) : 0;
      const s0 = lerp(fl.s0, fl.s1, on ? t : 0.5);
      const ds = ((fl.s1 - fl.s0) / Math.max(1, count)) * 0.95;
      const edge = (s: number) => (up > 0 ? body.axis(s) + body.top(s) : body.axis(s) - body.bottom(s)) - up * 0.002;
      const size = on ? fl.size * (1 - 0.25 * t) : 0;
      // 小鳍: 前缘直立, 后缘三角形, 尖端朝后上方
      const hgt = size * L;
      const baseLen = on ? ds * 0.72 * L : 0;
      const x0 = (s0 - 0.5) * L;
      // 前缘斜向后上方, 尖端朝后, 后缘略内凹
      const pts: [number, number, number][] = [
        [x0, edge(s0) * L, 0],
        [x0 + baseLen, edge(s0 + ds * 0.72) * L, 0],
        [x0 + baseLen * 0.55 + hgt * 0.95, edge(s0) * L + up * hgt * 0.62, 0],
        [x0 + baseLen * 1.05 + hgt * 0.62, edge(s0 + ds * 0.72) * L + up * hgt * 0.3, 0],
      ];
      const th = on ? 0.0022 * L : 0;
      const base = b.count;
      for (const side of [1, -1]) {
        for (let k = 0; k < 4; k++) {
          const tip = k >= 2 ? 0.35 : 1;
          P.set(pts[k][0], pts[k][1], side * th * tip);
          N.set(0, 0, side);
          // 黄色小鳍, 尖端与后缘发黑
          const c = yellow.clone().lerp(dark, k === 3 ? 0.75 : k === 2 ? 0.35 : 0);
          b.add(P, N, k / 3, side > 0 ? 0 : 1, { color: [c.r, c.g, c.b] });
        }
      }
      const tri = (a: number, c: number, d: number, side: number) => {
        if (side > 0) b.tri(base + a, base + c, base + d);
        else b.tri(base + 4 + a, base + 4 + d, base + 4 + c);
      };
      for (const side of [1, -1]) {
        if (up > 0) {
          tri(0, 1, 3, side);
          tri(0, 3, 2, side);
        } else {
          tri(0, 3, 1, side);
          tri(0, 2, 3, side);
        }
      }
      // 边缘封口
      const edges: [number, number][] = [
        [0, 2],
        [2, 3],
        [3, 1],
      ];
      for (const [a, c] of edges) {
        if (up > 0) b.quad(base + a, base + 4 + a, base + 4 + c, base + c);
        else b.quad(base + a, base + c, base + 4 + c, base + 4 + a);
      }
    }
  }
  const g = b.build();
  recomputeNormals(g);
  return g;
}

// ---------- 棘刺 (刺鲀: 变形的鳞片, 平时向后倒伏, 膨胀时竖立) ----------
export const SPINE_MAX = 300;

export function buildSpines(body: BodyModel): InstanceData {
  const sp = body.spec.extras.spines;
  const w = new InstanceWriter(SPINE_MAX);
  const L = body.L;
  const count = clamp(Math.round(sp.count), 0, SPINE_MAX);
  const P = new THREE.Vector3();
  const Nn = new THREE.Vector3();
  const back = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const r = rng(7);
  // 在体表按准晶格 (黄金角) 撒点, 避开眼, 口与鳍基
  const e = body.spec.eye;
  const placed: [number, number][] = [];
  let tries = 0;
  const golden = Math.PI * (3 - Math.sqrt(5));
  let k = 0;
  while (placed.length < count && tries < count * 8) {
    tries++;
    k++;
    const t = (k + 0.5) / (count * 1.25);
    if (t > 1) break;
    const s = lerp(0.1, 0.83, Math.sqrt(t) * 0.35 + t * 0.65);
    const ang = k * golden * 7.3;
    const theta = ((ang % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
    // 眼, 口周围和鳍基留空
    const hh = Math.sin(theta);
    if (Math.abs(s - e.s) < e.r * 2.6 && Math.abs(hh - e.h) < 0.3 && Math.cos(theta) > 0) continue;
    if (s < body.spec.mouth.corner + 0.03) continue;
    placed.push([s, theta]);
  }
  for (let i = 0; i < placed.length; i++) {
    const [s, theta] = placed[i];
    body.surface(s, theta, 0.001, P);
    body.surfaceNormal(s, theta, 0.001, Nn);
    // 向后倒伏的方向: 沿体表切向朝尾
    const P2 = body.surface(s + 0.01, theta, 0.001, new THREE.Vector3());
    back.subVectors(P2, P);
    if (back.lengthSq() < 1e-12) back.set(1, 0, 0);
    back.normalize();
    dir.copy(back).multiplyScalar(1 - sp.erect).addScaledVector(Nn, sp.erect + 0.12).normalize();
    q.setFromUnitVectors(up, dir);
    // 头背部与体侧的棘更长, 尾部短
    const bias = 1 - 0.55 * clamp((s - 0.55) / 0.3, 0, 1);
    const len = sp.len * L * bias * (0.8 + 0.4 * r());
    const rad = len * 0.075;
    w.push(P.clone().addScaledVector(Nn, -rad * 0.4), q.clone(), new THREE.Vector3(rad, len, rad));
  }
  return w.finish(body.surface(0.4, Math.PI / 2, 0.01));
}

/** 棘刺单元: 三叉的基部 + 细长圆锥, 顶点色从基部的暗色过渡到半透明的象牙色尖端. */
export function buildSpineUnit(): GeomData {
  const b = new GeomBuilder({ color: 3 });
  const seg = 7;
  const rings = 7;
  const P = new THREE.Vector3();
  const N = new THREE.Vector3();
  const baseC = new THREE.Color('#6b5a44');
  const midC = new THREE.Color('#efe6cf');
  const tipC = new THREE.Color('#b9a98a');
  for (let j = 0; j <= rings; j++) {
    const t = j / rings;
    const r = (1 - t) * (1 - 0.1 * t) * (t < 0.08 ? 1.6 - t * 7.5 : 1);
    for (let i = 0; i <= seg; i++) {
      const a = (i / seg) * Math.PI * 2;
      P.set(Math.cos(a) * r, t, Math.sin(a) * r);
      N.set(Math.cos(a), 0.2, Math.sin(a)).normalize();
      const c = t < 0.3 ? baseC.clone().lerp(midC, t / 0.3) : midC.clone().lerp(tipC, (t - 0.3) / 0.7);
      b.add(P, N, i / seg, t, { color: [c.r, c.g, c.b] });
    }
  }
  const row = seg + 1;
  for (let j = 0; j < rings; j++) {
    for (let i = 0; i < seg; i++) {
      const a = j * row + i;
      b.quad(a, a + row, a + row + 1, a + 1);
    }
  }
  return b.build();
}

// ---------- 钓竿与饵球 (鮟鱇: 第一背鳍鳍棘特化) ----------
export function lurePath(body: BodyModel, n = 24): THREE.Vector3[] {
  const lu = body.spec.extras.lure;
  const L = body.L;
  const s = lu.s;
  const base = new THREE.Vector3((s - 0.5) * L, (body.axis(s) + body.top(s)) * L - 0.003 * L, 0);
  const len = lu.len * L;
  // 先向上, 再向前弯, 末端略下垂
  const tilt = lu.tilt;
  // 先向上, 再向前弯到口前方, 饵球垂在嘴边
  const ctrl = [
    base.clone(),
    base.clone().add(new THREE.Vector3(-len * 0.04, len * 0.3, 0)),
    base.clone().add(new THREE.Vector3(-len * (0.24 + 0.1 * tilt), len * 0.46, 0)),
    base.clone().add(new THREE.Vector3(-len * (0.5 + 0.15 * tilt), len * 0.38, 0)),
    base.clone().add(new THREE.Vector3(-len * (0.62 + 0.2 * tilt), len * 0.14, 0)),
  ];
  return smooth(ctrl, n);
}

export function lureTip(body: BodyModel) {
  const pts = lurePath(body, 24);
  return pts[pts.length - 1].clone();
}

export function lureBase(body: BodyModel) {
  return lurePath(body, 24)[0].clone();
}

export function buildIllicium(body: BodyModel): GeomData {
  const lu = body.spec.extras.lure;
  const L = body.L;
  const b = new GeomBuilder({ aFin: 4 });
  const pts = lurePath(body, 24);
  const r0 = lu.len > 0 ? 0.0042 * L : 0;
  tube(b, pts, (i) => r0 * lerp(1.15, 0.55, i / 23), 8, { capRings: 2, ex: (i) => ({ aFin: [0, i / 23, 1, 0] }) });
  return b.build();
}

export function buildEsca(body: BodyModel): GeomData {
  const lu = body.spec.extras.lure;
  const L = body.L;
  const b = new GeomBuilder({ aFin: 4 });
  const tip = lureTip(body);
  const r = 0.02 * L * lu.esca;
  const leaf = clamp(lu.shape, 0, 1);
  const Y = new THREE.Vector3(0, 1, 0);
  const mix = (p: THREE.Vector3, q: THREE.Vector3) => p.clone().lerp(q, leaf);
  // 两片: 球形饵 (深海角鮟鱇) 时两片重合成一个饵球, 顶端有发光小窗;
  // 叶状饵 (鮟鱇科) 时分成左右两片薄皮瓣, 从竿尖向前下方垂着, 略呈 V 形张开
  for (const side of [1, -1]) {
    const k = side > 0 ? 1 : 0.995;
    const rot = (v: THREE.Vector3) => v.applyAxisAngle(Y, side * 0.45);
    const la = rot(new THREE.Vector3(-0.3, -1, 0).normalize().multiplyScalar(r * 1.5));
    const lb = rot(new THREE.Vector3(1, -0.3, 0).normalize().multiplyScalar(r * 0.75));
    const lc = rot(new THREE.Vector3(0, 0, r * 0.12));
    const leafC = tip.clone().addScaledVector(la, 0.85).add(new THREE.Vector3(0, 0, side * r * 0.12));
    const ballC = tip.clone().add(new THREE.Vector3(-r * 0.2, -r * 0.35, 0));
    ellipsoid(b, mix(ballC, leafC), mix(new THREE.Vector3(r * 1.15 * k, 0, 0), la), mix(new THREE.Vector3(0, r * k, 0), lb), mix(new THREE.Vector3(0, 0, r * 0.95 * k), lc), 18, 12, {
      ex: { aFin: [0, 1, 1, 0] },
    });
  }
  // 两根丝状附肢 (叶状饵没有)
  for (const side of [1, -1]) {
    const a = tip.clone().add(new THREE.Vector3(r * 0.4, -r * 1.1, side * r * 0.3));
    const pts = smooth([a, a.clone().add(new THREE.Vector3(r * 0.8, -r * 1.2, side * r * 0.5)), a.clone().add(new THREE.Vector3(r * 1.9, -r * 1.7, side * r * 0.9))], 8);
    tube(b, pts, (i) => r * 0.12 * (1 - i / 9) * (1 - leaf), 5, { capRings: 1, ex: () => ({ aFin: [0, 1, 1, 0] }) });
  }
  return b.build();
}

// ---------- 附着雄鱼 (深海鮟鱇: 体型极小的雄鱼咬住雌鱼腹部) ----------
export function buildMale(body: BodyModel): GeomData {
  const k = body.spec.extras.parasiticMale;
  const L = body.L;
  const b = new GeomBuilder();
  const s = 0.56;
  const th = body.thetaAt(s, -0.72);
  const at = body.surface(s, th, 0, new THREE.Vector3());
  const n = body.surfaceNormal(s, th, 0, new THREE.Vector3());
  const len = 0.15 * L * k;
  // 雄鱼身体: 吻端贴在雌鱼腹侧, 身体向后下方伸出, 略微弯曲
  const d = new THREE.Vector3(0.75, -0.55, 0.35).normalize();
  const side = n.clone().setY(0).normalize();
  const ctrl = [
    at.clone().addScaledVector(n, -0.002 * L),
    at.clone().addScaledVector(d, len * 0.3).addScaledVector(side, len * 0.05),
    at.clone().addScaledVector(d, len * 0.65).addScaledVector(side, len * 0.1).add(new THREE.Vector3(0, -len * 0.05, 0)),
    at.clone().addScaledVector(d, len).addScaledVector(side, len * 0.12).add(new THREE.Vector3(len * 0.05, -len * 0.08, 0)),
  ];
  const pts = smooth(ctrl, 22);
  const prof = (t: number) => {
    // 小鱼的体型: 头钝, 身体纺锤, 尾柄细
    if (t < 0.12) return lerp(0.35, 0.9, t / 0.12);
    if (t < 0.4) return lerp(0.9, 1, (t - 0.12) / 0.28);
    return lerp(1, 0.22, Math.pow((t - 0.4) / 0.6, 1.2));
  };
  const R = 0.02 * L * k;
  tube(b, pts, (i) => R * prof(i / 21), 12, { capRings: 3, squash: 1.35 });
  // 尾鳍: 薄的扇形
  const tail = pts[pts.length - 1];
  const tdir = tail.clone().sub(pts[pts.length - 3]).normalize();
  const tside = new THREE.Vector3().crossVectors(tdir, new THREE.Vector3(0, 1, 0)).normalize();
  const tup = new THREE.Vector3().crossVectors(tside, tdir).normalize();
  const tc = tail.clone().addScaledVector(tdir, R * 0.9);
  ellipsoid(b, tc, tdir.clone().multiplyScalar(R * 1.0), tup.clone().multiplyScalar(R * 1.25), tside.clone().multiplyScalar(R * 0.08), 10, 6);
  // 眼 (退化的小黑点, 用小球表示)
  const head = pts[3];
  for (const sgn of [1, -1]) {
    const e = head.clone().add(new THREE.Vector3(0, R * 0.35, sgn * R * 0.75));
    ellipsoid(b, e, new THREE.Vector3(R * 0.22, 0, 0), new THREE.Vector3(0, R * 0.22, 0), new THREE.Vector3(0, 0, R * 0.22), 8, 5);
  }
  return b.build();
}

export function maleAnchor(body: BodyModel) {
  const s = 0.56;
  const th = body.thetaAt(s, -0.72);
  const at = body.surface(s, th, 0, new THREE.Vector3());
  return at.add(new THREE.Vector3(0.05 * body.L, -0.05 * body.L, 0.03 * body.L));
}

// ---------- 吻器 (腔棘鱼吻部充满胶质的电感受器, 三对管道通向体表) ----------
export function buildRostralOrgan(body: BodyModel): GeomData {
  const k = body.spec.extras.rostralOrgan;
  const L = body.L;
  const b = new GeomBuilder();
  const s = body.spec.eye.s * 0.55;
  const c = body.bodyPoint(s, 0.25, 0);
  const r = 0.012 * L * k;
  ellipsoid(b, c, new THREE.Vector3(r * 1.8, 0, 0), new THREE.Vector3(0, r * 0.9, 0), new THREE.Vector3(0, 0, r * 0.9), 16, 10);
  const targets: [number, number][] = [
    [0.012, 0.1],
    [s * 0.9, 0.55],
    [s * 1.35, -0.1],
  ];
  for (const [ts, th] of targets) {
    for (const side of [1, -1]) {
      const end = body.surface(Math.max(0.004, ts), body.thetaAt(Math.max(0.004, ts), th), 0.002);
      end.z *= side;
      const start = c.clone().add(new THREE.Vector3(0, 0, side * r * 0.5));
      const mid = start.clone().lerp(end, 0.5).add(new THREE.Vector3(0, r * 0.3, 0));
      tube(b, smooth([start, mid, end], 8), () => r * 0.18, 6, { capRings: 1 });
    }
  }
  return b.build();
}

// ---------- 直肠腺 (软骨鱼: 排出多余盐分, 位于肠末端背侧) ----------
export function buildRectalGland(body: BodyModel): GeomData {
  const k = body.spec.organs.rectalGland;
  const c = body.spec.organs.cavity;
  const L = body.L;
  const b = new GeomBuilder();
  const s = c.s1 - 0.045;
  const base = body.cavityPoint(s + 0.03, -0.1, 0.05);
  const tip = body.cavityPoint(s - 0.02, 0.35, 0.15);
  const pts = smooth([base, base.clone().lerp(tip, 0.5).add(new THREE.Vector3(0, 0.004 * L, 0)), tip], 12);
  tube(b, pts, (i) => 0.0065 * L * k * (0.5 + 0.5 * Math.sin((Math.PI * (i + 1)) / 13)), 10, { capRings: 3 });
  return b.build();
}

// ---------- 奇网 (金枪鱼体侧皮下的逆流热交换血管束: 动静脉交替并行) ----------
export const RETE_N = 18;

export function buildRete(body: BodyModel): GeomData {
  const k = body.spec.organs.rete;
  const L = body.L;
  const b = new GeomBuilder({ color: 3 });
  const art = [0.8, 0.12, 0.14];
  const vein = [0.2, 0.28, 0.72];
  for (let j = 0; j < RETE_N; j++) {
    const off = (j / (RETE_N - 1) - 0.5) * 0.22;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < 26; i++) {
      const s = lerp(0.3, 0.74, i / 25);
      const h = body.lateralH(s) + off;
      const th = body.thetaAt(s, h);
      pts.push(body.surface(s, th, 0.012 + 0.004 * Math.sin(j * 1.7)));
    }
    const r = 0.0014 * L * k * (j % 2 === 0 ? 1 : 1.25);
    const col = j % 2 === 0 ? art : vein;
    tube(b, pts, () => r, 5, { capRings: 1, ex: () => ({ color: col }) });
  }
  return b.build();
}

/** 金枪鱼肝脏表面的血管纹 (内脏奇网) 暂由肝脏颜色表现; 这里给出体侧奇网的锚点. */
export function reteAnchor(body: BodyModel) {
  const s = 0.5;
  return body.surface(s, body.thetaAt(s, body.lateralH(s)), 0.012);
}

/** 深层红肌锚点, 便于在剖面上标注. */
export function deepRedAnchor(body: BodyModel) {
  const s = 0.55;
  const p = spinePoint(body, s);
  return p.add(new THREE.Vector3(0, 0, centrumR(body, s) * 3));
}
