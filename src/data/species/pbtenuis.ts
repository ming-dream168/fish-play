// 圆尾拟鲿 的图鉴资料. 每条说法都对过来源, 取舍的地方在字段上方写明依据.
// 主要来源: FishBase 物种页 (体长, IUCN), Catalog of Fishes (原始组合, 模式标本, 分布), Scotcat (种名词源, 分布),
// 中文维基 (旧版 FishBase 体长), 百度百科的圆尾拟鲿条目与鄱阳湖常见鱼类网站的圆尾拟鲿条目 (鳍式, 体形比例, 须, 尾鳍, 体色, 习性, 繁殖);
// 这两个中文页面直接抓取失败 (403 与连接中断), 数值取自搜索结果的摘录, 未能打开原页面复核.
// Li, Chen 与 Chan 2005 (Zootaxa 1067, 细体拟鲿原始描述) 的鉴别段落: 本种尾鳍圆形, 有明显的白色镶边.
// 四川省水产局鱼类科普页 (分布). Kaatz 等 2010 与 Wright 2009 (鲿科胸鳍棘发声与毒腺, 均为科或属级结论).
// 分类学备注: 现行有效名 Tachysurus tenuis (Günther, 1873). 原始组合是 Macrones (Pseudobagrus) tenuis Günther, 1873,
// 正模 BMNH 1873.7.30.72, 产自上海; Bogutskaya 等 2008 把它移入 Tachysurus. 属已变动, 所以命名人加括号
// (FishBase 页面写作 (Günther, 1873), 与 Catalog of Fishes 一致). 中国文献多用 Pseudobagrus tenuis.
// 百度百科称它历史上曾与白边拟鲿有分类争议, 现确认为独立物种.
import type { SpeciesInfo, StructureId } from '../types';

export const INFO: SpeciesInfo = {
  id: 'pbtenuis',
  zh: '圆尾拟鲿',
  latin: 'Tachysurus tenuis',
  authority: '(Günther, 1873)',
  // FishBase 与 Catalog of Fishes 都没有英文俗名, 这里按种名 tenuis (细长) 与圆尾写一个描述性名称.
  en: 'Slender roundtail bagrid',
  taxonomy: {
    class: '辐鳍鱼纲 Actinopterygii',
    order: '鲇形目 Siluriformes',
    family: '鲿科 Bagridae',
  },
  // FishBase 现版: 最大 33.9 cm SL, 没有常见体长与体重.
  // 来源不一致: 中文维基 (引 FishBase 2015 版) 写体长可达 22.7 cm, Scotcat 写 22 cm. 这里按约定取 FishBase 现版.
  size: { maxLengthCm: 33.9, lengthType: 'SL' },
  // FishBase 只写 淡水, 底中层 (benthopelagic), 没有深度范围; 0 与 0 表示未知, 界面显示破折号.
  depth: { minM: 0, maxM: 0, typical: '无深度记录，栖于江河湖泊沿岸缓流的底层' },
  habitat: '小型底栖鲇类，生活在江河湖泊沿岸的缓流中，喜欢夜间活动；杂食，吃水生昆虫、小螺和小鱼小虾。',
  // Catalog of Fishes: 长江流域; Scotcat 与四川省水产局: 长江至闽江水系; 模式产地上海 (百度百科摘录写作上海崇明岛, 未能复核).
  distribution: '中国特有，分布于长江水系到闽江流域，模式产地在上海。',
  // FishBase (IUCN 2025-2): 未予评估. 鄱阳湖鱼类网站标注 易危 (VU), 可能指中国的地方或国家红色名录, 不是 IUCN 全球评估, 这里不采用.
  iucn: 'NE',
  // 鳍式取自搜索结果摘录: 百度百科 背鳍 II, 6-7, 臀鳍 20-21; 鄱阳湖鱼类网站 背鳍 II, 7, 臀鳍 21, 胸鳍 I, 8, 腹鳍 i, 6.
  // 两者一致的部分合并写出. 没有查到鳃耙数与脊椎骨数.
  meristics: {
    dorsal: 'II, 6–7',
    anal: '20–21',
    pectoral: 'I, 8',
    pelvic: 'i, 6',
  },
  // 没有查到针对本种的游泳运动学研究. 体形细长, 后部侧扁, 尾鳍圆形, 这里沿用鲿科常见的教科书分类.
  swimming: {
    mode: 'subcarangiform',
    zh: '亚鲹科式',
    note: '前半身少动，靠侧扁的后半身和尾柄左右摆动推进，尾鳍圆形而不是叉形。游泳类别是按体形沿用的教科书分类，没有查到专门研究。',
  },
  summary:
    '圆尾拟鲿是长江到闽江水系特有的小型鲿科鱼，体形细长，尾鳍圆形并镶着明显的白边，正模 1873 年采自上海。它白天藏在水底，夜里出来吃水生昆虫、小螺和小鱼虾。',
  highlights: [
    {
      title: '圆尾镶白边',
      body: '拟鲿属的尾鳍有深叉、内凹、截形和圆形几种。2005 年描述细体拟鲿时，作者就用尾鳍来区分：细体拟鲿尾鳍内凹，圆尾拟鲿则是圆尾并有明显的白色镶边。',
    },
    {
      title: '名字就是细长',
      body: '种名 tenuis 是拉丁文的细长。它的身体很延长，前部近圆筒形，后部侧扁，背鳍短小，和体形粗短的黄颡鱼、光泽拟鲿一眼就能分开。',
    },
    {
      title: '两龄成熟，近岸产卵',
      body: '圆尾拟鲿是杂食性的底栖鱼，以水生昆虫、小螺和小鱼小虾为食。它 2 龄才性成熟，比光泽拟鲿晚一年，每年 4 至 5 月在近岸浅水产卵。',
    },
  ],
  sources: [
    'https://www.fishbase.se/summary/Tachysurus-tenuis.html',
    'https://researcharchive.calacademy.org/research/ichthyology/catalog/fishcatget.asp?spid=51798',
    'https://www.scotcat.com/bagridae/tachysurus_tenuis.htm',
    'https://zh.wikipedia.org/zh-hans/%E5%9C%86%E5%B0%BE%E6%8B%9F%E9%B2%BF',
    'https://baike.baidu.com/item/%E5%9C%86%E5%B0%BE%E6%8B%9F%E9%B2%BF/580101',
    'http://www.poyangfish.com/info/82',
    'https://www.mapress.com/zootaxa/2005f/z01067p057f.pdf',
    'https://www.scsscj.cn/go-a2877.htm',
    'https://www.esf.edu/biology/faculty/documents/72.Kaatzetal2010CatfishPectSpineVocal.pdf',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC2791775/',
  ],
};

// 该物种在各结构上的特例说明 (20–60 字), 会合并进结构卡片
// 体形比例来源冲突: 百度百科摘录的形态段写 体长为体高的 6.4-10.0 倍, 为头长的 5.3-5.7 倍,
// 同一词条的概述却写 标准长为体高的 4.1-5.1 倍; 无法复核原文, 所以 NOTES 里不写具体比例.
// 须长与尾鳍也有出入: 百度百科称须均短小, 尾鳍圆形有白边; 鄱阳湖鱼类网站称颌须最长, 后伸超过眼, 尾鳍浅凹, 上下叶末端圆钝.
// 体色: 百度百科称体背灰黑, 腹部浅黄, 各鳍黑色; 鄱阳湖网站称体褐色, 无斑, 背鳍与尾鳍末端灰黑.
export const NOTES: Partial<Record<StructureId, string>> = {
  barbels: '须 4 对，色白而短小；不同资料对颌须长短说法不一，有的说颌须最长，后伸能超过眼。',
  skin: '体裸露无鳞，背部灰黑或褐色，向腹部渐浅成浅黄色，体侧没有明显斑块。',
  dorsalFin: '背鳍短小，鳍式 II, 6–7；硬刺后缘光滑，没有锯齿，这点与胸鳍刺不同。',
  pectoralFin: '胸鳍 I, 8，硬刺后缘有粗大锯齿；鲿科的胸鳍棘转动时能与肩带摩擦发声。',
  analFin: '臀鳍有 20 至 21 根鳍条，比光泽拟鲿的 22 至 28 根少。',
  caudalFin: '尾鳍圆形，边缘有明显的白色镶边，这是它和尾鳍内凹的细体拟鲿的鉴别特征。',
  spines: '背鳍刺和胸鳍刺是防身武器；Wright 2009 估计鲿科有 176 至 198 种可能带毒腺，本种没有专门研究。',
};
