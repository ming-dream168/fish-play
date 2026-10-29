// 黄颡鱼 的图鉴资料. 每条说法都对过来源, 取舍的地方在字段上方写明依据.
// 主要来源: FishBase 物种页 (体长, 体重, 鳍条, 食性, 雄鱼护巢, IUCN), 鱼花网的黄颡鱼条目 (鳍式, 体形比例, 须, 鳍棘锯齿, 习性, 繁殖, 分布),
// 科普中国的黄颡鱼条目 (筑巢尺寸与雄鱼护幼), 冯晓玉等 2024《黄颡鱼的毒棘结构》(水产学报 48(6)) 的摘要,
// 国家动物标本资源库的黄颡鱼条目 (鳃耙与脊椎数, 页面本身抓取失败, 数值取自搜索结果摘录),
// Y/X 连锁 SCAR 标记与全雄群体论文的摘要 (成年雄鱼约为雌鱼的 3 倍大), 中文维基 (异名与各地俗名).
// 分类学备注: 现行有效名 Tachysurus fulvidraco (Richardson, 1846), 原名 Pimelodus fulvidraco Richardson, 1846,
// 属已变动所以命名人加括号. 中国文献长期使用 Pelteobagrus fulvidraco, 也有作者用 Pseudobagrus; 这里按 FishBase 与 Catalog of Fishes 用 Tachysurus.
// IUCN 网站未直接抓取, 保护等级与评估日期取自 FishBase 的 IUCN 栏.
import type { SpeciesInfo, StructureId } from '../types';

export const INFO: SpeciesInfo = {
  id: 'yellowcat',
  zh: '黄颡鱼',
  zhAlt: ['黄辣丁', '昂刺鱼', '黄鸭叫', '嘎牙子', '黄骨鱼'],
  latin: 'Tachysurus fulvidraco',
  authority: '(Richardson, 1846)',
  en: 'Yellow catfish',
  taxonomy: {
    class: '辐鳍鱼纲 Actinopterygii',
    order: '鲇形目 Siluriformes',
    family: '鲿科 Bagridae',
  },
  // FishBase: 最大 34.5 cm TL, 常见 8.0 cm SL (常见体长是标准长), 最大发表体重 300 g.
  // 中文维基称成鱼可达约 750 g, 与 FishBase 冲突; 这里取 FishBase.
  size: { maxLengthCm: 34.5, commonLengthCm: 8, maxWeightKg: 0.3, lengthType: 'TL' },
  // FishBase 与中文资料都没有深度记录, 0 与 0 表示未知, 界面显示破折号.
  depth: { minM: 0, maxM: 0, typical: '无深度记录，栖于静水或缓流的底层，冬季集中到深水处' },
  habitat: '底栖鱼类，喜欢水草丰盛、底泥松软的静水或缓流浅水；白天伏在水底，夜里出来觅食，主要吃水生昆虫、小虾、小鱼和螺蚌。',
  // FishBase: 老挝南马河流域与越南, 北到西伯利亚东南部 (含黑龙江流域); 鱼花网列出的中国水系.
  distribution: '分布于东亚，南到老挝和越南，北到俄罗斯西伯利亚东南部；在中国从珠江、闽江、长江、黄河、海河到松花江和黑龙江都有。',
  // FishBase: LC, 评估日期 2011-01-19.
  iucn: 'LC',
  iucnYear: 2011,
  // 背鳍 II, 6-7: 鱼花网 (第一根 II 是很短的小棘, 第二根是带锯齿的硬刺); FishBase 记 2 棘 7 软条.
  // 臀鳍: 来源不一, FishBase 19-20, 国家动物标本资源库 19-23, 鱼花网 16-20; 取包含三者的 16-23 并在此注明.
  // 胸鳍 I, 7-9 与腹鳍 6-7 取自鱼花网. 鳃耙: 鱼花网 13-16, 标本资源库记外侧 14-16; 取 13-16.
  // 脊椎 36-38 取自国家动物标本资源库 (搜索结果摘录), 未能打开原页面复核.
  meristics: {
    dorsal: 'II, 6–7',
    anal: '16–23',
    pectoral: 'I, 7–9',
    pelvic: '6–7',
    vertebrae: '36–38',
    gillRakers: '13–16',
  },
  // 没有查到针对黄颡鱼的游泳运动学研究, 按体形 (前部粗圆, 后部侧扁, 深叉尾) 沿用鲿科常见的教科书分类.
  swimming: {
    mode: 'subcarangiform',
    zh: '亚鲹科式',
    note: '前半身粗圆少动，摆动集中在侧扁的后半身和尾柄，靠深叉形尾鳍推进。游泳类别是按体形沿用的教科书分类，没有查到专门研究。',
  },
  summary:
    '黄颡鱼是中国江河湖泊里最常见的小型鲇类，体黄色带黑斑，有 4 对须，背鳍和胸鳍各有一根带锯齿的毒棘。白天伏在水底，夜里觅食；雄鱼掘坑筑巢守护卵和仔鱼。',
  highlights: [
    {
      title: '带毒的锁扣棘',
      body: '背鳍和胸鳍各有一根带倒锯齿的硬棘，外面包着含毒腺细胞的皮膜。棘基部有锁紧结构，能把棘锁在竖起或倒伏的位置，被刺后伤口灼痛。',
    },
    {
      title: '雄鱼掘巢护幼',
      body: '繁殖季亲鱼在有水草的泥沙浅滩用胸鳍刺摆动挖巢，巢径约 15 厘米、深约 10 厘米。雌鱼产完卵就离开，雄鱼留下驱赶来犯者、扇水护卵，直到仔鱼能自己游。',
    },
    {
      title: '雄大雌小',
      body: '黄颡鱼雄鱼长得比雌鱼快得多，成年雄鱼约为雌鱼的 3 倍大。养殖上借助性别连锁的分子标记筛出 YY 超雄鱼，再用它们繁育几乎全是雄鱼的苗种。',
    },
  ],
  sources: [
    'https://www.fishbase.se/summary/Tachysurus-fulvidraco.html',
    'https://www.fishbkw.com/a/360.html',
    'https://www.kepuchina.cn/article/articleinfo?business_type=100&classify=0&ar_id=355220',
    'https://search.napstic.cn/literature/periodical/010scxb202406012',
    'http://museum.ioz.ac.cn/species_detail.aspx?id=1847',
    'https://core.ac.uk/works/49708762',
    'https://zh.wikipedia.org/zh-hans/%E9%BB%84%E9%A2%A1%E9%B1%BC',
  ],
};

// 该物种在各结构上的特例说明 (20–60 字), 会合并进结构卡片
// 发声: 鲇形目普遍能靠胸鳍棘基部与肩带摩擦发声 (Kaatz 等 2010, Parmentier 等 2010 的综述性结论);
// 黄颡鱼 "刺活动时发出咯咯或嘎嘎声" 只见于中文科普资料, 没有查到针对本种的声学研究, 所以只在 pectoralFin 里简述.
export const NOTES: Partial<Record<StructureId, string>> = {
  barbels: '须 4 对：鼻须伸到眼后缘，上颌须最长，伸过胸鳍基部；颏须 2 对，外侧一对比内侧长。',
  spines: '背鳍棘和胸鳍棘外包含毒腺细胞的皮膜，毒腺细胞成层分布，没有导管；棘基部的锁紧结构能让棘保持竖起。',
  pectoralFin: '胸鳍刺发达，前缘有许多细锯齿，后缘锯齿少而粗壮；繁殖时用它在泥底摆动挖巢，转动时还能发出嘎嘎声。',
  dorsalFin: '背鳍短而高，鳍式 II, 6–7；硬刺前缘光滑，后缘有细锯齿，比胸鳍刺细长。',
  adiposeFin: '脂鳍短，后端游离，比臀鳍基短，起点大致与臀鳍上下相对。',
  analFin: '臀鳍基部长，鳍条 16 至 23 根，起点在脂鳍起点之前。',
  caudalFin: '尾鳍深分叉，上下叶等长，末端圆钝，每叶中部各有一条暗色纵纹。',
  skin: '体裸露无鳞；背部黑褐，体侧黄色，有 3 块断续的黑色斑块，腹部淡黄，各鳍灰黑。',
  eye: '眼较大，头长约为眼径的 2.9 至 3.8 倍，比鲇的眼相对大得多。',
  gills: '鳃耙 13 至 16 根，离水后能存活 5 至 6 小时，也比较耐低氧。',
};
