// 花䱻 的图鉴资料. 每条说法都对过来源, 取舍的地方在字段上方写明依据.
// 主要来源: 中国生物物种名录 (Sp2000 中国节点) 的花䱻条目, 其文字出自《中国动物志 硬骨鱼纲 鲤形目 (中卷)》
// (可数性状, 形态, 咽齿, 鳔, 肠, 体色, 分布); FishBase 物种页 (体长, 体重, 食性, 繁殖, IUCN);
// Eschmeyer's Catalog of Fishes (有效名与科); 中文与英文维基 (别名, 引种); 百度百科 (生活习性与产卵).
// 百度百科对抓取返回 403, 其内容是通过搜索引擎摘录核对的, 只用于习性与产卵两处, 并与 FishBase 对照.
// 学名: Hemibarbus maculatus Bleeker, 1871, FishBase, Catalog of Fishes 与中国生物物种名录一致, 命名人不加括号
// (原始组合即 Hemibarbus). Catalog of Fishes 把 Hemibarbus longibarbis Fang, 1938 列为其同物异名 (带疑问).
// 分类学备注: 中国动物志与中国生物物种名录把䱻属放在鲤科鮈亚科; FishBase, Catalog of Fishes 与英文维基
// 按近年的鲤形目分子系统学结果 (Tan 与 Armbruster 2018) 把鮈亚科提升为鮈科 Gobionidae. 这里采用鮈科.
import type { SpeciesInfo, StructureId } from '../types';

export const INFO: SpeciesInfo = {
  id: 'hemibarbus',
  zh: '花䱻',
  // 竹篙嘴, 激浪鱼, 花勾 取自中文维基的俗名栏; 吉勾鱼 取自百度百科
  zhAlt: ['竹篙嘴', '激浪鱼', '花勾', '吉勾鱼'],
  latin: 'Hemibarbus maculatus',
  authority: 'Bleeker, 1871',
  en: 'Spotted steed',
  taxonomy: {
    class: '辐鳍鱼纲 Actinopterygii',
    order: '鲤形目 Cypriniformes',
    family: '鮈科 Gobionidae',
  },
  // FishBase: 最大 47.0 cm TL (雄性或未分性别), 雌性 34.3 cm TL, 常见 26.0 cm TL, 最大发表体重 1.7 kg.
  // 中国动物志的测量标本体长 75-320 mm (标准长), 与此不矛盾.
  size: { maxLengthCm: 47, commonLengthCm: 26, maxWeightKg: 1.7, lengthType: 'TL' },
  // 深度未知. FishBase 只写淡水, 底中层 (benthopelagic), 水温 10-24 °C, 没有深度范围.
  // maxM 为 0 时界面显示破折号; 这里的 0 与 0 只是占位, 不是测量值.
  depth: { minM: 0, maxM: 0, typical: '无深度记录，多在水体中下层贴近水底活动' },
  // FishBase: 成鱼多见于中等流速, 沙底的溪流与河道; 百度百科: 生活在中下层, 常在长青苔的石缝, 木桩附近活动.
  habitat: '生活在江河，湖泊和水库的中下层，常贴着沙底或在石缝，木桩等障碍物附近活动，在水底搜寻水生昆虫，螺蚌和虾类为食。',
  // 中国生物物种名录: 自长江以南至黑龙江水系均有. FishBase 与维基: 黑龙江流域, 中国, 朝鲜半岛, 日本;
  // 英文维基称已被带入俄罗斯欧洲部分, 乌兹别克斯坦, 蒙古和中南半岛.
  distribution: '原产黑龙江流域，中国东部，朝鲜半岛和日本，在中国从长江以南到黑龙江水系都有；已随家鱼苗种被带到中亚等地。',
  // FishBase 的 IUCN 栏: LC, 评估日期 2020-04-06. 中文维基的分类框仍写 NE (未评估), 英文维基写 2022 (可能是发布年份).
  iucn: 'LC',
  iucnYear: 2020,
  // 寿命未查到可靠记录 (FishBase 无最大年龄; 洞庭湖年龄与生长的论文只见到引文, 未读到原文), 因此留空.
  // 背鳍 iii, 7; 臀鳍 iii, 6; 胸鳍 i, 16-19; 腹鳍 i, 8 取自中国生物物种名录 (原文腹鳍误排为 i-80, 百度百科同此; 按 i-8 理解).
  // FishBase 记臀鳍 6½ 根分枝鳍条, 与 iii, 6 一致 (最后一根分到基部计作半根).
  // 侧线鳞: 中国生物物种名录此处有乱码 ("47 5"), 百度百科为 47-50, 这里取 47-50.
  // 脊椎骨: 中国生物物种名录 4+42-44 (4 枚为参与韦伯氏器的前部椎骨), FishBase 42-44.
  // 鳃耙 (第一鳃弓外侧): 中国生物物种名录与百度百科为 6-10, 水产百科为 8-11, 两者不一致, 取前者.
  // 尾鳍鳍条数未查到.
  meristics: {
    dorsal: 'iii, 7',
    anal: 'iii, 6',
    pectoral: 'i, 16–19',
    pelvic: 'i, 8',
    vertebrae: '4 + 42–44',
    lateralLine: '47–50',
    gillRakers: '6–10',
  },
  // 游泳方式的英文类别沿用鲤科通行的教科书分类, 没有查到针对花䱻的专门研究.
  swimming: {
    mode: 'subcarangiform',
    zh: '亚鲹科式',
    note: '摆动集中在身体后半段和尾柄，前半身摆幅较小，靠叉形尾鳍推进；平时贴近水底缓游觅食。游泳类别是鲤科通行的教科书分类，没有查到针对花䱻的专门研究。',
  },
  summary:
    '花䱻是东亚常见的鮈类，体侧沿侧线上方排着 7 至 11 个黑色大斑，背鳍有一根几乎与头等长的光滑硬刺。它在江湖的中下层贴底觅食，偏肉食，是长江中下游重要的小型经济鱼类。',
  highlights: [
    {
      title: '光滑的背鳍硬刺',
      // 中国生物物种名录: 末根不分枝鳍条为光滑的硬刺, 长且粗壮, 其长几与头长相等. 鲤的同一根刺后缘有锯齿.
      body: '背鳍最后一根不分枝鳍条骨化成又长又粗的硬刺，长度几乎与头长相等。和鲤背鳍刺后缘的锯齿不同，花䱻的这根刺是光滑的。',
    },
    {
      title: '偏肉食的底栖猎手',
      // FishBase 与英文维基: 夏季主要吃昆虫和软体动物, 冬季主要吃甲壳动物. 中国生物物种名录: 肠长为体长的 1.0-1.1 倍.
      body: '它在水底搜寻水生昆虫，螺蚌和虾类，夏季以昆虫和软体动物为主，冬季多吃甲壳动物。肠只与体长相当，而杂食的鲤肠长可达体长的 2 至 3 倍。',
    },
    {
      title: '把卵粘在水草上',
      // FishBase: 5-6 月, 19-25 °C 产卵, 卵附着在水草上, 卵径约 2 mm, 约 4 天孵出, 仔鱼前 6 天营浮游生活.
      // 百度百科写产卵期 4-6 月, 水温 16-23 °C, 卵附着在石砾或水草上; 两者季节与水温略有出入.
      body: '约 3 龄性成熟，春末夏初产卵，卵径约 2 毫米，有黏性，附着在水草或石砾上发育，约 4 天孵出，仔鱼先在水中漂游几天。',
    },
  ],
  sources: [
    'http://www.sp2000.org.cn/Fauna/fauna/detil/22644',
    'https://www.fishbase.se/summary/Hemibarbus-maculatus.html',
    'https://researcharchive.calacademy.org/research/ichthyology/catalog/fishcatget.asp?spid=31746',
    'https://zh.wikipedia.org/zh-cn/%E8%8A%B1%E4%B1%BB',
    'https://en.wikipedia.org/wiki/Spotted_steed',
    'https://baike.baidu.com/item/%E8%8A%B1%E4%B1%BB/24621982',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC10968275/',
  ],
};

// 该物种在各结构上的特例说明 (20–60 字), 会合并进结构卡片. 形态描述均取自中国生物物种名录 (中国动物志) 的花䱻条目.
export const NOTES: Partial<Record<StructureId, string>> = {
  barbels: '口角只有 1 对须，很短，长度只有眼径的一半到七成，用来在水底探测食物。',
  jaws: '口略小，下位，近半圆形；唇薄，下唇中叶是一块宽三角形的明显突起，侧叶极窄。',
  eye: '眼较大，位于头侧偏上，两眼之间宽阔而稍稍隆起。',
  skin: '背部和体侧上部青灰色，腹部白色，体侧散布许多大小不一的黑褐色斑点。',
  scales: '鳞片较小，侧线鳞 47 至 50 枚，背鳍前有 13 至 16 枚鳞，围尾柄鳞 18 至 20 枚。',
  lateralLine: '侧线完整，略平直；头部的前眶骨，下眶骨和前鳃盖骨边缘还有一排黏液腔。',
  dorsalFin: '背鳍最后一根不分枝鳍条是光滑的粗长硬刺，几乎与头等长；鳍上布满小黑点。',
  caudalFin: '尾鳍分叉，上下叶等长，末端钝圆，鳍上有许多小黑点。',
  pelvicFin: '腹鳍短小，起点稍后于背鳍起点，末端远远够不到肛门。',
  analFin: '臀鳍较短，有 3 根不分枝鳍条和 6 根分枝鳍条，起点更靠近尾鳍基，肛门紧贴其前。',
  pharyngealTeeth: '下咽齿 3 行，齿式 1·3·5–5·3·1；下咽骨粗壮，主行齿尖端钩曲，外侧两行很纤细。',
  swimBladder: '鳔大，分前后两室，前室卵圆形，后室末端尖细呈长锥形，长度是前室的 1.8 至 2.4 倍。',
  intestine: '肠管短，只有体长的 1.0 至 1.1 倍，与偏肉食的食性相符。',
  stomach: '和其他鲤形目鱼类一样没有胃，食物由咽齿处理后直接进入肠。',
};
