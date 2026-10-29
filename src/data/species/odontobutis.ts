// 河川沙塘鳢 的图鉴资料. 每条说法都对过来源, 取舍的地方在字段上方写明依据.
// 主要来源: 中国动物志 硬骨鱼纲 鲈形目(五) 虾虎鱼亚目 (伍汉霖等 2008) 经中国生物物种名录 (Sp2000 中国节点) 发布的条目
// (鳍式, 鳞式, 形态, 生活习性, 分布), FishBase 物种页 (体长, IUCN), Catalog of Fishes (学名与原始组合),
// Xiang 等 2025 (南四湖种群的繁殖生物学), Hu 等 2022 (种群遗传与资源现状), Iwata 等 1988 (同属两种的鳔).
// 分类学备注: 原始组合为 Eleotris potamophila Günther, 1861, 模式产地长江. Catalog of Fishes 与 FishBase 把种加词当形容词,
// 按属名阳性写作 Odontobutis potamophilus; 中国动物志, 中国生物物种名录与 GBIF 仍用 potamophila. 这里按任务与国内通行写法用 potamophila.
// 目一级: FishBase 与 Hu 等 2022 归鰕虎目 Gobiiformes; 中国动物志 (2008) 仍放在鲈形目鰕虎鱼亚目, 这里按现行分类写鰕虎目.
// IUCN 网站未直接抓取; 等级取自 FishBase 的 IUCN 栏, 并用 GBIF 接口 (iucnTaxonID 188066) 交叉核对了类别.
import type { SpeciesInfo, StructureId } from '../types';

export const INFO: SpeciesInfo = {
  id: 'odontobutis',
  zh: '河川沙塘鳢',
  // 塘鳢鱼, 菜花塘鳢: 苏州地方叫法 (扬子晚报 2026-03 报道); 河川鲈塘鳢: 王以康 1958 (中国生物物种名录俗名栏).
  // 常被提到的"虎头鲨", "土步鱼"没有找到可核对的来源, 不列.
  zhAlt: ['沙塘鳢', '塘鳢鱼', '菜花塘鳢', '河川鲈塘鳢'],
  latin: 'Odontobutis potamophila',
  authority: '(Günther, 1861)',
  // FishBase 与 GBIF 没有英文俗名; "(freshwater) dark sleeper" 是中国学者英文论文的通行叫法 (见 PubMed 上基因组, 免疫等多篇论文标题, 如 PMID 33576781).
  en: 'Dark sleeper',
  taxonomy: {
    class: '辐鳍鱼纲 Actinopterygii',
    order: '鰕虎目 Gobiiformes',
    family: '沙塘鳢科 Odontobutidae',
  },
  // 中国动物志: 体长可达 165 mm, 重达 59 g (测量标本 212 尾, 体长 43-158 mm). FishBase: 最大 15.2 cm TL, 常见 11.5 cm SL.
  // 两者口径不同 (动物志的体长为标准长), 这里取动物志的实测上限, 常见体长取 FishBase.
  size: { maxLengthCm: 16.5, commonLengthCm: 11.5, maxWeightKg: 0.059, lengthType: 'SL' },
  // FishBase 无深度记录; 中国动物志只说喜栖浅水区, 没有具体数值, 所以 maxM 填 0 表示未知.
  depth: { minM: 0, maxM: 0, typical: '湖泊、江河和河沟近岸的浅水底层' },
  // 中国动物志: 底层鱼类, 喜栖息于泥沙, 杂草和碎石相混杂的浅水区, 游泳力较弱, 冬季潜伏在泥沙底中越冬.
  habitat: '小型底栖鱼，伏在湖泊、江河与河沟浅水区的泥沙、水草和碎石间，游泳力弱，等虾和小鱼靠近再突然扑食；冬季钻进泥沙越冬。',
  // 中国动物志: 长江中下游 (湖北荆州至上海江段) 及沿江各支流, 钱塘江, 闽江水系, 偶见于黄河水系, 记为中国特有种.
  // FishBase 另列越南, 与动物志不一致. 楚天都市报 2025 报道本种已在北京多条河道自然繁殖, 属外来扩散.
  distribution: '中国东部特有，分布于长江中下游及沿江支流、钱塘江和闽江水系，偶见于黄河水系；近年已扩散到北京等地的河道。',
  // FishBase: DD, 评估日期 2010-08-31; GBIF 接口同为 DD. Catalog of Fishes 引作 IUCN (2012).
  iucn: 'DD',
  iucnYear: 2010,
  // Xiang 等 2025 南四湖 894 尾样本的年龄组为 1 至 3 龄; 没有找到最大寿命的专门记录.
  lifespan: '野外样本最高见 3 龄',
  // 全部取自中国动物志 (括号内为众数): 背鳍 VI-VIII, I-7~10 (VII, I-9 为主); 臀鳍 I-6~9 (I-7 为主); 胸鳍 14~17 (15 为主);
  // 腹鳍 I-5; 尾鳍 17; 纵列鳞 34~41 (36~37 为主); 鳃耙 1~3+5~10. 鰕虎类体侧没有侧线管, 这里的 lateralLine 填的是纵列鳞数.
  // 脊椎数未找到可靠来源, 不填.
  meristics: {
    dorsal: 'VI–VIII; I, 7–10',
    anal: 'I, 6–9',
    pectoral: '14–17',
    pelvic: 'I, 5',
    caudal: '17',
    lateralLine: '纵列鳞 34–41（无侧线）',
    gillRakers: '1–3 + 5–10',
  },
  // 没有查到针对沙塘鳢游泳方式的专门研究; 类别按体形与鳍形的通行归类填写. 游泳力弱一说来自中国动物志.
  swimming: {
    mode: 'subcarangiform',
    zh: '亚鲹科式',
    note: '平时用宽大的胸鳍和腹鳍撑在水底不动，捕食或受惊时靠身体后半段和圆尾猛摆一两下，短距离冲出后又停下。',
  },
  summary:
    '河川沙塘鳢是长江中下游的小型底栖鱼，头宽口大，体侧有三四块鞍状黑斑，常伏在泥沙碎石间等猎物靠近。雄鱼在石缝或蚌壳里守卵；江南人称“菜花塘鳢”，是春季名菜。',
  highlights: [
    {
      title: '雄鱼守巢',
      // 中国动物志: 4-6 月在洞穴, 蚌壳内分批产卵, 卵黏附巢穴内壁, 雌鱼离去, 雄鱼守巢至孵化, 摄食强度很低.
      // Xiang 等 2025: 4 月雌雄比 2.14:1, 归因于护巢雄鱼不易被捕到.
      body: '春季雌鱼把黏性卵产在石缝、洞穴或空蚌壳内壁，随即离开，由雄鱼守巢直到孵化，期间几乎只吃游到巢边的猎物。南四湖 4 月的渔获里雌鱼是雄鱼的 2 倍多。',
    },
    {
      title: '伏击型猎手',
      // 中国动物志: 游泳力较弱; 成鱼摄食沼虾, 螺蛳, 麦穗鱼, 水生昆虫; 幼鱼食水蚯蚓, 摇蚊幼虫. 口大, 下颌突出, 齿呈绒毛状齿带.
      body: '它游得不快，靠体色与泥沙碎石融为一体，伏着等猎物经过。大口一张就把沼虾、螺蛳、麦穗鱼吞进去，颌上细密的绒毛状齿带让猎物难以挣脱。',
    },
    {
      title: '菜花塘鳢',
      // 扬子晚报 2026-03: 老苏州称"菜花塘鳢", 3 月中旬集中上市, 菜花盛开时为旺季. Hu 等 2022 与 Xiang 等 2025: 过度捕捞与生境退化致野生资源下降,
      // 建议 3-6 月禁捕, 最小可捕体长 80 mm.
      body: '油菜花开时正值繁殖前后，鱼体肥美，苏州人称“菜花塘鳢”。野生资源因过度捕捞而减少，研究者建议 3 至 6 月禁捕，体长不足 8 厘米的不捕。',
    },
  ],
  sources: [
    'http://www.sp2000.org.cn/Fauna/fauna/show/23320',
    'https://www.fishbase.se/summary/Odontobutis-potamophila.html',
    'https://researcharchive.calacademy.org/research/ichthyology/catalog/fishcatget.asp?genus=Odontobutis&tbl=species',
    'https://zh.wikipedia.org/zh-hans/%E6%B2%B3%E5%B7%9D%E6%B2%99%E5%A1%98%E9%B3%A2',
    'https://api.gbif.org/v1/species/2390048/iucnRedListCategory',
    'https://doi.org/10.3390/ani15213150',
    'https://doi.org/10.3389/fgene.2022.843848',
    'https://pubmed.ncbi.nlm.nih.gov/33576781/',
    'https://kiss.kstudy.com/Detail/Ar?key=95147',
    'https://www.yzwb.net/news/yysp/202603/t20260302_326912.html',
    'https://www.ctdsb.net/c1716_202509/2538767.html',
  ],
};

// 该物种在各结构上的特例说明 (20–60 字), 会合并进结构卡片. 形态描述除另注外均取自中国动物志.
export const NOTES: Partial<Record<StructureId, string>> = {
  skin: '头体黑青色，体侧有 3 至 4 块宽而不整齐的鞍形黑斑，从背部跨到体侧，是伏在泥沙碎石间的保护色。',
  scales: '体被栉鳞，腹部和胸鳍基部是圆鳞；鳃盖、颊部和项部也有小栉鳞，吻部与头腹面无鳞。纵列鳞 34–41 枚。',
  lateralLine: '体侧没有侧线管；头上只在眼后有感觉管孔，眼下有几行感觉乳突线，靠它们感知水流。',
  dorsalFin: '第一背鳍多为 7 根柔弱鳍棘，起点在胸鳍基上方，第三、四棘最长；雄鱼最后一棘几乎伸到第二背鳍。',
  secondDorsalFin: '第二背鳍比第一背鳍高，基部较长，多为 1 棘 9 软条，平放时不达尾鳍基。',
  analFin: '臀鳍与第二背鳍上下相对、形状相同，多为 1 棘 7 软条，起点在第二背鳍第三或第四鳍条下方。',
  caudalFin: '尾鳍圆形，边缘白色，基部有时有 2 块黑斑；短促冲刺时提供主要推力。',
  pectoralFin: '胸鳍宽圆呈扇形，后端越过第一背鳍基底；基部上下方各有 1 条长条黑斑。',
  pelvicFin: '腹鳍短小，左右靠近但不愈合成吸盘，这是沙塘鳢科区别于鰕虎鱼科的关键特征。',
  jaws: '口大，前位斜裂，下颌突出长于上颌，上颌骨后端伸到眼中部下方，适合一口吞下猎物。',
  // Iwata 等 1988: 同属的 O. platycephala 鳔不发达而贴底游, O. obscura interrupta 鳔发达, 摄食期会上浮. 未找到本种鳔的直接描述.
  swimBladder: '同属种类都有鳔，但发达程度不一：韩国的平头沙塘鳢鳔不发达、贴底游，另一种鳔发达；本种未见专门描述。',
  // Xiang 等 2025 (南四湖): 雌雄 1 龄约 73.6 mm 性成熟, 5 月 GSI 峰值 28.92%, 绝对怀卵量 643-8904 粒.
  gonad: '1 龄、体长约 7.4 厘米性成熟；5 月产卵高峰时卵巢重可达去内脏体重的近三成，怀卵 643 至 8904 粒。',
};
