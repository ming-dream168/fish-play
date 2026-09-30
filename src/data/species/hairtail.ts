// 带鱼 (日本带鱼) 的图鉴资料. 数值取自 FishBase 与 Catalog of Fishes 的种页, 台湾鱼类资料库 (邵广昭) 的形态描述,
// FAO 带鱼科识别图鉴, 以及各字段上方注明的论文. IUCN 网站对抓取返回 403, 保护等级取自 FishBase 的 IUCN 栏 (Version 2025-2), 并用 GBIF 接口交叉核对.
//
// 学名说明: 采用 Trichiurus japonicus. Catalog of Fishes (2026-09 更新) 与 FishBase 现行版本都把它列为独立有效种.
// 它过去常被并入 T. lepturus (Parin 与 Bekker 1973, Nakamura 与 Parin 1993), 中国文献又长期使用 T. haumela.
// Yi 等 2022 (ZooKeys) 用 COI 与线粒体基因组检测了中国近海 1311 尾带鱼, 其中 958 尾是 T. japonicus, 并指出 T. haumela 是它的异名,
// 而 T. lepturus 在南海很少见. 因此中国近海的带鱼主体是本种, 但 FAO 的渔获统计仍按 T. lepturus 记录, 引用统计数字时要注意这一点.
import type { SpeciesInfo, StructureId } from '../types';

export const INFO: SpeciesInfo = {
  id: 'hairtail',
  zh: '带鱼',
  // 台湾鱼类资料库: 大陆名 日本带鱼, 台湾俗名 白带, 瘦带
  zhAlt: ['日本带鱼', '白带'],
  latin: 'Trichiurus japonicus',
  authority: 'Temminck & Schlegel, 1844',
  // FishBase 的英文名是 Japanese cutlassfish. Trichiurus lepturus 才叫 Largehead hairtail, 但中国作者的英文论文常把本种也写成 largehead hairtail.
  en: 'Japanese cutlassfish',
  taxonomy: {
    class: '辐鳍鱼纲 Actinopterygii',
    order: '鲭形目 Scombriformes',
    family: '带鱼科 Trichiuridae',
  },
  // FishBase 列出 Lmax 213 cm TL, 出自 Chen 与 Lee 1982 的台湾带鱼年龄生长研究, 但 FishBase 在生长参数页自己注明:
  // Loo 与 Lmax 相差超过三分之一的记录可疑. 同一研究给出的渐近全长 Loo 是 129-133 cm TL, 这里取 133 cm 作为上限.
  // 实测样本 (Yi 等 2022 表 3, n=75, 都是南海标本) 平均全长 74.7 ± 12.8 cm. 无体重与常见体长的可靠记录, 不填.
  size: { maxLengthCm: 133, lengthType: 'TL' },
  // 台湾鱼类资料库 (2018): 栖息深度 0-200 m, 一般在 20-50 m, 常游到 150 m
  depth: { minM: 0, maxM: 200, typical: '多在 20–50 米，常到 150 米' },
  // 台湾鱼类资料库: 暖温水域中底层洄游性鱼类, 栖于泥沙或泥质的大陆架沿岸水域, 有明显的日夜垂直移动, 以小鱼和甲壳类为食.
  // Tomiyasu 等 2016 (ICES JMS): 白天聚集在近海底, 夜里分散觅食.
  habitat: '暖温性的中底层洄游鱼，栖于泥沙或泥质的大陆架水域，白天多聚在近海底，夜里散开觅食小鱼和甲壳类。',
  // Catalog of Fishes: 西北太平洋, 南海北部 (中国) 与台湾北至朝鲜半岛, 日本与萨哈林岛 (俄罗斯). 台湾鱼类资料库: 日本, 台湾, 大陆沿海至香港附近的南海.
  distribution:
    '西北太平洋，自萨哈林岛经日本，朝鲜半岛到中国的东海，台湾海域与南海北部；中国近海的带鱼过去多记作 T. lepturus 或 T. haumela，分子研究认定主体是本种。',
  // FishBase (Version 2025-2): 未评估 (NE). IUCN 红色名录把 T. japonicus 当作 T. lepturus 的异名 (GBIF 接口显示为异名),
  // T. lepturus 是无危 LC (Collette 等 2013). 本种没有单独的评估, 所以不填评估年份.
  iucn: 'NE',
  // 台湾鱼类资料库: 背鳍起于头后, 125-145 软条, 肛门位于背鳍第 40-42 根鳍条下方 (未注明硬棘数); 臀鳍完全退化成小棘, 起点在背鳍第 43-45 软条下方, 多埋在皮下;
  // 无尾鳍与腹鳍; 侧线在胸鳍上方明显下弯, 之后沿腹缘至尾端. FAO 带鱼科图鉴: 带鱼属无腹鳍与尾鳍. 椎骨数没有查到可靠来源, 不填.
  meristics: {
    dorsal: '125–145',
    anal: '退化成小棘，多埋在皮下',
    pelvic: '无',
    caudal: '无，身体末端渐细成鞭状',
    lateralLine: '单条，在胸鳍上方明显下弯，之后贴近腹缘',
  },
  // FAO 图鉴对带鱼类的运动方式只写 probably amiiform. 水族馆的直接观察 (葛西临海水族园前园长, 日本经济新闻 2014):
  // 带鱼直立时缓慢波动背鳍, 几乎不动身体. Tomiyasu 等 2016: 垂直姿势对应静止模式, 夜间觅食时转为水平的活动模式.
  swimming: {
    mode: 'amiiform',
    zh: '背鳍波动式',
    note: '静止时头朝上竖立，身体几乎不动，可见长背鳍缓慢波动；夜间觅食时转为水平游动。游泳类别取自 FAO 图鉴，对带鱼类只写可能是背鳍波动式。',
  },
  // 2020 年数字: Xiong 等 2022 (Frontiers in Marine Science) 写明 2020 年中国近海带鱼类 (Trichiurus spp.) 渔获 903,345 吨, 约占全国鱼类产量的 14%,
  // 居全国鱼类渔获第一. 舟山渔场冬汛: 新华网. 名称: 身体侧扁呈带状 (台湾鱼类资料库的形态描述).
  summary:
    '带鱼身体侧扁呈带状，故名。带鱼类是我国渔获量最高的鱼类，2020 年近海渔获约 90 万吨，东海的舟山渔场以冬汛闻名。没有鳞，没有尾鳍和腹鳍，身体末端渐细成鞭状。',
  highlights: [
    // Tomiyasu 等 2016: 用加速度记录器与录像观察, 体角大于 60 度的频率是 57.78%, 峰值在 77 度; 垂直 (60-90 度) 对应静止模式.
    // 背鳍波动: 日本经济新闻 2014 (背びれをゆっくり波打たせながら直立). 论文本身没有描述是哪些鳍在起作用.
    {
      title: '竖着游',
      body: '带鱼常头朝上竖在水中。加速度记录显示，体轴与水平面夹角超过 60 度的记录约占 58%，峰值在 77 度，这时它几乎不动。水族馆里可见它缓慢波动长背鳍。',
    },
    // 台湾鱼类资料库: 口大平直, 下颌长于上颌, 上颌前端具倒钩状大犬齿 2 对, 下颌倒钩状少于尖形齿; 性极贪食, 以小鱼及甲壳类为食.
    {
      title: '獠牙',
      body: '口大，下颌比上颌长，上颌前端有两对带倒钩的大犬齿，其余的牙侧扁而尖，排列稀疏。它性极贪食，主要吃小鱼和甲壳类。',
    },
    // 太田 1954 (日本水产学会志 19: 1061): 带鱼表皮里发亮的颗粒是日本制造仿珍珠所用珠光材料的主要来源, 鸟嘌呤是颗粒的主要成分.
    // FAO: 带鱼科无鳞. 台湾鱼类资料库: 鳞退化.
    {
      title: '银粉',
      body: '带鱼的鳞已退化，银白色来自表皮里发亮的颗粒，主要成分是鸟嘌呤。日本曾把这些颗粒提取出来，作为制造仿珍珠的珠光原料。',
    },
  ],
  sources: [
    'https://www.fishbase.se/summary/Trichiurus-japonicus.html',
    'https://www.fishbase.se/PopDyn/PopGrowthList.php?ID=69710',
    'https://researcharchive.calacademy.org/research/ichthyology/catalog/fishcatget.asp?tbl=species&genus=Trichiurus&species=japonicus',
    'https://zookeys.pensoft.net/article/71576/',
    'https://market.cloud.edu.tw/resources/web/1758167',
    'https://www.fao.org/4/ad468e/ad468eNE.pdf',
    'https://academic.oup.com/icesjms/article/73/8/2049/2198578',
    'https://www.nikkei.com/article/DGXNASDG0702M_X00C14A7000000/',
    'https://doi.org/10.2331/suisan.19.1061',
    'https://pubmed.ncbi.nlm.nih.gov/30556947/',
    'https://www.frontiersin.org/journals/marine-science/articles/10.3389/fmars.2022.1079590/full',
    'http://xczx.news.cn/2023-02/16/c_1211729294.htm',
  ],
};

// 该物种在各结构上的特例说明 (20–60 字), 会合并进结构卡片.
// 出处: 台湾鱼类资料库 (背鳍, 臀鳍, 胸鳍, 牙, 颌, 侧线, 眼), FAO 带鱼科图鉴 (腹鳍, 鳞), FishBase 属名词源 (尾鳍),
// 太田 1954 (体表), Tomiyasu 等 2016 (鳔), Yi 等 2022 表 3 (南海标本 n=75 的均值之比: 眼径 1.3 cm, 头长 8.7 cm).
export const NOTES: Partial<Record<StructureId, string>> = {
  dorsalFin: '背鳍从头后起，几乎伸到尾端，有 125 至 145 根软条；水族馆里竖立不动的带鱼，背鳍在缓慢波动。',
  caudalFin: '没有尾鳍，身体向后渐细，末端成细长的鞭状；属名 Trichiurus 在希腊语里是毛发般的尾。',
  pelvicFin: '没有腹鳍。带鱼属的腹鳍完全消失，有些近亲属还留着一枚鳞片状的小棘。',
  analFin: '臀鳍退化成许多小棘，起点在背鳍第 43 至 45 根软条下方，多数埋在皮下。',
  pectoralFin: '胸鳍很短，长在体侧偏下的位置，末端可达侧线上方。',
  teeth: '上颌前端有 2 对带倒钩的大犬齿，其余的牙侧扁而尖，排列稀疏；下颌的牙倒钩较少。',
  jaws: '口大而平直，下颌明显长于上颌，并向前突出。',
  skin: '体表没有鳞片，银白色是表皮里的鸟嘌呤颗粒，日本曾用它做仿珍珠的珠光材料。',
  scales: '鳞已退化，体表裸露；FAO 的图鉴把整个带鱼科都描述为无鳞。',
  lateralLine: '侧线在胸鳍上方明显向下弯折，之后贴着腹缘一直延伸到尾端。',
  eye: '眼睛中等大小，虹膜白色，眼径约占头长的 15%。',
  swimBladder: '鳔是细长的椭圆形，比体轴向上倾斜 3 至 4 度；鱼竖起来时回声强度明显降低。',
};
