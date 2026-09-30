// 游动运动学: 每帧在 CPU 上计算身体中轴 (保持弧长), 写入纹理供所有着色器使用.
// 同一份数据也用于标注锚点, 血流粒子与流场仿真, 保证处处一致.

import * as THREE from 'three';
import { SPINE_N } from './materials';
import type { BodyModel } from './body';

export interface WaveParams {
  amp: [number, number, number]; // A(s) 多项式 (L)
  wavelength: number; // L
  phase: number; // 周期数 (f·t)
  headYaw: number;
  finFlex: number; // 尾鳍额外柔性
  curl: number; // C 形弯曲 (rad), 正 = 向左
  curlCenter: number;
  turn: number; // 恒定转弯曲率 (rad)
}

export class Midline {
  readonly N = SPINE_N;
  readonly sMin = -0.3;
  readonly sMax = 1.5;
  readonly x = new Float32Array(SPINE_N);
  readonly z = new Float32Array(SPINE_N);
  readonly th = new Float32Array(SPINE_N);
  readonly vz = new Float32Array(SPINE_N); // 横向速度 (世界单位/秒)
  readonly vx = new Float32Array(SPINE_N);
  private px = new Float32Array(SPINE_N);
  private pz = new Float32Array(SPINE_N);
  private mass = new Float32Array(SPINE_N);
  L = 4;

  sAt(i: number) {
    return this.sMin + ((this.sMax - this.sMin) * i) / (this.N - 1);
  }

  setBody(body: BodyModel, bodyB?: BodyModel, t = 0) {
    this.L = bodyB ? body.L + (bodyB.L - body.L) * t : body.L;
    for (let i = 0; i < this.N; i++) {
      const s = this.sAt(i);
      const m = (sb: BodyModel) => (s >= 0 && s <= 1 ? sb.height(s) * sb.width(s) : 0);
      this.mass[i] = bodyB ? m(body) * (1 - t) + m(bodyB) * t : m(body);
    }
  }

  compute(p: WaveParams, dt: number) {
    const { N } = this;
    const ds = (this.sMax - this.sMin) / (N - 1);
    const L = this.L;
    const [a0, a1, a2] = p.amp;
    const k = (Math.PI * 2) / Math.max(0.05, p.wavelength);
    const ph = p.phase * Math.PI * 2;
    // 横向位移 h(s) 的导数 → 局部角度
    const thw = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const s = this.sAt(i);
      const sc = Math.min(Math.max(s, 0), 1);
      const A = a0 + a1 * sc + a2 * sc * sc;
      const dA = s < 0 || s > 1 ? 0 : a1 + 2 * a2 * sc;
      let dh = dA * Math.sin(k * sc - ph) + A * k * Math.cos(k * sc - ph);
      if (s > 1) {
        // 尾鳍: 在尾柄末端角度基础上随相位额外摆动 (柔性滞后)
        const e = s - 1;
        const A1 = a0 + a1 + a2;
        dh = (a1 + 2 * a2) * Math.sin(k - ph) + A1 * k * Math.cos(k - ph);
        dh += p.finFlex * e * 6 * A1 * k * Math.cos(k - ph - 0.9);
      }
      thw[i] = Math.atan(dh);
    }
    // 质量加权平均角 → 反冲修正 (头部因此自然摆动)
    let mSum = 0;
    let thSum = 0;
    for (let i = 0; i < N; i++) {
      mSum += this.mass[i];
      thSum += this.mass[i] * thw[i];
    }
    const thMean = mSum > 0 ? thSum / mSum : 0;
    // 额外的 C 形弯曲与转弯 (曲率沿身体积分)
    let thExtra = 0;
    for (let i = 0; i < N; i++) {
      const s = this.sAt(i);
      const bell = Math.exp(-Math.pow((s - p.curlCenter) / 0.28, 2));
      if (i > 0) thExtra += (p.curl * bell * ds) / 0.5 + p.turn * ds * (s > 0 && s < 1 ? 1 : 0);
      this.th[i] = (thw[i] - thMean * p.headYaw) + thExtra;
    }
    // 积分位置
    this.px.set(this.x);
    this.pz.set(this.z);
    let x = (this.sMin - 0.5) * L;
    let z = 0;
    for (let i = 0; i < N; i++) {
      if (i > 0) {
        const tm = (this.th[i] + this.th[i - 1]) * 0.5;
        x += Math.cos(tm) * ds * L;
        z += Math.sin(tm) * ds * L;
      }
      this.x[i] = x;
      this.z[i] = z;
    }
    // 质心归位
    let cx = 0;
    let cz = 0;
    let crx = 0;
    for (let i = 0; i < N; i++) {
      cx += this.mass[i] * this.x[i];
      cz += this.mass[i] * this.z[i];
      crx += this.mass[i] * (this.sAt(i) - 0.5) * L;
    }
    if (mSum > 0) {
      cx /= mSum;
      cz /= mSum;
      crx /= mSum;
    }
    for (let i = 0; i < N; i++) {
      this.x[i] += crx - cx;
      this.z[i] -= cz;
    }
    if (dt > 0) {
      for (let i = 0; i < N; i++) {
        this.vx[i] = (this.x[i] - this.px[i]) / dt;
        this.vz[i] = (this.z[i] - this.pz[i]) / dt;
      }
    }
  }

  write(tex: THREE.DataTexture) {
    const d = tex.image.data as Float32Array;
    for (let i = 0; i < this.N; i++) {
      d[i * 4] = this.x[i];
      d[i * 4 + 1] = this.z[i];
      d[i * 4 + 2] = this.th[i];
      d[i * 4 + 3] = 0;
    }
    tex.needsUpdate = true;
  }

  sample(s: number) {
    const f = Math.min(Math.max((s - this.sMin) / (this.sMax - this.sMin), 0), 1) * (this.N - 1);
    const i0 = Math.floor(f);
    const i1 = Math.min(i0 + 1, this.N - 1);
    const t = f - i0;
    return {
      x: this.x[i0] + (this.x[i1] - this.x[i0]) * t,
      z: this.z[i0] + (this.z[i1] - this.z[i0]) * t,
      th: this.th[i0] + (this.th[i1] - this.th[i0]) * t,
      vx: this.vx[i0] + (this.vx[i1] - this.vx[i0]) * t,
      vz: this.vz[i0] + (this.vz[i1] - this.vz[i0]) * t,
    };
  }

  /** CPU 版弯曲变形 (与着色器一致): 静息点 → 鱼体空间. */
  deform(p: THREE.Vector3, out = new THREE.Vector3()) {
    const L = this.L;
    const s = p.x / L + 0.5;
    const sp = this.sample(s);
    const scl = Math.min(Math.max(s, this.sMin), this.sMax);
    const extra = (s - scl) * L;
    const ct = Math.cos(sp.th);
    const st = Math.sin(sp.th);
    return out.set(sp.x + ct * extra - st * p.z, p.y, sp.z + st * extra + ct * p.z);
  }
}
