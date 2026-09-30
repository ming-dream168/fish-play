// 太平洋蓝鳍金枪鱼 (Thunnus orientalis) 的图鉴资料. 注意这不是旧表里的大西洋蓝鳍 (T. thynnus), 两者的鳃耙数, 产卵场, 体温数据都不同.
// 数值来自 FishBase (2026-09 抓取), NOAA 渔业局物种页, Gibbs 与 Collette 1967 年的金枪鱼属解剖与系统学专论 (当时太平洋蓝鳍还是 T. thynnus 的亚种 orientalis),
// Kitagawa 等 2022 (Frontiers in Physiology), Ciezarek 等 2020 (BMC Genomics), Blank 等 2004 与 Clark 等 2013 的心率实验摘要,
// 英文维基 (引 IUCN 2014 评估), 日文维基クロマグロ条目, 屏东东港黑鲔季的台湾媒体与中文维基条目.
// IUCN 网站对抓取返回 403, 保护等级与评估日期取自 FishBase 的 IUCN 栏 (Version 2025-2), 并对照 IUCN 2021-09-04 的新闻稿.
import type { SpeciesInfo, StructureId } from '../types';

export const INFO: SpeciesInfo = {
  id: 'bluefin',
  zh: '太平洋蓝鳍金枪鱼',
  zhAlt: ['太平洋黑鲔', '黑鲔'],
  latin: 'Thunnus orientalis',
  authority: '(Temminck & Schlegel, 1844)',
  en: 'Pacific bluefin tuna',
  taxonomy: {
    class: '辐鳍鱼纲 Actinopterygii',
    order: '鲭形目 Scombriformes',
    family: '鲭科 Scombridae',
  },
  // FishBase 与 NOAA: 最大 300 cm FL, 最大体重 450 kg. FishBase 的常见体长 200 cm FL 与 NOAA 的成鱼约 150 cm, 60 kg 不一致, 所以不填 commonLengthCm.
  size: { maxLengthCm: 300, maxWeightKg: 450, lengthType: 'FL' },
  // FishBase 深度 1-550 m; 英文维基 (引 IUCN) 称多在表层到 200 m, 记录深达 550 m. 大洋性上层鱼, 下限取 0.
  depth: { minM: 0, maxM: 550 },
  habitat: '大洋性的上层巡游鱼，在表层到数百米深的水层追捕沙丁鱼、鳀、秋刀鱼和乌贼。',
  // FishBase 分布: 阿拉斯加湾到南加州和下加利福尼亚, 库页岛 (鄂霍次克海南部) 到菲律宾北部; FishBase 国家列表把 China 和 Taiwan 都列为原生分布;
  // 中文维基: 东港渔港是台湾最大的黑鲔产区
  distribution: '广布北太平洋，西侧从鄂霍次克海南部的库页岛到菲律宾北部，东侧到加利福尼亚和下加利福尼亚；在中国，大陆和台湾水域都有记录，屏东东港是台湾最大的黑鲔产区。',
  // FishBase: NT, 评估日期 2021-01-15; IUCN 2021-09-04 新闻稿: 从易危 VU 调为近危 NT. NOAA: 2024 年评估认为资源已恢复.
  iucn: 'NT',
  iucnYear: 2021,
  // NOAA: 约 5 岁成熟, 最长约 26 年, 平均约 15 年 (FishBase 的最大年龄 15 年偏旧, 不采用)
  lifespan: '平均约 15 年，最长约 26 年',
  // Gibbs 与 Collette 1967 表 1 (T. thynnus, 大西洋与太平洋种群合并): 第一背鳍硬棘 12-14, 第二背鳍软条 13-15, 背小鳍 8-10, 臀鳍软条 13-16, 臀小鳍 7-9, 胸鳍 30-36;
  // 该文称除鳃耙数, 胸鳍长度, 少数骨骼性状, 体腔背壁形状和尾柄侧棱颜色外, 各种群的计数与测量几乎相同. 脊椎 18 + 21 = 39 (同文, 属内只有黑鳍金枪鱼例外).
  // 鳃耙 32-40 (均值 35.9) 是该文表 5 中太平洋亚种自己的数据, FishBase 引用同一数字; 大西洋亚种为 34-43.
  meristics: {
    dorsal: 'XII–XIV + 13–15，另有小鳍 8–10',
    anal: '13–16，另有小鳍 7–9',
    pectoral: '30–36',
    vertebrae: '39（18 + 21）',
    gillRakers: '32–40',
  },
  swimming: {
    mode: 'thunniform',
    zh: '鲔科式',
    note: '身体大部分保持僵直，只有窄细的尾柄和新月形尾鳍快速摆动，产生推进力。',
  },
  // 产卵场与时间: Kitagawa 等 2022 与英文维基 (引 IUCN 2014): 4 至 6 月在菲律宾与琉球群岛之间 (含台湾一带), 8 月在日本海; 部分个体横渡太平洋, 几年后回到产卵场 (英文维基, NOAA).
  // 东港黑鲔季: 台湾新闻 2020-04-17 第一鲔拍卖在 4 月中旬, ETtoday 2014 称黑鲔季四月底开始, 六月底结束; 中文维基称东港是台湾最大的黑鲔产区.
  summary:
    '太平洋蓝鳍金枪鱼靠奇网让体温高于水温。成鱼 4 至 6 月在台湾和琉球群岛一带产卵，8 月在日本海产卵；部分幼鱼横渡太平洋，几年后返回。屏东东港的黑鲔季约在 4 至 6 月。',
  highlights: [
    {
      title: '奇网',
      // Kitagawa 等 2022: 两套奇网, 外侧奇网覆盖红肌, 内脏奇网分布在肝脏表面; Ciezarek 等 2020: 逆流热交换器让肌肉, 内脏, 脑, 眼的温度高于水温,
      // 幼鱼在 15.7 至 17.5 °C 的水中热量盈余 (体温减水温) 为 6.2 至 8.6 °C
      body: '红肌和肝脏表面的血管缠成两套奇网，动静脉血逆向流动，热量留在体内。幼鱼在 15.7 至 17.5 °C 的水中，体温比水温高 6.2 至 8.6 °C。',
    },
    {
      title: '红肌',
      // Ciezarek 等 2020: 金枪鱼的红肌大部分在体内中央, 深层肌肉靠近脊柱, 温度高于皮下浅层; 浅层红肌和白肌接近水温
      body: '和多数鱼不同，金枪鱼的红肌大多在体内深处，靠近脊柱。深层肌肉游动时产热，热量被奇网截住，比皮下的浅层肌肉暖，浅层肌肉的温度接近水温。',
    },
    {
      title: '心脏',
      // Ciezarek 等 2020: 心脏在外周, 由冠状循环供血, 没有逆流交换器, 温度接近水温; Blank 等 2004 原位心脏灌流: 心率 30 °C 时 156 次每分钟, 2 °C 时 13 次,
      // 最大心输出量 2 °C 时 18.1 mL/kg/min, 25 °C 时 106; 心功能在比热带金枪鱼所能耐受更冷的水温下仍保留
      body: '心脏在外周，没有奇网保温，温度随水温变化，却要给暖和的肌肉供血。实验中心率从 30 °C 时每分钟 156 次降到 2 °C 时 13 次，仍能泵血。',
    },
  ],
  sources: [
    'https://www.fishbase.se/summary/Thunnus-orientalis.html',
    'https://www.fishbase.se/Country/14290',
    'https://www.fisheries.noaa.gov/species/pacific-bluefin-tuna',
    'https://spo.nmfs.noaa.gov/sites/default/files/pdf-content/fish-bull/gibbs.pdf',
    'https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2022.968468/full',
    'https://link.springer.com/article/10.1186/s12864-020-07058-z',
    'https://pubmed.ncbi.nlm.nih.gov/14747418/',
    'https://pubmed.ncbi.nlm.nih.gov/23661777/',
    'https://iucn.org/news/species/202109/tuna-species-recovering-despite-growing-pressures-marine-life-iucn-red-list',
    'https://en.wikipedia.org/wiki/Pacific_bluefin_tuna',
    'https://ja.wikipedia.org/wiki/%E3%82%AF%E3%83%AD%E3%83%9E%E3%82%B0%E3%83%AD',
    'https://zh.wikipedia.org/wiki/%E5%B1%8F%E6%9D%B1%E9%BB%91%E9%AE%AA%E9%AD%9A%E6%96%87%E5%8C%96%E8%A7%80%E5%85%89%E5%AD%A3',
    'https://www.taiwannews.com.tw/zh/news/3918304',
    'https://www.ettoday.net/news/20140518/357835.htm',
  ],
};

// 该物种在各结构上的特例说明 (20–60 字), 会合并进结构卡片
export const NOTES: Partial<Record<StructureId, string>> = {
  // Gibbs 与 Collette 1967 表 1 (T. thynnus 合并数据) 与颜色描述; ja-wiki 称两个背鳍为灰色, 与之不一致, 这里只写 Gibbs 的结论, 即颜色多变
  dorsalFin: '第一背鳍有 12 至 14 根硬棘，颜色多变，可以是白色或带黄色，边缘有时发黑。',
  secondDorsalFin: '第二背鳍有 13 至 15 根软条，鳍尖常带黄色，其后紧接着一列小离鳍。',
  analFin: '臀鳍有 13 至 16 根软条，鳍尖常带黄色，其后接着 7 至 9 枚小离鳍。',
  // Gibbs 与 Collette: 尾柄肉质侧棱在太平洋与大西洋亚种都是暗色, 南方蓝鳍是黄色; FishBase: Caudal keels dark
  caudalFin: '尾柄两侧的肉质侧棱是暗色的，南方蓝鳍金枪鱼的则是黄色，这是两者的区别之一。',
  // Gibbs 与 Collette 表 5: 600-1000 mm FL 时, 太平洋亚种胸鳍长为叉长的 16.8-20.8%, 大西洋亚种 17.0-21.7%; NOAA: 鳍尖够不到第二背鳍前端
  pectoralFin: '胸鳍很短，叉长 600 至 1000 毫米的个体为叉长的 16.8% 至 20.8%，鳍尖够不到第二背鳍前端。',
  // Gibbs 与 Collette: 背, 臀小鳍通常鲜黄色带黑边 (属内除长鳍金枪鱼和黑鳍金枪鱼外都如此); NOAA: 黄色小鳍带黑边; ja-wiki 称臀侧小鳍银白, 与前两者不一致, 不采用
  finlets: '背侧小离鳍 8 至 10 枚，臀侧 7 至 9 枚，通常鲜黄色，边缘发黑。',
  // Ciezarek 等 2020: 红肌大部分在体内中央, 深层红肌紧密排列并产热, 深层肌肉温度高于浅层
  redMuscle: '红肌大多在靠近脊柱的体内深处，排列紧密；游动产生的热量被奇网截住，深层红肌比浅层温暖。',
  whiteMuscle: '白肌也分深浅：靠近脊柱的深层白肌比皮下的浅层暖，浅层肌肉的温度接近水温。',
  // Kitagawa 等 2022 (外侧奇网与内脏奇网); Ciezarek 等 2020 (大型成鱼在冷水中的体温从未测过)
  rete: '外侧奇网覆盖红肌，内脏奇网铺在肝脏表面；2020 年的一项研究称，大型成鱼在冷水中的体温尚无实测。',
  // Gibbs 与 Collette: 皮动脉起于第 3 至 6 节脊椎 (多为第 4, 5 节), 穿过第 3, 4 肋骨之间, 每支主干再分出两排小动脉与小静脉
  veins: '皮动脉起于第 3 至 6 节脊椎处，从第 3、4 肋骨之间穿到体侧，再分出两排细小的动脉和静脉。',
  // Gibbs 与 Collette: 背主动脉在皮动脉起点之后明显缩细, 太平洋亚种 (orientalis) 与大西洋亚种都观察到
  dorsalAorta: '背主动脉在发出皮动脉的位置之后明显缩细，太平洋和大西洋的蓝鳍金枪鱼都是如此。',
  // Clark 等 2013: 两条圈养个体 (9.7 和 13.3 kg), 20 °C 静息心率 45.1 和 40.7 次每分钟; 其中一条降到 10 °C 时在 35 次左右持平
  heart: '两条圈养个体，20 °C 时静息心率约每分钟 41 至 45 次；其中一条在 10 °C 时稳在 35 次左右。',
  // Ciezarek 等 2020 与日文维基: 金枪鱼是冲压式通气, 必须不停游动
  gills: '金枪鱼是冲压式通气，靠张口游动让水流过鳃，必须不停地游才能获得氧气。',
  // Gibbs 与 Collette 表 5: 太平洋亚种 32-40 (均值 35.9), 大西洋亚种 34-43 (均值 38.9)
  gillArches: '第一鳃弓的鳃耙共 32 至 40 枚，平均 35.9 枚；大西洋蓝鳍金枪鱼为 34 至 43 枚，平均 38.9 枚。',
  // Gibbs 与 Collette: 脊椎 18 + 21, 第一个腹向的横突 (parapophysis) 在第 8 节椎骨 (表 5, FishBase 同)
  vertebrae: '共 39 节脊椎，躯干椎 18 节，尾椎 21 节；第一个向腹侧伸出的横突在第 8 节椎骨上。',
  // NOAA: 背部黑色或深蓝带灰绿色虹彩, 腹部有银色或灰色的斑点或横带; Gibbs 与 Collette: 小个体腹侧有白色斑点或短纹, 可保留到叉长 1500-1600 mm
  skin: '背部黑色或深蓝，带灰绿色金属光泽；腹部有银色或灰色的斑点或横带，较小的个体腹侧另有白色斑点或短纹。',
  // ja-wiki: 体表有细小的鳞, 眼后, 胸鳍周围和侧线部为大而硬的鳞, 称胸甲部
  scales: '身体大部分覆盖细小的鳞，眼后、胸鳍周围和侧线一带的鳞大而硬，合称胸甲。',
  // NOAA: 眼比其他金枪鱼相对较小; Ciezarek 等 2020: 眼, 脑, 内脏和游泳肌肉的温度高于水温
  eye: '眼相对较小；眼部也被奇网保温，温度高于周围的海水。',
  brain: '脑的温度被保持在水温以上，属于金枪鱼的局部温血；眼、内脏和游泳肌肉的温度也高于水温。',
  // Gibbs 与 Collette: 胃在左侧; Ciezarek 等 2020: 内脏温度高于水温
  stomach: '胃在身体左侧；内脏区也被奇网保温，温度高于周围的海水。',
  // Gibbs 与 Collette: 肝脏腹面有条纹, 三叶大致等长; Kitagawa 等 2022: 内脏奇网在肝脏表面
  liver: '肝脏腹面有条纹，三叶大致等长，肝表面覆有内脏奇网。',
  // 英文维基 (引 IUCN 2014): 约 5 岁成熟, 4 至 8 月产卵 (菲律宾海西北部早, 日本海晚), 报道的怀卵量 500 万至 2500 万粒, 大雌鱼更多
  gonad: '约 5 岁成熟，4 至 8 月产卵，南早北晚；怀卵量据报道在 500 万到 2500 万粒之间，大个体更多。',
  // Gibbs 与 Collette: 鳔随体长增大, 太平洋亚种也一样; 引 Kishinouye 1923: 日本个体幼鱼的鳔短而很窄, 成鱼短而宽
  swimBladder: '有鳔，鳔随身体长大而变大；日本的太平洋蓝鳍幼鱼鳔短而窄，成鱼的短而宽。',
};
