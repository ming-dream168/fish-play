import { makeSpecies, type SpeciesSpec } from '../spec';

// 带鱼 (带鱼科): 身体极延长, 强烈侧扁成带状, 头后最高, 后三分之一逐渐变细成鞭状细丝, 没有尾鳍.
// 头窄长而尖, 口大, 下颌突出于上颌, 上颌前端有 2–3 对带倒钩的大犬齿, 下颌前端 1 对; 眼大, 位置很高.
// 背鳍 III, 125–145, 从后头部一直延伸到尾部; 臀鳍退化成约 100 枚埋在皮下的小棘, 起于肛门 (约 0.37 L) 之后;
// 胸鳍短小, 无腹鳍. 无鳞, 全身银白 (鸟嘌呤晶体), 尾端发黑. 侧线在胸鳍上方急剧下弯, 然后沿腹缘伸到尾端.
// 在水中常头朝上直立, 靠背鳍的波动与身体的轻微摆动游泳.
export function hairtail(): SpeciesSpec {
  return makeSpecies({
    id: 'hairtail',
    display: 4.8,
    profile: {
      // 最高约 0.062 L (头后到肛门), 头长约 0.135 L
      top: [
        [0, 0.0012],
        [0.01, 0.0048],
        [0.03, 0.0105],
        [0.06, 0.0185],
        [0.09, 0.0248],
        [0.12, 0.029],
        [0.16, 0.0316],
        [0.25, 0.0328],
        [0.35, 0.032],
        [0.45, 0.0295],
        [0.55, 0.0258],
        [0.65, 0.0205],
        [0.75, 0.0145],
        [0.83, 0.0095],
        [0.9, 0.0055],
        [0.95, 0.0028],
        [1, 0.0008],
      ],
      // 喉部较深, 容得下舌弓与鳃弓
      bottom: [
        [0, 0.0028],
        [0.01, 0.0068],
        [0.03, 0.0115],
        [0.06, 0.0165],
        [0.09, 0.0208],
        [0.12, 0.0245],
        [0.16, 0.0275],
        [0.25, 0.0295],
        [0.35, 0.0292],
        [0.45, 0.0268],
        [0.55, 0.0232],
        [0.65, 0.0182],
        [0.75, 0.0128],
        [0.83, 0.0084],
        [0.9, 0.0048],
        [0.95, 0.0024],
        [1, 0.0007],
      ],
      // 厚度约为体高的 1/4 到 1/3, 越往后越薄
      width: [
        [0, 0.002],
        [0.02, 0.0045],
        [0.05, 0.0068],
        [0.09, 0.0086],
        [0.13, 0.0094],
        [0.2, 0.0092],
        [0.3, 0.0085],
        [0.4, 0.0075],
        [0.5, 0.0063],
        [0.6, 0.005],
        [0.7, 0.0037],
        [0.8, 0.0025],
        [0.9, 0.0014],
        [1, 0.0005],
      ],
      // 吻端压低: 下颌尖成为最前端
      axis: [
        [0, -0.003],
        [0.04, -0.0012],
        [0.1, 0],
      ],
      // 体侧近乎平行的两面
      nTop: 2.3,
      nBottom: 2.3,
      snoutRound: 0.005,
      tailCap: 0.004,
    },
    // 口裂平直, 口角到眼前缘下方; 口裂前端贴近上缘, 使下颌成为吻端 (下颌突出).
    // 上颌前端两对带倒钩的大犬齿, 下颌前端一对, 其余是侧扁的小牙
    mouth: { corner: 0.05, tipH: 0.5, cornerH: -0.02, bow: 0.02, gape: 0.02, pump: 0.05, jawLen: 0.012, teeth: 12, toothLen: 0.003, fang: 1, fangFront: 2, underbite: 0.008, toothShape: 0 },
    // 眼大 (眼径约为头长的 1/6), 上缘几乎贴着头背; 虹彩银白
    eye: { s: 0.058, h: 0.5, r: 0.0088, protrude: 0.4, iris: '#c9b98a', irisMetal: 0.9, pupil: 0.62 },
    gill: {
      // 鳃盖后缘上端在眼后上方, 下后缘内凹前伸
      edge: [
        [0.7, 0.117],
        [0.35, 0.132],
        [0, 0.136],
        [-0.4, 0.13],
        [-0.8, 0.113],
      ],
      top: 0.72,
      bottom: -0.85,
      flare: 0.004,
      slits: 0,
      // 头部银白光滑, 看不到前鳃盖沟
      groove: 0,
      arches: [0.085, 0.118],
    },
    fins: [
      {
        // 背鳍 III, 约 135: 起于后头部, 几乎直到尾端, 鳍膜透明, 边缘色深 (鳍条骨上限 40 根, 着色按真实数量)
        id: 'dorsalFin',
        s0: 0.085,
        s1: 0.975,
        rays: 135,
        spines: 3,
        notch: 0,
        len: [
          [0, 0.012],
          [0.04, 0.03],
          [0.2, 0.034],
          [0.5, 0.03],
          [0.75, 0.02],
          [0.9, 0.011],
          [1, 0.004],
        ],
        angle: [
          [0, 0.35],
          [0.5, 0.5],
          [1, 0.95],
        ],
        thick: 0.0006,
        // 整条背鳍上约 6 个波, 从头往尾传
        flutter: 0.01,
        waves: 6,
        color: '#c7ccc8',
        edgeColor: '#3a4145',
        opacity: 0.55,
      },
      { id: 'secondDorsalFin', present: 0 },
      { id: 'adiposeFin', present: 0 },
      {
        // 臀鳍退化成埋在皮下的小棘: 担鳍骨仍在, 体表看不到
        id: 'analFin',
        s0: 0.375,
        s1: 0.95,
        rays: 40,
        spines: 0,
        // 鳍条长度保持在 0.004 L 以上, 担鳍骨才会沿整条臀鳍画出来
        len: [
          [0, 0.0048],
          [1, 0.0041],
        ],
        angle: 0.9,
        thick: 0.0006,
        flutter: 0,
        color: '#dfe4e6',
        edgeColor: '#b8c0c4',
        opacity: 0.5,
      },
      // 没有尾鳍, 身体末端就是细丝
      { id: 'caudalFin', present: 0 },
      {
        // 胸鳍短小, 斜向后上方
        id: 'pectoralFin',
        s0: 0.142,
        h: -0.12,
        rays: 11,
        len: [
          [0, 0.034],
          [0.3, 0.036],
          [1, 0.02],
        ],
        a: [0.72, 0.6, 0.35],
        b: [0.95, 0.22, 0.2],
        baseLen: 0.008,
        baseDir: [0.35, -1, 0],
        hinge: [0.2, -1, 0.1],
        flap: 0.25,
        color: '#c9c4ac',
        edgeColor: '#3d3f3c',
        opacity: 0.62,
      },
      { id: 'pelvicFin', present: 0 },
    ],
    skin: {
      // 银白, 背部带钢蓝; 尾端的细丝发黑 (用一条横带表示)
      dorsal: '#61788a',
      flank: '#c5d0d8',
      ventral: '#e9eef1',
      dorsalEdge: 0.55,
      ventralEdge: -0.55,
      softness: 0.3,
      head: '#61788a',
      headMix: 0,
      silver: 1,
      iridescence: 0.55,
      roughness: 0.1,
      scaleSize: 0,
      scaleDepth: 0,
      spotDensity: 0,
      barColor: '#1d2327',
      bars: 1,
      barWidth: 0.7,
      barStrength: 0.85,
      barH: [-1.2, 1.2],
      barS: [0.84, 1.1],
      mottle: 0,
      lateralLine: 0.45,
      // 侧线起于鳃盖上角, 在胸鳍上方急剧下弯, 之后贴近腹缘直到尾端
      lateralLineH: [
        [0.12, 0.55],
        [0.17, 0.1],
        [0.22, -0.35],
        [0.3, -0.58],
        [0.5, -0.66],
        [1, -0.66],
      ],
      interior: '#e8e2de',
      mouthColor: '#3a2328',
      clearcoat: 0.6,
      sheen: 0,
    },
    skeleton: {
      // 椎骨数没有查到可靠来源 (资料里不填), 这里取骨骼网格上限 130 节, 节数只是示意
      vertebrae: 130,
      precaudal: 39,
      centrumR: 0.0036,
      spineLine: [
        [0.1, 0.18],
        [0.3, 0.12],
        [0.6, 0.06],
        [1, 0],
      ],
      spineStart: 0.105,
      neuralLen: 0.85,
      haemalLen: 0.85,
      spineLean: 0.5,
      ribs: 0.75,
      ribCount: 30,
      intermuscular: 0.35,
      opercle: 1,
      branchiostegals: 7,
      jawBone: 1.15,
      skullScale: 1,
      caudalUp: 0,
      caudalExt: 0,
      otolith: 1,
    },
    organs: {
      // 体腔很短 (肛门约在全长的 0.37 处), 而且极薄
      cavity: { s0: 0.12, s1: 0.37, top: 0.88, bottom: 0.84, width: 0.8 },
      heart: { s: 0.113, h: -0.55, size: 0.26 },
      liver: { s0: 0.125, s1: 0.21, size: 0.8, lobes: 2, color: '#8a4630' },
      // 凶猛的捕食者: 胃是长长的盲囊
      stomach: { s0: 0.14, s1: 0.32, size: 0.9, shape: 1 },
      caeca: { count: 24, len: 0.01 },
      intestine: { loops: 0.4, size: 0.8, end: 0.37, spiral: 0 },
      swimBladder: { s0: 0.14, s1: 0.36, size: 0.85, kind: 2, v: 0.55, branches: 0 },
      kidney: { size: 0.55 },
      gonad: { s0: 0.17, s1: 0.36, size: 0.9, color: '#efc98a', eggs: 1 },
      spleen: { size: 0.45 },
      brain: { s: 0.075, size: 0.5, tectum: 1 },
      // 头很窄, 鳃丝缩小才不会穿出体表
      gills: { size: 0.12 },
      redMuscle: 0.05,
      redMuscleDepth: 0,
      muscleColor: '#f3ede6',
      vent: 0.37,
    },
    // 轻柔的鳗鲡式体波 + 背鳍的波动
    swim: { mode: 'anguilliform', freq: 0.6, wavelength: 0.5, amp: [0.008, 0.012, 0.03], headYaw: 0.6, speed: 0.35, medianFlap: 0, pectoralRow: 0.8 },
    // 深度取资料里的常见水层 20 至 50 米
    physiology: { heartRate: 55, breathRate: 45, tempC: 18, depthM: 40, endotherm: 0 },
    lighting: { abyss: 0.1, warm: 0 },
  });
}
