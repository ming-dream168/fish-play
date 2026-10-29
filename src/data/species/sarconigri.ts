// 黑鳍鳈 的图鉴资料. 每条说法都对过来源, 取舍的地方在字段上方写明依据.
// 主要来源: 中国生物物种名录 (Sp2000 中国节点) 动物志数据库的黑鳍鳈条目, 内容摘自《中国动物志 硬骨鱼纲 鲤形目 (中卷)》
// (可数性状, 比例, 须, 体色与婚姻色, 咽齿, 肠, 鳔, 分布); FishBase 物种页 (体长, 生态类型, IUCN, 亚种);
// Catalog of Fishes (S. morii 与 S. sciistius 的处理); Li 等 2022 (Zootaxa 5141) 把华北的种群恢复为 S. sciistius;
// Kang 等 2007 (韩国 Korean Journal of Environmental Biology 25 卷 4 期) 关于朝鲜半岛种群在蚬类体内产卵的研究; 中文维基 (俗名, 模式产地).
// 学名: 原始组合为 Gobio nigripinnis Günther, 1873, 模式产地上海; FishBase 与 Catalog of Fishes 均作有效种
// Sarcocheilichthys nigripinnis (Günther, 1873). 朝鲜半岛的 S. morii Jordan & Hubbs, 1925 曾作亚种, Catalog of Fishes 现作同物异名.
// 分类学备注: FishBase 与 Catalog of Fishes 已把鮈类独立为鮈科 Gobionidae; 中国动物志和多数中文资料仍放在鲤科鮈亚科.
// 这里按较新的分类写鮈科, 与 FishBase / Catalog of Fishes 一致.
import type { SpeciesInfo, StructureId } from '../types';

export const INFO: SpeciesInfo = {
  id: 'sarconigri',
  zh: '黑鳍鳈',
  // 俗名取自中文维基 (花腰, 火烧鱼).
  zhAlt: ['花腰', '火烧鱼'],
  latin: 'Sarcocheilichthys nigripinnis',
  authority: '(Günther, 1873)',
  en: 'Rainbow gudgeon',
  taxonomy: {
    class: '辐鳍鱼纲 Actinopterygii',
    order: '鲤形目 Cypriniformes',
    family: '鮈科 Gobionidae',
  },
  // FishBase: 最大 16.0 cm TL; 常见体长 7.5 cm 为 SL, 与 TL 口径不同, 这里不填 commonLengthCm. 没有最大体重记录.
  // 来源不一致: 中文维基记最大体长 12.5 cm; 中国动物志测量的 163 尾标本体长 53–125 mm. 这里取 FishBase 的最大记录.
  size: { maxLengthCm: 16, lengthType: 'TL' },
  // 没有查到水深记录 (FishBase 未给出深度范围), 按约定填 0.
  depth: { minM: 0, maxM: 0, typical: '清澈的缓流或静水，近水底' },
  // FishBase: 淡水, 底栖-中层 (benthopelagic). 中文科普: 栖息于江河湖泊中水质清澈的流水或静水,
  // 主要吃底栖无脊椎动物和水生昆虫, 也吃少量甲壳类, 贝类, 藻类和植物碎屑.
  habitat: '生活在江河湖泊中水质清澈的缓流或静水里，在近底层活动，主要吃底栖无脊椎动物和水生昆虫幼虫，也吃少量小型甲壳类、藻类和植物碎屑。',
  // 中国动物志: 珠江, 闽江, 钱塘江, 长江, 黄河及海南, 台湾诸水系. FishBase: 中国, 台湾和朝鲜半岛.
  // Li 等 2022 与 Catalog of Fishes 已把黑龙江, 淮河, 黄河, 海河流域的种群划为 S. sciistius, 所以这里不再写黄河以北;
  // 朝鲜半岛的种群 (原 morii) 按 Catalog of Fishes 仍归本种.
  distribution: '分布于长江、钱塘江、闽江、珠江等中国中南部水系以及海南岛和台湾，朝鲜半岛的种群也归入本种；华北的种群近年已被另立为一种。',
  // FishBase 的 IUCN 栏: LC, 评估日期 2024-07-16. 中文维基仍写未评估 (NE), 已过时.
  iucn: 'LC',
  iucnYear: 2024,
  // 没有查到最大年龄, 不填 lifespan.
  // 可数性状取自中国动物志: 背鳍 iii-7, 臀鳍 iii-6, 胸鳍 i-14–15, 腹鳍 i-7, 侧线鳞 37–40, 鳃耙 5–7, 脊椎骨 4+36–37.
  // Li 等 2022 给出的侧线鳞为 38–40. 尾鳍条数没有查到.
  meristics: {
    dorsal: 'iii, 7',
    anal: 'iii, 6',
    pectoral: 'i, 14–15',
    pelvic: 'i, 7',
    vertebrae: '4 + 36–37',
    lateralLine: '37–40',
    gillRakers: '5–7',
  },
  // 游泳方式沿用鲤科通行的教科书分类, 没有查到针对黑鳍鳈的专门研究.
  swimming: {
    mode: 'subcarangiform',
    zh: '亚鲹科式',
    note: '摆动集中在身体后半段和尾柄，前半身摆幅小，推进力主要来自后部的波动和分叉的尾鳍。游泳类别是鲤科通行的教科书分类，没有查到针对黑鳍鳈的专门研究。',
  },
  summary:
    '黑鳍鳈是一种身体较细长的小型底层鱼，须已退化，体侧灰暗并杂有黑色与棕黄色的不规则斑纹，沿侧线有一条黑色纵纹，鳍色深黑。生殖期的雄鱼颊部和胸鳍基部变成橙红色，十分艳丽。',
  highlights: [
    {
      title: '火烧般的婚姻色',
      body: '生殖期的雄鱼体侧斑纹变得浓黑，颊部、颌部和胸鳍基部变成橙红色，尾鳍转黄，吻部长出许多白色珠星；雌鱼体色较淡，产卵管稍微延长。',
    },
    {
      title: '把卵产进蚬里',
      // 韩文摘要写的宿主是 엷은재첩 与 재첩, 均为蚬属 Corbicula; 只有朝鲜半岛种群的记录, 中国种群的产卵方式没有查到.
      body: '朝鲜半岛的种群被发现把卵产在两种蚬的外套腔里，受精卵的卵膜在蚬体内膨胀到约 2 倍。中国种群是否也这样产卵，目前没有查到记录。',
    },
    {
      title: '北方的种群另立门户',
      body: '过去华北和东北的鳈也被算作黑鳍鳈。2022 年的研究把它们恢复为 S. sciistius，它侧线鳞 40–42 枚，偶鳍橙红色；黑鳍鳈侧线鳞 38–40 枚，偶鳍黑褐色。',
    },
  ],
  sources: [
    'http://www.sp2000.org.cn/Fauna/fauna/detil/22686',
    'https://www.fishbase.se/summary/Sarcocheilichthys-nigripinnis.html',
    'https://researcharchive.calacademy.org/research/ichthyology/catalog/fishcatget.asp?spid=30616',
    'https://researcharchive.calacademy.org/research/ichthyology/catalog/fishcatget.asp?spid=30614',
    'https://zenodo.org/records/6598365',
    'https://doi.org/10.11646/zootaxa.5141.4.3',
    'https://db.koreascholar.com/Article/Detail/5391',
    'https://zh.wikipedia.org/zh-hans/%E9%BB%91%E9%B3%8D%E9%B3%88',
    'https://en.wikipedia.org/wiki/Rainbow_gudgeon',
    'https://www.sohu.com/a/248121024_262564',
  ],
};

// 该物种在各结构上的特例说明 (20–60 字), 会合并进结构卡片. 未注明的均取自中国动物志条目.
// 中国动物志写 "须退化, 一般仅留痕迹", 多数资料直接写 "无须", 所以不写 barbels 条目, 3D 模型按无须处理.
export const NOTES: Partial<Record<StructureId, string>> = {
  jaws: '口小，下位，呈弧形；唇薄，下唇狭长；下颌前缘的角质层较薄，口角的须退化，一般只留痕迹。',
  eye: '眼小，位于头侧上方，位置偏前，眼后的头长远大于吻长；两眼之间较宽，稍隆起。',
  skin: '体背和体侧灰暗，杂有黑色和棕黄色斑纹；鳃孔后缘有一条深黑色的垂直条纹，鳃盖后缘、峡部和胸部桔黄色。',
  scales: '体被中等大的圆鳞；背鳍前鳞 11–13 枚，围尾柄鳞 16 枚。',
  lateralLine: '侧线完全而较平直，侧线鳞 37–40 枚；沿侧线从鳃盖后上角到尾鳍基有一条黑色纵纹。',
  dorsalFin: '背鳍 iii-7，短而无硬刺，起点距吻端远小于距尾鳍基；鳍色灰黑。',
  analFin: '臀鳍 iii-6，短，起点距腹鳍基比距尾鳍基近；肛门约在腹鳍基与臀鳍起点的中点。',
  caudalFin: '尾鳍分叉，上下叶等长，末端稍圆钝；平时灰黑色，生殖期的雄鱼尾鳍转为黄色。',
  pectoralFin: '胸鳍较短小，后缘圆钝，不达腹鳍起点；生殖期雄鱼的胸鳍基部呈橙红色。',
  pelvicFin: '腹鳍黑色，起点在背鳍起点稍后方，末端可达肛门。',
  pharyngealTeeth: '下咽齿 2 行，内行 5 枚，外行 1 至 2 枚；主行最大的 2 枚侧扁，顶端尖而稍钩曲。',
  intestine: '肠管很短，只有体长的 0.8–0.9 倍，比鲤短得多；腹膜白色，略透明。',
  swimBladder: '鳔分 2 室，前室卵圆或椭圆形，后室粗长，长度为前室的 1.4–1.6 倍。',
  gills: '鳃耙不发达，甚短小，第一鳃弓外侧只有 5–7 枚。',
};
