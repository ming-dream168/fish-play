// 全站共享的数据类型. 物种几何参数在 core/species 里, 这里只放图鉴文案与元数据.

// 图鉴里的中国水域鱼类 (及两种底栖甲壳动物), 按栖息水层分组, 见 groups.ts.
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
  | 'puffer'
  // 纯底层
  | 'japeel' // 日本鳗鲡
  | 'loach' // 泥鳅
  | 'paramisgurnus' // 大鳞副泥鳅
  | 'hemibarbus' // 花䱻
  | 'sarcosinensis' // 华鳈
  | 'sarconigri' // 黑鳍鳈
  | 'abbottina' // 棒花鱼
  | 'microphyso' // 小口小鳔鮈
  | 'saurodabryi' // 蛇鮈
  | 'saurodumerili' // 长蛇鮈
  | 'saurogymno' // 光唇蛇鮈
  | 'silurus' // 鲇
  | 'yellowcat' // 黄颡鱼
  | 'pbvachellii' // 瓦氏拟鲿
  | 'pbnitidus' // 光泽拟鲿
  | 'pbtenuis' // 圆尾拟鲿
  | 'pbalbomarg' // 白边拟鲿
  | 'odontobutis' // 河川沙塘鳢
  | 'micropercops' // 小黄黝鱼
  | 'rhinogobius' // 子陵吻鰕虎鱼
  | 'tridentiger' // 双带缟鰕虎
  | 'odontamblyopus' // 拉氏狼牙虾虎
  | 'spinyeel' // 中华刺鳅
  | 'tonguesole' // 窄体舌鳎
  | 'mittencrab' // 中华绒螯蟹 (甲壳动物)
  | 'riverprawn'; // 日本沼虾 (青虾, 甲壳动物)

// 甲壳动物不走鱼体蓝图, 用单独的程序化模型 (core/crustacean)
export const CRUSTACEANS: SpeciesId[] = ['mittencrab', 'riverprawn'];
export const isCrustacean = (id: string) => (CRUSTACEANS as string[]).includes(id);

// 系统发育树 (嵌套数组, 叶子是物种). 索引列表按叶子顺序排列, 树线按这个拓扑画.
export type Clade = SpeciesId | Clade[];
export const leaves = (c: Clade): SpeciesId[] => (Array.isArray(c) ? c.flatMap(leaves) : [c]);

export interface SpeciesGroup {
  id: string;
  zh: string; // 分组名 (栖息水层)
  note: string; // 索引下方的说明
  tree: Clade;
}

export const SPECIES_GROUPS: SpeciesGroup[] = [
  {
    id: 'classic',
    zh: '海洋与江河',
    note: '按系统发育排列: 软骨鱼 → 软骨硬鳞鱼 → 真骨鱼. 左侧树线是它们的亲缘关系.',
    // 软骨鱼 → 鲟 (软骨硬鳞类) → 真骨鱼: 鲤 (骨鳔类), 鲑, 再到鲈形总目: 金枪鱼与带鱼同属鲭形目,
    // 黄鳝 (合鳃鱼目) 与真鲈类 (大黄鱼, 鮟鱇, 河鲀) 更近, 鮟鱇目与鲀形目互为姊妹.
    tree: ['whaleshark', ['sturgeon', ['carp', ['chum', [['bluefin', 'hairtail'], ['ricefield', ['largeyellow', ['goosefish', 'puffer']]]]]]]],
  },
  {
    id: 'benthic',
    zh: '纯底层',
    note: '贴着水底生活的种类, 按系统发育排列: 鳗鲡 → 鲤形目 (鳅, 鮈) → 鲇形目 → 鰕虎类 → 刺鳅与舌鳎; 最后两种是底栖甲壳动物.',
    // 鳗鲡目最早分出; 骨鳔类里鲤形目 (鳅科, 鮈亚科) 与鲇形目 (鲇科, 鲿科) 互为姊妹;
    // 鲈形总目里鰕虎目 (沙塘鳢科, 鰕虎鱼科) 较早分出, 合鳃鱼目 (刺鳅) 与鲽形目 (舌鳎) 同属更晚分化的一支.
    tree: [
      [
        'japeel',
        [
          [
            [
              ['loach', 'paramisgurnus'],
              ['hemibarbus', [['sarcosinensis', 'sarconigri'], ['abbottina', ['microphyso', ['saurodabryi', 'saurodumerili', 'saurogymno']]]]],
            ],
            ['silurus', ['yellowcat', 'pbvachellii', 'pbnitidus', 'pbtenuis', 'pbalbomarg']],
          ],
          [
            [
              ['odontobutis', 'micropercops'],
              ['rhinogobius', 'tridentiger', 'odontamblyopus'],
            ],
            ['spinyeel', 'tonguesole'],
          ],
        ],
      ],
      ['mittencrab', 'riverprawn'],
    ],
  },
];

// 标本编号顺序 (按分组, 组内按系统发育)
export const SPECIES_ORDER: SpeciesId[] = SPECIES_GROUPS.flatMap((g) => leaves(g.tree));
export const groupOf = (id: SpeciesId) => SPECIES_GROUPS.find((g) => leaves(g.tree).includes(id)) ?? SPECIES_GROUPS[0];

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
