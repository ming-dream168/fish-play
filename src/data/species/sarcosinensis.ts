// 华鳈 的图鉴资料. 每条说法都对过来源, 取舍的地方在字段上方写明依据.
// 主要来源: 中国生物物种名录 (Sp2000 中国节点) 动物志数据库的华鳈条目, 内容摘自《中国动物志 硬骨鱼纲 鲤形目 (中卷)》
// (可数性状, 比例, 须, 体色, 咽齿, 肠, 鳔, 分布); FishBase 物种页 (体长体重, 生态类型, IUCN);
// Catalog of Fishes (学名, 命名人, 模式产地); 宋大祥等 1994《动物学研究》华鳈繁殖生物学 (产卵期, 漂流性卵, 怀卵量);
// Li 等 2022 (Zootaxa 5141) 对鳈属的鉴别特征 (4 条宽黑斑, 1 对短须, 背鳍末根不分枝鳍条较硬).
// 学名: Catalog of Fishes 记原始拼写为 Sarcochilichthys sinensis Bleeker 1871, 模式产地长江, 现为有效种;
// 中国动物志按亚种处理, 本条目对应指名亚种 S. sinensis sinensis (另有福建华鳈 S. s. fukiensis).
// 分类学备注: FishBase 与 Catalog of Fishes 已把鮈类独立为鮈科 Gobionidae; 中国动物志和多数中文资料仍放在鲤科鮈亚科.
// 这里按较新的分类写鮈科, 与 FishBase / Catalog of Fishes 一致.
import type { SpeciesInfo, StructureId } from '../types';

export const INFO: SpeciesInfo = {
  id: 'sarcosinensis',
  zh: '华鳈',
  // 别名: 中国动物志条目只列拉丁同物异名, 没有中文俗名; 网上流传的地方俗名没能在可靠来源里核实, 所以不填 zhAlt.
  // GBIF 转引的 Catalogue of Life 另有繁体写法 "華鰁", 只是同名异写.
  latin: 'Sarcocheilichthys sinensis',
  authority: 'Bleeker, 1871',
  en: 'Chinese lake gudgeon',
  taxonomy: {
    class: '辐鳍鱼纲 Actinopterygii',
    order: '鲤形目 Cypriniformes',
    family: '鮈科 Gobionidae',
  },
  // FishBase: 最大 30.0 cm TL, 最大体重 300 g; 常见体长 12.2 cm 为 SL, 与 TL 口径不同, 这里不填 commonLengthCm.
  // 来源不一致: 中国动物志测量的 57 尾标本体长 75–146.5 mm, 中文科普称最大体长不到 200 mm. 这里取 FishBase 的最大记录.
  size: { maxLengthCm: 30, maxWeightKg: 0.3, lengthType: 'TL' },
  // 没有查到水深记录 (FishBase 未给出深度范围), 按约定填 0.
  depth: { minM: 0, maxM: 0, typical: '江河湖泊的中下层，贴近水底活动' },
  // 中文科普: 多栖息于水体中下层, 食底栖无脊椎动物, 着生藻类和植物碎屑. FishBase: 淡水, 底栖-中层 (benthopelagic), 温带.
  // 中国动物志: 下颌前缘具甚发达的锐利角质缘.
  // "刮食" 是据角质缘与食性 (着生藻类) 作的推断, 没有查到直接的摄食观察.
  habitat: '生活在平原江河和湖泊的中下层，常贴近水底觅食，吃底栖无脊椎动物、着生藻类和植物碎屑，下颌锐利的角质缘便于刮取食物。',
  // 中国动物志: 除西北高原的部分地区外, 几遍于各主要水系. FishBase: 黑龙江流域到朝鲜半岛诸河, 南至西江.
  // 来源不一致: Catalog of Fishes 只写长江流域, 可能是把北方的东北鳈 S. lacustris 等另作他种后的狭义范围.
  distribution: '中国东部平原的江河湖泊广泛分布，除西北高原部分地区外几乎遍及各主要水系，北达黑龙江流域，南至珠江水系，朝鲜半岛也有记录。',
  // FishBase 的 IUCN 栏: LC, 评估日期 2020-04-17. 中文维基等旧资料仍写未评估.
  iucn: 'LC',
  iucnYear: 2020,
  // 没有查到最大年龄; 宋大祥等 1994 只说 1 龄可达性成熟, 产卵群体以 1–2 龄为主, 故不填 lifespan.
  // 可数性状取自中国动物志: 背鳍 iii-7, 臀鳍 iii-6, 胸鳍 i-14–17, 腹鳍 i-7, 侧线鳞 40–42, 鳃耙 7–8, 脊椎骨 4+36–37.
  // 来源不一致: 一个中文百科站记侧线鳞 38–39; 下咽齿行数也有争议, 动物志记 1 行 5–5, 也有文献记作 2 行 (5, 1).
  // 尾鳍条数没有查到.
  meristics: {
    dorsal: 'iii, 7',
    anal: 'iii, 6',
    pectoral: 'i, 14–17',
    pelvic: 'i, 7',
    vertebrae: '4 + 36–37',
    lateralLine: '40–42',
    gillRakers: '7–8',
  },
  // 游泳方式沿用鲤科通行的教科书分类, 没有查到针对华鳈的专门研究.
  swimming: {
    mode: 'subcarangiform',
    zh: '亚鲹科式',
    note: '摆动集中在身体后半段和宽短的尾柄，前半身摆幅小；常贴着水底缓游觅食。游泳类别是鲤科通行的教科书分类，没有查到针对华鳈的专门研究。',
  },
  summary:
    '华鳈是中国东部江河湖泊常见的小型底层鱼，体高而侧扁，头后背部明显隆起，体侧有 4 块宽阔的垂直黑斑，口角有 1 对极细小的须，下颌带锐利角质缘，靠刮食水底的小动物和藻类为生。',
  highlights: [
    {
      title: '四道黑斑与一对微须',
      body: '体侧有 4 块宽阔的垂直黑斑，宽度与间隔相近；口角有 1 对极细小的须。黑鳍鳈的须已退化，体侧是不规则斑纹，这两点可以把它们区分开。',
    },
    {
      title: '下颌上的刮刀',
      // 角质缘的形态取自中国动物志; 食物组成取自中文科普; 二者的联系是推断, 所以写成 "便于".
      body: '华鳈的口很小，位于头的下方，呈马蹄形，下颌前缘有很发达的锐利角质缘。它的食物有着生藻类和底栖小动物，这道角质缘便于在水底刮取食物。',
    },
    {
      title: '随水漂流的卵',
      body: '长江武昌江段的研究发现，华鳈 4 至 7 月分批产卵，5 月最盛；受精卵吸水后卵膜胀到 3.7–4.7 mm，随流水漂流孵化。1 龄鱼即可性成熟。',
    },
  ],
  sources: [
    'http://www.sp2000.org.cn/Fauna/fauna/detil/22690',
    'https://www.fishbase.se/summary/Sarcocheilichthys-sinensis.html',
    'https://researcharchive.calacademy.org/research/ichthyology/catalog/fishcatget.asp?spid=2726',
    'https://www.zoores.ac.cn/article/id/1429',
    'https://zenodo.org/records/6598365',
    'https://doi.org/10.11646/zootaxa.5141.4.3',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC7748832/',
    'https://k.sina.cn/article_6624207026_18ad560b200100fmmm.html',
  ],
};

// 该物种在各结构上的特例说明 (20–60 字), 会合并进结构卡片. 未注明的均取自中国动物志条目.
export const NOTES: Partial<Record<StructureId, string>> = {
  barbels: '口角有 1 对须，极其微细，不仔细看很容易忽略；近缘的黑鳍鳈须已退化，只留痕迹。',
  jaws: '口甚小，下位，呈马蹄形，口宽大于口长；下唇只限于口角处，下颌前缘有很发达的锐利角质缘。',
  eye: '眼稍小，位于头侧上方，距吻端比距鳃盖后缘近；两眼之间宽而隆起。',
  skin: '体灰色，背部灰黑，腹部灰白；生殖期黑斑变成深黑色，雄鱼吻部长出白色珠星。',
  scales: '体被中等大的圆鳞，胸部和腹部也有鳞，但较细小；背鳍前鳞 11–14 枚，围尾柄鳞 16 枚。',
  lateralLine: '侧线完全而平直，侧线鳞 40–42 枚；也有资料记作 38–39 枚。',
  dorsalFin: '背鳍 iii-7，外缘近平截；最后一根不分枝鳍条基部较硬，上段柔软分节，不是真正的硬刺。',
  analFin: '臀鳍 iii-6，较短，起点距腹鳍起点比距尾鳍基近；肛门靠近臀鳍。',
  caudalFin: '尾鳍分叉浅，较宽阔，上下叶等长，末端圆钝；各鳍灰黑色，边缘浅黄或白色。',
  pectoralFin: '胸鳍较长，末端略圆，向后伸达或超过胸鳍基到腹鳍起点距离的 2/3。',
  pharyngealTeeth: '下咽齿 1 行，每侧 5 枚，稍侧扁，第一、二枚末端呈钩状；也有文献记为 2 行。',
  intestine: '肠管较短，只有体长的 0.9–1.0 倍，比鲤短得多；腹膜灰白色。',
  swimBladder: '鳔大，分 2 室，前室卵圆形，后室粗长、末端稍尖，长度为前室的 2.3–2.5 倍。',
  gills: '第一鳃弓外侧鳃耙 7–8 枚，短小而排列稀疏，不适合滤食。',
};
