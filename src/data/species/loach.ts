// 泥鳅 的图鉴资料. 每条说法都对过来源, 取舍的地方在字段上方写明依据.
// 主要来源: FishBase 物种页 (体长, 生境, 分布, 引种, IUCN, 繁殖行为); Catalog of Fishes (有效名, 原组合, 模式产地);
// 中国动物主题数据库 (zoology.csdb.cn) 的三条泥鳅记录: 动物志式的形态描述 (可数性状, 须, 鳞, 鳔, 尾鳍基黑斑, 第二性征),
// 生活习性记录 (肠呼吸, 天气鱼, 繁殖), 以及一条检索表式描述 (最长须的长度, 尾柄棱起); 中文维基 (低气压时活跃).
// 百度百科对抓取返回 403, 没有用作来源.
import type { SpeciesInfo, StructureId } from '../types';

export const INFO: SpeciesInfo = {
  id: 'loach',
  zh: '泥鳅',
  latin: 'Misgurnus anguillicaudatus',
  // Catalog of Fishes: 原组合 Cobitis anguillicaudata Cantor 1842, 模式产地舟山岛; 现属泥鳅属, 命名人加括号
  authority: '(Cantor, 1842)',
  // FishBase 的英文俗名; 英文里也常叫 oriental weatherfish
  en: 'Pond loach',
  taxonomy: {
    class: '辐鳍鱼纲 Actinopterygii',
    order: '鲤形目 Cypriniformes',
    family: '鳅科 Cobitidae',
  },
  // FishBase: 最大 28.0 cm SL, 常见 15.0 cm TL (常见体长是全长), 没有最大体重. csdb 记体长可达 300 mm, 中文维基写 28 cm.
  size: { maxLengthCm: 28, commonLengthCm: 15, lengthType: 'SL' },
  // FishBase 只写 "从 5 m 起", 没有给出范围, 按约定填 0
  depth: { minM: 0, maxM: 0, typical: '静水或缓流水体的淤泥底层' },
  // FishBase: 河流, 湖泊, 池塘, 沼泽和稻田, 喜泥底, 藏在淤泥和落叶里只露出头. csdb: 静水的泥底, 富含植物碎屑.
  habitat: '栖息在河流、湖泊、池塘、沼泽和稻田的静水或缓流里，偏爱富含植物碎屑的泥底，常钻进淤泥和落叶中，只露出头部。',
  // FishBase: 原产黑龙江, 图古尔河, 库页岛, 经朝鲜半岛和日本, 南到越南北部; 已引入欧洲, 咸海流域, 北美, 澳大利亚和夏威夷.
  // csdb: 中国东部各水系都有.
  distribution: '原产东亚，北起黑龙江和库页岛，经朝鲜半岛、日本和中国东部各水系，南到越南北部；已被引入欧洲、北美、澳大利亚和夏威夷等地。',
  // FishBase 的 IUCN 栏: LC, 评估日期 2011-09-20
  iucn: 'LC',
  iucnYear: 2011,
  // 没有查到寿命资料, 不填 lifespan.
  // 可数性状取自 csdb 动物志式记录; 中文维基记背鳍 9, 臀鳍 7 (只计总数). 侧线不完全, 这里填的是体侧纵列鳞数.
  // 没有查到椎骨数.
  meristics: {
    dorsal: 'ii, 7',
    anal: 'ii, 5–6',
    pectoral: 'i, 8–9',
    pelvic: 'i, 5',
    lateralLine: '约 150（纵列鳞）',
    gillRakers: '2–3 + 12–13',
  },
  swimming: {
    mode: 'anguilliform',
    zh: '鳗鲡式',
    note: '身体细长柔软，游动时整个身体呈波浪状摆动，也能靠这种摆动把身体钻进淤泥。游泳类别按体形归类，没有查到针对本种的专门研究。',
  },
  summary:
    '泥鳅是东亚稻田、池塘和沟渠里最常见的底栖小鱼，身体细长多黏液，口边有 5 对须。它能用肠呼吸，水中缺氧时游到水面吞气；冬季干旱时还能钻进淤泥里度过。',
  highlights: [
    {
      title: '用肠呼吸',
      body: '肠管直而管壁薄，布满微血管。泥鳅游到水面吞入空气，在肠中吸收氧气，废气从肛门排出；冬季干旱时钻进泥中，只靠肠呼吸也能存活。',
    },
    {
      title: '“天气鱼”',
      body: '天气闷热、水中缺氧时，泥鳅会成群上浮到水面吞气，气压低时也更加活跃，所以西欧人把它叫作“天气鱼”。',
    },
    {
      title: '雌雄的胸鳍',
      body: '雄鱼的胸鳍尖长，前部鳍条粗而长；雌鱼的胸鳍圆钝。产卵时雄鱼把身体缠绕在雌鱼身上，黏性卵附着在水草上，1 至 2 天孵化，仔鱼带有外鳃。',
    },
  ],
  sources: [
    'https://www.fishbase.se/summary/Misgurnus-anguillicaudatus.html',
    'https://researcharchive.calacademy.org/research/ichthyology/catalog/fishcatget.asp?tbl=species&genus=Misgurnus',
    'http://www.zoology.csdb.cn/taxon/%7B3CF118F4-3968-4F69-82D9-CE110885159C%7D',
    'http://www.zoology.csdb.cn/taxon/%7B8EF9F17C-A62A-4383-A549-DA5A951ECF4F%7D',
    'http://www.zoology.csdb.cn/taxon/%7BDF056BA5-542D-43EA-A04B-CE96099E0FC7%7D',
    'https://zh.wikipedia.org/wiki/泥鳅',
  ],
};

// 该物种在各结构上的特例说明 (20–60 字), 会合并进结构卡片
export const NOTES: Partial<Record<StructureId, string>> = {
  // csdb 两条记录对须的称呼不同: 吻须 1 对 + 上颌须 2 对 + 下颌须 2 对; 其他资料也记作吻须 2 对, 口角须 1 对, 颏须 2 对
  barbels: '须 5 对：吻须 1 对，上颌须 2 对，下颌须 2 对；最长的须后伸可达或稍过眼后缘。',
  jaws: '口下位，呈弧形；唇厚，下唇有 4 个须状突起。',
  eye: '眼小，位于头侧上方；眼下刺埋在皮下，不外露。',
  scales: '鳞片极细小，埋在皮下，体侧纵列约 150 枚。',
  skin: '体表多黏液；背侧灰褐，散布许多不规则黑色小点，尾鳍基上方有一个明显的黑斑。',
  dorsalFin: '背鳍 ii-7，短小，外缘圆凸，位于身体中点之后。',
  caudalFin: '尾鳍圆形；尾柄上下的皮质棱起较低，尾柄长大于尾柄高。',
  pectoralFin: '雄鱼胸鳍尖长，前部鳍条粗长；雌鱼胸鳍圆钝，可据此分辨雌雄。',
  swimBladder: '鳔很小，包在骨质囊中，位于头部后方的前几节脊椎下面。',
  intestine: '肠直而管壁薄，布满微血管，是辅助呼吸器官；肛门位于臀鳍稍前方。',
  gills: '鳃耙 2–3 + 12–13；水中缺氧时主要靠吞气和肠呼吸补充氧气。',
  weberianApparatus: '和其他鲤形目鱼类一样有韦伯氏器，把包在骨囊里的鳔与内耳连在一起。',
};
