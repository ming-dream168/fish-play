// 鲸鲨 的图鉴资料. 每条说法都对过来源, 取舍的地方在字段上方写明依据.
// 主要来源: FishBase 物种页 (计数, 体长, 分布, IUCN 栏 Version 2025-2), Motta 等 2010 (滤食结构与食物),
// Meekan 等 2024 (自由游动个体的超声解剖, 心率), Tomita 等 2020 (眼), Arzoumanian 等 2005 (斑点识别),
// Gleiss 等 2011 (浮力与滑翔), Li 等 2012 与 Wang 等 2012 (中国海域), 中国政府网与中新网 (保护名录).
// IUCN 网站对抓取返回 403, 保护等级与评估年份取自 FishBase 的 IUCN 栏, 并用 GBIF 接口交叉核对了类别.
import type { SpeciesInfo, StructureId } from '../types';

export const INFO: SpeciesInfo = {
  id: 'whaleshark',
  zh: '鲸鲨',
  zhAlt: ['豆腐鲨', '大戆鲨'],
  latin: 'Rhincodon typus',
  authority: '(Smith, 1828)',
  en: 'Whale shark',
  taxonomy: {
    class: '软骨鱼纲 Chondrichthyes',
    order: '须鲨目 Orectolobiformes',
    family: '鲸鲨科 Rhincodontidae',
  },
  // FishBase: 最大 2000 cm TL (雌鱼), 雄鱼或未分性别为 1700 cm; 常见 1000 cm TL; 最大记录体重 34 t.
  // FishBase 同时注明: 最可靠的实测体长约 12 m (Colman 1997), 更大的记录没有证实. 这里取 FishBase 的最大值.
  size: { maxLengthCm: 2000, commonLengthCm: 1000, maxWeightKg: 34000, lengthType: 'TL' },
  // FishBase: 深度 0-1928 m, 通常 0-100 m
  depth: { minM: 0, maxM: 1928, typical: '多在 0–100 米' },
  habitat: '开阔海域的表层与近岸，多在 0–100 m，最深曾潜到 1928 m，常到浮游生物密集处滤食。',
  // FishBase: 环球分布, 地中海除外. 中国: FishBase 中国条目为 native; Li 等 2012 的渔获记录以海南和浙江为主;
  // Wang 等 2012 在南海放置卫星标签; 中文维基据台湾东部定置网渔获与 2008 年起的全面禁捕记载台湾海域.
  distribution: '环球热带与暖温带海域（地中海除外）；在中国见于南海，东海和台湾周边，海南与浙江沿海的渔获记录最多。',
  // FishBase: EN (A2bd), 评估日期 2025-03-31 (IUCN Version 2025-2); 此前 2016 年评估同为 EN
  iucn: 'EN',
  iucnYear: 2025,
  // FishBase: 估计寿命 80.4 年, 而椎骨年轮读出的最大年龄只有 38 年 (一条 11.9 m 的雌鲨)
  lifespan: '估计约 80 年，椎骨年轮读出的最大年龄为 38 年',
  // FishBase 只给出硬棘为 0, 软骨鱼没有可靠的鳍条计数, 不填.
  meristics: {},
  // 游泳方式的英文类别沿用占位值, 没有查到针对鲸鲨的正式分类; 说明文字只写核实过的内容.
  // Gleiss 等 2011: 鲸鲨偏负浮力, 下潜可滑翔, 上升需摆尾; Motta 等 2010: 表层滤食时平均 1.1 m/s.
  swimming: {
    mode: 'carangiform',
    zh: '鲹科式',
    note: '比海水略重，下潜时可以滑翔，上升时得摆尾；在表层滤食时以约 1.1 m/s 缓慢前进。游泳类别是暂用的，没有查到针对鲸鲨的正式分类。',
  },
  summary:
    '鲸鲨是现存最大的鱼，常见体长约 10 m，最可靠的实测约 12 m，靠鳃弓上的滤食垫滤食浮游生物。在中国见于南海，东海和台湾周边，列入 2021 年版国家重点保护野生动物名录二级，IUCN 评估为濒危。',
  highlights: [
    {
      title: '滤食垫',
      body: '鳃弓内侧有 20 片滤食垫，网眼平均 1.2 mm。水流横掠网面，比网眼小的浮游生物也能吞下，网面不易堵塞。尤卡坦海域的样本以樱虾类，哲水蚤，箭虫和仔鱼为主。',
    },
    {
      title: '斑点识别',
      body: '浅色斑点与条纹排成棋盘状，花纹每条各不相同，长期稳定。研究者把天文学里比对星图的算法拿来认个体，测试中同一条鲨的照片配对成功率超过 90%。',
    },
    {
      title: '肝脏与浮力',
      body: '鲨鱼没有鳔，肝里的油比海水轻。鲸鲨的肝窄长如带，从肩带延伸到腹鳍之后，但据记载比多数鲨鱼的小，整体略偏负浮力，下潜靠滑翔，上升要摆尾。',
    },
  ],
  sources: [
    'https://www.fishbase.se/summary/Rhincodon-typus.html',
    'https://doi.org/10.1016/j.zool.2009.12.001',
    'https://www.frontiersin.org/journals/marine-science/articles/10.3389/fmars.2024.1285429/full',
    'https://doi.org/10.1371/journal.pone.0235342',
    'https://doi.org/10.1111/j.1365-2664.2005.01117.x',
    'https://doi.org/10.1111/j.1365-2435.2010.01801.x',
    'https://www.sciencedaily.com/releases/2010/11/101124214717.htm',
    'https://dlnr.hawaii.gov/sharks/anatomy/skeleton-and-buoyancy/',
    'https://www.floridamuseum.ufl.edu/discover-fish/species-profiles/rhincodon-typus/',
    'https://www.floridamuseum.ufl.edu/discover-fish/species-profiles/whale-shark/',
    'https://animaldiversity.org/accounts/Rhincodon_typus/',
    'https://doi.org/10.1111/j.1095-8649.2012.03250.x',
    'https://doi.org/10.1111/j.1749-4877.2011.00278.x',
    'https://www.moa.gov.cn/govpublic/YYJ/202102/t20210205_6361292.htm',
    'https://www.chinanews.com.cn/cj/2022/08-01/9817189.shtml',
    'https://zh.wikipedia.org/zh-hans/%E9%AF%A8%E9%AF%8A',
  ],
};

// 该物种在各结构上的特例说明 (20–60 字), 会合并进结构卡片
export const NOTES: Partial<Record<StructureId, string>> = {
  gills: '共 5 对鳃裂，都特别大，第 5 对在胸鳍之后；滤食时口每分钟开合 7–28 次，与鳃裂的开合同步。',
  gillArches: '鳃弓内侧的滤食垫共 20 片，软骨质的初级与次级鳃板托着它们，并把水流引向鳃丝。',
  teeth: '牙又小又钩，排成纵列像一把锉刀，据记载可多达约 300 列，在滤食中作用很小。',
  jaws: '口几乎开在吻的最前端，是很宽的横裂，位置在眼的前方。',
  nares: '鼻孔带有退化的小触须，鼻孔与口之间有很长的鼻口沟。',
  neurocranium: '超声显示，背侧肌肉之下 7 至 11 cm 处有一个充满脑脊液的大腔，被软骨的脑颅包围。',
  eye: '眼球外覆有皮齿，形状与体表的盾鳞不同，耐磨；眼球还能缩回眼窝，缩进的距离约为眼径的一半。',
  skin: '背面灰，蓝灰至绿褐色，腹面白或淡黄，布满浅色斑点与横竖条纹；体侧有明显的纵棱，最下一道止于尾柄的棱脊。',
  scales: '盾鳞的中央有一道很强的棱，没有侧棱，后缘分成三叶。',
  dorsalFin: '两个背鳍都靠后，第一背鳍比第二背鳍大得多；背鳍上没有硬棘。',
  caudalFin: '尾鳍分上下两叶，成鲨近似半月形；体型很小的幼鲨，上叶明显长于下叶。',
  heart: '超声测得游动中的幼鲨心率为 12–16 次每分钟；心室壁收缩时约厚 4 cm，舒张时约 2.5 cm。',
  bulbus: '超声图像里，心室前方的中线上可见一条漏斗形的肌肉质动脉圆锥。',
  liver: '肝窄长如带，位于腹腔背外侧，从肩带一直延伸到腹鳍之后，两叶间隔着腹腔液。据记载比多数鲨鱼的肝小。',
  gallBladder: '胆囊呈薄壁的长卵圆形，紧靠肩带之后，稍偏中线右侧；充盈时直径可达 7.5 cm。',
  stomach: '超声显示胃是壁很厚的卵圆形囊，位于胆囊之后，胃壁厚 0.5 至 2.7 cm，各条鲨鱼差别很大。',
  gonad: '卵胎生，一次可怀 300 多尾胎儿；临产的胚胎已在子宫内脱去卵壳，体长 58–64 cm。',
};
