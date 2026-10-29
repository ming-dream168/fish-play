// 子陵吻鰕虎鱼 的图鉴资料. 每条说法都对过来源, 取舍的地方在字段上方写明依据.
// 主要来源: 中国动物主题数据库 (中科院动物所) 的子陵吻虾虎鱼条目, 摘自《中国动物志 硬骨鱼纲 鲈形目 (五) 虾虎鱼亚目》
// (伍汉霖, 钟俊生等 2008; 可数性状, 头部感觉管孔, 齿, 鳞, 繁殖, 名称由来, 分布);
// Eschmeyer's Catalog of Fishes 的 Rhinogobius similis 条目 (学名, 同物异名, 科的归属, 分布);
// FishBase 的 R. giurinus 与 R. similis 两个物种页 (体长, 体重, 生态类型, IUCN, 日本标本的可数性状);
// 台湾鱼类资料库的 R. similis 条目 (陆封型与两侧洄游型, 英文俗名); 中文与英文维基 (别名, 引入地).
// 学名的取舍: 中国文献 (包括中国动物志) 一直用 Rhinogobius giurinus (Rutter, 1897), 模式产地为广东汕头.
// Suzuki, Shibukawa, Senou 与 Chen 2015 重新描述了属的模式种 R. similis Gill, 1859 并指定新模 (产地日本静冈县下田),
// 把 giurinus 列为它的次异名; Catalog of Fishes 记该处理已被 Suzuki 等 2017, Parenti 2021, Maeda 等 2024,
// Matsunuma 等 2026 沿用, 现行有效名为 R. similis; FishBase 的 giurinus 页也已标为 similis 的异名, 台湾鱼类资料库
// 于 2018 年改用 similis 并注明大陆称子陵吻鰕虎鱼. 所以这里用 R. similis Gill, 1859 (原组合即 Rhinogobius, 命名人不加括号).
// 注意: Catalog of Fishes 也提醒这个名字下 "可能不止一个物种", 中国大陆种群与日本新模是否完全同种仍有讨论余地.
// 科的归属: FishBase 放在鰕虎鱼科 Gobiidae 的 Gobionellinae 亚科;
// Catalog of Fishes 采用较新的方案, 把 Gobionellinae 移入 Oxudercidae. 这里按任务给定写 Gobiidae.
import type { SpeciesInfo, StructureId } from '../types';

export const INFO: SpeciesInfo = {
  id: 'rhinogobius',
  zh: '子陵吻鰕虎鱼',
  // 别名取自中文维基与台湾鱼类资料库 (台湾称极乐吻鰕虎, 俗称苦甘仔); 旧学名 Rhinogobius giurinus 见文件头
  zhAlt: ['极乐吻鰕虎', '栉鰕虎', '子陵栉鰕虎鱼', '朝天眼', '苦甘仔'],
  latin: 'Rhinogobius similis',
  authority: 'Gill, 1859',
  // 台湾鱼类资料库的英文俗名
  en: 'Barcheek goby',
  taxonomy: {
    class: '辐鳍鱼纲 Actinopterygii',
    order: '鰕虎目 Gobiiformes',
    family: '鰕虎鱼科 Gobiidae',
  },
  // FishBase (giurinus 页): 最大 12.1 cm TL, 最大体重 14.9 g. 体重换算成 kg 只有 0.0149, 界面按 0.1 kg 精度显示会变成 0, 故不填.
  // 来源不一致: FishBase (similis 页, 以日本标本为主) 写最大 10 cm TL; 台湾鱼类资料库写最大 8 cm;
  // 中国动物志测量标本体长 28–114 mm, 文中另有 "体长 80–120 mm, 大者可达 130 mm" 的说法, 与同段 "80 mm 以上的 4 龄鱼很少见" 矛盾.
  // 这里取 FishBase 的 12.1 cm TL.
  size: { maxLengthCm: 12.1, lengthType: 'TL' },
  // FishBase 没有深度范围. maxM 为 0 时界面显示破折号; 这里的 0 与 0 只是占位, 不是测量值.
  // 中国动物志: 栖息于沿岸浅滩和石砾间, 产卵场水深 1–3 m.
  depth: { minM: 0, maxM: 0, typical: '沿岸浅滩与石砾间，产卵场水深 1–3 米' },
  // 中国动物志: 常散居于石缝或在石下挖穴, 常在水底匍匐游动, 伺机掠食; 领域性强. 腹鳍愈合成吸盘.
  habitat:
    '典型的底栖小鱼，栖息于江河中下游、湖泊、水库和池塘的沿岸浅滩与石砾间，靠腹鳍愈合成的吸盘伏在石头和沙底上，常躲在石缝或石下挖穴，领域性强，伺机捕食小鱼、虾和水生昆虫。',
  // 中国动物志: 除西北地区以外的各大江河水系, 海南及台湾均有, 国外见于日本和朝鲜半岛.
  // Catalog of Fishes: 日本, 俄罗斯滨海边疆区, 朝鲜半岛, 台湾, 中国, 越南; 可能引入新加坡, 已引入菲律宾吕宋.
  // 中文维基: 青藏高原和云南的种群属引入.
  distribution:
    '广布东亚，在中国除西北地区外的各大江河水系都有，海南和台湾也有；国外见于日本、朝鲜半岛、俄罗斯远东和越南北部，已被引入菲律宾吕宋等地。',
  // FishBase (giurinus 页) 的 IUCN 栏: LC, 评估日期 2010-08-10 (英文维基引用的 Huckstorf 评估, 2012 年发布).
  // 这次评估是以旧学名 R. giurinus 做的, 覆盖的正是中国的种群; 以 R. similis 为名则 FishBase 与 Catalog of Fishes 都记为未评估 (NE).
  // 这里沿用 giurinus 的评估结果.
  iucn: 'LC',
  iucnYear: 2010,
  // 中国动物志: 产卵群体以 2 龄鱼为主, 另有少量 3 龄鱼, 80 mm 以上的 4 龄鱼很少见. 没有查到确切的最大年龄.
  lifespan: '多为 2–3 龄，4 龄鱼很少见',
  // 可数性状取自中国动物志 (中国标本): 背鳍 VI, I-8–9; 臀鳍 I-8–9; 胸鳍 20–21; 腹鳍 I-5; 尾鳍 2+18+4 (照录原文);
  // 纵列鳞 27–30, 横列鳞 10–11, 背鳍前鳞 11–13; 鳃耙 2+6–7; 椎骨 26 (腹椎与尾椎 11+15 的拆分取自 FishBase).
  // 鰕虎类体侧没有侧线管 (中国动物志: "无侧线"), 所以 lateralLine 一栏填的是纵列鳞数, 不是侧线鳞.
  // 来源不一致: FishBase (similis, 日本新模系列) 记臀鳍 I, 8, 胸鳍 18–19, 纵列鳞 29–31, 椎骨 26 (11+15);
  // 台湾鱼类资料库记臀鳍 I, 10, 胸鳍 19, 纵列鳞 30–34.
  meristics: {
    dorsal: 'VI; I, 8–9',
    anal: 'I, 8–9',
    pectoral: '20–21',
    pelvic: 'I, 5（左右愈合成吸盘）',
    caudal: '2 + 18 + 4',
    vertebrae: '26（11 + 15）',
    lateralLine: '无侧线；纵列鳞 27–30',
    gillRakers: '2 + 6–7',
  },
  // 没有查到针对本种游泳运动学的研究. 中国动物志只写 "常在水底匍匐游动, 伺机掠食"; 英文术语按底栖鰕虎类的一般描述填写.
  swimming: {
    mode: 'burst-and-perch',
    zh: '停栖冲刺式',
    note: '平时用腹鳍吸盘和宽大的胸鳍撑在水底，不在水中持续游动；移动时尾部一摆，向前短促冲出一段又落回水底，伺机扑食。没有查到针对本种的游泳研究。',
  },
  summary:
    '子陵吻鰕虎鱼是中国淡水里最常见的小型鰕虎，腹鳍愈合成吸盘，常伏在浅滩石头上。它本是河海洄游鱼，也能在水库、湖泊里陆封繁衍；中国文献习用学名 R. giurinus，现多改用 R. similis。',
  highlights: [
    {
      title: '名字来自严子陵',
      // 中国动物志: 6–9 月幼鱼结群沿钱塘江上溯, 在严子陵钓鱼台附近形成鱼汛, 故得名; 干品称子陵鱼干; 江西庐山产的干品称庐山石鱼
      body: '每年 6 至 9 月，幼鱼成群沿钱塘江上溯，在严子陵钓鱼台附近形成鱼汛，因此得名。晒成的 “子陵鱼干” 是当地名产，庐山出产的干品叫 “庐山石鱼”。',
    },
    {
      title: '洄游也能陆封',
      // 中国动物志: 原属河海洄游鱼类, 也可在水库以上的溪流, 湖泊, 野塘中形成陆封群体; 幼鱼有浮游期, 部分顺流入海, 2–3 个月后再溯河.
      // 台湾鱼类资料库: 有陆封型与两侧洄游型两种生活史.
      body: '它原本是河海洄游鱼：孵出的仔鱼有浮游期，部分顺流入海，两三个月后再溯河回到淡水。但它也能在水库、湖泊和池塘里形成陆封群体，一生不下海。',
    },
    {
      title: '雄鱼清扫产卵窝',
      // 中国动物志: 产卵场为砂砾底, 水深 1–3 m; 产卵前雄鱼用胸鳍和腹鳍清扫出直径 10–15 cm 的圆形产卵窝; 卵橙黄色, 直径 0.5–0.6 mm, 有黏丝
      body: '产卵前，雄鱼用胸鳍和腹鳍在砂砾上清扫出直径 10 至 15 厘米的圆形产卵窝，干净得从水面就能看见。卵橙黄色，直径约半毫米，靠黏丝附在石砾上孵化。',
    },
  ],
  sources: [
    'http://www.zoology.csdb.cn/taxon/%7BDE0CDD5B-69B3-4AAD-8688-FD99BEAC00F1%7D',
    'https://researcharchive.calacademy.org/research/ichthyology/catalog/fishcatget.asp?tbl=species&genus=Rhinogobius&species=similis',
    'https://www.fishbase.se/summary/Rhinogobius-giurinus.html',
    'https://www.fishbase.se/summary/Rhinogobius-similis.html',
    'https://fishdb.sinica.edu.tw/chi/species.php?science=Rhinogobius%20similis',
    'https://zh.wikipedia.org/zh-hans/%E5%AD%90%E9%99%B5%E5%90%BB%E9%B0%95%E8%99%8E%E9%B1%BC',
    'https://en.wikipedia.org/wiki/Rhinogobius_giurinus',
    'https://en.wikipedia.org/wiki/Gobiidae',
    'https://www.biorxiv.org/content/10.1101/2023.07.27.550194',
  ],
};

// 该物种在各结构上的特例说明 (20–60 字), 会合并进结构卡片
// 除另行注明外, 均取自中国动物志 (经中国动物主题数据库).
export const NOTES: Partial<Record<StructureId, string>> = {
  skin: '头体黄褐色，体侧有 6 至 7 个宽而不规则的黑色横斑；眼前方有约 5 条黑褐色蠕虫状条纹。',
  scales: '体被中大栉鳞，吻部、颊部和鳃盖无鳞；项部有 11 至 13 枚背鳍前鳞，向前伸到眼间隔后方。',
  lateralLine: '体侧没有侧线管；头部有感觉管孔，眼下有 5 至 6 条放射状感觉乳突线，颊部有 2 纵行。',
  dorsalFin: '第一背鳍有 6 根柔软的鳍棘，第三、第四棘最长，平放时几乎伸到第二背鳍起点。',
  secondDorsalFin: '第二背鳍有 1 棘 8 至 9 根鳍条，比第一背鳍略高，后部鳍条较长，平放时不达尾鳍基。',
  analFin: '臀鳍与第二背鳍上下相对、形状相同，起点在第二背鳍第二、第三鳍条的下方。',
  pectoralFin: '胸鳍宽大而圆，鳍条 20 至 21 根；鳍基上端有 1 个黑斑点。产卵前雄鱼也用它清扫产卵窝。',
  pelvicFin: '左右腹鳍愈合成一个吸盘，膜盖发达，边缘深凹；雄鱼的腹鳍末端可以伸到肛门。',
  // 别名 "朝天眼" 见中文维基
  eye: '眼中大，长在头背侧，上缘突出于头的背缘，所以俗称 “朝天眼”。',
  teeth: '上下颌各有 2 行细小尖锐的齿，外行齿稍大，没有犬齿；犁骨、腭骨和舌上都没有齿。',
  gonad: '体长 25 至 28 毫米的 1 龄鱼就能性成熟；2 龄雌鱼每次怀卵 810 至 900 粒。',
  // 没有查到本种成鱼鳔的解剖记载. Oto 与 Watanabe 的 bioRxiv 预印本 (2023) 记录同亚科 Gymnogobius 仔鱼孵出 3 天内鳔已充气.
  swimBladder: '没有查到本种成鱼鳔的解剖记载；同亚科的 Gymnogobius 仔鱼孵出 3 天内鳔就已充气。',
};
