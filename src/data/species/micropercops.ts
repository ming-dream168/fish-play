// 小黄黝鱼 的图鉴资料. 每条说法都对过来源, 取舍的地方在字段上方写明依据.
// 主要来源: 中国动物志 硬骨鱼纲 鲈形目(五) 虾虎鱼亚目 (伍汉霖等 2008) 经中国生物物种名录 (Sp2000 中国节点) 发布的条目
// (鳍式, 鳞式, 椎骨, 形态, 生活习性), FishBase 物种页 (体长, IUCN), Catalog of Fishes (学名与同物异名),
// Uchida 与 Sato 2024 (日本埼玉县标本的计数与鲜活体色), Iwata 等 2001 (韩国种群的产卵与发育),
// 以及滇池与西藏入侵种群的两篇研究摘要 (PubMed).
// 分类学备注: 原始组合为 Eleotris swinhonis Günther, 1873, 模式产地上海; 旧文献多写作 Hypseleotris swinhonis (中文旧名"黄黝鱼"由此而来).
// Catalog of Fishes 把 Micropercops dabryi 与 M. borealis 都列为有效种, 并提到有作者把本种并入 M. cinctus; 中国动物志 (Wu 2008)
// 则只承认本属 1 种, 日本的移入个体也都鉴定为 M. swinhonis. 这里按中国动物志和 FishBase 用 M. swinhonis, 不细分.
// 目一级: FishBase 归鰕虎目 Gobiiformes; 中国动物志仍放在鲈形目鰕虎鱼亚目, 这里按现行分类写鰕虎目.
// IUCN 网站未直接抓取; 等级取自 FishBase 的 IUCN 栏, 并用 GBIF 接口 (iucnTaxonID 169644) 交叉核对了类别. 中文维基写"未评估", 已过时.
import type { SpeciesInfo, StructureId } from '../types';

export const INFO: SpeciesInfo = {
  id: 'micropercops',
  zh: '小黄黝鱼',
  // 中国生物物种名录俗名栏: 黄黝鱼 (朱元鼎 1932), 史氏黄黝鱼, 达氏黄黝鱼, 斑黄黝鱼 (均王以康 1958)
  zhAlt: ['黄黝鱼', '史氏黄黝鱼', '达氏黄黝鱼', '斑黄黝鱼'],
  latin: 'Micropercops swinhonis',
  authority: '(Günther, 1873)',
  // FishBase 与 GBIF 都没有英文俗名 ("Chinese sleeper" 通常指同科的葛氏鲈塘鳢 Perccottus glenii, 不用).
  // 这里用 FishBase 的科名俗称 freshwater sleeper 加上种名纪念的 Swinhoe 组成描述性名称, 不是正式俗名.
  en: "Swinhoe's freshwater sleeper",
  taxonomy: {
    class: '辐鳍鱼纲 Actinopterygii',
    order: '鰕虎目 Gobiiformes',
    family: '沙塘鳢科 Odontobutidae',
  },
  // FishBase: 最大 6.2 cm TL. 中国动物志: 最大个体 61 mm (测量标本体长 29-65 mm, 两处数字略有出入). 水族商 Aquarium Glaser 称可达约 8 cm, 未采用.
  // 没有体重记录.
  size: { maxLengthCm: 6.2, lengthType: 'TL' },
  // FishBase 无深度记录. 日本埼玉县的采集点水深约 60 cm (Uchida 与 Sato 2024), 只是单一记录, maxM 填 0 表示未知.
  depth: { minM: 0, maxM: 0, typical: '河溪、池塘和湖沼的浅水草丛' },
  // 中国动物志: 常成群生活于浅水的中下层及入湖溪流的水草丛中, 喜潜伏于水底; 食浮游动物, 水生昆虫, 摇蚊幼虫, 小虾和藻类.
  habitat: '小型底栖鱼，成群生活在河溪、池塘和湖沼浅水的水草丛中，喜欢伏在水底，啄食浮游动物、摇蚊幼虫和小虾。',
  // Iwata 等 2001, Uchida 与 Sato 2024: 自然分布于中国和朝鲜半岛; 中国动物志记为中国特有, 东北至西南都有标本.
  // Catalog of Fishes 只把长江流域列为原产, 华北等地记为引入; 滇池与西藏的种群被当作入侵种研究 (Chen 等 2021, Wang 等 2018).
  // 日本 2000 年在爱知县首次发现, 之后在关东利根川水系扩散, 据信混在钓饵用活虾里传入.
  distribution: '原产中国东部各大水系和朝鲜半岛，以长江流域为中心；已随鱼苗和饵料活虾扩散到云南滇池、西藏和日本关东等地。',
  // FishBase: LC, 评估日期 2007-03-01; GBIF 接口同为 LC. Catalog of Fishes 引作 IUCN (2009).
  iucn: 'LC',
  iucnYear: 2007,
  // 中国动物志: 1 龄性成熟; 没有找到寿命记录, 不填 lifespan.
  // 鳍式, 鳞式, 鳃耙, 椎骨取自中国动物志: 背鳍 VII-VIII, I-10~12; 臀鳍 I-8~9; 胸鳍 14~15; 腹鳍 I-5; 尾鳍 24~25 (应含前方的短鳍条);
  // 纵列鳞 28~32; 鳃耙 3+8; 椎骨 32. Uchida 与 Sato 2024 的日本标本为 VIII-I, 10; I, 8; 胸鳍 14; 纵列鳞 34, 鳞数略高于动物志范围.
  // 鰕虎类体侧没有侧线管, lateralLine 填的是纵列鳞数.
  meristics: {
    dorsal: 'VII–VIII; I, 10–12',
    anal: 'I, 8–9',
    pectoral: '14–15',
    pelvic: 'I, 5',
    caudal: '24–25',
    vertebrae: '32',
    lateralLine: '纵列鳞 28–32（无侧线）',
    gillRakers: '3 + 8',
  },
  // 没有查到针对本种游泳方式的专门研究; 类别按体形与鳍形的通行归类填写.
  swimming: {
    mode: 'subcarangiform',
    zh: '亚鲹科式',
    note: '多数时间伏在水底或草丛间，用胸鳍和腹鳍支撑身体；移动时靠身体后段和长圆形尾鳍摆动，短促地窜一段又停下。',
  },
  summary:
    '小黄黝鱼体长不过 6 厘米，体侧有成对的暗色横带，成群伏在浅水草丛的水底。它 1 龄就能繁殖，雄鱼守护贴在巢顶的卵；近年随鱼苗和饵料虾扩散到云南、西藏和日本。',
  highlights: [
    {
      title: '雄鱼守巢',
      // Iwata 等 2001 (韩国种群): 雌鱼 4 月中旬至 7 月初多次产卵, 每批约 100-500 粒, 单层贴在雄鱼守护的巢的下表面, 产后约 12 天孵化.
      // 该文摘要经检索摘录核对, BioOne 全文页未能抓取.
      body: '雌鱼在 4 月中旬到 7 月初多次产卵，每批约 100 至 500 粒，单层贴在巢穴顶部的下表面，由雄鱼守护，约 12 天后孵出仔鱼。',
    },
    {
      title: '搭便车的入侵者',
      // Uchida 与 Sato 2024: 混入钓饵用活虾 (中华长臂虾, 新米虾属) 被指为传入途径, 2000 年爱知县首次记录, 之后见于群马, 茨城, 千叶, 埼玉.
      // Wang 等 2018: 西藏查巴朗湿地的入侵种群鳃上发现车轮虫, 可能把寄生虫带给土著鱼.
      body: '它常混在作钓饵的活虾里被带走：2000 年首次出现在日本爱知县，后在关东利根川水系扩散；在西藏，入侵种群还把鳃上的车轮虫带进了当地湿地。',
    },
    {
      title: '一属几种',
      // Catalog of Fishes: M. dabryi 与 M. borealis 列为有效种, 另有作者并入 M. cinctus; 英文维基据 FishBase (2023) 列出 5 个种名
      // (borealis, cinctus, dabryi, hotayensis, swinhonis); 中国动物志 (Wu 2008) 只承认 1 种.
      body: '中国动物志把小黄黝鱼属当作只有 1 种；FishBase 和 Catalog of Fishes 却列出达氏、北方等多达 5 个种名，本属有几种至今没有定论。',
    },
  ],
  sources: [
    'http://www.sp2000.org.cn/Fauna/fauna/show/23317',
    'https://www.fishbase.se/summary/Micropercops-swinhonis.html',
    'https://researcharchive.calacademy.org/research/ichthyology/catalog/fishcatget.asp?genus=Micropercops&tbl=species',
    'https://zh.wikipedia.org/zh-hans/%E5%B0%8F%E9%BB%84%E9%BB%9D%E9%B1%BC',
    'https://api.gbif.org/v1/species/2390027/iucnRedListCategory',
    'https://www.museum.kagoshima-u.ac.jp/ichthy/INHFJ_2024_049_068.pdf',
    'https://doi.org/10.2108/zsj.18.91',
    'https://pubmed.ncbi.nlm.nih.gov/34658223/',
    'https://pubmed.ncbi.nlm.nih.gov/29804193/',
    'https://en.wikipedia.org/wiki/Micropercops',
  ],
};

// 该物种在各结构上的特例说明 (20–60 字), 会合并进结构卡片. 形态描述除另注外均取自中国动物志.
export const NOTES: Partial<Record<StructureId, string>> = {
  // 中国动物志 (液浸标本) 与 Uchida 与 Sato 2024 (鲜活个体: 体侧 9 条淡色暗横带, 腹鳍至尾柄带黄色, 臀鳍与尾鳍基部带橙色)
  skin: '头体灰褐带浅棕色，体侧中央有 12 至 16 条成对排列的暗色横带；鲜活个体腹侧至尾柄常带黄色。',
  scales: '体被中大栉鳞，头部与前鳃盖前部是圆鳞，胸部和胸鳍基部被小圆鳞，吻部和眼间隔无鳞。纵列鳞 28–32 枚。',
  lateralLine: '体侧没有侧线管；头部有感觉管和 5 个管孔，前鳃盖后缘另有 4 个管孔，颊部有 4 条感觉乳突线。',
  dorsalFin: '第一背鳍高而基部短，鳍棘柔软，第三棘最长；第二至第六棘中部鳍膜黑色，连成一条黑纹。',
  secondDorsalFin: '第二背鳍略高于第一背鳍，1 棘 10 至 12 软条，有 2 行黑点组成的纵纹，平放时不达尾鳍基。',
  analFin: '臀鳍与第二背鳍相对、同形，1 棘 8 至 9 软条，起点在第二背鳍第四鳍条下方，鳍色暗灰。',
  caudalFin: '尾鳍长圆形，短于头长，上面有 6 行黑色横纹。',
  pectoralFin: '胸鳍宽圆，长约等于吻后头长，后缘几乎伸到肛门上方；胸鳍基前上方有 1 条细长黑斜纹。',
  pelvicFin: '腹鳍圆形，左右分离，不愈合成吸盘，这是沙塘鳢科区别于鰕虎鱼科的关键特征。',
  teeth: '上下颌齿细小尖锐，呈绒毛状多行排成齿带，没有犬齿；犁骨、腭骨和舌上都没有牙。',
  operculum: '前鳃盖骨边缘光滑无棘；左右鳃盖膜在峡部中部相遇并愈合，与峡部也有少许相连。',
  // 中国动物志: 1 龄性成熟, 怀卵量 864-1037 粒; 雄鱼生殖乳突细长而尖, 雌鱼短钝, 后缘微凹.
  gonad: '1 龄性成熟，怀卵 864 至 1037 粒；雄鱼生殖乳突细长而尖，雌鱼的短钝，可据此分辨雌雄。',
};
