/**
 * 鱼类解剖图鉴的声音引擎. 全部用 Web Audio 实时合成, 没有任何采样文件.
 *
 * 结构: 常驻环境层 (ambience.ts) + 一次性发声 (voices.ts) + 主母线 (压缩 / 低通 / 软削波)
 * + 合成的水下混响. 随机环境事件由一个带前瞻的调度器排程 (tick), 全部使用 AudioContext 时间.
 *
 * 宿主须知:
 *  - init() 必须在用户手势 (click / keydown) 里调用, 之后 setEnabled(true) 才会出声.
 *  - 默认 enabled = false, 音量 0.8; 所有触发方法在未 init / 未启用时是安全的空操作.
 *  - 页面切到后台会自动淡出并挂起, 回来自动恢复 (pauseWhenHidden 可关).
 *  - 可注入 OfflineAudioContext 做离线渲染 (见 harness.ts), 此时用 tick() 手动驱动调度器.
 */

import { Ambience } from './ambience';
import { clamp, clamp01, expDraw, makeClickBank, makeNoiseBuffer, makeReverbImpulse, makeRng, num, range, softClipCurve, type Rng } from './dsp';
import { Kit, type Buses, type NoiseBank } from './kit';
import { computeMix, computeRates, FLAVORS, type Rates, type SceneFlavor } from './mix';
import * as V from './voices';

export type { SceneFlavor } from './mix';
export type { UiKind } from './voices';

export interface AudioEngineOptions {
  /** 注入的上下文 (OfflineAudioContext 用于离线渲染测试); 缺省则在 init() 里创建实时 AudioContext */
  context?: BaseAudioContext;
  /** true: 不启动内部定时器, 由外部按需调用 tick() (离线渲染) */
  manualTick?: boolean;
  /** 随机种子: 相同种子 + 相同调用序列 = 完全相同的声音. 缺省随机 */
  seed?: number;
  /** 页面不可见时自动淡出并挂起, 默认 true */
  pauseWhenHidden?: boolean;
}

/** 环境事件名, 供 trigger() 强制触发 (测试 / 调试用) */
export type AmbientEvent = 'snap' | 'bubble' | 'creak' | 'whale' | 'tone' | 'ping' | 'relay';

const TICK_MS = 250;
const LOOKAHEAD = 0.75;
/** 主增益淡入淡出时间常数, 4 * tc 约 98% 到位, 即约 0.6 s */
const MASTER_TC = 0.15;
/** 补偿 DynamicsCompressor 自带的补偿增益 (校准值, 见 harness 的 chain 测试) */
const COMP_TRIM = 0.66;
const WET_LEVEL = 0.6;
const HUM_LEVEL = 0.024;
/** 软削波上限 = -1.2 dBFS, 输出不可能超过 */
const SOFT_CEIL = 0.87;

interface Proc {
  name: AmbientEvent;
  rate: () => number;
  /** poisson: 泊松过程 (爆裂, 成簇); gapped: 带最小间隔的爱尔朗-2, 稀疏事件用, 不会挤在一起 */
  mode: 'poisson' | 'gapped';
  minGap: number;
  fire: (t: number) => void;
  next: number;
}

export class AudioEngine {
  private readonly opts: AudioEngineOptions;
  private ctx: BaseAudioContext | null;
  private readonly injected: boolean;
  private readonly offline: boolean;
  private readonly seed: number;

  private initP: Promise<void> | null = null;
  private built = false;
  private disposed = false;
  private blocked = false;

  // 宿主设置的状态 (init 之前也可设置, 建图后一次性生效)
  private enabledFlag = false;
  private volume = 0.8;
  private flavor: SceneFlavor = 'living';
  private depth = 0;
  private swim = 0;
  private humOverride: boolean | null = null;
  /** 声音通路是否打开 (已启用且页面可见). 关闭期间所有触发都是空操作 */
  private running = false;
  /** 是我们自己为省电挂起的 (区别于被浏览器策略挡住) */
  private selfSuspended = false;
  private synced = false;

  // 节点图
  private kit!: Kit;
  private buses!: Buses;
  private amb!: Ambience;
  private ambLp!: BiquadFilterNode;
  private sfxLp!: BiquadFilterNode;
  private comp!: DynamicsCompressorNode;
  private master!: GainNode;
  private nodes: AudioNode[] = [];

  // 定时器 / 监听
  private timer: ReturnType<typeof setInterval> | null = null;
  private suspendTimer: ReturnType<typeof setTimeout> | null = null;
  private closeTimer: ReturnType<typeof setTimeout> | null = null;
  private onVis: (() => void) | null = null;
  private gestureArmed = false;

  // 调度
  private procs: Proc[] = [];
  private rates: Rates = { shrimp: 0, bubble: 0, creak: 0, whale: 0, tone: 0, ping: 0 };
  private schedRng: Rng;
  private lastPump = 0;
  private crackleMod = 1;
  private crackleTarget = 1;
  private crackleLeft = 0;
  private lastMixT = -1;
  private dirtyMix = false;
  private dirtyTc = 0.3;
  private isolated = false;

  // 一次性发声限流 / 状态
  private lastFx: Record<string, number> = {};
  private lastBeat = -1;
  private beatPeriod = 1;
  private warned = new Set<string>();

  // 充气 / 电嗡声
  private infVoice: V.InflateVoice | null = null;
  private infLastT = -1;
  private infLastAmt = 0;
  private infRate = 0;
  private infActiveT = 0;
  private infReleased = true;
  private infNextGulp = 0;
  private hum: V.HumVoice | null = null;
  private humKillAt = Infinity;

  constructor(options: AudioEngineOptions = {}) {
    this.opts = options;
    this.ctx = options.context ?? null;
    this.injected = !!options.context;
    this.offline = typeof OfflineAudioContext !== 'undefined' && options.context instanceof OfflineAudioContext;
    this.seed = (options.seed ?? Math.floor(Math.random() * 4294967296)) >>> 0;
    this.schedRng = makeRng(this.seed ^ 0x85ebca6b);
  }

  // =========================================================================
  // 生命周期
  // =========================================================================

  /** 建图并尝试启动 AudioContext. 必须在用户手势里调用; 幂等, 重复调用会顺便补一次 resume */
  init(): Promise<void> {
    if (this.disposed) return Promise.resolve();
    if (!this.initP) {
      const p = this.doInit();
      this.initP = p;
      // 失败后允许下一次 init() 重试
      void p.then(() => {
        if (!this.built && !this.disposed && this.initP === p) this.initP = null;
      });
    } else if (this.built && (this.running || this.blocked)) {
      void this.resumeCtx();
    }
    return this.initP;
  }

  /** 图已建好且没有被浏览器的自动播放策略挡住 */
  get ready(): boolean {
    return this.built && !this.blocked && !this.disposed;
  }

  get enabled(): boolean {
    return this.enabledFlag;
  }

  get context(): BaseAudioContext | null {
    return this.ctx;
  }

  private async doInit(): Promise<void> {
    try {
      let ctx = this.ctx;
      if (!ctx) {
        const w = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
        const Ctor = w.AudioContext ?? w.webkitAudioContext;
        if (!Ctor) throw new Error('当前环境不支持 Web Audio');
        ctx = new Ctor({ latencyHint: 'interactive' });
        this.ctx = ctx;
      }
      // 用户手势内第一时间解锁: resume 必须在同步调用栈里发出 (Safari 要求), 之后再分段建图.
      // 创建 AudioContext 本身要占主线程约 100 ms (浏览器打开音频设备), 之后让出一次再开始合成
      const unlock = this.offline ? Promise.resolve() : this.resumeCtx();
      if (!this.offline) await new Promise<void>((res) => setTimeout(res, 0));
      await this.build(ctx);
      if (this.disposed) return;
      this.built = true;
      this.applyMix(0);
      if (!this.offline) {
        if (this.opts.pauseWhenHidden !== false && typeof document !== 'undefined') {
          this.onVis = () => this.sync();
          document.addEventListener('visibilitychange', this.onVis);
        }
        ctx.addEventListener('statechange', () => {
          const st = (ctx as AudioContext).state as string;
          if (st === 'running') {
            this.blocked = false;
            // 不需要声音时别空转 (例如被策略挡住后来又被手势放行)
            if (!this.running && !this.disposed) this.scheduleSuspend();
          } else if (this.running && !this.selfSuspended && !this.disposed && st !== 'closed') {
            // 运行中被系统打断 (iOS 来电 / 策略回收): 下一次手势自动恢复
            this.blocked = true;
            this.armGestureResume();
          }
        });
      }
      this.sync();
      await unlock;
    } catch (e) {
      console.warn('[audio] 初始化失败, 声音不可用:', e);
      this.built = false;
      this.teardown();
      if (!this.injected && this.ctx) {
        (this.ctx as AudioContext).close().catch(() => undefined);
        this.ctx = null;
      }
    }
  }

  // =========================================================================
  // 建图
  // =========================================================================

  /** 分段建图: 噪声 / 混响脉冲的合成较重 (合计约 200 ms), 段间让出主线程, 避免首次点击时卡住渲染循环 */
  private async build(ctx: BaseAudioContext): Promise<void> {
    const y = this.offline ? async (): Promise<void> => undefined : (): Promise<void> => new Promise((res) => setTimeout(res, 0));
    const gen = makeRng(this.seed);
    const white = makeNoiseBuffer(ctx, 'white', 2.5, gen, { fadeSec: 0.2 });
    await y();
    const pinkA = makeNoiseBuffer(ctx, 'pink', 7, gen, { corr: 0.2 });
    await y();
    const pinkB = makeNoiseBuffer(ctx, 'pink', 6, gen, { corr: 0 });
    await y();
    const brown = makeNoiseBuffer(ctx, 'brown', 8, gen, { corr: 0.4, fadeSec: 1 });
    await y();
    const clicks = makeClickBank(ctx, gen, 12);
    const ir = makeReverbImpulse(ctx, 2.5, gen);
    await y();
    if (this.disposed) return;
    const noise: NoiseBank = { white, pinkA, pinkB, brown, clicks };

    const gain = (v: number): GainNode => {
      const g = ctx.createGain();
      g.gain.value = v;
      this.nodes.push(g);
      return g;
    };
    const biquad = (type: BiquadFilterType, f: number, q: number): BiquadFilterNode => {
      const b = ctx.createBiquadFilter();
      b.type = type;
      b.frequency.value = Math.min(f, ctx.sampleRate * 0.45);
      b.Q.value = q;
      this.nodes.push(b);
      return b;
    };

    const buses: Buses = { amb: gain(1), sfx: gain(1), ui: gain(1), send: gain(1), pre: gain(1) };
    this.buses = buses;

    // 深度低通: 环境层深处很暗, 事件层温和变暗, 界面音不受影响
    this.ambLp = biquad('lowpass', 9500, -3);
    this.sfxLp = biquad('lowpass', 16000, -3);
    buses.amb.connect(this.ambLp); this.ambLp.connect(buses.pre);
    buses.sfx.connect(this.sfxLp); this.sfxLp.connect(buses.pre);
    buses.ui.connect(buses.pre);

    // 水下混响: 合成脉冲响应 ~2.5 s, 深暗
    const conv = ctx.createConvolver();
    conv.buffer = ir;
    conv.normalize = true;
    const wet = gain(WET_LEVEL);
    buses.send.connect(conv); conv.connect(wet); wet.connect(buses.pre);
    this.nodes.push(conv);

    // 主母线: 去直流 -> 温和压缩 -> 补偿 -> 暖低通 -> 主音量 -> 软削波保险 -> 输出
    const dcHp = biquad('highpass', 22, -3);
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -22;
    comp.knee.value = 20;
    comp.ratio.value = 2.5;
    comp.attack.value = 0.015;
    comp.release.value = 0.3;
    this.comp = comp;
    this.nodes.push(comp);
    const trim = gain(COMP_TRIM);
    const masterLp = biquad('lowpass', 9500, -3);
    this.master = gain(0);
    const shaper = ctx.createWaveShaper();
    shaper.curve = softClipCurve(2049, SOFT_CEIL);
    shaper.oversample = 'none';
    this.nodes.push(shaper);
    buses.pre.connect(dcHp); dcHp.connect(comp); comp.connect(trim); trim.connect(masterLp);
    masterLp.connect(this.master); this.master.connect(shaper); shaper.connect(ctx.destination);

    // 发声工具箱 + 常驻环境层
    this.kit = new Kit(ctx, buses, noise, makeRng(this.seed ^ 0x9e3779b9));
    this.amb = new Ambience(ctx, noise, this.seed ^ 0xc2b2ae35);
    this.amb.out.connect(buses.amb);
    this.buildProcs();
  }

  private buildProcs(): void {
    const k = () => this.kit;
    const r = () => this.kit.rng;
    const ev = (name: AmbientEvent, fn: (t: number) => void) => (t: number): void => {
      if (k().full()) return;
      k().count(name);
      fn(t);
    };
    this.procs = [
      {
        name: 'snap', mode: 'poisson', minGap: 0,
        rate: () => this.rates.shrimp * this.crackleMod,
        fire: (t) => {
          k().count('snap');
          V.snap(k(), t, V.LV.snap * (0.28 + 0.72 * Math.pow(r()(), 12)));
        },
        next: NaN,
      },
      {
        name: 'bubble', mode: 'gapped', minGap: 3,
        rate: () => this.rates.bubble,
        fire: ev('bubble', (t) => V.bubbleCluster(k(), t, range(r(), 0.15, 0.7), V.LV.bubbleAmb, 'amb')),
        next: NaN,
      },
      {
        name: 'creak', mode: 'gapped', minGap: 8,
        rate: () => this.rates.creak,
        fire: ev('creak', (t) => V.creak(k(), t)),
        next: NaN,
      },
      {
        name: 'whale', mode: 'gapped', minGap: 20,
        rate: () => this.rates.whale,
        fire: ev('whale', (t) => V.whale(k(), t, this.droneRoot())),
        next: NaN,
      },
      {
        name: 'tone', mode: 'gapped', minGap: 6,
        rate: () => this.rates.tone,
        fire: ev('tone', (t) => V.deepTone(k(), t, this.droneRoot())),
        next: NaN,
      },
      {
        name: 'ping', mode: 'gapped', minGap: 3,
        rate: () => this.rates.ping,
        fire: ev('ping', (t) => V.glassPing(k(), t, this.flavor === 'cleared' ? 1 : 0)),
        next: NaN,
      },
      {
        name: 'relay', mode: 'gapped', minGap: 1.2,
        rate: () => (this.hum && this.humKillAt === Infinity ? 1 / 5 : 0),
        fire: ev('relay', (t) => V.relayClick(k(), t)),
        next: NaN,
      },
    ];
  }

  private droneRoot(): number {
    return computeMix(this.flavor, this.depth, this.swim).droneRoot;
  }

  // =========================================================================
  // 通路开关 / 音量
  // =========================================================================

  /** 主输出淡入 / 淡出 (约 0.6 s, 无爆音). 关闭时挂起 AudioContext 并停掉调度, 零开销 */
  setEnabled(on: boolean): void {
    this.enabledFlag = !!on;
    this.sync();
  }

  /** 主音量 0..1 (平方曲线, 0.5 约 -12 dB) */
  setVolume(v: number): void {
    this.volume = num(v, this.volume, 0, 1);
    if (this.built && this.running) {
      this.master.gain.setTargetAtTime(this.volGain(), this.ctx!.currentTime, 0.05);
    }
  }

  private volGain(): number {
    return this.volume * this.volume;
  }

  private hiddenPause(): boolean {
    return (
      !this.offline &&
      this.opts.pauseWhenHidden !== false &&
      typeof document !== 'undefined' &&
      document.visibilityState === 'hidden'
    );
  }

  /** 根据 (已启用 && 页面可见) 对齐真实状态 */
  private sync(): void {
    if (!this.built || this.disposed) return;
    const ctx = this.ctx!;
    const want = this.enabledFlag && !this.hiddenPause();
    if (this.synced && want === this.running && !this.blocked) return;
    this.synced = true;
    const t = ctx.currentTime;
    if (want) {
      this.clearTimer('suspendTimer');
      this.selfSuspended = false;
      if (!this.running) {
        this.running = true;
        this.resetProcs();
        this.startTimer();
      }
      void this.resumeCtx();
      this.master.gain.setTargetAtTime(this.volGain(), t, MASTER_TC);
      this.syncHum();
    } else {
      const was = this.running;
      this.running = false;
      this.stopTimer();
      this.syncHum();
      this.master.gain.setTargetAtTime(0, t, MASTER_TC);
      if (was || this.suspendTimer === null) this.scheduleSuspend();
    }
  }

  private scheduleSuspend(): void {
    if (this.offline || !this.ctx) return;
    this.clearTimer('suspendTimer');
    this.suspendTimer = setTimeout(() => {
      this.suspendTimer = null;
      const c = this.ctx as AudioContext | null;
      if (!c || this.running || this.disposed) return;
      // 此时主输出早已淡到静音. 把还没播完的声部收掉: 否则挂起期间它们被冻结,
      // 重新启用时会接着播出半截的旧声音, 而且它们的 ended 事件也迟迟不来, 节点白占着
      this.releaseVoices();
      if (c.state === 'running') {
        this.selfSuspended = true;
        c.suspend().catch(() => undefined);
      }
    }, 900);
  }

  private releaseVoices(): void {
    this.kit.disposeAll();
    this.hum = null;
    this.humKillAt = Infinity;
    this.infVoice = null;
    this.infReleased = true;
  }

  private async resumeCtx(): Promise<void> {
    const c = this.ctx as AudioContext | null;
    if (!c || this.offline || typeof c.resume !== 'function') return;
    if (c.state === 'running') {
      this.blocked = false;
      return;
    }
    // resume() 在被自动播放策略挡住时可能一直不返回, 所以设个超时
    try {
      await Promise.race([c.resume(), new Promise<void>((res) => setTimeout(res, 1500))]);
    } catch {
      /* 被策略拒绝, 走下面的兜底 */
    }
    const st = c.state as string;
    if (st === 'running') {
      this.blocked = false;
    } else if (!this.disposed && !this.selfSuspended) {
      this.blocked = true;
      this.armGestureResume();
    }
  }

  /** 自动播放被拦时, 等下一次任意手势再 resume */
  private armGestureResume(): void {
    if (this.gestureArmed || typeof window === 'undefined') return;
    this.gestureArmed = true;
    const evs = ['pointerdown', 'keydown', 'touchend'];
    const h = (): void => {
      for (const e of evs) window.removeEventListener(e, h, true);
      this.gestureArmed = false;
      void this.resumeCtx();
    };
    for (const e of evs) window.addEventListener(e, h, true);
  }

  private startTimer(): void {
    if (this.timer !== null || this.opts.manualTick || this.offline) return;
    this.timer = setInterval(() => this.tick(), TICK_MS);
  }

  private stopTimer(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private clearTimer(which: 'suspendTimer' | 'closeTimer'): void {
    const t = this[which];
    if (t !== null) {
      clearTimeout(t);
      this[which] = null;
    }
  }

  // =========================================================================
  // 环境: 风味 / 深度 / 游速
  // =========================================================================

  /** 环境风味交叉淡化 (约 1.5 s) */
  setScene(flavor: SceneFlavor): void {
    if (!FLAVORS.includes(flavor) || flavor === this.flavor) return;
    this.flavor = flavor;
    this.humOverride = null;
    if (!this.built) return;
    this.applyMix(1.5 / 4);
    this.resetProcs();
    this.syncHum();
  }

  /** 深度 0..8000 m: 越深越暗 越低 越稀疏 */
  setDepth(depthM: number): void {
    const d = num(depthM, this.depth, 0, 8000);
    if (d === this.depth) return;
    this.depth = d;
    this.touchMix(0.35);
  }

  /** 游速 0..1: 柔和的水流声强度 */
  setSwimSpeed(v: number): void {
    const s = num(v, this.swim, 0, 1);
    if (Math.abs(s - this.swim) < 0.002) return;
    this.swim = s;
    this.touchMix(0.25);
  }

  private applyMix(tc: number): void {
    if (!this.built) return;
    const now = this.ctx!.currentTime;
    const m = computeMix(this.flavor, this.depth, this.swim);
    this.amb.apply(m, now, tc);
    const set = (p: AudioParam, v: number): void => {
      if (!Number.isFinite(v)) return;
      if (tc <= 0) p.setValueAtTime(v, now);
      else p.setTargetAtTime(v, now, tc);
    };
    const nyq = this.ctx!.sampleRate * 0.45;
    set(this.ambLp.frequency, Math.min(m.ambLp, nyq));
    set(this.sfxLp.frequency, Math.min(m.sfxLp, nyq));
    this.rates = computeRates(this.flavor, this.depth);
    this.lastMixT = now;
    this.dirtyMix = false;
  }

  /** 连续更新 (拖滑块 / 每帧游速) 合并: 距上次应用不足 80 ms 就先记脏, 交给 tick 补 */
  private touchMix(tc: number): void {
    if (!this.built) return;
    const now = this.ctx!.currentTime;
    if (now - this.lastMixT >= 0.08) this.applyMix(tc);
    else {
      this.dirtyMix = true;
      this.dirtyTc = tc;
    }
  }

  // =========================================================================
  // 调度器
  // =========================================================================

  /**
   * 调度心跳: 实时模式下每 250 ms 由内部定时器调用; 离线渲染时由外部驱动.
   * 排程窗口内的随机环境事件 (枪虾 / 气泡 / 吱嘎 / 鲸鸣 / 低音 / 玻璃声 / 继电器),
   * 回收过期节点, 处理充气 / 电嗡声的延迟收尾.
   */
  tick(): void {
    if (!this.built || this.disposed) return;
    const now = this.ctx!.currentTime;
    this.kit.sweep(now);
    this.amb.housekeep(now);
    if (this.dirtyMix && now - this.lastMixT >= 0.08) this.applyMix(this.dirtyTc);

    // 充气声部: 静止后先淡出, 再回收
    if (this.infVoice) {
      if (!this.infReleased && now - this.infActiveT > 0.3) {
        this.infVoice.release(now);
        this.infReleased = true;
      }
      if (now - this.infActiveT > 1.8) {
        this.infVoice.dispose();
        this.infVoice = null;
      }
    }
    // 电嗡声淡出后回收
    if (this.hum && now > this.humKillAt) {
      this.hum.dispose();
      this.hum = null;
      this.humKillAt = Infinity;
    }

    if (!this.running || this.isolated) return;
    this.pump(now, now + LOOKAHEAD);
    this.lastPump = now;
  }

  private resetProcs(): void {
    for (const p of this.procs) p.next = NaN;
  }

  private draw(p: Proc, rate: number): number {
    const mean = 1 / rate;
    if (p.mode === 'poisson' || mean <= p.minGap) return expDraw(this.schedRng) * mean;
    return p.minGap + (mean - p.minGap) * 0.5 * (expDraw(this.schedRng) + expDraw(this.schedRng));
  }

  private pump(now: number, horizon: number): void {
    // 枪虾爆裂的成簇程度: 慢速随机游走的速率调制
    const dt = Math.max(0, now - this.lastPump);
    this.crackleLeft -= dt;
    if (this.crackleLeft <= 0) {
      const u = this.schedRng();
      this.crackleTarget = 0.2 + 1.6 * u * u;
      this.crackleLeft = 1.5 + 3 * this.schedRng();
    }
    this.crackleMod += (this.crackleTarget - this.crackleMod) * 0.3;

    for (const p of this.procs) {
      const rate = p.rate();
      if (!(rate > 1e-6)) {
        p.next = NaN;
        continue;
      }
      if (!Number.isFinite(p.next) || p.next < now - 2) p.next = now + this.draw(p, rate);
      let guard = 0;
      while (p.next < horizon && guard++ < 64) {
        if (p.next >= now + 0.01) {
          try {
            p.fire(p.next);
          } catch (e) {
            this.warnOnce(p.name, e);
          }
        }
        p.next += this.draw(p, rate);
      }
    }
  }

  /** 强制触发一个环境事件 (测试 / 调试用), 忽略概率 */
  trigger(kind: AmbientEvent): void {
    if (!this.canPlay()) return;
    const t = this.ctx!.currentTime + 0.02;
    const p = this.procs.find((x) => x.name === kind);
    if (!p) return;
    try {
      p.fire(t);
    } catch (e) {
      this.warnOnce(kind, e);
    }
  }

  // =========================================================================
  // 一次性发声
  // =========================================================================

  private canPlay(): boolean {
    return this.built && this.running && !this.disposed && !!this.ctx;
  }

  /** 统一入口: 校验状态 + 限流 (防宿主每帧误调) + 吞掉异常, 音频永远不该拖垮应用 */
  private fx(name: string, minGap: number, fn: (t: number) => void): void {
    if (!this.canPlay()) return;
    const now = this.ctx!.currentTime;
    if (now - (this.lastFx[name] ?? -1e9) < minGap) return;
    if (this.kit.full()) return;
    this.lastFx[name] = now;
    try {
      fn(now + 0.006);
    } catch (e) {
      this.warnOnce(name, e);
    }
  }

  private warnOnce(name: string, e: unknown): void {
    if (this.warned.has(name)) return;
    this.warned.add(name);
    console.warn(`[audio] ${name} 出错 (已忽略):`, e);
  }

  /** 心室搏动 lub-dub. intensity 0..1; 两声间隔按最近的调用间隔 (即心率) 自适应 */
  heartbeat(intensity = 0.6): void {
    this.fx('heart', 0.12, (t) => {
      if (this.lastBeat >= 0) {
        const per = t - this.lastBeat;
        if (per > 0.2 && per < 3.5) this.beatPeriod = this.beatPeriod * 0.5 + per * 0.5;
      }
      this.lastBeat = t;
      const gap = clamp(0.11 + 0.13 * this.beatPeriod, 0.14, 0.26);
      // 心率越快单声越轻 (总响度大致恒定), 心率很慢时每一声略突出
      const comp = clamp(Math.sqrt(this.beatPeriod / 1.0), 0.6, 1.15);
      V.heartbeat(this.kit, t, num(intensity, 0.6, 0, 1), gap, comp);
    });
  }

  /** 水流过鳃的一次吐纳 (约每秒调用一次) */
  gillPulse(): void {
    this.fx('gill', 0.25, (t) => V.gillPulse(this.kit, t));
  }

  /** 一个气泡或一小串. size 0..1 (大小 -> 音高) */
  bubble(size = 0.5): void {
    this.fx('bubble', 0.06, (t) => V.bubbleCluster(this.kit, t, num(size, 0.5, 0, 1), V.LV.bubble));
  }

  /** 界面微音效. toggle 可传 on 决定上行 (开) / 下行 (关) */
  ui(kind: V.UiKind, on = true): void {
    this.fx(`ui:${kind}`, kind === 'hover' ? 0.045 : 0.025, (t) => V.ui(this.kit, kind, t, !!on));
  }

  /** 侧线压力脉冲声. pan -1..1 */
  sonarPing(pan = 0): void {
    this.fx('sonar', 0.15, (t) => V.sonarPing(this.kit, t, num(pan, 0, -1, 1)));
  }

  /** 物种变形: 给定时长的闪烁滤波涌动 */
  morph(durationSec: number): void {
    this.fx('morph', 0.3, (t) => V.morph(this.kit, t, num(durationSec, 2, 0.25, 30)));
  }

  /** 石首鱼的鳔鼓声: 一轮 calls 声, 每声 pulses 个脉冲, 声与声之间隔 gap 秒 */
  drum(o: { f0: number; rate: number; pulses: number; calls: number; gap: number }): void {
    this.fx('drum', 0.5, (t) => {
      const per = o.pulses / Math.max(1, o.rate);
      for (let i = 0; i < o.calls; i++) V.drumCall(this.kit, t + i * (per + o.gap), o.f0, o.rate, o.pulses, V.LV.drum);
    });
  }

  /** C-start 逃逸反射 */
  escape(): void {
    this.fx('escape', 0.2, (t) => V.escape(this.kit, t));
  }

  /**
   * 河豚充气 0..1. 宿主可每帧调用: 只有数值在变化时才出声 (吞咽 + 橡胶拉伸),
   * 变化越快声音越大, 静止约 0.3 s 后淡出, 1.8 s 后回收节点.
   */
  inflate(amount: number): void {
    const a = clamp01(num(amount, this.infLastAmt));
    if (!this.canPlay()) {
      this.infLastAmt = a;
      this.infLastT = -1;
      return;
    }
    const t = this.ctx!.currentTime;
    if (this.infLastT < 0 || t - this.infLastT > 0.5) {
      this.infLastAmt = a;
      this.infLastT = t;
      this.infRate = 0;
      return;
    }
    const dt = t - this.infLastT;
    if (dt < 0.02) return;
    const speed = (a - this.infLastAmt) / dt;
    this.infRate = this.infRate * 0.55 + speed * 0.45;
    this.infLastAmt = a;
    this.infLastT = t;
    const mag = clamp01(Math.abs(this.infRate) / 0.8);
    if (mag < 0.04) return;
    try {
      const at = t + 0.006;
      if (!this.infVoice) {
        if (this.kit.full()) return;
        this.infVoice = new V.InflateVoice(this.kit, at);
      }
      this.infVoice.update(t, a, Math.sign(this.infRate), mag);
      this.infActiveT = t;
      this.infReleased = false;
      if (t >= this.infNextGulp && !this.kit.full()) {
        V.gulp(this.kit, at, a);
        this.infNextGulp = t + (0.16 + 0.16 * this.kit.rng()) / (0.5 + mag);
      }
    } catch (e) {
      this.warnOnce('inflate', e);
    }
  }

  /** X 光模式的冷电嗡声 + 稀疏继电器 "嗒". 显式调用优先于场景默认 (xray 场景默认带嗡声) */
  xrayHum(on: boolean): void {
    this.humOverride = !!on;
    this.syncHum();
  }

  private syncHum(): void {
    if (!this.built || this.disposed) return;
    const want = this.running && (this.humOverride ?? this.flavor === 'xray');
    const now = this.ctx!.currentTime;
    try {
      if (want) {
        if (!this.hum) this.hum = new V.HumVoice(this.kit, now + 0.01);
        this.hum.fadeTo(now, HUM_LEVEL, 0.2);
        this.humKillAt = Infinity;
      } else if (this.hum && this.humKillAt === Infinity) {
        this.hum.fadeTo(now, 0, 0.15);
        // 淡出 ~13 个时间常数 (-110 dB 以下) 才拆, 拆的瞬间没有台阶
        this.humKillAt = now + 2;
      }
    } catch (e) {
      this.warnOnce('hum', e);
    }
  }

  // =========================================================================
  // 调试 / 测试钩子
  // =========================================================================

  /** 测试用: 静音常驻环境层并停掉随机事件调度, 只保留手动触发 (trigger / 公开 API) 的声音 */
  isolate(on = true): void {
    if (!this.built) return;
    this.isolated = on;
    this.amb.muted = on;
    this.applyMix(0);
  }

  /** 内部节点与计数, 供 harness 校准 / 断言用 */
  get debug(): {
    ctx: BaseAudioContext;
    kit: Kit;
    buses: Buses;
    comp: DynamicsCompressorNode;
    master: GainNode;
    stats: Record<string, number>;
    voices: number;
    scopes: number;
  } {
    return {
      ctx: this.ctx!,
      kit: this.kit,
      buses: this.buses,
      comp: this.comp,
      master: this.master,
      stats: this.kit.stats,
      voices: this.kit.voices,
      scopes: this.kit.scopes.size,
    };
  }

  // =========================================================================
  // 销毁
  // =========================================================================

  /** 拆掉所有发声节点 (不关 AudioContext) */
  private teardown(): void {
    try {
      this.hum?.dispose();
      this.infVoice?.dispose();
      this.kit?.disposeAll();
      this.amb?.dispose();
    } catch {
      /* 忽略 */
    }
    this.hum = null;
    this.infVoice = null;
    for (const n of this.nodes) {
      try {
        n.disconnect();
      } catch {
        /* 已断开 */
      }
    }
    this.nodes.length = 0;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.running = false;
    this.stopTimer();
    this.clearTimer('suspendTimer');
    if (this.onVis && typeof document !== 'undefined') document.removeEventListener('visibilitychange', this.onVis);
    this.onVis = null;
    const ctx = this.ctx;
    if (!ctx) return;
    const cleanup = (): void => {
      this.teardown();
      if (!this.injected) (ctx as AudioContext).close().catch(() => undefined);
    };
    if (this.offline || !this.built) {
      cleanup();
      return;
    }
    // 先快速淡出再拆, 避免拆图瞬间的爆音
    this.master.gain.setTargetAtTime(0, ctx.currentTime, 0.03);
    this.closeTimer = setTimeout(cleanup, 220);
  }
}
