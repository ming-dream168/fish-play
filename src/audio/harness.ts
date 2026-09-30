/**
 * 离线验证 harness: 把同一套 AudioEngine 图注入 OfflineAudioContext 渲染, 在页面里直接分析样本.
 * 由 audio-test.html 加载, scripts/audio-test.mjs 用 playwright 驱动并打印结果.
 *
 * 驱动方式: 用 ctx.suspend(t) 在精确的渲染时刻暂停, 在回调里调用引擎的公开 API (和实时用法完全一致),
 * 再 resume. 内部调度器 tick() 按 250 ms 一次同样由这里驱动, 等价于实时模式的 setInterval.
 */

import { AudioEngine, type SceneFlavor } from './AudioEngine';
import { makeNoiseBuffer, makeRng } from './dsp';
import type { UiKind } from './voices';

// ---------------------------------------------------------------------------
// 样本分析
// ---------------------------------------------------------------------------

export interface Stereo {
  L: Float32Array;
  R: Float32Array;
  sr: number;
}

const db = (x: number): number => 10 * Math.log10(Math.max(x, 1e-20));
const r1 = (x: number): number => Math.round(x * 10) / 10;
const r3 = (x: number): number => Math.round(x * 1000) / 1000;

/** 原地 radix-2 FFT */
function fft(re: Float64Array, im: Float64Array): void {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      const tr = re[i]; re[i] = re[j]; re[j] = tr;
      const ti = im[i]; im[i] = im[j]; im[j] = ti;
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang);
    const wi = Math.sin(ang);
    const half = len >> 1;
    for (let i = 0; i < n; i += len) {
      let cr = 1;
      let ci = 0;
      for (let j = 0; j < half; j++) {
        const a = i + j;
        const b = a + half;
        const vr = re[b] * cr - im[b] * ci;
        const vi = re[b] * ci + im[b] * cr;
        re[b] = re[a] - vr; im[b] = im[a] - vi;
        re[a] += vr; im[a] += vi;
        const ncr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = ncr;
      }
    }
  }
}

const NFFT = 4096;

/** Welch 功率谱 (两声道平均), 返回单边 "每 bin 均方值", 总和 = 信号均方 */
function spectrum(s: Stereo, from: number, to: number): Float64Array {
  const i0 = Math.max(0, Math.floor(from * s.sr));
  const i1 = Math.min(s.L.length, Math.floor(to * s.sr));
  const P = new Float64Array(NFFT / 2 + 1);
  const re = new Float64Array(NFFT);
  const im = new Float64Array(NFFT);
  let frames = 0;
  const seg = i1 - i0;
  const frameLen = Math.min(NFFT, seg);
  if (frameLen < 64) return P;
  const win = new Float64Array(frameLen);
  let wEnergy = 0;
  for (let i = 0; i < frameLen; i++) {
    win[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * (i + 0.5)) / frameLen);
    wEnergy += win[i] * win[i];
  }
  const hop = Math.max(1, frameLen >> 1);
  for (const ch of [s.L, s.R]) {
    for (let p = i0; p + frameLen <= i1; p += hop) {
      re.fill(0); im.fill(0);
      for (let i = 0; i < frameLen; i++) re[i] = ch[p + i] * win[i];
      fft(re, im);
      for (let k = 0; k <= NFFT / 2; k++) {
        const pw = (re[k] * re[k] + im[k] * im[k]) / (NFFT * wEnergy);
        P[k] += k === 0 || k === NFFT / 2 ? pw : 2 * pw;
      }
      frames++;
    }
  }
  if (frames) for (let k = 0; k < P.length; k++) P[k] /= frames;
  return P;
}

const BANDS = [31.5, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

function bandDb(P: Float64Array, sr: number): number[] {
  return BANDS.map((c) => {
    const lo = c / Math.SQRT2;
    const hi = c * Math.SQRT2;
    let sum = 0;
    for (let k = 1; k < P.length; k++) {
      const f = (k * sr) / NFFT;
      if (f >= lo && f < hi) sum += P[k];
    }
    return r1(db(sum));
  });
}

function centroid(P: Float64Array, sr: number): number {
  let num = 0;
  let den = 0;
  for (let k = 1; k < P.length; k++) {
    const f = (k * sr) / NFFT;
    if (f < 20) continue;
    num += f * P[k];
    den += P[k];
  }
  return den > 0 ? Math.round(num / den) : 0;
}

export interface Basic {
  peakDb: number;
  rmsDb: number;
  meanL: number;
  meanR: number;
  nonFinite: number;
  /** 全程绝对值最大的相邻样本差 */
  maxStep: number;
}

/** 区间内峰值 / RMS (两声道功率平均) / 直流 / 非有限样本数 */
function basic(s: Stereo, from: number, to: number): Basic {
  const i0 = Math.max(0, Math.floor(from * s.sr));
  const i1 = Math.min(s.L.length, Math.floor(to * s.sr));
  let pk = 0, e = 0, mL = 0, mR = 0, bad = 0, step = 0;
  for (let i = i0; i < i1; i++) {
    const l = s.L[i];
    const r = s.R[i];
    if (!Number.isFinite(l) || !Number.isFinite(r)) {
      bad++;
      continue;
    }
    pk = Math.max(pk, Math.abs(l), Math.abs(r));
    e += l * l + r * r;
    mL += l;
    mR += r;
    if (i > i0) step = Math.max(step, Math.abs(l - s.L[i - 1]), Math.abs(r - s.R[i - 1]));
  }
  const n = Math.max(1, i1 - i0);
  return { peakDb: r1(db(pk * pk)), rmsDb: r1(db(e / (2 * n))), meanL: mL / n, meanR: mR / n, nonFinite: bad, maxStep: step };
}

/** 左右声道相关系数 (-1..1): 越接近 1 越窄 / 单声道, 越接近 0 越宽, 负值有相位问题 */
function stereoCorr(s: Stereo, from: number, to: number): number {
  const i0 = Math.max(0, Math.floor(from * s.sr));
  const i1 = Math.min(s.L.length, Math.floor(to * s.sr));
  let ll = 0, rr = 0, lr = 0;
  for (let i = i0; i < i1; i++) {
    ll += s.L[i] * s.L[i];
    rr += s.R[i] * s.R[i];
    lr += s.L[i] * s.R[i];
  }
  return r3(lr / Math.sqrt(Math.max(1e-30, ll * rr)));
}

/**
 * 爆音检测: 二阶差分在 10 ms 块内的 "最大值 / RMS". 高斯噪声约 3.5-4.5, 平滑淡变同样如此;
 * 台阶 / 断点 / 突变会让某一块的比值飙到 10 以上 (块内只有一个尖峰时理论上限 ~22).
 * 枪虾爆裂本身就是尖峰, 所以过渡测试统一放在 200-300 m (没有枪虾) 做.
 */
function clickScore(s: Stereo, from: number, to: number): number {
  const i0 = Math.max(2, Math.floor(from * s.sr));
  const i1 = Math.min(s.L.length, Math.floor(to * s.sr));
  const B = Math.round(s.sr * 0.01);
  let worst = 0;
  for (const ch of [s.L, s.R]) {
    for (let p = i0; p + B <= i1; p += B) {
      let e = 0;
      let mx = 0;
      let amp = 0;
      for (let i = p; i < p + B; i++) {
        const d = ch[i] - 2 * ch[i - 1] + ch[i - 2];
        e += d * d;
        mx = Math.max(mx, Math.abs(d));
        amp = Math.max(amp, Math.abs(ch[i]));
      }
      // 低于 -70 dBFS 的块不参与: 那是混响尾 / 淡出末段的数值底噪 (浏览器的 setTargetAtTime 在逼近目标时会把
      // 极小的增益直接吸附到 0, 产生 -80 dBFS 以下的台阶), 在任何真实场景里都完全不可闻
      if (amp < 3e-4) continue;
      const rms = Math.sqrt(e / B);
      if (rms > 0) worst = Math.max(worst, mx / rms);
    }
  }
  return r1(worst);
}

function perSecond(s: Stereo, from: number, to: number): number[] {
  const out: number[] = [];
  for (let t = from; t + 1 <= to + 1e-9; t += 1) out.push(basic(s, t, t + 1).rmsDb);
  return out;
}

/** 二阶高通 (RBJ, Q = 0.707), 用来单独看枪虾爆裂 (2.5 kHz 以上) 的电平 */
function highpassStats(x: Float32Array, sr: number, fc: number, from: number, to: number): { rmsDb: number; peakDb: number } {
  const w0 = (2 * Math.PI * fc) / sr;
  const c = Math.cos(w0);
  const alpha = Math.sin(w0) / (2 * Math.SQRT1_2);
  const a0 = 1 + alpha;
  const b0 = (1 + c) / 2 / a0, b1 = -(1 + c) / a0, b2 = (1 + c) / 2 / a0;
  const a1 = (-2 * c) / a0, a2 = (1 - alpha) / a0;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0, e = 0, pk = 0, n = 0;
  const i0 = Math.floor(from * sr);
  const i1 = Math.min(x.length, Math.floor(to * sr));
  for (let i = 0; i < i1; i++) {
    const v = x[i];
    const y = b0 * v + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = v; y2 = y1; y1 = y;
    if (i >= i0) {
      e += y * y;
      pk = Math.max(pk, Math.abs(y));
      n++;
    }
  }
  return { rmsDb: r1(db(e / Math.max(1, n))), peakDb: r1(db(pk * pk)) };
}

// ---------------------------------------------------------------------------
// 离线渲染
// ---------------------------------------------------------------------------

type Step = [number, (e: AudioEngine) => void];

export interface RenderSpec {
  seconds: number;
  sr?: number;
  seed?: number;
  volume?: number;
  scene?: SceneFlavor;
  depth?: number;
  swim?: number;
  /** 默认 true */
  enabled?: boolean;
  /** 调度器 tick 间隔 (s), null = 不 tick (孤立测一次性发声) */
  tickEvery?: number | null;
  /** 孤立模式: 静音常驻环境层 + 停掉随机事件调度, 只留手动触发的声音 */
  isolate?: boolean;
  /** init 之后, 渲染开始之前调用 (可往 debug.buses.pre 里注入探针等) */
  before?: (e: AudioEngine, ctx: OfflineAudioContext) => void;
  steps?: Step[];
}

export interface RenderResult extends Stereo {
  stats: Record<string, number>;
  errors: string[];
  warnings: string[];
  /** startRendering 耗时 (ms), 用来估计实时 CPU 占用 */
  renderMs: number;
}

const QUANTUM = 128;

export async function render(spec: RenderSpec): Promise<RenderResult> {
  const sr = spec.sr ?? 48000;
  const frames = Math.round(spec.seconds * sr);
  const ctx = new OfflineAudioContext(2, frames, sr);
  const engine = new AudioEngine({ context: ctx, manualTick: true, seed: spec.seed ?? 12345 });
  const errors: string[] = [];
  const warnings: string[] = [];
  const origWarn = console.warn;
  console.warn = (...a: unknown[]): void => {
    warnings.push(a.map(String).join(' '));
  };
  try {
    // 状态先于 init 设置, 顺便验证 "init 前设置的状态在建图后生效"
    engine.setVolume(spec.volume ?? 1);
    if (spec.scene) engine.setScene(spec.scene);
    if (spec.depth !== undefined) engine.setDepth(spec.depth);
    if (spec.swim !== undefined) engine.setSwimSpeed(spec.swim);
    if (spec.enabled !== false) engine.setEnabled(true);
    await engine.init();
    if (spec.isolate) engine.isolate(true);
    spec.before?.(engine, ctx);

    const events = new Map<number, Array<() => void>>();
    const immediate: Array<() => void> = [];
    const add = (t: number, fn: () => void): void => {
      if (t <= 0) {
        immediate.push(fn);
        return;
      }
      const k = Math.max(1, Math.round((t * sr) / QUANTUM));
      if (k * QUANTUM >= frames) return;
      const list = events.get(k);
      if (list) list.push(fn);
      else events.set(k, [fn]);
    };
    if (spec.tickEvery !== null) {
      const dt = spec.tickEvery ?? 0.25;
      for (let t = 0; t < spec.seconds; t += dt) add(t, () => engine.tick());
    }
    for (const [t, fn] of spec.steps ?? []) add(t, () => fn(engine));
    for (const fn of immediate) fn();

    for (const k of [...events.keys()].sort((a, b) => a - b)) {
      const fns = events.get(k)!;
      void ctx.suspend((k * QUANTUM) / sr).then(() => {
        for (const fn of fns) {
          try {
            fn();
          } catch (e) {
            errors.push(String(e));
          }
        }
        return ctx.resume();
      });
    }
    const rt0 = performance.now();
    const buf = await ctx.startRendering();
    const renderMs = performance.now() - rt0;
    const result: RenderResult = {
      L: buf.getChannelData(0).slice(),
      R: buf.getChannelData(1).slice(),
      sr,
      stats: { ...engine.debug.stats },
      errors,
      warnings,
      renderMs,
    };
    engine.dispose();
    return result;
  } finally {
    console.warn = origWarn;
  }
}

// ---------------------------------------------------------------------------
// 一次性发声的孤立分析
// ---------------------------------------------------------------------------

export interface EventReport {
  name: string;
  peakDb: number;
  /** 活跃段 (10 ms 块功率在峰值块 -30 dB 之内) 的 RMS */
  activeRmsDb: number;
  activeMs: number;
  /** 峰值到功率跌破 -70 dBFS 的时间 (含混响尾巴) */
  tailMs: number;
  centroidHz: number;
  bandsDb: number[];
  /** 活跃段内最大相邻样本差 / 峰值: 音调类声音里 > 0.6 基本就是爆音 */
  stepRatio: number;
  /** 起音 / 收尾的爆音检测 (见 clickScore); 平滑的声音 < 8, 本来就是瞬态的 (枪虾 / 继电器 / 水花) 会更高 */
  click: number;
  nonFinite: number;
  errors: string[];
}

function analyseEvent(name: string, r: RenderResult, t0: number, t1: number): EventReport {
  const sr = r.sr;
  const blk = Math.round(sr * 0.01);
  const i0 = Math.floor(t0 * sr);
  const i1 = Math.min(r.L.length, Math.floor(t1 * sr));
  const nb = Math.floor((i1 - i0) / blk);
  const pw: number[] = [];
  for (let b = 0; b < nb; b++) {
    let e = 0;
    for (let i = i0 + b * blk; i < i0 + (b + 1) * blk; i++) e += (r.L[i] * r.L[i] + r.R[i] * r.R[i]) / 2;
    pw.push(e / blk);
  }
  const maxP = Math.max(...pw, 1e-20);
  let first = -1, last = -1, pkBlock = 0;
  pw.forEach((p, b) => {
    if (p > maxP * 1e-3) {
      if (first < 0) first = b;
      last = b;
    }
    if (p === maxP) pkBlock = b;
  });
  if (first < 0) first = 0;
  if (last < 0) last = 0;
  let sum = 0;
  for (let b = first; b <= last; b++) sum += pw[b];
  let tail = pkBlock;
  for (let b = pkBlock; b < nb; b++) if (pw[b] > 1e-7) tail = b;
  const a0 = t0 + (first * blk) / sr;
  const a1 = t0 + ((last + 1) * blk) / sr;
  const bs = basic(r, t0, t1);
  const act = basic(r, a0, a1);
  const P = spectrum(r, a0, a1);
  return {
    name,
    peakDb: bs.peakDb,
    activeRmsDb: r1(db(sum / (last - first + 1))),
    activeMs: (last - first + 1) * 10,
    tailMs: (tail - pkBlock + 1) * 10,
    centroidHz: centroid(P, sr),
    bandsDb: bandDb(P, sr),
    stepRatio: r3(act.maxStep / Math.max(1e-9, Math.pow(10, bs.peakDb / 20))),
    click: clickScore(r, t0, t1),
    nonFinite: bs.nonFinite,
    errors: [...r.errors, ...r.warnings],
  };
}

interface OneShot {
  name: string;
  seconds: number;
  run: (e: AudioEngine) => void;
  /** 需要连续调用 (如 inflate) 的额外步骤 */
  steps?: Step[];
  scene?: SceneFlavor;
}

const T0 = 0.5;

const ONE_SHOTS: OneShot[] = [
  { name: 'heartbeat(0.6)', seconds: 2.5, run: (e) => e.heartbeat(0.6) },
  { name: 'heartbeat(1.0)', seconds: 2.5, run: (e) => e.heartbeat(1) },
  { name: 'gillPulse', seconds: 3, run: (e) => e.gillPulse() },
  { name: 'bubble(0.2)', seconds: 3, run: (e) => e.bubble(0.2) },
  { name: 'bubble(0.5)', seconds: 3, run: (e) => e.bubble(0.5) },
  { name: 'bubble(0.9)', seconds: 3, run: (e) => e.bubble(0.9) },
  { name: 'ui hover', seconds: 1.5, run: (e) => e.ui('hover') },
  { name: 'ui click', seconds: 1.5, run: (e) => e.ui('click') },
  { name: 'ui toggle(on)', seconds: 1.5, run: (e) => e.ui('toggle', true) },
  { name: 'ui toggle(off)', seconds: 1.5, run: (e) => e.ui('toggle', false) },
  { name: 'ui open', seconds: 1.5, run: (e) => e.ui('open') },
  { name: 'ui close', seconds: 1.5, run: (e) => e.ui('close') },
  { name: 'ui scan', seconds: 1.5, run: (e) => e.ui('scan') },
  { name: 'ui error', seconds: 1.5, run: (e) => e.ui('error') },
  { name: 'sonarPing(0)', seconds: 3, run: (e) => e.sonarPing(0) },
  { name: 'sonarPing(-1)', seconds: 3, run: (e) => e.sonarPing(-1) },
  { name: 'morph(1.5)', seconds: 5, run: (e) => e.morph(1.5) },
  { name: 'morph(4)', seconds: 8, run: (e) => e.morph(4) },
  { name: 'escape', seconds: 3, run: (e) => e.escape() },
  { name: 'drum (大黄鱼)', seconds: 4, run: (e) => e.drum({ f0: 620, rate: 30, pulses: 12, calls: 4, gap: 0.36 }) },
  {
    name: 'inflate 0->1 (1.2s)',
    seconds: 4,
    run: (e) => e.inflate(0),
    steps: Array.from({ length: 25 }, (_, i): Step => [T0 + 0.05 + i * 0.05, (e) => e.inflate(Math.min(1, (i + 1) / 24))]),
  },
  { name: 'xrayHum(on) 3s', seconds: 4.5, run: (e) => e.xrayHum(true) },
  { name: 'amb: snap', seconds: 1.5, run: (e) => e.trigger('snap'), scene: 'living' },
  { name: 'amb: bubble', seconds: 3, run: (e) => e.trigger('bubble'), scene: 'living' },
  { name: 'amb: creak', seconds: 4, run: (e) => e.trigger('creak'), scene: 'living' },
  { name: 'amb: whale', seconds: 9, run: (e) => e.trigger('whale'), scene: 'living' },
  { name: 'amb: deepTone', seconds: 14, run: (e) => e.trigger('tone'), scene: 'abyss' },
  { name: 'amb: glassPing', seconds: 5, run: (e) => e.trigger('ping'), scene: 'anatomy' },
  { name: 'amb: relay', seconds: 2, run: (e) => e.trigger('relay') },
];

async function runOneShots(): Promise<EventReport[]> {
  const out: EventReport[] = [];
  for (const o of ONE_SHOTS) {
    const steps: Step[] = [[T0, o.run], ...(o.steps ?? [])];
    if (o.name === 'xrayHum(on) 3s') steps.push([T0 + 3, (e) => e.xrayHum(false)]);
    const r = await render({
      seconds: o.seconds,
      scene: o.scene ?? 'living',
      volume: 1,
      isolate: true,
      // 充气 / 电嗡声需要 tick 做延迟收尾, 其余孤立测量不 tick
      tickEvery: o.name.startsWith('inflate') || o.name.startsWith('xray') ? 0.25 : null,
      steps,
    });
    out.push(analyseEvent(o.name, r, T0 - 0.1, o.seconds));
  }
  return out;
}

// ---------------------------------------------------------------------------
// 各项测试
// ---------------------------------------------------------------------------

export interface AmbReport {
  name: string;
  rmsDb: number;
  perSecondDb: number[];
  peakDb: number;
  meanL: number;
  meanR: number;
  nonFinite: number;
  centroidHz: number;
  bandsDb: number[];
  events: Record<string, number>;
  errors: string[];
  /** 2.5 kHz 以上 (主要是枪虾爆裂) 的 RMS / 峰值 */
  hfRmsDb: number;
  hfPeakDb: number;
  /** 左右声道相关系数 */
  corr: number;
  /** 渲染速度: 音频时长 / 渲染耗时 (倍实时) */
  xRealtime: number;
}

const AMB_SECONDS = 18;
const AMB_FROM = 2;

async function ambience(name: string, spec: Partial<RenderSpec>): Promise<AmbReport> {
  const r = await render({ seconds: AMB_SECONDS, volume: 1, ...spec });
  const b = basic(r, AMB_FROM, AMB_SECONDS);
  const P = spectrum(r, AMB_FROM, AMB_SECONDS);
  const hf = highpassStats(r.L, r.sr, 2500, AMB_FROM, AMB_SECONDS);
  return {
    name,
    rmsDb: b.rmsDb,
    perSecondDb: perSecond(r, AMB_FROM, AMB_SECONDS),
    peakDb: b.peakDb,
    meanL: b.meanL,
    meanR: b.meanR,
    nonFinite: b.nonFinite,
    centroidHz: centroid(P, r.sr),
    bandsDb: bandDb(P, r.sr),
    events: r.stats,
    errors: [...r.errors, ...r.warnings],
    hfRmsDb: hf.rmsDb,
    hfPeakDb: hf.peakDb,
    corr: stereoCorr(r, AMB_FROM, AMB_SECONDS),
    xRealtime: Math.round(AMB_SECONDS / (r.renderMs / 1000)),
  };
}

async function ambienceSuite(): Promise<AmbReport[]> {
  const out: AmbReport[] = [];
  out.push(await ambience('living d0', { scene: 'living', depth: 0 }));
  out.push(await ambience('living d200', { scene: 'living', depth: 200 }));
  out.push(await ambience('living d1000', { scene: 'living', depth: 1000 }));
  out.push(await ambience('living d4000', { scene: 'living', depth: 4000 }));
  out.push(await ambience('living d8000', { scene: 'living', depth: 8000 }));
  out.push(await ambience('anatomy', { scene: 'anatomy' }));
  out.push(await ambience('cleared', { scene: 'cleared' }));
  out.push(await ambience('xray', { scene: 'xray' }));
  out.push(await ambience('flow', { scene: 'flow' }));
  out.push(await ambience('abyss', { scene: 'abyss' }));
  out.push(await ambience('abyss d6000', { scene: 'abyss', depth: 6000 }));
  out.push(await ambience('living d0 swim0.5', { scene: 'living', depth: 0, swim: 0.5 }));
  out.push(await ambience('living d0 swim1', { scene: 'living', depth: 0, swim: 1 }));
  return out;
}

export interface TimelineReport {
  peakDb: number;
  rmsDb: number;
  perSecondDb: number[];
  meanL: number;
  meanR: number;
  nonFinite: number;
  events: Record<string, number>;
  errors: string[];
}

/** 12 s 的综合时间线: 环境 + 所有一次性发声 */
async function timeline(): Promise<TimelineReport> {
  const steps: Step[] = [];
  const at = (t: number, fn: (e: AudioEngine) => void): void => {
    steps.push([t, fn]);
  };
  for (const t of [2.0, 2.8, 3.6, 4.4, 5.2, 6.0]) at(t, (e) => e.heartbeat(0.7));
  for (const t of [2.5, 3.5, 4.5, 5.5, 6.5]) at(t, (e) => e.gillPulse());
  at(3.0, (e) => e.bubble(0.3));
  at(5.0, (e) => e.bubble(0.8));
  at(4.0, (e) => e.xrayHum(true));
  at(9.0, (e) => e.xrayHum(false));
  const uis: Array<[number, UiKind, boolean?]> = [
    [6.2, 'hover'], [6.6, 'click'], [7.0, 'toggle', true], [7.3, 'toggle', false],
    [7.6, 'open'], [8.0, 'close'], [8.3, 'scan'], [8.8, 'error'],
  ];
  for (const [t, k, on] of uis) at(t, (e) => e.ui(k, on));
  at(9.4, (e) => e.sonarPing(-0.8));
  at(10.2, (e) => e.sonarPing(0.8));
  at(10.8, (e) => e.morph(2.5));
  for (let i = 0; i <= 28; i++) at(11.0 + i * 0.05, (e) => e.inflate(Math.min(1, i / 28)));
  at(12.6, (e) => e.escape());
  const r = await render({ seconds: 16, volume: 1, scene: 'living', depth: 0, steps });
  const b = basic(r, 2, 16);
  return {
    peakDb: b.peakDb,
    rmsDb: b.rmsDb,
    perSecondDb: perSecond(r, 2, 16),
    meanL: b.meanL,
    meanR: b.meanR,
    nonFinite: b.nonFinite,
    events: r.stats,
    errors: [...r.errors, ...r.warnings],
  };
}

/** 最坏情况: 所有声音同时反复触发, 音量拉满 */
async function stress(): Promise<TimelineReport> {
  const steps: Step[] = [];
  const all = (e: AudioEngine): void => {
    e.heartbeat(1);
    e.gillPulse();
    e.bubble(0.6);
    for (const k of ['click', 'toggle', 'open', 'close', 'scan', 'error', 'hover'] as UiKind[]) e.ui(k);
    e.sonarPing(0.5);
    e.morph(3);
    e.escape();
    e.trigger('whale');
    e.trigger('creak');
    e.trigger('tone');
    e.trigger('ping');
    for (let i = 0; i < 6; i++) e.trigger('snap');
  };
  steps.push([0.5, (e) => e.xrayHum(true)]);
  for (let t = 1.0; t < 7; t += 0.4) steps.push([t, all]);
  for (let i = 0; i <= 40; i++) steps.push([1.0 + i * 0.05, (e) => e.inflate(0.5 + 0.5 * Math.sin(i * 0.4))]);
  const r = await render({ seconds: 10, volume: 1, scene: 'living', steps });
  const b = basic(r, 0, 10);
  return {
    peakDb: b.peakDb,
    rmsDb: b.rmsDb,
    perSecondDb: perSecond(r, 0, 10),
    meanL: b.meanL,
    meanR: b.meanR,
    nonFinite: b.nonFinite,
    events: r.stats,
    errors: [...r.errors, ...r.warnings],
  };
}

export interface TransitionReport {
  name: string;
  detail: Record<string, number | string>;
}

/** 开关 / 场景切换 / 音量变化 / 层摘除重接: 检查电平走势与爆音 (clickScore, 全部在 300 m 做, 避开枪虾) */
async function transitions(): Promise<TransitionReport[]> {
  const out: TransitionReport[] = [];
  const D = 300;

  // a) 先启用后关闭
  {
    const r = await render({ seconds: 10, scene: 'living', depth: D, steps: [[5, (e) => e.setEnabled(false)]] });
    const base = basic(r, 3, 4.9);
    out.push({
      name: 'disable at 5 s',
      detail: {
        steadyDb: base.rmsDb,
        afterDb: basic(r, 7, 10).rmsDb,
        afterPeakDb: basic(r, 7, 10).peakDb,
        fade_0p5_to_0p6s_db: r1(basic(r, 5.5, 5.6).rmsDb - base.rmsDb),
        clickBefore: clickScore(r, 3, 4.9),
        clickDuring: clickScore(r, 5, 5.8),
      },
    });
  }
  // b) 关闭状态下重新启用 (离线里没有 suspend, 只验证淡入)
  {
    const r = await render({ seconds: 10, scene: 'living', depth: D, enabled: false, steps: [[3, (e) => e.setEnabled(true)]] });
    out.push({
      name: 'enable at 3 s (from disabled)',
      detail: {
        beforeDb: basic(r, 0.5, 2.9).rmsDb,
        first100msDb: basic(r, 3, 3.1).rmsDb,
        steadyDb: basic(r, 5, 9.9).rmsDb,
        clickBefore: clickScore(r, 5, 9.9),
        clickDuring: clickScore(r, 3, 3.8),
      },
    });
  }
  // c) 场景切换 living -> abyss, 每 0.5 s 一个窗口看走势
  {
    const r = await render({ seconds: 12, scene: 'living', depth: D, steps: [[5, (e) => e.setScene('abyss')]] });
    const win: number[] = [];
    for (let t = 4; t < 9; t += 0.5) win.push(basic(r, t, t + 0.5).rmsDb);
    out.push({
      name: 'scene living -> abyss at 5 s (0.5 s windows from 4 s)',
      detail: { windowsDb: win.join(' '), clickBefore: clickScore(r, 3, 4.9), clickDuring: clickScore(r, 5, 6.6), settledDb: basic(r, 8, 12).rmsDb },
    });
  }
  // d) 音量变化 1.0 -> 0.5 (平方曲线, 期望约 -12 dB). 与不变音量的对照渲染比较 (底噪自身有慢起伏)
  {
    const ctl = await render({ seconds: 10, scene: 'living', depth: D });
    const r = await render({ seconds: 10, scene: 'living', depth: D, steps: [[5, (e) => e.setVolume(0.5)]] });
    const a = basic(r, 3, 4.9);
    const b = basic(r, 7, 10);
    const bc = basic(ctl, 7, 10);
    out.push({
      name: 'volume 1.0 -> 0.5 at 5 s (vs control render)',
      detail: { beforeDb: a.rmsDb, afterDb: b.rmsDb, controlAfterDb: bc.rmsDb, deltaDb: r1(b.rmsDb - bc.rmsDb), clickBefore: clickScore(r, 3, 4.9), clickDuring: clickScore(r, 5, 5.4) },
    });
  }
  // f) 层的摘除 / 重接: anatomy 里 bed 等层从头就没接, 切到 living 时接上, 不能有台阶
  {
    const r = await render({ seconds: 14, scene: 'anatomy', steps: [[6, (e) => e.setScene('living')], [6, (e) => e.setDepth(D)]] });
    out.push({
      name: 'scene anatomy -> living at 6 s (layers re-attach)',
      detail: {
        windowsDb: [5.5, 6, 6.5, 7, 7.5, 8, 9, 10, 12].map((t) => basic(r, t, t + 0.5).rmsDb).join(' '),
        clickBefore: clickScore(r, 3, 5.9),
        clickDuring: clickScore(r, 6, 8),
        settledDb: basic(r, 11, 14).rmsDb,
      },
    });
  }
  // g) 游速 0 -> 1: rush 层此前一直被摘掉
  {
    const r = await render({ seconds: 12, scene: 'living', depth: D, steps: [[6, (e) => e.setSwimSpeed(1)], [9, (e) => e.setSwimSpeed(0)]] });
    out.push({
      name: 'swim 0 -> 1 at 6 s, back to 0 at 9 s',
      detail: {
        clickBefore: clickScore(r, 3, 5.9),
        clickDuring: clickScore(r, 6, 9),
        clickAfter: clickScore(r, 9, 12),
        beforeDb: basic(r, 3, 5.9).rmsDb,
        duringDb: basic(r, 7.5, 9).rmsDb,
        afterDb: basic(r, 11.5, 12).rmsDb,
      },
    });
  }
  // h) 快速来回切场景 (摘除计时被取消) + 最终回到 living
  {
    const ctl = await render({ seconds: 14, scene: 'living', depth: D });
    const r = await render({
      seconds: 14,
      scene: 'living',
      depth: D,
      steps: [[5, (e) => e.setScene('anatomy')], [5.4, (e) => e.setScene('flow')], [5.8, (e) => e.setScene('living')]],
    });
    out.push({
      name: 'rapid scene hopping living -> anatomy -> flow -> living (5.0-5.8 s)',
      detail: { settledDb: basic(r, 11, 14).rmsDb, controlDb: basic(ctl, 11, 14).rmsDb, clickBefore: clickScore(r, 2, 4.9), clickDuring: clickScore(r, 5, 8), errors: r.errors.length + r.warnings.length },
    });
  }
  // 检测器自检: 往主链入口人为注入一个 -40 dBFS 的台阶, 分数必须明显跳高, 否则上面的 "无爆音" 结论不可信
  {
    const r = await render({
      seconds: 8,
      scene: 'living',
      depth: D,
      before: (e, ctx) => {
        const b = ctx.createBuffer(1, 2, ctx.sampleRate);
        b.getChannelData(0).fill(1);
        const src = ctx.createBufferSource();
        src.buffer = b;
        src.loop = true;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, 0);
        g.gain.setValueAtTime(0.01, 5);
        src.connect(g);
        g.connect(e.debug.buses.pre);
        src.start(0);
      },
    });
    out.push({
      name: 'click detector self-test (a -40 dBFS step injected at 5 s)',
      detail: { clean: clickScore(r, 3, 4.9), withStep: clickScore(r, 4.9, 5.2) },
    });
  }
  // e) 深度连续扫动 0 -> 8000 (每 50 ms 调一次, 模拟拖滑块)
  {
    const steps: Step[] = [];
    for (let i = 0; i <= 160; i++) steps.push([4 + i * 0.05, (e) => e.setDepth(200 + (i / 160) * 7800)]);
    const r = await render({ seconds: 14, scene: 'living', depth: 200, steps });
    const w: number[] = [];
    for (let t = 3; t < 14; t += 1) w.push(basic(r, t, t + 1).rmsDb);
    out.push({
      name: 'depth sweep 200 -> 8000 m over 4..12 s',
      detail: { perSecondDb: w.join(' '), clickBefore: clickScore(r, 2, 4), clickDuring: clickScore(r, 4, 13), errors: r.errors.length + r.warnings.length },
    });
  }
  return out;
}

/** 校准: 把已知电平的正弦注入主链入口, 量整条主母线的增益 (含压缩器自带补偿增益) */
async function chain(): Promise<Array<{ inDb: number; outDb: number; gainDb: number }>> {
  const out: Array<{ inDb: number; outDb: number; gainDb: number }> = [];
  for (const inDb of [-50, -40, -30, -20, -12, -6]) {
    const amp = Math.pow(10, inDb / 20) * Math.SQRT2;
    const r = await render({
      seconds: 3,
      scene: 'living',
      isolate: true,
      tickEvery: null,
      before: (e, ctx) => {
        const o = ctx.createOscillator();
        o.frequency.value = 220;
        const g = ctx.createGain();
        g.gain.value = amp;
        o.connect(g);
        g.connect(e.debug.buses.pre);
        o.start(0);
      },
    });
    const b = basic(r, 1.5, 3);
    out.push({ inDb, outDb: b.rmsDb, gainDb: r1(b.rmsDb - inDb) });
  }
  return out;
}

async function robustness(): Promise<{ ok: boolean; log: string[] }> {
  const log: string[] = [];
  const junk: unknown[] = [NaN, Infinity, -Infinity, -5, 1e9, undefined, null, '0.5', {}];
  const calls: Array<[string, (e: AudioEngine, v: unknown) => void]> = [
    ['setVolume', (e, v) => e.setVolume(v as number)],
    ['setDepth', (e, v) => e.setDepth(v as number)],
    ['setSwimSpeed', (e, v) => e.setSwimSpeed(v as number)],
    ['setScene', (e, v) => e.setScene(v as SceneFlavor)],
    ['heartbeat', (e, v) => e.heartbeat(v as number)],
    ['bubble', (e, v) => e.bubble(v as number)],
    ['sonarPing', (e, v) => e.sonarPing(v as number)],
    ['morph', (e, v) => e.morph(v as number)],
    ['inflate', (e, v) => e.inflate(v as number)],
    ['ui', (e, v) => e.ui(v as UiKind)],
    ['xrayHum', (e, v) => e.xrayHum(v as boolean)],
    ['setEnabled', (e, v) => e.setEnabled(v as boolean)],
  ];
  let ok = true;
  const pre = new AudioEngine({ context: new OfflineAudioContext(2, 48000, 48000), manualTick: true });
  // 未 init 时全部方法都必须是安全的空操作
  try {
    pre.setVolume(0.5); pre.setScene('abyss'); pre.setDepth(100); pre.setSwimSpeed(0.3);
    pre.heartbeat(); pre.gillPulse(); pre.bubble(); pre.ui('click'); pre.sonarPing(); pre.morph(1); pre.escape();
    pre.inflate(0.5); pre.xrayHum(true); pre.tick(); pre.dispose(); pre.dispose();
    log.push('pre-init calls + double dispose: ok');
  } catch (e) {
    ok = false;
    log.push('pre-init calls threw: ' + String(e));
  }
  const steps: Step[] = [];
  let t = 0.3;
  for (const [name, fn] of calls) {
    for (const v of junk) {
      const tt = t;
      steps.push([tt, (e) => {
        try {
          fn(e, v);
        } catch (err) {
          ok = false;
          log.push(`${name}(${String(v)}) threw: ${String(err)}`);
        }
      }]);
      t += 0.011;
    }
    t += 0.03;
    // 每组之后复原到正常状态, 让后续调用仍在出声
    steps.push([t, (e) => { e.setEnabled(true); e.setScene('living'); e.setDepth(0); e.setVolume(1); e.xrayHum(false); }]);
    t += 0.03;
  }
  const r = await render({ seconds: Math.ceil(t) + 2, volume: 1, steps });
  const b = basic(r, 0, r.L.length / r.sr);
  if (b.nonFinite > 0) {
    ok = false;
    log.push(`non-finite samples: ${b.nonFinite}`);
  }
  if (b.peakDb > -1) {
    ok = false;
    log.push(`peak ${b.peakDb} dBFS`);
  }
  for (const w of r.warnings) {
    ok = false;
    log.push('warning: ' + w);
  }
  for (const e of r.errors) {
    ok = false;
    log.push('error: ' + e);
  }
  log.push(`junk-input render: peak ${b.peakDb} dBFS, rms ${b.rmsDb} dBFS, non-finite ${b.nonFinite}`);
  return { ok, log };
}

export interface TrainReport {
  name: string;
  rmsDb: number;
  deltaDb: number;
  peakDb: number;
  perSecondDb: number[];
}

/** 周期性触发 (心跳 20 / 75 / 120 bpm, 每秒鳃呼吸, 鼠标扫过的 hover 连发): 长时间重复也不能盖过底噪或叠出混响堆积 */
async function trains(): Promise<TrainReport[]> {
  const out: TrainReport[] = [];
  const base = await render({ seconds: 16, scene: 'living', volume: 1 });
  const baseRms = basic(base, 3, 16).rmsDb;
  const run = async (name: string, fn: (e: AudioEngine) => void, period: number, count?: number, from = 3): Promise<void> => {
    const steps: Step[] = [];
    for (let i = 0; from + i * period < 15.5 && (count === undefined || i < count); i++) steps.push([from + i * period, fn]);
    const r = await render({ seconds: 16, scene: 'living', volume: 1, steps });
    const b = basic(r, 3, 16);
    out.push({ name, rmsDb: b.rmsDb, deltaDb: r1(b.rmsDb - baseRms), peakDb: b.peakDb, perSecondDb: perSecond(r, 3, 16) });
  };
  await run('heartbeat 20 bpm', (e) => e.heartbeat(0.6), 3);
  await run('heartbeat 75 bpm', (e) => e.heartbeat(0.6), 0.8);
  await run('heartbeat 120 bpm (intensity 1)', (e) => e.heartbeat(1), 0.5);
  await run('gillPulse 1 Hz', (e) => e.gillPulse(), 1);
  await run('gillPulse 1.6 Hz', (e) => e.gillPulse(), 0.62);
  await run('ui hover 20 Hz (mouse sweep)', (e) => e.ui('hover'), 0.05);
  await run('bubble 4 Hz', (e) => e.bubble(0.5), 0.25);
  return out;
}

export interface DspReport {
  /** 循环接缝处相邻样本差 / 平均相邻样本差 (无缝 ~ 1) */
  seamRatio: Record<string, number>;
  /** 噪声谱斜率 (dB / 倍频程): 粉红 ~ -3, 布朗 ~ -6 */
  slopeDbPerOct: Record<string, number>;
  /** 混响: 经过整条主母线的脉冲响应衰减 */
  reverb: { rt60: number; centroidEarlyHz: number; centroidLateHz: number; decayDb: number[] };
}

/** 噪声缓冲的无缝循环 / 谱斜率, 以及整条链路上混响的衰减时间与变暗 */
async function dspChecks(): Promise<DspReport> {
  const ctx = new OfflineAudioContext(2, 48000, 48000);
  const seamRatio: Record<string, number> = {};
  const slopeDbPerOct: Record<string, number> = {};
  for (const [name, kind, sec] of [['white', 'white', 2.5], ['pink', 'pink', 6], ['brown', 'brown', 8]] as const) {
    const buf = makeNoiseBuffer(ctx, kind, sec, makeRng(99), { corr: 0.3, fadeSec: 0.5 });
    const x = buf.getChannelData(0);
    const n = x.length;
    let avg = 0;
    for (let i = 1; i < n; i++) avg += Math.abs(x[i] - x[i - 1]);
    avg /= n - 1;
    seamRatio[name] = r3(Math.abs(x[0] - x[n - 1]) / avg);
    // 谱斜率: 100 Hz - 5 kHz 的 log-log 线性回归
    const P = spectrum({ L: x, R: x, sr: 48000 }, 0.5, sec - 0.5);
    let sx = 0, sy = 0, sxx = 0, sxy = 0, m = 0;
    for (let k = 1; k < P.length; k++) {
      const f = (k * 48000) / NFFT;
      if (f < 100 || f > 5000) continue;
      const lx = Math.log2(f);
      const ly = 10 * Math.log10(P[k]);
      sx += lx; sy += ly; sxx += lx * lx; sxy += lx * ly; m++;
    }
    slopeDbPerOct[name] = r1((m * sxy - sx * sy) / (m * sxx - sx * sx));
  }
  // 混响: 往 send 母线注入一个短脉冲, 量输出的能量衰减曲线 (Schroeder 反向积分)
  const r = await render({
    seconds: 5,
    scene: 'living',
    isolate: true,
    tickEvery: null,
    before: (e, c) => {
      const b = c.createBuffer(1, 48, 48000);
      b.getChannelData(0)[0] = 0.5;
      const src = c.createBufferSource();
      src.buffer = b;
      src.connect(e.debug.buses.send);
      src.start(0.2);
    },
  });
  const N = r.L.length;
  const from = Math.floor(0.2 * r.sr);
  const e2 = new Float64Array(N - from);
  for (let i = from; i < N; i++) e2[i - from] = (r.L[i] * r.L[i] + r.R[i] * r.R[i]) / 2;
  const edc = new Float64Array(e2.length);
  let acc = 0;
  for (let i = e2.length - 1; i >= 0; i--) {
    acc += e2[i];
    edc[i] = acc;
  }
  const edcDb = (t: number): number => 10 * Math.log10(edc[Math.min(edc.length - 1, Math.floor(t * r.sr))] / edc[0]);
  const decayDb = [0.25, 0.5, 1, 1.5, 2, 2.5, 3].map((t) => r1(edcDb(t)));
  // 在 -5 到 -25 dB 之间线性拟合外推 RT60
  let t5 = 0, t25 = 0;
  for (let i = 0; i < edc.length; i += 48) {
    const d = 10 * Math.log10(edc[i] / edc[0]);
    if (!t5 && d < -5) t5 = i / r.sr;
    if (!t25 && d < -25) {
      t25 = i / r.sr;
      break;
    }
  }
  const rt60 = t25 > t5 ? r1(((t25 - t5) / 20) * 60) / 1 : 0;
  const cEarly = centroid(spectrum(r, 0.2, 0.5), r.sr);
  const cLate = centroid(spectrum(r, 1.2, 1.9), r.sr);
  return { seamRatio, slopeDbPerOct, reverb: { rt60: r3(rt60), centroidEarlyHz: cEarly, centroidLateHz: cLate, decayDb } };
}

async function sampleRates(): Promise<Array<{ sr: number; rmsDb: number; peakDb: number; centroidHz: number }>> {
  const out = [];
  for (const sr of [22050, 44100, 48000, 96000]) {
    const r = await render({
      seconds: 10,
      sr,
      scene: 'living',
      steps: [[3, (e) => e.heartbeat(0.7)], [4, (e) => e.ui('click')], [5, (e) => e.sonarPing(0.3)], [6, (e) => e.escape()]],
    });
    const b = basic(r, 2, 10);
    out.push({ sr, rmsDb: b.rmsDb, peakDb: b.peakDb, centroidHz: centroid(spectrum(r, 2, 10), sr) });
  }
  return out;
}

async function determinism(): Promise<{ identical: boolean; maxDiff: number }> {
  const spec: RenderSpec = {
    seconds: 6,
    scene: 'living',
    seed: 777,
    steps: [[1.5, (e) => e.heartbeat()], [2, (e) => e.bubble(0.4)], [3, (e) => e.ui('click')], [4, (e) => e.morph(1)]],
  };
  const a = await render(spec);
  const b = await render(spec);
  let m = 0;
  for (let i = 0; i < a.L.length; i++) m = Math.max(m, Math.abs(a.L[i] - b.L[i]), Math.abs(a.R[i] - b.R[i]));
  return { identical: m === 0, maxDiff: m };
}

export interface SuiteResult {
  meta: { ua: string; sampleRate: number; seconds: number };
  chain: Array<{ inDb: number; outDb: number; gainDb: number }>;
  ambience: AmbReport[];
  oneshots: EventReport[];
  timeline: TimelineReport;
  stress: TimelineReport;
  transitions: TransitionReport[];
  trains: TrainReport[];
  dsp: DspReport;
  robustness: { ok: boolean; log: string[] };
  sampleRates: Array<{ sr: number; rmsDb: number; peakDb: number; centroidHz: number }>;
  determinism: { identical: boolean; maxDiff: number };
}

export async function runSuite(only?: string[]): Promise<Partial<SuiteResult>> {
  const want = (k: string): boolean => !only || only.includes(k);
  const t0 = performance.now();
  const res: Partial<SuiteResult> = {};
  const log = (m: string): void => console.log(`[suite ${((performance.now() - t0) / 1000).toFixed(1)}s] ${m}`);
  if (want('chain')) { log('chain'); res.chain = await chain(); }
  if (want('ambience')) { log('ambience'); res.ambience = await ambienceSuite(); }
  if (want('oneshots')) { log('oneshots'); res.oneshots = await runOneShots(); }
  if (want('timeline')) { log('timeline'); res.timeline = await timeline(); }
  if (want('stress')) { log('stress'); res.stress = await stress(); }
  if (want('transitions')) { log('transitions'); res.transitions = await transitions(); }
  if (want('trains')) { log('trains'); res.trains = await trains(); }
  if (want('dsp')) { log('dsp'); res.dsp = await dspChecks(); }
  if (want('robustness')) { log('robustness'); res.robustness = await robustness(); }
  if (want('sampleRates')) { log('sampleRates'); res.sampleRates = await sampleRates(); }
  if (want('determinism')) { log('determinism'); res.determinism = await determinism(); }
  res.meta = { ua: navigator.userAgent, sampleRate: 48000, seconds: (performance.now() - t0) / 1000 };
  return res;
}

// ---------------------------------------------------------------------------
// WAV 导出 (人耳试听用, 不参与断言)
// ---------------------------------------------------------------------------

function encodeWav(s: Stereo): string {
  const n = s.L.length;
  const buf = new ArrayBuffer(44 + n * 4);
  const v = new DataView(buf);
  const w = (o: number, str: string): void => {
    for (let i = 0; i < str.length; i++) v.setUint8(o + i, str.charCodeAt(i));
  };
  w(0, 'RIFF'); v.setUint32(4, 36 + n * 4, true); w(8, 'WAVE'); w(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 2, true);
  v.setUint32(24, s.sr, true); v.setUint32(28, s.sr * 4, true); v.setUint16(32, 4, true); v.setUint16(34, 16, true);
  w(36, 'data'); v.setUint32(40, n * 4, true);
  let o = 44;
  for (let i = 0; i < n; i++) {
    v.setInt16(o, Math.max(-1, Math.min(1, s.L[i])) * 32767, true); o += 2;
    v.setInt16(o, Math.max(-1, Math.min(1, s.R[i])) * 32767, true); o += 2;
  }
  let bin = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

// ---------------------------------------------------------------------------
// 代表性场景: WAV (试听) 与频谱图 (人眼检查异常) 导出
// ---------------------------------------------------------------------------

const SCENARIOS: Record<string, RenderSpec> = {
  living: { seconds: 40, scene: 'living', volume: 0.8 },
  'living-deep': { seconds: 30, scene: 'living', depth: 3000, volume: 0.8 },
  abyss: { seconds: 40, scene: 'abyss', volume: 0.8 },
  anatomy: { seconds: 30, scene: 'anatomy', volume: 0.8 },
  cleared: { seconds: 30, scene: 'cleared', volume: 0.8 },
  xray: { seconds: 30, scene: 'xray', volume: 0.8 },
  flow: { seconds: 30, scene: 'flow', swim: 0.6, volume: 0.8 },
};

async function oneshotsSequence(): Promise<RenderResult> {
  const steps: Step[] = [];
  let t = 1;
  const seq: Array<(e: AudioEngine) => void> = [
    (e) => e.heartbeat(0.7), (e) => e.gillPulse(), (e) => e.bubble(0.3), (e) => e.bubble(0.8),
    (e) => e.ui('hover'), (e) => e.ui('click'), (e) => e.ui('toggle', true), (e) => e.ui('toggle', false),
    (e) => e.ui('open'), (e) => e.ui('close'), (e) => e.ui('scan'), (e) => e.ui('error'),
    (e) => e.sonarPing(-0.7), (e) => e.sonarPing(0.7), (e) => e.morph(3), (e) => e.escape(),
  ];
  const gaps = [1.2, 1.2, 1.6, 1.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.9, 1.6, 1.8, 4.5, 2.5];
  seq.forEach((fn, i) => {
    steps.push([t, fn]);
    t += gaps[i];
  });
  for (let i = 0; i <= 24; i++) steps.push([t + i * 0.05, (e) => e.inflate(Math.min(1, i / 24))]);
  return render({ seconds: t + 3.5, scene: 'living', volume: 0.8, steps, tickEvery: 0.25 });
}

export const scenarioNames = [...Object.keys(SCENARIOS), 'oneshots'];

async function renderScenario(name: string): Promise<RenderResult> {
  if (name === 'oneshots') return oneshotsSequence();
  return render(SCENARIOS[name]);
}

/** 渲染代表性场景并返回 base64 WAV, 由 Node 端存盘 */
export async function renderWavs(names?: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const n of scenarioNames) if (!names || names.includes(n)) out[n] = encodeWav(await renderScenario(n));
  return out;
}

/** 对数频率轴的频谱图 (20 Hz - 16 kHz, -110 .. -25 dBFS), 返回 PNG dataURL */
export async function renderSpectrograms(names?: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  const N = 4096;
  const hop = 1024;
  const H = 300;
  const fLo = 20;
  const fHi = 16000;
  for (const n of scenarioNames) {
    if (names && !names.includes(n)) continue;
    const r = await renderScenario(n);
    const frames = Math.floor((r.L.length - N) / hop);
    const W = Math.min(frames, 1600);
    const step = frames / W;
    const cv = document.createElement('canvas');
    cv.width = W + 52;
    cv.height = H + 16;
    const g = cv.getContext('2d')!;
    g.fillStyle = '#000';
    g.fillRect(0, 0, cv.width, cv.height);
    const img = g.createImageData(W, H);
    const re = new Float64Array(N);
    const im = new Float64Array(N);
    const win = new Float64Array(N);
    let wE = 0;
    for (let i = 0; i < N; i++) {
      win[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * (i + 0.5)) / N);
      wE += win[i] * win[i];
    }
    for (let x = 0; x < W; x++) {
      const p = Math.floor(x * step) * hop;
      re.fill(0); im.fill(0);
      for (let i = 0; i < N; i++) re[i] = ((r.L[p + i] + r.R[p + i]) / 2) * win[i];
      fft(re, im);
      for (let y = 0; y < H; y++) {
        const f0 = fLo * Math.pow(fHi / fLo, (H - 1 - y) / H);
        const f1 = fLo * Math.pow(fHi / fLo, (H - y) / H);
        const k0 = Math.max(1, Math.floor((f0 * N) / r.sr));
        const k1 = Math.max(k0 + 1, Math.ceil((f1 * N) / r.sr));
        let pw = 0;
        for (let k = k0; k < k1; k++) pw = Math.max(pw, (2 * (re[k] * re[k] + im[k] * im[k])) / (N * wE));
        // 每 bin 的均方 -> dBFS, 映射 -110 .. -25
        const v = Math.min(1, Math.max(0, (db(pw) + 110) / 85));
        const o = (y * W + x) * 4;
        // 黑 -> 蓝 -> 青 -> 黄 -> 白
        img.data[o] = Math.round(255 * Math.min(1, Math.max(0, (v - 0.5) * 2.2)));
        img.data[o + 1] = Math.round(255 * Math.min(1, Math.max(0, (v - 0.25) * 1.9)));
        img.data[o + 2] = Math.round(255 * Math.min(1, v * 2.2) * (v < 0.7 ? 1 : 1 - (v - 0.7) * 1.5));
        img.data[o + 3] = 255;
      }
    }
    g.putImageData(img, 46, 0);
    g.fillStyle = '#8fb';
    g.font = '10px sans-serif';
    for (const f of [31.5, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000]) {
      const y = H - (Math.log(f / fLo) / Math.log(fHi / fLo)) * H;
      g.fillText(f >= 1000 ? f / 1000 + 'k' : String(f), 2, y + 3);
      g.fillRect(42, y, 4, 1);
    }
    const dur = r.L.length / r.sr;
    for (let t = 0; t <= dur; t += 2) g.fillText(t + 's', 46 + (t / dur) * W - 6, H + 12);
    out[n] = cv.toDataURL('image/png');
  }
  return out;
}

// ---------------------------------------------------------------------------
// 实时冒烟测试 (必须在用户手势里调用, 由 playwright 点击按钮触发)
// ---------------------------------------------------------------------------

const sleep = (ms: number): Promise<void> => new Promise((res) => setTimeout(res, ms));

export async function liveSmoke(): Promise<Record<string, unknown>> {
  const rep: Record<string, unknown> = {};
  const warns: string[] = [];
  const origWarn = console.warn;
  console.warn = (...a: unknown[]): void => {
    warns.push(a.map(String).join(' '));
  };
  const engine = new AudioEngine();
  try {
    const t0 = performance.now();
    rep.readyBeforeInit = engine.ready;
    // 主线程卡顿监视: 每 4 ms 一次的心跳, 记录最长间隔 = init 期间主线程被占用的最长连续时间
    let last = performance.now();
    let maxGap = 0;
    const mon = setInterval(() => {
      const n = performance.now();
      maxGap = Math.max(maxGap, n - last);
      last = n;
    }, 4);
    await engine.init();
    clearInterval(mon);
    const again = engine.init(); // 幂等
    rep.initMs = Math.round(performance.now() - t0);
    rep.initMaxBlockMs = Math.round(maxGap);
    rep.initIdempotent = again === (engine as unknown as { initP: Promise<void> }).initP;
    const ctx = engine.context as AudioContext;
    rep.stateAfterInit = ctx.state;
    rep.readyAfterInit = engine.ready;
    rep.sampleRate = ctx.sampleRate;
    rep.baseLatencyMs = Math.round((ctx.baseLatency ?? 0) * 1000);

    // 实时电平表: 从主增益之后取样
    const an = ctx.createAnalyser();
    an.fftSize = 2048;
    engine.debug.master.connect(an);
    const buf = new Float32Array(2048);
    let peak = 0, sumSq = 0, n = 0;
    const meter = setInterval(() => {
      an.getFloatTimeDomainData(buf);
      for (let i = 0; i < buf.length; i++) {
        const v = buf[i];
        peak = Math.max(peak, Math.abs(v));
        sumSq += v * v;
        n++;
      }
    }, 40);
    const reset = (): void => { peak = 0; sumSq = 0; n = 0; };
    const lvl = (): { peakDb: number; rmsDb: number } => ({ peakDb: r1(db(peak * peak)), rmsDb: r1(db(sumSq / Math.max(1, n))) });

    engine.setEnabled(true);
    const c0 = ctx.currentTime;
    const w0 = performance.now();
    await sleep(2500);
    rep.stateEnabled = ctx.state;
    rep.ambienceLive = lvl();
    reset();

    // 各种声音 + 各风味, 并计时 tick
    engine.heartbeat(); engine.gillPulse(); engine.bubble(0.4); engine.ui('click'); engine.sonarPing(0.4);
    engine.morph(1.2); engine.escape(); engine.xrayHum(true);
    for (let i = 0; i <= 20; i++) { engine.inflate(i / 20); await sleep(30); }
    for (const f of ['anatomy', 'cleared', 'xray', 'flow', 'abyss', 'living'] as SceneFlavor[]) {
      engine.setScene(f);
      engine.heartbeat(0.5);
      await sleep(350);
    }
    engine.xrayHum(false);
    engine.setDepth(3000);
    engine.setSwimSpeed(0.8);
    await sleep(800);
    rep.eventsLive = lvl();
    const tk = performance.now();
    for (let i = 0; i < 40; i++) engine.tick();
    rep.tickAvgMs = r3((performance.now() - tk) / 40);
    const wall = (performance.now() - w0) / 1000;
    rep.clockRatio = r3((ctx.currentTime - c0) / wall);

    // 页面隐藏 -> 淡出并挂起; 再可见 -> 恢复
    const setVis = (v: 'hidden' | 'visible'): void => {
      Object.defineProperty(document, 'visibilityState', { value: v, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    };
    setVis('hidden');
    await sleep(1400);
    rep.stateHidden = ctx.state;
    setVis('visible');
    await sleep(600);
    rep.stateVisibleAgain = ctx.state;

    // 关闭 -> 挂起; 开启 -> 恢复
    reset();
    engine.setEnabled(false);
    await sleep(1400);
    rep.stateDisabled = ctx.state;
    engine.heartbeat(); // 关闭期间必须是空操作
    engine.setEnabled(true);
    await sleep(900);
    rep.stateReenabled = ctx.state;
    rep.afterReenable = lvl();

    rep.voices = engine.debug.voices;
    rep.scopes = engine.debug.scopes;
    clearInterval(meter);
    engine.dispose();
    await sleep(500);
    rep.stateAfterDispose = ctx.state;
    rep.warnings = warns;
  } catch (e) {
    rep.error = String(e);
    rep.warnings = warns;
  } finally {
    console.warn = origWarn;
  }
  return rep;
}

// ---------------------------------------------------------------------------
// 实时长跑 (soak): 模拟宿主真实使用, 检查节点是否泄漏 / 定时器是否稳定 / 电平是否受控
// ---------------------------------------------------------------------------

export async function soak(seconds: number): Promise<Record<string, unknown>> {
  const rep: Record<string, unknown> = {};
  const warns: string[] = [];
  const origWarn = console.warn;
  console.warn = (...a: unknown[]): void => {
    warns.push(a.map(String).join(' '));
  };
  const engine = new AudioEngine({ pauseWhenHidden: false });
  const heap = (): number => Math.round(((performance as unknown as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize ?? 0) / 1e5) / 10;
  try {
    await engine.init();
    const ctx = engine.context as AudioContext;
    engine.setVolume(1);
    engine.setEnabled(true);
    const an = ctx.createAnalyser();
    an.fftSize = 2048;
    engine.debug.master.connect(an);
    const buf = new Float32Array(2048);
    let peak = 0;
    const meter = setInterval(() => {
      an.getFloatTimeDomainData(buf);
      for (let i = 0; i < buf.length; i++) peak = Math.max(peak, Math.abs(buf[i]));
    }, 30);

    const flavors: SceneFlavor[] = ['living', 'anatomy', 'cleared', 'xray', 'flow', 'abyss'];
    const uis: UiKind[] = ['hover', 'click', 'toggle', 'open', 'close', 'scan', 'error'];
    const t0 = performance.now();
    const c0 = ctx.currentTime;
    let maxVoices = 0;
    const samples: Array<{ t: number; voices: number; scopes: number; heapMB: number }> = [];
    let nextGill = 0, nextBeat = 0, nextMisc = 0, nextScene = 12, nextDepth = 0, nextSample = 5;
    let sceneIdx = 0;
    let depthWalk = 0;
    let inflateUntil = 0;
    let inflateAmt = 0;
    const hb0 = heap();
    while ((performance.now() - t0) / 1000 < seconds) {
      const t = (performance.now() - t0) / 1000;
      if (t >= nextBeat) { engine.heartbeat(0.4 + 0.5 * Math.random()); nextBeat = t + 0.8; }
      if (t >= nextGill) { engine.gillPulse(); nextGill = t + 1; }
      if (t >= nextMisc) {
        const r = Math.random();
        if (r < 0.35) engine.ui(uis[Math.floor(Math.random() * uis.length)]);
        else if (r < 0.6) engine.bubble(Math.random());
        else if (r < 0.7) engine.sonarPing(Math.random() * 2 - 1);
        else if (r < 0.75) engine.morph(1 + Math.random() * 3);
        else if (r < 0.8) engine.escape();
        else if (r < 0.9) { inflateUntil = t + 1.5; inflateAmt = 0; }
        else engine.xrayHum(Math.random() < 0.5);
        nextMisc = t + 0.15 + Math.random() * 0.6;
      }
      if (t < inflateUntil) { inflateAmt = Math.min(1, inflateAmt + 0.03); engine.inflate(inflateAmt); }
      if (t >= nextScene) { engine.setScene(flavors[++sceneIdx % flavors.length]); nextScene = t + 12; }
      if (t >= nextDepth) {
        depthWalk = Math.max(0, Math.min(8000, depthWalk + (Math.random() - 0.45) * 500));
        engine.setDepth(depthWalk);
        engine.setSwimSpeed(Math.random());
        nextDepth = t + 0.25;
      }
      if (t >= nextSample) {
        samples.push({ t: Math.round(t), voices: engine.debug.voices, scopes: engine.debug.scopes, heapMB: heap() });
        nextSample += 5;
      }
      maxVoices = Math.max(maxVoices, engine.debug.voices);
      await sleep(30);
    }
    const wall = (performance.now() - t0) / 1000;
    rep.seconds = Math.round(wall);
    rep.clockRatio = r3((ctx.currentTime - c0) / wall);
    rep.state = ctx.state;
    rep.peakDb = r1(db(peak * peak));
    rep.maxVoices = maxVoices;
    rep.samples = samples;
    rep.heapStartMB = hb0;
    rep.heapEndMB = heap();
    clearInterval(meter);
    engine.setEnabled(false);
    await sleep(1500);
    rep.voicesAfterDisable = engine.debug.voices;
    rep.scopesAfterDisable = engine.debug.scopes;
    engine.dispose();
    rep.warnings = warns;
  } catch (e) {
    rep.error = String(e);
    rep.warnings = warns;
  } finally {
    console.warn = origWarn;
  }
  return rep;
}
