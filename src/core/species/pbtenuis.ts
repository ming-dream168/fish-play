import { makeSpecies, type SpeciesSpec } from '../spec';
import { yellowcat } from './yellowcat';

// 圆尾拟鲿 (Tachysurus tenuis, 旧名 Pseudobagrus tenuis): 在黄颡鱼的蓝图上改.
// 按照片: 体长而低, 后半身侧扁, 尾柄长而高; 头平扁, 吻圆钝; 眼很小, 靠近吻端;
// 须短, 颌须不达胸鳍基部; 背鳍低, 硬刺短于分枝鳍条 (刺比鳍条短得多), 鳍缘呈撕裂状;
// 脂鳍很长而低, 基部和臀鳍基差不多长, 后端游离; 尾鳍圆形, 镶白边, 不分叉, 这是与叉尾的黄颡鱼, 瓦氏拟鲿,
// 光泽拟鲿最直观的区别. 体色均一的黄褐到橄榄黄, 背部和体侧密布细小的浅色斑点, 尾鳍橙黄.
// 照片中标本尾部向下弯, 量体形时沿体轴取.
// 体形按照片测量: 体长约 850 px 下, 背鳍起点处体高 0.162, 尾柄高 0.088.
export function pbtenuis(): SpeciesSpec {
  return makeSpecies(
    {
      id: 'pbtenuis',
      display: 4.5,
      profile: {
        top: [
          [0, 0.01],
          [0.026, 0.025],
          [0.073, 0.038],
          [0.14, 0.056],
          [0.225, 0.072],
          [0.31, 0.08],
          [0.485, 0.078],
          [0.64, 0.068],
          [0.78, 0.058],
          [0.92, 0.047],
          [1, 0.045],
        ],
        bottom: [
          [0, 0.01],
          [0.026, 0.025],
          [0.073, 0.04],
          [0.14, 0.058],
          [0.225, 0.074],
          [0.31, 0.08],
          [0.485, 0.078],
          [0.64, 0.066],
          [0.78, 0.054],
          [0.92, 0.045],
          [1, 0.044],
        ],
        width: [
          [0, 0.012],
          [0.03, 0.034],
          [0.08, 0.052],
          [0.15, 0.064],
          [0.24, 0.066],
          [0.35, 0.06],
          [0.5, 0.05],
          [0.65, 0.038],
          [0.8, 0.028],
          [0.92, 0.022],
          [1, 0.019],
        ],
        axis: [
          [0, -0.02],
          [0.07, -0.016],
          [0.14, -0.01],
          [0.225, -0.004],
          [0.31, 0],
          [1, 0],
        ],
        snoutRound: 0.036,
        tailCap: 0.01,
      },
      mouth: { corner: 0.05, tipH: -0.5, cornerH: -0.62 },
      // 眼很小, 离吻端近
      eye: { s: 0.055, h: 0.38, r: 0.011, protrude: 0.25, iris: '#b8c0c2', irisMetal: 0.4, pupil: 0.55 },
      gill: {
        edge: [
          [0.6, 0.19],
          [0.2, 0.215],
          [-0.3, 0.208],
          [-0.85, 0.16],
        ],
      },
      fins: [
        {
          // 背鳍 II, 7: 硬刺短, 约为最长分枝鳍条的三分之二; 鳍低
          id: 'dorsalFin',
          s0: 0.28,
          s1: 0.39,
          rays: 9,
          spines: 2,
          len: [
            [0, 0.02],
            [0.12, 0.09],
            [0.3, 0.128],
            [0.6, 0.11],
            [1, 0.05],
          ],
          angle: [
            [0, 0.5],
            [0.4, 0.55],
            [1, 0.8],
          ],
          notch: 0.15,
          color: '#a89650',
          edgeColor: '#d8c88a',
          opacity: 0.86,
        },
        {
          // 脂鳍长而低, 基部和臀鳍基约等长
          id: 'adiposeFin',
          s0: 0.58,
          s1: 0.88,
          len: [
            [0, 0.006],
            [0.15, 0.022],
            [0.6, 0.03],
            [0.9, 0.032],
            [1, 0.022],
          ],
          angle: 0.8,
          color: '#8a7a40',
          edgeColor: '#6a5c30',
        },
        {
          // 臀鳍 iii-iv, 16-18
          id: 'analFin',
          s0: 0.6,
          s1: 0.87,
          rays: 20,
          len: [
            [0, 0.035],
            [0.15, 0.062],
            [0.5, 0.065],
            [1, 0.048],
          ],
          angle: [
            [0, 0.6],
            [1, 0.85],
          ],
          color: '#a8a070',
          edgeColor: '#d8cc98',
          opacity: 0.84,
        },
        {
          // 尾鳍圆形, 后缘浅色 (百度百科与 2005 年 Zootaxa 文献记为白边)
          id: 'caudalFin',
          s0: 0.99,
          rays: 17,
          len: [
            [0, 0.11],
            [0.2, 0.145],
            [0.5, 0.165],
            [0.8, 0.148],
            [1, 0.115],
          ],
          angle: [
            [0, -0.6],
            [0.5, 0],
            [1, 0.55],
          ],
          baseH: 0.044,
          color: '#c88a3c',
          edgeColor: '#f0e2bc',
          opacity: 0.9,
        },
        {
          // 胸鳍 I, 7-8: 硬刺短, 前缘光滑, 后缘有锯齿
          id: 'pectoralFin',
          s0: 0.19,
          h: -0.8,
          len: [
            [0, 0.1],
            [0.2, 0.11],
            [0.6, 0.09],
            [1, 0.05],
          ],
          color: '#a89a68',
          edgeColor: '#7a6e48',
        },
        {
          id: 'pelvicFin',
          s0: 0.47,
          len: [
            [0, 0.075],
            [1, 0.05],
          ],
          color: '#c09a50',
          edgeColor: '#8a6e38',
        },
      ],
      skin: {
        dorsal: '#6a5c2a',
        flank: '#a08a42',
        ventral: '#d8c278',
        dorsalEdge: 0.4,
        ventralEdge: -0.45,
        softness: 0.4,
        head: '#a8884a',
        headMix: 0.3,
        silver: 0.05,
        iridescence: 0.04,
        bars: 0,
        barStrength: 0,
        // 细小浅色斑点, 背部和体侧上半密
        spotColor: '#c2b272',
        spotSize: 0.0035,
        spotDensity: 0.4,
        spotShape: 2,
        spotH: [-0.2, 1],
        spotS: [0.1, 0.98],
        mottle: 0.25,
        mottleScale: 0.04,
        mottleColor: '#5a4c24',
        lateralLine: 0.5,
      },
      // 脊椎数没有查到, 按黄颡鱼的 36-38 与体形长短估计
      skeleton: { vertebrae: 41, precaudal: 15 },
      organs: {
        cavity: { s0: 0.2, s1: 0.595, top: 0.88, bottom: 0.85, width: 0.8 },
        swimBladder: { s0: 0.21, s1: 0.33, size: 0.95, kind: 1, v: 0.5, branches: 0 },
        gonad: { s0: 0.32, s1: 0.57, size: 0.9, color: '#e0a64a', eggs: 1 },
        vent: 0.595,
        intestine: { loops: 1, size: 0.9, end: 0.595, spiral: 0 },
      },
      swim: { mode: 'subcarangiform', freq: 1.1, wavelength: 0.9, amp: [0.02, -0.05, 0.16], headYaw: 0.9, speed: 0.5 },
      extras: {
        // 须短: 鼻须短, 颌须不达胸鳍基部
        barbels: {
          items: [
            { s: 0.03, th: 1.0, len: 0.035, dir: [0.35, 0.9, 0.3], droop: -0.2 },
            // 颏须 2 对, 都短
            { s: 0.058, th: -1.05, len: 0.05, dir: [0.45, -0.8, 0.4], droop: 0.45 },
            { s: 0.06, th: -1.35, len: 0.035, dir: [0.4, -0.85, 0.2], droop: 0.45 },
            // 颌须放在最后, 标注锚点取最后一根
            { s: 0.048, th: -0.5, len: 0.085, dir: [0.6, -0.6, 0.5], droop: 0.5 },
          ],
          thick: 0.75,
          color: '#d8c8a0',
        },
      },
      physiology: { heartRate: 50, breathRate: 60, tempC: 20, depthM: 3, endotherm: 0 },
      lighting: { warm: 0.65 },
    },
    yellowcat(),
  );
}
