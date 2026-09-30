import { makeSpecies, type SpeciesSpec } from '../spec';

// 黄鳝 (合鳃鱼科): 体长为体高的 23–31 倍, 为头长的 11–14 倍. 前段圆筒形, 肛门之后渐侧扁, 尾端尖细.
// 无胸鳍无腹鳍, 背鳍臀鳍退化为无鳍条的低皮褶, 只在后半身, 与短小的尖尾鳍相连. 无鳞, 多黏液.
// 头圆锥形, 唇厚, 口大, 上颌稍突出; 眼很小, 被一层薄皮覆盖. 左右鳃孔在喉部腹面合成一条倒 V 形裂缝,
// 体侧看不到鳃盖缝. 鳃退化, 主要靠口咽腔吞气呼吸; 无鳔; 没有肌间刺.
// 先雌后雄的性逆转: 年轻个体都是雌鱼, 产过卵后卵巢转变成精巢 (见 ricefieldMale).
export function ricefield(): SpeciesSpec {
  return makeSpecies({
    id: 'ricefield',
    display: 4.6,
    profile: {
      // 最高处约 0.038 L (体长 / 体高 ≈ 26); 头后稍鼓 (颊肌与吞气的喉囊), 肛门 (0.68) 之后逐渐变细
      top: [
        [0, 0.004],
        [0.008, 0.0078],
        [0.018, 0.0112],
        [0.03, 0.0142],
        [0.045, 0.0168],
        [0.065, 0.0188],
        [0.085, 0.0192],
        [0.12, 0.0193],
        [0.2, 0.0197],
        [0.3, 0.0198],
        [0.4, 0.0195],
        [0.5, 0.0187],
        [0.6, 0.0174],
        [0.7, 0.0156],
        [0.78, 0.0132],
        [0.86, 0.01],
        [0.92, 0.007],
        [0.96, 0.0045],
        [1, 0.0022],
      ],
      bottom: [
        [0, 0.0035],
        [0.008, 0.0068],
        [0.018, 0.0098],
        [0.03, 0.0128],
        [0.045, 0.0156],
        [0.065, 0.0178],
        [0.085, 0.0187],
        [0.12, 0.0187],
        [0.2, 0.0187],
        [0.3, 0.0186],
        [0.4, 0.0182],
        [0.5, 0.0176],
        [0.6, 0.0166],
        [0.68, 0.0154],
        [0.74, 0.0134],
        [0.8, 0.0112],
        [0.86, 0.0088],
        [0.92, 0.0062],
        [0.96, 0.004],
        [1, 0.002],
      ],
      // 前段横截面接近正圆, 肛门之后侧扁 (高约为宽的 1.6 倍)
      width: [
        [0, 0.0035],
        [0.008, 0.0068],
        [0.018, 0.0098],
        [0.03, 0.0126],
        [0.045, 0.0152],
        [0.065, 0.0172],
        [0.09, 0.0178],
        [0.15, 0.018],
        [0.25, 0.0182],
        [0.35, 0.0179],
        [0.45, 0.0169],
        [0.55, 0.0152],
        [0.65, 0.0128],
        [0.72, 0.0106],
        [0.8, 0.0082],
        [0.88, 0.0058],
        [0.94, 0.0038],
        [1, 0.0016],
      ],
      nTop: 2.0,
      nBottom: 2.1,
      snoutRound: 0.014,
      tailCap: 0.008,
    },
    // 口大, 口角在眼后下方; 上颌略长于下颌. 唇厚, 平时闭着嘴 (只留一道暗色口裂线)
    mouth: { corner: 0.043, tipH: -0.06, cornerH: -0.22, bow: -0.02, gape: 0.006, pump: 0.04, jawLen: 0.006, teeth: 16, toothLen: 0.001, fang: 0, toothShape: 0 },
    // 眼极小, 被薄皮覆盖, 几乎不突出 (实物约在头长 1/4 处; 颅底副蝶骨从眼前 0.03 处起, 眼再靠前骨头会穿出吻端)
    eye: { s: 0.034, h: 0.4, r: 0.0033, protrude: 0.12, iris: '#8a7440', irisMetal: 0.3, pupil: 0.5 },
    gill: {
      // 倒 V 形鳃孔只在喉部腹面: 腹中线处最靠前, 两臂向后上方斜伸到约 45°.
      // 三点恰在一条二次曲线上, 着色器拟合的是同一条曲线, 体侧不出现鳃盖缝.
      edge: [
        [-1, 0.1],
        [-0.86, 0.109],
        [-0.72, 0.112],
      ],
      top: -0.72,
      bottom: -1.1,
      // 吞气时喉部轻微鼓动
      flare: 0.0012,
      // 没有外露的前鳃盖沟
      groove: 0,
      slits: 0,
      slitS: [0.1, 0.112],
      slitH: [-1, -0.72],
      arches: [0.066, 0.096],
    },
    fins: [
      {
        // 退化的背鳍: 无鳍条的低皮褶, 起于后半身, 向后与尾鳍相连
        id: 'dorsalFin',
        s0: 0.6,
        s1: 0.995,
        rays: 0,
        spines: 0,
        len: [
          [0, 0.004],
          [0.12, 0.0088],
          [0.6, 0.0108],
          [0.9, 0.0115],
          [1, 0.008],
        ],
        angle: [
          [0, 0.8],
          [0.85, 1.0],
          [1, 1.25],
        ],
        thick: 0.0022,
        flutter: 0.0006,
        color: '#3a2d16',
        edgeColor: '#57431f',
        opacity: 1,
      },
      { id: 'secondDorsalFin', present: 0 },
      { id: 'adiposeFin', present: 0 },
      {
        // 退化的臀鳍: 肛门之后的腹缘皮褶
        id: 'analFin',
        s0: 0.69,
        s1: 0.995,
        rays: 0,
        spines: 0,
        len: [
          [0, 0.004],
          [0.15, 0.0085],
          [0.6, 0.0098],
          [0.9, 0.0105],
          [1, 0.0075],
        ],
        angle: [
          [0, 0.8],
          [0.85, 1.0],
          [1, 1.25],
        ],
        thick: 0.0022,
        flutter: 0.0006,
        color: '#6e5226',
        edgeColor: '#86672f',
        opacity: 1,
      },
      {
        // 尾鳍短小, 尖形, 与背腹皮褶连成一体
        id: 'caudalFin',
        rays: 6,
        len: [
          [0, 0.003],
          [0.3, 0.008],
          [0.5, 0.022],
          [0.7, 0.008],
          [1, 0.003],
        ],
        angle: [
          [0, -0.28],
          [0.5, 0],
          [1, 0.28],
        ],
        baseH: 0.0035,
        thick: 0.0004,
        color: '#46361a',
        edgeColor: '#6a5328',
        opacity: 1,
      },
      // 无胸鳍, 无腹鳍
      { id: 'pectoralFin', present: 0 },
      { id: 'pelvicFin', present: 0 },
    ],
    skin: {
      // 背部橄榄褐, 体侧黄褐, 腹部淡黄; 全身散布细小的黑褐色斑点
      dorsal: '#44321a',
      flank: '#8a6429',
      ventral: '#d2a656',
      dorsalEdge: 0.25,
      ventralEdge: -0.45,
      softness: 0.35,
      head: '#44321a',
      headMix: 0,
      silver: 0.04,
      iridescence: 0.05,
      roughness: 0.22,
      scaleSize: 0,
      scaleDepth: 0,
      // 不规则的细碎暗斑 (圆点会显得像波点)
      spotColor: '#22160a',
      spotSize: 0.0013,
      spotDensity: 0.9,
      spotH: [-0.55, 1],
      spotS: [0, 1],
      spotShape: 2,
      bars: 0,
      barStrength: 0,
      mottle: 0.25,
      mottleScale: 0.02,
      mottleColor: '#2a1f0e',
      lateralLine: 0.12,
      lateralLineH: [
        [0, 0.05],
        [1, 0],
      ],
      interior: '#e2c7a0',
      mouthColor: '#5a3226',
      // 体表黏液层很厚, 湿亮
      clearcoat: 1,
      sheen: 0,
    },
    skeleton: {
      // 椎骨数没有查到可靠来源 (资料里不填), 这里取骨骼网格上限 130 节, 节数只是示意
      vertebrae: 130,
      precaudal: 87,
      centrumR: 0.0043,
      spineLine: [
        [0.06, 0.3],
        [0.4, 0.28],
        [0.7, 0.15],
        [1, 0],
      ],
      spineStart: 0.062,
      neuralLen: 0.7,
      haemalLen: 0.7,
      spineLean: 0.75,
      // 只有一根脊骨: 没有肋骨与肌间刺
      ribs: 0,
      ribCount: 0,
      intermuscular: 0,
      opercle: 0.55,
      branchiostegals: 6,
      jawBone: 1,
      skullScale: 0.95,
      caudalUp: 0,
      caudalExt: 0.004,
      otolith: 0.7,
    },
    organs: {
      cavity: { s0: 0.12, s1: 0.68, top: 0.9, bottom: 0.88, width: 0.84 },
      // 心脏远在鳃孔之后的喉下
      heart: { s: 0.13, h: -0.4, size: 0.36 },
      liver: { s0: 0.14, s1: 0.31, size: 0.6, lobes: 2, color: '#6e3024' },
      stomach: { s0: 0.17, s1: 0.32, size: 0.9, shape: 0 },
      caeca: { count: 0, len: 0.01 },
      intestine: { loops: 0, size: 0.9, end: 0.68, spiral: 0 },
      // 无鳔
      swimBladder: { s0: 0.2, s1: 0.5, size: 0, kind: 0, v: 0.5, branches: 0 },
      kidney: { size: 0.45 },
      // 雌性阶段: 卵巢细长, 卵粒橙黄
      gonad: { s0: 0.3, s1: 0.64, size: 1, color: '#e3a044', eggs: 1 },
      spleen: { size: 0.5 },
      brain: { s: 0.045, size: 0.42, tectum: 0.8 },
      // 鳃退化
      gills: { size: 0.18 },
      redMuscle: 0.05,
      redMuscleDepth: 0,
      muscleColor: '#efe2d2',
      vent: 0.68,
    },
    swim: { mode: 'anguilliform', freq: 0.85, wavelength: 0.62, amp: [0.018, 0.028, 0.045], headYaw: 1, speed: 0.5, medianFlap: 0, pectoralRow: 0 },
    // 心率取水中呼吸时的 27.7 次每分 (Iversen 等 2011; 吸空气时升到 41.4)
    physiology: { heartRate: 28, breathRate: 8, tempC: 26, depthM: 1, endotherm: 0 },
    lighting: { abyss: 0, warm: 0.85 },
  });
}

/** 性逆转后的雄鱼: 身体不变, 卵巢转为精巢 (灰白色, 较细, 没有卵粒). */
export function ricefieldMale(): SpeciesSpec {
  return makeSpecies(
    {
      id: 'ricefield-male',
      organs: { gonad: { s0: 0.34, s1: 0.62, size: 0.55, color: '#efe7da', eggs: 0 } },
    },
    ricefield(),
  );
}
