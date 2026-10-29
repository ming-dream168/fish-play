// 白边拟鲿 的图鉴资料. 每条说法都对过来源, 取舍的地方在字段上方写明依据.
// 主要来源: FishBase 物种页 (体长, 体重, 鳍条, IUCN), Catalog of Fishes (原始组合, 模式产地, 合模标本, 分布),
// 百度百科的白边拟鲿条目 (鳍式, 鳃耙, 脊椎, 体形比例, 须, 鳍棘, 脂鳍, 尾鳍, 体色, 肠长, 习性, 分布; 该页标注的形态出处是专著, 但没有给出书目),
// 网易号转载的鲿科鱼类汇编 (与百度百科同一套形态描述, 另有 以水生昆虫为主要食物), 中文维基 (旧版 FishBase 体长).
// Kaatz 等 2010 与 Wright 2009 (鲿科胸鳍棘发声与毒腺, 均为科或属级结论).
// 分类学备注: 现行有效名 Tachysurus albomarginatus (Rendahl, 1928). 原始组合是 Leiocassis albomarginatus Rendahl, 1928,
// 合模 NRM 10017 (5 尾), 模式产地安徽当涂 (Tang-tu-hsien); 属已变动所以命名人加括号. 中国文献多用 Pseudobagrus albomarginatus.
// 百度百科提到有分子研究把它与 Pseudobagrus rotundicaudatus 区分开; 百度百科的圆尾拟鲿条目也说两者历史上有分类争议.
import type { SpeciesInfo, StructureId } from '../types';

export const INFO: SpeciesInfo = {
  id: 'pbalbomarg',
  zh: '白边拟鲿',
  latin: 'Tachysurus albomarginatus',
  authority: '(Rendahl, 1928)',
  // FishBase 与 Catalog of Fishes 都没有英文俗名, 这里按种名 albomarginatus (白色边缘) 写一个描述性名称.
  en: 'White-margined bagrid catfish',
  taxonomy: {
    class: '辐鳍鱼纲 Actinopterygii',
    order: '鲇形目 Siluriformes',
    family: '鲿科 Bagridae',
  },
  // FishBase: 最大 33.2 cm TL, 常见 9.0 cm SL (常见体长是标准长), 最大发表体重 35.3 g.
  // 来源不一致: 中文维基 (引旧版 FishBase) 写体长可达 16.7 cm; 33.2 cm 的鱼不可能只有 35.3 g, 两个最大值显然不是同一尾.
  // 这里按约定取 FishBase 现版的数值并在此注明.
  // 界面按 kg 保留一位小数, 35.3 g 会显示成 0.0 kg, 而且与最大体长对不上, 所以不填最大体重 (界面显示破折号).
  size: { maxLengthCm: 33.2, commonLengthCm: 9, lengthType: 'TL' },
  // FishBase 只写 淡水, 底层 (demersal), 没有深度范围; 0 与 0 表示未知, 界面显示破折号.
  depth: { minM: 0, maxM: 0, typical: '无深度记录，栖于水流较急的溪流和江河干流的底层' },
  habitat: '底栖鱼类，属山溪定居性鱼类，多栖息在水流较急的溪流和江河干流；杂食，以水生昆虫为主要食物。',
  // Catalog of Fishes: 浙江沿海河流, 模式产地安徽当涂; 百度百科: 长江中下游, 安徽歙县, 屯溪, 新安江, 瓯江丽水段, 洞庭湖沅江段.
  distribution: '中国特有，分布于长江中下游及皖南、浙江的新安江和瓯江等山区河流，南洞庭湖也有记录；模式产地安徽当涂。',
  // FishBase: LC, 评估日期 2021-11-01. Catalog of Fishes 写 IUCN (2023) LC; 类别一致, 年份取 FishBase 给出的评估日期.
  iucn: 'LC',
  iucnYear: 2021,
  // 来源不一致: 百度百科 背鳍 II-7, 臀鳍 19-21; FishBase 背鳍 2 棘 6-7 软条, 臀鳍 17-19. 这里取两者的并集.
  // 鳃耙 13-15 与脊椎骨 46 只见于百度百科. 没有查到胸鳍与腹鳍的鳍条数.
  meristics: {
    dorsal: 'II, 6–7',
    anal: '17–21',
    vertebrae: '46',
    gillRakers: '13–15',
  },
  // 没有查到针对本种的游泳运动学研究, 按体形 (体延长, 尾部侧扁, 圆尾) 沿用鲿科常见的教科书分类.
  swimming: {
    mode: 'subcarangiform',
    zh: '亚鲹科式',
    note: '前半身扁平少动，摆动集中在侧扁的尾部和尾柄，尾鳍圆形而不是叉形。游泳类别是按体形沿用的教科书分类，没有查到专门研究。',
  },
  summary:
    '白边拟鲿是长江中下游和皖浙山区河流特有的小型鲿科鱼，体细长，尾鳍圆形，边缘镶着一道白边，种名就是白色边缘的意思。它定居在水流湍急的溪流，伏在水底以水生昆虫为食。',
  highlights: [
    {
      title: '名字来自白边',
      body: '种名 albomarginatus 意为白色边缘。它体背青灰、腹部淡黄，圆形尾鳍的边缘却有一道醒目的白边，是野外辨认的主要标志；同样圆尾带白边的圆尾拟鲿曾与它混淆。',
    },
    {
      title: '脂鳍比臀鳍还长',
      body: '黄颡鱼和光泽拟鲿的脂鳍都比臀鳍短得多，白边拟鲿的脂鳍却肥厚，基部还稍长于臀鳍基，末端游离，是区分它与光泽拟鲿的直观特征。',
    },
    {
      title: '急流里的定居者',
      body: '与多数生活在湖泊缓流里的黄颡鱼类不同，它是山溪定居性鱼类，偏爱水流较急的溪流和江河干流，皖南的新安江、浙江的瓯江上游都有它。',
    },
  ],
  sources: [
    'https://www.fishbase.se/summary/Tachysurus-albomarginatus.html',
    'https://researcharchive.calacademy.org/research/ichthyology/catalog/fishcatget.asp?tbl=species&genus=tachysurus&species=albomarginatus',
    'https://baike.baidu.com/item/%E7%99%BD%E8%BE%B9%E6%8B%9F%E9%B2%BF',
    'https://www.163.com/dy/article/L5Q7C3OP05434E62.html',
    'https://zh.wikipedia.org/zh-hans/%E7%99%BD%E8%BE%B9%E6%8B%9F%E9%B2%BF',
    'https://www.esf.edu/biology/faculty/documents/72.Kaatzetal2010CatfishPectSpineVocal.pdf',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC2791775/',
  ],
};

// 该物种在各结构上的特例说明 (20–60 字), 会合并进结构卡片
// 形态均取自百度百科; 原文 脂鳍基部稍长于臂鳍基部 的 臂鳍 应为 臀鳍 的笔误.
export const NOTES: Partial<Record<StructureId, string>> = {
  barbels: '须 4 对，都较短：鼻须末端不到眼的中点，上颌须稍稍超过眼后缘。',
  jaws: '头扁平，头顶覆盖粗厚的皮肤；吻钝，宽而圆，口下位，横裂。',
  teeth: '上下颌都长着绒毛状的细齿，用来咬住水生昆虫等小型猎物。',
  eye: '眼小，头长为眼径的 6.0 至 9.2 倍；眼间隔宽而平坦。',
  skin: '体裸露无鳞，背侧青灰色，腹部淡黄色；腹膜淡黄色。',
  lateralLine: '侧线完全，皮肤上没有任何鳞片，侧线只是一行贯穿体侧的感觉孔管。',
  dorsalFin: '背鳍 II, 6–7；硬刺比胸鳍刺长，前缘光滑，后缘稍粗糙。',
  pectoralFin: '胸鳍硬刺后缘锯齿发达；鲿科的胸鳍棘转动时能与肩带摩擦发声。',
  pelvicFin: '腹鳍较长，向后伸过肛门，末端接近臀鳍起点。',
  adiposeFin: '脂鳍肥厚，基部稍长于臀鳍基部，末端游离，不与尾鳍相连。',
  caudalFin: '尾鳍圆形，边缘白色，这道白边就是种名白边的由来。',
  intestine: '肠很短，肠长只有体长的 0.5 倍左右，比植食性鱼类盘曲的长肠短得多。',
  gills: '鳃孔宽大，鳃盖膜不与峡部相连；第一鳃弓鳃耙 13 至 15 根。',
  vertebrae: '脊椎骨 46 枚，体长为体高的 4.9 至 6.4 倍，身体细长。',
};
