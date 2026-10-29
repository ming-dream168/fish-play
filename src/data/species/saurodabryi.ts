// 蛇鮈 的图鉴资料. 每条说法都对过来源, 取舍的地方在字段上方写明依据.
// 主要来源: FishBase 物种页 (体长, 体重, IUCN); Catalog of Fishes (有效名, 模式产地, 分布);
// 中国动物主题数据库 (zoology.csdb.cn) 的两条蛇鮈记录: 一条是动物志式的形态描述 (可数性状, 比例, 唇, 须, 鳔, 肠, 肛门, 分布),
// 另一条记生活习性 (食性, 产卵期, 卵); 周传江等 2023 (河南光唇蛇鮈新纪录, 引用了中国动物志对本属的描述与生境).
// 分类学备注: FishBase 与 Catalog of Fishes 已把鮈类独立为鮈科 Gobionidae; 中国动物志和中文维基仍放在鲤科鮈亚科.
// 这里按较新的分类写鮈科, 与图鉴里其他鮈类条目一致.
// 百度百科对抓取返回 403, 没有用作来源.
import type { SpeciesInfo, StructureId } from '../types';

export const INFO: SpeciesInfo = {
  id: 'saurodabryi',
  zh: '蛇鮈',
  latin: 'Saurogobio dabryi',
  // Catalog of Fishes: Saurogobio dabryi Bleeker 1871, 模式产地长江, 至今有效, 原属即蛇鮈属, 命名人不加括号
  authority: 'Bleeker, 1871',
  en: 'Chinese lizard gudgeon',
  taxonomy: {
    class: '辐鳍鱼纲 Actinopterygii',
    order: '鲤形目 Cypriniformes',
    family: '鮈科 Gobionidae',
  },
  // FishBase: 最大 27.3 cm TL, 常见 14.0 cm SL (常见体长是标准长), 最大体重 106.3 g.
  // 中文维基写最大约 24.3 cm; 动物志式记录测量的标本体长 93–171 mm.
  size: { maxLengthCm: 27.3, commonLengthCm: 14, maxWeightKg: 0.1063, lengthType: 'TL' },
  // 没有查到深度范围, 按约定填 0
  depth: { minM: 0, maxM: 0, typical: '江河与湖泊的沙质水底' },
  // 周传江等 2023: 蛇鮈属喜栖于沙质河底. FishBase: 河流与湖泊, 底栖-中层 (benthopelagic).
  // 中国动物主题数据库的习性记录称其为 "中层鱼类", 与属的沙底习性说法不一, 这里按多数来源写底层.
  // 食性: 以甲壳类和水生昆虫幼虫为主, 也吃植物碎屑和藻类 (csdb 习性记录).
  habitat: '常贴着江河与湖泊的沙质水底活动，用下位的口在沙面觅食，主要吃小型甲壳类和水生昆虫幼虫，也吃植物碎屑和藻类。',
  // csdb 动物志式记录: 中国从黑龙江到海南岛及云南程海都有分布, 境外见于俄罗斯, 朝鲜半岛和越南北部.
  // Catalog of Fishes 较谨慎: 黄河至珠江, 以及越南红河, 朝鲜, 俄罗斯和蒙古只是 "可能" 有分布.
  distribution: '中国东部从黑龙江到海南岛的各大水系都有记录，西南可达云南程海；境外见于越南北部，朝鲜半岛和俄罗斯的记录仍有疑问。',
  // FishBase 的 IUCN 栏: LC, 评估日期 2020-06-16. 中文维基仍写未予评估, 是旧信息.
  iucn: 'LC',
  iucnYear: 2020,
  // 没有查到最大年龄; FishBase 只给出世代时间 3.5 年, csdb 记 2 冬龄性成熟, 故不填 lifespan.
  // 可数性状取自 csdb 动物志式记录. FishBase 记背鳍 3/7, 臀鳍 3/25–26, 臀鳍软条数明显有误, 不采用.
  // 鳃耙: 该记录为 9–12, csdb 另一条记录为 8–12. 脊椎 4 + 41–45 中的 4 节是参与韦伯氏器的前 4 节.
  meristics: {
    dorsal: 'iii, 8',
    anal: 'iii, 6',
    pectoral: 'i, 13–15',
    pelvic: 'i, 7',
    vertebrae: '4 + 41–45',
    lateralLine: '47–50',
    gillRakers: '9–12',
  },
  // 没有查到针对蛇鮈游泳方式的研究, 这里按鲤形目通行的教科书分类.
  swimming: {
    mode: 'subcarangiform',
    zh: '亚鲹科式',
    note: '平时贴着沙底停歇或沿河床短距离游动，摆动集中在身体后半段，推进力主要来自尾柄和叉形尾鳍。这是鲤形目通行的分类，没有查到针对本种的专门研究。',
  },
  summary:
    '蛇鮈是东亚江河里常见的底层小型鱼，体细长近圆筒形，吻尖长，口下位，唇上布满乳突。它常贴着沙质河底觅食小型甲壳类和水生昆虫幼虫，在中国从黑龙江到海南岛都有分布。',
  highlights: [
    {
      title: '布满乳突的唇',
      body: '口下位，呈马蹄形，唇厚，上下唇布满细小乳突，下唇中央还有一块带乳突的肉垫。吻长而尖，长度超过眼后的头长，鼻孔前方明显凹陷。',
    },
    {
      title: '缩小的鳔',
      body: '鳔很小，分为两室：前室包在圆形的骨质囊里，后室极小，露在骨囊之外。肠管也短，不及体长；肛门很靠前，紧挨着腹鳍基部。',
    },
    {
      title: '随水漂流的卵',
      body: '每年 4 至 6 月产卵。卵的密度比水大，却随水流漂浮发育；2 冬龄的个体即可性成熟。蛇鮈属的鱼大多喜欢栖息在沙质河底。',
    },
  ],
  sources: [
    'https://www.fishbase.se/summary/Saurogobio-dabryi.html',
    'https://researcharchive.calacademy.org/research/ichthyology/catalog/fishcatget.asp?tbl=species&genus=Saurogobio',
    'http://www.zoology.csdb.cn/taxon/%7B08EFFEFE-7C30-419F-B5C4-45ED194B4D32%7D',
    'http://www.zoology.csdb.cn/taxon/%7B10122FCE-B4D9-4109-BD4A-92473EE18BB6%7D',
    'https://www.htu.edu.cn/_upload/article/files/ef/8f/481c2bad438a89dd0d584f3f2d05/49fe2f12-044e-4e96-a66f-6be55888c6b1.pdf',
    'https://zh.wikipedia.org/wiki/蛇鮈',
  ],
};

// 该物种在各结构上的特例说明 (20–60 字), 会合并进结构卡片
export const NOTES: Partial<Record<StructureId, string>> = {
  jaws: '口下位，呈马蹄形；唇厚，上下唇布满细小乳突，下唇中央有一个带乳突的肉垫。',
  barbels: '口角须 1 对，很短，长度不及眼径，是鮈类典型的须式。',
  nares: '吻长而尖，鼻孔前方明显凹陷，这是它和吻短的长蛇鮈、光唇蛇鮈的区别之一。',
  eye: '眼较大，位于头侧上方；吻长超过眼后的头长。',
  scales: '侧线鳞 47–50 枚；胸鳍基部之前的胸腹部裸露无鳞。',
  skin: '体侧中轴有一条暗色纵带，带上排着 10–12 个长圆形暗斑；背部鳞片边缘色暗。',
  dorsalFin: '背鳍 iii-8，没有硬刺，外缘内凹；起点距吻端比距尾鳍基近。',
  caudalFin: '尾鳍叉形，照片标本的上下叶约等长，末端尖，鳍膜透明。',
  swimBladder: '鳔小，分两室：前室包在圆形骨囊中，后室很小，露在骨囊之外。',
  intestine: '肠管短，不及体长；肛门靠近腹鳍基，约在腹鳍基与臀鳍起点间的前 1/5 处。',
  pharyngealTeeth: '下咽齿 1 行，每侧 5 枚，偶有一侧为 4 枚。',
  weberianApparatus: '脊椎记作 4 + 41–45，前面的 4 节特化为韦伯氏器，把鳔的振动传到内耳。',
};
