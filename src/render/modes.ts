// 观察模式: 活体 / 解剖 / 透明染色 / X 光 / 流场. 负责材质切换, 图层开关与过渡动画.

import * as THREE from 'three';
import type { Fish, Layer, Part } from '../core/fish';
import { makeClearedBodyMaterial, makeGhostMaterial, makeStainMaterial } from '../core/materials';
import type { Environment } from './environment';
import { lerp } from '../core/math';

export type Mode = 'living' | 'anatomy' | 'cleared' | 'xray' | 'flow';
export type AnatomyView = 'ghost' | 'dissect';
export type LayerKey = 'skin' | 'muscle' | 'skeleton' | 'organs' | 'vessels' | 'nerves';

interface Tween {
  get: () => number;
  set: (v: number) => void;
  from: number;
  to: number;
  t: number;
  dur: number;
  delay: number;
  done?: () => void;
  ease: (x: number) => number;
}

const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

export class ModeController {
  mode: Mode = 'living';
  view: AnatomyView = 'ghost';
  layers: Record<LayerKey, boolean> = { skin: true, muscle: false, skeleton: true, organs: true, vessels: true, nerves: true };
  private tweens: Tween[] = [];
  studio = 0;
  cutaway = true;
  onChange?: () => void;

  constructor(
    private fish: Fish,
    private env: Environment,
  ) {
    this.apply(true);
  }

  tween(get: () => number, set: (v: number) => void, to: number, dur: number, delay = 0, done?: () => void) {
    this.tweens = this.tweens.filter((t) => t.set !== set);
    this.tweens.push({ get, set, from: get(), to, t: 0, dur, delay, done, ease: easeInOut });
  }

  private tweenPart(p: Part, to: number, dur: number, delay = 0, done?: () => void) {
    const u = p.local.uDissolve;
    // 同一个 uniform 对象可能被多个部件共享 (鳍与鳍条), 以部件 key 区分
    this.tweens = this.tweens.filter((t) => (t as Tween & { key?: string }).key !== p.key);
    const tw: Tween & { key?: string } = { get: () => u.value, set: (v) => (u.value = v), from: u.value, to, t: 0, dur, delay, done, ease: easeInOut };
    tw.key = p.key;
    this.tweens.push(tw);
  }

  /** 图层 → 部件是否属于该图层. */
  private layerOn(layer: Layer): boolean {
    switch (layer) {
      case 'skin':
      case 'fins':
        return this.layers.skin;
      case 'eyes':
        return true;
      case 'muscle':
        return this.layers.muscle;
      case 'cavity':
        return this.layers.muscle || this.view === 'dissect';
      case 'skeleton':
        return this.layers.skeleton;
      case 'organs':
        return this.layers.organs;
      case 'vessels':
        return this.layers.vessels;
      case 'nerves':
        return this.layers.nerves;
    }
  }

  /** 该部件在当前模式下应使用的材质, null = 隐藏. */
  materialFor(p: Part): THREE.Material | null {
    const m = this.mode;
    const f = this.fish;
    const outer = p.layer === 'skin' || p.layer === 'fins';
    if (m === 'living' || m === 'flow') {
      // 滤食垫藏在咽腔里, 活体张口时从嘴里看得见
      if (outer || p.layer === 'eyes' || p.key === 'filterPads') return p.mats.living ?? null;
      return null;
    }
    if (m === 'anatomy') {
      // 牙, 棘刺, 钓竿按骨骼层显示原貌; 眼与饵球始终可见
      const always = p.layer === 'eyes' || p.key === 'esca';
      if (always || p.key === 'teeth' || p.key === 'illicium') return this.layerOn('skeleton') || always ? p.mats.living : null;
      if (outer) {
        if (!this.layers.skin) return null;
        if (this.view === 'dissect') return p.mats.living ?? null;
        if (!p.mats.ghost) {
          const fin = p.layer === 'fins' || p.key.startsWith('lobe');
          p.mats.ghost = makeGhostMaterial(f.shared, p.flags, p.local, fin ? '#86c4e8' : '#a9dcff', fin ? 0.55 : 1);
        }
        return p.mats.ghost;
      }
      if (!this.layerOn(p.layer)) return null;
      return p.mats.anatomy ?? null;
    }
    if (m === 'cleared') {
      if (outer && p.key !== 'teeth' && p.cs !== 'bone') {
        if (p.key.startsWith('finrays')) return null;
        if (!p.mats.cleared) p.mats.cleared = makeClearedBodyMaterial(f.shared, p.flags, p.local);
        return p.mats.cleared;
      }
      if (p.layer === 'eyes') {
        if (!p.mats.stainPig) p.mats.stainPig = makeStainMaterial(f.shared, p.flags, p.local, 'pigment');
        return p.mats.stainPig;
      }
      if (p.cs === 'bone' || p.key === 'teeth') {
        if (!p.mats.stain) {
          p.mats.stain = makeStainMaterial(f.shared, p.flags, p.local, 'bone', p.key === 'neurocranium' || p.key === 'opercular');
          this.stainRules();
        }
        return p.mats.stain;
      }
      return null;
    }
    return null; // X 光由单独的渲染器处理
  }

  /** 透明染色时每个骨骼部件的软骨比例 (阿利新蓝). */
  stainRules() {
    const f = this.fish;
    const b = f.bodyA;
    const L = b.L;
    const cart = b.spec.skeleton.cartilage;
    for (const p of f.parts) {
      const u = p.local.uCartRule as { value: THREE.Vector4 } | undefined;
      if (!u) continue;
      let w = 0;
      let front = 0;
      let x0 = -100;
      let x1 = -99;
      switch (p.key) {
        case 'neurocranium':
          front = 0.95;
          x0 = (0.02 - 0.5) * L;
          x1 = (b.spec.eye.s + 0.02 - 0.5) * L;
          break;
        case 'gillArches':
          w = 0.7;
          break;
        case 'pterygiophores':
          w = 0.3;
          break;
        case 'pelvicGirdle':
          w = 0.55;
          break;
        case 'caudalSkeleton':
          w = 0.25;
          break;
        case 'lobedSkeleton':
          w = 0.35;
          break;
      }
      // 软骨鱼: 除钙化的椎体外全是软骨. 鲟的骨板, 鳃盖这些膜骨仍是硬骨, 染成红色
      const dermal = p.key === 'scutes' || p.key === 'spines' || p.key === 'opercular' || p.key === 'branchiostegals';
      if (cart > 0 && p.key !== 'vertebrae' && p.key !== 'teeth' && !dermal) w = Math.max(w, cart);
      // 鲟的鳍条是骨质鳞质鳍条, 染红; 鲨的角质鳍条 (弹性硬蛋白纤维) 不含骨, 不会被茜素红染色
      if (p.key.startsWith('finrays') && cart > 0.5) w = cart > 0.9 ? 0.85 : 0.2;
      u.value.set(x0, x1, front, w);
    }
  }

  /** 按当前状态设置所有部件. animate: 是否用溶解动画过渡. */
  apply(instant = false) {
    const f = this.fish;
    this.fish.shared.uWindowOn.value = this.mode === 'anatomy' && this.view === 'dissect' ? this.fish.shared.uWindowOn.value : 0;
    let stagger = 0;
    if (this.mode === 'xray') {
      // X 光走独立渲染器, 这里只保证溶解值归零 (X 光材质共享同一组 uniform)
      this.tweens = this.tweens.filter((t) => !(t as Tween & { key?: string }).key);
      for (const p of f.parts) p.local.uDissolve.value = 0;
    }
    for (const p of f.parts) {
      if (this.mode === 'xray') {
        const nx = this.materialFor(p);
        p.mesh.visible = !!nx;
        continue;
      }
      const next = this.materialFor(p);
      const cur = p.mesh.visible ? (p.mesh.material as THREE.Material) : null;
      if (instant) {
        p.mesh.visible = !!next;
        if (next) p.mesh.material = next;
        p.local.uDissolve.value = 0;
        continue;
      }
      if (next === cur) continue;
      const delay = p.layer === 'skeleton' ? 0.15 : p.layer === 'organs' ? 0.35 : p.layer === 'vessels' ? 0.55 : p.layer === 'nerves' ? 0.6 : 0;
      if (cur && !next) {
        // 溶解后隐藏
        this.tweenPart(p, 1, 0.9, 0, () => {
          if (this.materialFor(p) === null || this.mode === 'xray') p.mesh.visible = false;
        });
      } else if (!cur && next) {
        p.mesh.material = next;
        p.mesh.visible = true;
        p.local.uDissolve.value = 1;
        this.tweenPart(p, 0, 1.1, delay + stagger * 0.004);
        stagger++;
      } else if (cur && next) {
        // 换材质: 先溶解再用新材质显现
        this.tweenPart(p, 1, 0.55, 0, () => {
          const n2 = this.materialFor(p);
          if (!n2) {
            p.mesh.visible = false;
            return;
          }
          p.mesh.material = n2;
          this.tweenPart(p, 0, 0.7, 0.05);
        });
      }
    }
    if (this.mode === 'cleared') this.stainRules();
    // 解剖视图: 剖去左半颅骨与左鳃盖, 露出脑与鳃
    for (const p of f.parts) {
      const cut = this.mode === 'anatomy' && this.cutaway && (p.key === 'neurocranium' || p.key === 'opercular' || p.key === 'branchiostegals');
      const u = p.local.uHalfCut;
      this.tween(() => u.value, (x) => (u.value = x), cut ? 1 : 0, instant ? 0.001 : 0.8, cut ? 0.6 : 0);
    }
    // 环境
    const env = this.env;
    // 流场模式用深色水槽背景, 让片光与涡量看得清
    env.setStudio(this.mode !== 'living', this.mode);
    const studioTarget = this.mode === 'living' ? 0 : 1;
    const uS = env.bgMat.uniforms.uStudio;
    this.tween(() => uS.value, (v) => (uS.value = v), studioTarget, instant ? 0.001 : 1.2);
    const stc = env.bgMat.uniforms.uStudioColor.value as THREE.Color;
    const target = new THREE.Color(this.mode === 'cleared' ? '#020304' : this.mode === 'xray' ? '#000000' : this.mode === 'flow' ? '#04080e' : '#0c1219');
    const from = stc.clone();
    let k = 0;
    this.tween(() => k, (v) => {
      k = v;
      stc.copy(from).lerp(target, v);
    }, 1, instant ? 0.001 : 1.0);
    this.onChange?.();
  }

  setMode(m: Mode) {
    if (m === this.mode) return;
    this.mode = m;
    this.apply();
  }

  setView(v: AnatomyView) {
    if (v === this.view) return;
    this.view = v;
    const w = this.fish.shared.uWindowOn;
    if (v === 'dissect') {
      this.layers.skin = true;
      this.layers.muscle = true;
      this.apply();
      w.value = 0;
      this.tween(() => w.value, (x) => (w.value = x), 1, 1.4, 0.4);
    } else {
      this.layers.muscle = false;
      this.tween(() => w.value, (x) => (w.value = x), 0, 0.5, 0, () => this.apply());
    }
    this.onChange?.();
  }

  setLayer(l: LayerKey, on: boolean) {
    this.layers[l] = on;
    this.apply();
  }

  /** 解剖开窗区域随物种更新. */
  updateWindow() {
    const b = this.fish.bodyA;
    const c = b.spec.organs.cavity;
    const L = b.L;
    const w = this.fish.shared.uWindow.value;
    const x0 = (c.s0 + 0.012 - 0.5) * L;
    const x1 = (c.s1 - 0.01 - 0.5) * L;
    const hTop = b.spineH((c.s0 + c.s1) / 2) - 0.08;
    w.set(x0, x1, -0.88, Math.max(-0.3, hTop));
  }

  update(dt: number) {
    const list = this.tweens;
    this.tweens = [];
    const finished: Tween[] = [];
    for (const tw of list) {
      if (tw.delay > 0) {
        tw.delay -= dt;
        this.tweens.push(tw);
        continue;
      }
      if (tw.t === 0) tw.from = tw.get();
      tw.t = Math.min(1, tw.t + dt / Math.max(1e-4, tw.dur));
      tw.set(lerp(tw.from, tw.to, tw.ease(tw.t)));
      if (tw.t < 1) this.tweens.push(tw);
      else finished.push(tw);
    }
    // 回调里可能追加新的过渡
    for (const tw of finished) tw.done?.();
    this.updateWindow();
  }

  get busy() {
    return this.tweens.length > 0;
  }
}
