// 鲤 的图鉴资料. 每条说法都对过来源, 取舍的地方在字段上方写明依据.
// 主要来源: FishBase 物种页, 中国生物物种名录 (Sp2000 中国节点) 的鲤条目 (形态与分布),
// 南昌大学生命科学学院的鲤鱼解剖实验讲义 (咽齿, 鳔, 消化管), Ladich 与 Schulz-Mirbach 2016 (韦伯氏器与听觉),
// Nakajima 等 2019 (贾湖遗址的养殖证据), 中文维基的鲤跃龙门条目 (传说).
// 分类学备注: 有作者把东亚的鲤另立为 Cyprinus rubrofuscus, FishBase 的自然分布只写黑海, 里海和咸海流域;
// 这里按任务给定的名称写 Cyprinus carpio, 中国分布取自中国生物物种名录的记载.
// IUCN 网站对抓取返回 403, 保护等级与评估年份取自 FishBase 的 IUCN 栏, 并用 GBIF 接口交叉核对了类别.
import type { SpeciesInfo, StructureId } from '../types';

export const INFO: SpeciesInfo = {
  id: 'carp',
  zh: '鲤',
  zhAlt: ['鲤鱼', '拐子'],
  latin: 'Cyprinus carpio',
  authority: 'Linnaeus, 1758',
  en: 'Common carp',
  taxonomy: {
    class: '辐鳍鱼纲 Actinopterygii',
    order: '鲤形目 Cypriniformes',
    family: '鲤科 Cyprinidae',
  },
  // FishBase: 最大 129 cm TL, 常见 31 cm TL, 最大记录体重 40.1 kg
  size: { maxLengthCm: 129, commonLengthCm: 31, maxWeightKg: 40.1, lengthType: 'TL' },
  // FishBase: 深度 0-29 m; 水温 3-35 °C
  depth: { minM: 0, maxM: 29, typical: '多在水草丰盛的缓流或静水' },
  habitat: '喜欢温暖，水流缓慢或静止的低地河流与水草丰盛的大湖，杂食，多在底层觅食，黄昏与黎明最活跃。',
  // FishBase: 欧洲到亚洲的黑海, 里海, 咸海流域, 已引种到世界各地. 中国: 中国生物物种名录称全国从北到南的广大平原地区都有分布,
  // 最著名的是黄河产的黄河鲤.
  distribution: '原产欧亚大陆温带淡水，在中国从北到南的平原水域都有分布，以黄河鲤最有名；现已被引种到世界各地。',
  // FishBase: LC, 评估日期 2022-06-09. 维基百科所引的 IUCN 条目 e.T6181A3107721 标注为 2024 年发布; 旧版评估曾为 VU, 部分资料仍沿用.
  iucn: 'LC',
  iucnYear: 2022,
  // FishBase: 最大记录年龄 38 年
  lifespan: '记录最长 38 年',
  // 小写罗马数字表示不分枝鳍条 (鲤科惯例, 其中最后一根粗壮并带锯齿, FishBase 记作硬棘).
  // 背鳍与臀鳍取 FishBase 的范围 (硬棘 3-4 与 2-3, 软条 17-23 与 5-6); 中国生物物种名录记为背鳍 iii, 18-21, 臀鳍 iii, 5.
  // 胸鳍 i, 16 与腹鳍 i, 8 取自中国生物物种名录; 侧线鳞 34-37 同取自该条目; 脊椎 36-37 取自 FishBase.
  meristics: {
    dorsal: 'iii–iv, 17–23',
    anal: 'ii–iii, 5–6',
    pectoral: 'i, 16',
    pelvic: 'i, 8',
    vertebrae: '36–37',
    lateralLine: '34–37',
  },
  // 游泳方式的英文类别沿用占位值 (鲤科通行的教科书分类), 没有另查针对鲤的专门文献.
  swimming: {
    mode: 'subcarangiform',
    zh: '亚鲹科式',
    note: '摆动集中在身体后半段和尾柄，前半身摆幅很小，推进力主要来自后部的波动和深叉形的尾鳍。游泳类别是鲤科通行的教科书分类，没有查到针对鲤的专门研究。',
  },
  // 贾湖: Nakajima 等 2019 据鱼骨的年龄死亡率与物种选择, 认为河南贾湖遗址约公元前 6000 年已有对鲤的管理养殖.
  // 鲤跃龙门: 中文维基, 最早文字记载为汉代辛氏的《三秦记》, 原书已佚.
  summary:
    '鲤原产欧亚大陆温带淡水，在中国南北平原水域都有，以黄河鲤最有名。河南贾湖遗址的鱼骨研究认为，约 8000 年前已有人管理养殖鲤；鲤鱼跳龙门的传说则出自黄河龙门。',
  highlights: [
    {
      title: '韦伯氏器',
      body: '一串听小骨把鳔前壁的振动传给内耳，鳔前壁相当于一面内鼓膜。近亲金鱼切除最大的三脚骨后，听力在 100 Hz 下降 7 dB，在 2 kHz 下降 33 dB。',
    },
    {
      title: '咽齿',
      body: '鲤的颌上没有牙。牙长在第 5 对鳃弓形成的咽骨上，每侧 3 行 5 枚，齿式 1.1.3-3.1.1，臼齿状，与颅底的角质垫对磨来碾碎食物。',
    },
    {
      title: '两室鳔与无胃',
      body: '鳔分前后两室，中间细窄处有小孔相通，后室发出鳔管通到食道背面。鲤没有胃，食道很短，鳔管开口处被当作食道与肠的分界，肠长为体长的 2 至 3 倍。',
    },
  ],
  sources: [
    'https://www.fishbase.se/summary/Cyprinus-carpio.html',
    'http://www.sp2000.org.cn/Fauna/fauna/detil/6320',
    'https://swsyzx.ncu.edu.cn/docs/2022-01/133c81284ff64aa19898fe3811ee6c5e.pdf',
    'https://doi.org/10.3389/fevo.2016.00028',
    'https://doi.org/10.1038/s41559-019-0974-3',
    'https://zh.wikipedia.org/zh-hans/%E9%B2%A4%E9%B1%BC%E8%B7%B3%E9%BE%99%E9%97%A8',
    'https://en.wikipedia.org/wiki/Common_carp',
  ],
};

// 该物种在各结构上的特例说明 (20–60 字), 会合并进结构卡片
export const NOTES: Partial<Record<StructureId, string>> = {
  weberianApparatus: '鲤科的韦伯氏器有 4 块听小骨：闩骨、舟骨、间插骨和三脚骨，其中三脚骨最大，把鳔壁的振动一路传向内耳。',
  pharyngealTeeth: '每侧 3 行 5 枚，主行 3 枚，第一枚粗壮光滑，第二枚的齿冠上有 2 至 3 条沟纹。',
  swimBladder: '鳔分前后两室，前室两端钝圆，后室后端较尖；两室之间细窄，有小孔相通，后室发出鳔管通到食道背面。',
  stomach: '鲤没有胃，食道很短，直接接着肠；鳔管在食道背面的开口，被当作食道与肠的分界。',
  intestine: '肠较长，为体长的 2 至 3 倍，盘旋多折，前部较粗，后部渐细。',
  barbels: '口角有 2 对须，前面一对的长度约为后面一对的一半。',
  jaws: '口亚下位，呈马蹄形，上颌稍长于下颌，颌上没有牙。',
  eye: '眼中等大，眼间距宽而且隆起，虹膜多为金黄色。',
  skin: '体背黑色或黄褐色，腹部白色，体侧带黄色光泽；体色多随水体而变。',
  scales: '鳞片厚，后缘有许多黑点组成的新月形灰黑斑；侧线鳞 34–37 枚。',
  lateralLine: '侧线完整而较平直，穿过体侧 34–37 枚鳞片。',
  dorsalFin: '背鳍长，最后一根不分枝鳍条硬而粗，后缘有锯齿；起点距吻端比距尾鳍基更近。',
  analFin: '臀鳍最后一根不分枝鳍条是硬刺，后缘有锯齿；起点与背鳍倒数第 4 至 5 根分枝鳍条相对。',
  caudalFin: '尾鳍深叉形，下叶多为橘红色，体色会随所在水体而变化。',
  pectoralFin: '胸鳍末端圆，不达腹鳍基；有 1 根不分枝鳍条和 16 根分枝鳍条。',
  pelvicFin: '腹鳍末端不达肛门，有 1 根不分枝鳍条和 8 根分枝鳍条。',
};
