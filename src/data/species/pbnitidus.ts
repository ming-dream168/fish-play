// 光泽拟鲿 的图鉴资料. 每条说法都对过来源, 取舍的地方在字段上方写明依据.
// 主要来源: FishBase 物种页 (体长, 体重, 成熟体长, IUCN), Catalog of Fishes (原始组合, 模式产地, 分布),
// 中文百科全书 (newton.com.tw) 转载的光泽黄颡鱼条目 (鳍式, 体形比例, 须, 鳍棘, 尾鳍, 体色, 食性, 繁殖, 习性),
// 中文维基 (俗名, 分布水系, 昼伏夜出), Kaatz 等 2010 (鲇类胸鳍棘的发声结构, 其中检查了黄颡鱼属),
// Wright 2009 (鲿科的推定有毒种类).
// 分类学备注: 现行有效名 Tachysurus nitidus (Sauvage & Dabry de Thiersant, 1874), 原始组合 Pseudobagrus nitidus,
// 模式产地长江; 属已变动所以命名人加括号 (Catalog of Fishes 与 FishBase 一致). 中国文献多写作光泽黄颡鱼 Pelteobagrus nitidus,
// 中文维基用 光泽疯鲿; 本站按 SpeciesId 的注释用 光泽拟鲿 作正名.
// IUCN 网站未直接抓取, 保护等级与评估日期取自 FishBase 的 IUCN 栏. 中文维基仍写 未予评估, 已过时.
import type { SpeciesInfo, StructureId } from '../types';

export const INFO: SpeciesInfo = {
  id: 'pbnitidus',
  zh: '光泽拟鲿',
  zhAlt: ['光泽黄颡鱼', '光泽疯鲿', '黄甲', '油黄姑'],
  latin: 'Tachysurus nitidus',
  authority: '(Sauvage & Dabry de Thiersant, 1874)',
  // FishBase 与 Catalog of Fishes 都没有英文俗名, 这里按种名 nitidus (光亮的) 写一个描述性名称.
  en: 'Shining bagrid catfish',
  taxonomy: {
    class: '辐鳍鱼纲 Actinopterygii',
    order: '鲇形目 Siluriformes',
    family: '鲿科 Bagridae',
  },
  // FishBase: 最大 40.8 cm TL, 常见 10.5 cm SL (常见体长是标准长), 最大发表体重 226.2 g, 成熟体长 10.8 cm.
  // 来源不一致: 中文维基称体长可达 19 cm, 中文百科称常见个体长 8–14 cm, 重约 50 g; 40.8 cm 明显偏大, 但这里仍按约定取 FishBase.
  size: { maxLengthCm: 40.8, commonLengthCm: 10.5, maxWeightKg: 0.2262, lengthType: 'TL' },
  // FishBase 只写 淡水与半咸水, 底层 (demersal), 没有深度范围; 0 与 0 表示未知, 界面显示破折号.
  depth: { minM: 0, maxM: 0, typical: '无深度记录，栖于湖泊与江河支流的中下层' },
  habitat: '底栖性小型鲇类，栖于湖泊和江河支流的中下层；白天很少活动，夜间出来觅食，主要吃水生昆虫幼虫和小型甲壳动物。',
  // Catalog of Fishes: 黑龙江到长江流域; FishBase: 中国, 并有韩国记录; 中文维基: 闽江, 湘江, 长江等水系.
  // 三者范围不一 (北界与南界不同), 这里合并写出.
  distribution: '中国东部的江河湖泊，北到黑龙江，南到闽江，以长江水系最常见；模式产地长江。FishBase 另有韩国的记录。',
  // FishBase: LC, 评估日期 2023-01-04.
  iucn: 'LC',
  iucnYear: 2023,
  // 鳍式与鳃耙取自中文百科: 背鳍 I-7, 胸鳍 I-6, 腹鳍 i-6, 臀鳍 22-28, 第一鳃弓外侧鳃耙 8-11.
  // 背鳍写 I 是原文写法; 同属其他种的资料常把背鳍刺前那根极短的小棘也计入, 写成 II.
  // 搜索结果摘录的另一版本 (百度百科) 写臀鳍 22-25, 这里用抓取到的全文 22-28. 没有查到脊椎骨数.
  meristics: {
    dorsal: 'I, 7',
    anal: '22–28',
    pectoral: 'I, 6',
    pelvic: 'i, 6',
    gillRakers: '8–11',
  },
  // 没有查到针对本种的游泳运动学研究, 按体形 (前部粗短, 后部侧扁, 深叉尾) 沿用鲿科常见的教科书分类.
  swimming: {
    mode: 'subcarangiform',
    zh: '亚鲹科式',
    note: '前半身粗短少动，摆动集中在侧扁的后半身和尾柄，靠深叉形尾鳍推进。游泳类别是按体形沿用的教科书分类，没有查到专门研究。',
  },
  summary:
    '光泽拟鲿是长江流域常见的小型鲿科鱼，常见个体长 8 至 14 厘米，体裸露，体侧有两块暗斑，尾鳍深叉。白天伏在水底，夜里出来捕食水生昆虫和小虾；雄鱼掘坑守护卵。',
  highlights: [
    {
      title: '深叉尾是辨认要点',
      body: '同为拟鲿属，圆尾拟鲿和白边拟鲿的尾鳍是圆的，光泽拟鲿却是深叉形，中央最短的鳍条不到最长鳍条的一半，加上臀鳍基明显长于脂鳍基，很容易区分。',
    },
    {
      title: '一龄成熟，雄鱼护巢',
      body: '光泽拟鲿当年就能性成熟，4 至 5 月在近岸浅水产卵；雄鱼掘坑做巢，守在巢边护卵直到孵化。每尾雌鱼怀卵约 992 至 5671 粒。',
    },
    {
      title: '会发声的胸鳍棘',
      body: 'Kaatz 等 2010 年检查鲇类胸鳍棘时，把黄颡鱼属列为会发声的类群：棘基部背突上有圆形微脊，棘转动时与肩带摩擦发声；这些声音是在用手抓握、鱼受惊扰时记录的。',
    },
  ],
  sources: [
    'https://www.fishbase.se/summary/Tachysurus-nitidus.html',
    'https://researcharchive.calacademy.org/research/ichthyology/catalog/fishcatget.asp?tbl=species&genus=tachysurus&species=nitidus',
    'https://www.newton.com.tw/wiki/%E5%85%89%E6%BE%A4%E9%BB%83%E9%A1%99%E9%AD%9A/10041490',
    'https://zh.wikipedia.org/zh-hans/%E5%85%89%E6%B3%BD%E9%BB%84%E9%A2%A1%E9%B1%BC',
    'https://www.esf.edu/biology/faculty/documents/72.Kaatzetal2010CatfishPectSpineVocal.pdf',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC2791775/',
  ],
};

// 该物种在各结构上的特例说明 (20–60 字), 会合并进结构卡片
// 形态均取自中文百科转载的光泽黄颡鱼条目; 发声取自 Kaatz 等 2010 对黄颡鱼属的检查, 不是针对本种的声学记录.
export const NOTES: Partial<Record<StructureId, string>> = {
  barbels: '须 4 对，都较短：鼻须伸过眼前缘，上颌须伸过眼后缘，但到不了胸鳍基部。',
  jaws: '头部稍扁平，吻短而稍尖；口下位，口裂略呈弧形，适合在水底取食。',
  teeth: '上下颌和腭骨上都长着绒毛状的细齿，用来咬住水生昆虫幼虫和小虾等猎物。',
  eye: '眼中等大；它主要在夜间觅食，比起视觉更依赖 4 对须的触觉和味觉。',
  skin: '体裸露无鳞，体侧有 2 块暗色斑纹，标本泡在福尔马林里斑纹容易褪掉；腹腔膜浅褐色。',
  lateralLine: '侧线完整而平直，沿体侧中部一直延伸到尾柄。',
  dorsalFin: '背鳍短，有 1 根硬刺和 7 根分枝鳍条；硬刺比胸鳍刺长，后缘有细锯齿。',
  pectoralFin: '胸鳍有 1 根粗壮硬刺，前缘光滑，后缘锯齿发达；棘基转动摩擦能发出声音。',
  pelvicFin: '腹鳍有 1 根不分枝鳍条和 6 根分枝鳍条，末端向后伸过臀鳍起点。',
  adiposeFin: '脂鳍短小，后端游离，基部明显短于臀鳍基部。',
  analFin: '臀鳍基部很长，有 22 至 28 根鳍条，是区分它与拟鲿属其他种的计数之一。',
  caudalFin: '尾鳍深叉形，中央最短的鳍条不到最长鳍条的一半，与圆尾的拟鲿明显不同。',
  gills: '第一鳃弓外侧鳃耙 8 至 11 根，比同属的黄颡鱼 (13 至 16 根) 少。',
  spines: '背鳍刺和胸鳍刺是防身武器；Wright 2009 估计鲿科有 176 至 198 种可能带毒腺，本种的毒性没有专门研究。',
};
