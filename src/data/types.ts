// 全站共享的数据类型. 物种几何参数在 core/species 里, 这里只放图鉴文案与元数据.

// 图鉴里的 10 种中国水域鱼类.
export type SpeciesId =
  | 'whaleshark'
  | 'sturgeon'
  | 'carp'
  | 'chum'
  | 'ricefield'
  | 'bluefin'
  | 'hairtail'
  | 'largeyellow'
  | 'goosefish'
  | 'puffer';

// 标本编号顺序 (按系统发育)
export const SPECIES_ORDER: SpeciesId[] = ['whaleshark', 'sturgeon', 'carp', 'chum', 'bluefin', 'hairtail', 'ricefield', 'largeyellow', 'goosefish', 'puffer'];

export type IucnStatus = 'LC' | 'NT' | 'VU' | 'EN' | 'CR' | 'DD' | 'NE';

export interface SpeciesInfo {
  id: SpeciesId;
  zh: string; // 中文正名
  zhAlt?: string[]; // 常见别名
  latin: string; // 学名 (双名法)
  authority: string; // 命名人与年份, 例如 (Walbaum, 1792)
  en: string; // 英文俗名
  taxonomy: {
    class: string; // 例: 辐鳍鱼纲 Actinopterygii
    order: string; // 例: 鲑形目 Salmoniformes
    family: string; // 例: 鲑科 Salmonidae
  };
  size: {
    maxLengthCm: number;
    commonLengthCm?: number;
    maxWeightKg?: number;
    lengthType: 'TL' | 'FL' | 'SL'; // 全长 / 叉长 / 标准长
  };
  depth: { minM: number; maxM: number; typical?: string };
  habitat: string; // 一句话
  distribution: string; // 一句话
  iucn: IucnStatus;
  iucnYear?: number;
  lifespan?: string; // 例: 4–5 年
  meristics: {
    // 可数性状, 用鱼类学惯用写法 (罗马数字 = 硬棘, 阿拉伯数字 = 软条)
    dorsal?: string;
    anal?: string;
    pectoral?: string;
    pelvic?: string;
    caudal?: string;
    vertebrae?: string;
    lateralLine?: string;
    gillRakers?: string;
  };
  swimming: {
    mode: string; // 英文术语, 例: subcarangiform
    zh: string; // 中文, 例: 亚鲹科式
    note: string; // 一句话说明这种游法
  };
  summary: string; // 60–100 字概述
  highlights: { title: string; body: string }[]; // 3 条, 每条 40–80 字
  sources: string[]; // 核实过的来源 URL
}

export type AnatomySystem =
  | 'integument' // 皮肤与鳞
  | 'fin' // 鳍
  | 'muscle' // 肌肉
  | 'skeleton' // 骨骼
  | 'nervous' // 神经
  | 'sensory' // 感觉
  | 'respiratory' // 呼吸
  | 'circulatory' // 循环
  | 'digestive' // 消化
  | 'excretory' // 排泄与渗透调节
  | 'reproductive' // 生殖
  | 'buoyancy' // 浮力
  | 'special'; // 物种特化结构

// 结构 ID 与 3D 几何部件一一对应, 顺序无意义.
export type StructureId =
  // integument
  | 'skin'
  | 'scales'
  | 'lateralLine'
  // fins
  | 'dorsalFin'
  | 'secondDorsalFin'
  | 'adiposeFin'
  | 'analFin'
  | 'caudalFin'
  | 'pectoralFin'
  | 'pelvicFin'
  | 'finlets'
  // muscle
  | 'whiteMuscle'
  | 'redMuscle'
  | 'sonicMuscle'
  | 'scutes'
  | 'barbels'
  | 'dermalFlaps'
  | 'beak'
  | 'filterPads'
  | 'weberianApparatus'
  | 'pharyngealTeeth'
  // skeleton
  | 'neurocranium'
  | 'jaws'
  | 'teeth'
  | 'opercularSeries'
  | 'gillArches'
  | 'branchiostegals'
  | 'vertebrae'
  | 'notochord'
  | 'ribs'
  | 'intermuscularBones'
  | 'neuralSpines'
  | 'haemalSpines'
  | 'pterygiophores'
  | 'finRays'
  | 'pectoralGirdle'
  | 'pelvicGirdle'
  | 'caudalSkeleton'
  // nervous & sensory
  | 'brain'
  | 'spinalCord'
  | 'eye'
  | 'nares'
  | 'otoliths'
  | 'ampullae'
  | 'rostralOrgan'
  // respiratory
  | 'gills'
  | 'operculum'
  // circulatory
  | 'heart'
  | 'bulbus'
  | 'ventralAorta'
  | 'dorsalAorta'
  | 'veins'
  | 'rete'
  | 'spleen'
  // digestive
  | 'esophagus'
  | 'stomach'
  | 'pyloricCaeca'
  | 'intestine'
  | 'spiralValve'
  | 'liver'
  | 'gallBladder'
  // excretory
  | 'kidney'
  | 'urinaryBladder'
  | 'rectalGland'
  // reproductive
  | 'gonad'
  | 'parasiticMale'
  // buoyancy
  | 'swimBladder'
  | 'fatLung'
  // special
  | 'illicium'
  | 'esca'
  | 'spines'
  | 'clavus'
  | 'lobedFinSkeleton'
  | 'kype';

export interface StructureInfo {
  id: StructureId;
  zh: string; // 中文名
  en: string; // 英文名
  latin?: string; // 解剖学拉丁术语 (如有)
  system: AnatomySystem;
  body: string; // 60–120 字, 这是什么, 在哪, 干什么
  speciesNotes?: Partial<Record<SpeciesId, string>>; // 该物种的特殊之处, 每条 20–60 字
}
