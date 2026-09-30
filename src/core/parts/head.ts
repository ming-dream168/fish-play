// 头部外露结构: 眼球 (含凸出的球形晶状体) 与牙齿.

import * as THREE from 'three';
import type { BodyModel } from '../body';
import { GeomBuilder, InstanceWriter, type GeomData, type InstanceData } from '../geom';
import { clamp, lerp } from '../math';

export const EYE_RES = { w: 40, h: 28 };

/** 眼睛朝外的轴 (左眼), 略向前. */
export function eyeAxis(body: BodyModel) {
  const e = body.spec.eye;
  const th = body.thetaAt(e.s, e.h);
  const n = body.surfaceNormal(e.s, th, 0, new THREE.Vector3());
  n.x -= 0.18;
  return n.normalize();
}

export function buildEyes(body: BodyModel): GeomData {
  const e = body.spec.eye;
  const b = new GeomBuilder({ aEye: 2 });
  const c = body.eyeCenter(new THREE.Vector3());
  const r = e.r * body.L;
  const ax = eyeAxis(body);
  const t1 = new THREE.Vector3(0, 1, 0).cross(ax).normalize();
  if (t1.lengthSq() < 1e-6) t1.set(1, 0, 0);
  const t2 = ax.clone().cross(t1).normalize();
  const pupilCos = Math.cos(0.75 * e.pupil + 0.1);
  const P = new THREE.Vector3();
  const N = new THREE.Vector3();
  for (const side of [1, -1]) {
    const base = b.count;
    for (let j = 0; j <= EYE_RES.h; j++) {
      const ph = (j / EYE_RES.h) * Math.PI;
      for (let i = 0; i <= EYE_RES.w; i++) {
        const tt = (i / EYE_RES.w) * Math.PI * 2;
        const cp = Math.cos(ph);
        const sp = Math.sin(ph);
        // 局部方向: 极轴 = ax
        const dx = sp * Math.cos(tt);
        const dy = sp * Math.sin(tt);
        const dz = cp;
        N.copy(t1).multiplyScalar(dx).addScaledVector(t2, dy).addScaledVector(ax, dz);
        // 球形晶状体从瞳孔凸出
        let k = 1;
        if (cp > pupilCos) {
          const q = (cp - pupilCos) / (1 - pupilCos);
          k += 0.07 * Math.sqrt(q);
        }
        // 眼眶方向略扁
        P.copy(N).multiplyScalar(r * k);
        P.addScaledVector(ax, -r * 0.08 * (1 - cp));
        P.add(c);
        const nn = N.clone();
        if (side < 0) {
          P.z = -P.z;
          nn.z = -nn.z;
        }
        b.add(P, nn, i / EYE_RES.w, j / EYE_RES.h, { aEye: [cp, side] });
      }
    }
    const row = EYE_RES.w + 1;
    for (let j = 0; j < EYE_RES.h; j++) {
      for (let i = 0; i < EYE_RES.w; i++) {
        const a = base + j * row + i;
        const cc = a + row;
        if (side > 0) b.quad(a, cc, cc + 1, a + 1);
        else b.quad(a, a + 1, cc + 1, cc);
      }
    }
  }
  return b.build();
}

// ---------- 牙齿 ----------
export const TOOTH_MAX = 30; // 每侧每颌

export function buildToothUnit(): GeomData {
  // 单位圆锥: 底在 y=0 半径 1, 尖在 y=1; 略微后弯
  const b = new GeomBuilder();
  const seg = 8;
  const rings = 6;
  const P = new THREE.Vector3();
  const N = new THREE.Vector3();
  for (let j = 0; j <= rings; j++) {
    const t = j / rings;
    const r = (1 - t) * (1 - 0.15 * t);
    const bend = 0.35 * t * t;
    for (let i = 0; i <= seg; i++) {
      const a = (i / seg) * Math.PI * 2;
      P.set(Math.cos(a) * r + bend, t, Math.sin(a) * r * 0.75);
      N.set(Math.cos(a), 0.45, Math.sin(a)).normalize();
      b.add(P, N, i / seg, t);
    }
  }
  const row = seg + 1;
  for (let j = 0; j < rings; j++) {
    for (let i = 0; i < seg; i++) {
      const a = j * row + i;
      b.quad(a, a + row, a + row + 1, a + 1);
    }
  }
  // 底面
  const c = b.add(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -1, 0), 0.5, 0);
  for (let i = 0; i < seg; i++) b.tri(c, i, i + 1);
  return b.build();
}

/** 牙齿实例 (上左, 上右, 下左, 下右). 下颌牙的 iJaw = 1. */
export function buildTeeth(body: BodyModel): { data: InstanceData; jaw: Float32Array } {
  const m = body.spec.mouth;
  const w = new InstanceWriter(TOOTH_MAX * 4);
  const jaw = new Float32Array(TOOTH_MAX * 4);
  const L = body.L;
  const n = clamp(Math.round(m.teeth), 0, TOOTH_MAX);
  const P = new THREE.Vector3();
  const N = new THREE.Vector3();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  let slot = 0;
  const kype = body.spec.extras.kype;
  for (const lowerJaw of [0, 1]) {
    for (const side of [1, -1]) {
      for (let k = 0; k < TOOTH_MAX; k++) {
        jaw[slot] = lowerJaw;
        slot++;
        if (k >= n || m.toothLen <= 0) {
          w.push(new THREE.Vector3(body.x(m.corner * 0.5), 0, 0), q.identity(), new THREE.Vector3(0, 0, 0));
          continue;
        }
        const t = n > 1 ? k / (n - 1) : 0;
        const s = Math.max(0.004, m.corner * (0.04 + 0.9 * t));
        const th = body.mouthTheta(s);
        // 唇线点, 向内收一点
        body.surface(s, th, 0.004, P);
        body.surfaceNormal(s, th, 0.004, N);
        if (side < 0) {
          P.z = -P.z;
          N.z = -N.z;
        }
        // 牙指向口裂内侧: 上颌向下, 下颌向上, 并朝向中线
        const dir = new THREE.Vector3(0.15, lowerJaw ? 1 : -1, 0);
        dir.addScaledVector(N, -0.45).normalize();
        q.setFromUnitVectors(up, dir);
        let len = m.toothLen * L * (1.15 - 0.55 * t);
        if (m.fang > 0 && m.fangFront > 0) {
          // 只有上颌最前面几颗 (和下颌第一颗) 是大犬齿, 其余是小牙
          const big = lowerJaw ? k < 1 : k < m.fangFront;
          len *= big ? 1 + m.fang * (lowerJaw ? 1.2 : 2.2) : 0.55;
        } else if (m.fang > 0) {
          const alt = k % 3 === 0 ? 1.0 : k % 3 === 1 ? 0.45 : 0.7;
          len *= 1 + m.fang * (alt * 1.6 - 0.4) * (1 - 0.6 * t);
        }
        if (kype > 0 && k < 3) len *= 1 + kype * 0.8;
        const rad = len * (m.toothShape > 0.5 ? 0.42 : lerp(0.2, 0.085, m.fang));
        w.push(P.clone(), q.clone(), new THREE.Vector3(rad, len, rad * (m.toothShape > 0.5 ? 0.35 : 1)));
      }
    }
  }
  return { data: w.finish(), jaw };
}
