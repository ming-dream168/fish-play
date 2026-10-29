// 长蛇鮈 的图鉴资料. 每条说法都对过来源, 取舍的地方在字段上方写明依据.
// 主要来源: FishBase 物种页 (体长, 体重, IUCN); Catalog of Fishes (有效名, 模式产地, 分布);
// 中国动物主题数据库 (zoology.csdb.cn) 的三条长蛇鮈记录: 一条是动物志式的形态描述 (可数性状, 比例, 唇, 须, 鳞, 肛门, 分布),
// 一条记生活习性 (产卵, 食性), 一条记经济价值 (属内最大, 最肥); 湖南日报 2023 年的科普报道 (生境, 资源衰退, 湖南省重点保护).
// 分类学备注: FishBase 与 Catalog of Fishes 已把鮈类独立为鮈科 Gobionidae; 中文资料多仍放在鲤科鮈亚科.
// 中文维基没有长蛇鮈条目; 百度百科对抓取返回 403.
import type { SpeciesInfo, StructureId } from '../types';

export const INFO: SpeciesInfo = {
  id: 'saurodumerili',
  zh: '长蛇鮈',
  latin: 'Saurogobio dumerili',
  // Catalog of Fishes: Saurogobio dumerili Bleeker 1871, 模式产地长江, 至今有效. 种名纪念法国动物学家 A. H. A. Duméril.
  authority: 'Bleeker, 1871',
  // FishBase 没有给出英文俗名, 这里不编造, 用破折号占位
  en: '—',
  taxonomy: {
    class: '辐鳍鱼纲 Actinopterygii',
    order: '鲤形目 Cypriniformes',
    family: '鮈科 Gobionidae',
  },
  // FishBase: 最大 24.0 cm SL, 常见 11.5 cm SL, 最大体重 93.8 g.
  // csdb 动物志式记录的标本体长 104–258 mm, 比 FishBase 的最大值还长; csdb 经济记录称它是本属最大的种, 常见体长约 250 mm.
  // 来源不一致, 这里取 FishBase 的数值.
  size: { maxLengthCm: 24, commonLengthCm: 11.5, maxWeightKg: 0.0938, lengthType: 'SL' },
  // 没有查到深度范围, 按约定填 0
  depth: { minM: 0, maxM: 0, typical: '清澈见底的沙底水域' },
  // csdb: 江河与大型湖泊的底层鱼类, 主要吃底栖动物, 也吃枝角类, 藻类和植物碎屑. 湖南日报: 喜欢清澈见底的沙底水域.
  habitat: '江河与大型湖泊里的底层鱼类，偏爱清澈见底的沙底水域，主要吃底栖动物，也吃枝角类、藻类和植物碎屑。',
  // csdb 动物志式记录: 中国特有, 辽河, 黄河, 长江和钱塘江水系. Catalog of Fishes 只列出长江中下游的湖北与江苏.
  distribution: '中国特有，记录于辽河、黄河、长江和钱塘江水系；Catalog of Fishes 只列出长江中下游的湖北和江苏。',
  // FishBase: 未予评估 (Not Evaluated). 湖南日报: 已列为湖南省重点保护野生动物.
  iucn: 'NE',
  // 没有查到寿命资料, 不填 lifespan.
  // 可数性状取自 csdb 动物志式记录. 侧线鳞: 该记录为 55–61, csdb 另一条记录与湖南日报为 57–61.
  // 下咽齿每侧 5 枚, 偶为 4 枚. 脊椎 4 + 49–53.
  meristics: {
    dorsal: 'iii, 7',
    anal: 'iii, 6',
    pectoral: 'i, 14–15',
    pelvic: 'i, 7',
    vertebrae: '4 + 49–53',
    lateralLine: '55–61',
    gillRakers: '4–5',
  },
  // 没有查到针对本种游泳方式的研究, 这里按鲤形目通行的教科书分类.
  swimming: {
    mode: 'subcarangiform',
    zh: '亚鲹科式',
    note: '细长的身体贴近河床游动，摆动集中在身体后半段和细长的尾柄，推进力主要来自叉形尾鳍。这是鲤形目通行的分类，没有查到针对本种的专门研究。',
  },
  summary:
    '长蛇鮈是中国特有的底层鱼，身体比同属的蛇鮈更细长，体长可达体高的近 10 倍，头短吻钝。它生活在江河与大湖的沙底水域，以底栖动物为食；野生数量因过度捕捞已急剧下降。',
  highlights: [
    {
      title: '同属里最细长',
      body: '体长为体高的 6.5–9.8 倍；侧线鳞 55–61 枚，脊椎 4 + 49–53 节，都比蛇鮈和光唇蛇鮈多。头短，体长为头长的 5.5–6.5 倍。',
    },
    {
      title: '短吻与全鳞的胸部',
      body: '吻短而钝，鼻孔前方只略微下凹；唇上乳突多而不明显，口角须约与眼径等长。和胸腹部裸露的蛇鮈不同，它的胸腹部全被鳞片。',
    },
    {
      title: '浮性卵与资源衰退',
      body: '约在 4 月于江河中产浮性卵。它被认为是本属里个体最大、肉最肥的一种，野生数量因过度捕捞急剧下降，已列为湖南省重点保护野生动物。',
    },
  ],
  sources: [
    'https://www.fishbase.se/summary/Saurogobio-dumerili.html',
    'https://researcharchive.calacademy.org/research/ichthyology/catalog/fishcatget.asp?tbl=species&genus=Saurogobio',
    'http://www.zoology.csdb.cn/taxon/%7B4B435427-3103-4A09-B2AE-6B986DF488E3%7D',
    'http://www.zoology.csdb.cn/taxon/%7BA4A40ACD-C355-4BB7-A75D-BC8335C6AC0E%7D',
    'http://www.zoology.csdb.cn/taxon/%7BE7328929-3CC1-474C-824A-03C7EBFD0374%7D',
    'https://m.voc.com.cn/xhn/news/202310/18806835.html',
  ],
};

// 该物种在各结构上的特例说明 (20–60 字), 会合并进结构卡片
export const NOTES: Partial<Record<StructureId, string>> = {
  jaws: '口下位，呈马蹄形；唇上乳突多而细弱，不如蛇鮈的明显。',
  barbels: '口角须 1 对，长度约等于眼径或略短，比蛇鮈的须相对长。',
  nares: '吻短而钝，鼻孔前方只略微下凹，不像蛇鮈那样明显凹陷。',
  eye: '眼相对较大，头长为眼径的 5.0–6.3 倍，位置靠近吻端。',
  scales: '侧线鳞 55–61 枚，是三种蛇鮈里最多的；胸腹部全被鳞片。',
  skin: '体色银灰，体侧上半每片鳞的基部有一个黑点，连成细网纹，没有成列的暗斑。',
  dorsalFin: '背鳍 iii-7，没有硬刺；起点距吻端明显比距尾鳍基近。',
  pectoralFin: '胸鳍 i-14~15，照片标本的胸鳍基部带橙红色。',
  intestine: '肛门明显靠近腹鳍基，约在腹鳍基与臀鳍起点间的前 1/6 处。',
  gills: '鳃耙很少，只有 4–5 枚，远少于蛇鮈的 9–12 枚。',
  pharyngealTeeth: '下咽齿每侧 5 枚，偶有一侧为 4 枚。',
  weberianApparatus: '脊椎记作 4 + 49–53，前面的 4 节特化为韦伯氏器，连接鳔与内耳。',
};
