// 物种特化结构 (第二批): 鲟的骨板, 鲤与鲟的须, 鲤的韦伯氏器与咽齿.
// 与其它部件一样固定拓扑: 物种没有该结构时缩为零, 仍可逐顶点插值.

import * as THREE from 'three';
import type { BodyModel } from '../body';
import { GeomBuilder, InstanceWriter, ellipsoid, recomputeNormals, resample, tube, type GeomData, type InstanceData } from '../geom';
import { clamp, hash1, lerp } from '../math';
import { centrumR, gillArchPath, spinePoint } from './skeleton';

// ---------- 骨板 (鲟: 背行 1 列, 体侧与腹侧左右各 1 列菱形骨板, 每块中央有一道纵棱) ----------
export const SCUTE_MAX = 150;
const ROW_MAX = { dorsal: 20, lateral: 45, ventral: 18 };

/** 骨板单元: 菱形的厚板, 中央隆起一道沿体轴的棱脊. 局部坐标 x 沿体轴, y 朝外, z 横向. */
export function buildScuteUnit(): GeomData {
  const b = new GeomBuilder({ color: 3 });
  const n = 10;
  const H = 0.22; // 板的隆起
  const K = 0.34; // 棱脊
  const h = (x: number, z: number) => {
    const d = clamp(Math.abs(x) / 0.5 + Math.abs(z) / 0.5, 0, 1);
    return H * Math.pow(1 - d, 0.7) + K * (1 - d) * Math.exp(-z * z * 60);
  };
  const edge = new THREE.Color('#8f846c');
  const mid = new THREE.Color('#e6dcc4');
  const P = new THREE.Vector3();
  const N = new THREE.Vector3();
  // 顶面: 方形网格旋转 45 度铺满菱形
  for (let j = 0; j <= n; j++) {
    for (let i = 0; i <= n; i++) {
      const u = (i / n) * 2 - 1;
      const v = (j / n) * 2 - 1;
      const x = (u + v) * 0.25;
      const z = (v - u) * 0.25;
      const y = h(x, z);
      const e = 1e-3;
      N.set(-(h(x + e, z) - h(x - e, z)) / (2 * e), 1, -(h(x, z + e) - h(x, z - e)) / (2 * e)).normalize();
      P.set(x, y, z);
      const d = clamp(Math.abs(x) / 0.5 + Math.abs(z) / 0.5, 0, 1);
      const c = mid.clone().lerp(edge, Math.pow(d, 1.5));
      b.add(P, N, i / n, j / n, { color: [c.r, c.g, c.b] });
    }
  }
  const row = n + 1;
  // 绕向: (u, v) 网格旋转 45 度后, 按 i → j 的顺序是顺时针, 所以反过来连, 让顶面朝外
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) b.quad(j * row + i, (j + 1) * row + i, (j + 1) * row + i + 1, j * row + i + 1);
  // 底面 (平的, 让 X 光能算出厚度)
  const base = b.count;
  for (let j = 0; j <= n; j++) {
    for (let i = 0; i <= n; i++) {
      const u = (i / n) * 2 - 1;
      const v = (j / n) * 2 - 1;
      P.set((u + v) * 0.25, 0, (v - u) * 0.25);
      b.add(P, N.set(0, -1, 0), i / n, j / n, { color: [edge.r, edge.g, edge.b] });
    }
  }
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) b.quad(base + j * row + i, base + j * row + i + 1, base + (j + 1) * row + i + 1, base + (j + 1) * row + i);
  return b.build();
}

export function buildScutes(body: BodyModel): InstanceData {
  const sc = body.spec.extras.scutes;
  const w = new InstanceWriter(SCUTE_MAX);
  const L = body.L;
  const fins = body.spec.fins;
  const dorsalFin = fins.find((f) => f.id === 'dorsalFin')!;
  const pelvic = fins.find((f) => f.id === 'pelvicFin')!;
  const pectoral = fins.find((f) => f.id === 'pectoralFin')!;
  const X = new THREE.Vector3();
  const Y = new THREE.Vector3();
  const Z = new THREE.Vector3();
  const M = new THREE.Matrix4();
  const P = new THREE.Vector3();
  const P2 = new THREE.Vector3();
  // 截面角: π/2 背中线, 0 左侧中线, -π/2 腹中线
  const rows: { th: number; n: number; s0: number; s1: number; k: number }[] = [
    { th: Math.PI / 2, n: Math.min(ROW_MAX.dorsal, Math.round(sc.dorsal)), s0: sc.s0, s1: dorsalFin.s0 - 0.012, k: 1.25 },
    { th: 0.08, n: Math.min(ROW_MAX.lateral, Math.round(sc.lateral)), s0: sc.s0 + 0.01, s1: 0.975, k: 0.8 },
    { th: Math.PI - 0.08, n: Math.min(ROW_MAX.lateral, Math.round(sc.lateral)), s0: sc.s0 + 0.01, s1: 0.975, k: 0.8 },
    { th: -0.95, n: Math.min(ROW_MAX.ventral, Math.round(sc.ventral)), s0: pectoral.s0 + 0.04, s1: pelvic.s0 - 0.012, k: 0.85 },
    { th: -(Math.PI - 0.95), n: Math.min(ROW_MAX.ventral, Math.round(sc.ventral)), s0: pectoral.s0 + 0.04, s1: pelvic.s0 - 0.012, k: 0.85 },
  ];
  for (const r of rows) {
    for (let i = 0; i < r.n; i++) {
      const s = lerp(r.s0, r.s1, r.n > 1 ? i / (r.n - 1) : 0.5);
      body.surface(s, r.th, 0, P);
      body.surfaceNormal(s, r.th, 0, Y);
      body.surface(s + 0.004, r.th, 0, P2);
      X.subVectors(P2, P);
      if (X.lengthSq() < 1e-12) X.set(1, 0, 0);
      X.addScaledVector(Y, -X.dot(Y)).normalize();
      Z.crossVectors(X, Y).normalize();
      M.makeBasis(X, Y, Z);
      const q = new THREE.Quaternion().setFromRotationMatrix(M);
      // 往尾部渐小
      const len = sc.size * L * r.k * (1 - 0.45 * clamp((s - 0.55) / 0.42, 0, 1));
      w.push(P.clone().addScaledVector(Y, -len * 0.06), q, new THREE.Vector3(len, len * 0.55, len * 0.8));
    }
  }
  return w.finish(body.surface(0.4, Math.PI / 2, 0.01));
}

// ---------- 须 (鲤: 吻须与颌须各一对; 鲟: 吻部腹面一横排 4 根) ----------
export const BARBEL_MAX = 2; // 每侧最多两根

export function buildBarbels(body: BodyModel): GeomData {
  const bb = body.spec.extras.barbels;
  const b = new GeomBuilder();
  const L = body.L;
  const seg = 10;
  const P = new THREE.Vector3();
  const N = new THREE.Vector3();
  for (let k = 0; k < BARBEL_MAX; k++) {
    const it = bb.items[k];
    const len = it ? it.len * L : 0;
    const s = it ? it.s : 0.05;
    const th = it ? it.th : -0.5;
    for (const side of [1, -1]) {
      // 右侧用镜像的截面角
      const t = side > 0 ? th : Math.PI - th;
      body.surface(s, t, 0.002, P);
      body.surfaceNormal(s, t, 0, N);
      const dir = it ? new THREE.Vector3(it.dir[0], it.dir[1], it.dir[2] * side).normalize() : new THREE.Vector3(0, -1, 0);
      const droop = it ? it.droop : 0;
      const ctrl = [
        P.clone(),
        P.clone().addScaledVector(dir, len * 0.35).addScaledVector(N, len * 0.05),
        P.clone().addScaledVector(dir, len * 0.7).add(new THREE.Vector3(0, -droop * len * 0.2, 0)),
        P.clone().addScaledVector(dir, len).add(new THREE.Vector3(0, -droop * len * 0.45, 0)),
      ];
      const pts = resample(ctrl, seg);
      const r0 = 0.0034 * L * bb.thick * (len > 0 ? 1 : 0);
      tube(b, pts, (i) => r0 * lerp(1, 0.3, i / (seg - 1)) + 1e-6, 6, { capRings: 2 });
    }
  }
  return b.build();
}

export function barbelAnchor(body: BodyModel) {
  const it = body.spec.extras.barbels.items[body.spec.extras.barbels.items.length - 1];
  if (!it) return body.bodyPoint(0.04, -0.3, 0.8);
  const P = body.surface(it.s, it.th, 0);
  return P.add(new THREE.Vector3(it.dir[0], it.dir[1], it.dir[2]).normalize().multiplyScalar(it.len * body.L * 0.6));
}

// ---------- 韦伯氏器 (鲤形目: 前 4 节椎骨特化出的小骨链, 把鳔的振动传到内耳) ----------
/** 骨链路径: 从鳔前室背面 (三脚骨) 沿前几节椎体侧面向前上方, 到颅骨后缘 (闩骨). */
function weberianChain(body: BodyModel, side: number) {
  const sk = body.spec.skeleton;
  const sb = body.spec.organs.swimBladder;
  const s0 = sk.spineStart;
  const r = centrumR(body, s0 + 0.02);
  const sT = Math.max(sb.s0 + 0.018, s0 + 0.03);
  const bladder = body.cavityPoint(sT, Math.min(0.92, sb.v + 0.15), side * 0.3);
  const mid = spinePoint(body, lerp(s0, sT, 0.5)).add(new THREE.Vector3(0, -r * 0.15, side * r * 1.9));
  const ear = spinePoint(body, s0 - 0.006).add(new THREE.Vector3(0, r * 0.95, side * r * 1.25));
  return resample([bladder, mid, ear], 16);
}

export function buildWeberian(body: BodyModel): GeomData {
  const k = body.spec.skeleton.weberian;
  const b = new GeomBuilder();
  const L = body.L;
  for (const side of [1, -1]) {
    const chain = weberianChain(body, side);
    const at = (t: number) => {
      const f = clamp(t, 0, 1) * (chain.length - 1);
      const i = Math.min(chain.length - 2, Math.floor(f));
      return chain[i].clone().lerp(chain[i + 1], f - i);
    };
    const tangent = (t: number) => at(t + 0.02).sub(at(t - 0.02)).normalize();
    const out = new THREE.Vector3(0, 0, side);
    // 三脚骨: 最大, 月牙形, 后端的横突贴在鳔前室壁上
    const T0 = at(0.02);
    const T1 = at(0.3);
    const bend = new THREE.Vector3().crossVectors(tangent(0.16), out).normalize().multiplyScalar(0.012 * L * k);
    const tri = resample([T0.clone().addScaledVector(out, -0.004 * L * k), T0.clone().lerp(T1, 0.5).add(bend), T1], 12);
    tube(b, tri, (i) => (0.0024 * Math.sin(Math.PI * (0.12 + 0.76 * (i / 11))) + 0.0006) * L * k + 1e-7, 7, { capRings: 2, squash: 0.55 });
    // 间插骨 (最小), 舟骨 (匙形), 闩骨 (偏背侧)
    const bones: [number, number, number, number][] = [
      [0.5, 0.0028, 0.0022, 0.0018],
      [0.72, 0.0052, 0.0036, 0.0022],
      [0.92, 0.0032, 0.0024, 0.0018],
    ];
    for (const [t, a, bb, c] of bones) {
      const C = at(t);
      const tg = tangent(t);
      const ax = tg.clone().multiplyScalar(a * L * k + 1e-7);
      const ay = new THREE.Vector3(0, 1, 0).addScaledVector(tg, -tg.y).normalize().multiplyScalar(bb * L * k + 1e-7);
      const az = tg.clone().cross(ay.clone().normalize()).normalize().multiplyScalar(c * L * k + 1e-7);
      ellipsoid(b, C, ax, ay, az, 10, 6);
    }
    // 连接各小骨的韧带
    tube(b, chain, () => 0.0008 * L * k + 1e-7, 5, { capRings: 1 });
  }
  return b.build();
}

export function weberianAnchor(body: BodyModel) {
  return weberianChain(body, 1)[6].clone();
}

// ---------- 咽齿 (鲤科: 第五对角鳃骨特化为下咽骨, 上面长着臼齿状的咽齿, 与颅底的角质垫对磨) ----------
function pharynxBone(body: BodyModel, side: number) {
  // 沿最后一对鳃弓下半段, 稍靠后
  const arch = gillArchPath(body, 4, side, 14);
  return arch.slice(0, 9).map((p) => p.clone().add(new THREE.Vector3(0.012 * body.L, 0.004 * body.L, -side * 0.004 * body.L)));
}

export function buildPharyngealTeeth(body: BodyModel): GeomData {
  const k = body.spec.skeleton.pharyngeal;
  const b = new GeomBuilder();
  const L = body.L;
  for (const side of [1, -1]) {
    const bone = pharynxBone(body, side);
    tube(b, bone, (i) => (0.0026 - 0.0012 * (i / (bone.length - 1))) * L * k + 1e-7, 6, { capRings: 2 });
    // 主行 3 枚大臼齿, 外侧 1 + 1 枚小齿 (齿式 1.1.3)
    const teeth: [number, number, number][] = [
      [0.35, 0, 1],
      [0.55, 0, 1.1],
      [0.75, 0, 0.9],
      [0.5, 1, 0.55],
      [0.62, 2, 0.45],
    ];
    for (const [t, rowK, size] of teeth) {
      const f = t * (bone.length - 1);
      const i = Math.min(bone.length - 2, Math.floor(f));
      const C = bone[i].clone().lerp(bone[i + 1], f - i);
      // 齿冠朝向中线与背侧
      C.add(new THREE.Vector3(-0.002 * L * rowK, 0.002 * L, -side * (0.0025 + 0.002 * rowK) * L));
      const r = 0.0026 * L * size * k + 1e-7;
      ellipsoid(b, C, new THREE.Vector3(r * 1.25, 0, 0), new THREE.Vector3(0, r * 0.9, 0), new THREE.Vector3(0, 0, r), 10, 6);
    }
  }
  return b.build();
}

export function pharyngealAnchor(body: BodyModel) {
  const bone = pharynxBone(body, 1);
  return bone[5].clone();
}

// ---------- 皮须 (鮟鱇): 下颌边缘与头体两侧各一排短小的皮瓣, 大小不一 ----------
export const FRINGE_JAW = 12; // 每侧下颌边缘
export const FRINGE_BODY = 40; // 每侧头体两侧
export const FRINGE_MAX = (FRINGE_JAW + FRINGE_BODY) * 2;

/** 单片皮瓣: 基部在原点, 沿 +y 伸出, 长 1; 很扁, 基部窄, 往外变宽呈穗状, 末端裂成三四个不规则的尖. */
export function buildFringeUnit(): GeomData {
  const b = new GeomBuilder();
  const nt = 10;
  const na = 16;
  const P = new THREE.Vector3();
  const N = new THREE.Vector3();
  for (let i = 0; i <= nt; i++) {
    const t = i / nt;
    const r = lerp(0.06, 0.3, Math.pow(t, 0.7)) * (1 - 0.25 * Math.pow(t, 4));
    for (let k = 0; k <= na; k++) {
      const a = (k / na) * Math.PI * 2;
      const xh = Math.cos(a);
      // 沿宽度方向的深裂: 几个指状尖之间长度缩短
      const lobe = 0.5 + 0.5 * Math.cos(3.3 * Math.PI * xh + 0.6);
      const y = t * (1 - 0.4 * Math.pow(t, 3) * (1 - lobe));
      P.set(xh * r, y, Math.sin(a) * r * 0.16);
      N.set(xh, 0.1, Math.sin(a) / 0.16).normalize();
      b.add(P, N, k / na, t);
    }
  }
  const row = na + 1;
  for (let i = 0; i < nt; i++) for (let k = 0; k < na; k++) b.quad(i * row + k, (i + 1) * row + k, (i + 1) * row + k + 1, i * row + k + 1);
  return b.build();
}

/** 皮瓣实例. 下颌上的那几片随下颌开合 (jaw = 1). */
export function buildFringe(body: BodyModel): { data: InstanceData; jaw: Float32Array } {
  const fr = body.spec.extras.fringe;
  const m = body.spec.mouth;
  const L = body.L;
  const w = new InstanceWriter(FRINGE_MAX);
  const jaw = new Float32Array(FRINGE_MAX);
  const P = new THREE.Vector3();
  const N = new THREE.Vector3();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const nJ = clamp(Math.round(fr.jaw), 0, FRINGE_JAW);
  const nB = clamp(Math.round(fr.body), 0, FRINGE_BODY);
  let slot = 0;
  for (const side of [1, -1]) {
    for (let k = 0; k < FRINGE_JAW + FRINGE_BODY; k++) {
      const onJaw = k < FRINGE_JAW;
      jaw[slot] = onJaw ? 1 : 0;
      slot++;
      const idx = onJaw ? k : k - FRINGE_JAW;
      const n = onJaw ? nJ : nB;
      if (idx >= n || fr.len <= 0) {
        w.push(new THREE.Vector3(body.x(m.corner * 0.5), 0, 0), q.identity(), new THREE.Vector3(0, 0, 0));
        continue;
      }
      const t = n > 1 ? idx / (n - 1) : 0.5;
      let s: number;
      let th: number;
      if (onJaw) {
        // 下颌外缘: 口裂线稍下方, 从吻端到口角
        s = lerp(0.012, m.corner * 0.95, t);
        th = body.mouthTheta(s) - 0.14;
      } else {
        s = lerp(m.corner + 0.02, fr.s1, t);
        th = body.thetaAt(s, fr.h);
      }
      body.surface(s, th, 0.0015, P);
      body.surfaceNormal(s, th, 0, N);
      if (side < 0) {
        P.z = -P.z;
        N.z = -N.z;
      }
      // 从体表伸出, 向下垂, 向后倾; 下垂角与绕自身轴的扭转每片都不一样
      const r1 = hash1(slot * 7.13 + idx * 1.7);
      const r2 = hash1(slot * 3.91 + 11.3);
      const dir = N.clone().multiplyScalar(0.75).add(new THREE.Vector3(0.35, -0.55 - 0.35 * (r2 - 0.5), 0)).normalize();
      q.setFromUnitVectors(up, dir);
      q.premultiply(new THREE.Quaternion().setFromAxisAngle(dir, (hash1(slot * 5.77 + 2.1) - 0.5) * 1.05));
      // 下颌边缘的皮瓣比头体两侧的短
      const len = fr.len * L * (onJaw ? 0.55 : lerp(1, 0.45, t)) * (0.6 + 0.7 * r1);
      w.push(P.clone(), q.clone(), new THREE.Vector3(len, len, len));
    }
  }
  return { data: w.finish(), jaw };
}

// ---------- 喙状齿板 (河鲀): 上下颌的牙各自愈合成齿板, 中线处有一道缝, 共 4 块 ----------
/** 每块齿板沿唇线从中线扫到口的前六成半, 截面是楔形: 根部藏在唇下, 只有切缘伸出唇线, 朝向对侧的颌.
 *  闭口时上下切缘交叠成一道白色喙缘; 下颌两块随下颌开合. */
export function buildBeak(body: BodyModel): GeomData {
  const sp = body.spec;
  const m = sp.mouth;
  const k = sp.skeleton.beak;
  const L = body.L;
  const b = new GeomBuilder({ aJaw: 1 });
  const n = 14;
  const P = new THREE.Vector3();
  const N = new THREE.Vector3();
  const gap = 0.0006 * L * Math.min(1, k);
  for (const lower of [0, 1]) {
    const v = new THREE.Vector3(0, lower ? 1 : -1, 0);
    for (const side of [1, -1]) {
      const rings: THREE.Vector3[][] = [];
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        const s = lerp(0.0015, m.corner * 0.65, t);
        const th = body.mouthTheta(s);
        body.surface(s, th, 0, P);
        body.surfaceNormal(s, th, 0, N);
        const h = 0.0032 * L * k * (1 - 0.3 * t); // 切缘伸出唇线的高度
        const root = 0.004 * L * k;
        const thick = 0.0045 * L * k * (1 - 0.3 * t);
        // 外根 (藏在唇下), 内根, 内刃, 切缘 (略高出皮肤)
        const cs = [
          P.clone().addScaledVector(N, -0.001 * L * k).addScaledVector(v, -root),
          P.clone().addScaledVector(N, -thick).addScaledVector(v, -root),
          P.clone().addScaledVector(N, -thick * 0.45).addScaledVector(v, h * 0.75),
          P.clone().addScaledVector(N, 0.0005 * L * k).addScaledVector(v, h),
        ];
        for (const c of cs) {
          c.z *= side;
          // 中线缝: 左右两块在中线处留一道窄缝
          if (side * c.z < gap) c.z = side * gap;
        }
        rings.push(cs);
      }
      const start = b.count;
      // 四个侧面各用独立顶点, 棱角分明
      for (let f = 0; f < 4; f++) {
        const base = b.count;
        for (let i = 0; i < n; i++) {
          b.add(rings[i][f], N, f / 4, i / (n - 1), { aJaw: lower });
          b.add(rings[i][(f + 1) % 4], N, (f + 1) / 4, i / (n - 1), { aJaw: lower });
        }
        for (let i = 0; i < n - 1; i++) b.quad(base + i * 2, base + i * 2 + 1, base + (i + 1) * 2 + 1, base + (i + 1) * 2);
      }
      // 两端封口
      for (const i of [0, n - 1]) {
        const base = b.count;
        for (let f = 0; f < 4; f++) b.add(rings[i][f], N, 0, 0, { aJaw: lower });
        b.quad(base, base + 1, base + 2, base + 3);
      }
      void start;
    }
  }
  const g = b.build();
  recomputeNormals(g);
  return g;
}

// ---------- 滤食垫 (鲸鲨): 鳃弓内侧的海绵状筛板, 每侧 10 片, 在咽腔两侧连成一面暗墙 ----------
export const FILTER_PADS = 10; // 每侧

export function buildFilterPads(body: BodyModel): GeomData {
  const sp = body.spec;
  const k = sp.extras.filterPads;
  const g = sp.gill;
  const L = body.L;
  const b = new GeomBuilder();
  for (const side of [1, -1]) {
    for (let i = 0; i < FILTER_PADS; i++) {
      const s0 = lerp(g.arches[0], g.arches[1], i / FILTER_PADS);
      const s1 = lerp(g.arches[0], g.arches[1], (i + 1) / FILTER_PADS);
      const sm = (s0 + s1) / 2;
      const c = body.bodyPoint(sm, -0.06, 0.5 * side);
      const hh = 0.5 * (body.top(sm) + body.bottom(sm)) * 0.62 * L;
      // 每片略向后倾, 像百叶
      const ax = new THREE.Vector3(((s1 - s0) / 2) * 0.86 * L * k, 0, 0);
      const ay = new THREE.Vector3(0.12 * hh * k, hh * k, 0);
      const az = new THREE.Vector3(0, 0, 0.0035 * L * k);
      ellipsoid(b, c, ax, ay, az, 12, 10);
    }
  }
  return b.build();
}

export function filterPadAnchor(body: BodyModel) {
  const g = body.spec.gill;
  return body.bodyPoint((g.arches[0] + g.arches[1]) / 2, 0.1, 0.5);
}
