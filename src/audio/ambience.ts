/**
 * 常驻环境层. 节点图只在 init 时建一次, 之后所有变化 (风味 / 深度 / 游速) 都是参数缓动,
 * 不新建不销毁节点, 所以切换风味是平滑交叉淡化, 也不会产生爆音.
 *
 * 所有低频调制 (LFO) 都用互质的慢速率, 增益 / 滤波 / 音高各自独立漂移, 听不出循环.
 * 频率类调制走 detune (音分), 与基础频率无关, 基础频率被缓动时调制深度自动按比例变化.
 */

import { makeRng } from './dsp';
import type { NoiseBank } from './kit';
import type { Mix } from './mix';

function setP(p: AudioParam, v: number, now: number, tc: number): void {
  if (!Number.isFinite(v)) return;
  if (tc <= 0) p.setValueAtTime(v, now);
  else p.setTargetAtTime(v, now, tc);
}

/** 一个常驻层的出口. 目标增益为 0 一段时间后把它从总出口摘掉: 摘掉后整条子图不再被处理, CPU 归零 */
interface Layer {
  out: GainNode;
  on: boolean;
  offAt: number;
}

interface DronePartial {
  ratio: number;
  det: number;
  osc: OscillatorNode;
}

export class Ambience {
  /** 环境总出口, 连到 buses.amb */
  readonly out: GainNode;
  /** 测试用: 静音常驻层 (只留手动触发的事件) */
  muted = false;

  private readonly ctx: BaseAudioContext;
  private readonly nodes: AudioNode[] = [];
  private readonly srcs: AudioScheduledSourceNode[] = [];
  private readonly layers: Layer[] = [];
  private readonly rng: () => number;

  private bedOut!: Layer;
  private bedLp!: BiquadFilterNode;
  private washOut!: Layer;
  private washLp!: BiquadFilterNode;
  private droneOut!: Layer;
  private partials: DronePartial[] = [];
  private roomOut!: Layer;
  private roomLp!: BiquadFilterNode;
  private glassOut!: Layer;
  private rushOut!: Layer;
  private rushBp!: BiquadFilterNode;
  private pumpOut!: Layer;

  constructor(ctx: BaseAudioContext, private readonly noise: NoiseBank, seed: number) {
    this.ctx = ctx;
    this.rng = makeRng(seed);
    this.out = this.g(0);
    this.buildBed();
    this.buildWash();
    this.buildDrone();
    this.buildRoom();
    this.buildGlass();
    this.buildRush();
    this.buildPump();
  }

  // ---- 小工具 -------------------------------------------------------------

  private g(v: number): GainNode {
    const n = this.ctx.createGain();
    n.gain.value = v;
    this.nodes.push(n);
    return n;
  }

  /** 登记一个层出口并接到总出口 */
  private addLayer(out: GainNode): Layer {
    const L: Layer = { out, on: true, offAt: Infinity };
    out.connect(this.out);
    this.layers.push(L);
    return L;
  }

  /** 设定层的目标增益; 目标非零时保证已接上, 目标为零时排队摘除 */
  private setLayer(L: Layer, target: number, now: number, tc: number): void {
    if (!Number.isFinite(target)) return;
    setP(L.out.gain, target, now, tc);
    // 2e-4 (层内 RMS 约 0.2, 即 -88 dBFS 以下) 视为零: 宿主传来极小的游速也不该让整层白白跑着
    if (target > 2e-4) {
      L.offAt = Infinity;
      if (!L.on) {
        L.out.connect(this.out);
        L.on = true;
      }
    } else if (L.on && L.offAt === Infinity) {
      // 增益缓动到 -60 dB 以下 (7 个时间常数) 再摘, 摘的瞬间没有可闻的台阶
      L.offAt = tc <= 0 ? now : now + tc * 7 + 0.05;
      if (tc <= 0) this.housekeep(now);
    }
  }

  /** 由引擎的 tick 定期调用: 摘除已经淡到静音的层 */
  housekeep(now: number): void {
    for (const L of this.layers) {
      if (L.on && now >= L.offAt) {
        try {
          L.out.disconnect(this.out);
        } catch {
          /* 已断开 */
        }
        L.on = false;
        L.offAt = Infinity;
      }
    }
  }

  /** lowpass / highpass 的 Q 单位是 dB, -3 = 无谐振峰 */
  private f(type: BiquadFilterType, freq: number, q?: number): BiquadFilterNode {
    const n = this.ctx.createBiquadFilter();
    n.type = type;
    n.frequency.value = freq;
    n.Q.value = q ?? (type === 'lowpass' || type === 'highpass' ? -3 : 0.7);
    this.nodes.push(n);
    return n;
  }

  private loop(buf: AudioBuffer, rate: number): AudioBufferSourceNode {
    const s = this.ctx.createBufferSource();
    s.buffer = buf;
    s.loop = true;
    s.playbackRate.value = rate;
    s.start(0, this.rng() * buf.duration);
    this.nodes.push(s);
    this.srcs.push(s);
    return s;
  }

  private sine(freq: number): OscillatorNode {
    const o = this.ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = freq;
    o.start(0);
    this.nodes.push(o);
    this.srcs.push(o);
    return o;
  }

  /** 慢速正弦调制, 随机初相位 (用带相位的周期波, 避免所有 LFO 同时从零点起步) */
  private lfo(freq: number, depth: number, target: AudioParam): void {
    const ph = this.rng() * Math.PI * 2;
    const wave = this.ctx.createPeriodicWave(
      new Float32Array([0, Math.sin(ph)]),
      new Float32Array([0, Math.cos(ph)]),
      { disableNormalization: true },
    );
    const o = this.ctx.createOscillator();
    o.setPeriodicWave(wave);
    o.frequency.value = freq;
    o.start(0);
    const a = this.g(depth);
    o.connect(a);
    a.connect(target);
    this.nodes.push(o);
    this.srcs.push(o);
  }

  // ---- 各层 ---------------------------------------------------------------

  /** 深海般的布朗噪声底, 两个慢 LFO 一个调幅一个调截止 */
  private buildBed(): void {
    // 两路不同速率的布朗噪声循环 (周期 9.0 s / 9.9 s) 相加, 合成后的波形实际上不会重复
    const srcA = this.loop(this.noise.brown, 1.0);
    const srcB = this.loop(this.noise.brown, 0.91);
    const hp = this.f('highpass', 30);
    const lp = this.f('lowpass', 280);
    const mod = this.g(1);
    const out = this.g(0);
    const half = this.g(0.71);
    srcA.connect(half); srcB.connect(half);
    half.connect(hp); hp.connect(lp); lp.connect(mod); mod.connect(out);
    this.lfo(0.061, 0.22, mod.gain);
    this.lfo(0.043, 260, lp.detune);
    this.bedOut = this.addLayer(out);
    this.bedLp = lp;
  }

  /** 中频水声: 粉红噪声带通, 像远处浪涌的呼吸 */
  private buildWash(): void {
    const src = this.loop(this.noise.pinkA, 0.87);
    const hp = this.f('highpass', 160);
    const lp = this.f('lowpass', 1500);
    const mod = this.g(1);
    const out = this.g(0);
    src.connect(hp); hp.connect(lp); lp.connect(mod); mod.connect(out);
    this.lfo(0.083, 0.35, mod.gain);
    this.lfo(0.052, 380, lp.detune);
    this.washOut = this.addLayer(out);
    this.washLp = lp;
  }

  /** 低频泛音: 根音 / 五度 / 八度 / 十二度, 微失谐产生缓慢拍音, 各自慢速起伏 */
  private buildDrone(): void {
    const lp = this.f('lowpass', 520);
    const out = this.g(0);
    lp.connect(out);
    const defs = [
      { ratio: 1, det: 0, w: 0.5, lfo: 0.023, pan: -0.45 },
      { ratio: 1.5, det: 0.21, w: 0.25, lfo: 0.037, pan: 0.4 },
      { ratio: 2, det: -0.17, w: 0.28, lfo: 0.029, pan: -0.15 },
      { ratio: 3, det: 0.33, w: 0.08, lfo: 0.041, pan: 0.6 },
    ];
    for (const d of defs) {
      const o = this.sine(55 * d.ratio + d.det);
      const mod = this.g(1);
      const w = this.g(d.w);
      // 每个泛音放在不同的声像位置: 低频和弦有宽度, 不会挤在正中间
      const pn = this.ctx.createStereoPanner?.();
      o.connect(mod); mod.connect(w);
      if (pn) {
        pn.pan.value = d.pan;
        this.nodes.push(pn);
        w.connect(pn); pn.connect(lp);
      } else w.connect(lp);
      this.lfo(d.lfo, 0.3, mod.gain);
      this.lfo(0.017 + d.ratio * 0.006, 7, o.detune);
      this.partials.push({ ratio: d.ratio, det: d.det, osc: o });
    }
    this.droneOut = this.addLayer(out);
  }

  /** 实验室房间声: 柔和的粉红噪声 + 极轻的 100 / 200 Hz 通风嗡声 */
  private buildRoom(): void {
    const src = this.loop(this.noise.pinkB, 1.0);
    const hp = this.f('highpass', 85);
    const lp = this.f('lowpass', 2200);
    const mod = this.g(1);
    const out = this.g(0);
    src.connect(hp); hp.connect(lp); lp.connect(mod); mod.connect(out);
    this.lfo(0.047, 0.15, mod.gain);
    const hum1 = this.sine(100);
    const hum2 = this.sine(200.4);
    const h1 = this.g(0.05);
    const h2 = this.g(0.018);
    hum1.connect(h1); hum2.connect(h2); h1.connect(out); h2.connect(out);
    this.roomOut = this.addLayer(out);
    this.roomLp = lp;
  }

  /** 玻璃共振: 噪声激励一组高 Q 带通, 得到随机闪烁的高频泛音 (不是固定的嘟嘟声) */
  private buildGlass(): void {
    const src = this.loop(this.noise.pinkB, 1.13);
    const out = this.g(0);
    const freqs = [880, 1174.7, 1568, 2349.3];
    const ws = [1, 0.8, 0.6, 0.4];
    freqs.forEach((f, i) => {
      const bp = this.f('bandpass', f, 70);
      const mod = this.g(1);
      const w = this.g(ws[i]);
      src.connect(bp); bp.connect(mod); mod.connect(w); w.connect(out);
      this.lfo(0.031 + i * 0.013, 0.5, mod.gain);
    });
    this.glassOut = this.addLayer(out);
  }

  /** 水流: 游速与流水槽共用, 截止频率随强度上升 */
  private buildRush(): void {
    const src = this.loop(this.noise.pinkA, 1.21);
    const hp = this.f('highpass', 140);
    const bp = this.f('bandpass', 900, 0.6);
    const mod = this.g(1);
    const out = this.g(0);
    src.connect(hp); hp.connect(bp); bp.connect(mod); mod.connect(out);
    this.lfo(0.17, 0.12, mod.gain);
    this.rushOut = this.addLayer(out);
    this.rushBp = bp;
  }

  /** 流水槽泵机: 50 Hz 基频的低嗡声 + 谐波, 轻微抖动 */
  private buildPump(): void {
    const lp = this.f('lowpass', 420);
    const mod = this.g(1);
    const out = this.g(0);
    lp.connect(mod); mod.connect(out);
    this.lfo(0.27, 0.05, mod.gain);
    [[50, 0.5], [100, 1], [150, 0.35], [200, 0.12]].forEach(([f, w], i) => {
      const o = this.sine(f);
      const g = this.g(w);
      o.connect(g); g.connect(lp);
      this.lfo(0.11 + i * 0.03, 4, o.detune);
    });
    this.pumpOut = this.addLayer(out);
  }

  // ---- 控制 ---------------------------------------------------------------

  /** 把混音目标缓动到位. tc 是 setTargetAtTime 的时间常数, 4 * tc 约 98% 到位; tc <= 0 立即生效 */
  apply(m: Mix, now: number, tc: number): void {
    setP(this.out.gain, this.muted ? 0 : m.ambGain, now, tc);
    this.setLayer(this.bedOut, m.bedGain, now, tc);
    setP(this.bedLp.frequency, m.bedLp, now, tc);
    this.setLayer(this.washOut, m.washGain, now, tc);
    setP(this.washLp.frequency, m.washLp, now, tc);
    this.setLayer(this.droneOut, m.droneGain, now, tc);
    for (const p of this.partials) setP(p.osc.frequency, m.droneRoot * p.ratio + p.det, now, tc);
    this.setLayer(this.roomOut, m.roomGain, now, tc);
    setP(this.roomLp.frequency, m.roomLp, now, tc);
    this.setLayer(this.glassOut, m.glassGain, now, tc);
    this.setLayer(this.rushOut, m.rushGain, now, tc);
    setP(this.rushBp.frequency, m.rushFreq, now, tc);
    this.setLayer(this.pumpOut, m.pumpGain, now, tc);
  }

  dispose(): void {
    for (const s of this.srcs) {
      try {
        s.stop();
      } catch {
        /* 已停止 */
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
    this.srcs.length = 0;
  }
}
