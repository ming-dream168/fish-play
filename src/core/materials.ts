// 材质工厂: 在 three 内置 PBR 材质上注入鱼体变形与程序化着色.

import * as THREE from 'three';
import { FISH_FRAG_PARS, FISH_VERT_PARS, SKIN_FRAG_PARS } from './shaders';

export type U<T> = { value: T };

export interface FishShared {
  uSpine: U<THREE.DataTexture>;
  uSpineInfo: U<THREE.Vector4>;
  uMorph: U<number>;
  uTime: U<number>;
  uJaw: U<THREE.Vector4>;
  uJawFwd: U<THREE.Vector2>; // 下颌前突 (世界单位), 口角 s
  uOper: U<number>;
  uClip: U<THREE.Vector4>;
  uClipOn: U<number>;
  uCaustics: U<number>;
  uCausticColor: U<THREE.Color>;
  uSunDir: U<THREE.Vector3>;
  uSunColor: U<THREE.Color>;
  uWindow: U<THREE.Vector4>;
  uWindowOn: U<number>;
  uWindowSideZ: U<number>;
}

export const SPINE_N = 192;

export function createShared(): FishShared {
  const data = new Float32Array(SPINE_N * 4);
  const tex = new THREE.DataTexture(data, SPINE_N, 1, THREE.RGBAFormat, THREE.FloatType);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  return {
    uSpine: { value: tex },
    uSpineInfo: { value: new THREE.Vector4(-0.3, 1.5, SPINE_N, 4) },
    uMorph: { value: 0 },
    uTime: { value: 0 },
    uJaw: { value: new THREE.Vector4(0, 0, 0, 0.04) },
    uJawFwd: { value: new THREE.Vector2(0, 0.07) },
    uOper: { value: 0 },
    uClip: { value: new THREE.Vector4(1, 0, 0, -100) },
    uClipOn: { value: 0 },
    uCaustics: { value: 1 },
    uCausticColor: { value: new THREE.Color('#bfe9ff') },
    uSunDir: { value: new THREE.Vector3(0.25, 1, 0.35).normalize() },
    uSunColor: { value: new THREE.Color('#fff4e0') },
    uWindow: { value: new THREE.Vector4(0, 0, 0, 0) },
    uWindowOn: { value: 0 },
    uWindowSideZ: { value: 1 },
  };
}

export interface PartFlags {
  morph?: boolean;
  inst?: boolean;
  instJaw?: boolean;
  jaw?: boolean;
  oper?: boolean;
  fin?: boolean;
  pulse?: boolean;
  skin?: boolean;
  eye?: boolean;
  flow?: boolean;
}

export interface PartLocal {
  uDissolve: U<number>;
  uDissolveColor: U<THREE.Color>;
  uHighlight: U<THREE.Color>;
  uPartPulse: U<THREE.Vector4>;
  uPulseC: U<THREE.Vector3[]>;
  uWobble: U<THREE.Vector4>;
  uFinBase: U<THREE.Vector3>;
  uFinAxis: U<THREE.Vector3>;
  uFinAnim: U<THREE.Vector4>;
  uHalfCut: U<number>;
  [k: string]: U<unknown>;
}

export function createLocal(extra: Record<string, U<unknown>> = {}): PartLocal {
  return {
    uDissolve: { value: 0 },
    uDissolveColor: { value: new THREE.Color('#ff9a5c') },
    uHighlight: { value: new THREE.Color(0, 0, 0) },
    uPartPulse: { value: new THREE.Vector4(1, 1, 1, 1) },
    uPulseC: { value: [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()] },
    uWobble: { value: new THREE.Vector4() },
    uFinBase: { value: new THREE.Vector3() },
    uFinAxis: { value: new THREE.Vector3(1, 0, 0) },
    uFinAnim: { value: new THREE.Vector4() },
    uHalfCut: { value: 0 },
    uFinWave: { value: 0 },
    ...extra,
  };
}

export function flagDefines(f: PartFlags): Record<string, string> {
  const d: Record<string, string> = {};
  if (f.morph) d.FISH_MORPH = '';
  if (f.inst) d.FISH_INST = '';
  if (f.instJaw) d.FISH_INSTJAW = '';
  if (f.jaw) d.FISH_JAW = '';
  if (f.oper) d.FISH_OPER = '';
  if (f.fin) d.FISH_FIN = '';
  if (f.pulse) d.FISH_PULSE = '';
  if (f.skin) d.FISH_SKIN = '';
  if (f.eye) d.FISH_EYE = '';
  if (f.flow) d.FISH_FLOW = '';
  return d;
}

export interface Hooks {
  key: string; // 着色变体名, 用于程序缓存
  fragPars?: string;
  color?: string; // 在 color_fragment 之后
  rough?: string;
  metal?: string;
  normal?: string;
  emissive?: string;
  physical?: string; // lights_physical_fragment 之后
  final?: string; // opaque_fragment 之前 (可改 outgoingLight / diffuseColor.a)
  caustics?: boolean;
  skinPars?: boolean;
}

/** 给内置材质注入鱼体变形, 剖切, 溶解, 焦散与自定义着色片段. */
export function patchFish<T extends THREE.Material>(mat: T, shared: FishShared, flags: PartFlags, local: PartLocal, hooks: Hooks): T {
  mat.defines = { ...(mat.defines ?? {}), ...flagDefines(flags) };
  (mat as THREE.Material & { userData: Record<string, unknown> }).userData.local = local;
  const flagKey = Object.keys(flagDefines(flags)).sort().join(',');
  mat.customProgramCacheKey = () => `fish|${hooks.key}|${flagKey}`;
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, shared, local);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>\n${FISH_VERT_PARS}`)
      .replace(
        '#include <beginnormal_vertex>',
        `vec3 objectNormal = vec3( normal );\n#ifdef USE_TANGENT\nvec3 objectTangent = vec3( tangent.xyz );\n#endif\nvec3 fishP = position;\nfishDeform(fishP, objectNormal);`,
      )
      .replace('#include <begin_vertex>', `vec3 transformed = fishP;\nvWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;`);
    let fs = sh.fragmentShader
      .replace('#include <common>', `#include <common>\n${FISH_FRAG_PARS}\n${hooks.skinPars ? SKIN_FRAG_PARS : ''}\n${hooks.fragPars ?? ''}`)
      .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>\nfishClipDissolve();`);
    if (hooks.color) fs = fs.replace('#include <color_fragment>', `#include <color_fragment>\n${hooks.color}`);
    if (hooks.rough) fs = fs.replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>\n${hooks.rough}`);
    if (hooks.metal) fs = fs.replace('#include <metalnessmap_fragment>', `#include <metalnessmap_fragment>\n${hooks.metal}`);
    if (hooks.normal) fs = fs.replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>\n${hooks.normal}`);
    fs = fs.replace(
      '#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>\ntotalEmissiveRadiance += uHighlight + fishEdgeGlow * uDissolveColor * 2.5;\n${hooks.emissive ?? ''}`,
    );
    if (hooks.physical) fs = fs.replace('#include <lights_physical_fragment>', `#include <lights_physical_fragment>\n${hooks.physical}`);
    if (hooks.caustics !== false) {
      fs = fs.replace(
        '#include <lights_fragment_end>',
        `#include <lights_fragment_end>
        {
          vec3 nW = inverseTransformDirection( normal, viewMatrix );
          float upF = clamp(nW.y * 0.8 + 0.2, 0.0, 1.0);
          float cst = fishCaustic(vWorldPos.xz * 1.15 + vWorldPos.y * 0.25, uTime * 0.9) * upF * uCaustics;
          reflectedLight.directDiffuse += diffuseColor.rgb * uCausticColor * cst * 0.9;
        }`,
      );
    }
    if (hooks.final) fs = fs.replace('#include <opaque_fragment>', `${hooks.final}\n#include <opaque_fragment>`);
    sh.fragmentShader = fs;
  };
  return mat;
}

// ---------- 具体材质 ----------

export function skinLocalUniforms() {
  return {
    uSkDorsal: { value: new THREE.Color() },
    uSkFlank: { value: new THREE.Color() },
    uSkVentral: { value: new THREE.Color() },
    uSkEdges: { value: new THREE.Vector4() },
    uSkHead: { value: new THREE.Color() },
    uSkHeadMix: { value: new THREE.Vector4() },
    uSkMat: { value: new THREE.Vector4() },
    uSkSpot: { value: new THREE.Color() },
    uSkSpotP: { value: new THREE.Vector4() },
    uSkSpotR: { value: new THREE.Vector4() },
    uSkBar: { value: new THREE.Color() },
    uSkBarP: { value: new THREE.Vector4() },
    uSkBarR: { value: new THREE.Vector4() },
    uSkMottleC: { value: new THREE.Color() },
    uSkMottle: { value: new THREE.Vector4() },
    uSkGlow: { value: new THREE.Color() },
    uSkGlowP: { value: new THREE.Vector4() },
    uSkInterior: { value: new THREE.Color() },
    uSkMouth: { value: new THREE.Color() },
    uSkGill: { value: new THREE.Vector4() },
    uSkGillR: { value: new THREE.Vector4() },
    uSkLat: { value: new THREE.Vector4() },
    uSkEye: { value: new THREE.Vector4() },
    uSkEyeP: { value: new THREE.Vector3() },
    uSkNar1: { value: new THREE.Vector3() },
    uSkNar2: { value: new THREE.Vector3() },
    uSkMouthS: { value: 0.07 },
    uSkRidge: { value: new THREE.Vector4() },
    uSkRidgeH: { value: new THREE.Vector4() },
    uSkSEnd: { value: 1.01 },
    uSkBlotch: { value: new THREE.Color() },
    uSkBlotchRing: { value: new THREE.Color() },
    uSkBlotchP: { value: new THREE.Vector4() },
    uSkBlotchQ: { value: new THREE.Vector4() },
    uSkStripe: { value: new THREE.Color() },
    uSkStripeP: { value: new THREE.Vector4() },
    uSkStripeR: { value: new THREE.Vector4() },
    uSkBlotch2: { value: new THREE.Color() },
    uSkBlotch2Ring: { value: new THREE.Color() },
    uSkBlotch2P: { value: new THREE.Vector4() },
    uSkBlotch2Q: { value: new THREE.Vector4() },
    uGhost: { value: 0 },
  };
}
export type SkinUniforms = ReturnType<typeof skinLocalUniforms>;

export function makeSkinMaterial(shared: FishShared, skinU: SkinUniforms): THREE.MeshPhysicalMaterial {
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.4,
    metalness: 0.0,
    clearcoat: 0.3,
    clearcoatRoughness: 0.28,
    sheen: 0.001,
    sheenRoughness: 0.8,
    sheenColor: new THREE.Color('#403838'),
    iridescence: 1,
    iridescenceIOR: 1.55,
    iridescenceThicknessRange: [220, 560],
    envMapIntensity: 1.0,
    side: THREE.DoubleSide,
  });
  const local = createLocal(skinU as unknown as Record<string, U<unknown>>);
  return patchFish(mat, shared, { morph: true, jaw: true, oper: true, skin: true }, local, {
    key: 'skin',
    skinPars: true,
    fragPars: /* glsl */ `
      float skRough; float skMetal; float skIrid; float skScale; vec3 skGlow; float skMouth;
    `,
    color: /* glsl */ `
      // 上下唇之间的皮膜 (闭口时面积为零): 朝向镜头这一侧的去掉, 露出口腔和颌上的牙;
      // 对侧的皮膜是从口腔里看过去的背面, 留着当口腔后壁, 张嘴时不会一眼看穿到对面的水里
      skMouth = step(0.015, vSkin.y) * step(vSkin.y, 0.985);
      if (skMouth > 0.5 && gl_FrontFacing) discard;
      vec3 skc = skinColor(skRough, skMetal, skIrid, skScale, skGlow);
      if (!gl_FrontFacing) {
        // 皮肤内面: 从口裂看进去是口腔内壁 (口腔色), 往后渐变成剖开时看到的皮下颜色
        float sIn = vFishUv.x * uSkSEnd;
        float oral = 1.0 - smoothstep(uSkMouthS * 0.8, uSkMouthS + 0.12, sIn);
        skc = mix(uSkInterior * 0.55, uSkMouth * 0.6, oral);
        if (skMouth > 0.5) skc = uSkMouth * 0.4;
        skMetal = 0.0; skIrid = 0.0; skRough = 0.7; skGlow = vec3(0.0);
      }
      diffuseColor.rgb = skc;
    `,
    rough: `roughnessFactor = skRough;`,
    metal: `metalnessFactor = skMetal;`,
    normal: /* glsl */ `
      if (gl_FrontFacing && skMouth < 0.5 && uSkRidge.x > 0.0) {
        // 纵棱: 高度是世界单位, 除以像素跨度得到真实坡度, 远近缩放时棱的明暗不变
        float sN = vFishUv.x * uSkSEnd;
        float r0 = skinRidge(vSkin.x, sN);
        vec2 dR = vec2(skinRidge(vSkin.x + dFdx(vSkin.x), sN + dFdx(sN)) - r0, skinRidge(vSkin.x + dFdy(vSkin.x), sN + dFdy(sN)) - r0);
        dR /= max(vec2(length(dFdx(vViewPosition)), length(dFdy(vViewPosition))), vec2(1e-7));
        normal = fishPerturbNormal(-vViewPosition, normal, dR, faceDirection);
      }
      if (gl_FrontFacing && skMouth < 0.5 && uSkMat.z > 0.0) {
        float sN = vFishUv.x * uSkSEnd;
        float h0 = skinBumpHeight(vRest.x, vSkin.z, sN);
        float hx = skinBumpHeight(vRest.x + dFdx(vRest.x), vSkin.z + dFdx(vSkin.z), sN);
        float hy = skinBumpHeight(vRest.x + dFdy(vRest.x), vSkin.z + dFdy(vSkin.z), sN);
        vec2 dH = vec2(hx - h0, hy - h0) * uSkMat.w * 0.35;
        normal = fishPerturbNormal(-vViewPosition, normal, dH, faceDirection);
        // 鳞片微倾: 每片鳞像一面略微歪斜的小镜子
        vec2 jit = skinScaleJitter(vRest.x, vSkin.z) * 0.1 * uSkEdges.w * smoothstep(uSkEye.x + 0.09, uSkEye.x + 0.16, sN);
        vec3 Tt = normalize(dFdx(-vViewPosition));
        vec3 Bt = normalize(cross(normal, Tt));
        Tt = cross(Bt, normal);
        normal = normalize(normal + Tt * jit.x + Bt * jit.y);
      }
    `,
    physical: /* glsl */ `
      material.iridescence = skIrid;
      #ifdef USE_CLEARCOAT
      material.clearcoat *= 1.0 - 0.85 * gSkBlot;
      #endif
      if (!gl_FrontFacing) {
        // 皮肤内面 (口腔, 剖开的切面) 在体内, 天光照不进去: 镜面与环境反射压到两成, 去掉黏液层
        material.specularColor *= 0.2;
        material.specularColorBlended *= 0.2;
        material.specularF90 *= 0.2;
        #ifdef USE_CLEARCOAT
        material.clearcoat = 0.0;
        #endif
      }
    `,
    emissive: `totalEmissiveRadiance += skGlow;`,
  });
}

export interface FinLook {
  color: THREE.Color;
  edge: THREE.Color;
  opacity: number;
  rays: number;
  glow: THREE.Color;
}

export function finLocalUniforms() {
  return {
    uFinColor: { value: new THREE.Color('#8c9aa3') },
    uFinEdge: { value: new THREE.Color('#303a40') },
    uFinP: { value: new THREE.Vector4(0.8, 12, 0, 0) }, // opacity, rays, spines/rays, lobe
    uFinGlow: { value: new THREE.Color(0, 0, 0) },
  };
}

export function makeFinMaterial(shared: FishShared, finU: ReturnType<typeof finLocalUniforms>, local: PartLocal): THREE.MeshPhysicalMaterial {
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.42,
    metalness: 0,
    clearcoat: 0.3,
    clearcoatRoughness: 0.3,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  Object.assign(local, finU);
  return patchFish(mat, shared, { morph: true, fin: true }, local, {
    key: 'fin',
    fragPars: /* glsl */ `
      uniform vec3 uFinColor; uniform vec3 uFinEdge; uniform vec4 uFinP; uniform vec3 uFinGlow;
      uniform vec3 uSunDir; uniform vec3 uSunColor;
      float finRay;
    `,
    color: /* glsl */ `
      float rp = vFin.w;
      float dRay = abs(rp - floor(rp + 0.5));
      float wRay = mix(0.08, 0.22, step(rp, uFinP.z - 0.5));
      // uFinP.w: 鳍条可见度 (软骨鱼的角质鳍条与翻车鲀厚实的鳍看不到骨质鳍条)
      finRay = (1.0 - smoothstep(wRay * 0.5, wRay, dRay)) * step(1.5, uFinP.y) * uFinP.w;
      // 鳍条分节: 沿鳍条的细小暗节
      float seg = step(0.82, fract(vFin.y * 18.0 + rp * 0.37)) * step(0.25, vFin.y);
      vec3 fc = mix(uFinColor, uFinEdge, smoothstep(0.55, 1.0, vFin.y));
      fc = mix(fc, fc * 0.62, finRay * (0.7 + 0.3 * seg));
      fc *= 0.92 + 0.16 * fishNoise(vRest * 40.0);
      diffuseColor.rgb = fc;
      float solid = smoothstep(0.95, 1.0, uFinP.x);
      float edgeFade = mix(1.0 - smoothstep(0.94, 1.0, vFin.y), 1.0, solid);
      diffuseColor.a = clamp(uFinP.x * mix(1.0, 0.72 + 0.35 * finRay, uFinP.w * (1.0 - solid)) * edgeFade + 0.12 * (1.0 - vFin.y), 0.0, 1.0);
    `,
    emissive: /* glsl */ `
      {
        vec3 V = normalize(cameraPosition - vWorldPos);
        float back = pow(clamp(dot(V, -uSunDir) * 0.5 + 0.5, 0.0, 1.0), 3.0);
        totalEmissiveRadiance += uFinColor * uSunColor * back * 0.35 * (1.0 - finRay * 0.6) + uFinGlow;
      }
    `,
  });
}

/** 通用湿润组织 (器官). */
export function makeTissueMaterial(
  shared: FishShared,
  color: THREE.ColorRepresentation,
  flags: PartFlags,
  local: PartLocal,
  opts: { roughness?: number; sheen?: number; clearcoat?: number; pattern?: string; fragPars?: string; key?: string; metal?: number; transparent?: boolean; opacity?: number; side?: THREE.Side; vertexColors?: boolean } = {},
) {
  const c = new THREE.Color(color);
  const mat = new THREE.MeshPhysicalMaterial({
    color: c,
    roughness: opts.roughness ?? 0.38,
    metalness: opts.metal ?? 0,
    clearcoat: opts.clearcoat ?? 0.6,
    clearcoatRoughness: 0.18,
    sheen: opts.sheen ?? 0.4,
    sheenColor: c.clone().lerp(new THREE.Color('#ffffff'), 0.4),
    sheenRoughness: 0.45,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
    side: opts.side ?? THREE.FrontSide,
    vertexColors: opts.vertexColors ?? false,
  });
  return patchFish(mat, shared, flags, local, {
    key: opts.key ?? 'tissue',
    fragPars: opts.fragPars,
    color:
      opts.pattern ??
      /* glsl */ `
      float tn = fishFbm(vRest * 18.0);
      diffuseColor.rgb *= 0.86 + 0.28 * tn;
    `,
  });
}

/** 骨骼 (解剖模式下的骨白色). */
export function makeBoneMaterial(shared: FishShared, flags: PartFlags, local: PartLocal, color: THREE.ColorRepresentation = '#ebe3cc', key = 'bone') {
  const mat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(color),
    roughness: 0.52,
    metalness: 0,
    clearcoat: 0.25,
    clearcoatRoughness: 0.4,
    sheen: 0.2,
    sheenColor: new THREE.Color('#fff8ea'),
    side: THREE.DoubleSide,
  });
  return patchFish(mat, shared, flags, local, {
    key,
    color: /* glsl */ `
      float bn = fishNoise(vRest * 90.0) * 0.5 + fishNoise(vRest * 31.0) * 0.5;
      float pits = smoothstep(0.62, 0.8, fishNoise(vRest * 260.0));
      diffuseColor.rgb *= (0.88 + 0.2 * bn) * (1.0 - 0.18 * pits);
      if (!gl_FrontFacing) diffuseColor.rgb *= vec3(0.62, 0.55, 0.5);
    `,
  });
}

// ---------- 自定义着色器材质 (幽灵皮肤, X 光, 拾取) ----------

const SHADER_VERT = /* glsl */ `
#include <common>
${FISH_VERT_PARS}
varying vec3 vN;
varying vec3 vV;
varying float vDepth;
void main() {
  vec3 p = position;
  vec3 n = normal;
  fishDeform(p, n);
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vWorldPos = wp.xyz;
  vec4 mv = viewMatrix * wp;
  vN = normalize(normalMatrix * n);
  vV = -mv.xyz;
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}
`;

export function makeFishShader(
  shared: FishShared,
  flags: PartFlags,
  local: PartLocal,
  frag: { pars?: string; body: string },
  opts: Partial<THREE.ShaderMaterialParameters> & { key: string },
) {
  const { key, ...rest } = opts;
  const mat = new THREE.ShaderMaterial({
    vertexShader: SHADER_VERT,
    fragmentShader: /* glsl */ `
      ${FISH_FRAG_PARS}
      varying vec3 vN;
      varying vec3 vV;
      varying float vDepth;
      ${frag.pars ?? ''}
      void main() {
        fishClipDissolve();
        ${frag.body}
      }
    `,
    uniforms: { ...shared, ...local } as unknown as Record<string, THREE.IUniform>,
    defines: flagDefines(flags),
    ...rest,
  });
  mat.name = key;
  return mat;
}

/** 解剖模式的幽灵皮肤: 只保留菲涅耳轮廓与极淡的体色. */
export function makeGhostMaterial(shared: FishShared, flags: PartFlags, local: PartLocal, color = '#9fd8ff', strength = 1) {
  const l = local as PartLocal & { uGhostColor?: U<THREE.Color>; uGhostK?: U<number> };
  l.uGhostColor = { value: new THREE.Color(color) };
  l.uGhostK = { value: strength };
  return makeFishShader(
    shared,
    flags,
    l,
    {
      pars: `uniform vec3 uGhostColor; uniform float uGhostK;`,
      body: /* glsl */ `
        vec3 n = normalize(vN);
        vec3 v = normalize(vV);
        float f = 1.0 - abs(dot(n, v));
        float rim = pow(f, 2.6);
        float a = (0.035 + rim * 0.55) * uGhostK;
        gl_FragColor = vec4(uGhostColor * a + uHighlight * 0.4, a);
      `,
    },
    { key: 'ghost', transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending },
  );
}

/** X 光累积: 正面写 -深度·密度, 背面写 +深度·密度, 相加即得沿视线的质量厚度. */
export function makeXrayMaterial(shared: FishShared, flags: PartFlags, local: PartLocal, density: number, sheet: boolean) {
  const l = local as PartLocal & { uDensity?: U<number>; uDepthRef?: U<number> };
  l.uDensity = { value: density };
  l.uDepthRef = l.uDepthRef ?? { value: 8 };
  return makeFishShader(
    shared,
    flags,
    l,
    {
      pars: `uniform float uDensity; uniform float uDepthRef; uniform float uSheet;`,
      body: sheet
        ? /* glsl */ `
          float c = abs(dot(normalize(vN), normalize(vV)));
          gl_FragColor = vec4(uDensity * 0.004 / max(c, 0.2), 0.0, 0.0, 1.0);
        `
        : /* glsl */ `
          float d = (vDepth - uDepthRef) * uDensity;
          gl_FragColor = vec4(gl_FrontFacing ? -d : d, 0.0, 0.0, 1.0);
        `,
    },
    {
      key: 'xray',
      transparent: true,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneFactor,
    },
  );
}

/** 拾取: 输出结构编号与体表参数 (供解剖刀使用). */
export function makeIdMaterial(shared: FishShared, flags: PartFlags, local: PartLocal, sid: number) {
  const l = local as PartLocal & { uSid?: U<number> };
  l.uSid = { value: sid };
  const skin = !!flags.skin;
  return makeFishShader(
    shared,
    flags,
    l,
    {
      pars: `uniform float uSid;`,
      body: skin
        ? `gl_FragColor = vec4(uSid, vFishUv.x, vFishUv.y, 1.0);`
        : `gl_FragColor = vec4(uSid, -1.0, -1.0, 1.0);`,
    },
    { key: 'id', side: THREE.DoubleSide },
  );
}

/** 透明骨骼染色: 茜素红 (硬骨) / 阿利新蓝 (软骨). uCartRule = (x0, x1, 前端软骨量, 整体软骨量). */
export function makeStainMaterial(shared: FishShared, flags: PartFlags, local: PartLocal, role: 'bone' | 'pigment', plate = false) {
  const l = local as PartLocal & { uStainA?: U<THREE.Color>; uStainB?: U<THREE.Color>; uCartA?: U<THREE.Color>; uCartB?: U<THREE.Color>; uCartRule?: U<THREE.Vector4> };
  const pig = role === 'pigment';
  l.uStainA = { value: new THREE.Color(pig ? '#050608' : '#a3002b') };
  l.uStainB = { value: new THREE.Color(pig ? '#1b2226' : '#ff4d7d') };
  l.uCartA = { value: new THREE.Color(pig ? '#050608' : '#0f3aa6') };
  l.uCartB = { value: new THREE.Color(pig ? '#1b2226' : '#5fb0ff') };
  l.uCartRule = l.uCartRule ?? { value: new THREE.Vector4(-100, -99, 0, 0) };
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: pig ? 0.15 : 0.3,
    metalness: 0,
    clearcoat: 0.7,
    clearcoatRoughness: 0.12,
    sheen: 0.4,
    sheenColor: new THREE.Color(pig ? '#1b2226' : '#ff8fb0'),
    sheenRoughness: 0.4,
    transmission: plate ? 0.72 : 0,
    thickness: plate ? 0.04 : 0,
    ior: 1.4,
    attenuationColor: new THREE.Color('#c0103f'),
    attenuationDistance: 0.08,
    side: plate ? THREE.DoubleSide : THREE.FrontSide,
  });
  return patchFish(mat, shared, flags, l, {
    key: 'stain-' + role + (plate ? '-plate' : ''),
    caustics: false,
    fragPars: `uniform vec3 uStainA; uniform vec3 uStainB; uniform vec3 uCartA; uniform vec3 uCartB; uniform vec4 uCartRule; float stainFacing; float stainCart;`,
    color: /* glsl */ `
      {
        vec3 vv = normalize(vViewPosition);
        vec3 nn = normalize(vNormal);
        stainFacing = abs(dot(vv, nn));
        stainCart = clamp(uCartRule.w + uCartRule.z * (1.0 - smoothstep(uCartRule.x, uCartRule.y, vRest.x)), 0.0, 1.0);
        // 薄处 (正对视线) 颜色浅, 边缘厚处颜色深: 模拟染料沿视线累积
        float tb = fishNoise(vRest * 140.0) * 0.6 + fishNoise(vRest * 45.0) * 0.4;
        vec3 bone = mix(uStainA, uStainB, pow(stainFacing, 1.6) * 0.85 * (0.75 + 0.5 * tb));
        vec3 cart = mix(uCartA, uCartB, pow(stainFacing, 1.4) * 0.9);
        diffuseColor.rgb = mix(bone, cart, stainCart);
      }
    `,
    emissive: `totalEmissiveRadiance += mix(uStainB, uCartB, stainCart) * 0.2 * pow(stainFacing, 2.0);`,
  });
}

/** 透明化的软组织: 甘油中的澄清标本, 带一点淡黄. */
export function makeClearedBodyMaterial(shared: FishShared, flags: PartFlags, local: PartLocal) {
  const l = local as PartLocal & { uTint?: U<THREE.Color> };
  l.uTint = { value: new THREE.Color('#f3e2b3') };
  return makeFishShader(
    shared,
    flags,
    l,
    {
      pars: `uniform vec3 uTint;`,
      body: /* glsl */ `
        vec3 n = normalize(vN);
        vec3 v = normalize(vV);
        float f = 1.0 - abs(dot(n, v));
        float rim = pow(f, 2.2);
        // 甘油中的澄清组织: 淡琥珀色, 边缘因折射更亮
        vec3 c = uTint * (0.1 + rim * 0.75) + vec3(1.0, 0.97, 0.9) * pow(f, 10.0) * 0.35;
        float a = 0.09 + rim * 0.5;
        gl_FragColor = vec4(c, a);
      `,
    },
    { key: 'cleared', transparent: true, depthWrite: false, side: THREE.DoubleSide },
  );
}
