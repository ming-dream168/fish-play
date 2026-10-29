import { makeSpecies, type SpeciesSpec } from '../spec';
import { yellowcat } from './yellowcat';

// 白边拟鲿 (Tachysurus albomarginatus, 旧名 Pseudobagrus albomarginatus): 在黄颡鱼的蓝图上改.
// 按照片: 体粗壮, 背鳍前方隆起, 头平扁而宽, 吻圆钝; 眼小; 须短, 颌须末端只到眼后方附近;
// 背鳍高, 硬刺粗; 脂鳍厚而低, 基部略长于臀鳍基, 后端游离; 尾鳍宽大, 资料记为圆形,
// 照片中后缘近截形而略外凸, 上下角钝圆; 各鳍有暗色的亚端带, 鳍缘浅白色 (种名 albomarginatus 即 "白边"), 尾鳍尤其明显.
// 体色浅黄褐到橙褐, 无明显斑纹; 照片标本是浸制标本, 皮肤因收缩起皱.
// 体形按照片测量: 体长 820 px 下, 背鳍起点处体高 0.19, 尾柄高 0.09.
export function pbalbomarg(): SpeciesSpec {
  return makeSpecies(
    {
      id: 'pbalbomarg',
      display: 4.3,
      profile: {
        top: [
          [0, 0.012],
          [0.03, 0.026],
          [0.085, 0.046],
          [0.17, 0.07],
          [0.27, 0.087],
          [0.35, 0.096],
          [0.51, 0.094],
          [0.65, 0.082],
          [0.82, 0.058],
          [0.94, 0.047],
          [1, 0.046],
        ],
        bottom: [
          [0, 0.012],
          [0.03, 0.024],
          [0.085, 0.046],
          [0.17, 0.07],
          [0.27, 0.087],
          [0.35, 0.095],
          [0.51, 0.094],
          [0.65, 0.08],
          [0.82, 0.056],
          [0.94, 0.046],
          [1, 0.045],
        ],
        width: [
          [0, 0.014],
          [0.03, 0.04],
          [0.08, 0.06],
          [0.15, 0.074],
          [0.24, 0.078],
          [0.35, 0.07],
          [0.5, 0.058],
          [0.65, 0.044],
          [0.8, 0.032],
          [0.92, 0.024],
          [1, 0.021],
        ],
        axis: [
          [0, -0.026],
          [0.085, -0.02],
          [0.17, -0.013],
          [0.27, -0.006],
          [0.35, 0],
          [1, 0],
        ],
        snoutRound: 0.038,
        tailCap: 0.01,
      },
      mouth: { corner: 0.055, tipH: -0.5, cornerH: -0.62 },
      eye: { s: 0.085, h: 0.38, r: 0.014, protrude: 0.25, iris: '#b4bcc2', irisMetal: 0.45, pupil: 0.58 },
      gill: {
        edge: [
          [0.6, 0.2],
          [0.2, 0.228],
          [-0.3, 0.222],
          [-0.85, 0.17],
        ],
      },
      fins: [
        {
          // 背鳍 II, 7: 硬刺粗, 后缘有弱锯齿
          id: 'dorsalFin',
          s0: 0.35,
          s1: 0.47,
          rays: 9,
          spines: 2,
          len: [
            [0, 0.03],
            [0.12, 0.17],
            [0.3, 0.19],
            [0.65, 0.15],
            [1, 0.06],
          ],
          angle: [
            [0, 0.75],
            [0.4, 0.8],
            [1, 0.95],
          ],
          color: '#8a7a4a',
          edgeColor: '#e8e2cc',
          opacity: 0.88,
        },
        {
          // 脂鳍长而低, 和臀鳍基约等长
          id: 'adiposeFin',
          s0: 0.6,
          s1: 0.93,
          len: [
            [0, 0.006],
            [0.15, 0.028],
            [0.6, 0.038],
            [0.9, 0.04],
            [1, 0.028],
          ],
          angle: 0.85,
          color: '#7a6640',
          edgeColor: '#5a4a2e',
        },
        {
          // 臀鳍 iii-iv, 17-20; 暗色亚端带, 鳍缘浅白
          id: 'analFin',
          s0: 0.64,
          s1: 0.92,
          rays: 21,
          len: [
            [0, 0.05],
            [0.15, 0.09],
            [0.5, 0.088],
            [1, 0.06],
          ],
          angle: [
            [0, 0.6],
            [1, 0.85],
          ],
          color: '#7a6c48',
          edgeColor: '#e6e0c8',
          opacity: 0.88,
        },
        {
          // 尾鳍宽大, 后缘近截形略外凸, 上下角圆; 暗色亚端带 + 白边
          id: 'caudalFin',
          s0: 0.99,
          rays: 17,
          len: [
            [0, 0.16],
            [0.12, 0.195],
            [0.35, 0.205],
            [0.5, 0.205],
            [0.65, 0.207],
            [0.88, 0.2],
            [1, 0.165],
          ],
          angle: [
            [0, -0.5],
            [0.5, 0],
            [1, 0.42],
          ],
          baseH: 0.046,
          color: '#6e5c3e',
          edgeColor: '#ece6d0',
          opacity: 0.9,
        },
        {
          id: 'pectoralFin',
          s0: 0.21,
          h: -0.78,
          len: [
            [0, 0.16],
            [0.2, 0.14],
            [0.6, 0.11],
            [1, 0.06],
          ],
          color: '#8a7a50',
          edgeColor: '#e0d8bc',
        },
        {
          id: 'pelvicFin',
          s0: 0.51,
          len: [
            [0, 0.09],
            [1, 0.06],
          ],
          color: '#a0884e',
          edgeColor: '#e6dcbc',
        },
      ],
      skin: {
        dorsal: '#7a5a34',
        flank: '#b08050',
        ventral: '#e2c49a',
        dorsalEdge: 0.4,
        ventralEdge: -0.45,
        softness: 0.4,
        head: '#c07a4a',
        headMix: 0.35,
        silver: 0.04,
        iridescence: 0.03,
        bars: 0,
        barStrength: 0,
        spotDensity: 0,
        mottle: 0.35,
        mottleScale: 0.02,
        mottleColor: '#6a4c2c',
        lateralLine: 0.5,
      },
      // 百度百科记脊椎 46 枚; 腹椎数没有查到, 按体腔长度估计
      skeleton: { vertebrae: 46, precaudal: 17 },
      organs: {
        cavity: { s0: 0.215, s1: 0.635, top: 0.88, bottom: 0.85, width: 0.82 },
        swimBladder: { s0: 0.225, s1: 0.36, size: 1, kind: 1, v: 0.5, branches: 0 },
        vent: 0.635,
      },
      swim: { mode: 'subcarangiform', freq: 1.1, wavelength: 0.95, amp: [0.02, -0.05, 0.15], headYaw: 0.9, speed: 0.5 },
      extras: {
        barbels: {
          items: [
            { s: 0.03, th: 1.0, len: 0.045, dir: [0.3, 0.9, 0.35], droop: -0.2 },
            // 颏须 2 对, 都短
            { s: 0.058, th: -1.05, len: 0.05, dir: [0.45, -0.8, 0.4], droop: 0.45 },
            { s: 0.06, th: -1.35, len: 0.035, dir: [0.4, -0.85, 0.2], droop: 0.45 },
            // 颌须放在最后, 标注锚点取最后一根
            { s: 0.052, th: -0.5, len: 0.09, dir: [0.6, -0.6, 0.5], droop: 0.5 },
          ],
          thick: 0.8,
          color: '#e0c8a0',
        },
      },
      physiology: { heartRate: 50, breathRate: 60, tempC: 20, depthM: 3, endotherm: 0 },
      lighting: { warm: 0.65 },
    },
    yellowcat(),
  );
}
