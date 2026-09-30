// 循环系统: 单循环 (心 → 腹主动脉 → 鳃 → 背主动脉 → 全身 → 静脉 → 心).
// 路径按血流方向排列, 同时用于渲染血管与血流粒子.

import * as THREE from 'three';
import type { BodyModel } from '../body';
import { GeomBuilder, tube, type GeomData } from '../geom';
import { lerp } from '../math';
import { centrumR, gillArchPath, spinePoint } from './skeleton';
import { heartCenter, heartScale, intestinePathCtrl } from './organs';

export type VesselKind = 'deoxy' | 'artery' | 'vein';
export interface VesselPath {
  name: string;
  kind: VesselKind;
  pts: THREE.Vector3[];
  r: number; // 世界单位
  next: string[]; // 血流去向
}

const N_PTS = 22;

function smooth(ctrl: THREE.Vector3[], n = N_PTS) {
  let len = 0;
  for (let i = 1; i < ctrl.length; i++) len += ctrl[i].distanceTo(ctrl[i - 1]);
  if (len < 1e-7) return Array.from({ length: n }, () => ctrl[0].clone());
  const c = new THREE.CatmullRomCurve3(ctrl, false, 'centripetal', 0.5);
  return Array.from({ length: n }, (_, i) => c.getPoint(i / (n - 1)));
}

export function vesselNetwork(body: BodyModel): VesselPath[] {
  const sp = body.spec;
  const L = body.L;
  const g = sp.gill;
  const sk = sp.skeleton;
  const o = sp.organs;
  const hc = heartCenter(body);
  const hr = heartScale(body);
  const nArch = g.slits > 0 ? 5 : 4;
  const out: VesselPath[] = [];
  const bulbTip = hc.clone().add(new THREE.Vector3(-1.45 * hr, -0.1 * hr, 0));
  const vaEnd = body.bodyPoint(g.arches[0] - 0.012, -0.62, 0);
  out.push({ name: 'ventralAorta', kind: 'deoxy', pts: smooth([bulbTip, bulbTip.clone().lerp(vaEnd, 0.5), vaEnd]), r: 0.0034 * L, next: ['aff0L', 'aff0R', 'aff1L', 'aff1R', 'aff2L', 'aff2R', 'aff3L', 'aff3R'] });
  const rootS = sk.spineStart + 0.02;
  const root = spinePoint(body, rootS).add(new THREE.Vector3(0, -centrumR(body, rootS) * 1.5, 0));
  for (let k = 0; k < 5; k++) {
    const on = k < nArch ? 1 : 0;
    for (const [side, tag] of [
      [1, 'L'],
      [-1, 'R'],
    ] as [number, string][]) {
      const arch = gillArchPath(body, k, side, 12);
      const start = body.bodyPoint(lerp(g.arches[0], g.arches[1], k / 4) - 0.012, -0.64, 0);
      const aff = smooth([start, ...arch.slice(1, 10).map((p) => p.clone().add(new THREE.Vector3(-0.002 * L, 0, 0)))]);
      out.push({ name: `aff${k}${tag}`, kind: 'deoxy', pts: aff, r: 0.0016 * L * on, next: [`eff${k}${tag}`] });
      const top = arch[11];
      const eff = smooth([arch[9].clone().add(new THREE.Vector3(0.002 * L, 0, 0)), top, top.clone().lerp(root, 0.55).add(new THREE.Vector3(0, 0.004 * L, 0)), root]);
      out.push({ name: `eff${k}${tag}`, kind: 'artery', pts: eff, r: 0.0015 * L * on, next: ['dorsalAorta'] });
    }
  }
  // 颈动脉: 供应头部
  for (const [side, tag] of [
    [1, 'L'],
    [-1, 'R'],
  ] as [number, string][]) {
    const a = gillArchPath(body, 0, side, 12)[11];
    const e = body.eyeCenter(new THREE.Vector3());
    e.z *= side;
    e.x += sp.eye.r * L * 1.2;
    e.y -= sp.eye.r * L * 0.8;
    out.push({ name: `carotid${tag}`, kind: 'artery', pts: smooth([a, a.clone().lerp(e, 0.5).add(new THREE.Vector3(0, 0.006 * L, 0)), e]), r: 0.0011 * L, next: [`antCard${tag}`] });
  }
  // 背主动脉 → 尾动脉
  const da: THREE.Vector3[] = [];
  for (let i = 0; i < 16; i++) {
    const s = lerp(rootS, 0.975, i / 15);
    da.push(spinePoint(body, s).add(new THREE.Vector3(0, -centrumR(body, s) * 1.45, 0)));
  }
  out.push({ name: 'dorsalAorta', kind: 'artery', pts: smooth(da, 40), r: 0.0032 * L, next: ['caudalVein', 'coeliac'] });
  // 腹腔肠系膜动脉
  const cs = o.cavity.s0 + 0.05;
  const cA = spinePoint(body, cs).add(new THREE.Vector3(0, -centrumR(body, cs) * 1.5, 0));
  const ip = intestinePathCtrl(body);
  const gut = body.cavityPoint(ip[2][0], ip[2][1], ip[2][2]);
  out.push({ name: 'coeliac', kind: 'artery', pts: smooth([cA, cA.clone().lerp(gut, 0.5).add(new THREE.Vector3(-0.01 * L, 0, 0.004 * L)), gut]), r: 0.0017 * L, next: ['hepaticPortal'] });
  // 尾静脉 → 后主静脉
  const cv: THREE.Vector3[] = [];
  const s1 = o.cavity.s1 - 0.01;
  for (let i = 0; i < 12; i++) {
    const s = lerp(0.97, s1, i / 11);
    cv.push(spinePoint(body, s).add(new THREE.Vector3(0, -centrumR(body, s) * 2.3, 0)));
  }
  out.push({ name: 'caudalVein', kind: 'vein', pts: smooth(cv), r: 0.0028 * L, next: ['postCardL', 'postCardR'] });
  const hcSinus = hc.clone().add(new THREE.Vector3(0.85 * hr, 0.45 * hr, 0));
  for (const [side, tag] of [
    [1, 'L'],
    [-1, 'R'],
  ] as [number, string][]) {
    const pc: THREE.Vector3[] = [];
    for (let i = 0; i < 12; i++) {
      const s = lerp(s1, sk.spineStart + 0.03, i / 11);
      pc.push(spinePoint(body, s).add(new THREE.Vector3(0, -centrumR(body, s) * 2.1, side * centrumR(body, s) * 1.6)));
    }
    out.push({ name: `postCard${tag}`, kind: 'vein', pts: smooth(pc), r: 0.0024 * L, next: [`cuvier${tag}`] });
    const topC = pc[pc.length - 1];
    const wall = body.bodyPoint(lerp(sk.spineStart + 0.03, o.heart.s, 0.5), -0.1, side * 0.8);
    const sin = hcSinus.clone().add(new THREE.Vector3(0, 0, side * hr * 0.8));
    out.push({ name: `cuvier${tag}`, kind: 'vein', pts: smooth([topC, wall, sin]), r: 0.0026 * L, next: ['heart'] });
    const eye = body.eyeCenter(new THREE.Vector3());
    const ac0 = new THREE.Vector3(eye.x + sp.eye.r * L * 1.5, eye.y + sp.eye.r * L * 0.3, side * eye.z * 0.7);
    out.push({ name: `antCard${tag}`, kind: 'vein', pts: smooth([ac0, ac0.clone().lerp(topC, 0.5).add(new THREE.Vector3(0, 0.004 * L, 0)), topC]), r: 0.0016 * L, next: [`cuvier${tag}`] });
  }
  // 肝门静脉与肝静脉
  const lv = o.liver;
  const liverP = body.cavityPoint(lerp(lv.s0, lv.s1, 0.5), -0.15, 0.15);
  const gut2 = body.cavityPoint(ip[3][0], ip[3][1], ip[3][2]);
  out.push({ name: 'hepaticPortal', kind: 'vein', pts: smooth([gut2, gut2.clone().lerp(liverP, 0.5).add(new THREE.Vector3(0, 0.006 * L, 0)), liverP]), r: 0.0018 * L, next: ['hepaticVein'] });
  const liverF = body.cavityPoint(lv.s0 + 0.01, -0.05, 0.05);
  out.push({ name: 'hepaticVein', kind: 'vein', pts: smooth([liverP, liverF, hcSinus]), r: 0.002 * L, next: ['heart'] });
  return out;
}

export function buildVessels(body: BodyModel, kind: VesselKind): GeomData {
  const b = new GeomBuilder({ aFlow: 1 });
  for (const v of vesselNetwork(body)) {
    if (v.kind !== kind) continue;
    let len = 0;
    const acc = [0];
    for (let i = 1; i < v.pts.length; i++) {
      len += v.pts[i].distanceTo(v.pts[i - 1]);
      acc.push(len);
    }
    tube(b, v.pts, () => v.r, 6, { capRings: 1, ex: (i) => ({ aFlow: acc[i] / body.L }) });
  }
  return b.build();
}
