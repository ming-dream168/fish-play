// 中华刺鳅 的图鉴资料. 数值来自 FishBase 物种页 (2026-10 抓取), Catalog of Fishes, 中国生物物种名录 (Sp2000 中国节点) 的中华刺鳅条目
// (引《河北动物志 鱼类》, 学名仍用 Mastacembelus sinensis), Shan, Li 与 Zhang 2024 (Biodiversity Data Journal, 描述新种长管华刺鳅
// S. longitubulus, 表 1 给出 57 尾中华刺鳅的计数), 以及几篇中文科普页 (刺鳅的别名, 习性与食性, 多为属一级描述).
// 学名: Catalog of Fishes 现行有效名为 Sinobdella sinensis (Bleeker, 1870), 原始组合为 Rhynchobdella sinensis Bleeker 1870, 模式产地长江;
// 曾被放进 Mastacembelus (王 1984 等), Pararhynchobdella (朱 1995), 1994 年 Kottelat 与 Lim 另立 Sinobdella 属.
// 郑 (1989) 曾把它并入 Mastacembalus aculeatus (Basilewsky 1855), 中文维基也把 Ophidium aculeatum Basilewsky 1855 列为异名; 这里按 Catalog of Fishes 处理.
// Shan 等 2024 指出该属的归属与种的界定一直有争议; 珠江流域的部分种群已被描述为新种 S. longitubulus.
// 分类阶元: Sp2000 条目仍把刺鳅科放在 刺鳅目 Mastacembeliformes, 这里按任务与 Catalog of Fishes 放在合鳃鱼目.
// IUCN 网站对抓取返回 403, 保护等级与评估日期取自 FishBase 的 IUCN 栏 (Version 2025-2): 无危 LC, 评估于 2010-08-15.
import type { SpeciesInfo, StructureId } from '../types';

export const INFO: SpeciesInfo = {
  id: 'spinyeel',
  zh: '中华刺鳅',
  // 刺泥鳅: Sp2000 俗名栏; 中华棘鳅: 中文维基; 刀鳅, 钢鳅: 刺鳅类的中文科普页与 tropicals.cn 的中华刺鳅俗名.
  zhAlt: ['刀鳅', '钢鳅', '刺泥鳅', '中华棘鳅'],
  latin: 'Sinobdella sinensis',
  authority: '(Bleeker, 1870)',
  // FishBase 没有列出英文俗名; 这里按中文名直译, 不是正式俗名.
  en: 'Chinese spiny eel',
  taxonomy: {
    class: '辐鳍鱼纲 Actinopterygii',
    order: '合鳃鱼目 Synbranchiformes',
    family: '刺鳅科 Mastacembelidae',
  },
  // FishBase: 最大 21.1 cm TL, 常见 19.0 cm SL (口径不同, 不填 commonLengthCm). 没有体重记录.
  // 一篇刺鳅科普页 (西南渔业网) 称已知最大个体超过 2500 g, 与 20 余厘米的体长不符, 而且没有指明是哪一种, 不采用.
  size: { maxLengthCm: 21.1, lengthType: 'TL' },
  // FishBase 只写 淡水, 底中层 (benthopelagic), 没有深度范围; 0 与 0 表示未知, 界面显示破折号.
  depth: { minM: 0, maxM: 0, typical: '无深度记录，多在水草丰盛的浅水区和石块下的水底' },
  // 刺鳅科普页 (酷钓鱼): 底栖, 常栖息在多水草的浅水区, 一块大石下能聚居多条; Shan 等 2024: 模式标本可能来自江西的山区溪流.
  // 百科 TA 说 (引江西水产经济动物图集): 刺鳅属 "常钻穴泥底" (属一级描述).
  habitat: '底栖的淡水小鱼，栖于河溪、湖泊和沟渠多水草的浅水区，常躲在石块下面或钻进泥底，靠细长的身体在缝隙中穿行。',
  // Catalog of Fishes: 黄河, 长江, 珠江与红河流域, 中国与越南北部; Shan 等 2024: 广布长江中下游, 淮河, 海河, 滦河种群经分子证据为同种.
  distribution: '分布于中国东部和南部的黄河、淮河、长江、珠江等水系，北到海河、滦河，南到越南北部的红河流域。',
  iucn: 'LC',
  iucnYear: 2010,
  // 背鳍硬棘与软条, 臀鳍软条, 脊椎取 Shan 等 2024 表 1 (57 尾): 背棘 31-34, 背鳍软条 54-68, 臀鳍软条 53-69, 脊椎 76-81 (腹椎 34-36).
  // Sp2000 (河北动物志) 记为背鳍硬棘 31-35, 鳍条 62-67, 臀鳍 III, 58-65, 胸鳍 22-23; 两者范围不完全一致, 河北的样本只来自滦河与海河水系.
  // 臀鳍棘 3 与胸鳍 22-23 取自 Sp2000. 尾鳍鳍条, 侧线鳞, 鳃耙没有找到针对本种的可靠计数, 不填.
  meristics: {
    dorsal: 'XXXI–XXXIV, 54–68',
    anal: 'III, 53–69',
    pectoral: '22–23',
    pelvic: '无',
    caudal: '与背、臀鳍相连',
    vertebrae: '76–81',
  },
  // 鳗鲡式是按体形与刺鳅科的一般描述归类, 没有找到针对本种的游泳研究.
  swimming: {
    mode: 'anguilliform',
    zh: '鳗鲡式',
    note: '细长的身体整条左右扭动，配合与尾鳍相连的长背鳍和臀鳍，在水草、石缝和泥底间灵活钻行。游法按体形归类，没有查到针对本种的专门研究。',
  },
  summary:
    '中华刺鳅是中国东部常见的小型底栖淡水鱼，体长 20 厘米左右，身体细长像鳗，吻端伸出一根肉质吻突，背上排着三十多枚彼此分离的硬棘，没有腹鳍，常躲在水草和石块下，以小虾为食。',
  highlights: [
    {
      title: '肉质吻突',
      // Shan 等 2024: 吻部延长成肉质的长吻突, 由上颌伸出; 中华刺鳅的管状前鼻孔短于吻突 (新种则等于或长于吻突). Sp2000: 吻尖并前伸成吻突.
      body: '吻端向前伸出一根柔软的肉质吻突，两侧各有一个管状的前鼻孔，比吻突略短。前鼻孔的长短，是它与 2024 年发表的近缘新种的区别之一。',
    },
    {
      title: '一排分离的硬棘',
      // Shan 等 2024 表 1: 背棘 31-34; Sp2000: 背鳍硬棘各自分离, 臀鳍 3 棘也分离
      body: '背鳍前方是 31 至 34 枚互不相连的短硬棘，各自竖在背中线上，后面才接上长长的软鳍；臀鳍前方也有 3 枚彼此分离的硬棘。',
    },
    {
      title: '几经改名',
      // Catalog of Fishes 与 Shan 等 2024
      body: '1870 年发表时归在 Rhynchobdella 属，后来几度改属，1994 年才独立成华刺鳅属；2024 年，珠江的部分种群又被描述为新种。',
    },
  ],
  sources: [
    'https://www.fishbase.se/summary/Sinobdella-sinensis.html',
    'https://researcharchive.calacademy.org/research/ichthyology/catalog/fishcatget.asp?spid=24192',
    'http://www.sp2000.org.cn/Fauna/fauna/detil/6367',
    'https://doi.org/10.3897/BDJ.12.e123990',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC11208772/',
    'https://zh.wikipedia.org/zh-hans/%E4%B8%AD%E5%8D%8E%E5%88%BA%E9%B3%85',
    'http://www.kudiaoyu.com/baike/10819.html',
    'https://wapbaike.baidu.com/tashuo/browse/content?id=fbc778d5a87a021876e1a523',
  ],
};

// 该物种在各结构上的特例说明 (20–60 字), 会合并进结构卡片
export const NOTES: Partial<Record<StructureId, string>> = {
  // Sp2000: 体背侧黑灰, 鳃盖后缘至尾基 30 余条黑白相间网状花纹, 腹部灰白; Shan 等 2024: 体侧多条深褐色横纹, 间隔很窄的淡黄色
  skin: '体背侧黑灰色，体侧有 30 多条深褐色横纹，间隔很窄的淡黄色，腹部灰白。',
  // Shan 等 2024 (新种的描述, 属内相同): 体被细小鳞片, 无侧线. 中华刺鳅本种的鳞与侧线没有找到单独的描述.
  scales: '全身覆盖极细小的鳞片，没有侧线；这一描述来自 2024 年同属新种的研究。',
  // Shan 等 2024 表 1; Sp2000: 硬棘各自分离
  dorsalFin: '背鳍前部是一排 31 至 34 枚短硬棘，彼此分离，不像一般鱼的背鳍那样由鳍膜连成一片。',
  // Shan 等 2024 表 1: 背鳍软条 54-68; Sp2000: 背, 臀, 尾鳍均相连
  secondDorsalFin: '硬棘之后是由 54 至 68 根软鳍条组成的长软背鳍，向后与尾鳍连成一片。',
  // Shan 等 2024: 臀鳍黑色, 远端有较宽的白边; Sp2000: 臀鳍 3 棘, 鳍棘分离.
  // 图鉴所用照片里的活体臀鳍是半透明的黄绿色网纹, 颜色个体差异大, 这里只写 "较暗"
  analFin: '臀鳍前有 3 枚分离的硬棘，软鳍部分颜色较暗，远端有一道较宽的浅色边。',
  // Sp2000: 背, 臀鳍与尾鳍均相连
  caudalFin: '尾鳍小，与背鳍和臀鳍的软鳍部分相连，形成连续的鳍缘。',
  // Sp2000: 胸鳍短小呈扇状, 具 22-23 鳍条
  pectoralFin: '胸鳍短小，呈扇形，有 22 至 23 根鳍条，是全身唯一的偶鳍。',
  // Sp2000: 口端位, 口裂伸至眼前缘下方, 上下颌具齿; Shan 等 2024: 吻突由上颌伸出
  jaws: '口在吻端，口裂伸到眼前缘下方，上颌前方伸出一根肉质吻突，上下颌都有齿。',
  // Sp2000: 眼小, 侧上位, 被透明皮膜, 无游离眼睑; 眼下有一刺
  eye: '眼小，位于头侧偏上，外覆透明皮膜；眼下方埋着一枚小刺。',
  // Shan 等 2024
  nares: '前鼻孔是一对小管，位于吻突两侧，长度比吻突短，这是区分近缘新种的依据之一。',
  // Sp2000: 前鳃盖骨有 2 刺
  operculum: '前鳃盖骨上有 2 枚小刺，加上眼下的一枚刺，头部也带着棘刺。',
  // 百科 TA 说 (引消化道研究): 消化道中只有虾类, 主要为中华锯齿米虾, 秀丽白虾与日本沼虾
  stomach: '一项消化道研究只在胃肠里找到虾，主要是中华锯齿米虾、秀丽白虾和日本沼虾。',
  // Shan 等 2024 表 1: 总脊椎 76-81, 腹椎 34-36 (新种 32-33)
  vertebrae: '脊椎骨 76 至 81 枚，其中腹椎 34 至 36 枚，比同属新种的 32 至 33 枚多。',
};
