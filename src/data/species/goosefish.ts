// 黄鮟鱇 的图鉴资料. 数值取自 FishBase 与 Catalog of Fishes 的种页, FishBase 鮟鱇科页, 以及各字段上方注明的论文.
// IUCN 网站对抓取返回 403, 保护等级取自 FishBase 的 IUCN 栏 (Version 2025-2), 并用 GBIF 接口与 IUCN 的 DOI 记录交叉核对.
//
// 出处说明: 黄鮟鱇本种的形态与行为观察很少, 多数结构细节取自同属的大西洋种.
// Bigelow 与 Schroeder 1953 (Fishes of the Gulf of Maine, 美洲鮟鱇 Lophius americanus, 引用了对欧洲鮟鱇的水族馆观察) 是最详细的公开描述.
// 凡是来自它的说法, 文字里都写明同属或同科, 不当作黄鮟鱇本种的测量值.
import type { SpeciesInfo, StructureId } from '../types';

export const INFO: SpeciesInfo = {
  id: 'goosefish',
  zh: '黄鮟鱇',
  // 别名取自中文维基百科条目 (引用李明德与张洪杰 1991 渤海鱼类生物学第 99 页), 未在一手资料中核对
  zhAlt: ['老头鱼', '结巴鱼'],
  latin: 'Lophius litulon',
  authority: '(Jordan, 1902)',
  en: 'Yellow goosefish',
  // 原始组合是 Lophiomus litulon Jordan, 1902 (Catalog of Fishes), 所以作者加括号. FishBase 归入鮟鱇目 Lophiiformes.
  taxonomy: {
    class: '辐鳍鱼纲 Actinopterygii',
    order: '鮟鱇目 Lophiiformes',
    family: '鮟鱇科 Lophiidae',
  },
  // FishBase: 最大 150 cm SL (Masuda 等 1984), 成熟体长 Lm 52.7 cm (39-63 cm). FishBase 的最大体重 3.5 kg 来自东海一份小样本的体长体重关系
  // (Chen 等 2020), 与 150 cm 不匹配, 不能当作种的最大体重, 所以不填. 常见体长没有查到来源.
  size: { maxLengthCm: 150, lengthType: 'SL' },
  // FishBase 深度 25-560 m
  depth: { minM: 25, maxM: 560 },
  // FishBase: 泥沙底, 底栖 (bathydemersal), 主要吃鱼, 磷虾, 箭虫和虾. Zhang 等 2022 (Frontiers in Marine Science) 黄海调查:
  // 底温 5.8-10.6 °C, 水深 > 18 m, 底盐 31.0-33.2 时数量最多.
  habitat: '底栖，栖于泥沙质的海底，捕食鱼，磷虾，箭虫和虾；黄海调查中底温 5.8 至 10.6 °C 时数量最多。',
  // Catalog of Fishes: 鄂霍次克海, 日本海, 朝鲜半岛, 中国北部, 台湾东北部. FishBase: 日本, 朝鲜半岛, 黄海与东海.
  // Zhang 等 2022: 资源集中在黄海中部 (34-37 N, 121-124 E), 冬季渔获最集中, 评估范围是黄海与渤海.
  distribution: '西北太平洋，从鄂霍次克海，日本海，日本和朝鲜半岛沿岸，到中国的渤海，黄海和东海，其中以黄海中部数量最多。',
  // FishBase: 数据缺乏 DD, 评估日期 2019-08-12. IUCN 红色名录 2020-1 版, 评估者 Ho, H.
  iucn: 'DD',
  iucnYear: 2019,
  // FishBase 与 Catalog of Fishes 没有给出黄鮟鱇本种的鳍条数和椎骨数. 下面是 FishBase 鮟鱇科页给出的科或属一级范围, 字符串里已注明.
  meristics: {
    dorsal: '第二背鳍 8–12（鮟鱇科）',
    anal: '6–10（鮟鱇科）',
    vertebrae: '26–31（鮟鱇属）',
  },
  // 没有黄鮟鱇的游泳方式记录. Bigelow 与 Schroeder 1953 引用的水族馆观察 (欧洲鮟鱇): 游得很慢, 用成对的鳍在海底行走.
  // 这不是 Lindsey 分类里的标准类型, 是描述性说法.
  swimming: {
    mode: 'paired-fin walking',
    zh: '偶鳍步行式',
    note: '大多伏在海底不动，游得很慢，移动时用臂状的胸鳍和腹鳍在海底撑着走，这是对同属大西洋鮟鱇的观察。',
  },
  // FishBase: 肝在日本被视为珍馐 (Ref. 47220), 也用于中药. Zhang 等 2022: 黄鮟鱇在山东近海渔获中的比重与经济价值近年上升,
  // 是国内鱼市常见种和主要出口鱼产品之一; BSM 与 AMSY 模型显示山东近海 (黄海与渤海) 的种群近年被过度捕捞. 评估范围只到山东近海, 所以摘要不写成整个黄海.
  summary:
    '黄鮟鱇是黄海和东海的底栖大鱼。鮟鱇类身体扁平，头大口宽，靠头顶的钓竿引诱猎物。它的肝在日本被视为珍馐，近年在山东近海渔获中的比重上升，但 2022 年的资源评估认为山东近海的种群已被过度捕捞。',
  highlights: [
    // Bigelow 与 Schroeder 1953: 第一背鳍棘顶端有一片不规则的叶状皮瓣, 在水族馆里平时伏在头顶, 猎物靠近时竖起, 可前后抖动;
    // 触碰饵球不会引起咬合反射, 说明靠视觉取食. Baker 等 2019 与 Miya 等 2010: 发光的饵球是深海角鮟鱇亚目 (Ceratioidei) 的特征.
    // 没有查到任何一手资料直接写明鮟鱇科不发光, 所以文字只写观察到的诱饵方式和发光饵球的分布.
    {
      title: '钓竿',
      body: '鮟鱇类的第一背鳍棘移到吻背，成了细长的钓竿。同属鮟鱇的钓竿顶端是一片叶状皮瓣，平时伏在头顶，猎物靠近才竖起，在口前来回抖动；会发光的饵球见于深海的角鮟鱇类。',
    },
    // Bigelow 与 Schroeder 1953: 口朝上, 下颌突出, 牙细长而弯, 全部朝喉咙倾斜; 能吞下几乎和自己一样大的鱼,
    // Fulton 在一条 26 英寸 (66 cm) 的英国鮟鱇胃里发现 23 英寸 (58 cm) 的 codling (小鳕). 牙能倒伏与猎物只进不出的说法, 一手资料里只有牙朝喉咙倾斜这一条描述, 没有写进文字.
    {
      title: '大嘴',
      body: '鮟鱇属口巨大，朝上开，下颌突出，牙细长而弯，全朝喉咙内倾，能吞下几乎和自己一样大的鱼：一条 66 厘米长的英国鮟鱇，胃里有 58 厘米长的小鳕。',
    },
    // Bigelow 与 Schroeder 1953: 胸鳍基部是由伸长的腕骨形成的臂 (每臂两块骨), 水族馆里欧洲鮟鱇游得很慢, 用成对的鳍在海底行走;
    // 腹鳍约 5 根粗鳍条, 长在头的下面, 远在胸鳍之前.
    {
      title: '用鳍走路',
      body: '鮟鱇科的胸鳍基部由伸长的腕骨撑成粗壮的肉臂，每条臂只有两块骨头。水族馆里的同属鮟鱇游得很慢，常用胸鳍和腹鳍撑着海底行走，它们的腹鳍长在头的腹面，位于胸鳍之前。',
    },
  ],
  sources: [
    'https://www.fishbase.se/summary/Lophius-litulon.html',
    'https://www.fishbase.se/summary/FamilySummary.php?ID=190',
    'https://researcharchive.calacademy.org/research/ichthyology/catalog/fishcatget.asp?tbl=species&genus=Lophius&species=litulon',
    'https://doi.org/10.2305/IUCN.UK.2020-1.RLTS.T135438843A136910148.en',
    'https://cybrary.friendsofmerrymeetingbay.org/fgom/Lophius_americanus.htm',
    'https://cybrary.friendsofmerrymeetingbay.org/fgom/Lophiidae.htm',
    'https://doi.org/10.3389/fmars.2022.759591',
    'https://doi.org/10.1038/s41598-025-32075-x',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC2836326/',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC6773444/',
    'https://zh.wikipedia.org/wiki/%E9%BB%84%E9%AE%9F%E9%B1%87',
  ],
};

// 该物种在各结构上的特例说明 (20–60 字), 会合并进结构卡片.
// 写同属的, 出自 Bigelow 与 Schroeder 1953 对美洲鮟鱇 (以及其中引用的欧洲鮟鱇水族馆观察) 的描述; 写鮟鱇科的, 出自该书科一级的描述或 FishBase 鮟鱇科页;
// 椎骨数出自 FishBase 鮟鱇科页; 卵幕出自 Ishikawa 等 2025 对黄鮟鱇的研究; 肝与药用, 食性出自 FishBase 种页.
export const NOTES: Partial<Record<StructureId, string>> = {
  illicium: '第一根背鳍棘长在吻背上，平时伏在头顶，猎物靠近才竖起并前后抖动。这是对同属鮟鱇的观察。',
  esca: '同属鮟鱇的饵球是钓竿顶端一片不规则的叶状皮瓣，靠视觉取食；碰一下饵球并不会引起咬合。',
  jaws: '同属的美洲鮟鱇口朝上开，下颌比上颌突出得多，闭口时下颌大部分牙仍露在外面。',
  teeth: '同属鮟鱇的牙细长而弯，全朝喉咙倾斜，大鱼的牙可长到约 2.5 厘米；口盖上还有几排刺状小牙。',
  pectoralFin: '鮟鱇科的胸鳍基部是粗厚的肉质臂，由伸长的腕骨构成，每条臂只有两块骨头。',
  pelvicFin: '同属鮟鱇的腹鳍长在头的腹面，远在胸鳍之前，粗厚多肉；卧底时用它向前外方铲沙。',
  skin: '同属鮟鱇的皮肤光滑无鳞；鮟鱇科的下颌，头侧和体侧都缀着小皮瓣。',
  operculum: '鮟鱇科的鳃孔缩成胸鳍腋下的小孔；同属的美洲鮟鱇没有多数硬骨鱼那样的鳃盖。',
  eye: '同属的美洲鮟鱇眼长在头顶，朝向上方；鮟鱇科的头大多宽而扁。',
  stomach: '同属鮟鱇的胃里装下约占体重一半的食物并不稀奇；黄鮟鱇主要吃鱼，磷虾，箭虫和虾。',
  liver: '黄鮟鱇的肝在日本被视为珍馐；这种鱼也被记载用于中药。',
  gonad: '黄鮟鱇产漂浮的带状胶质卵幕，每个胶质小室里包着 1 至 3 枚卵。',
  vertebrae: '鮟鱇属有 26 至 31 节椎骨，明显多于科内其他属的 18 或 19 节。',
  dorsalFin: '同属的美洲鮟鱇头上有 3 根细棘，其后的第一背鳍有 3 根棘，第二背鳍在躯干后部，有 10 至 11 根鳍条。',
};
