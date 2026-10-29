// 拉氏狼牙虾虎鱼 的图鉴资料. 数值来自 FishBase 物种页 (2026-10 抓取), Eschmeyer's Catalog of Fishes, 台湾鱼类资料库,
// Murdy & Shibukawa 2003 (Zootaxa 138, 检索表引用 2001 年属的修订), 道津喜衛 1957 (九州大学农学部学艺杂志 16(1), 有明海的生态与生活史),
// Gonzales 等 2006 (J. Exp. Biol.) 与 2008 (Ichthyol. Res.; Environ. Biol. Fish.) 的摘要, Tojima 等 2025 (La mer) 的摘要, 以及日文与英文维基.
// 学名与命名人: Catalog of Fishes 与 FishBase 都作 Odontamblyopus lacepedii (Temminck & Schlegel, 1845), 原始组合为 Amblyopus lacepedii,
// 模式产地为日本肥前与大村湾. 同物异名有 Taenioides petschiliensis, Gobioides petersenii, Taenioides limboonkengi 等 (GBIF 引 Catalogue of Life).
// 与 O. rubicundus 的混淆: 旧文献曾把东亚的这些名字全部并入印度的 Gobioides rubicundus Hamilton, 1822, 道津 1957 研究有明海的
// ワラスボ 时就用 O. rubicundus 这个名字; Catalog of Fishes 记载 Wu (见 Pan 等 1991, 广东省鱼类志) 也把 petersenii 当作 rubicundus 的异名.
// Murdy & Shibukawa 2001 修订后, rubicundus 只限孟加拉湾 (印度东岸, 孟加拉, 缅甸), 东亚种群为 lacepedii; 台湾鱼类资料库仍把 rubicundus 列为异名.
// 中文早期文献里与 rubicundus 对应的"红狼牙鰕虎鱼"这个名称, 这次没有找到能直接核实的网页, 所以不放进 zhAlt.
// 中文名: Catalogue of Life (经 GBIF) 收 拉氏狼牙虾虎鱼, 拉氏狼牙鰕虎, 拉氏狼牙鰕虎魚; 台湾鱼类资料库: 台湾名 拉氏狼牙鰕虎, 大陆名 拉氏狼牙鰕虎魚, 俗名 狗甘仔.
// 科的归属: FishBase 与 GBIF 作 鰕虎科 Gobiidae 近盲鰕虎亚科 Amblyopinae; Catalog of Fishes 与日文维基作 背眼鰕虎科 Oxudercidae: Amblyopinae.
// 这里沿用 FishBase 的 Gobiidae, 与图鉴中其他鰕虎一致.
// 鳔: 查过的资料 (FishBase, 两种维基, 道津 1957, Gonzales 等的摘要) 都没有提到本种有无鳔, 所以不写 swimBladder 注释.
// FishBase 形态栏说"颏下有时有几根短须", 但 Murdy & Shibukawa 的检索表把"颏下有须"作为 O. tenuis 区别于本种的特征, 这里不提颏须.
import type { SpeciesInfo, StructureId } from '../types';

export const INFO: SpeciesInfo = {
  id: 'odontamblyopus',
  zh: '拉氏狼牙虾虎鱼',
  zhAlt: ['拉氏狼牙鰕虎鱼', '拉氏狼牙鰕虎', '狗甘仔'],
  latin: 'Odontamblyopus lacepedii',
  authority: '(Temminck & Schlegel, 1845)',
  en: 'Eel goby',
  taxonomy: {
    class: '辐鳍鱼纲 Actinopterygii',
    order: '鰕虎目 Gobiiformes',
    family: '鰕虎科 Gobiidae',
  },
  // FishBase 最大 30.3 cm SL; 道津 1957 在有明海的样本中最大为全长 375 mm 的雄鱼; 日文维基称成鱼约 40 cm 全长.
  // 按 Murdy & Shibukawa 的 SL/TL 0.808–0.850 换算, 30.3 cm SL 约合 36 至 37.5 cm TL, 与道津的记录相近. 这里取道津的实测全长.
  // 没有找到最大体重, 不填.
  size: { maxLengthCm: 37.5, lengthType: 'TL' },
  // FishBase 没有深度范围. 道津 1957 的调查地 (佐贺县鹿岛川河口干潟) 满潮水深 5 m 以下, 夏季大潮低潮时干潟露出 6 小时以上;
  // Gonzales 等 2006 称其生活在沿岸水域与潮间带泥滩. 更深的记录没有找到, 这里按调查地取 0 至 5 m.
  depth: { minM: 0, maxM: 5, typical: '潮间带至浅潮下带的软泥底' },
  habitat: '底栖穴居的近岸咸淡水鱼，在河口潮间带和浅海的软泥滩里挖出多洞口相连的深洞，退潮时躲在洞底，满潮时才出洞活动。',
  distribution: '分布于西北太平洋沿岸，从中国南部向北到朝鲜半岛、俄罗斯远东和日本南部，也见于台湾西部沿海；在日本只栖息于有明海内湾。',
  // FishBase: LC, 评估日期 2024-03-21 (Red List 版本 2025-2). 日本环境省红色名录列为易危 VU (日文维基).
  iucn: 'LC',
  iucnYear: 2024,
  // 道津 1957 由体长组成推断: 满 1 年最大全长 180 mm, 部分个体参与产卵; 产卵主群为满 2 年鱼; 寿命满 3 年. 原文自称是初步结论.
  lifespan: '约 3 年',
  // 计数来源不一, 都列出:
  // 背鳍: FishBase VI, 38–49; Murdy & Shibukawa 检索表 总鳍条 44–54; 道津 1957 有明海样本 48–51 (众数 50); 台湾鱼类资料库 VI, 42.
  // 臀鳍: FishBase I, 35–44; Murdy & Shibukawa 总鳍条 36–45; 道津 39–42 (众数 41); 台湾 41.
  // 胸鳍: Murdy & Shibukawa 2003 24–33 (平均 27.9); 道津 27–29; 台湾 30. 腹鳍: 台湾 I, 5, 愈合成漏斗状.
  // 脊椎: FishBase 30–34, 道津 33–34; Murdy & Shibukawa 检索表 尾椎 20–24. 鳃耙: 道津 第一鳃弓 4+11=15.
  // 尾鳍鳍条数只查到同属 O. rebecca 的 17 条分节鳍条, 不能套用, 不填数字.
  meristics: {
    dorsal: 'VI, 38–49（总鳍条 44–54），与尾鳍相连',
    anal: 'I, 35–44，与尾鳍相连',
    pectoral: '24–33',
    pelvic: 'I, 5，左右愈合成漏斗状吸盘',
    caudal: '长而尖，与背鳍、臀鳍以鳍膜相连',
    vertebrae: '30–34（尾椎 20–24）',
    lateralLine: '无侧线鳞；圆鳞退化，稀疏埋于皮下',
    gillRakers: '4 + 11 = 15（第一鳃弓）',
  },
  swimming: {
    mode: 'anguilliform',
    zh: '鳗鲡式',
    note: '鳗形的长身体整条左右波动，连成一片的背鳍、尾鳍和臀鳍助推，适合在洞道和软泥里钻行。',
  },
  summary:
    '拉氏狼牙虾虎鱼身体细长如鳗，活体淡红色。成鱼的眼睛退化、埋在皮下，大嘴斜向上，长着一排尖牙。它在河口泥滩里挖出多个洞口相连的深洞，退潮时躲在缺氧的洞里，靠到洞口吞气熬过低潮。',
  highlights: [
    {
      title: '眼睛藏进皮下',
      // Tojima 等 2025: 浮游期仔鱼眼随生长变大, 着底前体长增加约 2 mm 的期间眼突然退化并埋入皮下, 同时下沉到近底高浊度水层;
      // 日文维基: 仔鱼眼大而圆, 口水平, 随生长眼退化, 口转向上, 长出尖牙
      body: '刚孵出的仔鱼有一对又大又圆的眼睛，在水中漂游。临近着底时，体长只再长约 2 毫米，眼睛就突然退化并埋进皮下，嘴也转向上方，长出尖牙。',
    },
    {
      title: '泥里的地下宅',
      // 道津 1957: 调查三十余个洞穴, 泥面入口 4 至 9 个, 孔道曲折下行后汇合通往最深处竖直的居室,
      // 泥面到居室下端 50 至 90 cm, 孔径 3 至 4 cm; 六十余个居室中约一成为空, 其余各住 1 尾成鱼, 没有 2 尾以上同住的
      body: '道津喜卫在有明海挖开三十多个洞穴：泥面上有 4 至 9 个洞口，曲折的孔道汇合后通到最深处的竖直居室，距泥面 50 至 90 厘米，一洞只住一尾。',
    },
    {
      title: '在缺氧洞里吞气',
      // Gonzales 等 2006: 洞露出 1.3 小时后, 水中氧分压约 2.8 kPa 时开始在洞口呼吸空气, 每小时 7.3 ± 2.9 次 (N = 5);
      // 实验中常氧下从不吞气, 水中氧分压降到 1.0 至 3.1 kPa 时转为双模式呼吸; 空气含在口腔, 可能靠鳃换气
      body: '退潮后洞里的水越来越缺氧。野外观察到洞露出约 1.3 小时、水中氧分压降到约 2.8 千帕时，它开始到洞口吞气，平均每小时约 7 次。',
    },
  ],
  sources: [
    'https://www.fishbase.se/summary/Odontamblyopus-lacepedii.html',
    'https://researcharchive.calacademy.org/research/ichthyology/catalog/fishcatget.asp?tbl=species&genus=Odontamblyopus',
    'https://api.gbif.org/v1/species/2375857/vernacularNames',
    'https://fishdb.sinica.edu.tw/chi/species.php?science=Odontamblyopus%20lacepedii',
    'https://www.mapress.com/zootaxa/2003f/zt00138.pdf',
    'https://doi.org/10.15017/21419',
    'https://www.jstage.jst.go.jp/article/lamer/63/1-2/63_1/_article',
    'https://agris.fao.org/search/fr/records/674979ee7625988a37222d43',
    'https://repository.seafdec.org.ph/handle/10862/2078',
    'https://repository.seafdec.org.ph/handle/10862/2077',
    'https://ja.wikipedia.org/wiki/ワラスボ',
    'https://en.wikipedia.org/wiki/Odontamblyopus_lacepedii',
  ],
};

// 该物种在各结构上的特例说明 (20–60 字), 会合并进结构卡片
export const NOTES: Partial<Record<StructureId, string>> = {
  // 道津 1957: 生时体色淡红; 日文维基: 带青色, 也有灰或红紫色; 台湾鱼类资料库: 前半部圆筒形, 后部侧扁, 体粉红色
  skin: '活体多为淡红色，也有偏青灰或红紫色的个体；身体细长如鳗，前半段圆筒形，后段侧扁。',
  // FishBase: 圆鳞埋于头与体表; 道津 1957: 体表小圆鳞稀疏排列, 体前部鳞圆形, 无放射沟, 体后部鳞椭圆形, 有 3 至 4 条放射沟
  scales: '鳞片退化，细小的圆鳞稀疏地埋在皮下；体前部的鳞呈圆形，尾部的鳞呈椭圆形，有 3 至 4 条放射沟。',
  // FishBase: 背鳍 VI 棘; Murdy & Shibukawa 按总鳍条计数
  dorsalFin: '背鳍前端只有 6 枚鳍棘，后面直接接上很长的软条部，前后连续，计数时常按总鳍条算，有 44 至 54 枚。',
  // FishBase 软条 38–49; 日文维基与道津 1957: 背鳍, 尾鳍, 臀鳍以鳍膜相连
  secondDorsalFin: '背鳍软条部很长，有 38 至 49 条，几乎延伸到尾端，并以鳍膜与尾鳍连成一片。',
  // 台湾鱼类资料库: 臀鳍与背鳍同形; FishBase: I, 35–44
  analFin: '臀鳍有 1 枚鳍棘、35 至 44 条软条，形状与背鳍软条部对称，后端同样连到尾鳍。',
  // Murdy & Shibukawa 检索表: 尾鳍长, 标准长大于全长的 80% (测得 0.808–0.850); FishBase: 尾鳍长
  caudalFin: '尾鳍长而尖，与背鳍、臀鳍连成一体；体长约占全长的 81% 至 85%，其余都是尾鳍。',
  // FishBase: 胸鳍鳍条游离, 呈丝状; 台湾鱼类资料库: 胸鳍宽圆; Murdy & Shibukawa 2003: 24–33 条
  pectoralFin: '胸鳍宽圆，有 24 至 33 条鳍条；鳍条末段之间没有鳍膜相连，呈游离的丝状。',
  // 台湾鱼类资料库: 腹鳍 I, 5, 长, 愈合成长漏斗状; 日文维基: 腹鳍成吸盘; Tojima 等 2025: 着底前腹鳍迅速发育
  pelvicFin: '左右腹鳍各有 1 枚鳍棘、5 条软条，愈合成长漏斗状的吸盘；仔鱼在着底前腹鳍迅速长成。',
  // 日文维基: 上向的大口里排着尖牙, 外形像电影《异形》, 被宣传为"外星人鱼"; 据说被咬并不太痛
  teeth: '大嘴斜向上，颌上排着一列弯曲的尖牙，模样像电影里的异形；不过据说被它咬到并不太痛。',
  // FishBase: 眼退化但可辨, 覆皮; 日文维基: 头上只剩小点; Tojima 等 2025: 着底前突然退化并埋入皮下
  eye: '成鱼的眼只是头上两个小点，埋在皮下；仔鱼原本眼大而圆，着底前体长再长约 2 毫米间就突然退化。',
  // Gonzales 等 2008 (Environ. Biol. Fish.): 鳃无明显适应空气呼吸的变化; 鳃盖内壁距表面 10 µm 内毛细血管密度 14.5 ± 3.0 /mm,
  // 不呼吸空气的斑尾刺鰕虎鱼 Acanthogobius hasta 为 0, 弹涂鱼 Periophthalmus modestus 为 59.1
  operculum: '没有专门的呼吸空气器官，空气含在口腔和鳃腔里；鳃盖内壁毛细血管较多，介于普通鰕虎和弹涂鱼之间。',
  // 道津 1957: 全长 30 mm 稚鱼肠只有一个回转; 随生长伸长并复杂回转; 全长 330 mm 成鱼消化道约为头体长的 2.5 倍
  intestine: '稚鱼的肠只有一个弯，长大后伸长并多次盘曲；全长 33 厘米的成鱼，消化道约为头体长的 2.5 倍。',
  // 道津 1957: 成熟精巢白色带状, 后端没有鰕虎鱼类常见的贮精囊; 卵巢内卵数 6,735 至 35,819; 有明海产卵期 6 至 9 月
  gonad: '雄鱼精巢白色带状，没有一般鰕虎精巢后端的贮精囊；雌鱼卵巢含卵约 6700 至 36000 粒，6 至 9 月产卵。',
};
