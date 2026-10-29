// 日本沼虾 的图鉴资料. 每条说法都对过来源, 取舍的地方在字段上方写明依据.
// 主要来源: WoRMS (命名人与分类), SeaLifeBase 物种页 (生境, IUCN 栏), GBIF 的 IUCN 接口, 中英文维基 (别名, 体长, 生境, 分布, 盐度适应),
// 台湾国家生物资源研究平台 (NBRP) 科普文章 (第二步足, 泳足抱卵, 陆封型与两侧洄游型), 以及伊朗戈勒斯坦湿地的种群生长研究 (最大体长, 年龄组).
// 命名人: WoRMS 与 SeaLifeBase 都写作 (De Haan, 1849), 原组合为 Palaemon nipponensis, 故加括号.
// SeaLifeBase 与 WoRMS 都查不到本种的最大体长, 体重与寿命, 这几项取自单独的种群研究.
// 甲壳动物没有鱼类的可数性状, NOTES 留空, 结构说明由单独的甲壳动物模型提供.
import type { SpeciesInfo, StructureId } from '../types';

export const INFO: SpeciesInfo = {
  id: 'riverprawn',
  zh: '日本沼虾',
  // 中文维基: 也称青虾. 其他俗名没有找到可靠来源, 不列.
  zhAlt: ['青虾'],
  latin: 'Macrobrachium nipponense',
  authority: '(De Haan, 1849)',
  en: 'Oriental river prawn',
  taxonomy: {
    class: '软甲纲 Malacostraca',
    order: '十足目 Decapoda',
    // WoRMS: 长臂虾科 Palaemonidae, 沼虾属 Macrobrachium
    family: '长臂虾科 Palaemonidae',
  },
  // 注意: 虾的 maxLengthCm 是体长 (从额角尖端到尾节末端), 按约定 lengthType 填 TL.
  // 中文维基: 体长一般 50–90 mm. 伊朗戈勒斯坦三个湿地共 6539 尾样本, 最大全长 90–100 mm, 生长方程渐近体长雄 108 mm, 雌 91 mm;
  // 这里取实测最大值的上限 10 cm (渐近体长是推算值, 不采用). 没有找到可靠的最大体重, 不填.
  size: { maxLengthCm: 10, lengthType: 'TL' },
  // 没有查到水深记录 (SeaLifeBase 只写底栖, 淡水与半咸水, 无深度范围), 按约定填 0.
  depth: { minM: 0, maxM: 0, typical: '湖泊、河流的浅水沿岸带，水草丰盛的泥质底部' },
  // 中文维基: 喜栖息于水肥, 流缓, 水草繁茂的沿湖港湾或泥质底部, 夜间活动; SeaLifeBase: 底栖, 碎屑食性; NBRP: 杂食, 以藻类, 有机碎屑, 浮游生物为食
  habitat: '底栖的淡水虾，喜欢水草茂盛、水流平缓的湖湾和泥底，白天躲在水草和泥底间，夜里爬出来觅食藻类和有机碎屑。',
  // 英文维基: 天然分布于远东的河口三角洲与河流下游, 北起中国东北与朝鲜半岛, 南到越南与缅甸, 包括日本与台湾;
  // 已被引入伊朗, 伊拉克, 俄罗斯达吉斯坦与顿河下游, 以及保加利亚, 德国, 匈牙利等多个欧洲国家.
  distribution: '原产东亚，北起中国东北和朝鲜半岛，南到越南与缅甸，包括日本和台湾；已被引入伊朗、伊拉克和欧洲多国。',
  // 来源冲突: GBIF 的 IUCN 接口给出无危 LC (IUCN taxon ID 197726), SeaLifeBase 的 IUCN 栏 (Version 2025-2) 却写未评估 NE.
  // IUCN 网站对抓取返回 403, 评估年份无法核实, 这里按 GBIF 填 LC, 不填年份.
  iucn: 'LC',
  // 戈勒斯坦湿地样本分出 0+ 至 3+ 四个年龄组, 即野外最大约 3 至 4 龄; 没有找到更直接的寿命记录.
  lifespan: '野外样本最大 3 龄以上，约 3–4 年',
  // 鱼类的可数性状 (鳍条, 脊椎, 侧线鳞等) 不适用于甲壳动物, 留空.
  meristics: {},
  // 字段名沿用鱼类的游泳方式, 这里写的是运动方式. NBRP: 五对步足用于在水底爬行, 第 1–5 腹节各有一对泳足帮助游泳.
  // 腹部猛然弯折的弹尾逃逸是真虾类通行的教科书描述, 没有另查针对本种的运动学研究.
  swimming: {
    mode: 'pleopod swimming + tail-flip escape',
    zh: '腹肢划水与弹尾逃逸',
    note: '平时用步足在水底爬行，游动时靠腹部五对泳足前后划水；受惊时腹部和尾扇猛地向下弯折，整只虾向后弹射逃开。',
  },
  summary:
    '日本沼虾俗称青虾，是东亚淡水里最常见的虾之一，栖息在水草丰盛的湖湾和泥底。雄虾的第二对步足特别长，末端是螯；雌虾把卵抱在腹部的泳足上，长江中下游普遍人工养殖。',
  highlights: [
    {
      title: '长长的第二步足',
      // NBRP: 头胸部有五对步足, 第 2 对最长, 雄虾又比雌虾更长, 末端呈螯状, 由可动指与不动指组成, 用来夹取食物
      body: '五对步足里第二对最长，末端是钳子一样的螯，靠可动指开合夹取食物。雄虾的这对步足比雌虾的还要长。',
    },
    {
      title: '泳足抱卵',
      // NBRP: 第 1–5 腹节各有一对泳足, 雌虾用泳足抱卵, 抱卵期间不断摆动泳足, 确保卵获得足够的氧气
      body: '腹部五对泳足除了划水，对雌虾还有一个用处：抱卵。卵粘在泳足上，雌虾不停地摆动泳足给卵送水，确保它们得到足够的氧气。',
    },
    {
      title: '能在淡水里过完一生',
      // NBRP: 生活史有陆封型 (一生生活在淡水) 与两侧洄游型 (幼体期需入海) 两种; 英文维基: 幼体在 3–10‰ 以上的半咸水中存活更好,
      // 但三代之内即可完全适应淡水生活. 中文维基: 长江中下游已普遍人工育苗与养殖.
      body: '有的种群幼体要到河口半咸水中发育，也有的陆封种群一生都在淡水里完成。它三代之内就能完全适应纯淡水，长江中下游早已普遍人工育苗养殖。',
    },
  ],
  sources: [
    'https://www.marinespecies.org/aphia.php?p=taxdetails&id=587405',
    'https://www.sealifebase.se/summary/Macrobrachium-nipponense.html',
    'https://api.gbif.org/v1/species/2224515/iucnRedListCategory',
    'https://zh.wikipedia.org/zh-hans/%E6%97%A5%E6%9C%AC%E6%B2%BC%E8%99%BE',
    'https://en.wikipedia.org/wiki/Macrobrachium_nipponense',
    'https://nbrp.sinica.edu.tw/uploads/ckeditor/attachments/1632/114%E5%B9%B42%E6%9C%88%E8%B2%BC%E6%96%87.pdf',
    'https://jfisheries.ut.ac.ir/article_80271_en.html',
  ],
};

// 甲壳动物的结构说明由单独的模型 (core/crustacean) 提供, 这里不写鱼类结构的特例.
export const NOTES: Partial<Record<StructureId, string>> = {};
