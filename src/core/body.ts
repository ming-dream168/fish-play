// 身体坐标系: 把物种参数变成可查询的解析形体.
// 所有几何生成器都通过 BodyModel 定位, 所以器官, 骨骼, 鳍都会自动贴合不同物种的体形.

import * as THREE from 'three';
import { Curve, clamp, sgnPow, toCurve, lerp } from './math';
import type { SpeciesSpec } from './spec';

const _v = new THREE.Vector3();

export class BodyModel {
  readonly spec: SpeciesSpec;
  readonly L: number;
  private cTop: Curve;
  private cBot: Curve;
  private cWid: Curve;
  private cAxis: Curve;
  private cNT: Curve;
  private cNB: Curve;
  private cSpine: Curve;
  private cLat: Curve;
  private cOpEdge: Curve;

  constructor(spec: SpeciesSpec) {
    this.spec = spec;
    this.L = spec.display;
    const p = spec.profile;
    this.cTop = toCurve(p.top);
    this.cBot = toCurve(p.bottom);
    this.cWid = toCurve(p.width);
    this.cAxis = toCurve(p.axis, 0);
    this.cNT = toCurve(p.nTop, 2);
    this.cNB = toCurve(p.nBottom, 2);
    this.cSpine = toCurve(spec.skeleton.spineLine);
    this.cLat = toCurve(spec.skin.lateralLineH);
    const edge = [...spec.gill.edge].sort((a, b) => a[0] - b[0]);
    this.cOpEdge = new Curve(edge);
  }

  /** 吻端与尾端的圆头收缩系数. */
  cap(s: number) {
    const p = this.spec.profile;
    let f = 1;
    if (s < p.snoutRound) {
      const t = clamp(s / p.snoutRound, 0, 1);
      f = Math.sqrt(Math.max(0, 1 - (1 - t) * (1 - t)));
    }
    if (s > 1) {
      const t = clamp((s - 1) / p.tailCap, 0, 1);
      f *= Math.sqrt(Math.max(0, 1 - t * t));
    }
    if (s < 0) f = 0;
    return f;
  }

  // 以下返回 L 单位 (未乘显示尺寸)
  top(s: number) {
    return this.cTop.at(clamp(s, 0, 1)) * this.cap(s);
  }
  bottom(s: number) {
    return this.cBot.at(clamp(s, 0, 1)) * this.cap(s);
  }
  width(s: number) {
    return this.cWid.at(clamp(s, 0, 1)) * this.cap(s);
  }
  axis(s: number) {
    return this.cAxis.at(clamp(s, 0, 1));
  }
  nTop(s: number) {
    return this.cNT.at(clamp(s, 0, 1));
  }
  nBot(s: number) {
    return this.cNB.at(clamp(s, 0, 1));
  }
  /** 身体末端 (尾柄圆头结束) 的 s. */
  get sEnd() {
    return 1 + this.spec.profile.tailCap;
  }

  /** 高度分数 h 处, 左侧体表对应的环向角 θ. θ: -π/2 腹, 0 左, π/2 背, π 右. */
  thetaAt(s: number, h: number) {
    const n = h >= 0 ? this.nTop(s) : this.nBot(s);
    const hc = clamp(h, -1, 1);
    return Math.asin(sgnPow(hc, n / 2));
  }

  /** 体表点 (世界单位, 静息姿态). inset: 向内收缩量 (L). */
  surface(s: number, theta: number, inset = 0, out = new THREE.Vector3()) {
    const sn = Math.sin(theta);
    const c = Math.cos(theta);
    const up = sn >= 0;
    const a = Math.max(0, (up ? this.top(s) : this.bottom(s)) - inset);
    const w = Math.max(0, this.width(s) - inset);
    const n = up ? this.nTop(s) : this.nBot(s);
    const e = 2 / n;
    const y = this.axis(s) + sgnPow(sn, e) * a;
    const z = sgnPow(c, e) * w;
    return out.set((s - 0.5) * this.L, y * this.L, z * this.L);
  }

  /** 体表法线 (有限差分). */
  surfaceNormal(s: number, theta: number, inset = 0, out = new THREE.Vector3()) {
    const ds = 0.002;
    const dt = 0.01;
    const s0 = Math.max(0, s - ds);
    const s1 = s + ds;
    const p0 = this.surface(s0, theta, inset, new THREE.Vector3());
    const p1 = this.surface(s1, theta, inset, new THREE.Vector3());
    const q0 = this.surface(s, theta - dt, inset, new THREE.Vector3());
    const q1 = this.surface(s, theta + dt, inset, new THREE.Vector3());
    const ts = p1.sub(p0);
    const tt = q1.sub(q0);
    out.crossVectors(ts, tt);
    if (out.lengthSq() < 1e-14) {
      // 吻端或尾端的奇点
      out.set(s < 0.5 ? -1 : 1, 0, 0);
    }
    return out.normalize();
  }

  /** 体内一点: 高度分数 h, 侧向分数 u ∈ [-1,1] (该高度处半宽的比例). */
  bodyPoint(s: number, h: number, u: number, out = new THREE.Vector3()) {
    const a = h >= 0 ? this.top(s) : this.bottom(s);
    const n = h >= 0 ? this.nTop(s) : this.nBot(s);
    const y = this.axis(s) + h * a;
    const hw = this.width(s) * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(h), n)), 1 / n);
    return out.set((s - 0.5) * this.L, y * this.L, u * hw * this.L);
  }

  /** 某高度处的体半宽 (L). */
  halfWidthAt(s: number, h: number) {
    const n = h >= 0 ? this.nTop(s) : this.nBot(s);
    return this.width(s) * Math.pow(Math.max(0, 1 - Math.pow(Math.min(1, Math.abs(h)), n)), 1 / n);
  }

  /** 身体局部总高 (L). */
  height(s: number) {
    return this.top(s) + this.bottom(s);
  }

  /** 脊柱中心线高度 (L, 绝对 y). */
  spineY(s: number) {
    const f = this.cSpine.at(clamp(s, 0, 1));
    return this.axis(s) + (f >= 0 ? f * this.top(s) : f * this.bottom(s));
  }
  spineH(s: number) {
    return this.cSpine.at(clamp(s, 0, 1));
  }

  /** 侧线高度分数. */
  lateralH(s: number) {
    return this.cLat.at(clamp(s, 0, 1));
  }

  /** 鳃盖后缘在高度 h 处的 s. */
  opEdgeS(h: number) {
    return this.cOpEdge.at(h);
  }

  /** 口裂高度分数 (s ≤ corner 时有效). */
  mouthH(s: number) {
    const m = this.spec.mouth;
    const t = clamp(s / Math.max(1e-4, m.corner), 0, 1);
    const kype = this.spec.extras.kype;
    // 钩吻: 上颌前端下弯, 口裂前端上抬
    return lerp(m.tipH, m.cornerH, t) + m.bow * Math.sin(Math.PI * t) + kype * 0.25 * (1 - t) * (1 - t);
  }

  /** 口裂在左侧的环向角. 口角之后保持口角处的角度. */
  mouthTheta(s: number) {
    const m = this.spec.mouth;
    const sc = Math.min(s, m.corner);
    return this.thetaAt(Math.max(sc, 1e-4), this.mouthH(sc));
  }

  /** 下颌关节 (静息, 世界单位). */
  jawHinge(out = new THREE.Vector3()) {
    const m = this.spec.mouth;
    const sh = m.corner + m.jawLen;
    const y = this.axis(sh) + this.mouthH(m.corner) * (this.mouthH(m.corner) >= 0 ? this.top(sh) : this.bottom(sh));
    return out.set((sh - 0.5) * this.L, y * this.L, 0);
  }

  // ---------- 体腔 ----------
  cavityFrame(s: number) {
    const c = this.spec.organs.cavity;
    const sk = this.spec.skeleton;
    const len = c.s1 - c.s0;
    const t = (s - c.s0) / len;
    let taper = 0;
    if (t >= 0 && t <= 1) {
      const front = 0.22;
      const back = 0.16;
      if (t < front) taper = Math.sqrt(Math.max(0, 1 - Math.pow(1 - t / front, 2)));
      else if (t > 1 - back) taper = Math.sqrt(Math.max(0, 1 - Math.pow((t - (1 - back)) / back, 2)));
      else taper = 1;
    }
    const ySpine = this.spineY(s);
    const yTop = ySpine - sk.centrumR * (1.4 + 2 * (1 - c.top));
    const yBot = this.axis(s) - this.bottom(s) * c.bottom;
    const yc = (yTop + yBot) / 2;
    const hh = Math.max(0, (yTop - yBot) / 2) * taper;
    const hw = this.halfWidthAt(s, (yc - this.axis(s)) / Math.max(1e-4, yc >= this.axis(s) ? this.top(s) : this.bottom(s))) * c.width * taper;
    return { yc, hh, hw, taper, yTop, yBot };
  }

  /** 体腔内一点: v ∈ [-1,1] (腹→背), u ∈ [-1,1] (右→左). */
  cavityPoint(s: number, v: number, u: number, out = new THREE.Vector3()) {
    const f = this.cavityFrame(s);
    const n = 2.3;
    const lim = Math.pow(Math.max(0, 1 - Math.pow(Math.min(1, Math.abs(v)), n)), 1 / n);
    return out.set((s - 0.5) * this.L, (f.yc + v * f.hh) * this.L, u * f.hw * lim * this.L);
  }

  /** 从 s 换算世界 x. */
  x(s: number) {
    return (s - 0.5) * this.L;
  }

  /** 头部区域一点 (等同 bodyPoint), 便于语义区分. */
  headPoint(s: number, h: number, u: number, out = new THREE.Vector3()) {
    return this.bodyPoint(s, h, u, out);
  }

  /** 世界坐标 y 转为高度分数. */
  hOfY(s: number, yWorld: number) {
    const y = yWorld / this.L - this.axis(s);
    return y >= 0 ? y / Math.max(1e-5, this.top(s)) : y / Math.max(1e-5, this.bottom(s));
  }

  /** 眼球中心 (左眼, 世界单位). */
  eyeCenter(out = new THREE.Vector3()) {
    const e = this.spec.eye;
    const th = this.thetaAt(e.s, e.h);
    this.surface(e.s, th, 0, out);
    const n = this.surfaceNormal(e.s, th, 0, _v);
    const r = e.r * this.L;
    return out.addScaledVector(n, -r * (1 - e.protrude));
  }
}
