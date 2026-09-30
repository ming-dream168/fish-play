// 鳍膜与鳍条. 每片鳍的网格分辨率固定, 鳍条数只影响形状与着色, 保证跨物种同拓扑.

import * as THREE from 'three';
import type { BodyModel } from '../body';
import type { FinSpec, V3 } from '../spec';
import { GeomBuilder, recomputeNormals, tube, type GeomData } from '../geom';
import { Curve, clamp, lerp, toCurve } from '../math';

export const FIN_RES: Record<FinSpec['id'], { nu: number; nr: number; maxRays: number }> = {
  dorsalFin: { nu: 56, nr: 10, maxRays: 140 },
  secondDorsalFin: { nu: 40, nr: 10, maxRays: 30 },
  adiposeFin: { nu: 16, nr: 6, maxRays: 1 },
  analFin: { nu: 56, nr: 10, maxRays: 40 },
  caudalFin: { nu: 64, nr: 12, maxRays: 36 },
  pectoralFin: { nu: 28, nr: 10, maxRays: 22 },
  pelvicFin: { nu: 20, nr: 8, maxRays: 14 },
};

export interface FinFrame {
  // 给定 (u, r) 返回静息位置 (世界单位)
  point(u: number, r: number, side: number, out: THREE.Vector3): THREE.Vector3;
  base: THREE.Vector3; // 铰链点 (左侧)
  axis: THREE.Vector3; // 铰链轴 (左侧)
  lobeEnd?: THREE.Vector3;
  lobeDir?: THREE.Vector3;
}

const tmp = new THREE.Vector3();
const tmp2 = new THREE.Vector3();

function v3(a: V3, side = 1) {
  // (后, 上, 外) → 世界 (x, y, z)
  return new THREE.Vector3(a[0], a[1], a[2] * side);
}

/** 鳍的解析框架: 奇鳍, 尾鳍, 偶鳍统一成 (u, r) 参数面. */
export function finFrame(body: BodyModel, f: FinSpec): FinFrame {
  const L = body.L;
  const len = new Curve(f.len);
  const ang = toCurve(f.angle);
  const present = f.present;
  if (f.kind === 'dorsal' || f.kind === 'anal') {
    const up = f.kind === 'dorsal' ? 1 : -1;
    const baseAt = (u: number, out: THREE.Vector3) => {
      const s = lerp(f.s0, f.s1, u);
      const edge = up > 0 ? body.axis(s) + body.top(s) : body.axis(s) - body.bottom(s);
      // 稍微埋进体内, 摆动时不会脱开
      return out.set((s - 0.5) * L, (edge - up * 0.004) * L, 0);
    };
    const mid = baseAt(0.5, new THREE.Vector3());
    let lobeDir: THREE.Vector3 | undefined;
    let lobeEnd: THREE.Vector3 | undefined;
    if (f.lobe > 0) {
      const a = ang.at(0.5);
      lobeDir = new THREE.Vector3(Math.sin(a), up * Math.cos(a), 0).normalize();
      lobeEnd = mid.clone().addScaledVector(lobeDir, f.lobe * L * present);
    }
    return {
      base: mid,
      axis: new THREE.Vector3(1, 0, 0),
      lobeEnd,
      lobeDir,
      point(u, r, _side, out) {
        if (lobeEnd && lobeDir) {
          // 肉鳍: 鳍条从鳍柄末端的短基底发出
          const bl = (f.s1 - f.s0) * L * 0.5;
          out.copy(lobeEnd).add(tmp.set((u - 0.5) * bl, 0, 0));
        } else baseAt(u, out);
        const a = ang.at(u);
        let l = len.at(u) * L * present;
        // 硬棘间鳍膜缺刻
        if (f.spines > 0 && f.notch > 0) {
          const us = (f.spines - 1) / Math.max(1, f.rays - 1);
          if (u < us) {
            const k = (u / us) * (f.spines - 1);
            const fr = k - Math.floor(k);
            l *= 1 - f.notch * Math.sin(Math.PI * fr) * Math.min(1, r * 1.5);
          }
        }
        const dir = tmp.set(Math.sin(a), up * Math.cos(a), 0);
        return out.addScaledVector(dir, l * r);
      },
    };
  }
  if (f.kind === 'caudal') {
    const s = f.s0;
    const cy = body.spineY(Math.min(1, s)) + f.baseCenter * body.height(Math.min(1, s));
    const hb = f.baseH * present;
    const base = new THREE.Vector3((s - 0.5) * L, cy * L, 0);
    return {
      base,
      axis: new THREE.Vector3(0, 1, 0),
      point(u, r, _side, out) {
        out.set((s - 0.5) * L, (cy + (u - 0.5) * 2 * hb) * L, 0);
        const a = ang.at(u);
        const l = len.at(u) * L * present;
        return out.add(tmp.set(Math.cos(a), Math.sin(a), 0).multiplyScalar(l * r));
      },
    };
  }
  // 偶鳍
  const s = f.s0;
  const th = body.thetaAt(s, f.h);
  const base = body.surface(s, th, 0.003, new THREE.Vector3());
  const bdir = v3(f.baseDir).normalize();
  const a = v3(f.a).normalize();
  const bv = v3(f.b).normalize();
  const hinge = v3(f.hinge).normalize();
  let lobeDir: THREE.Vector3 | undefined;
  let lobeEnd: THREE.Vector3 | undefined;
  if (f.lobe > 0) {
    lobeDir = a.clone().add(bv).normalize();
    lobeEnd = base.clone().addScaledVector(lobeDir, f.lobe * L * present);
  }
  return {
    base,
    axis: hinge,
    lobeEnd,
    lobeDir,
    point(u, r, side, out) {
      const origin = lobeEnd ?? base;
      out.copy(origin).addScaledVector(bdir, (u - 0.5) * f.baseLen * L * present);
      // 在 a, b 之间球面插值
      const d = tmp2.copy(a).lerp(bv, u).normalize();
      const l = len.at(u) * L * present;
      out.addScaledVector(d, l * r);
      if (side < 0) out.z = -out.z;
      return out;
    },
  };
}

/** 鳍膜: 网格 (u 横跨鳍条, r 沿鳍条), 属性 aFin = (u, r, side, 鳍条相位). */
export function buildFinMembrane(body: BodyModel, f: FinSpec): GeomData {
  const res = FIN_RES[f.id];
  const frame = finFrame(body, f);
  const b = new GeomBuilder({ aFin: 4 });
  const sides = f.kind === 'paired' ? [1, -1] : [1];
  const rays = Math.max(1, f.rays);
  const P = new THREE.Vector3();
  const N0 = new THREE.Vector3(0, 0, 1);
  for (const side of sides) {
    const base = b.count;
    for (let j = 0; j <= res.nr; j++) {
      const r = j / res.nr;
      for (let i = 0; i <= res.nu; i++) {
        const u = i / res.nu;
        frame.point(u, r, side, P);
        // 鳍条间褶皱: 鳍膜在两条鳍条之间微微凹进
        const rp = u * (rays - 1);
        const pleat = f.rays > 1 ? Math.sin(Math.PI * (rp - Math.floor(rp))) : 0;
        const amp = f.thick * 0.9 * body.L * r;
        if (f.kind === 'paired') {
          // 沿鳍面法线方向 (近似): 用与身体外侧的叉积
          P.z += side * pleat * amp * 0.5;
        } else P.z += pleat * amp * (f.kind === 'caudal' ? 0.6 : 0.5);
        b.add(P, N0, u, r, { aFin: [u, r, side, rp] });
      }
    }
    const row = res.nu + 1;
    for (let j = 0; j < res.nr; j++) {
      for (let i = 0; i < res.nu; i++) {
        const a = base + j * row + i;
        const c = a + row;
        if (side > 0) b.quad(a, a + 1, c + 1, c);
        else b.quad(a, c, c + 1, a + 1);
      }
    }
  }
  const g = b.build();
  recomputeNormals(g);
  return g;
}

/** 鳍条骨 (鳞质鳍条 / 硬棘). 最多 maxRays 根, 多余的塌缩. */
export function buildFinRays(body: BodyModel, f: FinSpec): GeomData {
  const res = FIN_RES[f.id];
  const frame = finFrame(body, f);
  const b = new GeomBuilder({ aFin: 4 });
  const sides = f.kind === 'paired' ? [1, -1] : [1];
  const n = Math.min(res.maxRays, Math.max(0, f.rays));
  const L = body.L;
  const segs = 6;
  for (const side of sides) {
    for (let k = 0; k < res.maxRays; k++) {
      const active = k < n && f.rays > 0;
      const u = n > 1 ? k / (n - 1) : 0.5;
      const pts: THREE.Vector3[] = [];
      for (let j = 0; j < segs; j++) {
        const r = active ? (j / (segs - 1)) * 0.985 : 0;
        pts.push(frame.point(active ? u : 1, r, side, new THREE.Vector3()));
      }
      const isSpine = k < f.spines;
      // 软骨鱼的角质鳍条是细密的纤维, 比硬骨鱼的骨质鳍条细得多
      const fiber = body.spec.skeleton.cartilage > 0.9 ? 0.45 : 1;
      const r0 = (isSpine ? 0.0024 : 0.0013) * L * (active ? 1 : 0) * f.present * fiber;
      tube(
        b,
        pts,
        (i) => r0 * (1 - 0.75 * (i / (segs - 1))),
        4,
        { capRings: 1, ex: (i) => ({ aFin: [u, i / (segs - 1), side, u * Math.max(1, f.rays - 1)] }) },
      );
    }
  }
  return b.build();
}

/** 肉鳍鳍柄 (腔棘鱼): 从体表伸出的有鳞肉质短柄. 无肉鳍时塌缩. */
export function buildFinLobe(body: BodyModel, f: FinSpec): GeomData {
  const frame = finFrame(body, f);
  const b = new GeomBuilder({ aFin: 4 });
  const sides = f.kind === 'paired' ? [1, -1] : [1];
  const L = body.L;
  for (const side of sides) {
    const start = frame.base.clone();
    const end = (frame.lobeEnd ?? frame.base).clone();
    if (side < 0) {
      start.z = -start.z;
      end.z = -end.z;
    }
    // 起点稍微埋进身体
    const dir = end.clone().sub(start);
    const inward = dir.lengthSq() > 1e-12 ? dir.clone().normalize().multiplyScalar(-f.lobeR * L * 0.8) : new THREE.Vector3();
    const pts: THREE.Vector3[] = [];
    const n = 10;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      pts.push(start.clone().add(inward.clone().multiplyScalar(1 - t)).lerp(end, t));
    }
    const R = f.lobe > 0 ? f.lobeR * L * f.present : 0;
    tube(b, pts, (i) => R * (1 - 0.45 * (i / (n - 1))) , 12, {
      capRings: 3,
      ex: (i) => ({ aFin: [0.5, -0.2 + 0.2 * (i / (n - 1)), side, 0] }),
    });
  }
  return b.build();
}

/** 鳍条相关常用: 奇鳍基底点 (供担鳍骨使用). */
export function finRayBase(body: BodyModel, f: FinSpec, u: number, out = new THREE.Vector3()) {
  return finFrame(body, f).point(u, 0, 1, out);
}

export function finIsPresent(f: FinSpec) {
  return f.present > 0.001;
}

export const clamp01 = (x: number) => clamp(x, 0, 1);
