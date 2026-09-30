// 大麻哈鱼 的图鉴资料. 数值来自 FishBase (2026-09 抓取), FAO 渔业综述 41 号 (Bakkala 1970), NOAA 与阿拉斯加渔猎厅物种页,
// 农业农村部转载的黑龙江水产研究所材料, PeerJ 2025 图们江亲鱼研究, Frontiers 2025 麦肯齐河胃含物研究, 中国农业百科全书鲑类条目.
// IUCN 网站对抓取返回 403, 保护等级与评估日期取自 FishBase 的 IUCN 栏 (Version 2025-2): 无危 LC, 评估于 2020-07-23 (IUCN 2024-2 版发布).
// 取整或取舍的地方在字段上方用注释写明依据.
import type { SpeciesInfo, StructureId } from '../types';

export const INFO: SpeciesInfo = {
  id: 'chum',
  zh: '大麻哈鱼',
  zhAlt: ['大马哈鱼'],
  latin: 'Oncorhynchus keta',
  authority: '(Walbaum, 1792)',
  en: 'Chum salmon',
  taxonomy: {
    class: '辐鳍鱼纲 Actinopterygii',
    order: '鲑形目 Salmoniformes',
    family: '鲑科 Salmonidae',
  },
  // FishBase: 最大 100 cm FL, 最大记录体重 18.1 kg. FishBase 的常见体长 58 cm 是全长, 与叉长混用会误导, 所以不填 commonLengthCm.
  // 对照: NOAA 称可达约 3.6 英尺 (110 cm) 与 30 至 35 磅; 图们江亲鱼叉长 51.0–74.6 cm, 体重 1.4–5.2 kg (PeerJ 2025).
  size: { maxLengthCm: 100, maxWeightKg: 18.1, lengthType: 'FL' },
  // FishBase 深度 0-250 m, 通常在 61 m 以浅; 水温 0-24 °C
  depth: { minM: 0, maxM: 250, typical: '多在 61 米以浅' },
  habitat: '溯河洄游的冷水鱼，海洋期在北太平洋和白令海的上层水域摄食数年，成熟后回到出生河流，在砾石河床上产卵。',
  distribution: '广布北太平洋沿岸，在中国见于黑龙江、乌苏里江、绥芬河和图们江水系，每年秋季溯河产卵。',
  // FishBase: LC, 评估日期 2020-07-23 (IUCN 2024-2 版发布)
  iucn: 'LC',
  iucnYear: 2020,
  // NOAA: 多在 3 至 6 岁产卵; FishBase: 最大记录年龄 7 年 (堪察加)
  lifespan: '多为 3–6 年，最长记录 7 年',
  // FishBase 与 FAO 综述: 背鳍软条 10-14 (含未分支的短条总数 11-16), 臀鳍软条 13-17, 胸鳍 14-16, 腹鳍 10-11, 脊椎 59-71,
  // 有孔侧线鳞 124-153, 第一鳃弓鳃耙 18-28. 腹鳍位于背鳍起点之下 (FishBase 形态页).
  meristics: {
    dorsal: '10–14',
    anal: '13–17',
    pectoral: '14–16',
    pelvic: '10–11',
    vertebrae: '59–71',
    lateralLine: '124–153',
    gillRakers: '18–28',
  },
  swimming: {
    mode: 'subcarangiform',
    zh: '亚鲹科式',
    note: '摆动集中在身体后半段和尾柄，前半身摆幅很小，推进力主要来自后部的波动和尾鳍。',
  },
  summary:
    '大麻哈鱼是分布最广的太平洋鲑，在北太平洋摄食数年后，于秋季溯河回到出生的河流产卵。进入淡水后它基本不再进食，体色转成红黑相间的婚姻色，雄鱼长出钩吻和犬齿状的大牙，产卵后死亡。',
  highlights: [
    {
      title: '婚姻色',
      // NOAA: 红黑相间的虎纹, 雄鱼呈花布状; FishBase: 雄鱼灰红底带绿色竖纹; ADF&G: 雄鱼失去银色; 农业农村部材料: 产卵河流水清, 底质为石砾
      body: '进入淡水后，银亮的体色褪去，体侧浮出红、黑、绿相间的不规则横纹，雄鱼尤其醒目。在中国，它每年秋季上溯黑龙江、乌苏里江、图们江和绥芬河，到水清的砾石河段产卵。',
    },
    {
      title: '犬齿与钩吻',
      // ADF&G: 产卵雄鱼有钩状吻和犬齿状大牙, 用来攻击其他雄鱼, 雌鱼也有但不明显; dog salmon 得名于犬齿是常见说法 (Alaska Magazine, 太平洋鲑鱼基金会), 另有喂雪橇犬一说
      body: '产卵期雄鱼的吻部变长弯曲成钩，牙齿明显增大，像犬牙，用来攻击争夺产卵位的其他雄鱼。雌鱼也有，但不明显。英文俗名 dog salmon 常被归因于这副牙。',
    },
    {
      title: '基本停止进食',
      // FAO 综述: 进入淡水后停食, 靠体内脂肪与蛋白质; 体脂占体重 9-11% 降到死时 0.5% 以下. 中国农业百科全书: 肠管萎缩. ADF&G: 消化道退化
      body: '一进入淡水，它基本不再进食，肠管萎缩，靠体内的脂肪和蛋白质完成上溯、造窝和产卵。体脂原本占体重的 9% 至 11%，到死时只剩 0.5% 以下。',
    },
  ],
  sources: [
    'https://www.fishbase.se/summary/Oncorhynchus-keta.html',
    'https://www.fao.org/4/ap906e/ap906e.pdf',
    'https://www.adfg.alaska.gov/index.cfm?adfg=chumsalmon.main',
    'https://www.fisheries.noaa.gov/species/chum-salmon',
    'https://yyj.moa.gov.cn/gzdt/201904/P020190418621881856905.pdf',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC12399085/',
    'https://www.frontiersin.org/journals/ecology-and-evolution/articles/10.3389/fevo.2025.1686114/full',
    'https://www.pwsannong.com/c/2016-04-13/561609.shtml',
    'https://psf.ca/info/chum/',
    'https://alaskamagazine.com/authentic-alaska/activities/its-a-dogs-life/',
  ],
};

// 该物种在各结构上的特例说明 (20–60 字), 会合并进结构卡片
export const NOTES: Partial<Record<StructureId, string>> = {
  skin: '海洋期背部钢蓝色带黑色细点，体侧银白；入淡水后转成红、黑相间的婚姻色，雄鱼更艳，雌鱼较淡。',
  scales: '鳞片细小，侧线鳞约 124 至 153 枚；鳞上的年轮可用来判断年龄，洄游中鳞缘还会被吸收。',
  lateralLine: '侧线先略微下弯，之后变直，有孔的鳞片约 124 至 153 枚。',
  dorsalFin: '背鳍只有一个，软条 10 至 14 根，没有硬棘；其后另有一个小小的脂鳍。',
  adiposeFin: '脂鳍小而细长，是位于背后方的肉质小鳍，内部没有鳍条支撑。',
  analFin: '臀鳍有 13 至 17 根软条，产卵期鳍尖变白。',
  caudalFin: '尾鳍后缘微凹，接近截形，鳍上没有斑点；雄鱼尾鳍和胸鳍的鳍尖带黑色。',
  pelvicFin: '腹鳍基部有肉质的腋突，位于背鳍起点下方；产卵期腹鳍与臀鳍的鳍尖变白。',
  whiteMuscle: '肉色橙红到粉红，比红大麻哈鱼、银大麻哈鱼和大鳞大麻哈鱼的淡，含油量也较低，肉味清淡。',
  teeth: '牙齿呈圆锥形，颌骨、犁骨、腭骨和舌缘都有；洄游期雄鱼的颌齿大幅增大，像犬牙。',
  jaws: '口裂大，上颌骨长而窄，向后延伸过眼的后缘；洄游期雄鱼的上下颌变长弯曲。',
  kype: '雄鱼的吻部变长弯曲成钩，上颌前端向下钩住下颌；雌鱼也有，但不那么明显。',
  gillArches: '第一鳃弓上有 18 至 28 枚短而粗的光滑鳃耙，间距很宽，是鉴别本种的特征之一。',
  eye: '眼径约占叉长的 2.5% 至 3.0%，约为头长的八分之一，阿穆尔河夏季鲑的实测值。',
  otoliths: '中国的增殖放流用耳石做群体标记，例如 2009 至 2017 年在绥芬河的耳石和剪鳍标志放流。',
  stomach: '麦肯齐河的研究里，空胃重占体重的比例从河口的 0.57% 降到上游大奴湖的 0.11%，胃随上溯不断缩小。',
  pyloricCaeca: '幽门盲囊很多，各地种群的平均值约 160 至 205 枚，个体范围约 121 至 249 枚。',
  intestine: '中国水域的亲鱼上溯时肠管萎缩，基本停止摄食，靠体内储存的脂肪和蛋白质维持。',
  gonad: '卵呈橙红色，直径约 6 至 9.5 毫米，怀卵量多为 2000 至 3000 粒；堪察加溪流的雌鱼卵巢约占体重 14%。',
};
