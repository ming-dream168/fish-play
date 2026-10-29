import { makeSpecies, type SpeciesSpec } from '../spec';
import { yellowcat } from './yellowcat';

// 瓦氏拟鲿 (瓦氏黄颡鱼, Tachysurus vachellii, 旧名 Pelteobagrus vachellii): 在黄颡鱼的蓝图上改.
// 与黄颡鱼的区别 (都按照片): 体较细长, 背鳍前方不那么隆起, 尾柄细长; 吻较尖而突出;
// 眼较大; 背鳍硬刺长, 明显后倾, 鳍高约为体长的四分之一; 尾鳍深叉形, 两叶尖长;
// 胸鳍硬刺长, 后缘锯齿粗; 体色灰黄, 背部褐色, 枕部有一块浅黄色鞍斑, 脂鳍下方有一块浅色斑;
// 侧线淡色明显; 鼻须较长, 颌须末端超过胸鳍基部.
// 体形按照片测量: 体长 755 px 下, 背鳍起点处体高 0.195, 尾柄高 0.085.
export function pbvachellii(): SpeciesSpec {
  return makeSpecies(
    {
      id: 'pbvachellii',
      display: 4.3,
      profile: {
        top: [
          [0, 0.01],
          [0.02, 0.026],
          [0.046, 0.04],
          [0.113, 0.064],
          [0.205, 0.085],
          [0.31, 0.097],
          [0.48, 0.092],
          [0.63, 0.08],
          [0.775, 0.06],
          [0.92, 0.042],
          [1, 0.04],
        ],
        bottom: [
          [0, 0.01],
          [0.02, 0.024],
          [0.046, 0.04],
          [0.113, 0.064],
          [0.205, 0.086],
          [0.31, 0.097],
          [0.48, 0.093],
          [0.63, 0.078],
          [0.775, 0.058],
          [0.92, 0.042],
          [1, 0.04],
        ],
        width: [
          [0, 0.01],
          [0.03, 0.034],
          [0.08, 0.055],
          [0.15, 0.07],
          [0.24, 0.072],
          [0.35, 0.065],
          [0.5, 0.054],
          [0.65, 0.04],
          [0.8, 0.028],
          [0.92, 0.02],
          [1, 0.017],
        ],
        axis: [
          [0, -0.024],
          [0.05, -0.016],
          [0.12, -0.01],
          [0.21, -0.005],
          [0.31, 0],
          [1, 0],
        ],
        snoutRound: 0.03,
        tailCap: 0.01,
      },
      // 口下位, 吻突出于口前
      mouth: { corner: 0.05, tipH: -0.55, cornerH: -0.65 },
      eye: { s: 0.08, h: 0.28, r: 0.021, protrude: 0.35, iris: '#c7d0d6', irisMetal: 0.55, pupil: 0.62 },
      gill: {
        edge: [
          [0.6, 0.198],
          [0.2, 0.222],
          [-0.3, 0.215],
          [-0.85, 0.165],
        ],
      },
      fins: [
        {
          // 背鳍 II, 7: 硬刺长, 后缘有锯齿, 明显向后倾
          id: 'dorsalFin',
          s0: 0.31,
          s1: 0.42,
          rays: 9,
          spines: 2,
          len: [
            [0, 0.03],
            [0.12, 0.215],
            [0.3, 0.235],
            [0.6, 0.17],
            [1, 0.07],
          ],
          angle: [
            [0, 0.75],
            [0.4, 0.8],
            [1, 1.0],
          ],
          color: '#7d8690',
          edgeColor: '#2a3038',
          opacity: 0.8,
        },
        {
          // 脂鳍基部短于臀鳍基, 后端游离
          id: 'adiposeFin',
          s0: 0.695,
          s1: 0.855,
          len: [
            [0, 0.012],
            [0.25, 0.035],
            [0.7, 0.045],
            [1, 0.034],
          ],
          angle: 1.0,
          color: '#6c6450',
          edgeColor: '#4c4636',
        },
        {
          // 臀鳍 iii, 20-24
          id: 'analFin',
          s0: 0.63,
          s1: 0.855,
          rays: 23,
          len: [
            [0, 0.05],
            [0.15, 0.1],
            [0.5, 0.092],
            [1, 0.06],
          ],
          angle: [
            [0, 0.55],
            [1, 0.85],
          ],
          color: '#8a939c',
          edgeColor: '#2a2e34',
          opacity: 0.8,
        },
        {
          // 尾鳍深叉形, 两叶尖长, 上下叶约等长
          id: 'caudalFin',
          s0: 0.99,
          rays: 17,
          len: [
            [0, 0.25],
            [0.08, 0.22],
            [0.3, 0.12],
            [0.45, 0.065],
            [0.55, 0.065],
            [0.7, 0.12],
            [0.92, 0.22],
            [1, 0.25],
          ],
          angle: [
            [0, -0.62],
            [0.5, 0],
            [1, 0.5],
          ],
          baseH: 0.04,
          color: '#8a929a',
          edgeColor: '#262a30',
          opacity: 0.82,
        },
        {
          // 胸鳍 I, 7: 硬刺长, 后缘锯齿粗
          id: 'pectoralFin',
          s0: 0.2,
          h: -0.78,
          len: [
            [0, 0.17],
            [0.2, 0.155],
            [0.6, 0.12],
            [1, 0.07],
          ],
          color: '#8a929a',
          edgeColor: '#5a626a',
        },
        {
          id: 'pelvicFin',
          s0: 0.48,
          len: [
            [0, 0.1],
            [1, 0.065],
          ],
          color: '#9aa2aa',
          edgeColor: '#5a626c',
        },
      ],
      skin: {
        dorsal: '#5a4a30',
        flank: '#a8a088',
        ventral: '#e8e2cc',
        dorsalEdge: 0.4,
        ventralEdge: -0.3,
        softness: 0.3,
        head: '#a88a50',
        headMix: 0.35,
        silver: 0.25,
        iridescence: 0.1,
        // 枕部浅黄色鞍斑
        blotch: { s: 0.245, h: 0.75, r: 0.03, color: '#c4b072', ring: '#c4b072', ringW: 0, amount: 0.32 },
        // 脂鳍前下方的浅色斑
        blotch2: { s: 0.735, h: 0.6, r: 0.022, color: '#c4b27a', ring: '#c4b27a', ringW: 0, amount: 0.25 },
        barColor: '#3a2e1c',
        bars: 2,
        barWidth: 0.3,
        barStrength: 0.3,
        barH: [0, 1],
        barS: [0.18, 0.75],
        mottle: 0.3,
        mottleScale: 0.03,
        mottleColor: '#4a3c26',
        lateralLine: 0.9,
        lateralLineH: [
          [0, 0.4],
          [0.22, 0.35],
          [0.4, 0.12],
          [0.7, 0.02],
          [1, 0],
        ],
      },
      // 脊椎数没有查到, 沿用黄颡鱼的量级略增 (体更长, 臀鳍条更多)
      skeleton: { vertebrae: 40, precaudal: 15 },
      organs: {
        cavity: { s0: 0.21, s1: 0.625, top: 0.88, bottom: 0.85, width: 0.8 },
        swimBladder: { s0: 0.22, s1: 0.36, size: 1, kind: 1, v: 0.5, branches: 0 },
        vent: 0.625,
        intestine: { loops: 1, size: 0.9, end: 0.625, spiral: 0 },
      },
      swim: { mode: 'subcarangiform', freq: 1.5, wavelength: 0.95, amp: [0.02, -0.06, 0.16], headYaw: 0.9, speed: 0.75 },
      extras: {
        barbels: {
          items: [
            { s: 0.033, th: 1.05, len: 0.095, dir: [0.25, 0.95, 0.3], droop: -0.3 },
            // 颏须 2 对: 外侧一对末端可达胸鳍, 内侧较短
            { s: 0.058, th: -1.05, len: 0.13, dir: [0.45, -0.8, 0.4], droop: 0.45 },
            { s: 0.06, th: -1.35, len: 0.08, dir: [0.4, -0.85, 0.2], droop: 0.45 },
            // 颌须放在最后, 标注锚点取最后一根
            { s: 0.048, th: -0.45, len: 0.2, dir: [0.85, -0.38, 0.38], droop: 0.4 },
          ],
          thick: 0.75,
          color: '#e0d8c4',
        },
      },
      physiology: { heartRate: 55, breathRate: 70, tempC: 22, depthM: 4, endotherm: 0 },
      lighting: { warm: 0.55 },
    },
    yellowcat(),
  );
}
