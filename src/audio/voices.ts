/**
 * 一次性发声 (one-shot) 与随机环境事件的合成器.
 * 全部用 Web Audio 节点即时合成, 没有任何采样文件. 每个发声用一个 Scope 收纳节点,
 * 结束后自动 disconnect. 所有起音都从 0 起步 (线性斜坡, 至少 1 ms), 尾巴用 setTargetAtTime
 * 衰减到 -78 dB 以下才停源, 不会有爆音.
 *
 * 电平常量集中在 LV 里, 便于整体校准 (线性幅度, 进入压缩器之前).
 */

import { bellCurve, clamp, clamp01, lerp, pick, range, wanderCurve } from './dsp';
import { Kit, perc, type BusName, type Scope } from './kit';

export type UiKind = 'hover' | 'click' | 'toggle' | 'open' | 'close' | 'scan' | 'error';

/** 电平表 (线性幅度) */
export const LV = {
  heartLub: 0.26,
  heartDub: 0.177,
  gill: 0.27,
  bubble: 0.093,
  bubbleAmb: 0.035,
  uiHover: 0.015,
  uiClick: 0.1,
  uiToggle: 0.08,
  uiOpen: 0.076,
  uiClose: 0.062,
  uiScan: 0.078,
  uiError: 0.107,
  sonar: 0.055,
  morph: 0.14,
  escape: 0.33,
  gulp: 0.08,
  snap: 0.13,
  whale: 0.021,
  creak: 0.18,
  tone: 0.02,
  ping: 0.05,
  relay: 0.045,
  drum: 0.3,
};

// ---------------------------------------------------------------------------
// 通用小零件
// ---------------------------------------------------------------------------

interface GlassOpts {
  f: number;
  level: number;
  /** [频率比, 相对增益, 衰减时间常数 s] */
  parts: ReadonlyArray<readonly [number, number, number]>;
  atk?: number;
  lp?: number;
  pan?: number;
  send?: number;
  bus?: BusName;
}

/** 玻璃质感的加法合成: 几个非整数倍的正弦, 各自指数衰减 (短 = 界面音, 长 = 环境风铃) */
export function glassTone(kit: Kit, t: number, o: GlassOpts): void {
  const sc = kit.scope();
  const atk = o.atk ?? 0.002;
  const mix = sc.gain(1);
  const fMax = Math.min(12000, kit.ctx.sampleRate * 0.45);
  for (const [ratio, gr, tau] of o.parts) {
    // 高于主母线低通 / 接近奈奎斯特的分音听不见, 还会在低采样率下混叠, 直接跳过
    if (o.f * ratio > fMax) continue;
    const g = sc.gain(0);
    const end = perc(g.gain, t, atk, o.level * gr, tau);
    const os = sc.osc('sine', o.f * ratio, t, end);
    os.connect(g);
    g.connect(mix);
  }
  let tail: AudioNode = mix;
  if (o.lp) {
    const lp = sc.filter('lowpass', o.lp);
    mix.connect(lp);
    tail = lp;
  }
  const pn = sc.pan(o.pan ?? 0);
  tail.connect(pn);
  sc.route(pn, o.bus ?? 'ui', o.send ?? 0.1);
}

interface FmOpts {
  fc: number;
  ratio: number;
  index: number;
  level: number;
  tau: number;
  modTau: number;
  atk?: number;
  lp?: number;
  pan?: number;
  send?: number;
}

/** 软 FM 叮: 调制深度衰减得比幅度快, 起音瞬间稍亮 (像敲了一下), 很快变成纯音 */
function fmPlink(kit: Kit, t: number, o: FmOpts): void {
  const sc = kit.scope();
  const atk = o.atk ?? 0.0025;
  const env = sc.gain(0);
  const end = perc(env.gain, t, atk, o.level, o.tau);
  const car = sc.osc('sine', o.fc, t, end);
  const mod = sc.osc('sine', o.fc * o.ratio, t, end);
  const mg = sc.gain(0);
  perc(mg.gain, t, atk, o.fc * o.ratio * o.index, o.modTau);
  mod.connect(mg);
  mg.connect(car.frequency);
  car.connect(env);
  const lp = sc.filter('lowpass', o.lp ?? 5200);
  env.connect(lp);
  const pn = sc.pan(o.pan ?? 0);
  lp.connect(pn);
  sc.route(pn, 'ui', o.send ?? 0.12);
}

interface SweepOpts {
  f0: number;
  f1: number;
  dur: number;
  atk: number;
  tau: number;
  level: number;
  lp: number;
  send: number;
  second?: number;
  secondGain?: number;
  type?: OscillatorType;
  pan?: number;
}

/** 正弦滑音 (界面开合 / 扫描) */
function sweep(kit: Kit, t: number, o: SweepOpts): void {
  const sc = kit.scope();
  const env = sc.gain(0);
  const end = perc(env.gain, t, o.atk, o.level, o.tau);
  const mk = (ratio: number, gr: number): void => {
    const os = sc.osc(o.type ?? 'sine', o.f0 * ratio, t, end);
    os.frequency.setValueAtTime(o.f0 * ratio, t);
    os.frequency.exponentialRampToValueAtTime(o.f1 * ratio, t + o.dur);
    const g = sc.gain(gr);
    os.connect(g);
    g.connect(env);
  };
  mk(1, 1);
  if (o.second) mk(o.second, o.secondGain ?? 0.3);
  const lp = sc.filter('lowpass', o.lp);
  env.connect(lp);
  const pn = sc.pan(o.pan ?? 0);
  lp.connect(pn);
  sc.route(pn, 'ui', o.send);
}

// ---------------------------------------------------------------------------
// 心跳
// ---------------------------------------------------------------------------

interface ThumpOpts {
  f0: number;
  f1: number;
  level: number;
  atk: number;
  tau: number;
  body: number;
  send: number;
}

/** 一记低沉的心室搏动: 音高快速下滑的正弦 + 二次谐波 (小喇叭也听得到) + 一点组织质感的噪声 */
function thump(kit: Kit, t: number, o: ThumpOpts): void {
  const sc = kit.scope();
  const env = sc.gain(0);
  const end = perc(env.gain, t, o.atk, o.level, o.tau);
  const f = sc.osc('sine', o.f0, t, end);
  f.frequency.setValueAtTime(o.f0, t);
  f.frequency.exponentialRampToValueAtTime(o.f1, t + 0.1);
  const h = sc.osc('sine', o.f0 * 2, t, end);
  h.frequency.setValueAtTime(o.f0 * 2, t);
  h.frequency.exponentialRampToValueAtTime(o.f1 * 2, t + 0.08);
  const hg = sc.gain(0.5);
  const h3 = sc.osc('sine', o.f0 * 3, t, end);
  h3.frequency.setValueAtTime(o.f0 * 3, t);
  h3.frequency.exponentialRampToValueAtTime(o.f1 * 3, t + 0.07);
  const h3g = sc.gain(0.22);
  const nz = sc.noise(kit.noise.pinkB, t, end - t);
  const nf = sc.filter('bandpass', o.f0 * 2.6, 1.0);
  const ng = sc.gain(o.body);
  f.connect(env);
  h.connect(hg); hg.connect(env);
  h3.connect(h3g); h3g.connect(env);
  nz.connect(nf); nf.connect(ng); ng.connect(env);
  const lp = sc.filter('lowpass', 480);
  env.connect(lp);
  sc.route(lp, 'sfx', o.send);
}

/** lub-dub. gap 是两声间隔 (秒), 由引擎按心率估计. 每一声音高 / 力度 / 间隔有几个百分点的随机起伏, 不机械 */
export function heartbeat(kit: Kit, t: number, intensity: number, gap: number, gain = 1): void {
  const r = kit.rng;
  const I = clamp01(intensity);
  // 强度 0 仍有一丝 (-18 dB), 1 为满幅; 默认 0.6 约 -4.5 dB. gain 是按心率做的响度补偿
  const amp = (0.12 + 0.88 * Math.pow(I, 1.2)) * gain * (0.94 + 0.12 * r());
  const pitch = 0.97 + 0.06 * r();
  thump(kit, t, { f0: 74 * pitch, f1: 46 * pitch, level: LV.heartLub * amp, atk: 0.007, tau: 0.045, body: 0.35, send: 0.18 });
  thump(kit, t + gap * (0.96 + 0.08 * r()), { f0: 96 * pitch, f1: 62 * pitch, level: LV.heartDub * amp, atk: 0.006, tau: 0.032, body: 0.25, send: 0.18 });
}

// ---------------------------------------------------------------------------
// 石首鱼的鳔鼓声
// ---------------------------------------------------------------------------

/**
 * 一声鼓鸣: 发声肌每收缩一次, 鳔壁被拉动一下, 发出一个衰减很快的脉冲; 一串脉冲连成一声咕咕.
 * f0 主频, rate 脉冲率 (次/秒), n 脉冲数. 每个脉冲是略微下滑的正弦加半频的闷响.
 */
export function drumCall(kit: Kit, t: number, f0: number, rate: number, n: number, level: number): void {
  const r = kit.rng;
  const sc = kit.scope();
  const bus = sc.gain(1);
  const lp = sc.filter('lowpass', f0 * 3.2);
  const pn = sc.pan((r() * 2 - 1) * 0.15);
  bus.connect(lp);
  lp.connect(pn);
  sc.route(pn, 'sfx', 0.25);
  const period = 1 / Math.max(1, rate);
  for (let i = 0; i < n; i++) {
    const tp = t + i * period * (0.96 + 0.08 * r());
    // 一声里前几个脉冲渐强, 末尾渐弱
    const shape = Math.pow(Math.sin(Math.PI * Math.min(1, (i + 0.7) / n)), 0.6);
    const amp = level * (0.55 + 0.45 * shape) * (0.9 + 0.2 * r());
    const f = f0 * (0.97 + 0.06 * r());
    const env = sc.gain(0);
    const e1 = perc(env.gain, tp, 0.0012, amp, 0.009);
    const os = sc.osc('sine', f, tp, e1);
    os.frequency.setValueAtTime(f * 1.08, tp);
    os.frequency.exponentialRampToValueAtTime(f * 0.92, tp + 0.02);
    os.connect(env);
    env.connect(bus);
    const env2 = sc.gain(0);
    const e2 = perc(env2.gain, tp, 0.002, amp * 0.5, 0.014);
    const os2 = sc.osc('sine', f * 0.5, tp, e2);
    os2.connect(env2);
    env2.connect(bus);
  }
}

// ---------------------------------------------------------------------------
// 鳃呼吸
// ---------------------------------------------------------------------------

/** 水流过鳃的一次吐纳: 噪声过扫频带通, 钟形包络, 每次随机略不同 */
export function gillPulse(kit: Kit, t: number): void {
  const r = kit.rng;
  const dur = 0.8 + r() * 0.2;
  const sc = kit.scope();
  const nz = sc.noise(kit.noise.pinkA, t, dur + 0.1);
  const hp = sc.filter('highpass', 220);
  const bp = sc.filter('bandpass', 400, 0.9);
  const lp = sc.filter('lowpass', 2400);
  bp.frequency.setValueAtTime(360 * (0.9 + 0.2 * r()), t);
  bp.frequency.exponentialRampToValueAtTime(950 * (0.9 + 0.2 * r()), t + dur * 0.42);
  bp.frequency.exponentialRampToValueAtTime(540 * (0.9 + 0.2 * r()), t + dur);
  const env = sc.gain(0);
  env.gain.setValueCurveAtTime(bellCurve(96, 0.8, LV.gill * (0.85 + 0.3 * r())), t, dur);
  nz.connect(hp); hp.connect(bp); bp.connect(lp); lp.connect(env);
  const pn = sc.pan((r() * 2 - 1) * 0.25);
  env.connect(pn);
  sc.route(pn, 'sfx', 0.22);
}

// ---------------------------------------------------------------------------
// 气泡
// ---------------------------------------------------------------------------

interface BlipOpts {
  f0: number;
  level: number;
  tau: number;
  pan: number;
  send: number;
  rise: number;
  bus?: BusName;
}

/** 单个气泡: 明纳特共振频率的正弦, 音高上滑, 指数衰减 */
export function bubbleBlip(kit: Kit, t: number, o: BlipOpts): void {
  const sc = kit.scope();
  const env = sc.gain(0);
  const end = perc(env.gain, t, 0.002, o.level, o.tau);
  const os = sc.osc('sine', o.f0, t, end);
  os.frequency.setValueAtTime(o.f0, t);
  os.frequency.exponentialRampToValueAtTime(o.f0 * o.rise, t + Math.min(0.09, 3.5 * o.tau));
  os.connect(env);
  const pn = sc.pan(o.pan);
  env.connect(pn);
  sc.route(pn, o.bus ?? 'sfx', o.send);
}

/**
 * 一个气泡或一小串. size 0..1 -> 半径 1.1..7.5 mm, 频率 f = 3.26 / r (明纳特公式).
 * 一串里每个气泡大小略有起伏, 间隔随机.
 */
export function bubbleCluster(kit: Kit, t: number, size: number, level: number, bus: BusName = 'sfx'): void {
  const r = kit.rng;
  const s = clamp01(size);
  const n = r() < 0.55 ? 1 : 2 + Math.floor(r() * (2 + 3 * s));
  const pan0 = (r() * 2 - 1) * 0.7;
  let at = t;
  for (let i = 0; i < n; i++) {
    const sz = clamp01(s + (r() - 0.5) * 0.45);
    const rMm = lerp(1.1, 7.5, Math.pow(sz, 1.2));
    bubbleBlip(kit, at, {
      f0: (3260 / rMm) * (0.94 + r() * 0.12),
      level: level * (0.55 + 0.45 * sz) * (0.7 + 0.3 * r()),
      tau: 0.008 + 0.02 * sz,
      pan: clamp(pan0 + (r() - 0.5) * 0.4, -1, 1),
      send: 0.35,
      rise: 1.2 + 0.3 * (1 - sz),
      bus,
    });
    at += 0.03 + r() * 0.2 * (1 - i / (n + 1));
  }
}

// ---------------------------------------------------------------------------
// 界面音
// ---------------------------------------------------------------------------

export function ui(kit: Kit, kind: UiKind, t: number, on = true): void {
  const r = kit.rng;
  switch (kind) {
    case 'hover':
      // 近乎潜意识: 极短极轻的玻璃点, 音高在五声音阶里随机, 避免重复疲劳
      glassTone(kit, t, {
        f: pick(r, [1760, 2093, 2349.3, 2637]),
        level: LV.uiHover,
        parts: [[1, 1, 0.009], [2.32, 0.22, 0.005]],
        send: 0.05,
        pan: (r() * 2 - 1) * 0.25,
      });
      break;
    case 'click':
      fmPlink(kit, t, { fc: 1318.5, ratio: 2, index: 1.2, level: LV.uiClick, tau: 0.02, modTau: 0.01, send: 0.1 });
      break;
    case 'toggle': {
      const a = on ? 987.8 : 1318.5;
      const b = on ? 1318.5 : 987.8;
      fmPlink(kit, t, { fc: a, ratio: 2, index: 0.8, level: LV.uiToggle, tau: 0.014, modTau: 0.007, send: 0.08 });
      fmPlink(kit, t + 0.055, { fc: b, ratio: 2, index: 0.8, level: LV.uiToggle, tau: 0.017, modTau: 0.009, send: 0.1 });
      break;
    }
    case 'open':
      sweep(kit, t, { f0: 560, f1: 840, dur: 0.07, atk: 0.01, tau: 0.02, level: LV.uiOpen, lp: 3200, send: 0.1, second: 1.5, secondGain: 0.35 });
      break;
    case 'close':
      sweep(kit, t, { f0: 840, f1: 540, dur: 0.06, atk: 0.008, tau: 0.02, level: LV.uiClose, lp: 3000, send: 0.08, second: 1.5, secondGain: 0.3 });
      break;
    case 'scan':
      sweep(kit, t, { f0: 700, f1: 2100, dur: 0.07, atk: 0.008, tau: 0.02, level: LV.uiScan, lp: 4200, send: 0.12 });
      glassTone(kit, t + 0.07, { f: 2637, level: LV.uiScan * 0.6, parts: [[1, 1, 0.016], [2.32, 0.25, 0.008]], send: 0.12 });
      break;
    case 'error':
      // 两声低沉的三角波 "咚咚", 下行小三度, 不刺耳
      sweep(kit, t, { f0: 233, f1: 226, dur: 0.05, atk: 0.006, tau: 0.018, level: LV.uiError, lp: 900, send: 0.05, type: 'triangle' });
      sweep(kit, t + 0.06, { f0: 196, f1: 185, dur: 0.05, atk: 0.006, tau: 0.02, level: LV.uiError, lp: 800, send: 0.05, type: 'triangle' });
      break;
  }
}

// ---------------------------------------------------------------------------
// 侧线声呐
// ---------------------------------------------------------------------------

interface PingOpts {
  f: number;
  level: number;
  pan: number;
  lp: number;
}

function pingVoice(kit: Kit, t: number, o: PingOpts): void {
  const sc = kit.scope();
  const env = sc.gain(0);
  const end = perc(env.gain, t, 0.006, o.level, 0.11);
  const s = sc.osc('sine', o.f * 1.22, t, end);
  s.frequency.setValueAtTime(o.f * 1.22, t);
  s.frequency.exponentialRampToValueAtTime(o.f, t + 0.05);
  const th = sc.osc('sine', 96, t, end);
  const thg = sc.gain(0.55);
  s.connect(env);
  th.connect(thg); thg.connect(env);
  // 起音处一点点水压脉冲的 "边"
  const edge = sc.noise(kit.noise.white, t, 0.03);
  const ebp = sc.filter('bandpass', 1800, 1.5);
  const eg = sc.gain(0);
  perc(eg.gain, t, 0.001, o.level * 0.35, 0.004);
  edge.connect(ebp); ebp.connect(eg); eg.connect(env);
  const lp = sc.filter('lowpass', o.lp);
  env.connect(lp);
  const pn = sc.pan(o.pan);
  lp.connect(pn);
  sc.route(pn, 'sfx', 0.4);
}

/** 一记压力脉冲 + 两次渐弱的回波. pan -1..1 */
export function sonarPing(kit: Kit, t: number, pan: number): void {
  const p = clamp(pan, -1, 1);
  const f = 659.3 * (0.98 + 0.04 * kit.rng());
  pingVoice(kit, t, { f, level: LV.sonar, pan: p, lp: 2600 });
  pingVoice(kit, t + 0.31, { f, level: LV.sonar * 0.35, pan: p * 0.6, lp: 1800 });
  pingVoice(kit, t + 0.66, { f, level: LV.sonar * 0.15, pan: p * 0.3, lp: 1300 });
}

// ---------------------------------------------------------------------------
// 物种变形
// ---------------------------------------------------------------------------

/** 一段闪烁的滤波涌动: 失谐的泛音垫 (整体缓升一个大三度) + 扫频闪光噪声, 钟形包络 */
export function morph(kit: Kit, t: number, D: number): void {
  const r = kit.rng;
  const tail = Math.min(1.2, 0.35 * D + 0.4);
  const total = D + tail;
  const end = t + total + 0.1;
  const sc = kit.scope();
  const env = sc.gain(0);
  env.gain.setValueCurveAtTime(bellCurve(128, 1.25, LV.morph), t, total);

  // 泛音垫
  const pad = sc.gain(1);
  const base = 196 * (r() < 0.5 ? 1 : 1.25);
  [[1, 0.35], [1.5, 0.25], [2, 0.18], [3, 0.08]].forEach(([ratio, w], i) => {
    for (const det of [-4, 4]) {
      const f = base * ratio;
      const o = sc.osc('sine', f, t, end);
      o.detune.value = det;
      o.frequency.setValueAtTime(f, t);
      o.frequency.exponentialRampToValueAtTime(f * 1.26, t + D);
      // 每个泛音一个慢速 vibrato, 相位 / 速率都不同, 形成闪烁
      const l = sc.osc('sine', 0.13 + i * 0.09 + det * 0.005 + r() * 0.05, t, end);
      const la = sc.gain(6);
      l.connect(la); la.connect(o.detune);
      const g = sc.gain(w * 0.5);
      o.connect(g); g.connect(pad);
    }
  });

  // 闪光: 粉红噪声过扫频高 Q 带通, 再被 8.5 Hz 颤动调幅
  const nz = sc.noise(kit.noise.pinkA, t, total + 0.1);
  const bp = sc.filter('bandpass', 500, 7);
  bp.frequency.setValueAtTime(500, t);
  bp.frequency.exponentialRampToValueAtTime(3800, t + D);
  const trem = sc.gain(0.6);
  const tl = sc.osc('sine', 8.5, t, end);
  const ta = sc.gain(0.4);
  tl.connect(ta); ta.connect(trem.gain);
  const sparkle = sc.gain(0.9);
  nz.connect(bp); bp.connect(trem); trem.connect(sparkle);

  // 滤波涌动: 截止先升后降
  const lp = sc.filter('lowpass', 450);
  lp.frequency.setValueAtTime(450, t);
  lp.frequency.exponentialRampToValueAtTime(5200, t + D * 0.55);
  lp.frequency.exponentialRampToValueAtTime(1400, t + total);
  pad.connect(lp);
  sparkle.connect(lp);
  lp.connect(env);
  const pn = sc.pan(0);
  env.connect(pn);
  sc.route(pn, 'sfx', 0.5);
}

// ---------------------------------------------------------------------------
// C-start 逃逸
// ---------------------------------------------------------------------------

/** 一次逃逸: 尖锐的水花瞬态 + 快速下扫的呼啸 + 低沉的推水闷响 + 几滴散开的水珠 */
export function escape(kit: Kit, t: number): void {
  const r = kit.rng;
  const dir = r() < 0.5 ? -1 : 1;
  const sc = kit.scope();
  const env = sc.gain(1);

  // 水花瞬态
  const eg = sc.gain(0);
  perc(eg.gain, t, 0.001, LV.escape * 0.7, 0.008);
  const en = sc.noise(kit.noise.white, t, 0.1);
  const ehp = sc.filter('highpass', 1800);
  const ebp = sc.filter('bandpass', 3500, 0.9);
  en.connect(ehp); ehp.connect(ebp); ebp.connect(eg); eg.connect(env);

  // 呼啸
  const wg = sc.gain(0);
  const wEnd = perc(wg.gain, t, 0.025, LV.escape, 0.12);
  const wn = sc.noise(kit.noise.pinkA, t, wEnd - t);
  const wbp = sc.filter('bandpass', 4200, 1.4);
  wbp.frequency.setValueAtTime(4200, t);
  wbp.frequency.exponentialRampToValueAtTime(500, t + 0.4);
  wn.connect(wbp); wbp.connect(wg); wg.connect(env);

  // 闷响
  const tg = sc.gain(0);
  const tEnd = perc(tg.gain, t, 0.006, LV.escape * 0.8, 0.06);
  const th = sc.osc('sine', 120, t, tEnd);
  th.frequency.setValueAtTime(120, t);
  th.frequency.exponentialRampToValueAtTime(45, t + 0.12);
  th.connect(tg); tg.connect(env);

  // 声像从一侧掠过另一侧, 像鱼蹿出去
  const sp = sc.stereo(-0.3 * dir);
  if (sp) {
    sp.pan.setValueAtTime(-0.3 * dir, t);
    sp.pan.linearRampToValueAtTime(0.6 * dir, t + 0.45);
  }
  const pn: AudioNode = sp ?? sc.gain(1);
  env.connect(pn);
  sc.route(pn, 'sfx', 0.3);

  // 水珠
  const drops = 3 + Math.floor(r() * 4);
  for (let i = 0; i < drops; i++) {
    const rMm = lerp(1.2, 3.5, r());
    bubbleBlip(kit, t + 0.08 + r() * 0.45, {
      f0: (3260 / rMm) * (0.95 + r() * 0.1),
      level: LV.bubble * (0.5 + 0.4 * r()),
      tau: 0.008 + 0.006 * r(),
      pan: (r() * 2 - 1) * 0.8,
      send: 0.35,
      rise: 1.3,
    });
  }
}

// ---------------------------------------------------------------------------
// 河豚充气
// ---------------------------------------------------------------------------

/** 一声吞咽 "咕": 上滑的低频正弦 + 一点水声噪声 */
export function gulp(kit: Kit, t: number, amount: number): void {
  const r = kit.rng;
  const sc = kit.scope();
  const env = sc.gain(0);
  const end = perc(env.gain, t, 0.008, LV.gulp * (0.7 + 0.3 * r()), 0.03);
  const f0 = (110 + 150 * clamp01(amount)) * (0.92 + 0.16 * r());
  const os = sc.osc('sine', f0, t, end);
  os.frequency.setValueAtTime(f0, t);
  os.frequency.exponentialRampToValueAtTime(f0 * 1.7, t + 0.06);
  os.connect(env);
  const nz = sc.noise(kit.noise.pinkA, t, 0.06);
  const nb = sc.filter('bandpass', 700, 2);
  const ng = sc.gain(0);
  perc(ng.gain, t, 0.004, LV.gulp * 0.5, 0.012);
  nz.connect(nb); nb.connect(ng); ng.connect(env);
  const lp = sc.filter('lowpass', 900);
  env.connect(lp);
  const pn = sc.pan((r() * 2 - 1) * 0.3);
  lp.connect(pn);
  sc.route(pn, 'sfx', 0.2);
}

/**
 * 充气中的持续 "拉伸" 声部: 橡胶吱嘎 (锯齿波过带通, 音高随充气量上升) + 水流吸入声.
 * 按需创建, 静止一会儿后由引擎释放, 空闲时零开销.
 */
export class InflateVoice {
  private readonly sc: Scope;
  private readonly out: GainNode;
  private readonly creak: OscillatorNode;
  private readonly creakBp: BiquadFilterNode;
  private readonly creakG: GainNode;
  private readonly waterBp: BiquadFilterNode;
  private readonly waterG: GainNode;

  constructor(kit: Kit, t: number) {
    const sc = kit.scope();
    this.sc = sc;
    const far = t + 7200;
    this.out = sc.gain(0);
    sc.route(this.out, 'sfx', 0.2);

    this.creak = sc.osc('sawtooth', 140, t, far);
    this.creakBp = sc.filter('bandpass', 500, 5);
    this.creakG = sc.gain(0);
    const vib = sc.osc('sine', 6.3, t, far);
    const va = sc.gain(35);
    vib.connect(va); va.connect(this.creak.detune);
    this.creak.connect(this.creakBp); this.creakBp.connect(this.creakG); this.creakG.connect(this.out);

    const nz = sc.loopNoise(kit.noise.pinkA, 1);
    this.waterBp = sc.filter('bandpass', 450, 1.4);
    this.waterG = sc.gain(0);
    nz.connect(this.waterBp); this.waterBp.connect(this.waterG); this.waterG.connect(this.out);
    sc.deadline = Infinity;
  }

  update(t: number, amount: number, sign: number, mag: number): void {
    const tc = 0.06;
    const f = 130 * Math.pow(2, amount * 1.6);
    this.creak.frequency.setTargetAtTime(f, t, tc);
    this.creakBp.frequency.setTargetAtTime(f * 3.5, t, tc);
    this.creakG.gain.setTargetAtTime(0.012 * mag * (sign > 0 ? 1 : 0.5), t, tc);
    this.waterBp.frequency.setTargetAtTime(350 * Math.pow(2, amount * 1.3), t, tc);
    this.waterG.gain.setTargetAtTime(0.25 * mag, t, tc);
    this.out.gain.setTargetAtTime(1, t, 0.03);
  }

  release(t: number): void {
    this.out.gain.setTargetAtTime(0, t, 0.09);
  }

  dispose(): void {
    this.sc.dispose(true);
  }
}

// ---------------------------------------------------------------------------
// X 光模式的电嗡声
// ---------------------------------------------------------------------------

/** 冷的电气嗡声: 100 Hz 谐波丰富的嗡 + 50 Hz 基频 + 极弱的高频线圈啸叫, 极慢颤动 */
export class HumVoice {
  private readonly sc: Scope;
  private readonly out: GainNode;

  constructor(kit: Kit, t: number) {
    const sc = kit.scope();
    this.sc = sc;
    const far = t + 7200;
    this.out = sc.gain(0);
    sc.route(this.out, 'sfx', 0.05);
    const mod = sc.gain(1);
    mod.connect(this.out);
    const lfo = sc.osc('sine', 0.13, t, far);
    const la = sc.gain(0.1);
    lfo.connect(la); la.connect(mod.gain);

    const real = new Float32Array(9);
    const imag = new Float32Array([0, 1, 0.55, 0.3, 0.18, 0.1, 0.06, 0.03, 0.015]);
    const wave = sc.ctx.createPeriodicWave(real, imag);
    const buzz = sc.oscWave(wave, 100, t, far);
    const blp = sc.filter('lowpass', 650);
    const bg = sc.gain(1);
    buzz.connect(blp); blp.connect(bg); bg.connect(mod);

    const sub = sc.osc('sine', 50, t, far);
    const sg = sc.gain(0.4);
    sub.connect(sg); sg.connect(mod);

    const whine = sc.osc('sine', 3180, t, far);
    const wg = sc.gain(0.03);
    const wl = sc.osc('sine', 0.21, t, far);
    const wa = sc.gain(8);
    wl.connect(wa); wa.connect(whine.detune);
    whine.connect(wg); wg.connect(mod);
    sc.deadline = Infinity;
  }

  fadeTo(t: number, level: number, tc: number): void {
    this.out.gain.setTargetAtTime(level, t, tc);
  }

  dispose(): void {
    this.sc.dispose(true);
  }
}

/** 继电器 "嗒": 高通噪声瞬态 + 短促共振, 偶尔连响两下 */
export function relayClick(kit: Kit, t: number): void {
  const r = kit.rng;
  const one = (at: number, lv: number): void => {
    const sc = kit.scope();
    const g = sc.gain(0);
    const end = perc(g.gain, at, 0.0008, LV.relay * lv, 0.003);
    const nz = sc.noise(kit.noise.white, at, end - at);
    const bp = sc.filter('bandpass', 3000, 2);
    nz.connect(bp); bp.connect(g);
    const rg = sc.gain(0);
    const rEnd = perc(rg.gain, at, 0.0005, LV.relay * lv * 0.5, 0.006);
    const ro = sc.osc('sine', 1100, at, rEnd);
    ro.connect(rg);
    const sum = sc.gain(1);
    g.connect(sum); rg.connect(sum);
    const pn = sc.pan((r() * 2 - 1) * 0.5);
    sum.connect(pn);
    sc.route(pn, 'sfx', 0.15);
  };
  one(t, 1);
  if (r() < 0.4) one(t + range(r, 0.05, 0.12), 0.7);
}

// ---------------------------------------------------------------------------
// 环境随机事件
// ---------------------------------------------------------------------------

/** 枪虾的一声爆裂: 从预烘焙的脉冲库里挑一个, 随机音高 / 幅度. 不占 Scope, 结束自动断开 */
export function snap(kit: Kit, t: number, amp: number): void {
  const ctx = kit.ctx;
  const s = ctx.createBufferSource();
  s.buffer = pick(kit.rng, kit.noise.clicks);
  s.playbackRate.value = 0.8 + kit.rng() * 0.45;
  const g = ctx.createGain();
  g.gain.value = amp;
  s.connect(g);
  g.connect(kit.buses.amb);
  s.addEventListener(
    'ended',
    () => {
      s.disconnect();
      g.disconnect();
    },
    { once: true },
  );
  s.start(t);
}

/** 远处的鲸鸣式音调滑行: 三个泛音, 音高轮廓 上扬再回落, 钟形包络, 重混响. 极轻极稀 */
export function whale(kit: Kit, t: number, root: number): void {
  const r = kit.rng;
  const dur = range(r, 3.6, 6.5);
  const base = root * 2 * pick(r, [1, 1.2, 4 / 3, 1.5]);
  const a = base * range(r, 0.85, 1.0);
  const b = base * range(r, 1.25, 1.6);
  const c = base * range(r, 0.7, 0.95);
  const pts = 48;
  const contour = new Float32Array(pts);
  for (let i = 0; i < pts; i++) {
    const x = i / (pts - 1);
    if (x < 0.4) {
      const u = 0.5 - 0.5 * Math.cos(Math.PI * (x / 0.4));
      contour[i] = a + (b - a) * u;
    } else {
      const u = 0.5 - 0.5 * Math.cos(Math.PI * ((x - 0.4) / 0.6));
      contour[i] = b + (c - b) * u;
    }
  }
  const sc = kit.scope();
  const end = t + dur + 0.1;
  const env = sc.gain(0);
  env.gain.setValueCurveAtTime(bellCurve(64, 1, LV.whale), t, dur);
  [[1, 1], [2, 0.3], [3, 0.1]].forEach(([h, w]) => {
    const o = sc.osc('sine', a * h, t, end);
    const c2 = new Float32Array(pts);
    for (let i = 0; i < pts; i++) c2[i] = contour[i] * h;
    o.frequency.setValueCurveAtTime(c2, t, dur);
    const vib = sc.osc('sine', 4.7 + r(), t, end);
    const va = sc.gain(5);
    vib.connect(va); va.connect(o.detune);
    const g = sc.gain(w);
    o.connect(g); g.connect(env);
  });
  const lp = sc.filter('lowpass', 650);
  env.connect(lp);
  const pn = sc.pan((r() * 2 - 1) * 0.5);
  lp.connect(pn);
  sc.route(pn, 'amb', 0.7);
}

/** 远处的吱嘎: 速率不规则的锯齿脉冲 (粘滑摩擦) 过移动的高 Q 共振 */
export function creak(kit: Kit, t: number): void {
  const r = kit.rng;
  const dur = range(r, 0.7, 1.7);
  const sc = kit.scope();
  const end = t + dur + 0.1;
  const pulse = sc.osc('sawtooth', 24, t, end);
  pulse.frequency.setValueCurveAtTime(wanderCurve(24, r, 9, 38), t, dur);
  const bp = sc.filter('bandpass', 500, 9);
  bp.frequency.setValueCurveAtTime(wanderCurve(16, r, 260, 900, 0.8), t, dur);
  const env = sc.gain(0);
  env.gain.setValueCurveAtTime(bellCurve(48, 1.1, LV.creak), t, dur);
  pulse.connect(bp); bp.connect(env);
  const pn = sc.pan((r() * 2 - 1) * 0.6);
  env.connect(pn);
  sc.route(pn, 'amb', 0.6);
}

/** 深海的稀疏低音: 低频基音 + 几个泛音 (小喇叭也能听出音高), 极缓的起落 */
export function deepTone(kit: Kit, t: number, root: number): void {
  const r = kit.rng;
  const dur = range(r, 6, 11);
  const f = root * pick(r, [1, 1.2, 4 / 3, 1.5]);
  const sc = kit.scope();
  const end = t + dur + 0.1;
  const env = sc.gain(0);
  env.gain.setValueCurveAtTime(bellCurve(64, 1.15, LV.tone), t, dur);
  [[1, 1, 0], [1, 0.6, 0.17], [2, 0.7, 0], [3, 0.45, 0], [4, 0.25, 0]].forEach(([h, w, det]) => {
    const o = sc.osc('sine', f * h + det, t, end);
    const g = sc.gain(w);
    o.connect(g); g.connect(env);
  });
  const lp = sc.filter('lowpass', 420);
  env.connect(lp);
  const pn = sc.pan((r() * 2 - 1) * 0.3);
  lp.connect(pn);
  sc.route(pn, 'amb', 0.5);
}

/** 实验室里偶尔的一声玻璃轻响 (五声音阶随机, 长衰减, 重混响) */
export function glassPing(kit: Kit, t: number, bright: number): void {
  const r = kit.rng;
  const f = 55 * 16 * pick(r, [1, 6 / 5, 4 / 3, 3 / 2, 9 / 5]) * (bright > 0.5 ? 1.5 : 1);
  glassTone(kit, t, {
    f,
    level: LV.ping,
    parts: [[1, 1, 0.9], [2.32, 0.45, 0.5], [4.25, 0.2, 0.28], [6.63, 0.09, 0.16]],
    atk: 0.004,
    lp: 6000,
    pan: (r() * 2 - 1) * 0.6,
    send: 0.5,
    bus: 'amb',
  });
}
