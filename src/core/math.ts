// 数学工具: 单调三次样条, 插值, 随机数.

export type Pt = [number, number];

export const clamp = (x: number, a: number, b: number) => (x < a ? a : x > b ? b : x);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const invLerp = (a: number, b: number, x: number) => (x - a) / (b - a);
export const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
export const sgnPow = (x: number, p: number) => Math.sign(x) * Math.pow(Math.abs(x), p);
export const TAU = Math.PI * 2;

/**
 * Fritsch–Carlson 单调三次插值. 控制点横坐标必须递增.
 * 区间外按端点值常数外推.
 */
export class Curve {
  readonly xs: Float64Array;
  readonly ys: Float64Array;
  readonly ms: Float64Array;

  constructor(pts: Pt[]) {
    const n = pts.length;
    this.xs = new Float64Array(n);
    this.ys = new Float64Array(n);
    this.ms = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      this.xs[i] = pts[i][0];
      this.ys[i] = pts[i][1];
    }
    if (n === 1) return;
    const d = new Float64Array(n - 1);
    for (let i = 0; i < n - 1; i++) {
      d[i] = (this.ys[i + 1] - this.ys[i]) / Math.max(1e-9, this.xs[i + 1] - this.xs[i]);
    }
    this.ms[0] = d[0];
    this.ms[n - 1] = d[n - 2];
    for (let i = 1; i < n - 1; i++) {
      if (d[i - 1] * d[i] <= 0) this.ms[i] = 0;
      else {
        const h0 = this.xs[i] - this.xs[i - 1];
        const h1 = this.xs[i + 1] - this.xs[i];
        const w1 = 2 * h1 + h0;
        const w2 = h1 + 2 * h0;
        this.ms[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
      }
    }
  }

  static const(v: number) {
    return new Curve([[0, v]]);
  }

  at(x: number): number {
    const xs = this.xs;
    const n = xs.length;
    if (n === 1) return this.ys[0];
    if (x <= xs[0]) return this.ys[0];
    if (x >= xs[n - 1]) return this.ys[n - 1];
    let lo = 0;
    let hi = n - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (xs[mid] > x) hi = mid;
      else lo = mid;
    }
    const h = xs[hi] - xs[lo];
    const t = (x - xs[lo]) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * this.ys[lo] +
      (t3 - 2 * t2 + t) * h * this.ms[lo] +
      (-2 * t3 + 3 * t2) * this.ys[hi] +
      (t3 - t2) * h * this.ms[hi]
    );
  }
}

/** 接受数字或控制点, 统一成 Curve. */
export function toCurve(v: number | Pt[] | undefined, fallback = 0): Curve {
  if (v === undefined) return Curve.const(fallback);
  if (typeof v === 'number') return Curve.const(v);
  return new Curve(v);
}

/** 可复现随机数 (mulberry32). */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hash1(n: number) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

/** 线性插值两个等长数组. */
export function lerpArrays(out: Float32Array, a: ArrayLike<number>, b: ArrayLike<number>, t: number) {
  for (let i = 0; i < out.length; i++) out[i] = a[i] + (b[i] - a[i]) * t;
  return out;
}
