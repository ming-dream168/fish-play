// 棒花鱼 的图鉴资料. 每条说法都对过来源, 取舍的地方在字段上方写明依据.
// 主要来源: 中国动物主题数据库 (中科院动物所) 的两条棒花鱼记录, 一条摘自《中国动物志 硬骨鱼纲 鲤形目 (中卷)》
// (陈宜瑜 1998; 可数性状, 唇, 须, 颌, 鳔, 肠, 珠星, 分布), 另一条摘自《中国动物图谱》(生活习性, 食性, 产卵期, 筑巢);
// FishBase 物种页 (最大体长, 生态类型, 筑巢尺寸与卵数, IUCN); 中文维基 (别名, 生境).
// 学名: FishBase 记为 Abbottina rivularis (Basilewsky, 1855), 原组合为 Gobio rivularis, 故命名人加括号.
// 分类学备注: FishBase 与 Catalog of Fishes 已把鮈类独立为鮈科 Gobionidae; 中国动物志和多数中文资料仍放在鲤科鮈亚科.
// 这里按较新的分类写鮈科, 与图鉴里其他鮈类条目一致.
// 另: Chen 与 Fu 2019 (Mitochondrial DNA Part B) 指出越南棒花鱼 Abbottina binhi 在中国长期被误鉴定为棒花鱼,
// 所以中文资料里 "遍布全国" 的分布范围可能混有近缘种.
import type { SpeciesInfo, StructureId } from '../types';

export const INFO: SpeciesInfo = {
  id: 'abbottina',
  zh: '棒花鱼',
  // 别名取自中文维基
  zhAlt: ['爬虎鱼', '推沙', '沙锤'],
  latin: 'Abbottina rivularis',
  authority: '(Basilewsky, 1855)',
  en: 'Chinese false gudgeon',
  taxonomy: {
    class: '辐鳍鱼纲 Actinopterygii',
    order: '鲤形目 Cypriniformes',
    family: '鮈科 Gobionidae',
  },
  // FishBase: 最大 18.9 cm TL, 未给出最大体重 (只有长度-体重换算参数).
  // 来源不一致: 中国动物志测量的 108 尾标本体长 42.5–95 mm, 中国动物图谱记体长 37.4–110 mm, 中文维基写体长可达 11 cm.
  // 这里取 FishBase 的最大记录, 不填常见体长与体重.
  size: { maxLengthCm: 18.9, lengthType: 'TL' },
  // FishBase 没有给出深度范围, 按约定填 0; 只记录了雄鱼的巢位于水深 8–34 cm 处.
  depth: { minM: 0, maxM: 0, typical: '浅水区的沙底或泥底，产卵巢在水深 8–34 厘米处' },
  // 中国动物图谱: 底层鱼, 喜生活在砂石底处; 杂食, 主食底栖生物, 浮游动物和藻类.
  // FishBase: 淡水和半咸水, 底栖-中层 (benthopelagic); 成鱼生活在缓流河流与湖泊的浅水区, 沙底或泥底.
  habitat: '典型的底层小鱼，喜欢平原河流、湖泊浅水区的沙石底或泥底，常贴着水底活动，杂食，主要吃底栖动物、浮游动物和藻类。',
  // 中国动物志: 分布极广, 除少数高原地区外几遍及全国各水系. 中文维基: 黑龙江至珠江各水系, 朝鲜半岛西部, 日本本州西部与九州.
  // FishBase: 原产中国东部, 朝鲜半岛和日本; 已被引入湄公河流域, 在土库曼斯坦捷詹河流域也有记录.
  distribution: '原产中国东部、朝鲜半岛和日本，在中国从黑龙江到珠江，除少数高原地区外几乎遍及各水系；已被引入湄公河流域。',
  // FishBase 的 IUCN 栏: LC, 评估日期 2020-03-25. 中文维基仍写未予评估, 是旧信息.
  iucn: 'LC',
  iucnYear: 2020,
  // 没有查到最大年龄; FishBase 只给出估算的世代时间 3.7 年, 中国动物图谱称约一年性成熟, 故不填 lifespan.
  // 中国动物志: 背鳍 iii-7, 臀鳍 iii-5, 腹鳍 i-7, 侧线鳞 35–39, 脊椎骨 4+31–33, 鳃耙 4–5.
  // 胸鳍: 中国动物志数据库原文为 "i-10—2", 应是 "i-10—12" 的录入错误; 中国动物图谱记为 Ⅰ-12. 这里写 i, 10–12.
  // 尾鳍鳍条数没有查到, 不填.
  meristics: {
    dorsal: 'iii, 7',
    anal: 'iii, 5',
    pectoral: 'i, 10–12',
    pelvic: 'i, 7',
    vertebrae: '4 + 31–33',
    lateralLine: '35–39',
    gillRakers: '4–5',
  },
  // 游泳方式的英文类别沿用鲤科通行的教科书分类, 没有查到针对棒花鱼的专门研究.
  swimming: {
    mode: 'subcarangiform',
    zh: '亚鲹科式',
    note: '摆动集中在身体后半段和尾柄，前半身摆幅很小；它是底层鱼，多贴着水底游动。游泳类别是鲤科通行的教科书分类，没有查到针对棒花鱼的专门研究。',
  },
  summary:
    '棒花鱼是中国最常见的底层小鱼之一，从黑龙江到珠江几乎各水系都有。它喜欢沙石底的浅水，常伏在水底；繁殖季雄鱼会在沙底挖巢，守着巢里的卵。',
  highlights: [
    {
      // FishBase 生活史栏
      title: '雄鱼挖巢护卵',
      body: '繁殖季雄鱼在水底挖出直径 12 至 43 厘米的巢，巢多在水深 8 至 34 厘米的浅处，产卵后由雄鱼守护；曾在一个巢里数到 1711 粒卵。',
    },
    {
      // 中国动物志
      title: '雄鱼的繁殖装扮',
      body: '雄鱼胸鳍的不分枝鳍条会变硬，胸鳍外缘和头部长出发达的珠星，各鳍都比雌鱼长、末端圆；雌鱼的鳍缘则是平截的。',
    },
    {
      // 中国动物志: 唇无显著乳突, 鳔大, 后室长为前室的 1.5–2 倍. FishBase 也写无唇乳突.
      title: '厚唇与大鳔',
      body: '唇厚而光滑，没有明显的乳突，下唇中央有一对卵圆形肉突。它的鳔大而发达，分两室，后室长是前室的 1.5 至 2 倍，和鳔很小的小鳔鮈正相反。',
    },
  ],
  sources: [
    'https://www.fishbase.se/summary/Abbottina-rivularis.html',
    'https://fishbase.se/Reproduction/22903',
    'http://www.zoology.csdb.cn/taxon/%7B107BC200-53E9-4E94-B8EB-79082E678615%7D',
    'http://www.zoology.csdb.cn/taxon/%7BF18CF9D9-BA8D-46C5-87E4-CE026369E200%7D',
    'https://zh.wikipedia.org/zh-hans/%E6%A3%92%E8%8A%B1%E9%B1%BC',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC7687625/',
  ],
};

// 该物种在各结构上的特例说明 (20–60 字), 会合并进结构卡片. 除注明外均取自中国动物志.
export const NOTES: Partial<Record<StructureId, string>> = {
  barbels: '口角有 1 对须，较粗，长度和眼径差不多；FishBase 记为 1 对短的上颌须。',
  jaws: '口下位，近马蹄形；上下颌没有角质边缘，这一点和颌缘带角质的小鳔鮈不同。',
  skin: '背部和体侧有黑斑，横跨背部 5 个大黑斑，体侧中轴有 7 至 8 个黑点；头侧从吻端到眼前有 1 条黑纹。',
  scales: '体被圆鳞，胸部前方裸露无鳞；背鳍前鳞 10 至 13 枚，围尾柄鳞 12 至 14 枚。',
  lateralLine: '侧线完全而平直，穿过 35 至 39 枚侧线鳞；体侧沿中轴的 7 至 8 个黑点就排在侧线一带。',
  dorsalFin: '背鳍发达，外缘弧形外凸，没有硬刺；雄鱼的背鳍鳍条特别长。',
  analFin: '臀鳍较短，有 3 根不分枝鳍条和 5 根分枝鳍条，起点离尾鳍基比离腹鳍基近。',
  caudalFin: '尾鳍分叉浅，上叶略长于下叶，末端圆；鳍上有多数黑点连成的条纹。',
  pectoralFin: '胸鳍后缘圆，远不到腹鳍起点；雄鱼的胸鳍不分枝鳍条变硬，外缘长珠星。',
  pelvicFin: '腹鳍起点在背鳍起点之后，约与背鳍第 3、4 根分枝鳍条相对。',
  swimBladder: '鳔大而发达，分 2 室：前室近圆形，后室长圆形，长度是前室的 1.5 至 2 倍。',
  intestine: '肠管粗短，长度约与体长相等，为体长的 0.9 至 1.1 倍。',
  pharyngealTeeth: '下咽齿只有 1 行，每侧 5 枚，各齿长短形状相近，上部侧扁，末端稍钩曲。',
  gills: '鳃耙不发达，第一鳃弓外侧只有 4 至 5 个瘤状突起。',
};
