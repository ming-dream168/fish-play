// 瓦氏拟鲿 (瓦氏黄颡鱼) 的图鉴资料. 每条说法都对过来源, 取舍的地方在字段上方写明依据.
// 主要来源: FishBase 物种页 (体长, 鳍条, 背鳍位置, 体色, IUCN, 种名词源), ScotCat 的物种页 (异名与命名史, 分布, IUCN 说明),
// 鱼花网的瓦氏黄颡鱼条目 (鳍式, 鳃耙, 体形比例, 须, 鳍棘锯齿, 尾鳍, 体色, 食性, 中国分布),
// 国家动物标本资源共享平台的瓦氏黄颡鱼条目 (须为青黑色, 脂鳍与臀鳍相对; 页面抓取失败, 内容取自搜索结果摘录),
// 华中农业大学水产学院关于 "黄优 1 号" 的介绍, 中文维基 (异名列表).
// 分类学备注: 原名 Bagrus vachellii Richardson, 1846, 属已变动所以命名人加括号. Catalog of Fishes 与 FishBase 现用 Tachysurus vachellii;
// 中国文献多写作 Pelteobagrus vachellii (瓦氏黄颡鱼), 中文维基与 Ng & Freyhof 2007 用 Pseudobagrus vachellii (瓦氏拟鲿).
// 种名常被误拼为 vachelli, 正确拼法是 vachellii. 英文俗名 darkbarbel catfish 见于中国作者的英文论文, FishBase 页面没有给出英文俗名.
// IUCN 网站未直接抓取, 保护等级与评估日期取自 FishBase 的 IUCN 栏.
import type { SpeciesInfo, StructureId } from '../types';

export const INFO: SpeciesInfo = {
  id: 'pbvachellii',
  zh: '瓦氏拟鲿',
  zhAlt: ['瓦氏黄颡鱼'],
  latin: 'Tachysurus vachellii',
  authority: '(Richardson, 1846)',
  en: 'Darkbarbel catfish',
  taxonomy: {
    class: '辐鳍鱼纲 Actinopterygii',
    order: '鲇形目 Siluriformes',
    family: '鲿科 Bagridae',
  },
  // FishBase: 最大 42.3 cm TL, 常见 21.0 cm TL; 未给最大体重. 中文维基写最大 35 cm, ScotCat 写约 20 cm, 来源不一致, 这里取 FishBase.
  size: { maxLengthCm: 42.3, commonLengthCm: 21, lengthType: 'TL' },
  // 没有找到深度记录, 0 与 0 表示未知, 界面显示破折号.
  depth: { minM: 0, maxM: 0, typical: '无深度记录，栖于江河底层' },
  // 鱼花网: 小型底栖鱼类, 栖息于多岩石或泥沙底质的江河; 食物见下. 夜行习性未查到针对本种的记载, 不写.
  habitat: '底栖鱼类，多栖息在岩石或泥沙底质的江河里，贴着水底觅食水生昆虫及其幼虫、寡毛类、小型甲壳动物、小型软体动物和小鱼。',
  // FishBase: 中国与越南; ScotCat: 中国从黄河到珠江, 另有朝鲜半岛的记录; 鱼花网: 珠江, 闽江, 湘江, 长江, 淮河, 辽河等水系.
  distribution: '分布于中国和越南；在中国见于珠江、闽江、湘江、长江、淮河、辽河等水系。',
  // FishBase: DD, 评估日期 2011-04-04; ScotCat 引 IUCN 说明: 种群可能自 1960 年代以来下降, 但下降速度不明.
  iucn: 'DD',
  iucnYear: 2011,
  // 背鳍: 鱼花网 II, 6-8, FishBase 2 棘 6-7 软条; 取 II, 6-8.
  // 臀鳍: 鱼花网 II, 21-24 (前两根为不分枝鳍条, 此处写成小写 ii), FishBase 21-24 软条.
  // 胸鳍 I, 7-9, 腹鳍 i, 5 (原文 "I-5", 腹鳍无硬刺, 按不分枝鳍条写小写), 鳃耙 13-18 均取自鱼花网.
  meristics: {
    dorsal: 'II, 6–8',
    anal: 'ii, 21–24',
    pectoral: 'I, 7–9',
    pelvic: 'i, 5',
    gillRakers: '13–18',
  },
  // 没有查到针对本种的游泳运动学研究, 按体形 (体延长, 后部侧扁, 尾柄细长, 深叉尾) 沿用教科书分类.
  swimming: {
    mode: 'subcarangiform',
    zh: '亚鲹科式',
    note: '身体前部略圆，后部侧扁，摆动集中在后半身和细长的尾柄，由深叉形尾鳍推进。游泳类别是按体形沿用的教科书分类，没有查到专门研究。',
  },
  summary:
    '瓦氏拟鲿是黄颡鱼的近亲，体形更细长，吻部突出，上颌长过下颌，4 对须都呈青黑色，尾鳍深分叉。它生活在岩石或泥沙底的江河底层，也被用作父本与黄颡鱼杂交，培育出养殖新品种。',
  highlights: [
    {
      title: '一个种名，四个属名',
      body: '1846 年初名 Bagrus vachellii，后来先后归入黄颡鱼属和拟鲿属，现多归入 Tachysurus。种名纪念澳门的英国牧师 Vachell，常被误拼为 vachelli。',
    },
    {
      title: '比黄颡鱼更修长',
      body: '体长为体高的 3.9 至 5.2 倍，而黄颡鱼只有 3.1 至 4 倍；臀鳍条 21 至 24 根，也比黄颡鱼多。体侧灰黄，没有黄颡鱼那样醒目的黑色斑块，各鳍边缘发黑。',
    },
    {
      title: '杂交新品种黄优 1 号',
      body: '以黄颡鱼为母本、瓦氏拟鲿为父本的杂交鱼存活率更高、长得更快。华中农业大学据此培育的黄优 1 号在 2019 年 4 月通过国家水产新品种审定，已在全国推广。',
    },
  ],
  sources: [
    'https://www.fishbase.se/summary/Tachysurus-vachellii.html',
    'https://www.scotcat.com/bagridae/tachysurus_vachellii.htm',
    'https://www.fishbkw.com/a/2968.html',
    'http://museum.ioz.ac.cn/topic_detail.aspx?id=69007',
    'https://encf.hzau.edu.cn/info/1014/1007.htm',
    'https://zh.wikipedia.org/zh-hans/%E7%93%A6%E6%B0%8F%E9%BB%84%E9%A2%A1%E9%B1%BC',
  ],
};

// 该物种在各结构上的特例说明 (20–60 字), 会合并进结构卡片
export const NOTES: Partial<Record<StructureId, string>> = {
  barbels: '须 4 对，都呈青黑色：后鼻孔前缘有短小的鼻须；上颌须粗，伸过胸鳍基部；外侧颏须比内侧长，可伸到胸鳍。',
  jaws: '口小，下位，吻部突出，上颌明显长过下颌；头长约为口裂宽的 2.1 至 2.8 倍。',
  eye: '眼较小，头长约为眼径的 3.7 至 5.2 倍，比黄颡鱼的眼相对更小。',
  skin: '体裸露无鳞；活体背部灰褐，体侧灰黄，腹部浅黄且没有斑点，头顶被一层薄皮覆盖。',
  dorsalFin: '背鳍高，起点在胸鳍与腹鳍之间的上方；硬刺前缘光滑，后缘只有弱锯齿。',
  pectoralFin: '胸鳍刺粗壮，前缘光滑，后缘锯齿强而发达；黄颡鱼的胸鳍刺则前后缘都有锯齿。',
  adiposeFin: '脂鳍短，后端游离，比臀鳍稍短，与臀鳍上下相对。',
  analFin: '臀鳍长，有 2 根不分枝鳍条和 21 至 24 根分枝鳍条，鳍条数多于黄颡鱼。',
  caudalFin: '尾鳍深分叉，上下叶约等长，末端圆钝；各鳍边缘灰黑，尾鳍下叶边缘最明显。',
  gills: '鳃耙 13 至 18 根，比黄颡鱼略多，以水生昆虫和小型底栖动物为主要食物。',
};
