// Fish: 把物种参数装配成可渲染, 可插值, 可动画的整条鱼.

import * as THREE from 'three';
import { BodyModel } from './body';
import type { FinSpec, SpeciesSpec } from './spec';
import { Midline } from './midline';
import {
  createLocal,
  createShared,
  finLocalUniforms,
  makeFinMaterial,
  makeSkinMaterial,
  patchFish,
  skinLocalUniforms,
  type FishShared,
  type PartFlags,
  type PartLocal,
  type SkinUniforms,
} from './materials';
import { toBufferGeometry, toInstancedGeometry, writeInstanceSlot, writeSlot, type GeomData, type InstanceData } from './geom';
import { buildSkin } from './parts/skin';
import { buildFinMembrane, buildFinRays, finFrame } from './parts/fins';
import { buildEyes, buildTeeth, buildToothUnit } from './parts/head';
import { clamp, lerp, smoothstep } from './math';
import { heartChamberCenters, swimBladderCenter } from './parts/organs';
import { buildEsca, buildFinlets, buildIllicium, buildMale, buildSpineUnit, buildSpines, lureBase, lurePath, lureTip, maleAnchor } from './parts/extras';
import { barbelAnchor, buildBarbels, buildBeak, buildFilterPads, buildFringe, buildFringeUnit, buildScuteUnit, buildScutes, filterPadAnchor } from './parts/special';
import type { StructureId } from '../data/types';

export type Layer = 'skin' | 'fins' | 'muscle' | 'skeleton' | 'organs' | 'vessels' | 'nerves' | 'cavity' | 'eyes';
export type CsRole = 'bone' | 'cartilage' | 'soft' | 'pigment' | 'skin' | 'fin' | 'hidden' | 'glow';

export interface Part {
  key: string;
  sid: StructureId;
  layer: Layer;
  mesh: THREE.Mesh;
  local: PartLocal;
  flags: PartFlags;
  density: number; // X 光: 相对软组织的额外密度
  sheet?: boolean; // 薄片 (鳍膜), X 光按薄片计
  cs: CsRole;
  mats: Record<string, THREE.Material>;
  kind: 'mesh' | 'inst';
  buildMesh?: (b: BodyModel) => GeomData;
  buildInst?: (b: BodyModel) => InstanceData;
  dataA?: GeomData | InstanceData;
  dataB?: GeomData | InstanceData;
  anchor?: (b: BodyModel) => THREE.Vector3;
  anchorA?: THREE.Vector3;
  anchorB?: THREE.Vector3;
  fin?: FinSpec['id'];
  finBaseA?: THREE.Vector3;
  finBaseB?: THREE.Vector3;
  finAxisA?: THREE.Vector3;
  finAxisB?: THREE.Vector3;
  colorKey?: string;
  lobe?: boolean;
  dissolve?: number; // 当前溶解值 (动画用)
  target?: number; // 目标溶解值
}

const _c1 = new THREE.Color();
const _c2 = new THREE.Color();

function col(a: string, b: string, t: number, out: THREE.Color) {
  _c1.set(a);
  _c2.set(b);
  return out.copy(_c1).lerp(_c2, t);
}

/** 最小二乘拟合二次多项式. */
function fitQuad(xs: number[], ys: number[]): [number, number, number] {
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, t0 = 0, t1 = 0, t2 = 0;
  for (let i = 0; i < xs.length; i++) {
    const x = xs[i];
    const y = ys[i];
    s0 += 1; s1 += x; s2 += x * x; s3 += x * x * x; s4 += x * x * x * x;
    t0 += y; t1 += x * y; t2 += x * x * y;
  }
  const m = new THREE.Matrix3().set(s0, s1, s2, s1, s2, s3, s2, s3, s4);
  if (Math.abs(m.determinant()) < 1e-12) return [t0 / Math.max(1, s0), 0, 0];
  const inv = m.invert();
  const v = new THREE.Vector3(t0, t1, t2).applyMatrix3(inv);
  return [v.x, v.y, v.z];
}

export class Fish {
  readonly root = new THREE.Group();
  readonly shared: FishShared;
  readonly midline = new Midline();
  readonly parts: Part[] = [];
  specA: SpeciesSpec;
  specB: SpeciesSpec;
  bodyA: BodyModel;
  bodyB: BodyModel;
  morph = 0;
  private skinU: SkinUniforms;
  phase = 0; // 尾拍相位 (周期)
  breath = 0; // 呼吸相位
  heart = 0; // 心跳相位
  swimScale = 1; // 游速倍率 (0 = 静止)
  curl = 0;
  turn = 0;
  time = 0;
  gapeExtra = 0;
  /** 额外的逐帧动画 (特化结构用). */
  readonly updaters: ((f: Fish, dt: number) => void)[] = [];
  /** 饵球在鱼体局部坐标中的位置 (含摆动与游动变形), 供发光点光源使用. */
  readonly escaPos = new THREE.Vector3();
  escaGlow = 0;
  lureTwitch = 0; // 外部触发的一阵诱饵抖动 0..1 (浅海鮟鱇的饵球不发光, 靠抖动引诱)

  constructor(spec: SpeciesSpec) {
    this.shared = createShared();
    this.specA = spec;
    this.specB = spec;
    this.bodyA = new BodyModel(spec);
    this.bodyB = this.bodyA;
    this.skinU = skinLocalUniforms();
    this.root.name = 'fish';
    this.addDefaultParts();
    this.rebuild();
  }

  // ---------- 部件注册 ----------
  addMeshPart(p: Omit<Part, 'mesh' | 'kind' | 'mats'> & { mats: Record<string, THREE.Material>; buildMesh: (b: BodyModel) => GeomData }) {
    const dataA = p.buildMesh(this.bodyA);
    const geo = toBufferGeometry(dataA);
    const mesh = new THREE.Mesh(geo, p.mats.living ?? Object.values(p.mats)[0]);
    mesh.frustumCulled = false;
    mesh.name = p.key;
    const part: Part = { ...p, mesh, kind: 'mesh', dataA };
    mesh.userData.part = part;
    this.root.add(mesh);
    this.parts.push(part);
    return part;
  }

  addInstPart(
    p: Omit<Part, 'mesh' | 'kind' | 'mats'> & { mats: Record<string, THREE.Material>; unit: GeomData; buildInst: (b: BodyModel) => InstanceData; instAttr?: Record<string, Float32Array> },
  ) {
    const dataA = p.buildInst(this.bodyA);
    const geo = toInstancedGeometry(p.unit, dataA);
    if (p.instAttr) for (const k of Object.keys(p.instAttr)) geo.setAttribute(k, new THREE.InstancedBufferAttribute(p.instAttr[k], 1));
    const mesh = new THREE.Mesh(geo, p.mats.living ?? Object.values(p.mats)[0]);
    mesh.frustumCulled = false;
    mesh.name = p.key;
    const part: Part = { ...p, mesh, kind: 'inst', dataA };
    mesh.userData.part = part;
    this.root.add(mesh);
    this.parts.push(part);
    return part;
  }

  private addDefaultParts() {
    const sh = this.shared;
    // 皮肤
    const skinMat = makeSkinMaterial(sh, this.skinU);
    this.addMeshPart({
      key: 'skin',
      sid: 'skin',
      layer: 'skin',
      local: skinMat.userData.local as PartLocal,
      flags: { morph: true, jaw: true, oper: true, skin: true },
      density: 0.3,
      cs: 'skin',
      mats: { living: skinMat },
      buildMesh: (b) => buildSkin(b),
      anchor: (b) => b.bodyPoint(0.34, 0.35, 1),
    });
    // 鳍
    for (const f of this.specA.fins) {
      const id = f.id;
      const local = createLocal();
      const fu = finLocalUniforms();
      const mat = makeFinMaterial(sh, fu, local);
      const part = this.addMeshPart({
        key: 'fin:' + id,
        sid: id === 'caudalFin' && this.specA.extras.clavus > 0.5 ? 'clavus' : id,
        layer: 'fins',
        local,
        flags: { morph: true, fin: true },
        density: 0.6,
        sheet: true,
        cs: 'fin',
        mats: { living: mat },
        buildMesh: (b) => buildFinMembrane(b, b.spec.fins.find((x) => x.id === id)!),
        anchor: (b) => {
          const fs = b.spec.fins.find((x) => x.id === id)!;
          return finFrame(b, fs).point(0.35, 0.6, 1, new THREE.Vector3());
        },
      });
      part.fin = id;
      // 鳍条骨 (骨骼层)
      const rl = createLocal();
      rl.uFinBase = local.uFinBase;
      rl.uFinAxis = local.uFinAxis;
      rl.uFinAnim = local.uFinAnim;
      rl.uFinWave = local.uFinWave;
      const rayMat = patchFish(
        new THREE.MeshPhysicalMaterial({ color: '#efe6d0', roughness: 0.5, clearcoat: 0.3 }),
        sh,
        { morph: true, fin: true },
        rl,
        { key: 'finray' },
      );
      const rp = this.addMeshPart({
        key: 'finrays:' + id,
        sid: 'finRays',
        layer: 'skeleton',
        local: rl,
        flags: { morph: true, fin: true },
        density: 7.0,
        cs: 'bone',
        mats: { living: rayMat },
        buildMesh: (b) => buildFinRays(b, b.spec.fins.find((x) => x.id === id)!),
        anchor: (b) => {
          const fs = b.spec.fins.find((x) => x.id === id)!;
          return finFrame(b, fs).point(0.5, 0.75, 1, new THREE.Vector3());
        },
      });
      rp.fin = id;
    }
    // 眼
    const eyeLocal = createLocal();
    const eyeMat = patchFish(
      new THREE.MeshPhysicalMaterial({ color: '#111', roughness: 0.12, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.03 }),
      sh,
      { morph: true, eye: true },
      eyeLocal,
      {
        key: 'eye',
        fragPars: `uniform vec3 uIris; uniform float uPupil; float eyeMetal;`,
        color: /* glsl */ `
          float ce = vEye.x;
          float pupilC = cos(0.75 * uPupil + 0.1);
          float irisC = cos(0.75 * uPupil + 0.55);
          float inPupil = smoothstep(pupilC - 0.015, pupilC + 0.01, ce);
          float inIris = smoothstep(irisC - 0.03, irisC + 0.02, ce) * (1.0 - inPupil);
          float ang = atan(vRest.y, vRest.x);
          float fib = 0.75 + 0.25 * fishNoise(vec3(ang * 12.0, ce * 30.0, 1.0));
          vec3 sclera = vec3(0.10, 0.11, 0.12);
          // 虹膜: 内圈亮, 外缘暗
          float irisT = clamp((ce - irisC) / max(pupilC - irisC, 1e-3), 0.0, 1.0);
          vec3 irisCol = uIris * fib * mix(0.45, 1.05, smoothstep(0.0, 0.7, irisT));
          vec3 c = mix(sclera, irisCol, inIris);
          c = mix(c, vec3(0.005, 0.006, 0.008), inPupil);
          // 瞳孔深处的蓝绿色反光膜 (tapetum)
          c += vec3(0.0, 0.05, 0.06) * inPupil * smoothstep(0.9, 1.0, ce);
          diffuseColor.rgb = c;
          eyeMetal = inIris * 0.55;
        `,
        metal: `metalnessFactor = eyeMetal;`,
        rough: `roughnessFactor = mix(0.35, 0.05, inPupil);`,
        caustics: true,
      },
    );
    eyeLocal.uIris = { value: new THREE.Color(this.specA.eye.iris) };
    eyeLocal.uPupil = { value: this.specA.eye.pupil };
    this.addMeshPart({
      key: 'eye',
      sid: 'eye',
      layer: 'eyes',
      local: eyeLocal,
      flags: { morph: true, eye: true },
      density: 0.45,
      cs: 'pigment',
      mats: { living: eyeMat },
      buildMesh: (b) => buildEyes(b),
      anchor: (b) => b.eyeCenter(),
    });
    // 牙
    const toothLocal = createLocal();
    const toothMat = patchFish(
      new THREE.MeshPhysicalMaterial({ color: '#f3efe6', roughness: 0.25, clearcoat: 0.8, clearcoatRoughness: 0.1 }),
      sh,
      { inst: true, instJaw: true },
      toothLocal,
      { key: 'tooth' },
    );
    const teeth0 = buildTeeth(this.bodyA);
    this.addInstPart({
      key: 'teeth',
      sid: 'teeth',
      layer: 'skin',
      local: toothLocal,
      flags: { inst: true, instJaw: true },
      density: 5.0,
      cs: 'bone',
      mats: { living: toothMat },
      unit: buildToothUnit(),
      buildInst: (b) => buildTeeth(b).data,
      instAttr: { iJaw: teeth0.jaw },
      anchor: (b) => b.surface(b.spec.mouth.corner * 0.4, b.mouthTheta(b.spec.mouth.corner * 0.4)),
    });
    this.addExtraParts();
  }

  /** 物种特化的外部结构: 小鳍, 棘刺, 钓竿与饵球, 附着雄鱼. */
  private addExtraParts() {
    const sh = this.shared;
    const phys = (color: string, o: THREE.MeshPhysicalMaterialParameters = {}) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.4, clearcoat: 0.4, clearcoatRoughness: 0.2, ...o });
    // 小鳍
    const flLocal = createLocal();
    this.addMeshPart({
      key: 'finlets',
      sid: 'finlets',
      layer: 'fins',
      local: flLocal,
      flags: { morph: true },
      density: 0.9,
      sheet: true,
      cs: 'fin',
      mats: {
        living: patchFish(phys('#ffffff', { roughness: 0.35, sheen: 0.4, sheenColor: new THREE.Color('#fff2b0'), vertexColors: true }), sh, { morph: true }, flLocal, { key: 'finlet' }),
      },
      buildMesh: (b) => buildFinlets(b),
      anchor: (b) => {
        const f = b.spec.extras.finlets;
        const s = lerp(f.s0, f.s1, 0.35);
        return new THREE.Vector3((s - 0.5) * b.L, (b.axis(s) + b.top(s) + 0.02) * b.L, 0);
      },
    });
    // 棘刺
    const spLocal = createLocal();
    this.addInstPart({
      key: 'spines',
      sid: 'spines',
      layer: 'skin',
      local: spLocal,
      flags: { inst: true },
      density: 4.0,
      cs: 'bone',
      mats: { living: patchFish(phys('#ffffff', { roughness: 0.3, clearcoat: 0.8, sheen: 0.3, vertexColors: true }), sh, { inst: true }, spLocal, { key: 'spine' }) },
      unit: buildSpineUnit(),
      buildInst: (b) => buildSpines(b),
      anchor: (b) => b.surface(0.42, 1.1, 0).addScaledVector(b.surfaceNormal(0.42, 1.1), b.spec.extras.spines.len * b.L * 0.6 * b.spec.extras.spines.erect),
    });
    // 骨板 (鲟): 五列菱形硬鳞
    const scLocal = createLocal();
    this.addInstPart({
      key: 'scutes',
      sid: 'scutes',
      layer: 'skin',
      local: scLocal,
      flags: { inst: true },
      density: 3.0,
      cs: 'bone',
      mats: { living: patchFish(phys('#ffffff', { roughness: 0.45, clearcoat: 0.5, vertexColors: true }), sh, { inst: true }, scLocal, { key: 'scute' }) },
      unit: buildScuteUnit(),
      buildInst: (b) => buildScutes(b),
      anchor: (b) => b.surface(lerp(b.spec.extras.scutes.s0, 0.5, 0.4), 0.08, 0),
      colorKey: 'scute',
    });
    // 须 (鲤: 吻须与颌须; 鲟: 吻部腹面四根)
    const bbLocal = createLocal();
    this.addMeshPart({
      key: 'barbels',
      sid: 'barbels',
      layer: 'skin',
      local: bbLocal,
      flags: { morph: true },
      density: 0.4,
      cs: 'skin',
      mats: { living: patchFish(phys('#ffffff', { roughness: 0.6, clearcoat: 0.15 }), sh, { morph: true }, bbLocal, { key: 'barbel' }) },
      buildMesh: (b) => buildBarbels(b),
      anchor: (b) => barbelAnchor(b),
      colorKey: 'barbel',
    });
    // 喙状齿板 (河鲀): 4 块愈合的齿板, 活体张口可见, 下颌两块随下颌开合
    const bkLocal = createLocal();
    this.addMeshPart({
      key: 'beak',
      sid: 'beak',
      layer: 'skin',
      local: bkLocal,
      flags: { morph: true, jaw: true },
      density: 6.0,
      cs: 'bone',
      mats: { living: patchFish(phys('#f1e9d4', { roughness: 0.5, clearcoat: 0.25, side: THREE.DoubleSide }), sh, { morph: true, jaw: true }, bkLocal, { key: 'beak' }) },
      buildMesh: (b) => buildBeak(b),
      anchor: (b) => b.surface(b.spec.mouth.corner * 0.3, b.mouthTheta(b.spec.mouth.corner * 0.3)),
    });
    // 滤食垫 (鲸鲨): 属于内脏层, 但活体张口时也看得见 (modes.ts 按 key 特判)
    const fpLocal = createLocal();
    const fpMat = patchFish(phys('#1c1a1c', { roughness: 0.85, clearcoat: 0.05 }), sh, { morph: true }, fpLocal, {
      key: 'filterPads',
      color: /* glsl */ `
        // 海绵状网眼: 暗色底上交错的浅色网线
        float cell = fishNoise(vRest * 260.0) * 0.6 + fishNoise(vRest * 90.0) * 0.4;
        diffuseColor.rgb = mix(vec3(0.16, 0.14, 0.14), vec3(0.62, 0.56, 0.5), smoothstep(0.56, 0.74, cell));
      `,
    });
    this.addMeshPart({
      key: 'filterPads',
      sid: 'filterPads',
      layer: 'organs',
      local: fpLocal,
      flags: { morph: true },
      density: 0.25,
      cs: 'soft',
      mats: { living: fpMat, anatomy: fpMat },
      buildMesh: (b) => buildFilterPads(b),
      anchor: (b) => filterPadAnchor(b),
    });
    // 皮须 (鮟鱇): 下颌边缘与头体两侧的皮瓣, 下颌上的随口开合
    const frLocal = createLocal();
    const fr0 = buildFringe(this.bodyA);
    this.addInstPart({
      key: 'fringe',
      sid: 'dermalFlaps',
      layer: 'skin',
      local: frLocal,
      flags: { inst: true, instJaw: true },
      density: 0.3,
      cs: 'skin',
      mats: { living: patchFish(phys('#ffffff', { roughness: 0.7, clearcoat: 0.1 }), sh, { inst: true, instJaw: true }, frLocal, { key: 'fringe' }) },
      unit: buildFringeUnit(),
      buildInst: (b) => buildFringe(b).data,
      instAttr: { iJaw: fr0.jaw },
      anchor: (b) => {
        const fr = b.spec.extras.fringe;
        const s = lerp(b.spec.mouth.corner + 0.02, fr.s1, 0.3);
        return b.surface(s, b.thetaAt(s, fr.h), 0);
      },
      colorKey: 'fringe',
    });
    // 钓竿 (背鳍第一鳍棘特化) 与饵球: 与鳍一样绕基部摆动
    const lureLocal = createLocal({
      uFinBase: { value: new THREE.Vector3() },
      uFinAxis: { value: new THREE.Vector3(0, 0, 1) },
      uFinAnim: { value: new THREE.Vector4() },
    });
    const ill = this.addMeshPart({
      key: 'illicium',
      sid: 'illicium',
      layer: 'fins',
      local: lureLocal,
      flags: { morph: true, fin: true },
      density: 2.4,
      cs: 'bone',
      mats: { living: patchFish(phys('#1b1512', { roughness: 0.6, clearcoat: 0.2 }), sh, { morph: true, fin: true }, lureLocal, { key: 'illicium' }) },
      buildMesh: (b) => buildIllicium(b),
      colorKey: 'illicium',
      anchor: (b) => {
        const p = lurePath(b, 24);
        return p[12].clone();
      },
    });
    const escaLocal = createLocal({ uEscaGlow: { value: new THREE.Color('#6ff5ff') }, uEscaI: { value: 0 } });
    escaLocal.uFinBase = lureLocal.uFinBase;
    escaLocal.uFinAxis = lureLocal.uFinAxis;
    escaLocal.uFinAnim = lureLocal.uFinAnim;
    const esca = this.addMeshPart({
      key: 'esca',
      sid: 'esca',
      layer: 'fins',
      local: escaLocal,
      flags: { morph: true, fin: true },
      density: 0.3,
      cs: 'glow',
      mats: {
        living: patchFish(phys('#d9e8e4', { roughness: 0.15, clearcoat: 1, transmission: 0.35, thickness: 0.05, ior: 1.35 }), sh, { morph: true, fin: true }, escaLocal, {
          key: 'esca',
          fragPars: `uniform vec3 uEscaGlow; uniform float uEscaI;`,
          emissive: /* glsl */ `
            // 饵球里的共生发光细菌: 顶端透光窗最亮, 其余是半透明的色素囊
            float win = smoothstep(0.1, 0.9, normalize(vNormal).y * 0.5 + 0.5);
            totalEmissiveRadiance += uEscaGlow * uEscaI * (0.35 + 1.4 * win);
          `,
        }),
      },
      buildMesh: (b) => buildEsca(b),
      anchor: (b) => lureTip(b),
      colorKey: 'esca',
    });
    // 附着雄鱼
    const maleLocal = createLocal();
    this.addMeshPart({
      key: 'male',
      sid: 'parasiticMale',
      layer: 'skin',
      local: maleLocal,
      flags: { morph: true },
      density: 0.4,
      cs: 'skin',
      mats: { living: patchFish(phys('#2c2521', { roughness: 0.7, clearcoat: 0.15 }), sh, { morph: true }, maleLocal, { key: 'male' }) },
      buildMesh: (b) => buildMale(b),
      anchor: (b) => maleAnchor(b),
    });

    // 钓竿摆动与饵球发光
    const cache = new WeakMap<BodyModel, { base: THREE.Vector3; tip: THREE.Vector3 }>();
    const get = (b: BodyModel) => {
      let c = cache.get(b);
      if (!c) {
        c = { base: lureBase(b), tip: lureTip(b) };
        cache.set(b, c);
      }
      return c;
    };
    const tmp = new THREE.Vector3();
    this.updaters.push((f) => {
      const a = get(f.bodyA);
      const bb = get(f.bodyB);
      const base = (lureLocal.uFinBase.value as THREE.Vector3).copy(a.base).lerp(bb.base, f.morph);
      const t = f.time;
      // 慢速的诱饵抖动: 偶尔一阵快速颤动
      const burst = Math.max(Math.pow(Math.max(0, Math.sin(t * 0.37)), 12), f.lureTwitch);
      const ang = 0.1 * Math.sin(t * 1.3) + 0.05 * Math.sin(t * 3.1 + 1) + burst * 0.12 * Math.sin(t * 17);
      const L = f.L;
      (lureLocal.uFinAnim.value as THREE.Vector4).set(ang, 1.4, 0.004 * L * (1 + burst * 3), t * 5);
      const lumOf = (x: typeof f.specA.extras.lure) => x.esca * x.lum * (x.len > 0 ? 1 : 0);
      const lu = lerp(lumOf(f.specA.extras.lure), lumOf(f.specB.extras.lure), f.morph);
      const glowA = new THREE.Color(f.specA.extras.lure.glow);
      const glowB = new THREE.Color(f.specB.extras.lure.glow);
      (escaLocal.uEscaGlow.value as THREE.Color).copy(glowA).lerp(glowB, f.morph);
      // 发光节律: 缓慢呼吸 + 偶发闪烁
      const pulse = 0.65 + 0.35 * Math.sin(t * 1.9) * Math.sin(t * 0.7) + burst * 0.8;
      f.escaGlow = lu * pulse;
      escaLocal.uEscaI.value = 2.2 * f.escaGlow;
      // 饵球位置: 静息位置 → 绕钓竿基部旋转 (与着色器一致) → 游动变形
      tmp.copy(a.tip).lerp(bb.tip, f.morph).sub(base);
      const k = ang * (1 + 1.4);
      tmp.applyAxisAngle(lureLocal.uFinAxis.value as THREE.Vector3, k);
      f.escaPos.copy(base).add(tmp);
      f.midline.deform(f.escaPos, f.escaPos);
    });
    void ill;
    void esca;
  }

  // ---------- 构建与插值 ----------
  private heartCA: THREE.Vector3[] = [];
  private heartCB: THREE.Vector3[] = [];
  private bladderCA = new THREE.Vector3();
  private bladderCB = new THREE.Vector3();
  bladderScale = 1; // 鳔体积缩放 (深度与气体分泌)
  drum = 0; // 鳔鼓动强度 0..1, 石首鱼鸣叫演示时由外部驱动
  drumVib = 0; // 本帧的振动相位 0..1
  heartBeat = 0; // 当前心室收缩强度 0..1 (供心电图与音效)

  rebuild() {
    this.heartCA = heartChamberCenters(this.bodyA);
    this.heartCB = this.heartCA;
    this.bladderCA = swimBladderCenter(this.bodyA);
    this.bladderCB = this.bladderCA;
    for (const p of this.parts) {
      p.anchorA = p.anchor?.(this.bodyA);
      p.anchorB = p.anchorA;
      if (p.fin) {
        const f = finFrame(this.bodyA, this.specA.fins.find((x) => x.id === p.fin)!);
        p.finBaseA = f.base.clone();
        p.finAxisA = f.axis.clone();
        p.finBaseB = p.finBaseA;
        p.finAxisB = p.finAxisA;
      }
    }
    this.refreshSids();
    this.midline.setBody(this.bodyA);
    const L = this.bodyA.L;
    this.shared.uSpineInfo.value.set(this.midline.sMin, this.midline.sMax, this.midline.N, L);
    this.applyParams();
  }

  /** 开始向另一物种插值: 生成 B 槽几何. */
  setTarget(spec: SpeciesSpec) {
    this.specB = spec;
    this.bodyB = new BodyModel(spec);
    this.heartCB = heartChamberCenters(this.bodyB);
    this.bladderCB = swimBladderCenter(this.bodyB);
    for (const p of this.parts) {
      if (p.kind === 'mesh' && p.buildMesh) {
        p.dataB = p.buildMesh(this.bodyB);
        writeSlot(p.mesh.geometry, p.dataB as GeomData, 'b');
      } else if (p.kind === 'inst' && p.buildInst) {
        p.dataB = p.buildInst(this.bodyB);
        writeInstanceSlot(p.mesh.geometry as THREE.InstancedBufferGeometry, p.dataB as InstanceData, 'b');
      }
      p.anchorB = p.anchor?.(this.bodyB);
      if (p.fin) {
        const f = finFrame(this.bodyB, this.specB.fins.find((x) => x.id === p.fin)!);
        p.finBaseB = f.base.clone();
        p.finAxisB = f.axis.clone();
      }
    }
    this.setMorph(0);
  }

  setMorph(t: number) {
    this.morph = clamp(t, 0, 1);
    this.shared.uMorph.value = this.morph;
    this.midline.setBody(this.bodyA, this.bodyB, this.morph);
    this.shared.uSpineInfo.value.w = lerp(this.bodyA.L, this.bodyB.L, this.morph);
    this.applyParams();
  }

  /** 插值完成: B 成为新的 A. */
  commit() {
    for (const p of this.parts) {
      if (!p.dataB) continue;
      if (p.kind === 'mesh') writeSlot(p.mesh.geometry, p.dataB as GeomData, 'a');
      else writeInstanceSlot(p.mesh.geometry as THREE.InstancedBufferGeometry, p.dataB as InstanceData, 'a');
      p.dataA = p.dataB;
      p.dataB = undefined;
      p.anchorA = p.anchorB;
      p.finBaseA = p.finBaseB;
      p.finAxisA = p.finAxisB;
    }
    this.specA = this.specB;
    this.bodyA = this.bodyB;
    this.heartCA = this.heartCB;
    this.bladderCA = this.bladderCB;
    this.refreshSids();
    this.setMorph(0);
  }

  /** 同一个几何部件在不同物种里对应不同结构: 翻车鲀的尾鳍是舵鳍, 腔棘鱼的鳔是充脂的肺. */
  private refreshSids() {
    for (const p of this.parts) {
      if (p.key === 'fin:caudalFin') p.sid = this.specA.extras.clavus > 0.5 ? 'clavus' : 'caudalFin';
      if (p.key === 'swimBladder') p.sid = this.specA.organs.swimBladder.kind === 3 ? 'fatLung' : 'swimBladder';
      if (p.key === 'intestine') p.sid = this.specA.organs.intestine.spiral > 0.5 ? 'spiralValve' : 'intestine';
      if (p.key === 'muscle') p.sid = 'whiteMuscle';
    }
  }

  /** 把 (插值后的) 物种参数写进各部件 uniform. */
  applyParams() {
    const a = this.specA;
    const b = this.specB;
    const t = this.morph;
    const u = this.skinU;
    const A = a.skin;
    const B = b.skin;
    col(A.dorsal, B.dorsal, t, u.uSkDorsal.value);
    col(A.flank, B.flank, t, u.uSkFlank.value);
    col(A.ventral, B.ventral, t, u.uSkVentral.value);
    u.uSkEdges.value.set(lerp(A.dorsalEdge, B.dorsalEdge, t), lerp(A.ventralEdge, B.ventralEdge, t), lerp(A.softness, B.softness, t), lerp(A.silver, B.silver, t));
    col(A.head, B.head, t, u.uSkHead.value);
    u.uSkHeadMix.value.set(lerp(A.headMix, B.headMix, t), lerp(a.gill.edge[1][1], b.gill.edge[1][1], t), 0, 0);
    const L = lerp(a.display, b.display, t);
    u.uSkMat.value.set(lerp(A.iridescence, B.iridescence, t), lerp(A.roughness, B.roughness, t), lerp(A.scaleSize, B.scaleSize, t) * L, lerp(A.scaleDepth, B.scaleDepth, t));
    col(A.spotColor, B.spotColor, t, u.uSkSpot.value);
    u.uSkSpotP.value.set(lerp(A.spotSize, B.spotSize, t) * L, lerp(A.spotDensity, B.spotDensity, t), t < 0.5 ? A.spotShape : B.spotShape, 0);
    u.uSkSpotR.value.set(lerp(A.spotH[0], B.spotH[0], t), lerp(A.spotH[1], B.spotH[1], t), lerp(A.spotS[0], B.spotS[0], t), lerp(A.spotS[1], B.spotS[1], t));
    col(A.barColor, B.barColor, t, u.uSkBar.value);
    u.uSkBarP.value.set(lerp(A.bars, B.bars, t), lerp(A.barWidth, B.barWidth, t), lerp(A.barStrength, B.barStrength, t), 0);
    u.uSkBarR.value.set(lerp(A.barH[0], B.barH[0], t), lerp(A.barH[1], B.barH[1], t), lerp(A.barS[0], B.barS[0], t), lerp(A.barS[1], B.barS[1], t));
    const sa = A.stripes;
    const sb = B.stripes;
    col(sa.color, sb.color, t, u.uSkStripe.value);
    u.uSkStripeP.value.set(Math.max(sa.n, sb.n), lerp(sa.width, sb.width, t), lerp(sa.n > 0 ? sa.amount : 0, sb.n > 0 ? sb.amount : 0, t), 0);
    u.uSkStripeR.value.set(lerp(sa.h0, sb.h0, t), lerp(sa.h1, sb.h1, t), lerp(sa.s0, sb.s0, t), lerp(sa.s1, sb.s1, t));
    col(A.mottleColor, B.mottleColor, t, u.uSkMottleC.value);
    u.uSkMottle.value.set(lerp(A.mottle, B.mottle, t), lerp(A.mottleScale, B.mottleScale, t) * L, lerp(A.lateralLine, B.lateralLine, t), lerp(A.denticles, B.denticles, t));
    col(A.glow, B.glow, t, u.uSkGlow.value);
    u.uSkGlowP.value.set(lerp(A.glowStrength, B.glowStrength, t), 0, 0, 0);
    col(A.interior, B.interior, t, u.uSkInterior.value);
    const halfH2 = (bd: BodyModel, s: number) => (bd.top(s) + bd.bottom(s)) * 0.5;
    col(A.blotch2.color, B.blotch2.color, t, u.uSkBlotch2.value);
    col(A.blotch2.ring, B.blotch2.ring, t, u.uSkBlotch2Ring.value);
    u.uSkBlotch2P.value.set(lerp(A.blotch2.s, B.blotch2.s, t), lerp(A.blotch2.h, B.blotch2.h, t), lerp(A.blotch2.r, B.blotch2.r, t), lerp(halfH2(this.bodyA, A.blotch2.s), halfH2(this.bodyB, B.blotch2.s), t));
    u.uSkBlotch2Q.value.set(lerp(A.blotch2.amount, B.blotch2.amount, t), lerp(A.blotch2.ringW, B.blotch2.ringW, t), 0, 0);
    col(A.blotch.color, B.blotch.color, t, u.uSkBlotch.value);
    col(A.blotch.ring, B.blotch.ring, t, u.uSkBlotchRing.value);
    const halfH = (bd: BodyModel, s: number) => (bd.top(s) + bd.bottom(s)) * 0.5;
    u.uSkBlotchP.value.set(lerp(A.blotch.s, B.blotch.s, t), lerp(A.blotch.h, B.blotch.h, t), lerp(A.blotch.r, B.blotch.r, t), lerp(halfH(this.bodyA, A.blotch.s), halfH(this.bodyB, B.blotch.s), t));
    u.uSkBlotchQ.value.set(lerp(A.blotch.amount, B.blotch.amount, t), lerp(A.blotch.ringW, B.blotch.ringW, t), 0, 0);
    col(A.mouthColor, B.mouthColor, t, u.uSkMouth.value);
    // 鳃盖后缘拟合 s(h)
    const fitEdge = (sp: SpeciesSpec) => fitQuad(sp.gill.edge.map((e) => e[0]), sp.gill.edge.map((e) => e[1]));
    const ea = fitEdge(a);
    const eb = fitEdge(b);
    const slits = t < 0.5 ? a.gill.slits : b.gill.slits;
    u.uSkGill.value.set(lerp(ea[0], eb[0], t), lerp(ea[1], eb[1], t), lerp(ea[2], eb[2], t), slits);
    u.uSkGillR.value.set(lerp(a.gill.top, b.gill.top, t), lerp(a.gill.bottom, b.gill.bottom, t), lerp(a.gill.slitS[0], b.gill.slitS[0], t), lerp(a.gill.slitS[1], b.gill.slitS[1], t));
    const fitLat = (bd: BodyModel) => {
      const xs: number[] = [];
      const ys: number[] = [];
      for (let i = 0; i <= 20; i++) {
        const s = 0.2 + 0.8 * (i / 20);
        xs.push(s);
        ys.push(bd.lateralH(s));
      }
      return fitQuad(xs, ys);
    };
    const la = fitLat(this.bodyA);
    const lb = fitLat(this.bodyB);
    u.uSkLat.value.set(lerp(la[0], lb[0], t), lerp(la[1], lb[1], t), lerp(la[2], lb[2], t), L);
    u.uSkEye.value.set(lerp(a.eye.s, b.eye.s, t), lerp(a.eye.h, b.eye.h, t), lerp(a.eye.r, b.eye.r, t), lerp(a.gill.groove, b.gill.groove, t));
    u.uSkSEnd.value = lerp(this.bodyA.sEnd, this.bodyB.sEnd, t);
    u.uSkMouthS.value = lerp(a.mouth.corner, b.mouth.corner, t);
    // 眼与鼻孔在体表的位置 (左侧): 眼眶暗环, 鼻孔按三维距离画
    const onSkin = (bd: BodyModel, ds: number, dh: number, out: THREE.Vector3) => {
      const e = bd.spec.eye;
      const s = e.s + ds * e.r;
      return bd.surface(s, bd.thetaAt(s, Math.min(0.98, e.h + dh)), 0, out);
    };
    const tv = new THREE.Vector3();
    onSkin(this.bodyA, 0, 0, u.uSkEyeP.value).lerp(onSkin(this.bodyB, 0, 0, tv), t);
    onSkin(this.bodyA, -1.24, 0.06, u.uSkNar1.value).lerp(onSkin(this.bodyB, -1.24, 0.06, tv), t);
    onSkin(this.bodyA, -0.84, 0.1, u.uSkNar2.value).lerp(onSkin(this.bodyB, -0.84, 0.1, tv), t);
    // 体侧纵棱与尾柄侧脊
    const ra = a.extras.ridges;
    const rb = b.extras.ridges;
    const rh = (r: typeof ra) => (r.n > 0 ? r.height : 0);
    u.uSkRidge.value.set(lerp(rh(ra), rh(rb), t) * L, lerp(ra.width, rb.width, t), lerp(ra.s0, rb.s0, t), lerp(ra.s1, rb.s1, t));
    u.uSkRidgeH.value.set(lerp(ra.h0, rb.h0, t), lerp(ra.h1, rb.h1, t), Math.max(ra.n, rb.n), lerp(a.extras.keel, b.extras.keel, t));

    // 鳍的外观
    for (const p of this.parts) {
      if (!p.fin || !p.key.startsWith('fin:')) continue;
      const fa = a.fins.find((x) => x.id === p.fin)!;
      const fb = b.fins.find((x) => x.id === p.fin)!;
      const l = p.local as PartLocal & ReturnType<typeof finLocalUniforms>;
      col(fa.color, fb.color, t, l.uFinColor.value);
      col(fa.edgeColor, fb.edgeColor, t, l.uFinEdge.value);
      const rayVis = (sp: SpeciesSpec, f: FinSpec) => (1 - sp.skeleton.cartilage * (sp.skeleton.cartilage > 0.9 ? 1 : 0)) * clamp(1.4 - f.thick * 150, 0.12, 1);
      l.uFinP.value.set(lerp(fa.opacity, fb.opacity, t), lerp(fa.rays, fb.rays, t), lerp(fa.spines, fb.spines, t), lerp(rayVis(a, fa), rayVis(b, fb), t));
      // 光泽: 默认 0.3 与原来一致; 皮肤包着的厚鳍 (鲨, 鮟鱇) 设 0, 不再映出天光发白
      const fm = p.mats.living as THREE.MeshPhysicalMaterial | undefined;
      if (fm) {
        const gl = lerp(fa.gloss, fb.gloss, t);
        fm.clearcoat = Math.max(0.001, gl);
        fm.roughness = 0.7 - 0.28 * Math.min(1, gl / 0.3);
        // 基础镜面也跟着降, 否则哑光的鳍仍会映出天光发灰
        fm.specularIntensity = 0.25 + 0.75 * Math.min(1, gl / 0.3);
      }
    }
    // 肉质鳍柄 (鮟鱇的臂状胸鳍) 跟鳍同色
    for (const p of this.parts) {
      if (!p.lobe || !p.fin) continue;
      const fa = a.fins.find((x) => x.id === p.fin)!;
      const fb = b.fins.find((x) => x.id === p.fin)!;
      const lc = p.local.uLobeColor as { value: THREE.Color } | undefined;
      if (lc) col(fa.color, fb.color, t, lc.value);
    }
    // 皮肤光泽: 黏液层与天鹅绒质感
    const skinMat = this.parts.find((p) => p.key === 'skin')?.mats.living as THREE.MeshPhysicalMaterial | undefined;
    if (skinMat) {
      skinMat.clearcoat = Math.max(0.01, lerp(A.clearcoat, B.clearcoat, t));
      skinMat.sheen = Math.max(0.001, lerp(A.sheen, B.sheen, t));
    }
    // 眼
    const eye = this.parts.find((p) => p.key === 'eye');
    if (eye) {
      col(a.eye.iris, b.eye.iris, t, eye.local.uIris.value as THREE.Color);
      eye.local.uPupil.value = lerp(a.eye.pupil, b.eye.pupil, t);
    }
    // 物种相关的器官颜色与肌节参数
    for (const p of this.parts) {
      if (!p.colorKey) continue;
      const lm = p.mats.living as THREE.MeshPhysicalMaterial | undefined;
      if (p.colorKey === 'barbel' && lm) col(a.extras.barbels.color, b.extras.barbels.color, t, lm.color);
      if (p.colorKey === 'scute' && lm) col(a.extras.scutes.color, b.extras.scutes.color, t, lm.color);
      if (p.colorKey === 'illicium' && lm) col(a.extras.lure.color, b.extras.lure.color, t, lm.color);
      if (p.colorKey === 'fringe' && lm) col(a.extras.fringe.color, b.extras.fringe.color, t, lm.color);
      if (p.colorKey === 'esca' && lm) col(a.extras.lure.escaColor, b.extras.lure.escaColor, t, lm.color);
      const mat = p.mats.anatomy as THREE.MeshPhysicalMaterial | undefined;
      if (p.colorKey === 'liver' && mat) col(a.organs.liver.color, b.organs.liver.color, t, mat.color);
      if (p.colorKey === 'gonad' && mat) {
        col(a.organs.gonad.color, b.organs.gonad.color, t, mat.color);
        const ue = p.local.uEggs as { value: number } | undefined;
        if (ue) ue.value = lerp(a.organs.gonad.eggs, b.organs.gonad.eggs, t);
      }
      if (p.colorKey === 'bladder' && mat) {
        const ca = a.organs.swimBladder.kind === 3 ? '#efd59a' : '#e9eef0';
        const cb = b.organs.swimBladder.kind === 3 ? '#efd59a' : '#e9eef0';
        col(ca, cb, t, mat.color);
      }
      if (p.colorKey === 'muscle') {
        const l = p.local as PartLocal & Record<string, { value: unknown }>;
        col(a.organs.muscleColor, b.organs.muscleColor, t, l.uMyoColor.value as THREE.Color);
        (l.uMyo.value as THREE.Vector4).set(
          lerp(a.skeleton.vertebrae, b.skeleton.vertebrae, t),
          1.4,
          0.05,
          lerp(this.bodyA.lateralH(0.55), this.bodyB.lateralH(0.55), t),
        );
        (l.uMyoRed.value as THREE.Vector4).set(lerp(a.organs.redMuscle, b.organs.redMuscle, t), lerp(a.organs.redMuscleDepth, b.organs.redMuscleDepth, t), 0, 0);
        l.uLen.value = L;
      }
    }
    // 下颌关节
    const ha = this.bodyA.jawHinge();
    const hb = this.bodyB.jawHinge();
    this.shared.uJaw.value.y = lerp(ha.x, hb.x, t);
    this.shared.uJaw.value.z = lerp(ha.y, hb.y, t);
    this.shared.uJawFwd.value.set(lerp(a.mouth.underbite, b.mouth.underbite, t) * L, lerp(a.mouth.corner, b.mouth.corner, t));
  }

  /** 插值后的数值参数. */
  get swim() {
    const a = this.specA.swim;
    const b = this.specB.swim;
    const t = this.morph;
    return {
      freq: lerp(a.freq, b.freq, t),
      wavelength: lerp(a.wavelength, b.wavelength, t),
      amp: [lerp(a.amp[0], b.amp[0], t), lerp(a.amp[1], b.amp[1], t), lerp(a.amp[2], b.amp[2], t)] as [number, number, number],
      headYaw: lerp(a.headYaw, b.headYaw, t),
      speed: lerp(a.speed, b.speed, t),
      medianFlap: lerp(a.medianFlap, b.medianFlap, t),
      pectoralRow: lerp(a.pectoralRow, b.pectoralRow, t),
      gait: lerp(a.gait, b.gait, t),
    };
  }

  get L() {
    return lerp(this.bodyA.L, this.bodyB.L, this.morph);
  }

  // ---------- 动画 ----------
  update(dt: number) {
    this.time += dt;
    const sw = this.swim;
    const a = this.specA;
    const b = this.specB;
    const t = this.morph;
    const k = this.swimScale;
    this.phase += dt * sw.freq * (0.35 + 0.65 * k);
    const breathRate = lerp(a.physiology.breathRate, b.physiology.breathRate, t) / 60;
    this.breath += dt * breathRate;
    const hr = lerp(a.physiology.heartRate, b.physiology.heartRate, t) / 60;
    this.heart += dt * hr;

    this.midline.compute(
      {
        amp: [sw.amp[0] * k, sw.amp[1] * k, sw.amp[2] * k],
        wavelength: sw.wavelength,
        phase: this.phase,
        headYaw: sw.headYaw,
        finFlex: 0.6,
        curl: this.curl,
        curlCenter: 0.42,
        turn: this.turn,
      },
      dt,
    );
    this.midline.write(this.shared.uSpine.value);
    this.shared.uTime.value = this.time;

    // 呼吸: 口先张 (颊腔扩张), 随后鳃盖外张排水
    const bp = this.breath * Math.PI * 2;
    const gape = lerp(a.mouth.gape, b.mouth.gape, t) + this.gapeExtra;
    const pump = lerp(a.mouth.pump, b.mouth.pump, t);
    const mouthOpen = Math.max(0, Math.sin(bp));
    this.shared.uJaw.value.x = gape + pump * Math.pow(mouthOpen, 1.5);
    const operOpen = Math.max(0, Math.sin(bp - 1.9));
    this.shared.uOper.value = lerp(a.gill.flare, b.gill.flare, t) * this.L * Math.pow(operOpen, 1.4);

    // 心脏: 静脉窦 → 心房 → 心室依次收缩, 动脉球随后弹性扩张
    const ph = this.heart - Math.floor(this.heart);
    const bump = (c: number, w: number) => Math.exp(-Math.pow((ph - c) / w, 2));
    this.heartBeat = bump(0.42, 0.07);
    const hp = this.parts.find((p) => p.key === 'heart');
    if (hp) {
      hp.local.uPartPulse.value.set(1 - 0.16 * bump(0.08, 0.06), 1 - 0.24 * bump(0.22, 0.07), 1 - 0.22 * bump(0.42, 0.08), 1 + 0.2 * bump(0.52, 0.09));
      for (let i = 0; i < 4; i++) hp.local.uPulseC.value[i].copy(this.heartCA[i]).lerp(this.heartCB[i], t);
    }
    // 发声肌每收缩一次鳔壁被拉紧一次. 真实脉冲率每秒几十次, 画面上用 13 Hz 的颤动示意
    this.drumVib = this.drum > 0 ? 0.5 + 0.5 * Math.sin(this.time * Math.PI * 2 * 13) : 0;
    const bl = this.parts.find((p) => p.key === 'swimBladder');
    if (bl) {
      bl.local.uPartPulse.value.set(this.bladderScale * (1 - 0.045 * this.drum * this.drumVib), 1, 1, 1);
      bl.local.uPulseC.value[0].copy(this.bladderCA).lerp(this.bladderCB, t);
    }
    const sm = this.parts.find((p) => p.key === 'sonicMuscle');
    if (sm) {
      sm.local.uPartPulse.value.set(1 - 0.06 * this.drum * this.drumVib, 1, 1, 1);
      sm.local.uPulseC.value[0].copy(this.bladderCA).lerp(this.bladderCB, t);
    }

    // 鳍的动作
    for (const p of this.parts) {
      if (!p.fin || !p.finBaseA || !p.finBaseB || !p.finAxisA || !p.finAxisB) continue;
      const fa = a.fins.find((x) => x.id === p.fin)!;
      const fb = b.fins.find((x) => x.id === p.fin)!;
      const l = p.local;
      l.uFinBase.value.copy(p.finBaseA).lerp(p.finBaseB, t);
      l.uFinAxis.value.copy(p.finAxisA).lerp(p.finAxisB, t).normalize();
      if (!p.key.startsWith('fin:')) continue; // 鳍条与肉鳍柄共享同一组 uniform
      const flap = lerp(fa.flap, fb.flap, t);
      const kind = fa.kind;
      let ang = 0;
      const tp = this.phase * Math.PI * 2;
      if (kind === 'paired') {
        const row = sw.pectoralRow;
        if (fa.id === 'pectoralFin') ang = flap * row * (0.55 + 0.45 * Math.sin(this.time * 2.1 + lerp(fa.flapPhase, fb.flapPhase, t)));
        else ang = flap * (0.5 + 0.5 * Math.sin(this.time * 1.3 + 1.2));
        // 腔棘鱼式对角步态: 左胸鳍与右腹鳍同相
        if (sw.gait > 0) ang = lerp(ang, flap * 1.6 * Math.sin(this.time * 1.4 + (fa.id === 'pelvicFin' ? Math.PI : 0)), sw.gait);
      } else if (kind === 'dorsal' || kind === 'anal') {
        // 奇鳍左右拍动 (翻车鲀), 背鳍与臀鳍反相 → 合力推进
        ang = sw.medianFlap * Math.sin(tp) * (kind === 'dorsal' ? 1 : -1);
      }
      l.uFinAnim.value.set(ang, kind === 'paired' ? 0.4 : 0.8, lerp(fa.flutter, fb.flutter, t) * this.L * (0.3 + 0.7 * k), this.time * 7.0);
      l.uFinWave.value = lerp(fa.waves, fb.waves, t);
    }
    for (const u of this.updaters) u(this, dt);
  }

  /** 部件标注锚点 (世界坐标). */
  anchorWorld(p: Part, out = new THREE.Vector3()) {
    if (!p.anchorA) return null;
    out.copy(p.anchorA);
    if (p.anchorB && this.morph > 0) out.lerp(p.anchorB, this.morph);
    this.midline.deform(out, out);
    return this.root.localToWorld(out);
  }
}

export const _unused = smoothstep;
