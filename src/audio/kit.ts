/**
 * 发声工具箱: 总线, 噪声库, 以及 Scope (一次性发声的节点容器).
 * Scope 负责: 登记本次发声创建的所有节点, 全部源结束后统一 disconnect, 并有超时兜底,
 * 保证长时间运行不泄漏节点.
 */

import { clamp, type Rng } from './dsp';

export type BusName = 'amb' | 'sfx' | 'ui';

export interface Buses {
  /** 环境层总线 (后接深度低通) */
  amb: GainNode;
  /** 一次性事件总线 (后接较温和的深度低通) */
  sfx: GainNode;
  /** 界面音总线 (不受深度影响) */
  ui: GainNode;
  /** 混响发送汇总 */
  send: GainNode;
  /** 主链入口 */
  pre: GainNode;
}

export interface NoiseBank {
  white: AudioBuffer;
  pinkA: AudioBuffer;
  pinkB: AudioBuffer;
  brown: AudioBuffer;
  clicks: AudioBuffer[];
}

export class Kit {
  readonly scopes = new Set<Scope>();
  voices = 0;
  maxVoices = 56;
  /** 计数器, 测试用: 各类事件触发了多少次 */
  readonly stats: Record<string, number> = {};

  constructor(
    readonly ctx: BaseAudioContext,
    readonly buses: Buses,
    readonly noise: NoiseBank,
    readonly rng: Rng,
  ) {}

  get now(): number {
    return this.ctx.currentTime;
  }

  scope(): Scope {
    return new Scope(this);
  }

  full(): boolean {
    return this.voices >= this.maxVoices;
  }

  count(name: string): void {
    this.stats[name] = (this.stats[name] ?? 0) + 1;
  }

  /** 清理超时仍未收到 ended 的 Scope (页面被节流或源没启动) */
  sweep(now: number): void {
    for (const s of this.scopes) if (now > s.deadline) s.dispose(true);
  }

  disposeAll(): void {
    for (const s of [...this.scopes]) s.dispose(true);
  }
}

/** 指数衰减包络: 线性起音, 然后 setTarget 衰减到 0. 返回衰减到约 -78 dB 的时刻 */
export function perc(p: AudioParam, t: number, atk: number, peak: number, tau: number): number {
  p.setValueAtTime(0, t);
  p.linearRampToValueAtTime(peak, t + atk);
  p.setTargetAtTime(0, t + atk, tau);
  return t + atk + tau * 9;
}

export class Scope {
  private nodes: AudioNode[] = [];
  private sources: AudioScheduledSourceNode[] = [];
  private live = 0;
  private closed = false;
  /** 超过这个时刻仍未清理, 由 kit.sweep 强制回收 */
  deadline = 0;

  constructor(readonly kit: Kit) {
    kit.scopes.add(this);
    kit.voices++;
  }

  get ctx(): BaseAudioContext {
    return this.kit.ctx;
  }

  add<T extends AudioNode>(n: T): T {
    this.nodes.push(n);
    return n;
  }

  gain(v = 0): GainNode {
    const g = this.add(this.ctx.createGain());
    g.gain.value = v;
    return g;
  }

  /** lowpass / highpass 的 q 单位是 dB (默认 -3 dB = 巴特沃斯, 无谐振峰); 其余类型是线性 Q */
  filter(type: BiquadFilterType, f: number, q?: number): BiquadFilterNode {
    const b = this.add(this.ctx.createBiquadFilter());
    b.type = type;
    b.frequency.value = clamp(f, 10, this.ctx.sampleRate * 0.45);
    b.Q.value = q ?? (type === 'lowpass' || type === 'highpass' ? -3 : 0.7);
    return b;
  }

  /** 声像节点, 需要对 pan 做自动化时用; 环境不支持 StereoPanner 时返回 null */
  stereo(p: number): StereoPannerNode | null {
    if (typeof this.ctx.createStereoPanner !== 'function') return null;
    const n = this.add(this.ctx.createStereoPanner());
    n.pan.value = clamp(p, -1, 1);
    return n;
  }

  /** 声像; 不支持 StereoPanner 时退化为直通增益 */
  pan(p: number): AudioNode {
    return this.stereo(p) ?? this.gain(1);
  }

  private arm(s: AudioScheduledSourceNode, t1: number): void {
    this.nodes.push(s);
    this.sources.push(s);
    this.live++;
    this.deadline = Math.max(this.deadline, t1 + 1.5);
    s.addEventListener(
      'ended',
      () => {
        if (--this.live <= 0) this.dispose();
      },
      { once: true },
    );
  }

  /** 振荡器: 在 [t0, t1] 内运行, 结束后自动清理 */
  osc(type: OscillatorType, freq: number, t0: number, t1: number): OscillatorNode {
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    this.arm(o, t1);
    o.start(t0);
    o.stop(t1);
    return o;
  }

  /** 用自定义周期波形的振荡器 */
  oscWave(wave: PeriodicWave, freq: number, t0: number, t1: number): OscillatorNode {
    const o = this.ctx.createOscillator();
    o.setPeriodicWave(wave);
    o.frequency.value = freq;
    this.arm(o, t1);
    o.start(t0);
    o.stop(t1);
    return o;
  }

  /** 从噪声缓冲里随机截一段 dur 秒的噪声 (随机起点, 每次听感不同); 比缓冲还长就循环 */
  noise(buf: AudioBuffer, t0: number, dur: number): AudioBufferSourceNode {
    const s = this.ctx.createBufferSource();
    s.buffer = buf;
    this.arm(s, t0 + dur);
    if (dur + 0.05 >= buf.duration) {
      s.loop = true;
      s.start(t0, this.kit.rng() * buf.duration);
      s.stop(t0 + dur);
    } else {
      const off = this.kit.rng() * (buf.duration - dur - 0.05);
      s.start(t0, off, dur);
    }
    return s;
  }

  /** 循环噪声, 生命周期由持有者管理 (deadline 设为无穷, 需要手动 dispose) */
  loopNoise(buf: AudioBuffer, rate = 1): AudioBufferSourceNode {
    const s = this.ctx.createBufferSource();
    s.buffer = buf;
    s.loop = true;
    s.playbackRate.value = rate;
    this.nodes.push(s);
    this.sources.push(s);
    this.deadline = Infinity;
    s.start(0, this.kit.rng() * buf.duration);
    return s;
  }

  /** 送到总线, 并可选发一路到混响 */
  route(from: AudioNode, bus: BusName, send = 0): void {
    from.connect(this.kit.buses[bus]);
    if (send > 0) {
      const g = this.gain(send);
      from.connect(g);
      g.connect(this.kit.buses.send);
    }
  }

  /** 手动结束 (持久声部用): 停源, 断开, 归还名额 */
  dispose(force = false): void {
    if (this.closed) return;
    this.closed = true;
    if (force) {
      for (const s of this.sources) {
        try {
          s.stop();
        } catch {
          /* 没启动或已停止 */
        }
      }
    }
    for (const n of this.nodes) {
      try {
        n.disconnect();
      } catch {
        /* 已断开 */
      }
    }
    this.nodes.length = 0;
    this.sources.length = 0;
    this.kit.scopes.delete(this);
    this.kit.voices--;
  }
}
