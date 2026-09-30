// 几何构建工具. 所有生成器输出固定拓扑 (顶点数只取决于分辨率常量, 与物种无关),
// 这样任意两个物种可以逐顶点插值.

import * as THREE from 'three';

export interface GeomData {
  position: Float32Array;
  normal: Float32Array;
  uv: Float32Array;
  index: Uint32Array;
  extra: Record<string, { size: number; array: Float32Array }>;
}

export interface InstanceData {
  count: number;
  offset: Float32Array; // n*3
  quat: Float32Array; // n*4
  scale: Float32Array; // n*3
}

type Extras = Record<string, number | number[]>;

export class GeomBuilder {
  pos: number[] = [];
  nor: number[] = [];
  uvs: number[] = [];
  idx: number[] = [];
  extra: Record<string, { size: number; data: number[] }> = {};

  constructor(defs: Record<string, number> = {}) {
    for (const k of Object.keys(defs)) this.extra[k] = { size: defs[k], data: [] };
  }

  get count() {
    return this.pos.length / 3;
  }

  add(p: THREE.Vector3, n: THREE.Vector3, u = 0, v = 0, ex?: Extras) {
    const i = this.count;
    this.pos.push(p.x, p.y, p.z);
    this.nor.push(n.x, n.y, n.z);
    this.uvs.push(u, v);
    for (const k of Object.keys(this.extra)) {
      const e = this.extra[k];
      const val = ex?.[k];
      if (val === undefined) for (let j = 0; j < e.size; j++) e.data.push(0);
      else if (typeof val === 'number') {
        e.data.push(val);
        for (let j = 1; j < e.size; j++) e.data.push(0);
      } else for (let j = 0; j < e.size; j++) e.data.push(val[j] ?? 0);
    }
    return i;
  }

  tri(a: number, b: number, c: number) {
    this.idx.push(a, b, c);
  }

  quad(a: number, b: number, c: number, d: number) {
    this.idx.push(a, b, c, a, c, d);
  }

  build(): GeomData {
    const extra: GeomData['extra'] = {};
    for (const k of Object.keys(this.extra)) extra[k] = { size: this.extra[k].size, array: new Float32Array(this.extra[k].data) };
    return {
      position: new Float32Array(this.pos),
      normal: new Float32Array(this.nor),
      uv: new Float32Array(this.uvs),
      index: new Uint32Array(this.idx),
      extra,
    };
  }
}

/** 规则网格曲面. fn(i, j) 返回顶点; wrapU 时 i 方向首尾相接. */
export function gridSurface(
  b: GeomBuilder,
  nu: number,
  nv: number,
  fn: (i: number, j: number) => { p: THREE.Vector3; n: THREE.Vector3; u?: number; v?: number; ex?: Extras },
  flip = false,
) {
  const base = b.count;
  for (let j = 0; j <= nv; j++) {
    for (let i = 0; i <= nu; i++) {
      const r = fn(i, j);
      b.add(r.p, r.n, r.u ?? i / nu, r.v ?? j / nv, r.ex);
    }
  }
  const row = nu + 1;
  for (let j = 0; j < nv; j++) {
    for (let i = 0; i < nu; i++) {
      const a = base + j * row + i;
      const c = a + row;
      if (flip) b.quad(a, c, c + 1, a + 1);
      else b.quad(a, a + 1, c + 1, c);
    }
  }
  return base;
}

const _t = new THREE.Vector3();
const _n = new THREE.Vector3();
const _bn = new THREE.Vector3();
const _p = new THREE.Vector3();
const _q = new THREE.Vector3();

/**
 * 沿路径的封闭管 (两端半球帽). 路径点数与 radial 固定则拓扑固定.
 * ex(i, k) 可为每个路径点附加属性 (k 为环向索引).
 */
export function tube(
  b: GeomBuilder,
  pts: THREE.Vector3[],
  radii: number[] | ((i: number) => number),
  radial: number,
  opts: {
    capRings?: number;
    ex?: (i: number) => Extras;
    squash?: number | ((i: number) => number); // 截面扁平 (副法线方向缩放)
    up?: THREE.Vector3; // 初始法向参考
    vScale?: number;
  } = {},
) {
  const n = pts.length;
  const rad = typeof radii === 'function' ? radii : (i: number) => radii[i];
  const capRings = opts.capRings ?? 3;
  const squashF = typeof opts.squash === 'function' ? opts.squash : () => (opts.squash as number | undefined) ?? 1;
  // 平行移动标架
  const T: THREE.Vector3[] = [];
  const N: THREE.Vector3[] = [];
  const B: THREE.Vector3[] = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)];
    const c = pts[Math.min(n - 1, i + 1)];
    const t = new THREE.Vector3().subVectors(c, a);
    if (t.lengthSq() < 1e-16) t.copy(i > 0 ? T[i - 1] : new THREE.Vector3(1, 0, 0));
    T.push(t.normalize());
  }
  const up = opts.up ?? new THREE.Vector3(0, 1, 0);
  let n0 = new THREE.Vector3().crossVectors(T[0], up);
  if (n0.lengthSq() < 1e-8) n0 = new THREE.Vector3().crossVectors(T[0], new THREE.Vector3(0, 0, 1));
  n0.normalize();
  N.push(n0);
  B.push(new THREE.Vector3().crossVectors(T[0], n0).normalize());
  for (let i = 1; i < n; i++) {
    const prevN = N[i - 1];
    const axis = new THREE.Vector3().crossVectors(T[i - 1], T[i]);
    const nn = prevN.clone();
    const len = axis.length();
    if (len > 1e-8) {
      axis.divideScalar(len);
      const ang = Math.acos(THREE.MathUtils.clamp(T[i - 1].dot(T[i]), -1, 1));
      nn.applyAxisAngle(axis, ang);
    }
    // 重新正交化
    nn.addScaledVector(T[i], -nn.dot(T[i])).normalize();
    N.push(nn);
    B.push(new THREE.Vector3().crossVectors(T[i], nn).normalize());
  }

  const ring = radial + 1;
  const base = b.count;
  const vScale = opts.vScale ?? 1;
  // 起始帽
  const addRing = (i: number, r: number, offset: number, nrmBlend: number, v: number) => {
    const sq = squashF(i);
    for (let k = 0; k <= radial; k++) {
      const ang = (k / radial) * Math.PI * 2;
      const c = Math.cos(ang);
      const s = Math.sin(ang);
      _n.copy(N[i]).multiplyScalar(c).addScaledVector(B[i], s * sq);
      _p.copy(pts[i]).addScaledVector(_n, r).addScaledVector(T[i], offset);
      _bn.copy(N[i]).multiplyScalar(c).addScaledVector(B[i], s / Math.max(0.05, sq)).normalize();
      _q.copy(_bn).multiplyScalar(1 - Math.abs(nrmBlend)).addScaledVector(T[i], nrmBlend).normalize();
      b.add(_p, _q, k / radial, v * vScale, opts.ex?.(i));
    }
  };
  // 帽的环: 从极点到赤道
  for (let c = 0; c < capRings; c++) {
    const phi = (Math.PI / 2) * (c / capRings);
    const r0 = rad(0);
    addRing(0, r0 * Math.sin(phi), -r0 * Math.cos(phi), -Math.cos(phi), 0);
  }
  let arc = 0;
  for (let i = 0; i < n; i++) {
    if (i > 0) arc += pts[i].distanceTo(pts[i - 1]);
    addRing(i, rad(i), 0, 0, arc);
  }
  for (let c = capRings - 1; c >= 0; c--) {
    const phi = (Math.PI / 2) * (c / capRings);
    const r1 = rad(n - 1);
    addRing(n - 1, r1 * Math.sin(phi), r1 * Math.cos(phi), Math.cos(phi), arc);
  }
  const rings = n + capRings * 2;
  for (let j = 0; j < rings - 1; j++) {
    for (let k = 0; k < radial; k++) {
      const a = base + j * ring + k;
      const c = a + ring;
      b.quad(a, a + 1, c + 1, c);
    }
  }
  return { T, N, B };
}

/** 椭球 (任意朝向): axes 是三个已含半径的轴向量. deform(dir) 返回径向缩放. */
export function ellipsoid(
  b: GeomBuilder,
  center: THREE.Vector3,
  ax: THREE.Vector3,
  ay: THREE.Vector3,
  az: THREE.Vector3,
  wSeg: number,
  hSeg: number,
  opts: { deform?: (d: THREE.Vector3) => number; ex?: Extras } = {},
) {
  const m = new THREE.Matrix3().set(ax.x, ay.x, az.x, ax.y, ay.y, az.y, ax.z, ay.z, az.z);
  const det = m.determinant();
  const inv = Math.abs(det) > 1e-18 ? m.clone().invert().transpose() : new THREE.Matrix3();
  const d = new THREE.Vector3();
  const p = new THREE.Vector3();
  const nn = new THREE.Vector3();
  return gridSurface(b, wSeg, hSeg, (i, j) => {
    const th = (i / wSeg) * Math.PI * 2;
    const ph = (j / hSeg) * Math.PI;
    d.set(Math.cos(th) * Math.sin(ph), Math.cos(ph), Math.sin(th) * Math.sin(ph));
    const k = opts.deform ? opts.deform(d) : 1;
    p.copy(d).multiplyScalar(k).applyMatrix3(m).add(center);
    nn.copy(d).applyMatrix3(inv);
    if (nn.lengthSq() < 1e-20) nn.copy(d);
    nn.normalize();
    return { p: p.clone(), n: nn.clone(), u: i / wSeg, v: j / hSeg, ex: opts.ex };
  }, false);
}

/** 由面重算法线 (面积加权). 用于不便解析求法线的网格. */
export function recomputeNormals(g: GeomData, from = 0, to?: number) {
  const pos = g.position;
  const nor = g.normal;
  const end = to ?? pos.length / 3;
  for (let i = from * 3; i < end * 3; i++) nor[i] = 0;
  const a = new THREE.Vector3();
  const bb = new THREE.Vector3();
  const c = new THREE.Vector3();
  const e1 = new THREE.Vector3();
  const e2 = new THREE.Vector3();
  const idx = g.index;
  for (let t = 0; t < idx.length; t += 3) {
    const i0 = idx[t];
    const i1 = idx[t + 1];
    const i2 = idx[t + 2];
    if (i0 < from || i0 >= end) continue;
    a.fromArray(pos, i0 * 3);
    bb.fromArray(pos, i1 * 3);
    c.fromArray(pos, i2 * 3);
    e1.subVectors(bb, a);
    e2.subVectors(c, a);
    e1.cross(e2);
    for (const i of [i0, i1, i2]) {
      nor[i * 3] += e1.x;
      nor[i * 3 + 1] += e1.y;
      nor[i * 3 + 2] += e1.z;
    }
  }
  for (let i = from; i < end; i++) {
    a.fromArray(nor, i * 3);
    const l = a.length();
    if (l > 1e-20) a.divideScalar(l);
    else a.set(0, 1, 0);
    a.toArray(nor, i * 3);
  }
}

/** 合并多个 GeomData (属性集合必须一致). */
export function mergeGeoms(list: GeomData[]): GeomData {
  let nv = 0;
  let ni = 0;
  for (const g of list) {
    nv += g.position.length / 3;
    ni += g.index.length;
  }
  const out: GeomData = {
    position: new Float32Array(nv * 3),
    normal: new Float32Array(nv * 3),
    uv: new Float32Array(nv * 2),
    index: new Uint32Array(ni),
    extra: {},
  };
  const keys = list.length ? Object.keys(list[0].extra) : [];
  for (const k of keys) out.extra[k] = { size: list[0].extra[k].size, array: new Float32Array(nv * list[0].extra[k].size) };
  let vo = 0;
  let io = 0;
  for (const g of list) {
    const n = g.position.length / 3;
    out.position.set(g.position, vo * 3);
    out.normal.set(g.normal, vo * 3);
    out.uv.set(g.uv, vo * 2);
    for (let i = 0; i < g.index.length; i++) out.index[io + i] = g.index[i] + vo;
    for (const k of keys) out.extra[k].array.set(g.extra[k].array, vo * out.extra[k].size);
    vo += n;
    io += g.index.length;
  }
  return out;
}

/** 转为 three 几何; b 为变形目标 (同拓扑). */
export function toBufferGeometry(a: GeomData, b?: GeomData): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(a.position, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(a.normal, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(a.uv, 2));
  for (const k of Object.keys(a.extra)) g.setAttribute(k, new THREE.BufferAttribute(a.extra[k].array, a.extra[k].size));
  const bb = b ?? a;
  if (bb.position.length !== a.position.length) throw new Error('morph topology mismatch');
  g.setAttribute('position2', new THREE.BufferAttribute(bb.position, 3));
  g.setAttribute('normal2', new THREE.BufferAttribute(bb.normal, 3));
  g.setIndex(new THREE.BufferAttribute(a.index, 1));
  g.computeBoundingSphere();
  if (g.boundingSphere) g.boundingSphere.radius *= 1.6; // 摆动变形留余量
  return g;
}

/** 用新数据就地更新几何 (同拓扑): A 槽或 B 槽. */
export function writeSlot(g: THREE.BufferGeometry, d: GeomData, slot: 'a' | 'b') {
  const pa = g.getAttribute(slot === 'a' ? 'position' : 'position2') as THREE.BufferAttribute;
  const na = g.getAttribute(slot === 'a' ? 'normal' : 'normal2') as THREE.BufferAttribute;
  (pa.array as Float32Array).set(d.position);
  (na.array as Float32Array).set(d.normal);
  pa.needsUpdate = true;
  na.needsUpdate = true;
  if (slot === 'a') {
    for (const k of Object.keys(d.extra)) {
      const at = g.getAttribute(k) as THREE.BufferAttribute | undefined;
      if (at) {
        (at.array as Float32Array).set(d.extra[k].array);
        at.needsUpdate = true;
      }
    }
    const uv = g.getAttribute('uv') as THREE.BufferAttribute;
    (uv.array as Float32Array).set(d.uv);
    uv.needsUpdate = true;
  }
}

/** 实例化几何: 单位形状 + A/B 两套实例变换. */
export function toInstancedGeometry(unit: GeomData, a: InstanceData, b?: InstanceData) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(unit.position, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(unit.normal, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(unit.uv, 2));
  for (const k of Object.keys(unit.extra)) g.setAttribute(k, new THREE.BufferAttribute(unit.extra[k].array, unit.extra[k].size));
  g.setIndex(new THREE.BufferAttribute(unit.index, 1));
  const bb = b ?? a;
  g.setAttribute('iOffset', new THREE.InstancedBufferAttribute(new Float32Array(a.offset), 3));
  g.setAttribute('iQuat', new THREE.InstancedBufferAttribute(new Float32Array(a.quat), 4));
  g.setAttribute('iScale', new THREE.InstancedBufferAttribute(new Float32Array(a.scale), 3));
  g.setAttribute('iOffset2', new THREE.InstancedBufferAttribute(new Float32Array(bb.offset), 3));
  g.setAttribute('iQuat2', new THREE.InstancedBufferAttribute(new Float32Array(bb.quat), 4));
  g.setAttribute('iScale2', new THREE.InstancedBufferAttribute(new Float32Array(bb.scale), 3));
  g.instanceCount = a.count;
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 100);
  return g;
}

export function writeInstanceSlot(g: THREE.InstancedBufferGeometry, d: InstanceData, slot: 'a' | 'b') {
  const suf = slot === 'a' ? '' : '2';
  const o = g.getAttribute('iOffset' + suf) as THREE.InstancedBufferAttribute;
  const q = g.getAttribute('iQuat' + suf) as THREE.InstancedBufferAttribute;
  const s = g.getAttribute('iScale' + suf) as THREE.InstancedBufferAttribute;
  (o.array as Float32Array).set(d.offset);
  (q.array as Float32Array).set(d.quat);
  (s.array as Float32Array).set(d.scale);
  o.needsUpdate = q.needsUpdate = s.needsUpdate = true;
}

export class InstanceWriter {
  offset: Float32Array;
  quat: Float32Array;
  scale: Float32Array;
  n = 0;
  constructor(readonly max: number) {
    this.offset = new Float32Array(max * 3);
    this.quat = new Float32Array(max * 4);
    this.scale = new Float32Array(max * 3);
  }
  push(p: THREE.Vector3, q: THREE.Quaternion, s: THREE.Vector3) {
    if (this.n >= this.max) return;
    const i = this.n++;
    this.offset.set([p.x, p.y, p.z], i * 3);
    this.quat.set([q.x, q.y, q.z, q.w], i * 4);
    this.scale.set([s.x, s.y, s.z], i * 3);
  }
  /** 剩余槽位塌缩到给定点 (零缩放). */
  finish(at = new THREE.Vector3()): InstanceData {
    while (this.n < this.max) this.push(at, new THREE.Quaternion(), new THREE.Vector3(0, 0, 0));
    return { count: this.max, offset: this.offset, quat: this.quat, scale: this.scale };
  }
}

/** Catmull-Rom 重采样为固定点数. */
export function resample(ctrl: THREE.Vector3[], n: number, tension = 0.5): THREE.Vector3[] {
  if (ctrl.length === 1) return Array.from({ length: n }, () => ctrl[0].clone());
  const curve = new THREE.CatmullRomCurve3(ctrl, false, 'centripetal', tension);
  const out: THREE.Vector3[] = [];
  for (let i = 0; i < n; i++) out.push(curve.getPoint(i / (n - 1)));
  return out;
}
