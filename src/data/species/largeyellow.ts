// 大黄鱼 Larimichthys crocea 的图鉴资料.
// 形态数值以中文分类专著的转述页为主 (百度百科大黄鱼词条, 南海水产研究所页面), 用 FishBase 交叉核对, 古籍引文来自维基文库的本草纲目.
// IUCN 网站对抓取返回 403: 保护等级取自 FishBase 的 IUCN 栏 (Version 2025-2), 并用 GBIF 接口核对;
// 评估日期取自 Crossref 上该评估 DOI 的记录 (评估日 2016-06-30, 2020-1 版发布), iucnYear 按评估年份填.
// 声音只写定性描述, 没有主频, 脉冲率等数值.
import type { SpeciesInfo, StructureId } from '../types';

export const INFO: SpeciesInfo = {
  id: 'largeyellow',
  zh: '大黄鱼',
  zhAlt: ['黄花鱼', '大黄花', '大鲜'],
  latin: 'Larimichthys crocea',
  authority: '(Richardson, 1846)',
  en: 'Large yellow croaker',
  taxonomy: {
    class: '辐鳍鱼纲 Actinopterygii',
    // 目: 英文与中文维基 (据 Fishes of the World 第 5 版) 归入刺尾鲷目; FishBase 写 Eupercaria/misc, 中文教材多沿用鲈形目
    order: '刺尾鲷目 Acanthuriformes',
    family: '石首鱼科 Sciaenidae',
  },
  // FishBase: 最大 80 cm TL. 南海水产研究所页面: 最大个体全长 755 mm, 重 3.8 kg (FishBase 的最大重量 243.6 g 是样本值, 不用).
  // 常见体长没有可靠的一手数据, 不填 commonLengthCm.
  size: { maxLengthCm: 80, maxWeightKg: 3.8, lengthType: 'TL' },
  // FishBase 深度 0-120 m; 中文资料多写 80 m 以内 (南海水产研究所) 或 60 m 以内 (百度百科)
  depth: { minM: 0, maxM: 120, typical: '多在 80 米以内的中下层' },
  habitat: '暖温性近海鱼类，成群洄游，多在 80 米以内的中下层活动，喜浑浊水域和泥质或泥沙质海底，繁殖季进入河口和岛屿内湾的浅水。',
  distribution: '西北太平洋，主要在黄海中南部，东海，台湾海峡和南海北部沿海，朝鲜半岛西岸也有分布。',
  // FishBase: CR (A2bd), 评估日期 2016-06-30; GBIF 的 IUCN 类别同为 CR
  iucn: 'CR',
  iucnYear: 2016,
  // 南海水产研究所: 东海北部与中部群最高龄 29 龄; 百度百科: 最高约 30 龄; Ecology and Evolution 2022 (PMC9526033):
  // 1960 年代最高 21 龄, 近年约 6 龄
  lifespan: '历史记录最长 21–30 年，近年渔获中最长约 6 年',
  // 背鳍: 百度百科 9-10 棘, 31-34 软条 (公式写作 VIII-IX + I, 31-32), FishBase 9-10 棘, 30-35 软条
  // 臀鳍: 百度百科 II, 8-9; FishBase 软条 7-9, 通常 8
  // 胸鳍: 百度百科 15-16, 药材页 15-17; 腹鳍 I, 5; 尾鳍 17 (百度百科)
  // 脊椎: 南海水产研究所 26-27, 有时 25; FishBase 25-26
  // 侧线鳞: 百度百科 56-57, 南海水产研究所 56-58; 鳃耙: 百度百科 8-9 + 16-19
  meristics: {
    dorsal: 'IX–X, 31–34',
    anal: 'II, 8–9',
    pectoral: '15–17',
    pelvic: 'I, 5',
    caudal: '17',
    vertebrae: '25–27',
    lateralLine: '56–58',
    gillRakers: '8–9 + 16–19',
  },
  // 没有 FishBase 或文献给出的游泳型记录, 按体型 (延长侧扁, 尾柄细长) 归类
  swimming: {
    mode: 'subcarangiform',
    zh: '亚鲹科式',
    note: '身体延长侧扁，尾柄细长，尾鳍呈楔形；按体型归入亚鲹科式，摆动集中在后半身和尾柄。',
  },
  summary:
    '传统四大海产之一，体色金黄，头里有一对大耳石。1950 年代的敲罟，后来围捕产卵群与越冬群，再加上大量捕捞幼鱼，使野生种群在 1980 年代前后崩溃，现列为极危。',
  highlights: [
    {
      title: '石首鱼的耳石',
      body: '古称石首鱼，头里有一对白石般的耳石。成鱼的矢耳石长约 1.5 至 2 cm，《本草纲目》说它莹洁如玉，入药称鱼脑石。',
    },
    {
      title: '鳔是一面鼓',
      body: '鳔两侧的声肌收缩，压迫内脏使鳔共振发声。生殖季节鱼群发出咯咯声和呜呜声，渔民早就凭它判断鱼群的大小与位置。',
    },
    {
      title: '带分支的鳔',
      body: '鳔前端圆钝，后端尖长，两侧各有 31 至 33 条侧肢；每条分出背支和腹支，腹支末端的前后两小枝等长。干制后是名贵的鱼肚。',
    },
  ],
  sources: [
    'https://www.fishbase.se/summary/Larimichthys-crocea.html',
    'https://scsfri.ac.cn/info/1347/6872.htm',
    'https://baike.baidu.com/item/%E5%A4%A7%E9%BB%84%E9%B1%BC/470064',
    'http://www.zhongyaocai360.com/Y/yunaoshi.html',
    'https://zh.wikisource.org/wiki/%E6%9C%AC%E8%8D%89%E7%B6%B1%E7%9B%AE/%E9%B1%97%E4%B9%8B%E4%B8%89',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC9526033/',
    'https://m.thepaper.cn/newsDetail_forward_4618192',
    'https://doi.org/10.2305/IUCN.UK.2020-1.RLTS.T49182559A49239394.en',
  ],
};

// 该物种在各结构上的特例说明 (20–60 字), 会合并进结构卡片
export const NOTES: Partial<Record<StructureId, string>> = {
  otoliths: '略呈盾形，腹面有蝌蚪形印迹，背面近外侧有一群颗粒状突起，断面可见生长纹。',
  swimBladder: '鳔大而前圆后尖，两侧有 31 至 33 对侧肢；干制后即鱼肚，也可熬制黄鱼胶。',
  sonicMuscle: '声肌在鳔的两侧。《本草纲目》引《游览志》：海人以竹筒探水底，闻其声乃下网。',
  lateralLine: '侧线完整，前段稍弯，后段平直居中，一直伸到尾鳍末端。',
  scales: '头和体前部为圆鳞，后部为栉鳞；体侧下部每片鳞下有一个金黄色皮腺体。',
  dorsalFin: '背鳍连续，棘部与软条部之间有一道深缺刻；共 9 至 10 根棘，第 3 棘最长。',
  analFin: '臀鳍起点在背鳍第 16 软条下方，有 2 根棘和 8 至 9 条软条，第 2 棘长约等于眼径。',
  caudalFin: '尾鳍尖长，整体稍呈楔形，不分叉；鳍面上盖有小圆鳞。',
  pectoralFin: '胸鳍尖长，鳍色为黄色；基部上端的后方有一个黑斑。',
  pelvicFin: '腹鳍较小，起点稍后于胸鳍基部，位于胸鳍的腹侧，鳍色为黄色。',
  jaws: '口前位，口裂大而斜；下颌略突出，联合处有一个瘤状突起。',
  teeth: '牙细小尖锐：上颌多行，外行齿扩大；下颌 2 行，内行齿扩大；犁骨，腭骨和舌上无牙。',
  eye: '眼中等大，位于头前半部的上侧；眼径约为头长的四分之一。',
  nares: '每侧 2 个鼻孔：前鼻孔小而圆，后鼻孔大，呈长椭圆形。',
  gillArches: '鳃耙细长，计数为 8 至 9 枚加 16 至 19 枚，分别长在鳃弓的上段和下段。',
  branchiostegals: '鳃条骨共 7 根，鳃孔宽大，鳃盖内侧还有一个小巧的假鳃。',
  vertebrae: '中文文献记椎骨 26 至 27 节，偶为 25 节；FishBase 记 25 至 26 节，两者略有出入。',
  gills: '对溶解氧要求较高，一般需 4 mg/L 以上，幼鱼的临界值约 3 mg/L。',
  gonad: '一个繁殖期排卵 2 至 3 次，怀卵量多为 20 万至 50 万粒；卵浮性，有一个油球。',
};
