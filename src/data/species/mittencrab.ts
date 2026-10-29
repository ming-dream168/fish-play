// 中华绒螯蟹 的图鉴资料. 每条说法都对过来源, 取舍的地方在字段上方写明依据.
// 主要来源: WoRMS (命名人与分类), SeaLifeBase 物种页 (体型, 深度, 生境, 分布, IUCN 栏), USGS NAS 事实表 (体型, 原产地),
// IUCN 入侵物种专家组 GISD 条目 (体型, 生活史, 幼体期, 影响), 比利时 VLIZ 外来种页 (欧洲首记, 洄游, 绒螯描述),
// FAO 养殖物种资料 (体重, 洄游时间), 中英文维基 (别名, 生活史, 北美记录).
// 命名人: WoRMS 与 GBIF 写作 H. Milne Edwards, 1853 (不加括号, 原组合未变); SeaLifeBase 写作 Milne-Edwards, 1853, 这里按 WoRMS.
// IUCN: SeaLifeBase (Red List Version 2025-2) 与 GBIF 都是未评估 NE, 所以不填评估年份.
// 甲壳动物没有鱼类的可数性状, NOTES 留空, 结构说明由单独的甲壳动物模型提供.
import type { SpeciesInfo, StructureId } from '../types';

export const INFO: SpeciesInfo = {
  id: 'mittencrab',
  zh: '中华绒螯蟹',
  // 中文维基: 也称上海毛蟹, 俗名大闸蟹或河蟹
  zhAlt: ['河蟹', '大闸蟹', '上海毛蟹'],
  latin: 'Eriocheir sinensis',
  authority: 'H. Milne Edwards, 1853',
  en: 'Chinese mitten crab',
  taxonomy: {
    class: '软甲纲 Malacostraca',
    order: '十足目 Decapoda',
    // WoRMS: 弓蟹科 Varunidae, 弓蟹亚科 Varuninae
    family: '弓蟹科 Varunidae',
  },
  // 注意: 蟹的 maxLengthCm 填的是头胸甲宽 (carapace width, CW), 不是体长; lengthType 只能选 TL/FL/SL, 这里按约定填 TL.
  // 各来源最大甲宽不一致: SeaLifeBase 7.5 cm CW, USGS NAS 约 80 mm, GISD 称成体可达约 10 cm, VLIZ 与英文维基写 3–10 cm.
  // 这里取多数来源给出的上限 10 cm. GISD 称常见甲宽 5–7 cm (区间, 不填 commonLengthCm).
  // 体重: FAO 称成熟蟹通常 100–200 g, 也有 400–500 g 的报道, 取 0.5 kg.
  size: { maxLengthCm: 10, maxWeightKg: 0.5, lengthType: 'TL' },
  // SeaLifeBase: 深度 0–25 m, 水温 5–27 °C
  depth: { minM: 0, maxM: 25, typical: '平时在江河湖泊的浅水底部，繁殖期到河口与近海' },
  // SeaLifeBase: 底栖, 降海洄游 (catadromous), 淡水与半咸水, 沿海河流与河口; GISD 与 SeaLifeBase: 会在岸边挖洞
  habitat: '底栖爬行的蟹类，成长期大多生活在淡水的江河湖泊里，常在岸边掘洞藏身，繁殖时才降到半咸水的河口。',
  // SeaLifeBase: 西北太平洋, 从长江到朝鲜西岸, 南到台湾; 已引入北美, 欧洲, 日本, 新加坡. USGS NAS: 原产中国与朝鲜半岛的太平洋沿岸.
  distribution: '原产中国东部沿海至朝鲜半岛西岸的河流与河口，已随船舶传入欧洲和北美，成为知名的入侵物种。',
  iucn: 'NE',
  // 寿命没有直接记录, 这里由性成熟年龄推出: VLIZ 称 2–3 年性成熟, 中文维基称第 4 或第 5 年性成熟 (该说法可能来自欧洲种群);
  // GISD 与 FAO 都称雌雄繁殖后通常死亡, 英文维基称一生只繁殖一次.
  lifespan: '约 2–5 年，一生只繁殖一次，繁殖后死亡',
  // 鱼类的可数性状 (鳍条, 脊椎, 侧线鳞等) 不适用于甲壳动物, 留空.
  meristics: {},
  // 字段名沿用鱼类的游泳方式, 这里写的是运动方式. 蟹类横着走是通行的教科书描述, 没有另查针对本种的运动学研究.
  swimming: {
    mode: 'walking (sideways)',
    zh: '横行',
    note: '靠四对步足在水底爬行，腿关节主要向身体两侧弯曲，所以横着走最快；不会像鱼那样游泳，能沿河岸长距离迁移。',
  },
  summary:
    '中华绒螯蟹就是大闸蟹，原产中国东部和朝鲜半岛。它在淡水里长大，成熟后顺流而下到河口交配产卵，一生只繁殖一次。螯足上长着浓密的绒毛，在欧洲和北美则是有名的入侵物种。',
  highlights: [
    {
      title: '降海繁殖洄游',
      // FAO: 洄游通常始于 10 月; VLIZ: 夏末到河口, 抱卵雌蟹到海中较深处越冬, 春季回到河口孵化, 幼蟹再溯河进入淡水;
      // GISD: 抱卵 25 万至 100 万粒, 幼体经前溞状幼体, 5 期溞状幼体和大眼幼体.
      body: '成熟后在秋季顺流而下，到半咸水的河口交配，雌蟹抱着 25 万至 100 万粒卵在近海越冬。幼体在海水里经 5 期溞状幼体和大眼幼体，变成小蟹后再溯河而上。',
    },
    {
      title: '毛茸茸的螯',
      // 英文维基: 螯上有浓密的深色刚毛, 英文名 mitten crab 由此而来; VLIZ: 大个体雄蟹尤其明显, 螯尖白色
      body: '一对螯足上长着浓密的深色刚毛，像戴了毛绒手套，英文名 mitten crab 就由此而来。大个体的雄蟹绒毛最明显，螯尖则是白色。',
    },
    {
      title: '跨洋入侵',
      // VLIZ: 欧洲首次记录为 1912 年德国威悉河支流阿勒尔河; 可能随压舱水传入. 英文维基: 美国东岸首个确认记录 2005 年切萨皮克湾.
      // GISD: 德国水域的经济损失自 1912 年起估计约 8000 万欧元.
      body: '1912 年首次在德国阿勒尔河被发现，多认为随船舶压舱水传入。它挖洞破坏堤岸、偷吃饵料、损坏渔网，德国估计损失约 8000 万欧元。',
    },
  ],
  sources: [
    'https://www.marinespecies.org/aphia.php?p=taxdetails&id=107451',
    'https://www.sealifebase.se/summary/Eriocheir-sinensis.html',
    'https://nas.er.usgs.gov/queries/FactSheet.aspx?speciesID=182',
    'https://www.iucngisd.org/gisd/species.php?sc=38',
    'https://vliz.be/niet-inheemse-soorten/en/eriocheir-sinensis',
    'https://www.fao.org/fishery/docs/CDrom/aquaculture/I1129m/file/en/en_chineserivercrab.htm',
    'https://api.gbif.org/v1/species/2225776/iucnRedListCategory',
    'https://zh.wikipedia.org/zh-hans/%E4%B8%AD%E5%8D%8E%E7%BB%92%E8%9E%AF%E8%9F%B9',
    'https://en.wikipedia.org/wiki/Chinese_mitten_crab',
  ],
};

// 甲壳动物的结构说明由单独的模型 (core/crustacean) 提供, 这里不写鱼类结构的特例.
export const NOTES: Partial<Record<StructureId, string>> = {};
