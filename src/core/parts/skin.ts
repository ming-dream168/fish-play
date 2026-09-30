// 体表 (皮肤), 肌肉层与体腔三张放样曲面.
// 皮肤环在口裂处复制顶点: 上唇属于上弧, 下唇属于下弧, 两弧之间的面片在张口时被拉开, 形成真实的口腔开口.

import * as THREE from 'three';
import type { BodyModel } from '../body';
import { GeomBuilder, type GeomData } from '../geom';
import { clamp, smoothstep } from '../math';

export const SKIN_RES = { head: 70, body: 150, arcLow: 18, arcUp: 36 };
export const MUSCLE_RES = { rings: 150, radial: 72 };
export const CAVITY_RES = { rings: 64, radial: 40 };

/** 皮肤环的 s 采样: 头部更密. */
export function skinRingS(i: number, body: BodyModel) {
  const nH = SKIN_RES.head;
  const nB = SKIN_RES.body;
  const sHead = 0.24;
  if (i < nH) {
    const t = i / nH;
    return sHead * (t * t * 0.35 + t * 0.65);
  }
  const t = (i - nH) / nB;
  return sHead + (body.sEnd - sHead) * t;
}

const P = new THREE.Vector3();
const N = new THREE.Vector3();

export function buildSkin(body: BodyModel): GeomData {
  const spec = body.spec;
  const b = new GeomBuilder({ aJaw: 1, aOper: 1, aSkin: 4 });
  const nRings = SKIN_RES.head + SKIN_RES.body + 1;
  const { arcLow, arcUp } = SKIN_RES;
  const ringLen = arcLow + 1 + (arcUp + 1) + arcLow + 1;
  const m = spec.mouth;
  const hinge = body.jawHinge(new THREE.Vector3());
  const g = spec.gill;

  for (let i = 0; i < nRings; i++) {
    const s = skinRingS(i, body);
    const thM = body.mouthTheta(s);
    // 三段弧: A 左下 (-π/2 → θm), B 上 (θm → π-θm), C 右下 (π-θm → 3π/2)
    const thetas: number[] = [];
    const lower: number[] = [];
    for (let k = 0; k <= arcLow; k++) {
      thetas.push(-Math.PI / 2 + (thM + Math.PI / 2) * (k / arcLow));
      lower.push(1);
    }
    for (let k = 0; k <= arcUp; k++) {
      thetas.push(thM + (Math.PI - 2 * thM) * (k / arcUp));
      lower.push(0);
    }
    for (let k = 0; k <= arcLow; k++) {
      thetas.push(Math.PI - thM + (Math.PI / 2 + thM) * (k / arcLow));
      lower.push(1);
    }
    let arc = 0;
    const prev = new THREE.Vector3();
    for (let k = 0; k < ringLen; k++) {
      const th = thetas[k];
      body.surface(s, th, 0, P);
      if (k > 0) arc += P.distanceTo(prev);
      prev.copy(P);
      body.surfaceNormal(s, th, 0, N);
      if (s <= 1e-6) N.set(-1, 0, 0);
      // 下颌权重
      let jaw = 0;
      if (s <= m.corner) jaw = lower[k];
      else {
        const thSide = th <= Math.PI / 2 ? th : Math.PI - th;
        const lowerness = smoothstep(thM + 0.25, thM - 0.45, thSide);
        const axial = 1 - smoothstep(m.corner, m.corner + m.jawLen + 0.06, s);
        jaw = lowerness * axial;
      }
      // 喉部位于关节之后, 只下沉不旋转 (shader 里按 x 区分)
      // 鳃盖外张权重
      let oper = 0;
      const sinT = Math.sin(th);
      const n = sinT >= 0 ? body.nTop(s) : body.nBot(s);
      const h = Math.sign(sinT) * Math.pow(Math.abs(sinT), 2 / n);
      if (g.slits === 0 && g.flare > 0 && h < g.top && h > g.bottom) {
        const se = body.opEdgeS(h);
        if (s <= se) {
          const vert = smoothstep(g.top, g.top - 0.25, h) * smoothstep(g.bottom, g.bottom + 0.2, h);
          oper = smoothstep(se - 0.09, se - 0.005, s) * vert;
        }
      }
      const side = Math.cos(th) >= 0 ? 1 : -1;
      b.add(P, N, s / body.sEnd, (th + Math.PI / 2) / (Math.PI * 2), {
        aJaw: jaw,
        // 背腹中线上的接缝顶点 (θ = ±π/2) 左右各有一份, 这里不外张, 免得呼吸时把中线拉开
        aOper: oper * side * Math.min(1, Math.abs(Math.cos(th)) * 6),
        aSkin: [h, lower[k], arc, 0],
      });
    }
  }
  for (let i = 0; i < nRings - 1; i++) {
    for (let k = 0; k < ringLen - 1; k++) {
      const a = i * ringLen + k;
      const c = a + ringLen;
      b.quad(a, c, c + 1, a + 1);
    }
  }
  void hinge;
  return b.build();
}

/** 肌肉层: 皮下收缩一层的放样体, 头部之后到尾柄. 两端圆头封闭. */
export function buildMuscle(body: BodyModel, inset = 0.0045): GeomData {
  const spec = body.spec;
  const s0 = clamp(body.opEdgeS(0) - 0.005, 0.12, 0.4);
  const s1 = 1.0;
  const { rings, radial } = MUSCLE_RES;
  const b = new GeomBuilder({ aSkin: 4 });
  const capLen = 0.035;
  const surf = (s: number, th: number, out: THREE.Vector3) => {
    const tFront = clamp((s - s0) / capLen, 0, 1);
    const fFront = Math.sqrt(Math.max(0, 1 - (1 - tFront) * (1 - tFront)));
    const tBack = clamp((s1 - s) / 0.012, 0, 1);
    const fBack = Math.sqrt(Math.max(0, 1 - (1 - tBack) * (1 - tBack)));
    const f = Math.min(fFront, fBack);
    body.surface(s, th, inset, out);
    const ax = body.axis(s) * body.L;
    const sy = body.spineY(s) * body.L;
    // 以脊柱为中心收缩, 保证封闭
    const cy = (ax + sy) * 0.5;
    out.y = cy + (out.y - cy) * f;
    out.z *= f;
    return out;
  };
  const q0 = new THREE.Vector3();
  const q1 = new THREE.Vector3();
  const r0 = new THREE.Vector3();
  const r1 = new THREE.Vector3();
  for (let i = 0; i <= rings; i++) {
    const s = s0 + (s1 - s0) * (i / rings);
    for (let k = 0; k <= radial; k++) {
      const th = -Math.PI / 2 + (k / radial) * Math.PI * 2;
      surf(s, th, P);
      // 法线
      const ds = 0.0015;
      surf(Math.max(s0, s - ds), th, q0);
      surf(Math.min(s1, s + ds), th, q1);
      surf(s, th - 0.01, r0);
      surf(s, th + 0.01, r1);
      N.crossVectors(q1.sub(q0), r1.sub(r0));
      if (N.lengthSq() < 1e-14) N.set(i === 0 ? -1 : 1, 0, 0);
      N.normalize();
      const sinT = Math.sin(th);
      const n = sinT >= 0 ? body.nTop(s) : body.nBot(s);
      const h = Math.sign(sinT) * Math.pow(Math.abs(sinT), 2 / n);
      b.add(P, N, s / body.sEnd, k / radial, { aSkin: [h, 0, (k / radial) * 6.2831 * body.height(s) * 0.5 * body.L, 0] });
    }
  }
  const row = radial + 1;
  for (let i = 0; i < rings; i++) {
    for (let k = 0; k < radial; k++) {
      const a = i * row + k;
      const c = a + row;
      b.quad(a, c, c + 1, a + 1);
    }
  }
  void spec;
  return b.build();
}

/** 体腔 (腹膜): 法线朝内, 只在体腔内侧可见. */
export function buildCavity(body: BodyModel): GeomData {
  const c = body.spec.organs.cavity;
  const { rings, radial } = CAVITY_RES;
  const b = new GeomBuilder({ aSkin: 4 });
  const q0 = new THREE.Vector3();
  const q1 = new THREE.Vector3();
  const r0 = new THREE.Vector3();
  const r1 = new THREE.Vector3();
  const pt = (s: number, th: number, out: THREE.Vector3) => {
    const v = Math.sin(th);
    const u = Math.cos(th);
    const f = body.cavityFrame(s);
    const n = 2.3;
    out.set(
      (s - 0.5) * body.L,
      (f.yc + Math.sign(v) * Math.pow(Math.abs(v), 2 / n) * f.hh) * body.L,
      Math.sign(u) * Math.pow(Math.abs(u), 2 / n) * f.hw * body.L,
    );
    return out;
  };
  for (let i = 0; i <= rings; i++) {
    const s = c.s0 + (c.s1 - c.s0) * (i / rings);
    for (let k = 0; k <= radial; k++) {
      const th = -Math.PI / 2 + (k / radial) * Math.PI * 2;
      pt(s, th, P);
      const ds = 0.001;
      pt(Math.max(c.s0, s - ds), th, q0);
      pt(Math.min(c.s1, s + ds), th, q1);
      pt(s, th - 0.01, r0);
      pt(s, th + 0.01, r1);
      N.crossVectors(r1.sub(r0), q1.sub(q0)); // 与肌肉层相反: 朝内
      if (N.lengthSq() < 1e-14) N.set(i === 0 ? 1 : -1, 0, 0);
      N.normalize();
      b.add(P, N, s, k / radial, { aSkin: [Math.sin(th), 0, 0, 0] });
    }
  }
  const row = radial + 1;
  for (let i = 0; i < rings; i++) {
    for (let k = 0; k < radial; k++) {
      const a = i * row + k;
      const cc = a + row;
      b.quad(a, a + 1, cc + 1, cc);
    }
  }
  return b.build();
}
