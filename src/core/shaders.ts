// GLSL 片段: 所有鱼体材质共享同一套变形 (物种插值 → 实例 → 局部动画 → 沿中轴弯曲),
// 所以皮肤, 骨骼, 器官, 鳍在游动时严格同步.

export const FISH_VERT_PARS = /* glsl */ `
uniform sampler2D uSpine;
uniform vec4 uSpineInfo;   // sMin, sMax, N, L
uniform float uMorph;
uniform float uTime;
uniform vec4 uJaw;         // 角度, 关节 x, 关节 y, 喉部下沉系数
uniform vec2 uJawFwd;      // 下颌前突 (世界单位), 口角 s
uniform float uOper;       // 鳃盖外张量 (世界单位)
uniform vec4 uPartPulse;   // 各组缩放
uniform vec3 uPulseC[4];   // 各组中心
uniform vec4 uWobble;      // 器官随呼吸轻微晃动: 幅度, 相位, -, -
#ifdef FISH_MORPH
attribute vec3 position2;
attribute vec3 normal2;
#endif
#ifdef FISH_INST
attribute vec3 iOffset;
attribute vec4 iQuat;
attribute vec3 iScale;
attribute vec3 iOffset2;
attribute vec4 iQuat2;
attribute vec3 iScale2;
#endif
#ifdef FISH_INSTJAW
attribute float iJaw;
#endif
#ifdef FISH_JAW
attribute float aJaw;
#endif
#ifdef FISH_OPER
attribute float aOper;
#endif
#ifdef FISH_FIN
attribute vec4 aFin;
uniform vec3 uFinBase;
uniform vec3 uFinAxis;
uniform vec4 uFinAnim;     // 角度, 柔性, 颤动幅度, 颤动相位
uniform float uFinWave;    // >0: 沿鳍基从前往后传的波数
varying vec4 vFin;
#endif
#ifdef FISH_PULSE
attribute float aPulse;
#endif
#ifdef FISH_SKIN
attribute vec4 aSkin;
varying vec4 vSkin;
varying vec2 vFishUv;
#endif
#ifdef FISH_EYE
attribute vec2 aEye;
varying vec2 vEye;
#endif
#ifdef FISH_FLOW
attribute float aFlow;
varying float vFlow;
#endif
varying vec3 vRest;
varying vec3 vFishPos;
varying vec3 vWorldPos;
varying vec3 vFishNormal;

vec3 fishQrot(vec4 q, vec3 v) { return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v); }
vec3 fishRotAxis(vec3 v, vec3 axis, float ang) {
  float c = cos(ang); float s = sin(ang);
  return v * c + cross(axis, v) * s + axis * dot(axis, v) * (1.0 - c);
}
vec4 fishSpine(float s) {
  float f = clamp((s - uSpineInfo.x) / (uSpineInfo.y - uSpineInfo.x), 0.0, 1.0) * (uSpineInfo.z - 1.0);
  float i0 = floor(f);
  int a = int(i0);
  int b = min(a + 1, int(uSpineInfo.z) - 1);
  return mix(texelFetch(uSpine, ivec2(a, 0), 0), texelFetch(uSpine, ivec2(b, 0), 0), f - i0);
}

void fishDeform(inout vec3 p, inout vec3 n) {
#ifdef FISH_MORPH
  p = mix(p, position2, uMorph);
  n = mix(n, normal2, uMorph);
  n = n / max(length(n), 1e-6);
#endif
#ifdef FISH_INST
  vec4 q2 = dot(iQuat, iQuat2) < 0.0 ? -iQuat2 : iQuat2;
  vec4 q = normalize(mix(iQuat, q2, uMorph) + vec4(0.0, 0.0, 0.0, 1e-6));
  vec3 sc = mix(iScale, iScale2, uMorph);
  vec3 off = mix(iOffset, iOffset2, uMorph);
  p = off + fishQrot(q, p * sc);
  n = fishQrot(q, n / max(abs(sc), vec3(1e-5)));
  n = n / max(length(n), 1e-6);
#endif
#ifdef FISH_PULSE
  {
    int g = int(aPulse + 0.5);
    vec3 c = uPulseC[g];
    float k = g == 0 ? uPartPulse.x : g == 1 ? uPartPulse.y : g == 2 ? uPartPulse.z : uPartPulse.w;
    p = c + (p - c) * k;
  }
#endif
#ifdef FISH_FIN
  {
    float side = aFin.z;
    vec3 base = uFinBase;
    vec3 ax = uFinAxis;
    float ang = uFinAnim.x * (1.0 + uFinAnim.y * aFin.y * aFin.y);
    if (side < 0.0) { base.z = -base.z; ax.z = -ax.z; ang = -ang; }
    p = base + fishRotAxis(p - base, ax, ang);
    n = fishRotAxis(n, ax, ang);
    float ph = uFinWave > 0.0 ? uFinAnim.w - 6.2831 * uFinWave * aFin.x - aFin.y * 1.5 : uFinAnim.w - aFin.y * 5.0 + aFin.x * 4.0;
    float fl = uFinAnim.z * aFin.y * aFin.y * sin(ph);
    p.z += fl * (side < 0.0 ? -1.0 : 1.0);
    vFin = aFin;
  }
#endif
  float jw = 0.0;
#ifdef FISH_JAW
  jw = aJaw;
#endif
#ifdef FISH_INSTJAW
  jw = iJaw;
#endif
#if defined(FISH_JAW) || defined(FISH_INSTJAW)
  if (jw > 0.0) {
    // 下颌前突: 下颌前端的顶点向前推, 越靠吻端推得越多, 到口角为 0
    float sj = p.x / uSpineInfo.w + 0.5;
    p.x -= uJawFwd.x * jw * (1.0 - smoothstep(0.0, max(uJawFwd.y, 1e-3), sj));
    vec2 d = p.xy - uJaw.yz;
    float L0 = uSpineInfo.w;
    float front = 1.0 - smoothstep(-0.012 * L0, 0.012 * L0, d.x);
    float a = uJaw.x * jw * front;
    float c = cos(a); float s = sin(a);
    p.xy = uJaw.yz + vec2(c * d.x - s * d.y, s * d.x + c * d.y);
    n.xy = vec2(c * n.x - s * n.y, s * n.x + c * n.y);
    p.y -= uJaw.w * jw * (1.0 - front) * uJaw.x * L0;
  }
#endif
#ifdef FISH_OPER
  p.z += uOper * aOper;
#endif
  vRest = p;
  float L = uSpineInfo.w;
  float s = p.x / L + 0.5;
  vec4 sp = fishSpine(s);
  float scl = clamp(s, uSpineInfo.x, uSpineInfo.y);
  float extra = (s - scl) * L;
  float ct = cos(sp.z); float st = sin(sp.z);
  vec2 xz = sp.xy + vec2(ct, st) * extra + vec2(-st, ct) * p.z;
  p = vec3(xz.x, p.y, xz.y);
  n = vec3(n.x * ct - n.z * st, n.y, n.x * st + n.z * ct);
  vFishPos = p;
  vFishNormal = n;
#ifdef FISH_SKIN
  vSkin = aSkin;
  vFishUv = uv;
#endif
#ifdef FISH_EYE
  vEye = aEye;
#endif
#ifdef FISH_FLOW
  vFlow = aFlow;
#endif
}
`;

export const FISH_FRAG_PARS = /* glsl */ `
uniform vec4 uClip;         // 鱼体空间剖切平面 (n, d), 保留 dot(p,n)+d <= 0 的一侧
uniform float uClipOn;
uniform float uDissolve;
uniform vec3 uDissolveColor;
uniform vec3 uHighlight;
uniform float uTime;
uniform float uCaustics;
uniform vec3 uCausticColor;
uniform vec4 uWindow;       // 解剖开窗: s0, s1, v0 (世界 y 下限), v1 (上限)
uniform float uWindowOn;
uniform float uWindowSideZ; // 开窗侧 (+1 左侧)
uniform float uHalfCut;     // 剖去左半 (颅骨, 鳃盖), 露出脑与鳃
varying vec3 vRest;
varying vec3 vFishPos;
varying vec3 vWorldPos;
varying vec3 vFishNormal;
#ifdef FISH_FIN
varying vec4 vFin;
#endif
#ifdef FISH_EYE
varying vec2 vEye;
#endif
#ifdef FISH_FLOW
varying float vFlow;
#endif
#ifdef FISH_SKIN
varying vec4 vSkin;
varying vec2 vFishUv;
#endif
float fishEdgeGlow = 0.0;
// 允许 a > b 的 smoothstep (GLSL 规范里 a >= b 未定义)
float ss(float a, float b, float x) { return a < b ? smoothstep(a, b, x) : 1.0 - smoothstep(b, a, x); }

float fishHash(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float fishNoise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(fishHash(i + vec3(0, 0, 0)), fishHash(i + vec3(1, 0, 0)), f.x),
                 mix(fishHash(i + vec3(0, 1, 0)), fishHash(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(fishHash(i + vec3(0, 0, 1)), fishHash(i + vec3(1, 0, 1)), f.x),
                 mix(fishHash(i + vec3(0, 1, 1)), fishHash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
float fishFbm(vec3 p) {
  float a = 0.5; float s = 0.0;
  for (int i = 0; i < 4; i++) { s += a * fishNoise(p); p = p * 2.03 + vec3(1.7, 9.2, 3.1); a *= 0.5; }
  return s;
}

void fishClipDissolve() {
  if (uClipOn > 0.5 && dot(vFishPos, uClip.xyz) + uClip.w > 0.0) discard;
  if (uHalfCut > 0.001 && vRest.z > mix(0.5, 0.0, uHalfCut) * 0.5) discard;
#ifdef FISH_SKIN
  // 解剖开窗: 在一侧体壁上切掉一块圆角窗口 (x0, x1, h0, h1)
  if (uWindowOn > 0.001 && vRest.z * uWindowSideZ > 0.0) {
    vec2 c = vec2((uWindow.x + uWindow.y) * 0.5, (uWindow.z + uWindow.w) * 0.5);
    vec2 a = vec2((uWindow.y - uWindow.x) * 0.5, (uWindow.w - uWindow.z) * 0.5) * uWindowOn;
    vec2 d = (vec2(vRest.x, vSkin.x) - c) / max(a, vec2(1e-4));
    float r = pow(pow(abs(d.x), 4.0) + pow(abs(d.y), 4.0), 0.25);
    if (r < 1.0) discard;
    fishEdgeGlow = max(fishEdgeGlow, (1.0 - smoothstep(1.0, 1.04, r)) * 0.25);
  }
#endif
  if (uDissolve > 0.001) {
    float nz = fishNoise(vRest * 7.0) * 0.65 + fishNoise(vRest * 21.0) * 0.35;
    float th = uDissolve * 1.15 - 0.08;
    if (nz < th) discard;
    fishEdgeGlow = (1.0 - smoothstep(0.0, 0.05, nz - th)) * step(0.002, uDissolve) * (1.0 - step(0.999, uDissolve));
  }
}

// 自写的焦散: 两层动态 Voronoi 的 F2-F1 网纹相乘
vec2 fishH2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453);
}
float fishVoro(vec2 p, float t) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float d1 = 8.0; float d2 = 8.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y));
    vec2 o = fishH2(i + g);
    o = 0.5 + 0.45 * sin(t + 6.2831 * o);
    vec2 r = g + o - f;
    float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) { d2 = d; }
  }
  return sqrt(d2) - sqrt(d1);
}
float fishCaustic(vec2 p, float t) {
  float a = fishVoro(p * 1.0 + vec2(t * 0.05, t * 0.03), t * 0.9);
  float b = fishVoro(p * 1.7 + vec2(-t * 0.04, t * 0.06) + 3.1, t * 1.1 + 2.0);
  float c = (1.0 - smoothstep(0.0, 0.16, a)) * 0.7 + (1.0 - smoothstep(0.0, 0.12, b)) * 0.5;
  return c * c;
}
`;

// 皮肤花纹与鳞片
export const SKIN_FRAG_PARS = /* glsl */ `
uniform vec3 uSkDorsal;
uniform vec3 uSkFlank;
uniform vec3 uSkVentral;
uniform vec4 uSkEdges;      // dorsalEdge, ventralEdge, softness, silver
uniform vec3 uSkHead;
uniform vec4 uSkHeadMix;    // mix, 头部结束 s, -, -
uniform vec4 uSkMat;        // iridescence, roughness, scaleSize(世界), scaleDepth
uniform vec3 uSkSpot;
uniform vec4 uSkSpotP;      // size(世界), density, shape, -
uniform vec4 uSkSpotR;      // hMin, hMax, s0, s1
uniform vec3 uSkBar;
uniform vec4 uSkBarP;       // count, width, strength, -
uniform vec4 uSkBarR;       // hMin, hMax, s0, s1
uniform vec3 uSkMottleC;
uniform vec4 uSkMottle;     // amount, scale(世界), lateralLine, denticles
uniform vec3 uSkGlow;
uniform vec4 uSkGlowP;      // strength, -, -, -
uniform vec3 uSkInterior;
uniform vec3 uSkMouth;
uniform vec4 uSkGill;       // 鳃盖后缘 s 的 (a0, a1, a2) 近似 + 鳃裂数
uniform vec4 uSkGillR;      // top, bottom, slitS0, slitS1
uniform vec4 uSkLat;        // 侧线高度 (s 的二次多项式) a0,a1,a2 + L
uniform vec4 uSkEye;        // 眼 s, h, r(分数), 前鳃盖沟强度
uniform vec3 uSkEyeP;       // 左眼在体表的位置 (静息坐标), 眼眶暗环按三维距离画, 眼长在头顶也不会抹开
uniform vec3 uSkNar1;       // 两个鼻孔 (静息坐标, 左侧)
uniform vec3 uSkNar2;
uniform float uSkMouthS;    // 口角 s: 从口裂看进去的口腔内壁范围
uniform vec4 uSkRidge;      // 体侧纵棱: 棱高 (世界单位), 棱宽 (h), s0, s1
uniform vec4 uSkRidgeH;     // 最上一条 h, 最下一条 h, 条数, 尾柄侧脊加高倍数
uniform float uSkSEnd;
uniform vec3 uSkBlotch;
uniform vec3 uSkBlotchRing;
uniform vec4 uSkBlotchP;    // 大斑中心 s, h, 半径(分数), 当地半高(分数)
uniform vec4 uSkBlotchQ;    // 强度, 外环强度, -, -
uniform vec3 uSkStripe;
uniform vec4 uSkStripeP;    // 条数, 线宽 (h), 强度, -
uniform vec4 uSkStripeR;    // 最上一条 h, 最下一条 h, s0, s1
uniform vec3 uSkBlotch2;
uniform vec3 uSkBlotch2Ring;
uniform vec4 uSkBlotch2P;
uniform vec4 uSkBlotch2Q;
float gSkBlot = 0.0;        // 本片元落在大斑内的程度, 供光照阶段压低黏液反光

float skinSmooth(float a, float b, float x) { return smoothstep(a, b, x); }

// 覆瓦状圆鳞: 交错格点上的圆盘, 前一片鳞压住后一片 (取圆心最靠前者可见).
// 返回 (高度, 后缘暗线, 随机 a, 随机 b); 随机值用于每片鳞的微小倾角, 形成银鱼特有的镜面马赛克.
vec4 skinScales(vec2 q) {
  const float DY = 0.5;
  const float R = 0.66;
  float bestX = 1e9;
  float bestD = 0.0;
  vec2 bestRel = vec2(0.0);
  vec2 bestId = vec2(0.0);
  float r0 = floor(q.y / DY);
  for (int j = -2; j <= 2; j++) {
    float row = r0 + float(j);
    float off = mod(row, 2.0) * 0.5;
    float cx0 = floor(q.x - off);
    for (int i = -1; i <= 1; i++) {
      vec2 c = vec2(cx0 + float(i) + off, row * DY);
      vec2 rel = q - c;
      float d = length(rel * vec2(1.0, 1.12));
      if (d < R && c.x < bestX) { bestX = c.x; bestD = d; bestRel = rel; bestId = vec2(cx0 + float(i), row); }
    }
  }
  if (bestX > 1e8) return vec4(0.0, 0.0, 0.5, 0.5);
  // 外露后区向后缘微微抬起
  float post = smoothstep(-0.2, 0.5, bestRel.x);
  float h = smoothstep(0.1, R, bestD) * post;
  float edge = smoothstep(R - 0.09, R - 0.015, bestD) * post;
  vec2 hid = fishH2(bestId * vec2(1.0, 7.13) + 3.7);
  return vec4(h, edge, hid);
}

float skinSpotField(vec2 q, float shape) {
  vec2 i = floor(q);
  vec2 f = fract(q);
  float best = 0.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y));
    vec2 o = fishH2(i + g);
    float keep = step(1.0 - uSkSpotP.y, fishH2(i + g + 17.0).x);
    vec2 r = g + o - f;
    float v;
    if (shape < 0.5) v = 1.0 - smoothstep(0.12, 0.2, length(r));
    else if (shape < 1.5) {
      vec2 a = abs(vec2(r.x + r.y, r.x - r.y)) * 0.7071;
      float bar = min(a.x, a.y);
      v = (1.0 - smoothstep(0.035, 0.06, bar)) * (1.0 - smoothstep(0.16, 0.24, length(r)));
    } else {
      v = 1.0 - smoothstep(0.1, 0.35, length(r) + (fishNoise(vec3(q * 3.0, 1.0)) - 0.5) * 0.35);
    }
    best = max(best, v * keep);
  }
  return best;
}

// 单个大斑: P = (s, h, 半径, 当地半高), Q = (强度, 外环强度). 返回该片元落在斑与外环里的程度
float skinBlotch(inout vec3 col, float s, float h, vec3 c, vec3 ringC, vec4 P, vec4 Q) {
  if (Q.x <= 0.0) return 0.0;
  vec2 d = vec2(s - P.x, (h - P.y) * P.w);
  float r = length(d) / max(P.z, 1e-4) + (fishNoise(vRest * 14.0) - 0.5) * 0.16;
  float ring = (1.0 - smoothstep(0.03, 0.1, abs(r - 1.08))) * Q.y * Q.x;
  float core = (1.0 - smoothstep(0.86, 1.0, r)) * Q.x;
  col = mix(col, ringC, ring);
  col = mix(col, c, core);
  return max(core, ring);
}

vec3 skinColor(out float rough, out float metal, out float irid, out float scaleH, out vec3 glow) {
  float s = vFishUv.x * uSkSEnd;
  float h = vSkin.x;
  float soft = uSkEdges.z;
  vec3 col = mix(uSkVentral, uSkFlank, skinSmooth(uSkEdges.y - soft, uSkEdges.y + soft, h));
  // 背部颜色: 在侧面用噪声扰动过渡线, 更像真实的斑驳边界
  float nz = fishNoise(vRest * 6.0) - 0.5;
  col = mix(col, uSkDorsal, skinSmooth(uSkEdges.x - soft, uSkEdges.x + soft, h + nz * soft * 0.9));
  // 头部叠色 (如红鲑婚姻色的绿头)
  col = mix(col, uSkHead, uSkHeadMix.x * (1.0 - skinSmooth(uSkHeadMix.y - 0.03, uSkHeadMix.y + 0.02, s)) * skinSmooth(-0.6, 0.2, h));
  // 云斑
  float mot = fishFbm(vRest / max(uSkMottle.y, 1e-3));
  col = mix(col, uSkMottleC, uSkMottle.x * smoothstep(0.45, 0.75, mot) * ss(uSkEdges.y, uSkEdges.x + 0.1, h));
  // 横带
  if (uSkBarP.z > 0.0) {
    float t = (s - uSkBarR.z) / max(uSkBarR.w - uSkBarR.z, 1e-3);
    float wv = t * uSkBarP.x + (fishNoise(vRest * 4.0) - 0.5) * 0.4;
    float bar = 1.0 - smoothstep(uSkBarP.y * 0.5 - 0.08, uSkBarP.y * 0.5 + 0.08, abs(fract(wv) - 0.5));
    float inR = step(0.0, t) * step(t, 1.0) * skinSmooth(uSkBarR.x - 0.1, uSkBarR.x + 0.1, h) * (1.0 - skinSmooth(uSkBarR.y - 0.1, uSkBarR.y + 0.1, h));
    col = mix(col, uSkBar, bar * inR * uSkBarP.z);
  }
  // 纵纹
  if (uSkStripeP.z > 0.0 && uSkStripeP.x > 0.5) {
    float n = uSkStripeP.x;
    float span = uSkStripeR.x - uSkStripeR.y;
    float t = (h - uSkStripeR.y) / (abs(span) > 1e-3 ? span : 1e-3);
    float k = t * max(n - 1.0, 0.0);
    float d = n > 1.5 ? abs(k - floor(k + 0.5)) * abs(span) / (n - 1.0) : abs(h - uSkStripeR.x);
    d += (fishNoise(vRest * 7.0) - 0.5) * uSkStripeP.y * 0.6;
    float line = 1.0 - smoothstep(uSkStripeP.y * 0.5, uSkStripeP.y * 0.5 + 0.012, d);
    float inT = n > 1.5 ? step(-0.03, t) * step(t, 1.03) : 1.0;
    float inS = smoothstep(uSkStripeR.z, uSkStripeR.z + 0.03, s) * (1.0 - smoothstep(uSkStripeR.w - 0.03, uSkStripeR.w, s));
    col = mix(col, uSkStripe, line * inT * inS * uSkStripeP.z);
  }
  // 斑点
  if (uSkSpotP.y > 0.0) {
    // 体轴方向用 x, 环向用弧长 (与鳞片一致), 头顶这类水平面上的斑点不会被拉成条; 左右两侧弧长不同, 花纹自然不对称
    vec2 q = vec2(vRest.x, vSkin.z) / max(uSkSpotP.x * 3.0, 1e-3);
    float sp = skinSpotField(q, uSkSpotP.z);
    float inR = skinSmooth(uSkSpotR.x - 0.1, uSkSpotR.x + 0.1, h) * (1.0 - skinSmooth(uSkSpotR.y - 0.05, uSkSpotR.y + 0.05, h))
      * skinSmooth(uSkSpotR.z - 0.02, uSkSpotR.z + 0.02, s) * (1.0 - skinSmooth(uSkSpotR.w - 0.02, uSkSpotR.w + 0.02, s));
    col = mix(col, uSkSpot, sp * inR);
  }
  // 大斑 (如暗纹东方鲀胸鳍后方与背鳍基部的黑斑). 斑内没有银色反光
  float blot = max(skinBlotch(col, s, h, uSkBlotch, uSkBlotchRing, uSkBlotchP, uSkBlotchQ), skinBlotch(col, s, h, uSkBlotch2, uSkBlotch2Ring, uSkBlotch2P, uSkBlotch2Q));
  gSkBlot = blot;
  // 鳞片
  scaleH = 0.0;
  float edgeDark = 0.0;
  if (uSkMat.z > 0.0) {
    // x 方向用体轴坐标, 环向用弧长, 鳞片在体表各处大小一致
    vec2 q = vec2(vRest.x, vSkin.z) / uSkMat.z;
    vec4 sc = skinScales(q);
    float headMask = skinSmooth(uSkEye.x + 0.09, uSkEye.x + 0.16, s);
    scaleH = sc.x * headMask;
    edgeDark = sc.y * headMask;
    // 每片鳞的亮度微差 + 后缘细线, 背部更明显
    float dorsalBoost = 0.6 + 0.8 * ss(-0.2, 0.6, h);
    col *= 1.0 - edgeDark * 0.07 * uSkMat.w * dorsalBoost;
    col *= 1.0 + (sc.z - 0.5) * 0.04 * headMask;
  }
  // 侧线: 一串孔
  float latH = uSkLat.x + uSkLat.y * s + uSkLat.z * s * s;
  float dl = abs(h - latH);
  float pores = 0.5 + 0.5 * sin(vRest.x / max(uSkMat.z, 0.004) * 3.14159);
  float lat = (1.0 - smoothstep(0.004, 0.018, dl)) * skinSmooth(0.2, 0.26, s) * (1.0 - skinSmooth(0.97, 1.0, s));
  col = mix(col, col * 0.55, lat * uSkMottle.z * (0.6 + 0.4 * pores));
  // 鳃盖后缘 / 鳃裂
  float gillDark = 0.0;
  if (uSkGill.w < 0.5) {
    float se = uSkGill.x + uSkGill.y * h + uSkGill.z * h * h;
    float inH = skinSmooth(uSkGillR.y, uSkGillR.y + 0.08, h) * (1.0 - skinSmooth(uSkGillR.x - 0.08, uSkGillR.x, h));
    float line = 1.0 - smoothstep(0.0, 0.0045, abs(s - se));
    float flap = smoothstep(0.0, 0.03, se - s) * (1.0 - smoothstep(0.03, 0.09, se - s));
    gillDark = line * inH;
    col *= 1.0 - flap * inH * 0.06;
  } else {
    float n = uSkGill.w;
    float t = (s - uSkGillR.z) / max(uSkGillR.w - uSkGillR.z, 1e-3);
    float k = t * (n - 1.0);
    float fr = abs(k - floor(k + 0.5));
    float inT = step(-0.02, t) * step(t, 1.02);
    float inH = skinSmooth(uSkGillR.y, uSkGillR.y + 0.1, h) * (1.0 - skinSmooth(uSkGillR.x - 0.1, uSkGillR.x, h));
    gillDark = (1.0 - smoothstep(0.02, 0.06, fr * (uSkGillR.w - uSkGillR.z) / max(n - 1.0, 1.0) * 60.0)) * inT * inH;
  }
  col = mix(col, vec3(0.12, 0.03, 0.035), gillDark * 0.85);
  // 头部细节: 眼眶暗环, 鼻孔, 前鳃盖沟, 上颌骨轮廓
  {
    float Lw = uSkLat.w;
    vec3 pm = vec3(vRest.xy, abs(vRest.z));
    float er = uSkEye.z * Lw;
    float de = length(pm - uSkEyeP) / max(er, 1e-4);
    col *= 1.0 - 0.35 * (1.0 - smoothstep(1.0, 1.6, de)) * smoothstep(0.9, 1.05, de);
    // 鼻孔大小随眼径, 但有上限: 大眼的鱼 (带鱼) 鼻孔不会变成两团黑斑
    float nr = max(min(er, 0.005 * Lw), 1e-4);
    float nar = (1.0 - smoothstep(0.18, 0.3, length(pm - uSkNar1) / nr)) + (1.0 - smoothstep(0.14, 0.24, length(pm - uSkNar2) / nr));
    col *= 1.0 - 0.7 * clamp(nar, 0.0, 1.0) * step(uSkGill.w, 0.5);
    if (uSkGill.w < 0.5) {
      float se = uSkGill.x + uSkGill.y * h + uSkGill.z * h * h;
      float pre = se - 0.034 - 0.012 * (1.0 - h);
      float groove = (1.0 - smoothstep(0.0, 0.0035, abs(s - pre))) * ss(0.35, 0.15, h) * ss(-0.9, -0.7, h);
      float bottomArm = (1.0 - smoothstep(0.0, 0.03, abs(h + 0.72))) * step(pre - 0.05, s) * step(s, pre);
      col *= 1.0 - 0.18 * max(groove, bottomArm * 0.7) * uSkEye.w;
    }
  }
  // 盾鳞的细密纹理
  float den = uSkMottle.w * (fishNoise(vRest * 420.0) * 0.5 + fishNoise(vRest * 160.0) * 0.5);
  col *= 1.0 - den * 0.18;

  float flank = (1.0 - ss(uSkEdges.x - 0.05, uSkEdges.x + 0.2, h)) * ss(uSkEdges.y - 0.35, uSkEdges.y + 0.15, h);
  float silverMask = uSkEdges.w * flank;
  metal = clamp(silverMask * (0.62 + 0.3 * scaleH), 0.0, 1.0);
  rough = clamp(uSkMat.y * (1.0 - 0.35 * silverMask) + edgeDark * 0.1 + den * 0.3, 0.06, 1.0);
  irid = uSkMat.x * uSkEdges.w * ss(uSkEdges.y - 0.3, uSkEdges.x + 0.3, h) * (1.0 - ss(uSkEdges.x + 0.2, uSkEdges.x + 0.5, h));
  metal *= 1.0 - blot;
  irid *= 1.0 - blot;
  glow = uSkGlow * uSkGlowP.x;
  return col;
}

// 可在任意 (位置) 求值的鳞片高度, 用于凹凸
float skinBumpHeight(float rx, float arc, float s) {
  if (uSkMat.z <= 0.0) return 0.0;
  vec2 q = vec2(rx, arc) / uSkMat.z;
  return skinScales(q).x * skinSmooth(uSkEye.x + 0.09, uSkEye.x + 0.16, s);
}
// 体侧纵棱 (世界单位高度). 最下面一条在尾柄处向体侧中线收拢并加高, 成为尾柄侧脊
float skinRidge(float h, float s) {
  if (uSkRidge.x <= 0.0) return 0.0;
  float n = uSkRidgeH.z;
  float r = 0.0;
  for (int i = 0; i < 3; i++) {
    if (float(i) > n - 0.5) break;
    float last = step(n - 1.5, float(i));
    float hr = n > 1.5 ? mix(uSkRidgeH.x, uSkRidgeH.y, float(i) / (n - 1.0)) : uSkRidgeH.x;
    float keel = last * step(0.001, uSkRidgeH.w);
    hr = mix(hr, 0.0, keel * smoothstep(0.72, 0.92, s));
    float s1 = mix(uSkRidge.w, 0.995, keel);
    float env = smoothstep(uSkRidge.z, uSkRidge.z + 0.06, s) * (1.0 - smoothstep(s1 - 0.05, s1, s));
    float amp = 1.0 + keel * uSkRidgeH.w * smoothstep(0.8, 0.93, s);
    float d = (h - hr) / max(uSkRidge.y, 1e-3);
    r += exp(-d * d) * env * amp;
  }
  return r * uSkRidge.x;
}
vec2 skinScaleJitter(float rx, float arc) {
  if (uSkMat.z <= 0.0) return vec2(0.0);
  vec4 sc = skinScales(vec2(rx, arc) / uSkMat.z);
  return sc.zw - 0.5;
}

vec3 fishPerturbNormal(vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection) {
  vec3 vSigmaX = normalize(dFdx(surf_pos.xyz));
  vec3 vSigmaY = normalize(dFdy(surf_pos.xyz));
  vec3 vN = surf_norm;
  vec3 R1 = cross(vSigmaY, vN);
  vec3 R2 = cross(vN, vSigmaX);
  float fDet = dot(vSigmaX, R1) * faceDirection;
  vec3 vGrad = sign(fDet) * (dHdxy.x * R1 + dHdxy.y * R2);
  return normalize(abs(fDet) * surf_norm - vGrad);
}
`;
