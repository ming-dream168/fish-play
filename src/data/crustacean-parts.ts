// 甲壳动物模型上可点选的结构说明. 鱼类的结构表 (structure-info.ts) 不适用于节肢动物, 这里单列.
// 依据: 十足目通用形态学术语 (头胸甲, 额角, 螯足, 步足, 腹肢, 尾扇), 中华绒螯蟹与日本沼虾的物种描述
// (中国生物物种名录, 中文维基百科 "中华绒螯蟹" "日本沼虾" 条目, FAO 物种简介).

export interface CrustPartInfo {
  zh: string;
  en: string;
  body: string;
}

const COMMON: Record<string, CrustPartInfo> = {
  carapace: {
    zh: '头胸甲',
    en: 'Carapace',
    body: '头部和胸部的背甲愈合成一整块几丁质外壳，向两侧下延盖住鳃腔。外壳不能生长，个体靠蜕壳长大，刚蜕壳时身体柔软，要几天才能重新钙化变硬。',
  },
  eye: {
    zh: '复眼',
    en: 'Compound eye',
    body: '由许多小眼组成的复眼长在可活动的眼柄上，能竖起观察，也能收进眼眶保护。眼柄里有调控蜕壳与生殖的 X 器官-窦腺复合体。',
  },
  pereiopod: {
    zh: '步足',
    en: 'Pereiopods',
    body: '十足目的胸部有 5 对胸足。除了特化成螯的几对，其余是细长的步足，用来在水底爬行和支撑身体，末节指节尖锐，可以抓住泥沙和石缝。',
  },
  abdomen: {
    zh: '腹部',
    en: 'Pleon',
    body: '腹部由 6 节组成，末端是尾节。腹部肌肉发达时是主要的游泳和逃逸器官；在蟹类中腹部退化，向前折叠贴在头胸甲腹面。',
  },
};

export const CRUST_PARTS: Record<string, Record<string, CrustPartInfo>> = {
  mittencrab: {
    ...COMMON,
    carapace: {
      zh: '头胸甲',
      en: 'Carapace',
      body: '头胸甲呈圆方形，后半部比前半部宽，背面隆起，表面有疣状颗粒，胃区与心区之间有明显的 H 形凹沟。背面多为墨绿或青褐色，腹面灰白。',
    },
    rostralTeeth: {
      zh: '额齿',
      en: 'Frontal teeth',
      body: '额缘有 4 个尖齿，齿间的缺刻呈 U 形，以中间一个缺刻最深。额齿的形状是区分绒螯蟹属各种的特征之一。',
    },
    anterolateral: {
      zh: '前侧齿',
      en: 'Anterolateral teeth',
      body: '头胸甲前侧缘每侧有 4 个锐齿，第 4 齿最小。前侧齿与额齿的形态是野外鉴别绒螯蟹的常用特征。',
    },
    cheliped: {
      zh: '螯足',
      en: 'Cheliped',
      body: '第 1 对胸足特化为螯足，用于取食、防御和求偶时的争斗。雄蟹的螯足明显比雌蟹大，掌节与指节基部的绒毛也更浓密。',
    },
    mitten: {
      zh: '绒毛',
      en: 'Setae (mittens)',
      body: '螯足掌节内外两面密生棕褐色绒毛，像戴着一副手套，这就是"绒螯蟹"和英文名 mitten crab 的由来。雄蟹的绒毛比雌蟹更多。',
    },
    pereiopod: {
      zh: '步足',
      en: 'Walking legs',
      body: '4 对步足长而扁平，第 2、3 对最长，前节和指节的前后缘长有刚毛。蟹类的腿关节限制了前后摆动，所以多半横着爬行。',
    },
    abdomen: {
      zh: '腹部',
      en: 'Abdomen',
      body: '腹部退化成一块"蟹脐"，折叠贴在头胸甲腹面。雄蟹腹部窄而呈三角形，雌蟹宽而呈圆形，用来抱卵；模型做的是雄蟹的窄腹部。',
    },
  },
  riverprawn: {
    ...COMMON,
    carapace: {
      zh: '头胸甲',
      en: 'Carapace',
      body: '头胸甲约占体长的一半弱，表面光滑，前侧有触角刺和肝刺。外壳半透明，体色青绿到棕褐，带深色斑纹，会随水色和底质变化。',
    },
    rostrum: {
      zh: '额角',
      en: 'Rostrum',
      body: '额角短于头胸甲，上缘排着十多个小齿，下缘也有少数几个齿。额角的长短和齿数（齿式）是沼虾属分类的重要依据。',
    },
    antenna: {
      zh: '第二触角',
      en: 'Antenna',
      body: '第二触角的鞭很长，常超过体长，用来感知水流与触碰；基部外侧有一片扁平的鳞片。第一触角较短，末端分成 3 根鞭，主要负责嗅觉。',
    },
    cheliped: {
      zh: '第二步足',
      en: 'Second pereiopod',
      body: '长臂虾科的第 2 对步足特别粗长，末端是钳。日本沼虾成熟雄虾的第二步足比体长还长，呈青绿色，表面有细刺；雌虾的则短小得多，这是区分雌雄最直观的特征。',
    },
    pereiopod: {
      zh: '步足',
      en: 'Walking legs',
      body: '第 1 对步足细小有钳，用来取食；第 3 至 5 对是没有钳的步行足，在水底爬行时支撑身体。',
    },
    abdomen: {
      zh: '腹部',
      en: 'Pleon',
      body: '腹部 6 节，肌肉发达，第 2 节的侧甲覆盖在第 1、3 节的侧甲上，这是真虾类的特征。受惊时腹部猛力向下弯曲，带动尾扇使身体向后弹射。',
    },
    pleopod: {
      zh: '游泳足',
      en: 'Pleopods',
      body: '腹部前 5 节各有 1 对游泳足，前后依次划水推动身体前进。雌虾产卵后，受精卵就粘附在游泳足的刚毛上，由母体携带孵化。',
    },
    tailfan: {
      zh: '尾扇',
      en: 'Tail fan',
      body: '尾节与第 6 腹节的 1 对尾肢组成尾扇。腹部急速屈曲时尾扇像桨一样拍水，是虾躲避捕食者的"弹尾逃逸"动作的推力来源。',
    },
  },
};
