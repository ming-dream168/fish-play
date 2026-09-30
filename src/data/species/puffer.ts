// 暗纹东方鲀 的图鉴资料. 数值取自 FishBase 与 Catalog of Fishes 的种页, FishBase 鲀科页, 以及各字段上方注明的论文和公文.
// IUCN 网站对抓取返回 403, 保护等级取自 FishBase 的 IUCN 栏 (Version 2025-2), 并用 GBIF 接口与 IUCN 的 DOI 记录交叉核对.
//
// 出处说明: FishBase 对本种只有 Masuda 等 1984 (日本鱼类志) 一条形态描述, 没有深度, 体重, 椎骨数, 寿命.
// 深度没有任何可靠记录 (GBIF 的 92 条与 OBIS 的 20 条出现记录也都没有深度字段), 所以 depth 填 0 与 0 表示未知, 界面显示破折号, 见下方 depth 处的说明.
// 膨胀, 毒素分布, 喙齿的结构细节部分来自同科或同目其他种的研究, 文字里写明了是科或同科其他种.
import type { SpeciesInfo, StructureId } from '../types';

export const INFO: SpeciesInfo = {
  id: 'puffer',
  zh: '暗纹东方鲀',
  // 暗纹多纪鲀 是中文维基百科的条目名 (台湾用名). 河豚 是河鲀类的通称, 长江三鲜里的那一种就是本种.
  zhAlt: ['暗纹多纪鲀', '河豚'],
  latin: 'Takifugu obscurus',
  authority: '(Abe, 1949)',
  en: 'Obscure pufferfish',
  // Catalog of Fishes: 原始组合是 Sphoeroides ocellatus form obscurus Abe 1949 (模式产地为东京鱼市, 鱼获自东海及邻近水域), 现为有效种 Takifugu obscurus (Abe 1949).
  taxonomy: {
    class: '辐鳍鱼纲 Actinopterygii',
    order: '鲀形目 Tetraodontiformes',
    family: '鲀科 Tetraodontidae',
  },
  // FishBase: 最大 40.0 cm SL (Masuda 等 1984). 没有可靠的最大体重记录, 不填.
  size: { maxLengthCm: 40, lengthType: 'SL' },
  // 深度未知. FishBase 只写 底层 (demersal), 溯河 (anadromous), 海水, 半咸水与淡水, 没有深度范围; 成鱼在长江里溯河产卵, 也进入江河.
  // maxM 为 0 时界面显示破折号; 这里的 0 与 0 只是占位, 不是测量值.
  depth: { minM: 0, maxM: 0, typical: '无深度记录' },
  // FishBase: 海水, 淡水, 半咸水, 底层, 溯河; 广盐性; 成鱼溯河到淡水产卵. 中国动物物种编目数据库 (经中文维基百科转引): 近海暖温水性底层鱼类.
  // 春季溯江: 中国新闻网 2023 报道长江三鲜 (河豚, 鲥鱼, 刀鱼) 每逢春季溯江而上, 在淡水产卵繁殖后入海.
  habitat: '近海底层的溯河洄游鱼，耐受海水，半咸水和淡水，成鱼春季溯江产卵。',
  // FishBase: 西太平洋的东海与南海, 见于中国和朝鲜半岛的河流. Catalog of Fishes: 西太平洋, 淡水, 半咸水, 海水.
  distribution: '西太平洋的东海与南海，也见于中国和朝鲜半岛的河流；长江里溯河洄游的种群是长江三鲜之一。',
  // FishBase: 无危 LC, 评估日期 2014-07-16. IUCN 红色名录 2014-3 版.
  iucn: 'LC',
  iucnYear: 2014,
  // FishBase 种页: 背鳍软条 15-19, 臀鳍软条 13-16, 均无硬棘. 主鳍条 10 是 FishBase 鲀科页的科一级描述. 胸鳍条数, 椎骨数没有查到, 不填.
  // 腹鳍: 种页的鳍式里没有腹鳍, Brainerd 1994 指出鲀类的祖先就已失去骨盆, 所以填 无.
  meristics: {
    dorsal: '15–19',
    anal: '13–16',
    pelvic: '无',
    caudal: '主鳍条 10（鲀科）',
  },
  // Gordon 等 1996 (Arothron 属两个种的高速摄影): 胸鳍与背鳍, 臀鳍一起产生推进力, 身体倾斜 3-10 度口朝上, 胸鳍两侧交替波动, 背鳍与臀鳍同相摆动,
  // 游速超过 3 体长每秒时才开始摆尾. 这是同科其他属的测量, 没有本种的游泳记录. 遇险反应: Integr Zool 2015 对本种的研究, 快速逃窜与膨胀两种反应并存.
  swimming: {
    mode: 'tetraodontiform',
    zh: '鲀形式',
    note: '同科的 Arothron 属测得：背鳍，臀鳍和胸鳍一起拍动推进，速度较高时才摆尾。本种遇险时会快速逃窜，也会鼓起身体。',
  },
  // 中国新闻网 2023: 河豚, 鲥鱼和刀鱼被称为长江三鲜, 春季溯江产卵. 农办渔 2016 年 53 号文: 有条件放开养殖红鳍东方鲀和养殖暗纹东方鲀的加工经营,
  // 第十一条 禁止加工经营所有品种的野生河鲀. 文件是 2016 年 9 月的版本, 之后有没有修订本次没有核对.
  summary:
    '暗纹东方鲀是溯河洄游的河豚，成鱼春季从海里溯长江而上产卵，与刀鱼，鲥鱼并称长江三鲜。野生个体含河豚毒素；按 2016 年的文件，养殖鱼可有条件加工，野生河鲀禁止加工经营。',
  highlights: [
    // Zhao 等 2010 (对本种的解剖, X 光与染色): 受刺激后快速频繁地把水或空气吞进一个柔韧而坚韧的囊, 囊是特化食道的一部分, 皮肤与腹肌束被特化得富有弹性,
    // 脊柱与神经也能灵活改变位置. 体积倍数出自 McGee 与 Clark 2014 的引言 (河鲀类整体, 三到四倍, 不易被吞下), Brainerd 1994 对刺鲀是三倍, 都不是本种的实测.
    {
      title: '膨胀',
      body: '受刺激后，它快速反复吞入水或空气，灌进一个柔韧的囊，胀成球形；河鲀类膨胀后的体积可达静止时的三到四倍。皮肤和腹肌束都特化得富有弹性。',
    },
    // Noguchi 与 Arakawa 2008 表 1 (日本河鲀, 最大毒性): 本种卵巢大于 1000 MU/g, 肝, 皮肤, 肠各 100-1000 MU/g, 精巢与肌肉小于 10 MU/g;
    // 毒素主要由海洋细菌产生, 河鲀经食物链累积, 但作者也写明食物链里毒素的确切来源仍不清楚; 用无毒饲料养大的河鲀无毒.
    // Ji 等 2011: 565 尾养殖河鲀 (含暗纹东方鲀) 的皮, 肌肉, 肝, 精巢都小于 10 MU/g, 只有 1 个养殖红鳍东方鲀的卵巢样品是 125 MU/g.
    // 上海市农业农村委员会: 淡水投喂配合饲料的 1 至 3 龄暗纹东方鲀均无毒或低毒. 政策: 农办渔 2016 年 53 号文.
    {
      title: '河豚毒素',
      body: '野生鱼的毒素以卵巢最强，肝，皮肤和肠也高；一般认为源自细菌，经食物链累积。无毒饲料养大的鱼几乎无毒。按 2016 年的文件，养殖鱼可有条件加工，野生河鲀禁止加工经营。',
    },
    // FishBase 鲀科页: 每个颌里的牙愈合, 但在中线被一道缝分开, 共 4 颗愈合的牙; 科名来自希腊语 tetra 四 与 odous 牙.
    {
      title: '四颗牙的喙',
      body: '鲀科的牙在上下颌各自愈合，中线处有一道缝，合起来共 4 颗愈合的牙。科名 Tetraodontidae 的希腊词根就是四颗牙的意思。',
    },
  ],
  sources: [
    'https://www.fishbase.se/summary/Takifugu-obscurus.html',
    'https://www.fishbase.se/summary/FamilySummary.php?ID=448',
    'https://researcharchive.calacademy.org/research/ichthyology/catalog/fishcatget.asp?tbl=species&genus=Takifugu&species=obscurus',
    'https://doi.org/10.2305/IUCN.UK.2014-3.RLTS.T169599A65114097.en',
    'http://www.moa.gov.cn/govpublic/YYJ/201612/t20161229_5421120.htm',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC2525488/',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC7290894/',
    'https://pubmed.ncbi.nlm.nih.gov/20362605/',
    'https://doi.org/10.1111/j.1365-2109.2010.02707.x',
    'https://nyncw.sh.gov.cn/bwbdscl/20190214/0009-114429.html',
    'https://www.zoores.ac.cn/en/article/doi/10.3724/SP.J.1141.2010.05539',
    'https://fishlab.ucdavis.edu/wp-content/uploads/sites/397/2020/06/Wainwright-Turnigan-1997.pdf',
    'https://pubmed.ncbi.nlm.nih.gov/29865387/',
    'https://pubmed.ncbi.nlm.nih.gov/24920302/',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC4298192/',
    'https://doi.org/10.1111/j.1095-8649.1996.tb00026.x',
    'http://www.chinanews.com.cn/cj/2023/03-18/9974314.shtml',
    'https://zh.wikipedia.org/wiki/%E6%9A%97%E7%BA%B9%E4%B8%9C%E6%96%B9%E9%B2%80',
  ],
};

// 该物种在各结构上的特例说明 (20–60 字), 会合并进结构卡片.
// 毒素部位: Noguchi 与 Arakawa 2008 表 1 (野生鱼各组织的最大毒性, 1 MU 约含 0.2 微克毒素), Zhang 等 2020 (喂毒实验, 三月龄幼鱼各组织占体内总毒素的比例),
// Ji 等 2011 (养殖河鲀); 囊, 皮肤, 脊柱: Zhao 等 2010; 鳃条骨: Integr Zool 2015 对本种的研究; 无肋骨与牙: FishBase 鲀科页;
// 无骨盆: Brainerd 1994 对刺鲀的研究 (指出这些特征在鲀类祖先里就有).
export const NOTES: Partial<Record<StructureId, string>> = {
  stomach: '水和空气灌进一个柔韧的囊。对本种的解剖研究认为它是特化食道的一部分，其他研究多称它为胃。',
  liver: '野生鱼肝的最大毒性为 100 至 1000 MU/g，低于卵巢；养殖鱼的肝一般低于 10 MU/g。',
  gonad: '野生鱼的卵巢毒性最强，最大值超过 1000 MU/g；精巢最大也低于 10 MU/g。1 MU 约含 0.2 微克毒素。',
  skin: '体表布满细小的皮刺，体侧胸鳍下方和背鳍基部有大黑斑。喂毒实验里，幼鱼的皮肤存下了约 70% 的毒素。',
  teeth: '鲀科的牙在上下颌各自愈合，中线处有一道缝，合起来共 4 颗愈合的牙。',
  pelvicFin: '河鲀没有骨盆，也就没有腹鳍。这一特征在鲀类祖先里就有，也有利于身体膨胀。',
  ribs: '鲀科没有肋骨。这一特征在鲀类祖先里就有，也有利于身体膨胀。',
  swimBladder: '喂毒实验里，鳔，鳃，血液，肠和肌肉各只占体内总毒素的约 1% 至 4%。',
  branchiostegals: '第一根鳃条骨特别粗大，连着的肌肉也很发达，是膨胀时口腔像泵一样吸进和排出水的关键。',
  vertebrae: '膨胀时脊柱和神经都要配合，能灵活地改变位置。',
  kidney: '喂毒实验里，肾和胆囊的毒素占比最低，只有 0.11% 至 0.78%；肾排毒也较快。',
  gallBladder: '喂毒实验里，胆囊和肾一样，毒素占比最低，只有 0.11% 至 0.78%。',
  intestine: '野生鱼肠的最大毒性也在 100 至 1000 MU/g；喂毒实验里肠排毒较快。',
};
