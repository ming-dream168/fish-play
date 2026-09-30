/**
 * 场景风味 (flavour) 与深度 -> 环境层混音目标 / 随机事件频率. 纯函数, 不碰节点图.
 *
 * 环境由一组常驻层构成 (bed 布朗噪声底 / wash 中频水声 / drone 低频泛音 / room 实验室房间声 /
 * glass 玻璃共振 / rush 水流 / pump 泵机), 各风味只是这些层的一组增益 + 事件频率倍率,
 * 切换风味 = 把这些目标值用 setTargetAtTime 缓动过去 (交叉淡化), 节点图本身不变.
 */

import { clamp01, dbToLin, logLerp } from './dsp';

export type SceneFlavor = 'living' | 'anatomy' | 'cleared' | 'xray' | 'flow' | 'abyss';

export const FLAVORS: readonly SceneFlavor[] = ['living', 'anatomy', 'cleared', 'xray', 'flow', 'abyss'];

/** 每秒平均触发次数 */
export interface Rates {
  shrimp: number;
  bubble: number;
  creak: number;
  whale: number;
  tone: number;
  ping: number;
}

interface FlavorDef {
  bed: number;
  wash: number;
  drone: number;
  room: number;
  glass: number;
  rush: number;
  pump: number;
  /** 深度对水体层的影响程度 0..1 (实验室类风味基本不受深度影响) */
  aff: number;
  /** 该风味的最小等效深度 (m), 深海风味即使宿主没传深度也够暗 */
  floorM: number;
  /** 整体微调 (dB) */
  trimDb: number;
  /** 事件频率倍率 */
  ev: Rates;
}

const zeroEv: Rates = { shrimp: 0, bubble: 0, creak: 0, whale: 0, tone: 0, ping: 0 };

export const FLAVOR_DEFS: Record<SceneFlavor, FlavorDef> = {
  living: {
    bed: 0.2, wash: 0.09, drone: 0.03, room: 0, glass: 0, rush: 0, pump: 0,
    aff: 1, floorM: 0, trimDb: 0,
    ev: { ...zeroEv, shrimp: 1, bubble: 1, creak: 1, whale: 1 },
  },
  anatomy: {
    bed: 0, wash: 0, drone: 0, room: 0.11, glass: 0.35, rush: 0, pump: 0,
    aff: 0, floorM: 0, trimDb: 0,
    ev: { ...zeroEv, ping: 1 },
  },
  cleared: {
    bed: 0, wash: 0, drone: 0, room: 0.08, glass: 0.5, rush: 0, pump: 0,
    aff: 0, floorM: 0, trimDb: 0,
    ev: { ...zeroEv, ping: 1.5 },
  },
  xray: {
    bed: 0, wash: 0, drone: 0, room: 0.07, glass: 0.15, rush: 0, pump: 0,
    aff: 0, floorM: 0, trimDb: 0,
    ev: { ...zeroEv, ping: 0.3 },
  },
  flow: {
    bed: 0.08, wash: 0.05, drone: 0.012, room: 0, glass: 0, rush: 0.28, pump: 0.012,
    aff: 0.15, floorM: 0, trimDb: 0,
    ev: { ...zeroEv, bubble: 1.6 },
  },
  abyss: {
    bed: 0.11, wash: 0.02, drone: 0.03, room: 0, glass: 0, rush: 0, pump: 0,
    aff: 1, floorM: 2500, trimDb: 0,
    ev: { ...zeroEv, creak: 0.7, whale: 0.8, tone: 1 },
  },
};

export interface Mix {
  ambLp: number;
  sfxLp: number;
  ambGain: number;
  bedGain: number;
  bedLp: number;
  washGain: number;
  washLp: number;
  droneGain: number;
  droneRoot: number;
  roomGain: number;
  roomLp: number;
  glassGain: number;
  rushGain: number;
  rushFreq: number;
  pumpGain: number;
}

/** 深度 0..8000 m -> 0..1: 光照带很快变暗, 之后缓慢趋近 */
export function depthK(depthM: number, flavor: SceneFlavor): number {
  const F = FLAVOR_DEFS[flavor];
  const d = Math.max(depthM, F.floorM);
  return (1 - Math.exp(-d / 1500)) * F.aff;
}

export function computeMix(flavor: SceneFlavor, depthM: number, swim: number): Mix {
  const F = FLAVOR_DEFS[flavor];
  const dk = depthK(depthM, flavor);
  const s = clamp01(swim);
  const swimRush = 0.17 * Math.pow(s, 1.4);
  const rushGain = F.rush + swimRush;
  const rushI = clamp01(Math.max(s, F.rush / 0.25));
  return {
    ambLp: logLerp(9500, 900, dk),
    sfxLp: logLerp(16000, 4200, dk),
    ambGain: dbToLin(F.trimDb) * (1 - 0.25 * dk),
    bedGain: F.bed,
    bedLp: logLerp(280, 85, dk),
    washGain: F.wash * (1 - 0.6 * dk),
    washLp: logLerp(1500, 420, dk),
    droneGain: F.drone * (1 + 0.5 * dk),
    droneRoot: 55 * Math.pow(2, -0.55 * dk),
    roomGain: F.room,
    roomLp: 2200,
    glassGain: F.glass,
    rushGain,
    rushFreq: logLerp(420, 2400, rushI),
    pumpGain: F.pump,
  };
}

export function computeRates(flavor: SceneFlavor, depthM: number): Rates {
  const F = FLAVOR_DEFS[flavor];
  const dk = depthK(depthM, flavor);
  // 枪虾只在浅水: 180 m 以下几乎没有
  const shallow = Math.pow(clamp01(1 - depthM / 180), 1.5);
  return {
    shrimp: F.ev.shrimp * 9 * shallow,
    bubble: (F.ev.bubble / 24) * (1 - 0.85 * dk),
    creak: (F.ev.creak / 40) * (1 - 0.45 * dk),
    whale: F.ev.whale / 80,
    tone: F.ev.tone / 16,
    ping: F.ev.ping / 14,
  };
}
