// 光唇蛇鮈 的图鉴资料. 每条说法都对过来源, 取舍的地方在字段上方写明依据.
// 主要来源: 周传江等 2023 (河南省蛇鮈属新纪录种: 光唇蛇鮈, 河南师范大学学报 51(6):122–127; 文中引用了中国动物志的描述与比例),
// FishBase 物种页 (体长, 体重, IUCN), Catalog of Fishes (名称, 模式标本, 分布), 中文维基.
// 分类学备注: FishBase 与 Catalog of Fishes 已把鮈类独立为鮈科 Gobionidae.
// 没有查到本种的椎骨数, 鳃耙数和臀鳍, 胸鳍, 腹鳍的鳍条数, 这些字段不填.
import type { SpeciesInfo, StructureId } from '../types';

export const INFO: SpeciesInfo = {
  id: 'saurogymno',
  zh: '光唇蛇鮈',
  latin: 'Saurogobio gymnocheilus',
  // 命名人有分歧: FishBase, 中文维基和周传江等 2023 写 Lo, Yao & Chen, 1998 (即罗云林, 乐佩琦, 陈宜瑜, 发表于中国动物志);
  // Catalog of Fishes 记为 "Luo, Yue & Chen 1977" (伍献文等 1977《中国鲤科鱼类志》下卷), 同一条目又引用
  // Bănărescu 1992 与 Dai 等 2014 把它视为滑唇蛇鮈 S. lissilabris 的同物异名. 这里按 FishBase 的写法.
  authority: 'Lo, Yao & Chen, 1998',
  // FishBase 没有给出英文俗名, 这里不编造, 用破折号占位
  en: '—',
  taxonomy: {
    class: '辐鳍鱼纲 Actinopterygii',
    order: '鲤形目 Cypriniformes',
    family: '鮈科 Gobionidae',
  },
  // FishBase: 最大 16.3 cm SL, 最大体重 28.8 g. 中文维基写最大 11.7 cm, 与 FishBase 不一致.
  size: { maxLengthCm: 16.3, maxWeightKg: 0.0288, lengthType: 'SL' },
  // 没有查到深度范围, 按约定填 0
  depth: { minM: 0, maxM: 0, typical: '沙底河流的缓流河段' },
  // 周传江等 2023: 只见于沙底河流的缓流段, 分布零散; 需要溶氧充足的水体, 离水后很快死亡.
  habitat: '只栖息在沙底河流的缓流河段，贴近沙底生活，分布零散；对溶氧要求高，离水后很快死亡。',
  // Catalog of Fishes: 长江中上游的湖北, 湖南, 模式标本采自宜昌与岳阳. 周传江等 2023: 河南黄河与淮河水系首次记录, 向北扩展约 500 km.
  distribution: '中国特有，原知分布于长江中上游的湖北和湖南（模式标本采自宜昌和岳阳）；2023 年在河南的黄河与淮河水系首次发现，分布向北扩展约 500 公里。',
  // FishBase: 未予评估 (Not Evaluated)
  iucn: 'NE',
  // 背鳍与侧线鳞取自周传江等 2023 引用的中国动物志数值 (河南标本侧线鳞 42–43). 其余可数性状没有查到.
  meristics: {
    dorsal: 'iii, 7',
    lateralLine: '40–45',
  },
  // 没有查到针对本种游泳方式的研究, 这里按鲤形目通行的教科书分类.
  swimming: {
    mode: 'subcarangiform',
    zh: '亚鲹科式',
    note: '在缓流的沙底上方短距离游动，摆动集中在身体后半段，推进力主要来自叉形尾鳍。这是鲤形目通行的分类，没有查到针对本种的专门研究。',
  },
  summary:
    '光唇蛇鮈是中国特有的小型底层鱼，因唇薄而光滑、没有乳突得名。它只生活在沙底河流的缓流段，分布零散，数量稀少；2023 年在河南的黄河和淮河水系首次被发现。',
  highlights: [
    {
      title: '光滑的唇',
      body: '蛇鮈属多数种类的唇上布满乳突，只有光唇蛇鮈和滑唇蛇鮈的唇薄而光滑。两者的区别在下唇中央的肉垫：光唇蛇鮈的肉垫后缘不游离。',
    },
    {
      title: '纵带上的黑斑',
      body: '体侧中轴有一条浅暗色纵带，带上排着 12–13 个黑斑。侧线鳞只有 40–45 枚，比蛇鮈和长蛇鮈都少，胸鳍基部前方只有少数鳞片。',
    },
    {
      title: '稀少的沙底鱼',
      body: '它需要溶氧充足的清水，离水后很快死亡。水体污染、过度捕捞和非法采砂，都在威胁它赖以生存的沙底河段。',
    },
  ],
  sources: [
    'https://www.htu.edu.cn/_upload/article/files/ef/8f/481c2bad438a89dd0d584f3f2d05/49fe2f12-044e-4e96-a66f-6be55888c6b1.pdf',
    'https://www.fishbase.se/summary/Saurogobio-gymnocheilus.html',
    'https://researcharchive.calacademy.org/research/ichthyology/catalog/fishcatget.asp?tbl=species&genus=Saurogobio',
    'https://zh.wikipedia.org/wiki/光唇蛇鮈',
  ],
};

// 该物种在各结构上的特例说明 (20–60 字), 会合并进结构卡片
export const NOTES: Partial<Record<StructureId, string>> = {
  jaws: '口下位；唇薄而光滑，看不到明显乳突，下唇中央肉垫的后缘不游离。',
  barbels: '口角须 1 对，照片标本的须细而色白，向下后方弯曲。',
  nares: '吻较短，鼻孔前方没有明显凹陷，头长为吻长的 2.7–3.3 倍。',
  scales: '侧线鳞 40–45 枚，是三种蛇鮈里最少的；胸鳍基部前方只有少数鳞片。',
  skin: '背部黄褐色，体侧中轴有一条浅暗色纵带，带上排着 12–13 个黑斑。',
  dorsalFin: '背鳍 iii-7，没有硬刺，外缘内凹，前部的不分枝鳍条最长。',
  caudalFin: '尾鳍叉形，分叉深，照片标本的上叶略长于下叶。',
  weberianApparatus: '和其他鲤形目鱼类一样，前 4 节椎骨特化为韦伯氏器，把鳔的振动传到内耳。',
};
