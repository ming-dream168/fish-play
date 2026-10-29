import { makeSpecies, type SpeciesSpec } from '../spec';

// 蛇鮈 (鮈科蛇鮈属, Saurogobio dabryi): 体细长, 前段近圆筒形, 腹面平坦, 尾柄细长而稍侧扁.
// 头较长, 吻长而尖, 鼻孔前方明显凹陷; 口下位, 马蹄形, 唇厚, 上下唇布满细小乳突, 下唇中央有一个带乳突的肉垫;
// 口角须 1 对, 短于眼径. 眼较大, 位于头侧上方. 侧线鳞 47-50, 胸鳍前方的胸腹部裸露无鳞.
// 背鳍 iii-8, 起点距吻端比距尾鳍基近, 外缘凹; 胸鳍宽大平展, 贴底时撑在水底; 腹鳍远在背鳍起点之后;
// 臀鳍短, 位置很靠后; 尾鳍叉形. 体侧中轴有一条暗色纵带, 带上排着 10-12 个长圆形暗斑; 背部鳞片边缘暗色.
// 骨鳔类: 有韦伯氏器; 下咽齿 1 行; 鳔小, 两室, 前室包在圆形骨囊里, 后室很小; 肠短于体长.
// 体形按照片测量 (560 px 小图, 吻端 x=15, 尾鳍基 x=455, 体长 440 px):
// 背鳍起点处体高 0.152 (体长/体高 6.6), 头长 0.19, 尾柄高 0.068; 腹缘几乎平直, 背缘在背鳍起点处最高.
export function saurodabryi(): SpeciesSpec {
  return makeSpecies({
    id: 'saurodabryi',
    display: 4.4,
    profile: {
      top: [
        [0, 0.005],
        [0.02, 0.024],
        [0.048, 0.037],
        [0.075, 0.046],
        [0.116, 0.056],
        [0.17, 0.062],
        [0.225, 0.068],
        [0.307, 0.079],
        [0.361, 0.083],
        [0.443, 0.079],
        [0.534, 0.069],
        [0.62, 0.06],
        [0.716, 0.053],
        [0.81, 0.045],
        [0.893, 0.038],
        [0.96, 0.034],
        [1, 0.037],
      ],
      bottom: [
        [0, 0.005],
        [0.02, 0.024],
        [0.048, 0.037],
        [0.075, 0.046],
        [0.116, 0.056],
        [0.17, 0.062],
        [0.225, 0.069],
        [0.307, 0.07],
        [0.361, 0.068],
        [0.443, 0.064],
        [0.534, 0.06],
        [0.62, 0.057],
        [0.716, 0.054],
        [0.81, 0.047],
        [0.893, 0.038],
        [0.96, 0.034],
        [1, 0.036],
      ],
      // 前段近圆筒 (头宽约等于头高), 尾柄侧扁
      width: [
        [0, 0.005],
        [0.02, 0.02],
        [0.05, 0.034],
        [0.1, 0.047],
        [0.17, 0.056],
        [0.25, 0.062],
        [0.36, 0.062],
        [0.48, 0.055],
        [0.62, 0.044],
        [0.75, 0.034],
        [0.88, 0.024],
        [1, 0.018],
      ],
      // 吻端低于体轴: 头背斜向吻端下倾, 腹面平直
      axis: [
        [0, -0.028],
        [0.048, -0.022],
        [0.1, -0.013],
        [0.17, -0.0057],
        [0.225, 0],
        [1, 0],
      ],
      nTop: 2.1,
      // 腹面扁平
      nBottom: [
        [0, 2.4],
        [0.2, 2.9],
        [0.55, 2.7],
        [0.8, 2.2],
        [1, 2.1],
      ],
      snoutRound: 0.03,
      tailCap: 0.01,
    },
    // 口下位, 马蹄形, 唇厚 (口裂在吻端之后的腹面, 口角在鼻孔下方)
    mouth: { corner: 0.045, tipH: -0.92, cornerH: -0.82, bow: 0, gape: 0.012, pump: 0.035, jawLen: 0.012, teeth: 0, toothLen: 0, fang: 0, toothShape: 0 },
    // 眼径约 0.027 L, 在头侧上方; 照片中虹膜银白带金色
    eye: { s: 0.095, h: 0.5, r: 0.0155, protrude: 0.35, iris: '#d6c49a', irisMetal: 0.75, pupil: 0.6 },
    gill: {
      edge: [
        [0.7, 0.172],
        [0.3, 0.19],
        [-0.2, 0.193],
        [-0.8, 0.178],
      ],
      top: 0.72,
      bottom: -0.85,
      flare: 0.004,
      slits: 0,
      arches: [0.12, 0.18],
    },
    fins: [
      {
        // 背鳍 iii-8, 外缘内凹: 第三根不分枝鳍条最长, 鳍高接近体高的 1.3 倍
        id: 'dorsalFin',
        s0: 0.375,
        s1: 0.5,
        rays: 11,
        spines: 0,
        len: [
          [0, 0.06],
          [0.14, 0.19],
          [0.28, 0.16],
          [0.55, 0.12],
          [0.8, 0.1],
          [1, 0.09],
        ],
        angle: [
          [0, 0.75],
          [0.2, 0.9],
          [0.6, 1.1],
          [1, 1.3],
        ],
        color: '#9aa2a6',
        edgeColor: '#6c7478',
        opacity: 0.7,
      },
      { id: 'secondDorsalFin', present: 0 },
      { id: 'adiposeFin', present: 0 },
      {
        // 臀鳍 iii-6, 短小, 位置很靠后
        id: 'analFin',
        s0: 0.77,
        s1: 0.83,
        rays: 9,
        spines: 0,
        len: [
          [0, 0.04],
          [0.2, 0.105],
          [0.5, 0.09],
          [1, 0.065],
        ],
        angle: [
          [0, 0.9],
          [1, 1.2],
        ],
        color: '#a9adae',
        edgeColor: '#7c8284',
        opacity: 0.66,
      },
      {
        // 尾鳍叉形, 两叶尖, 约等长
        id: 'caudalFin',
        s0: 0.985,
        rays: 19,
        len: [
          [0, 0.2],
          [0.15, 0.18],
          [0.42, 0.115],
          [0.5, 0.105],
          [0.58, 0.115],
          [0.85, 0.185],
          [1, 0.205],
        ],
        angle: [
          [0, -0.48],
          [0.5, 0],
          [1, 0.45],
        ],
        baseH: 0.044,
        color: '#a7adb0',
        edgeColor: '#757d82',
        opacity: 0.68,
      },
      {
        // 胸鳍 i-13~15, 宽大, 平展于腹侧, 基部橙黄
        id: 'pectoralFin',
        s0: 0.22,
        h: -0.82,
        rays: 15,
        len: [
          [0, 0.2],
          [0.2, 0.21],
          [0.6, 0.15],
          [1, 0.08],
        ],
        a: [0.84, -0.4, 0.4],
        b: [0.5, -0.85, 0.12],
        baseDir: [0.3, -1, -0.15],
        hinge: [0.2, -1, 0.1],
        flap: 0.12,
        color: '#d9a678',
        edgeColor: '#b9c0c2',
        opacity: 0.7,
      },
      {
        // 腹鳍 i-7, 起点在背鳍起点之后
        id: 'pelvicFin',
        s0: 0.455,
        h: -0.95,
        rays: 8,
        len: [
          [0, 0.145],
          [1, 0.07],
        ],
        a: [0.75, -0.3, 0.55],
        b: [0.95, -0.15, 0.15],
        color: '#cfae8e',
        edgeColor: '#b0b6b8',
        opacity: 0.68,
      },
    ],
    skin: {
      // 背部灰褐带肉色, 体侧浅粉褐带银光, 腹部银白
      dorsal: '#9c7a60',
      flank: '#d9b597',
      ventral: '#f0e4d8',
      dorsalEdge: 0.32,
      ventralEdge: -0.4,
      softness: 0.22,
      head: '#cdb096',
      headMix: 0.3,
      silver: 0.42,
      iridescence: 0.25,
      roughness: 0.32,
      // 侧线鳞 47-50 枚, 分布在约 0.8 L 上
      scaleSize: 0.0165,
      scaleDepth: 1,
      // 纵带上的 10-12 个长圆形暗斑, 用一排短横带表示
      barColor: '#5a4c4a',
      bars: 11,
      barWidth: 0.42,
      barStrength: 0.4,
      barH: [0.0, 0.36],
      barS: [0.2, 0.97],
      // 体侧中轴的暗色纵带
      stripes: { n: 1, h0: 0.18, h1: 0.18, width: 0.2, s0: 0.17, s1: 0.99, color: '#6e6060', amount: 0.3 },
      // 背部鳞片边缘暗色, 形成细网纹
      spotColor: '#5d5049',
      spotSize: 0.004,
      spotDensity: 0,
      spotH: [0.45, 1],
      spotS: [0.2, 0.95],
      spotShape: 2,
      mottle: 0.1,
      mottleScale: 0.04,
      mottleColor: '#6e5e52',
      lateralLine: 0.55,
      lateralLineH: [
        [0, 0.25],
        [0.2, 0.15],
        [0.6, 0.08],
        [1, 0.02],
      ],
      interior: '#e6c8b8',
      mouthColor: '#c08a7a',
      clearcoat: 0.45,
    },
    skeleton: {
      // 脊椎 4+41-45 (韦伯氏器的 4 节 + 其后椎骨); 腹椎与尾椎的分配未查到, 按肛门前移的位置估计
      vertebrae: 47,
      precaudal: 22,
      centrumR: 0.0085,
      spineLine: [
        [0.2, 0.25],
        [0.5, 0.2],
        [0.8, 0.06],
        [1, 0],
      ],
      spineStart: 0.19,
      neuralLen: 0.82,
      haemalLen: 0.8,
      spineLean: 0.5,
      ribs: 0.85,
      ribCount: 16,
      intermuscular: 0.8,
      skullScale: 1,
      branchiostegals: 3,
      jawBone: 0.8,
      caudalUp: 0.08,
      caudalExt: 0.012,
      otolith: 0.8,
      weberian: 1,
      // 下咽齿 1 行, 5/5
      pharyngeal: 0.7,
    },
    organs: {
      // 肛门靠近腹鳍基, 约在腹鳍基与臀鳍起点间的前 1/5 处 (0.455 + 0.2 × 0.315 ≈ 0.52), 体腔随之缩短
      cavity: { s0: 0.2, s1: 0.52, top: 0.88, bottom: 0.86, width: 0.82 },
      heart: { s: 0.188, h: -0.6, size: 0.9 },
      liver: { s0: 0.21, s1: 0.36, size: 0.85, lobes: 2, color: '#7a3e2a' },
      // 无胃, 只有食道后膨大的肠球
      stomach: { s0: 0.22, s1: 0.3, size: 0.38, shape: 0 },
      caeca: { count: 0, len: 0.02 },
      // 肠短, 不及体长
      intestine: { loops: 1, size: 0.8, end: 0.52, spiral: 0 },
      // 鳔小, 两室: 前室包在骨囊中, 后室很小
      swimBladder: { s0: 0.205, s1: 0.33, size: 0.55, kind: 5, v: 0.55, branches: 0 },
      gonad: { s0: 0.3, s1: 0.52, size: 0.8, color: '#d9b25a', eggs: 1 },
      brain: { s: 0.12, size: 0.9, tectum: 0.9 },
      redMuscle: 0.06,
      muscleColor: '#efdcd0',
      vent: 0.52,
    },
    // 贴底生活, 胸鳍撑底, 游动时短促地前冲
    swim: { mode: 'subcarangiform', freq: 1.3, wavelength: 0.95, amp: [0.015, -0.05, 0.13], headYaw: 0.8, speed: 0.6, pectoralRow: 0.6 },
    extras: {
      // 口角须 1 对, 短于眼径
      barbels: {
        items: [{ s: 0.043, th: -1.05, len: 0.022, dir: [0.55, -0.75, 0.35], droop: 0.4 }],
        thick: 0.9,
        color: '#e3d6c8',
      },
    },
    physiology: { heartRate: 60, breathRate: 70, tempC: 20, depthM: 2, endotherm: 0 },
    lighting: { warm: 0.55 },
  });
}
