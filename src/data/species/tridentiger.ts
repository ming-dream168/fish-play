// 双带缟鰕虎 的图鉴资料. 每条说法都对过来源, 取舍的地方在字段上方写明依据.
// 主要来源: 中国生物物种名录 (Sp2000 中国节点) 的双带缟虾虎鱼条目, 摘自《中国动物志 硬骨鱼纲 鲈形目 (五) 虾虎鱼亚目》
// (伍汉霖, 钟俊生等 2008; 可数性状, 三叉形齿, 头部感觉管孔, 体色随体长变化, 生境, 中国分布);
// Eschmeyer's Catalog of Fishes (学名, 模式产地, 科的归属, 引入地); FishBase 物种页 (最大体长, 生态类型, IUCN);
// 美国地质调查局 (USGS) 非本土水生物种 (NAS) 物种页 (加州入侵史, 盐度偏好, 雄鱼筑巢护卵, 寿命, 食性);
// 英文维基 (欧洲首次记录), 比利时自然与森林研究所 (INBO) 的文献页 (Verhelst 与 Verreycken 2023), FISHBIO 物种页.
// 学名: Catalog of Fishes 记为有效名 Tridentiger bifasciatus Steindachner, 1881, 模式产地为俄罗斯符拉迪沃斯托克附近的
// 斯特列洛克湾; 原组合即 Tridentiger, 命名人不加括号. 早期作者曾把它并入纹缟鰕虎鱼 T. trigonocephalus (Gill, 1859), 现已分开;
// Jordan 与 Snyder 1901 的 T. bucco 是它的异名.
// 科的归属: FishBase 放在鰕虎鱼科 Gobiidae 的 Gobionellinae 亚科; Catalog of Fishes 把 Gobionellinae 移入 Oxudercidae.
// 这里按任务给定写 Gobiidae.
import type { SpeciesInfo, StructureId } from '../types';

export const INFO: SpeciesInfo = {
  id: 'tridentiger',
  zh: '双带缟鰕虎',
  // 中国动物志与中国生物物种名录写作 "双带缟虾虎鱼"
  zhAlt: ['双带缟虾虎鱼', '双带缟鰕虎鱼'],
  latin: 'Tridentiger bifasciatus',
  authority: 'Steindachner, 1881',
  en: 'Shimofuri goby',
  taxonomy: {
    class: '辐鳍鱼纲 Actinopterygii',
    order: '鰕虎目 Gobiiformes',
    family: '鰕虎鱼科 Gobiidae',
  },
  // FishBase: 最大 12.0 cm TL; 没有最大体重. 英文维基也写最大 12 cm.
  // 来源不一致: USGS 写可达 11 cm; FISHBIO 写最大记录 105 mm TL, 常见 30–65 mm;
  // 中国动物志写体长 80–100 mm, 大者可达 120 mm (测量标本体长 33–92 mm). 这里取 FishBase.
  size: { maxLengthCm: 12, lengthType: 'TL' },
  // 没有找到任何深度数据 (FishBase, USGS 都没有). maxM 为 0 时界面显示破折号; 这里的 0 与 0 只是占位, 不是测量值.
  depth: { minM: 0, maxM: 0, typical: '河口、内湾和近岸的浅水沙泥底' },
  // 中国动物志: 近岸底层小型鱼类, 栖息于河口半咸水与淡水水域, 内湾及近岸浅水沙泥底, 也进入江河下游淡水.
  // USGS: 偏好半咸水到淡水, 盐度约 22‰ 以下; 雄鱼在牡蛎壳, 石缝, 木头, 罐头和瓶子等有硬质内壁的空腔里筑巢. 腹鳍愈合成吸盘.
  habitat:
    '贴底生活的河口小鱼，多见于河口半咸水、内湾和近岸浅水的沙泥底，也进入江河下游的淡水；靠腹鳍愈合成的吸盘伏在水底，躲进牡蛎壳、石缝和人造杂物的空腔里，主要吃底栖小型无脊椎动物。',
  // 中国动物志: 分布于中国沿海, 国外见于朝鲜半岛和日本; 标本采自上海至广西. Catalog of Fishes: 西北太平洋, 从越南北部, 中国到朝鲜半岛,
  // 俄罗斯和日本; 已引入或定居于美国加州, 阿根廷, 比利时, 以及中国安徽.
  distribution:
    '原产西北太平洋沿岸，从越南北部、中国沿海到朝鲜半岛、日本和俄罗斯远东；已入侵美国加利福尼亚，并在阿根廷和比利时出现。',
  // FishBase 的 IUCN 栏: LC, 评估日期 2020-03-12. Catalog of Fishes 写作 "IUCN (2022): Least Concern", 应是发布年份不同, 这里用评估年.
  iucn: 'LC',
  iucnYear: 2020,
  // USGS: 一年性成熟, 最长寿命 2 年; FISHBIO: 多数个体活 12–18 个月, 少数到 2 年
  lifespan: '多为 1 至 1.5 年，最长约 2 年',
  // 可数性状取自中国动物志 (经中国生物物种名录): 背鳍 VI, I-12–13; 臀鳍 I-10–11; 胸鳍 18–20; 腹鳍 I-5; 尾鳍 17–19;
  // 纵列鳞 54–58, 横列鳞 17–20, 背鳍前鳞 11–20; 鳃耙 3–4+7–8; 椎骨 26.
  // 鰕虎类体侧没有侧线管 (中国动物志: "无侧线"), 所以 lateralLine 一栏填的是纵列鳞数, 不是侧线鳞.
  meristics: {
    dorsal: 'VI; I, 12–13',
    anal: 'I, 10–11',
    pectoral: '18–20',
    pelvic: 'I, 5（左右愈合成吸盘）',
    caudal: '17–19',
    vertebrae: '26',
    lateralLine: '无侧线；纵列鳞 54–58',
    gillRakers: '3–4 + 7–8',
  },
  // 没有查到针对本种游泳运动学的研究; 英文术语按底栖鰕虎类的一般描述填写.
  swimming: {
    mode: 'burst-and-perch',
    zh: '停栖冲刺式',
    note: '多数时间用腹鳍吸盘和宽圆的胸鳍伏在水底或藏身空腔，移动时尾部一摆，短距离冲出又落回水底。没有查到针对本种的游泳研究。',
  },
  // 体色随体长变化: 中国动物志 (40 mm 以下有横带, 40–60 mm 有 2 条纵带, 70 mm 以上只剩云状斑)
  summary:
    '双带缟鰕虎是西北太平洋河口常见的小型鰕虎，在半咸水和淡水里贴底生活。它得名于中等个体体侧的两条黑褐色纵带；上世纪 80 年代随船只压舱水到了美国旧金山湾，成为当地的入侵鱼。',
  highlights: [
    {
      title: '三叉形的牙',
      // 中国动物志: 上下颌各 2 行齿, 外行齿除最后数枚外均为三叉形, 中齿尖最长; USGS: 外行三尖齿可把缟鰕虎属与北美本土鰕虎区分开
      body: '属名 Tridentiger 意为 “带三叉齿的”。它上下颌外行的牙除最后几枚外都分成三个尖，中间的尖最长；在加州，这种牙就是把它和本土鰕虎区分开的特征。',
    },
    {
      title: '搭压舱水入侵加州',
      // USGS: 1985 年首次记录于萨克拉门托-圣华金河口的 Suisun Marsh, 多半由压舱水带入; 1989 年拖网中成为该沼泽数量最多的成鱼;
      // 1990 年已到南方约 513 km 外的 Pyramid Lake. 英文维基: 2022 年在比利时根特-特尔纽森运河首次记录于欧洲.
      body: '1985 年首次在旧金山湾的 Suisun 沼泽被发现，多半是搭船只压舱水来的；到 1989 年已是那里数量最多的成鱼。2022 年它又在比利时出现，成为欧洲首次记录。',
    },
    {
      title: '雄鱼守巢',
      // USGS: 雄鱼在有硬质内壁的空腔 (牡蛎壳, 石缝, 木头, 罐头, 瓶子) 筑巢并守护; 3–9 月在淡水到寡盐水中多次产卵. FISHBIO: 雌鱼产卵后由雄鱼受精并护卵
      body: '繁殖期雄鱼占据有硬质内壁的空腔做巢，牡蛎壳、石缝、木头甚至空罐头和瓶子都行。雌鱼在巢里产卵后，由雄鱼受精并守护卵，一季可以多次产卵。',
    },
  ],
  sources: [
    'http://www.sp2000.org.cn/Fauna/fauna/detil/23278',
    'https://researcharchive.calacademy.org/research/ichthyology/catalog/fishcatget.asp?tbl=species&genus=Tridentiger&species=bifasciatus',
    'https://www.fishbase.se/summary/Tridentiger-bifasciatus.html',
    'https://nas.er.usgs.gov/queries/factsheet.aspx?SpeciesID=716',
    'https://en.wikipedia.org/wiki/Shimofuri_goby',
    'https://www.vlaanderen.be/inbo/publicaties/first-record-in-europe-of-the-asian-gobiid-shimofuri-marbled-goby-tridentiger-bifasciatus-steindachner-1881',
    'https://fishbio.com/species/shimofuri-goby/',
    'https://www.biorxiv.org/content/10.1101/2023.07.27.550194',
  ],
};

// 该物种在各结构上的特例说明 (20–60 字), 会合并进结构卡片
// 除另行注明外, 均取自中国动物志 (经中国生物物种名录).
export const NOTES: Partial<Record<StructureId, string>> = {
  skin: '体色随体长变化：幼鱼有 6 至 7 条横带，40 至 60 毫米时变成 2 条纵带，70 毫米以上只剩云状斑纹。',
  scales: '体被中大栉鳞，前小后大；头部无鳞，腹部和胸鳍基部被小圆鳞，纵列鳞 54 至 58 枚。',
  lateralLine: '体侧没有侧线管；头部有 6 个很细小的感觉管孔，颊部有 3 至 4 条纵行感觉乳突线。',
  dorsalFin: '第一背鳍有 6 根短弱的鳍棘，雄鱼第二、第三棘平放可达第二背鳍起点，雌鱼则不达。',
  secondDorsalFin: '第二背鳍有 1 棘 12 至 13 根鳍条，与第一背鳍等高或略低，上有 4 行暗色横纹。',
  // USGS: 与纹缟鰕虎鱼的区别之一是本种臀鳍有橙红色边缘, 第二背鳍与臀鳍上没有明显纵纹
  analFin: '臀鳍与第二背鳍相对同形；活体为红色，中间没有白色纵带，可借此与纹缟鰕虎鱼区分。',
  pectoralFin: '胸鳍宽圆，基部中间有 1 个大黑斑；最上方的鳍条不游离，这也是与纹缟鰕虎鱼的区别之一。',
  pelvicFin: '左右腹鳍愈合成吸盘，膜盖发达，边缘深凹，让它能伏在牡蛎壳、石头和泥沙上。',
  teeth: '上下颌各 2 行齿：外行齿除最后几枚外都是三叉形，中尖最长；内行齿细尖，略向内弯。',
  eye: '眼小，位于头的前半部；眼间隔平坦而宽，约为眼径的 2.5 倍。头侧和喉部密布白色小圆点。',
  // USGS: 一年性成熟, 3–9 月在淡水到盐度 19‰ 的寡盐水中多次产卵
  gonad: '一年即可性成熟，3 至 9 月在淡水到低盐水中多次产卵；雄鱼生殖乳突宽扁，略呈三角形。',
  // 没有查到本种成鱼鳔的解剖记载. Oto 与 Watanabe 的 bioRxiv 预印本 (2023) 记录同亚科 Gymnogobius 仔鱼孵出 3 天内鳔已充气.
  swimBladder: '没有查到本种成鱼鳔的解剖记载；同亚科的 Gymnogobius 仔鱼孵出 3 天内鳔就已充气。',
};
