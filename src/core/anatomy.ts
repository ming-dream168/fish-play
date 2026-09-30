// 把全部内部结构注册到 Fish 上: 肌肉, 体腔, 骨骼, 器官, 血管, 神经.

import * as THREE from 'three';
import type { Fish, Layer, CsRole } from './fish';
import type { BodyModel } from './body';
import type { GeomData, InstanceData } from './geom';
import type { StructureId } from '../data/types';
import { createLocal, makeBoneMaterial, makeTissueMaterial, patchFish, type PartFlags, type PartLocal } from './materials';
import { buildCavity, buildMuscle } from './parts/skin';
import { buildFinLobe, finFrame } from './parts/fins';
import {
  buildBranchiostegals,
  buildCaudalSkeleton,
  buildCentra,
  buildCentrumUnit,
  buildGillArches,
  buildHaemalArches,
  buildIntermuscular,
  buildJaws,
  buildLobedFinSkeleton,
  buildNeuralArches,
  buildNeurocranium,
  buildNotochord,
  buildOpercular,
  buildOtoliths,
  buildPectoralGirdle,
  buildPelvicGirdle,
  buildPterygiophores,
  buildRibs,
  centrumR,
  gillArchPath,
  spinePoint,
} from './parts/skeleton';
import {
  brainCenter,
  buildBrain,
  buildCaeca,
  buildGallBladder,
  buildGillFilaments,
  buildGonads,
  buildHeart,
  buildIntestine,
  buildKidney,
  buildLiver,
  buildRedMuscle,
  buildSpinalCord,
  buildSpleen,
  buildStomach,
  buildSwimBladder,
  buildSonicMuscle,
  buildUrinaryBladder,
  heartCenter,
  intestinePathCtrl,
  pylorus,
  swimBladderCenter,
} from './parts/organs';
import { buildVessels, vesselNetwork } from './parts/vessels';
import { buildPharyngealTeeth, buildWeberian, pharyngealAnchor, weberianAnchor } from './parts/special';
import { buildRectalGland, buildRete, buildRostralOrgan, reteAnchor } from './parts/extras';
import { lerp } from './math';

interface Def {
  key: string;
  sid: StructureId;
  layer: Layer;
  flags?: PartFlags;
  density: number;
  cs: CsRole;
  mat: (local: PartLocal, flags: PartFlags) => THREE.Material;
  build: (b: BodyModel) => GeomData;
  anchor?: (b: BodyModel) => THREE.Vector3;
}

export function addAnatomy(fish: Fish) {
  const sh = fish.shared;
  const M = (flags: PartFlags) => ({ morph: true, ...flags });

  const tissue = (color: THREE.ColorRepresentation, o: Parameters<typeof makeTissueMaterial>[4] = {}) => (local: PartLocal, flags: PartFlags) =>
    makeTissueMaterial(sh, color, flags, local, o);
  const bone = (color: THREE.ColorRepresentation = '#ebe3cc') => (local: PartLocal, flags: PartFlags) => makeBoneMaterial(sh, flags, local, color);

  const add = (d: Def) => {
    const local = createLocal();
    const flags = M(d.flags ?? {});
    const mat = d.mat(local, flags);
    return fish.addMeshPart({
      key: d.key,
      sid: d.sid,
      layer: d.layer,
      local,
      flags,
      density: d.density,
      cs: d.cs,
      mats: { anatomy: mat, living: mat },
      buildMesh: d.build,
      anchor: d.anchor,
    });
  };

  // ---------- 肌肉层 ----------
  const muscleLocal = createLocal({
    uMyo: { value: new THREE.Vector4(60, 1.4, 0.06, 0.2) },
    uMyoColor: { value: new THREE.Color('#e0643f') },
    uMyoRed: { value: new THREE.Vector4(0.08, 0, 0, 0) },
    uLen: { value: fish.L },
  });
  const muscleMat = patchFish(
    new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.42, clearcoat: 0.55, clearcoatRoughness: 0.2, sheen: 0.35, sheenColor: new THREE.Color('#ffd8c8'), side: THREE.DoubleSide }),
    sh,
    { morph: true, skin: true },
    muscleLocal,
    {
      key: 'muscle',
      fragPars: `uniform vec4 uMyo; uniform vec3 uMyoColor; uniform vec4 uMyoRed; uniform float uLen;`,
      color: /* glsl */ `
        {
          float s = vRest.x / uLen + 0.5;
          float h = vSkin.x;
          float lat = uMyo.w;
          float t = h >= lat ? (h - lat) / max(1.0 - lat, 0.1) : (h - lat) / max(1.0 + lat, 0.1);
          float at = abs(t);
          // W 形肌节: 水平隔处前凸, 背腹中部后凸
          float g = -cos(6.2831 * at * 0.95) * (1.0 - 0.35 * at);
          float ph = s * uMyo.x - uMyo.y * g;
          float d = abs(fract(ph) - 0.5);
          float septum = 1.0 - smoothstep(0.5 - uMyo.z, 0.5 - uMyo.z * 0.35, d);
          vec3 c = uMyoColor * (0.93 + 0.07 * sin(6.2831 * ph));
          c *= 0.9 + 0.2 * fishNoise(vRest * 60.0);
          // 表层红肌带
          float rw = uMyoRed.x * 1.6;
          float red = (1.0 - smoothstep(rw * 0.55, rw, abs(h - lat))) * (1.0 - uMyoRed.y);
          c = mix(c, vec3(0.42, 0.07, 0.08), red * 0.85);
          // 水平隔 (白线)
          float hs = 1.0 - smoothstep(0.004, 0.012, abs(h - lat));
          c = mix(c, vec3(0.97, 0.93, 0.88), max(septum * 0.75, hs * 0.6));
          if (!gl_FrontFacing) c = uMyoColor * 0.6;
          diffuseColor.rgb = c;
        }
      `,
    },
  );
  const muscle = fish.addMeshPart({
    key: 'muscle',
    sid: 'whiteMuscle',
    layer: 'muscle',
    local: muscleLocal,
    flags: { morph: true, skin: true },
    density: 0,
    cs: 'soft',
    mats: { anatomy: muscleMat, living: muscleMat },
    buildMesh: (b) => buildMuscle(b),
    anchor: (b) => b.bodyPoint(0.62, 0.45, 0.92),
  });
  add({ key: 'redMuscle', sid: 'redMuscle', layer: 'muscle', density: 0.01, cs: 'soft', mat: tissue('#7a1a1f', { roughness: 0.45 }), build: buildRedMuscle, anchor: (b) => b.bodyPoint(0.72, b.lateralH(0.72), 0.85) });

  // 体腔 (腹膜)
  add({
    key: 'cavity',
    sid: 'skin',
    layer: 'cavity',
    density: 0,
    cs: 'hidden',
    mat: tissue('#3a2e30', { roughness: 0.3, clearcoat: 0.8, sheen: 0.6, side: THREE.FrontSide }),
    build: buildCavity,
  });

  // ---------- 骨骼 ----------
  const centLocal = createLocal();
  const centFlags: PartFlags = { inst: true };
  fish.addInstPart({
    key: 'vertebrae',
    sid: 'vertebrae',
    layer: 'skeleton',
    local: centLocal,
    flags: centFlags,
    density: 3.4,
    cs: 'bone',
    mats: { anatomy: makeBoneMaterial(sh, centFlags, centLocal, '#efe7d2', 'bone-inst') },
    unit: buildCentrumUnit(),
    buildInst: (b): InstanceData => buildCentra(b),
    anchor: (b) => spinePoint(b, 0.62).add(new THREE.Vector3(0, 0, centrumR(b, 0.62))),
  });
  add({ key: 'notochord', sid: 'notochord', layer: 'skeleton', density: 0.6, cs: 'soft', mat: tissue('#e9dcc0', { roughness: 0.3, sheen: 0.6 }), build: buildNotochord, anchor: (b) => spinePoint(b, 0.55) });
  add({ key: 'neural', sid: 'neuralSpines', layer: 'skeleton', density: 3.2, cs: 'bone', mat: bone(), build: buildNeuralArches, anchor: (b) => spinePoint(b, 0.5).add(new THREE.Vector3(0, b.top(0.5) * b.L * 0.45, 0)) });
  add({ key: 'haemal', sid: 'haemalSpines', layer: 'skeleton', density: 3.2, cs: 'bone', mat: bone(), build: buildHaemalArches, anchor: (b) => spinePoint(b, 0.8).add(new THREE.Vector3(0, -b.bottom(0.8) * b.L * 0.45, 0)) });
  add({ key: 'ribs', sid: 'ribs', layer: 'skeleton', density: 3.4, cs: 'bone', mat: bone(), build: buildRibs, anchor: (b) => { const c = b.spec.organs.cavity; return b.cavityPoint(lerp(c.s0, c.s1, 0.55), -0.1, 1.07); } });
  add({ key: 'intermuscular', sid: 'intermuscularBones', layer: 'skeleton', density: 6.0, cs: 'bone', mat: bone('#f1ead8'), build: buildIntermuscular, anchor: (b) => spinePoint(b, 0.42).add(new THREE.Vector3(b.L * 0.01, b.top(0.42) * b.L * 0.25, b.width(0.42) * b.L * 0.4)) });
  add({ key: 'pterygiophores', sid: 'pterygiophores', layer: 'skeleton', density: 3.6, cs: 'bone', mat: bone(), build: buildPterygiophores, anchor: (b) => { const f = b.spec.fins[0]; return b.bodyPoint(lerp(f.s0, f.s1, 0.4), 0.65, 0); } });
  add({ key: 'neurocranium', sid: 'neurocranium', layer: 'skeleton', density: 0.6, cs: 'bone', mat: bone(), build: buildNeurocranium, anchor: (b) => b.bodyPoint(b.spec.skeleton.spineStart - 0.04, 0.72, 0.35) });
  add({ key: 'jaws', sid: 'jaws', layer: 'skeleton', flags: { jaw: true }, density: 3.6, cs: 'bone', mat: bone(), build: buildJaws, anchor: (b) => b.surface(b.spec.mouth.corner * 0.55, b.mouthTheta(b.spec.mouth.corner * 0.55) - 0.25, 0.006) });
  add({ key: 'opercular', sid: 'opercularSeries', layer: 'skeleton', flags: { oper: true }, density: 2.6, cs: 'bone', mat: bone(), build: buildOpercular, anchor: (b) => b.surface(b.opEdgeS(0.25) - 0.025, b.thetaAt(b.opEdgeS(0.25) - 0.025, 0.25), 0.004) });
  add({ key: 'gillArches', sid: 'gillArches', layer: 'skeleton', density: 3.0, cs: 'bone', mat: bone('#efe0cf'), build: buildGillArches, anchor: (b) => gillArchPath(b, 1, 1, 12)[5] });
  add({ key: 'branchiostegals', sid: 'branchiostegals', layer: 'skeleton', density: 4.0, cs: 'bone', mat: bone(), build: buildBranchiostegals, anchor: (b) => b.surface(b.spec.gill.arches[0], b.thetaAt(b.spec.gill.arches[0], -0.88), 0.005) });
  add({ key: 'otoliths', sid: 'otoliths', layer: 'skeleton', density: 9.0, cs: 'bone', mat: bone('#fbf7ee'), build: buildOtoliths, anchor: (b) => b.bodyPoint(lerp(b.spec.eye.s, b.spec.skeleton.spineStart, 0.62), 0.05, 0.32) });
  add({ key: 'weberian', sid: 'weberianApparatus', layer: 'skeleton', density: 5.0, cs: 'bone', mat: bone('#f7efdc'), build: buildWeberian, anchor: weberianAnchor });
  add({ key: 'pharyngealTeeth', sid: 'pharyngealTeeth', layer: 'skeleton', density: 6.0, cs: 'bone', mat: bone('#f6ecd4'), build: buildPharyngealTeeth, anchor: pharyngealAnchor });
  add({ key: 'pectoralGirdle', sid: 'pectoralGirdle', layer: 'skeleton', density: 3.6, cs: 'bone', mat: bone(), build: buildPectoralGirdle, anchor: (b) => b.surface(b.opEdgeS(-0.3) + 0.006, b.thetaAt(b.opEdgeS(-0.3) + 0.006, -0.3), 0.009) });
  add({ key: 'pelvicGirdle', sid: 'pelvicGirdle', layer: 'skeleton', density: 3.2, cs: 'bone', mat: bone(), build: buildPelvicGirdle, anchor: (b) => { const f = b.spec.fins.find((x) => x.id === 'pelvicFin')!; return finFrame(b, f).base.clone(); } });
  add({ key: 'caudalSkeleton', sid: 'caudalSkeleton', layer: 'skeleton', density: 3.6, cs: 'bone', mat: bone(), build: buildCaudalSkeleton, anchor: (b) => spinePoint(b, 0.985) });
  add({ key: 'lobedSkeleton', sid: 'lobedFinSkeleton', layer: 'skeleton', density: 3.4, cs: 'bone', mat: bone(), build: buildLobedFinSkeleton, anchor: (b) => { const f = b.spec.fins.find((x) => x.id === 'pectoralFin')!; const fr = finFrame(b, f); return (fr.lobeEnd ?? fr.base).clone().lerp(fr.base, 0.5); } });

  // 肉鳍的有鳞鳍柄 (外观, 随鳍一起动)
  for (const id of ['pectoralFin', 'pelvicFin', 'secondDorsalFin', 'analFin'] as const) {
    const finPart = fish.parts.find((p) => p.key === 'fin:' + id)!;
    const local = createLocal();
    local.uFinBase = finPart.local.uFinBase;
    local.uFinAxis = finPart.local.uFinAxis;
    local.uFinAnim = finPart.local.uFinAnim;
    const mat = patchFish(new THREE.MeshPhysicalMaterial({ color: '#233447', roughness: 0.6, clearcoat: 0.15 }), sh, { morph: true, fin: true }, local, {
      key: 'lobe',
      fragPars: `uniform vec3 uLobeColor;`,
      color: /* glsl */ `
        diffuseColor.rgb = uLobeColor * (0.85 + 0.3 * fishNoise(vRest * 60.0));
      `,
    });
    // 颜色每帧跟随该鳍的 color (fish.ts)
    local.uLobeColor = { value: new THREE.Color('#6b5a44') };
    const p = fish.addMeshPart({
      key: 'lobe:' + id,
      sid: 'lobedFinSkeleton',
      layer: 'skin',
      local,
      flags: { morph: true, fin: true },
      density: 0.3,
      cs: 'skin',
      mats: { living: mat, anatomy: mat },
      buildMesh: (b) => buildFinLobe(b, b.spec.fins.find((x) => x.id === id)!),
    });
    p.fin = id;
    p.lobe = true;
  }

  // ---------- 神经 ----------
  add({ key: 'brain', sid: 'brain', layer: 'nerves', density: 0.02, cs: 'soft', mat: (l, f) => makeTissueMaterial(sh, '#ffffff', f, l, { roughness: 0.35, sheen: 0.6, key: 'vcol', vertexColors: true }), build: buildBrain, anchor: (b) => brainCenter(b) });
  add({ key: 'spinalCord', sid: 'spinalCord', layer: 'nerves', density: 0.02, cs: 'soft', mat: tissue('#f1e3cf', { roughness: 0.3, sheen: 0.6 }), build: buildSpinalCord, anchor: (b) => spinePoint(b, 0.35).add(new THREE.Vector3(0, centrumR(b, 0.35) * 1.6, 0)) });

  // ---------- 呼吸 ----------
  add({
    key: 'gills',
    sid: 'gills',
    layer: 'organs',
    flags: { pulse: true },
    density: 0.08,
    cs: 'soft',
    mat: (l, f) =>
      makeTissueMaterial(sh, '#c61f36', f, l, {
        roughness: 0.4,
        sheen: 0.7,
        side: THREE.DoubleSide,
        key: 'gill',
        pattern: /* glsl */ `
          float lam = 0.5 + 0.5 * sin(vRest.x * 900.0 + vRest.y * 700.0);
          diffuseColor.rgb *= 0.75 + 0.35 * lam;
        `,
      }),
    build: buildGillFilaments,
    anchor: (b) => gillArchPath(b, 2, 1, 12)[4].add(new THREE.Vector3(0.012 * b.L, 0, 0.012 * b.L)),
  });

  // ---------- 循环 ----------
  add({ key: 'heart', sid: 'heart', layer: 'vessels', flags: { pulse: true }, density: 0.05, cs: 'soft', mat: (l, f) => makeTissueMaterial(sh, '#ffffff', f, l, { roughness: 0.3, sheen: 0.5, key: 'vcol-pulse', vertexColors: true }), build: buildHeart, anchor: (b) => heartCenter(b) });
  const flowPattern = (base: string) => /* glsl */ `
    float pulse = pow(0.5 + 0.5 * sin((vFlow * 60.0 - uTime * 5.0)), 6.0);
    diffuseColor.rgb = ${base} * (0.85 + 0.4 * pulse);
  `;
  add({ key: 'arteries', sid: 'dorsalAorta', layer: 'vessels', flags: { flow: true }, density: 0.03, cs: 'soft', mat: tissue('#cc1f2d', { roughness: 0.3, sheen: 0.5, key: 'artery', pattern: flowPattern('diffuseColor.rgb') }), build: (b) => buildVessels(b, 'artery'), anchor: (b) => spinePoint(b, 0.52).add(new THREE.Vector3(0, -centrumR(b, 0.52) * 1.5, 0)) });
  add({ key: 'deoxy', sid: 'ventralAorta', layer: 'vessels', flags: { flow: true }, density: 0.03, cs: 'soft', mat: tissue('#6b3294', { roughness: 0.3, sheen: 0.5, key: 'deoxy', pattern: flowPattern('diffuseColor.rgb') }), build: (b) => buildVessels(b, 'deoxy'), anchor: (b) => vesselNetwork(b)[0].pts[10] });
  add({ key: 'veins', sid: 'veins', layer: 'vessels', flags: { flow: true }, density: 0.03, cs: 'soft', mat: tissue('#2b4ea8', { roughness: 0.3, sheen: 0.5, key: 'vein', pattern: flowPattern('diffuseColor.rgb') }), build: (b) => buildVessels(b, 'vein'), anchor: (b) => { const v = vesselNetwork(b).find((x) => x.name === 'postCardL')!; return v.pts[8]; } });
  add({ key: 'spleen', sid: 'spleen', layer: 'organs', density: 0.04, cs: 'soft', mat: tissue('#4a0f1c', { roughness: 0.35 }), build: buildSpleen, anchor: (b) => { const st = b.spec.organs.stomach; return b.cavityPoint(lerp(st.s0, st.s1, 0.65), 0.05, 0.42); } });

  // ---------- 消化 ----------
  const liverColor = fish.specA.organs.liver.color;
  const liver = add({ key: 'liver', sid: 'liver', layer: 'organs', density: 0.05, cs: 'soft', mat: tissue(liverColor, { roughness: 0.32, clearcoat: 0.8 }), build: buildLiver, anchor: (b) => { const lv = b.spec.organs.liver; return b.cavityPoint(lerp(lv.s0, lv.s1, 0.4), -0.2, 0.45); } });
  liver.colorKey = 'liver';
  add({ key: 'gallBladder', sid: 'gallBladder', layer: 'organs', density: 0.02, cs: 'soft', mat: tissue('#2f7a3a', { roughness: 0.2, clearcoat: 1, sheen: 0.2 }), build: buildGallBladder, anchor: (b) => { const lv = b.spec.organs.liver; return b.cavityPoint(lerp(lv.s0, lv.s1, 0.55), -0.5, -0.12); } });
  add({ key: 'stomach', sid: 'stomach', layer: 'organs', density: 0.03, cs: 'soft', mat: tissue('#d99a86', { roughness: 0.34 }), build: buildStomach, anchor: (b) => { const st = b.spec.organs.stomach; return b.cavityPoint(lerp(st.s0, st.s1, 0.5), 0.0, 0.2); } });
  add({ key: 'caeca', sid: 'pyloricCaeca', layer: 'organs', density: 0.03, cs: 'soft', mat: tissue('#ecd2a9', { roughness: 0.35 }), build: buildCaeca, anchor: (b) => { const p = pylorus(b); return b.cavityPoint(p.s + 0.02, p.v - 0.25, p.u); } });
  add({ key: 'intestine', sid: 'intestine', layer: 'organs', density: 0.04, cs: 'soft', mat: tissue('#d4a28b', { roughness: 0.34 }), build: buildIntestine, anchor: (b) => { const ip = intestinePathCtrl(b); const c = ip[4]; return b.cavityPoint(c[0], c[1], c[2]); } });

  // ---------- 浮力, 排泄, 生殖 ----------
  const bladder = add({
    key: 'swimBladder',
    sid: 'swimBladder',
    layer: 'organs',
    flags: { pulse: true },
    density: -1,
    cs: 'soft',
    mat: (l, f) => makeTissueMaterial(sh, '#e9eef0', f, l, { roughness: 0.22, metal: 0.35, sheen: 0.8, clearcoat: 1, key: 'bladder' }),
    build: buildSwimBladder,
    anchor: (b) => swimBladderCenter(b).add(new THREE.Vector3(0, 0, b.cavityFrame(b.spec.organs.swimBladder.s0 * 0.5 + b.spec.organs.swimBladder.s1 * 0.5).hw * b.L * 0.4)),
  });
  bladder.colorKey = 'bladder';
  add({ key: 'kidney', sid: 'kidney', layer: 'organs', density: 0.04, cs: 'soft', mat: tissue('#5a1820', { roughness: 0.35 }), build: buildKidney, anchor: (b) => spinePoint(b, 0.4).add(new THREE.Vector3(0, -centrumR(b, 0.4) * 2.2, 0)) });
  add({ key: 'urinaryBladder', sid: 'urinaryBladder', layer: 'organs', density: 0.01, cs: 'soft', mat: tissue('#eadbb3', { roughness: 0.2, clearcoat: 1 }), build: buildUrinaryBladder, anchor: (b) => b.cavityPoint(b.spec.organs.cavity.s1 - 0.02, -0.1, 0) });
  const gonad = add({
    key: 'gonad',
    sid: 'gonad',
    layer: 'organs',
    density: 0.08,
    cs: 'soft',
    mat: (local, flags) => {
      local.uEggs = { value: 1 };
      return makeTissueMaterial(sh, fish.specA.organs.gonad.color, flags, local, {
      roughness: 0.25,
      clearcoat: 1,
      key: 'gonad',
      fragPars: `uniform float uEggs;`,
      pattern: /* glsl */ `
        // 卵粒: 细胞噪声的圆点
        vec3 q = vRest * 260.0;
        vec3 i = floor(q);
        vec3 f = fract(q);
        float md = 1.0;
        for (int z = -1; z <= 1; z++) for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
          vec3 g = vec3(float(x), float(y), float(z));
          vec3 o = vec3(fishHash(i + g), fishHash(i + g + 7.1), fishHash(i + g + 3.3));
          md = min(md, length(g + o - f));
        }
        // 卵巢是一粒粒卵; 精巢表面光滑乳白, 只有浅浅的分叶
        float eggs = 0.72 + 0.4 * (1.0 - smoothstep(0.1, 0.55, md));
        float milt = 0.9 + 0.14 * fishFbm(vRest * 40.0);
        diffuseColor.rgb *= mix(milt, eggs, uEggs);
      `,
      });
    },
    build: buildGonads,
    anchor: (b) => { const g = b.spec.organs.gonad; return b.cavityPoint(lerp(g.s0, g.s1, 0.55), 0.0, 0.55); },
  });
  gonad.colorKey = 'gonad';
  muscle.colorKey = 'muscle';

  // ---------- 物种特化的内部结构 ----------
  add({ key: 'rostralOrgan', sid: 'rostralOrgan', layer: 'nerves', density: 0.02, cs: 'soft', mat: tissue('#f3e6c9', { roughness: 0.2, clearcoat: 1, sheen: 0.8 }), build: buildRostralOrgan, anchor: (b) => b.bodyPoint(b.spec.eye.s * 0.55, 0.25, 0.5) });
  add({ key: 'rectalGland', sid: 'rectalGland', layer: 'organs', density: 0.03, cs: 'soft', mat: tissue('#c98f7a', { roughness: 0.3 }), build: buildRectalGland, anchor: (b) => b.cavityPoint(b.spec.organs.cavity.s1 - 0.06, 0.3, 0.2) });
  add({
    key: 'sonicMuscle',
    sid: 'sonicMuscle',
    layer: 'organs',
    flags: { pulse: true },
    density: 0.01,
    cs: 'soft',
    mat: tissue('#a5212f', { roughness: 0.42, sheen: 0.5 }),
    build: buildSonicMuscle,
    anchor: (b) => { const sb = b.spec.organs.swimBladder; return b.cavityPoint(lerp(sb.s0, sb.s1, 0.3), sb.v - 0.24, 0.95); },
  });
  add({ key: 'rete', sid: 'rete', layer: 'vessels', density: 0.03, cs: 'soft', mat: (l, f) => makeTissueMaterial(sh, '#ffffff', f, l, { roughness: 0.3, sheen: 0.5, key: 'vcol-rete', vertexColors: true }), build: buildRete, anchor: (b) => reteAnchor(b) });
  fish.rebuild();
}
