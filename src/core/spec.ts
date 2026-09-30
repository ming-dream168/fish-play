// 物种几何参数. 所有物种共享同一张身体蓝图 (同源结构), 只是参数不同,
// 所以任意两个物种之间可以逐顶点插值变形.
// 坐标约定: s ∈ [0,1] 从吻端到尾鳍基部; 高度分数 h ∈ [-1,1] (-1 腹缘, +1 背缘);
// 长度单位 L (体长). 渲染空间: x = (s - 0.5)·L·display, 头朝 -x, y 向上, z 为左侧.

import type { Pt } from './math';
import type { SpeciesId } from '../data/types';

export type SwimMode =
  | 'anguilliform'
  | 'subcarangiform'
  | 'carangiform'
  | 'thunniform'
  | 'tetraodontiform'
  | 'lophiiform'
  | 'rajiform'
  | 'sarcopterygian';

export type V3 = [number, number, number];

export interface ProfileSpec {
  top: Pt[]; // 背缘高于体轴 (L)
  bottom: Pt[]; // 腹缘低于体轴 (L, 正数)
  width: Pt[]; // 半宽 (L)
  axis?: Pt[]; // 体轴高度偏移 (L)
  nTop?: number | Pt[]; // 超椭圆指数 (2 = 椭圆)
  nBottom?: number | Pt[];
  snoutRound: number; // 吻端圆头长度 (s)
  tailCap: number; // 尾柄末端圆头长度 (s)
}

export interface MouthSpec {
  corner: number; // 口角 s
  tipH: number; // 吻端口裂高度分数
  cornerH: number; // 口角高度分数
  bow: number; // 口裂中段额外弯曲 (高度分数)
  gape: number; // 静息张口角 (rad)
  pump: number; // 呼吸泵动幅度 (rad)
  jawLen: number; // 下颌关节在口角后方的距离 (s)
  teeth: number; // 每侧每颌牙数
  toothLen: number; // 牙长 (L)
  fang: number; // 犬齿化程度 0..1 (大小交替, 内弯)
  fangFront: number; // >0 时只有颌前端这几颗是大犬齿 (带鱼上颌前端两对), 其余是小牙; 0 = 沿整条颌大小交替
  underbite: number; // 下颌前突 (L): 下颌前端比上颌多伸出的长度 (带鱼)
  toothShape: number; // 0 圆锥, 1 三角扁牙 (鲨)
}

export interface EyeSpec {
  s: number;
  h: number;
  r: number; // 眼球半径 (L)
  protrude: number; // 突出程度 0..1
  iris: string;
  irisMetal: number;
  pupil: number; // 瞳孔相对大小
}

export interface GillSpec {
  // 硬骨鱼鳃盖: 后缘曲线 edge: [h, s] 列表
  edge: Pt[];
  top: number;
  bottom: number;
  flare: number;
  // 软骨鱼鳃裂
  slits: number;
  slitS: [number, number];
  slitH: [number, number];
  arches: [number, number]; // 鳃弓所在 s 范围
  groove: number; // 前鳃盖沟的明显程度 0..1 (黄鳝, 带鱼这类鳃盖不明显的鱼设 0)
}

export interface FinSpec {
  id: 'dorsalFin' | 'secondDorsalFin' | 'adiposeFin' | 'analFin' | 'caudalFin' | 'pectoralFin' | 'pelvicFin';
  kind: 'dorsal' | 'anal' | 'caudal' | 'paired';
  // 奇鳍 (背, 臀): 基底 s 范围. 偶鳍: s0 = 基底位置, s1 忽略. 尾鳍: s0 = 基底位置
  s0: number;
  s1: number;
  rays: number; // 鳍条数 (0 = 脂鳍, 无鳍条)
  spines: number; // 前部硬棘数
  len: Pt[]; // 鳍条长 (L) 随 u ∈ [0,1]
  angle: number | Pt[]; // 奇鳍: 自垂直方向向后倾角; 尾鳍: 自水平方向的仰角 (负 = 向下)
  notch: number; // 硬棘间鳍膜缺刻 0..1
  // 尾鳍基底半高 (L) 与中心高度分数
  baseH: number;
  baseCenter: number;
  // 偶鳍
  h: number; // 基底高度分数
  a: V3; // 前缘鳍条方向 (后, 上, 外)
  b: V3; // 后缘鳍条方向
  baseLen: number; // 基底长 (L)
  baseDir: V3; // 基底线方向 (后, 上, 外)
  hinge: V3; // 拍动轴 (后, 上, 外)
  flap: number; // 拍动幅度 (rad)
  flapPhase: number;
  // 肉鳍 (腔棘鱼)
  lobe: number; // 肉质鳍柄长度 (L), 0 = 无
  lobeR: number; // 鳍柄半径 (L)
  thick: number; // 鳍膜厚度 (L), 脂鳍较厚
  gloss: number; // 鳍面黏液光泽 (clearcoat), 皮肤包着的厚鳍 (鲨, 鮟鱇) 设 0 免得映天光发白
  flutter: number; // 鳍膜颤动幅度 (L)
  waves: number; // >0 时鳍膜沿鳍基从前往后传这么多个波 (带鱼的长背鳍); 0 = 普通颤动
  opacity: number;
  color: string;
  edgeColor: string;
  present: number; // 0..1, 0 = 该物种没有这片鳍 (缩为零)
}

export interface SkinSpec {
  dorsal: string;
  flank: string;
  ventral: string;
  dorsalEdge: number; // 背色向侧色过渡的高度分数
  ventralEdge: number; // 侧色向腹色过渡的高度分数
  softness: number;
  head: string; // 头部叠色
  headMix: number; // 头部叠色强度
  silver: number; // 鸟嘌呤银色反光 0..1
  iridescence: number;
  roughness: number;
  scaleSize: number; // 鳞片尺寸 (L), 0 = 无鳞
  scaleDepth: number;
  spotColor: string;
  spotSize: number; // (L)
  spotDensity: number; // 0..1
  spotH: [number, number];
  spotS: [number, number];
  spotShape: number; // 0 圆斑, 1 X 形, 2 不规则云斑
  barColor: string;
  bars: number; // 横带数量
  barWidth: number;
  barStrength: number;
  barH: [number, number];
  barS: [number, number];
  // 纵纹: 沿体轴的细线 (鲸鲨的浅色纵纹, 与横带交织成棋盘). n 条从 h0 (最上) 到 h1 (最下) 等距, width 线宽 (h 分数)
  stripes: { n: number; h0: number; h1: number; width: number; s0: number; s1: number; color: string; amount: number };
  mottle: number;
  mottleScale: number;
  mottleColor: string;
  lateralLine: number; // 侧线可见度
  lateralLineH: Pt[]; // 侧线高度分数随 s
  denticles: number; // 盾鳞细纹 (鲨)
  glow: string; // 自发光颜色 (发光器)
  glowStrength: number;
  interior: string; // 皮肤内侧颜色
  mouthColor: string;
  clearcoat: number; // 黏液层光泽
  sheen: number; // 天鹅绒质感 (深海鮟鱇)
  // 单个大斑块 (如河鲀胸鳍后方镶白边的黑斑): 中心 s, 高度分数 h, 半径 r (L), 镶边颜色与强度 ringW, amount 0 = 无
  blotch: { s: number; h: number; r: number; color: string; ring: string; ringW: number; amount: number };
  blotch2: { s: number; h: number; r: number; color: string; ring: string; ringW: number; amount: number }; // 第二块大斑 (河鲀背鳍基部)
}

export interface SkeletonSpec {
  vertebrae: number;
  precaudal: number; // 腹椎数 (带肋)
  centrumR: number; // 椎体半径 (L)
  spineLine: Pt[]; // 脊柱高度分数随 s
  spineStart: number; // 第一个椎体的 s
  neuralLen: number; // 髓棘伸向背缘的比例
  haemalLen: number;
  spineLean: number; // 棘向后倾角 (rad)
  ribs: number; // 肋骨伸展比例 (0 = 无)
  ribCount: number;
  intermuscular: number; // 肌间骨显著度 0..1
  cartilage: number; // 0 = 硬骨, 1 = 软骨 (透明染色时蓝色)
  notochord: number; // 0 = 有椎体, 1 = 终生脊索
  skullScale: number;
  rostrum: number; // 软骨鱼吻软骨
  caudalUp: number; // 脊柱末端上翘 (歪尾)
  caudalExt: number; // 脊柱伸入尾鳍的长度 (s)
  opercle: number; // 鳃盖骨大小 0..1
  branchiostegals: number;
  jawBone: number; // 颌骨粗细倍率
  beak: number; // 喙状愈合齿 0..1
  intracranial: number; // 颅内关节 (腔棘鱼)
  otolith: number; // 矢耳石大小倍率 (石首鱼科的耳石特别大)
  weberian: number; // 韦伯氏器 (鲤形目等骨鳔类: 连接鳔与内耳的小骨链) 0..1
  pharyngeal: number; // 咽齿 (鲤科: 第五鳃弓特化的下咽骨与臼齿状咽齿) 0..1
}

export interface OrganSpec {
  // 以体腔坐标给出: s, v ∈ [-1,1] 体腔内高度, u 侧向
  cavity: { s0: number; s1: number; top: number; bottom: number; width: number };
  heart: { s: number; h: number; size: number };
  liver: { s0: number; s1: number; size: number; lobes: number; color: string };
  stomach: { s0: number; s1: number; size: number; shape: number }; // shape: 0 J 形, 1 盲囊 Y 形
  caeca: { count: number; len: number };
  intestine: { loops: number; size: number; end: number; spiral: number };
  // kind: 0 无, 1 喉鳔, 2 闭鳔, 3 充脂, 4 石首鱼式 (前圆后尖, 两侧有树枝状侧枝), 5 前后两室 (鲤科); branches: 侧枝对数
  swimBladder: { s0: number; s1: number; size: number; kind: number; v: number; branches: number };
  kidney: { size: number };
  gonad: { s0: number; s1: number; size: number; color: string; eggs: number };
  spleen: { size: number };
  brain: { s: number; size: number; tectum: number };
  gills: { size: number };
  rectalGland: number;
  rete: number; // 奇网 (金枪鱼, 鲨)
  sonicMuscle: number; // 鳔两侧的发声肌 (石首鱼), 0 = 无
  redMuscle: number; // 红肌比例, 0.05..0.3
  redMuscleDepth: number; // 0 = 表层 (多数鱼), 1 = 深层靠脊柱 (金枪鱼)
  muscleColor: string; // 白肌颜色 (红鲑的虾青素橙红, 金枪鱼的深红)
  vent: number; // 肛门 s
}

export interface SwimSpec {
  mode: SwimMode;
  freq: number; // 尾拍频率 Hz (展示用, 比真实略慢)
  wavelength: number; // 体波波长 (L)
  amp: [number, number, number]; // A(s) = a0 + a1 s + a2 s² (L)
  headYaw: number;
  speed: number; // 巡游速度 (L/s)
  medianFlap: number; // 背鳍臀鳍左右拍动幅度 (rad) (翻车鲀)
  pectoralRow: number; // 胸鳍划水幅度倍率
  gait: number; // 腔棘鱼对角步态 0..1
}

export interface ExtrasSpec {
  finlets: { dorsal: number; ventral: number; s0: number; s1: number; size: number; color: string };
  keel: number; // 尾柄侧脊: 最下面一条纵棱在尾柄处加高的倍数 (需要 ridges.n > 0)
  // 体侧纵棱 (鲸鲨每侧 3 条): n 条从 h0 (最上) 到 h1 (最下) 等距, height 棱高 (L), width 棱宽 (h 分数), s0..s1 起止
  ridges: { n: number; h0: number; h1: number; height: number; width: number; s0: number; s1: number };
  spines: { count: number; len: number; erect: number };
  // lum: 饵球发光 0..1 (浅海鮟鱇的饵球不发光); shape: 0 球形饵球, 1 叶状双片皮瓣; color 钓竿颜色, escaColor 饵的底色
  lure: { len: number; s: number; tilt: number; esca: number; glow: string; lum: number; shape: number; color: string; escaColor: string };
  kype: number; // 雄性钩吻
  hump: number;
  // 须: 每侧最多两根. s 位置, th 截面角 (π/2 背中线, 0 体侧, -π/2 腹中线), len 长 (L), dir 伸出方向 (后, 上, 外), droop 下垂
  barbels: { items: { s: number; th: number; len: number; dir: V3; droop: number }[]; thick: number; color: string };
  // 骨板 (鲟): 背行 1 列, 侧行与腹侧行左右各 1 列; size 骨板长 (L)
  scutes: { dorsal: number; lateral: number; ventral: number; size: number; s0: number; color: string };
  // 皮须 (鮟鱇): jaw 每侧下颌边缘的皮瓣数, body 每侧头体两侧的皮瓣数 (从口角后到 s1, 高度 h), len 皮瓣长 (L)
  fringe: { jaw: number; body: number; s1: number; h: number; len: number; color: string };
  filterPads: number; // 滤食垫 (鲸鲨) 0..1: 鳃弓内侧的海绵状筛板
  parasiticMale: number;
  ampullae: number;
  rostralOrgan: number;
  clavus: number;
  // 鳔发声: 每声由一串脉冲组成. f0 主频 (Hz), rate 脉冲率 (次/秒), pulses 每声脉冲数, calls 一轮叫几声
  drum: { f0: number; rate: number; pulses: number; calls: number };
}

export interface SpeciesSpec {
  id: SpeciesId | string;
  display: number; // 渲染体长 (世界单位)
  profile: ProfileSpec;
  mouth: MouthSpec;
  eye: EyeSpec;
  gill: GillSpec;
  fins: FinSpec[];
  skin: SkinSpec;
  skeleton: SkeletonSpec;
  organs: OrganSpec;
  swim: SwimSpec;
  extras: ExtrasSpec;
  physiology: { heartRate: number; breathRate: number; tempC: number; depthM: number; endotherm: number };
  lighting: { abyss: number; warm: number }; // abyss: 0 = 浅海, 1 = 深海漆黑; warm: 近岸浑水里偏暖的光 (0..1)
}

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends (infer U)[]
    ? U extends object
      ? T[K]
      : T[K]
    : T[K] extends object
      ? DeepPartial<T[K]>
      : T[K];
};
export type SpeciesOverrides = DeepPartial<Omit<SpeciesSpec, 'fins'>> & { fins?: Partial<FinSpec>[] };

export const FIN_ORDER: FinSpec['id'][] = [
  'dorsalFin',
  'secondDorsalFin',
  'adiposeFin',
  'analFin',
  'caudalFin',
  'pectoralFin',
  'pelvicFin',
];

export function defaultFin(id: FinSpec['id']): FinSpec {
  const base: FinSpec = {
    id,
    kind: 'dorsal',
    s0: 0.4,
    s1: 0.55,
    rays: 12,
    spines: 0,
    len: [
      [0, 0.1],
      [1, 0.04],
    ],
    angle: 0.5,
    notch: 0,
    baseH: 0.05,
    baseCenter: 0,
    h: -0.3,
    a: [0.6, 0.2, 0.5],
    b: [0.9, -0.4, 0.3],
    baseLen: 0.03,
    baseDir: [0.25, -1, 0],
    hinge: [0.2, -1, 0],
    flap: 0.25,
    flapPhase: 0,
    lobe: 0,
    lobeR: 0.02,
    thick: 0.0015,
    gloss: 0.3,
    flutter: 0.004,
    waves: 0,
    opacity: 0.82,
    color: '#8c9aa3',
    edgeColor: '#3a4650',
    present: 1,
  };
  switch (id) {
    case 'secondDorsalFin':
      return { ...base, present: 0 };
    case 'adiposeFin':
      return { ...base, s0: 0.8, s1: 0.86, rays: 0, len: [[0, 0.02], [0.6, 0.035], [1, 0.02]], angle: 1.1, thick: 0.006, present: 0 };
    case 'analFin':
      return { ...base, kind: 'anal', s0: 0.68, s1: 0.8, rays: 11, len: [[0, 0.09], [1, 0.03]], angle: 0.5 };
    case 'caudalFin':
      return {
        ...base,
        kind: 'caudal',
        s0: 0.985,
        rays: 19,
        len: [
          [0, 0.2],
          [0.25, 0.14],
          [0.5, 0.1],
          [0.75, 0.14],
          [1, 0.2],
        ],
        angle: [
          [0, -0.55],
          [0.5, 0],
          [1, 0.55],
        ],
        baseH: 0.045,
        baseCenter: 0,
      };
    case 'pectoralFin':
      return {
        ...base,
        kind: 'paired',
        s0: 0.235,
        h: -0.45,
        rays: 14,
        len: [
          [0, 0.1],
          [0.3, 0.12],
          [1, 0.05],
        ],
        a: [0.55, 0.25, 0.55],
        b: [0.85, -0.45, 0.25],
        baseLen: 0.025,
        baseDir: [0.25, -1, 0],
        hinge: [0.15, -1, 0.1],
        flap: 0.35,
      };
    case 'pelvicFin':
      return {
        ...base,
        kind: 'paired',
        s0: 0.5,
        h: -0.92,
        rays: 9,
        len: [
          [0, 0.085],
          [1, 0.04],
        ],
        a: [0.75, -0.35, 0.45],
        b: [0.95, -0.15, 0.1],
        baseLen: 0.02,
        baseDir: [1, 0, -0.2],
        hinge: [1, 0, 0],
        flap: 0.12,
      };
    default:
      return { ...base, kind: 'dorsal' };
  }
}

/** 通用硬骨鱼模板 (大致按鲑形目比例), 各物种在此基础上覆盖. */
export function baseTeleost(): SpeciesSpec {
  return {
    id: 'base',
    display: 4.2,
    profile: {
      top: [
        [0, 0.02],
        [0.05, 0.06],
        [0.15, 0.1],
        [0.35, 0.125],
        [0.55, 0.11],
        [0.8, 0.05],
        [0.92, 0.035],
        [1, 0.04],
      ],
      bottom: [
        [0, 0.02],
        [0.05, 0.05],
        [0.2, 0.09],
        [0.4, 0.11],
        [0.6, 0.09],
        [0.8, 0.045],
        [0.92, 0.032],
        [1, 0.038],
      ],
      width: [
        [0, 0.012],
        [0.05, 0.035],
        [0.2, 0.07],
        [0.4, 0.075],
        [0.65, 0.05],
        [0.9, 0.018],
        [1, 0.012],
      ],
      nTop: 2.1,
      nBottom: 2.1,
      snoutRound: 0.025,
      tailCap: 0.012,
    },
    mouth: { corner: 0.07, tipH: -0.1, cornerH: -0.3, bow: -0.05, gape: 0.03, pump: 0.06, jawLen: 0.02, teeth: 14, toothLen: 0.006, fang: 0, fangFront: 0, underbite: 0, toothShape: 0 },
    eye: { s: 0.07, h: 0.22, r: 0.018, protrude: 0.4, iris: '#c9b37a', irisMetal: 0.8, pupil: 0.55 },
    gill: {
      edge: [
        [0.75, 0.17],
        [0.3, 0.205],
        [-0.3, 0.21],
        [-0.85, 0.18],
      ],
      top: 0.75,
      bottom: -0.85,
      flare: 0.006,
      slits: 0,
      slitS: [0.18, 0.24],
      slitH: [-0.5, 0.3],
      arches: [0.12, 0.19],
      groove: 1,
    },
    fins: [
      defaultFin('dorsalFin'),
      defaultFin('secondDorsalFin'),
      defaultFin('adiposeFin'),
      defaultFin('analFin'),
      defaultFin('caudalFin'),
      defaultFin('pectoralFin'),
      defaultFin('pelvicFin'),
    ],
    skin: {
      dorsal: '#2b4a56',
      flank: '#aebfc6',
      ventral: '#eef1ee',
      dorsalEdge: 0.35,
      ventralEdge: -0.35,
      softness: 0.25,
      head: '#2b4a56',
      headMix: 0,
      silver: 0.7,
      iridescence: 0.35,
      roughness: 0.32,
      scaleSize: 0.012,
      scaleDepth: 0.5,
      spotColor: '#161c20',
      spotSize: 0.008,
      spotDensity: 0,
      spotH: [0.1, 1],
      spotS: [0.05, 1],
      spotShape: 0,
      barColor: '#20282c',
      bars: 0,
      barWidth: 0.3,
      barStrength: 0,
      barH: [-0.2, 1],
      barS: [0.2, 0.95],
      stripes: { n: 0, h0: 0.8, h1: 0, width: 0.03, s0: 0.2, s1: 0.9, color: '#e6e3cc', amount: 0 },
      mottle: 0.15,
      mottleScale: 0.05,
      mottleColor: '#1f2f36',
      lateralLine: 0.5,
      lateralLineH: [
        [0, 0.25],
        [0.3, 0.3],
        [1, 0],
      ],
      denticles: 0,
      glow: '#000000',
      glowStrength: 0,
      interior: '#d9a79a',
      mouthColor: '#2a0d10',
      clearcoat: 0.3,
      sheen: 0,
      blotch: { s: 0.3, h: 0.2, r: 0.03, color: '#111111', ring: '#f2f2ea', ringW: 0, amount: 0 },
      blotch2: { s: 0.7, h: 0.8, r: 0.03, color: '#111111', ring: '#f2f2ea', ringW: 0, amount: 0 },
    },
    skeleton: {
      vertebrae: 58,
      precaudal: 34,
      centrumR: 0.0105,
      spineLine: [
        [0.2, 0.25],
        [0.45, 0.22],
        [0.75, 0.05],
        [1, 0],
      ],
      spineStart: 0.2,
      neuralLen: 0.82,
      haemalLen: 0.8,
      spineLean: 0.55,
      ribs: 0.85,
      ribCount: 28,
      intermuscular: 0.7,
      cartilage: 0,
      notochord: 0,
      skullScale: 1,
      rostrum: 0,
      caudalUp: 0.12,
      caudalExt: 0.015,
      opercle: 1,
      branchiostegals: 10,
      jawBone: 1,
      beak: 0,
      intracranial: 0,
      otolith: 1,
      weberian: 0,
      pharyngeal: 0,
    },
    organs: {
      cavity: { s0: 0.235, s1: 0.64, top: 0.9, bottom: 0.82, width: 0.78 },
      heart: { s: 0.2, h: -0.62, size: 1 },
      liver: { s0: 0.24, s1: 0.36, size: 1, lobes: 2, color: '#7b2d26' },
      stomach: { s0: 0.26, s1: 0.42, size: 1, shape: 0 },
      caeca: { count: 40, len: 0.03 },
      intestine: { loops: 1, size: 1, end: 0.64, spiral: 0 },
      swimBladder: { s0: 0.25, s1: 0.62, size: 1, kind: 1, v: 0.55, branches: 0 },
      kidney: { size: 1 },
      gonad: { s0: 0.3, s1: 0.58, size: 1, color: '#e0763a', eggs: 1 },
      spleen: { size: 1 },
      brain: { s: 0.105, size: 1, tectum: 1 },
      gills: { size: 1 },
      rectalGland: 0,
      rete: 0,
      sonicMuscle: 0,
      redMuscle: 0.08,
      redMuscleDepth: 0,
      muscleColor: '#efd9cf',
      vent: 0.645,
    },
    swim: {
      mode: 'subcarangiform',
      freq: 1.6,
      wavelength: 1.0,
      amp: [0.02, -0.08, 0.16],
      headYaw: 1,
      speed: 1.2,
      medianFlap: 0,
      pectoralRow: 1,
      gait: 0,
    },
    extras: {
      finlets: { dorsal: 0, ventral: 0, s0: 0.8, s1: 0.96, size: 0, color: '#d8b43a' },
      keel: 0,
      ridges: { n: 0, h0: 0.7, h1: 0.2, height: 0.003, width: 0.05, s0: 0.2, s1: 0.85 },
      spines: { count: 0, len: 0, erect: 0 },
      lure: { len: 0, s: 0.03, tilt: 0.5, esca: 0, glow: '#6ff5ff', lum: 1, shape: 0, color: '#1b1512', escaColor: '#d9e8e4' },
      kype: 0,
      hump: 0,
      barbels: { items: [], thick: 1, color: '#c9ad86' },
      scutes: { dorsal: 0, lateral: 0, ventral: 0, size: 0.03, s0: 0.2, color: '#d9d0bb' },
      fringe: { jaw: 0, body: 0, s1: 0.5, h: -0.15, len: 0.01, color: '#6b5a44' },
      filterPads: 0,
      parasiticMale: 0,
      ampullae: 0,
      rostralOrgan: 0,
      clavus: 0,
      drum: { f0: 0, rate: 0, pulses: 0, calls: 0 },
    },
    physiology: { heartRate: 60, breathRate: 60, tempC: 10, depthM: 30, endotherm: 0 },
    lighting: { abyss: 0, warm: 0 },
  };
}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function deepMerge<T>(base: T, over: unknown): T {
  if (!isObj(over)) return (over === undefined ? base : (over as T));
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const k of Object.keys(over)) {
    const bv = out[k];
    const ov = over[k];
    if (ov === undefined) continue;
    out[k] = isObj(bv) && isObj(ov) ? deepMerge(bv, ov) : ov;
  }
  return out as T;
}

/** 在通用模板上叠加物种覆盖项. 鳍按 id 合并. */
export function makeSpecies(over: SpeciesOverrides, base: SpeciesSpec = baseTeleost()): SpeciesSpec {
  const { fins, ...rest } = over;
  const spec = deepMerge(base, rest) as SpeciesSpec;
  spec.fins = FIN_ORDER.map((id) => {
    const b = base.fins.find((f) => f.id === id) ?? defaultFin(id);
    const o = fins?.find((f) => f.id === id);
    return o ? ({ ...b, ...o } as FinSpec) : { ...b };
  });
  return spec;
}
