/**
 * 纯 DSP 工具: 数学辅助, 可复现随机数, 噪声 / 混响脉冲 / 包络曲线的离线生成.
 * 只依赖 sampleRate, 不碰节点图. 所有生成结果保证有限 (无 NaN / Infinity), 无直流.
 */

export type Rng = () => number;

export const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);
export const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
/** 在对数域插值 (频率用), a b 必须为正 */
export const logLerp = (a: number, b: number, t: number): number => a * Math.pow(b / a, t);
export const dbToLin = (db: number): number => Math.pow(10, db / 20);
export const linToDb = (x: number): number => 20 * Math.log10(Math.max(x, 1e-12));

/** 宿主传进来的任何数都先过这里: 非有限数回退默认值, 再夹到范围内 */
export function num(v: unknown, def: number, lo = -Infinity, hi = Infinity): number {
  const x = typeof v === 'number' && Number.isFinite(v) ? v : def;
  return x < lo ? lo : x > hi ? hi : x;
}

/** mulberry32: 小而快的可复现 PRNG, 返回 [0, 1) */
export function makeRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const pick = <T>(rng: Rng, arr: readonly T[]): T => arr[Math.min(arr.length - 1, Math.floor(rng() * arr.length))];
/** 单位指数分布 (均值 1). 1 - u 恒在 (0, 1], log 不会出现 -Infinity */
export const expDraw = (rng: Rng): number => -Math.log(1 - rng());
/** 在 [lo, hi] 内均匀取值 */
export const range = (rng: Rng, lo: number, hi: number): number => lo + (hi - lo) * rng();

// ---------------------------------------------------------------------------
// 噪声缓冲
// ---------------------------------------------------------------------------

export type NoiseKind = 'white' | 'pink' | 'brown';

function synth(kind: NoiseKind, out: Float32Array, rng: Rng, sr: number): void {
  const n = out.length;
  if (kind === 'white') {
    for (let i = 0; i < n; i++) out[i] = rng() * 2 - 1;
  } else if (kind === 'pink') {
    // Paul Kellet 精化滤波器, -3 dB/oct
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < n; i++) {
      const w = rng() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.969 * b2 + w * 0.153852;
      b3 = 0.8665 * b3 + w * 0.3104856;
      b4 = 0.55 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.016898;
      out[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362;
      b6 = w * 0.115926;
    }
  } else {
    // 布朗噪声: 漏积分白噪声, 拐点约 11 Hz (再往下变平, 避免无限漂移)
    const leak = Math.exp((-2 * Math.PI * 11) / sr);
    let y = 0;
    for (let i = 0; i < n; i++) {
      y = leak * y + (rng() * 2 - 1);
      out[i] = y;
    }
  }
}

/** 去均值并归一到指定 RMS */
function normalise(x: Float32Array, rms: number, from = 0, to = x.length): void {
  const n = to - from;
  let m = 0;
  for (let i = from; i < to; i++) m += x[i];
  m /= n;
  let e = 0;
  for (let i = from; i < to; i++) {
    const v = x[i] - m;
    x[i] = v;
    e += v * v;
  }
  const s = e > 0 ? rms / Math.sqrt(e / n) : 0;
  for (let i = from; i < to; i++) x[i] *= s;
}

export interface NoiseOpts {
  /** 归一后的 RMS, 默认 0.3 (峰值约 1.0) */
  rms?: number;
  /** 左右声道相关系数 0..1, 越小越宽 */
  corr?: number;
  /** 首尾交叉淡化时长, 让循环无缝 */
  fadeSec?: number;
}

/**
 * 生成可无缝循环的立体声噪声缓冲.
 * 首尾做等功率交叉淡化: 循环点两侧是同一随机过程的连续样本, 听不到接缝.
 */
export function makeNoiseBuffer(
  ctx: BaseAudioContext,
  kind: NoiseKind,
  seconds: number,
  rng: Rng,
  opts: NoiseOpts = {},
): AudioBuffer {
  const sr = ctx.sampleRate;
  const n = Math.max(4096, Math.round(seconds * sr));
  const xf = Math.min(Math.round((opts.fadeSec ?? 0.5) * sr), n >> 1);
  const warm = 4096;
  const total = n + xf;
  const rms = opts.rms ?? 0.3;
  const corr = clamp(opts.corr ?? 0, 0, 0.99);
  const ind = Math.sqrt(1 - corr * corr);

  const gen = (): Float32Array => {
    const raw = new Float32Array(total + warm);
    synth(kind, raw, rng, sr);
    const x = raw.subarray(warm);
    normalise(x, 1);
    return x;
  };
  const a = gen();
  const b = gen();
  const buf = ctx.createBuffer(2, n, sr);
  for (let ch = 0; ch < 2; ch++) {
    const src = new Float32Array(total);
    if (ch === 0) src.set(a);
    else for (let i = 0; i < total; i++) src[i] = corr * a[i] + ind * b[i];
    const out = buf.getChannelData(ch);
    for (let i = 0; i < n; i++) out[i] = src[i];
    for (let i = 0; i < xf; i++) {
      const ph = ((i + 0.5) / xf) * (Math.PI / 2);
      out[i] = src[i] * Math.sin(ph) + src[n + i] * Math.cos(ph);
    }
    normalise(out, rms);
  }
  return buf;
}

/**
 * 虾群爆裂用的短脉冲库: 每个 ~14 ms, 指数衰减的噪声 + 阻尼环振, 一阶差分去直流并提亮.
 * 左右声道预先烘焙不同位置, 使用时不必再挂声像节点. 峰值归一到 1.
 */
export function makeClickBank(ctx: BaseAudioContext, rng: Rng, count = 12): AudioBuffer[] {
  const sr = ctx.sampleRate;
  const len = Math.round(sr * 0.014);
  const bank: AudioBuffer[] = [];
  for (let k = 0; k < count; k++) {
    const fRing = 2200 + rng() * 4300;
    const tau = 0.0004 + rng() * 0.001;
    const mixN = 0.45 + rng() * 0.55;
    const phi = rng() * Math.PI * 2;
    const pan = (rng() * 2 - 1) * 0.9;
    const gL = Math.cos(((pan + 1) * Math.PI) / 4);
    const gR = Math.sin(((pan + 1) * Math.PI) / 4);
    const s = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      const env = Math.exp(-t / tau) * (1 - Math.exp(-t / 0.00006));
      s[i] = env * (mixN * (rng() * 2 - 1) + (1 - mixN) * Math.sin(2 * Math.PI * fRing * t + phi));
    }
    // 一阶差分: 去直流 + 亮度
    const d = new Float32Array(len);
    for (let i = 1; i < len; i++) d[i] = s[i] - s[i - 1];
    let pk = 0;
    for (let i = 0; i < len; i++) pk = Math.max(pk, Math.abs(d[i]));
    const g = pk > 0 ? 1 / pk : 0;
    const b = ctx.createBuffer(2, len, sr);
    const L = b.getChannelData(0);
    const R = b.getChannelData(1);
    for (let i = 0; i < len; i++) {
      // 末尾 2 ms 线性收零, 防止截断
      const tail = Math.min(1, (len - 1 - i) / (0.002 * sr));
      L[i] = d[i] * g * gL * tail;
      R[i] = d[i] * g * gR * tail;
    }
    bank.push(b);
  }
  return bank;
}

/**
 * 水下空间的混响脉冲: 指数衰减的滤波噪声, 高频衰减比低频快 (时变一阶双级低通), 深暗.
 * RT60 = seconds. 左右声道独立噪声 + 略不同的预延迟, 得到宽而不糊的尾巴.
 */
export function makeReverbImpulse(ctx: BaseAudioContext, seconds: number, rng: Rng): AudioBuffer {
  const sr = ctx.sampleRate;
  const n = Math.round(seconds * sr);
  const buf = ctx.createBuffer(2, n, sr);
  const tau = seconds / Math.log(1000);
  const fadeOut = Math.round(0.12 * sr);
  const envStep = Math.exp(-1 / (tau * sr));
  // 低通截止从 4600 Hz 指数降到 340 Hz, 每 32 样本更新一次系数
  const fcRatioPerBlock = Math.pow(340 / 4600, 32 / (seconds * 0.85 * sr));
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    const pre = Math.round((0.011 + 0.007 * ch) * sr);
    let y1 = 0, y2 = 0, hx = 0, hy = 0;
    let pk = 0;
    let fc = 4600;
    let a = Math.exp((-2 * Math.PI * fc) / sr);
    let env = 1;
    for (let i = 0; i < n; i++) {
      if ((i & 31) === 0) {
        if (fc > 340) fc *= fcRatioPerBlock;
        a = Math.exp((-2 * Math.PI * fc) / sr);
      }
      env *= envStep;
      const w = rng() * 2 - 1;
      y1 = a * y1 + (1 - a) * w;
      y2 = a * y2 + (1 - a) * y1;
      let x = 0;
      if (i >= pre) {
        const fadeIn = Math.min(1, (i - pre) / (0.02 * sr));
        x = y2 * env * fadeIn * fadeIn;
      }
      // 去掉 ~50 Hz 以下, 避免低频糊成一团
      hy = x - hx + 0.9935 * hy;
      hx = x;
      d[i] = hy;
      pk = Math.max(pk, Math.abs(hy));
    }
    const g = pk > 0 ? 0.9 / pk : 0;
    for (let i = 0; i < n; i++) {
      const tail = i > n - fadeOut ? 0.5 + 0.5 * Math.cos((Math.PI * (i - (n - fadeOut))) / fadeOut) : 1;
      d[i] *= g * tail;
    }
  }
  return buf;
}

// ---------------------------------------------------------------------------
// 曲线
// ---------------------------------------------------------------------------

/** 0 -> 1 -> 0 的钟形包络, skew < 1 峰更靠前, > 1 更靠后. 首尾严格为 0 */
export function bellCurve(points: number, skew = 1, scale = 1): Float32Array<ArrayBuffer> {
  const c = new Float32Array(points);
  for (let i = 0; i < points; i++) {
    const x = i / (points - 1);
    const s = Math.sin(Math.PI * Math.pow(x, skew));
    c[i] = s * s * scale;
  }
  c[0] = 0;
  c[points - 1] = 0;
  return c;
}

/**
 * 软削波曲线: 小信号增益严格为 1, 输入 ±1 时输出 ±ceil. 点数取奇数, 中点恰为 0 (不引入直流).
 * 作为输出最后一道保险, 正常电平下几乎是线性直通.
 */
export function softClipCurve(points: number, ceil: number): Float32Array<ArrayBuffer> {
  const target = 1 / ceil;
  let lo = 1e-3;
  let hi = 6;
  for (let i = 0; i < 60; i++) {
    const k = (lo + hi) / 2;
    if (k / Math.tanh(k) < target) lo = k;
    else hi = k;
  }
  const k = (lo + hi) / 2;
  const norm = Math.tanh(k);
  const c = new Float32Array(points);
  for (let i = 0; i < points; i++) {
    const x = (i / (points - 1)) * 2 - 1;
    c[i] = (ceil * Math.tanh(k * x)) / norm;
  }
  c[(points - 1) / 2] = 0;
  return c;
}

/** 一条平滑随机游走曲线 (线性插值点), 用来给频率 / 音高做不规则轮廓 */
export function wanderCurve(points: number, rng: Rng, lo: number, hi: number, smooth = 0.6): Float32Array<ArrayBuffer> {
  const c = new Float32Array(points);
  let v = rng();
  for (let i = 0; i < points; i++) {
    v = v * smooth + rng() * (1 - smooth);
    c[i] = lo + (hi - lo) * v;
  }
  return c;
}
