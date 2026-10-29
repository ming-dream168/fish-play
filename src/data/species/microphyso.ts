// 小口小鳔鮈 的图鉴资料. 每条说法都对过来源, 取舍的地方在字段上方写明依据.
// 主要来源: 中国动物主题数据库 (中科院动物所) 的小口小鳔鮈条目, 摘自《中国动物志 硬骨鱼纲 鲤形目 (中卷)》(陈宜瑜 1998;
// 可数性状, 比例, 唇, 须, 颌, 鳔, 肠, 体色, 分布); Catalog of Fishes (原始描述, 模式产地, 现行学名);
// Sun, Tang 与 Zhao 2025 (Zoosystematics and Evolution 101: 2013–2037, 新属 Oriengobio 的特征与鳔的测量);
// Sun 等 2024 (ZooKeys 1214) 的检索与比较 (本种唇乳突不发达); FishBase 物种页 (最大体长, IUCN);
// 中文维基与 2025 年上海嘉定的新闻报道 (栖息水层, 分布).
// 学名: 乐佩琦 (Yue Peiqi) 1995 年据 1980 年 6 月采自江苏吴江县的标本, 在《动物分类学报》20(4): 495–498 发表为
// Microphysogobio microstomus, 中文名小口小鳔鮈. Sun 等 2025 建立新属 Oriengobio (建议中文属名 "东洋鮈属"),
// 把本种移入该属, Catalog of Fishes 已采用 Oriengobio microstomus (Yue, 1995) 为有效名, 故命名人加括号.
// 新组合还没有通行的中文名, 这里仍用小口小鳔鮈. 英文维基把命名人写成 Xie, 1995, 与原始文献不符, 不采用.
// 同物异名: Sun 等 2025 认为镇江片唇鮈 Platysmacheilus zhenjiangensis Ni, Chen & Zhou, 2005 是本种的次异名.
// 分类学备注: FishBase 与 Catalog of Fishes 已把鮈类独立为鮈科 Gobionidae; 中国动物志和多数中文资料仍放在鲤科鮈亚科.
// 这里按较新的分类写鮈科, 与图鉴里其他鮈类条目一致.
import type { SpeciesInfo, StructureId } from '../types';

export const INFO: SpeciesInfo = {
  id: 'microphyso',
  zh: '小口小鳔鮈',
  // 没有在可靠来源里查到别名, 不填 zhAlt.
  latin: 'Oriengobio microstomus',
  authority: '(Yue, 1995)',
  // FishBase 与 Catalog of Fishes 都没有英文俗名, 这里按种名 microstomus (小口) 写一个描述性名称.
  en: 'Smallmouth gudgeon',
  taxonomy: {
    class: '辐鳍鱼纲 Actinopterygii',
    order: '鲤形目 Cypriniformes',
    family: '鮈科 Gobionidae',
  },
  // FishBase: 最大 6.2 cm SL (引自中国动物志); 中国动物志测量的 17 尾模式系列标本体长 46–62 mm.
  // 2025 年上海嘉定的报道称成体一般体长 5–6 cm. 没有体重记录.
  size: { maxLengthCm: 6.2, lengthType: 'SL' },
  // 没有查到水深记录 (FishBase 未给出深度范围), 按约定填 0.
  depth: { minM: 0, maxM: 0, typical: '沿岸浅水区的中下层，近水底' },
  // 中文维基与上海嘉定的报道: 生活在水体中下层, 常栖息在沿岸浅水区; 对水质要求较高, 繁殖能力较弱.
  // FishBase: 淡水, 底栖-中层 (benthopelagic). 中国动物志: 腹部平坦或稍圆, 口下位.
  // 没有查到底质 (沙底或泥底) 的专门记载, 所以不写底质.
  habitat: '小型底层鱼，生活在沿岸浅水区的水体中下层，腹部平坦，口朝下，适合贴近水底觅食；对水质要求较高，竞争不过麦穗鱼等适应力强的小鱼。',
  // Catalog of Fishes: 长江下游, 江苏; 中国动物志: 长江水系下游. 中文维基: 长江下游太湖附属水体等.
  // Sun 等 2025 的分子样本采自浙江绍兴曹娥江水系; 2025 年报道在上海嘉定娄塘河首次记录到.
  // 来源不一致: 2022 年发布在 Zenodo 上的一份小鳔鮈属检索表写 "长江中下游", 这里只写有标本支持的下游.
  distribution: '中国特有，分布在长江下游，包括太湖及附属水体，模式产地是江苏吴江；浙江曹娥江水系和上海嘉定也有记录。',
  // FishBase: IUCN 未评估 (2025-2 版); 中文维基同样写未予评估.
  iucn: 'NE',
  // 没有查到寿命资料, 不填 lifespan.
  // 中国动物志: 背鳍 iii-7, 臀鳍 ii-6, 胸鳍 i-10–11, 腹鳍 i-7, 侧线鳞 36–37, 脊椎骨 4+31–32, 鳃耙 4–5.
  // 来源不一致: Sun 等 2025 的 Oriengobio 属描述写臀鳍 3 根不分枝鳍条, 5–6 根分枝鳍条; 这里用中国动物志的种级数据.
  // 尾鳍取 Sun 等 2025 的属级描述 (上叶 1 根不分枝 + 9 根分枝, 下叶 8 根分枝 + 1 根不分枝), 不是本种单独计数.
  meristics: {
    dorsal: 'iii, 7',
    anal: 'ii, 6',
    pectoral: 'i, 10–11',
    pelvic: 'i, 7',
    caudal: 'i, 9 + 8, i',
    vertebrae: '4 + 31–32',
    lateralLine: '36–37',
    gillRakers: '4–5',
  },
  // 游泳方式的英文类别沿用鲤科通行的教科书分类, 没有查到针对本种的专门研究.
  swimming: {
    mode: 'subcarangiform',
    zh: '亚鲹科式',
    note: '摆动集中在身体后半段和细长的尾柄，前半身摆幅很小，多贴近水底游动。游泳类别是鲤科通行的教科书分类，没有查到针对本种的专门研究。',
  },
  summary:
    '小口小鳔鮈是只有五六厘米长的中国特有底层小鱼，分布在长江下游和太湖一带。它口小唇薄，鳔很小，前室包在韧质膜囊里。2025 年它被移入新属东洋鮈属。',
  highlights: [
    {
      // 中国动物志; Sun 等 2025 写作 thick fibrous capsule (厚的纤维质囊), 不是骨质囊.
      title: '名字里的小鳔',
      body: '鳔小，分两室：前室横置椭圆形，外面包着一层坚韧的纤维质膜囊；后室椭圆形，比眼径略小。这层膜囊是纤维质的，不是骨质的。',
    },
    {
      // 中国动物志; Sun 等 2024 的比较: 本种与凌河小鳔鮈的唇乳突不发达, 有别于其他同类.
      title: '小口与薄唇',
      body: '口小、朝下，呈深弧形。同类多半唇厚、布满乳突，它的唇却薄而几乎光滑，下唇乳突细小难辨，这是辨认它的关键特征。',
    },
    {
      // Catalog of Fishes; Sun 等 2025.
      title: '换了新属',
      body: '1980 年在江苏吴江采到，1995 年才被描述为新种。2025 年的分类修订把它移入新建的东洋鮈属，镇江片唇鮈也被并入本种。',
    },
  ],
  sources: [
    'http://www.zoology.csdb.cn/taxon/%7B898A2773-828A-4563-9E42-9EF22E8365B7%7D',
    'https://researcharchive.calacademy.org/research/ichthyology/catalog/fishcatget.asp?spid=64654',
    'https://doi.org/10.3897/zse.101.160106',
    'https://doi.org/10.3897/zookeys.1214.127061',
    'https://zenodo.org/records/5889147',
    'https://www.fishbase.se/summary/Microphysogobio-microstomus.html',
    'https://zh.wikipedia.org/zh-hans/%E5%B0%8F%E5%8F%A3%E5%B0%8F%E9%B0%BE%E9%AE%88',
    'https://news.qq.com/rain/a/20250227A0983700',
  ],
};

// 该物种在各结构上的特例说明 (20–60 字), 会合并进结构卡片. 除注明外均取自中国动物志.
export const NOTES: Partial<Record<StructureId, string>> = {
  barbels: '口角有 1 对须，很短，长度不到眼径的三分之一，比棒花鱼的须短得多。',
  jaws: '口小，下位，呈深弧形；上下颌有不发达的角质边缘。唇薄，上唇几乎光滑。',
  eye: '眼稍大，位于头侧上方，眼间稍窄而平坦，眼间距小于眼径。',
  skin: '背部和体侧上半部浅黄带灰，下半部白色而稍带黄色，体色比棒花鱼素淡得多。',
  scales: '体被圆鳞，胸鳍之前的胸部裸露无鳞；背鳍前鳞 9 至 10 枚，围尾柄鳞 12 枚。',
  lateralLine: '侧线完全而平直，穿过 36 至 37 枚侧线鳞；沿侧线有 1 条很细的灰黑色纵纹。',
  dorsalFin: '背鳍稍短，外缘平截，没有硬刺，位置靠前；鳍上有多数短黑条组成的斑纹。',
  analFin: '臀鳍短，起点离腹鳍起点比离尾鳍基远；肛门紧靠腹鳍基部，远离臀鳍。',
  caudalFin: '尾鳍分叉，上叶略长于下叶，两叶末端稍圆，鳍上有短黑条组成的斑纹。',
  pectoralFin: '胸鳍较长，后端稍尖，几乎伸到腹鳍起点；偶尔能看到鳍上有小黑点。',
  // 来源不一致: 中国动物志记前后室之比 1:1–1.3; Sun 等 2025 测得本种后室长为前室的 127%–221% (5 尾),
  // 并指出本种是该属后室较小这一规律的例外. 两者都说明后室不比前室小.
  swimBladder: '鳔小，2 室；前室横置椭圆形，包在韧质膜囊里；后室椭圆，略小于眼径，却比前室稍长。',
  intestine: '肠短，长度不到体长，只有体长的 0.8 至 0.9 倍。',
  pharyngealTeeth: '下咽齿只有 1 行，每侧 5 枚，齿式 5–5，齿稍侧扁，末端略钩曲。',
  gills: '鳃耙退化，只剩瘤状小突，第一鳃弓外侧 4 至 5 个。',
};
