import { makeSpecies, type SpeciesSpec } from '../spec';
import { yellowcat } from './yellowcat';

// 光泽拟鲿 (光泽黄颡鱼, Tachysurus nitidus, 旧名 Pelteobagrus nitidus): 在黄颡鱼的蓝图上改.
// 按照片: 体最细长 (背鳍起点处体高约 0.175 体长), 头长而平扁, 吻较尖; 眼大; 须都很短,
// 颌须末端只到眼后方; 背鳍硬刺长而直, 鳍条末端呈撕裂状; 脂鳍基短于臀鳍基;
// 尾鳍叉形, 两叶末端黑色; 尾鳍基部有一条暗色横带. 体侧金黄, 背部橄榄褐,
// 体侧中部从背鳍下方到尾柄有一条暗褐色纵带, 侧线上有一列浅色小点.
// 体形按照片测量: 体长 822 px 下, 背鳍起点处体高 0.178, 尾柄高 0.085.
export function pbnitidus(): SpeciesSpec {
  return makeSpecies(
    {
      id: 'pbnitidus',
      display: 4.4,
      profile: {
        top: [
          [0, 0.009],
          [0.027, 0.03],
          [0.075, 0.046],
          [0.148, 0.064],
          [0.23, 0.079],
          [0.33, 0.089],
          [0.49, 0.085],
          [0.6, 0.076],
          [0.757, 0.058],
          [0.915, 0.043],
          [1, 0.042],
        ],
        bottom: [
          [0, 0.009],
          [0.027, 0.028],
          [0.075, 0.046],
          [0.148, 0.064],
          [0.23, 0.079],
          [0.33, 0.089],
          [0.49, 0.086],
          [0.6, 0.074],
          [0.757, 0.056],
          [0.915, 0.043],
          [1, 0.042],
        ],
        width: [
          [0, 0.01],
          [0.03, 0.032],
          [0.08, 0.05],
          [0.15, 0.064],
          [0.24, 0.067],
          [0.35, 0.06],
          [0.5, 0.05],
          [0.65, 0.037],
          [0.8, 0.026],
          [0.92, 0.019],
          [1, 0.016],
        ],
        axis: [
          [0, -0.02],
          [0.075, -0.016],
          [0.15, -0.01],
          [0.23, -0.005],
          [0.33, 0],
          [1, 0],
        ],
        snoutRound: 0.026,
        tailCap: 0.01,
      },
      mouth: { corner: 0.048, tipH: -0.55, cornerH: -0.65 },
      eye: { s: 0.075, h: 0.3, r: 0.019, protrude: 0.35, iris: '#c4ccd2', irisMetal: 0.55, pupil: 0.62 },
      gill: {
        edge: [
          [0.6, 0.2],
          [0.2, 0.225],
          [-0.3, 0.218],
          [-0.85, 0.168],
        ],
      },
      fins: [
        {
          // 背鳍 II, 7: 硬刺长, 后缘锯齿明显
          id: 'dorsalFin',
          s0: 0.325,
          s1: 0.43,
          rays: 9,
          spines: 2,
          len: [
            [0, 0.03],
            [0.12, 0.2],
            [0.3, 0.21],
            [0.6, 0.15],
            [1, 0.06],
          ],
          angle: [
            [0, 0.55],
            [0.4, 0.6],
            [1, 0.85],
          ],
          notch: 0.25,
          color: '#5e5a4c',
          edgeColor: '#2e2c26',
          opacity: 0.85,
        },
        {
          id: 'adiposeFin',
          s0: 0.695,
          s1: 0.86,
          len: [
            [0, 0.012],
            [0.25, 0.04],
            [0.7, 0.05],
            [1, 0.036],
          ],
          angle: 0.95,
          color: '#6a5c40',
          edgeColor: '#3c3424',
        },
        {
          // 臀鳍 iii-iv, 22-26, 基部长
          id: 'analFin',
          s0: 0.6,
          s1: 0.87,
          rays: 25,
          len: [
            [0, 0.045],
            [0.15, 0.08],
            [0.5, 0.075],
            [1, 0.05],
          ],
          angle: [
            [0, 0.55],
            [1, 0.8],
          ],
          color: '#5a6068',
          edgeColor: '#2a2e34',
          opacity: 0.85,
        },
        {
          // 尾鳍叉形, 两叶末端黑色
          id: 'caudalFin',
          s0: 0.99,
          rays: 17,
          len: [
            [0, 0.2],
            [0.1, 0.19],
            [0.3, 0.11],
            [0.45, 0.065],
            [0.55, 0.065],
            [0.7, 0.11],
            [0.9, 0.19],
            [1, 0.2],
          ],
          angle: [
            [0, -0.6],
            [0.5, 0],
            [1, 0.32],
          ],
          baseH: 0.042,
          color: '#6e6a5a',
          edgeColor: '#141418',
          opacity: 0.88,
        },
        {
          id: 'pectoralFin',
          s0: 0.2,
          h: -0.78,
          len: [
            [0, 0.18],
            [0.2, 0.16],
            [0.6, 0.12],
            [1, 0.065],
          ],
          color: '#6e6c60',
          edgeColor: '#3a3a34',
        },
        {
          id: 'pelvicFin',
          s0: 0.48,
          len: [
            [0, 0.1],
            [1, 0.06],
          ],
          color: '#6a6a5e',
          edgeColor: '#34342e',
        },
      ],
      skin: {
        dorsal: '#3e3826',
        flank: '#a8955a',
        ventral: '#e4d6a2',
        dorsalEdge: 0.35,
        ventralEdge: -0.4,
        softness: 0.3,
        head: '#6a5a3a',
        headMix: 0.3,
        silver: 0.3,
        iridescence: 0.12,
        // 体侧中部暗褐色纵带
        stripes: { n: 1, h0: 0.12, h1: 0.12, width: 0.22, s0: 0.38, s1: 0.98, color: '#3a3020', amount: 0.55 },
        // 背鳍下, 脂鳍下与尾鳍基部的暗色横斑; 最后一条在尾鳍基
        barColor: '#2c2618',
        bars: 3,
        barWidth: 0.22,
        barStrength: 0.5,
        barH: [-0.2, 1],
        barS: [0.35, 1.07],
        mottle: 0.35,
        mottleScale: 0.025,
        mottleColor: '#3a3220',
        spotColor: '#e8dcae',
        spotSize: 0.0035,
        spotDensity: 0.25,
        spotH: [0.05, 0.2],
        spotS: [0.25, 0.9],
        lateralLine: 0.9,
        lateralLineH: [
          [0, 0.4],
          [0.22, 0.35],
          [0.4, 0.15],
          [0.7, 0.04],
          [1, 0],
        ],
      },
      // 脊椎数没有查到, 按黄颡鱼的 36-38 与体形长短估计
      skeleton: { vertebrae: 40, precaudal: 15 },
      organs: {
        cavity: { s0: 0.21, s1: 0.595, top: 0.88, bottom: 0.85, width: 0.8 },
        swimBladder: { s0: 0.22, s1: 0.355, size: 1, kind: 1, v: 0.5, branches: 0 },
        gonad: { s0: 0.33, s1: 0.57, size: 0.9, color: '#e0a64a', eggs: 1 },
        vent: 0.595,
        intestine: { loops: 1, size: 0.85, end: 0.595, spiral: 0 },
      },
      swim: { mode: 'subcarangiform', freq: 1.6, wavelength: 0.95, amp: [0.02, -0.06, 0.16], headYaw: 0.9, speed: 0.8 },
      extras: {
        // 须都短: 鼻须短, 颌须末端只到眼后
        barbels: {
          items: [
            { s: 0.03, th: 1.0, len: 0.035, dir: [0.35, 0.9, 0.3], droop: -0.2 },
            // 颏须 2 对, 都很短
            { s: 0.058, th: -1.05, len: 0.045, dir: [0.45, -0.8, 0.4], droop: 0.45 },
            { s: 0.06, th: -1.35, len: 0.03, dir: [0.4, -0.85, 0.2], droop: 0.45 },
            // 颌须放在最后, 标注锚点取最后一根
            { s: 0.046, th: -0.45, len: 0.07, dir: [0.75, -0.5, 0.45], droop: 0.4 },
          ],
          thick: 0.7,
          color: '#d8cdb0',
        },
      },
      physiology: { heartRate: 58, breathRate: 72, tempC: 22, depthM: 4, endotherm: 0 },
      lighting: { warm: 0.55 },
    },
    yellowcat(),
  );
}
