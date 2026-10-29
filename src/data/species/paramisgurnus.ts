// 大鳞副泥鳅 的图鉴资料. 每条说法都对过来源, 取舍的地方在字段上方写明依据.
// 主要来源: Catalog of Fishes (有效名与命名人, 分布, 引种); FishBase 物种页 (体长, 体重, IUCN, 肠与皮肤呼吸, 雄鱼的骨质板, 与泥鳅杂交);
// 中国动物主题数据库 (zoology.csdb.cn) 的大鳞副泥鳅记录 (须, 鳞, 尾柄棱起, 肛门, 分布); 台湾鱼类资料库 (可数性状, 深度, 生境);
// Seriously Fish (与泥鳅的区别); 中文维基 (生境, 引种).
// 学名: 中文名沿用旧属名副泥鳅属 Paramisgurnus. Catalog of Fishes 记原名为 Paramisgurnus dabryanus Guichenot (见 Dabry de Thiersant 1872),
// 现行有效名为 Misgurnus dabryanus (Guichenot 1872); FishBase 也用这个名字. 中文维基写 "Sauvage, 1878", 按 Catalog of Fishes
// 那是后来重复使用的同名, 不采用. 台湾鱼类资料库写 "Dabry de Thiersant, 1872".
import type { SpeciesInfo, StructureId } from '../types';

export const INFO: SpeciesInfo = {
  id: 'paramisgurnus',
  zh: '大鳞副泥鳅',
  latin: 'Misgurnus dabryanus',
  authority: '(Guichenot, 1872)',
  // FishBase 没有英文俗名; 台湾鱼类资料库用泛称 weatherfish, 这里不编造专名, 用破折号占位
  en: '—',
  taxonomy: {
    class: '辐鳍鱼纲 Actinopterygii',
    order: '鲤形目 Cypriniformes',
    family: '鳅科 Cobitidae',
  },
  // 来源差异很大: FishBase 最大 21.5 cm TL, 常见 7.3 cm SL, 最大体重 58 g; 中文维基约 20 cm; 台湾鱼类资料库 12 cm;
  // Seriously Fish 9 cm SL. 这里取 FishBase.
  size: { maxLengthCm: 21.5, commonLengthCm: 7.3, maxWeightKg: 0.058, lengthType: 'TL' },
  // 台湾鱼类资料库与中文维基: 0–10 m
  depth: { minM: 0, maxM: 10, typical: '稻田、沟渠和沼泽的泥底' },
  // 中文维基与台湾鱼类资料库: 稻田, 沟渠, 沼泽与缓流河道的泥底, 耐污染, 耐低氧.
  habitat: '栖息在稻田、沟渠、沼泽和缓流河道的泥底，常钻在淤泥里；耐污染，也耐低氧。',
  // csdb: 长江中下游. Catalog of Fishes: 中国中部, 南部与台湾; 已被引入法国, 西班牙, 俄罗斯, 中国北方与香港. 中文维基: 也引入日本.
  distribution: '原产中国中南部（以长江中下游为主）和台湾；已被引入中国北方、香港、日本、俄罗斯，以及法国和西班牙。',
  // FishBase 的 IUCN 栏: LC, 评估日期 2023-01-05
  iucn: 'LC',
  iucnYear: 2023,
  // 没有查到寿命资料, 不填 lifespan.
  // 可数性状取自台湾鱼类资料库 (原文 D 3+5–7, A 3+4–5, V 1+6, 这里按不分枝鳍条用罗马数字改写). 侧线不明显, 这里填的是纵列鳞数.
  // 没有查到椎骨数, 胸鳍鳍条数与鳃耙数.
  meristics: {
    dorsal: 'iii, 5–7',
    anal: 'iii, 4–5',
    pelvic: 'i, 6',
    lateralLine: '98–120（纵列鳞）',
  },
  swimming: {
    mode: 'anguilliform',
    zh: '鳗鲡式',
    note: '身体细长，游动时整个身体呈波浪状摆动，常钻在淤泥中。游泳类别按体形归类，没有查到针对本种的专门研究。',
  },
  summary:
    '大鳞副泥鳅是泥鳅的近亲，鳞片比泥鳅大，尾柄上下的皮质棱起很高。它生活在稻田和沟渠的泥底，耐低氧，能吞气用肠呼吸，是中国主要的养殖食用鳅类之一。',
  highlights: [
    {
      title: '名字里的“副”',
      body: '中文名里的“副泥鳅”来自旧属名 Paramisgurnus。现在 Catalog of Fishes 和 FishBase 都把它并入泥鳅属。',
    },
    {
      title: '高高的尾柄棱',
      body: '尾柄上下的皮质棱起很发达，尾柄长约等于尾柄高，纵列鳞只有 98–120 枚；泥鳅的棱起低，尾柄长大于尾柄高，鳞片更细小。',
    },
    {
      title: '吞气与养殖',
      body: '水中缺氧时，它能用肠和皮肤呼吸空气。它是重要的养殖食用鳅，市场上常与泥鳅混在一起出售，两者在野外可能杂交。',
    },
  ],
  sources: [
    'https://researcharchive.calacademy.org/research/ichthyology/catalog/fishcatget.asp?tbl=species&genus=Misgurnus',
    'https://www.fishbase.se/summary/Paramisgurnus-dabryanus.html',
    'http://www.zoology.csdb.cn/taxon/%7B5605ADAE-5E30-43D5-812E-2D5C5F7974CB%7D',
    'https://fishdb.sinica.edu.tw/eng/species.php?id=380996',
    'https://www.seriouslyfish.com/species/paramisgurnus-dabryanus/',
    'https://zh.wikipedia.org/wiki/大鳞副泥鳅',
  ],
};

// 该物种在各结构上的特例说明 (20–60 字), 会合并进结构卡片
export const NOTES: Partial<Record<StructureId, string>> = {
  // csdb 只记 "须 5 对"; 台湾的资料记作吻须 2 对, 口角须 1 对, 颏须 2 对, 均短于头长之半 (该页自注为 AI 摘要, 只作参考)
  barbels: '须 5 对，一般记作吻须 2 对、口角须 1 对、颏须 2 对；照片标本吻端的须明显向前伸。',
  eye: '眼小，位于头侧上方，表面被一层皮膜覆盖。',
  scales: '鳞片比泥鳅大，体侧纵列 98–120 枚；侧线不明显。',
  skin: '照片标本全身黄褐色，密布细小暗点，没有泥鳅背部那种成片的暗色云斑。',
  caudalFin: '尾鳍圆形；尾柄上下的皮质棱起高而发达，尾柄长约等于尾柄高。',
  pectoralFin: '成熟雄鱼的胸鳍较大，鳍条加粗，基部有一块铲形骨质板，后缘有细齿。',
  intestine: '缺氧时游到水面吞气，在肠中交换气体；肛门靠近臀鳍起点。',
  weberianApparatus: '和其他鲤形目鱼类一样有韦伯氏器，连接鳔与内耳。',
};
