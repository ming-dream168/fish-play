// 底栖甲壳动物 (中华绒螯蟹, 日本沼虾) 的程序化模型. 甲壳动物的体制 (外骨骼, 分节附肢) 与鱼体蓝图不同源,
// 不能和鱼逐顶点插值, 所以单独搭: 每条附肢是一串关节 (底节 → 座节 → 长节 → 腕节 → 掌节 → 指节), 关节用 Group 嵌套,
// 动画只转关节. 坐标: 蟹的前方朝 +z (朝向镜头), 两侧步足沿 ±x 展开; 虾的头朝 -x, 与鱼一致.

import * as THREE from 'three';

export type CrustaceanId = 'mittencrab' | 'riverprawn';

export interface CrustPart {
  key: string;
  zh: string;
  anchor: THREE.Object3D; // 标注引线指向这个节点的世界坐标
}

// 简单的确定性随机, 保证每次生成的颗粒, 刚毛位置一样
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function hash3(x: number, y: number, z: number) {
  const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return h - Math.floor(h);
}
// 三维值噪声 (够用来做甲壳的颗粒与斑驳)
function noise3(x: number, y: number, z: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  const xf = x - xi;
  const yf = y - yi;
  const zf = z - zi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const w = zf * zf * (3 - 2 * zf);
  let out = 0;
  for (let dx = 0; dx < 2; dx++)
    for (let dy = 0; dy < 2; dy++)
      for (let dz = 0; dz < 2; dz++) {
        const k = (dx ? u : 1 - u) * (dy ? v : 1 - v) * (dz ? w : 1 - w);
        out += k * hash3(xi + dx, yi + dy, zi + dz);
      }
  return out;
}

function shell(color: string, o: Partial<THREE.MeshPhysicalMaterialParameters> = {}) {
  return new THREE.MeshPhysicalMaterial({ color, roughness: 0.42, metalness: 0, clearcoat: 0.6, clearcoatRoughness: 0.35, ...o });
}

/** 一节附肢: 沿 +x 伸出, 基部在原点. r0/r1 为基部/末端半径, flat 为 z 向压扁比例. */
function segGeo(len: number, r0: number, r1: number, flat = 1, bulge = 0.15) {
  const pts: THREE.Vector2[] = [];
  const n = 14;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    // 两端收圆, 中段略鼓 (像真实附肢节)
    // 两端只略收 (关节处相邻两节互相嵌一点, 不留缝)
    const end = 0.62 + 0.38 * Math.pow(Math.sin(Math.PI * t), 0.35);
    const r = THREE.MathUtils.lerp(r0, r1, t) * (1 + bulge * Math.sin(Math.PI * t)) * end;
    pts.push(new THREE.Vector2(Math.max(0.0005, r), -0.25 * r0 + t * (len + 0.5 * r0)));
  }
  const g = new THREE.LatheGeometry(pts, 12);
  g.rotateZ(-Math.PI / 2);
  g.scale(1, 1, flat);
  return g;
}

interface Joint {
  g: THREE.Group;
  base: THREE.Euler;
}

/** 一串关节. segs: [长度, 基部半径, 末端半径]; 返回每个关节组 (第 i 个关节组位于第 i 节基部). */
function limb(parent: THREE.Object3D, segs: [number, number, number][], mat: THREE.Material, flat = 1): { joints: Joint[]; tip: THREE.Object3D; meshes: THREE.Mesh[] } {
  let p: THREE.Object3D = parent;
  const joints: Joint[] = [];
  const meshes: THREE.Mesh[] = [];
  for (const [len, r0, r1] of segs) {
    const g = new THREE.Group();
    p.add(g);
    const m = new THREE.Mesh(segGeo(len, r0, r1, flat), mat);
    g.add(m);
    meshes.push(m);
    joints.push({ g, base: new THREE.Euler() });
    const end = new THREE.Group();
    end.position.x = len;
    g.add(end);
    p = end;
  }
  return { joints, tip: p, meshes };
}

function setBase(j: Joint, x: number, y: number, z: number) {
  j.base.set(x, y, z);
  j.g.rotation.set(x, y, z);
}

/** 刚毛: 在一节附肢表面撒一层细毛 (InstancedMesh). side: 只长在 +z / -z / 全部. */
function setae(seg: THREE.Mesh, count: number, len: number, color: string, seed: number, region: (t: number, a: number) => boolean, thick = 1) {
  const geo = new THREE.CylinderGeometry(0.0035 * thick, 0.0012 * thick, 1, 3, 1);
  geo.translate(0, 0.5, 0);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.95 });
  const im = new THREE.InstancedMesh(geo, mat, count);
  const pos = seg.geometry.getAttribute('position') as THREE.BufferAttribute;
  const nor = seg.geometry.getAttribute('normal') as THREE.BufferAttribute;
  seg.geometry.computeBoundingBox();
  const bb = seg.geometry.boundingBox!;
  const r = rng(seed);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const p = new THREE.Vector3();
  const nv = new THREE.Vector3();
  let k = 0;
  let guard = 0;
  while (k < count && guard++ < count * 40) {
    const i = Math.floor(r() * pos.count);
    p.fromBufferAttribute(pos, i);
    nv.fromBufferAttribute(nor, i);
    const t = (p.x - bb.min.x) / Math.max(1e-6, bb.max.x - bb.min.x);
    const a = Math.atan2(p.z, p.y);
    if (!region(t, a)) continue;
    // 毛顺着附肢向末端倒伏
    nv.x += 0.9;
    nv.y += (r() - 0.5) * 0.6;
    nv.z += (r() - 0.5) * 0.6;
    nv.normalize();
    q.setFromUnitVectors(up, nv);
    const l = len * (0.55 + 0.6 * r());
    m.compose(p, q, new THREE.Vector3(1, l, 1));
    im.setMatrixAt(k++, m);
  }
  im.count = k;
  seg.add(im);
  return im;
}

export class Crustacean {
  readonly root = new THREE.Group();
  id: CrustaceanId | null = null;
  parts: CrustPart[] = [];
  private model: THREE.Group | null = null;
  private anim: (t: number, dt: number) => void = () => {};
  private time = 0;
  private appear = 0;
  /** 静止时的包围盒 (本体坐标) */
  box = new THREE.Box3();

  get active() {
    return this.id !== null;
  }

  show(id: CrustaceanId) {
    this.clear();
    this.id = id;
    const g = id === 'mittencrab' ? this.buildCrab() : this.buildPrawn();
    this.model = g;
    this.root.add(g);
    this.root.visible = true;
    this.appear = 0;
    this.anim(0, 0);
    // 取景用的包围盒不算水底的阴影
    const shadows = g.children.filter((o) => o.userData.shadow);
    shadows.forEach((o) => g.remove(o));
    this.root.updateMatrixWorld(true);
    this.box.setFromObject(g, true);
    shadows.forEach((o) => g.add(o));
  }

  hide() {
    this.clear();
    this.root.visible = false;
  }

  private clear() {
    if (this.model) {
      this.root.remove(this.model);
      this.model.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat?.dispose();
      });
    }
    this.model = null;
    this.id = null;
    this.parts = [];
    this.anim = () => {};
  }

  update(dt: number, speed: number) {
    if (!this.model) return;
    this.time += dt * speed;
    this.appear = Math.min(1, this.appear + dt / 0.9);
    const e = 1 - Math.pow(1 - this.appear, 3);
    this.model.scale.setScalar(0.6 + 0.4 * e);
    this.model.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.Material | undefined;
      if (m && 'opacity' in m) {
        const base = (m.userData.baseOpacity ??= m.opacity) as number;
        m.transparent = base < 1 || e < 1;
        m.opacity = base * e;
      }
    });
    this.anim(this.time, dt);
  }

  // ---------------------------------------------------------------- 中华绒螯蟹
  private buildCrab(): THREE.Group {
    const G = new THREE.Group();
    const body = new THREE.Group();
    body.position.y = 0.55;
    G.add(body);
    const W = 1.5; // 头胸甲宽
    const Lc = 1.36; // 头胸甲长
    const H = 0.27;

    // 头胸甲: 方圆形 (前窄后宽的圆角方形), 背面隆起, 有 H 形沟和疣状颗粒
    const cg = new THREE.SphereGeometry(1, 112, 56);
    // 球的两极转到前后缘, 免得极点的三角扇在背甲正中留下褶痕
    cg.rotateX(Math.PI / 2);
    const pos = cg.getAttribute('position') as THREE.BufferAttribute;
    const col = new Float32Array(pos.count * 3);
    const cDark = new THREE.Color('#1e150b');
    const cMid = new THREE.Color('#3a2914');
    const cLight = new THREE.Color('#6e5228');
    const cBelly = new THREE.Color('#d9cfae');
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);
      const rho = Math.hypot(x, z);
      const phi = Math.atan2(z, x);
      // 圆角方形轮廓
      const n = 3.2;
      const se = 1 / Math.pow(Math.pow(Math.abs(Math.cos(phi)), n) + Math.pow(Math.abs(Math.sin(phi)), n), 1 / n);
      let sx = (W / 2) * se;
      const sz = (Lc / 2) * se;
      const front = Math.max(0, Math.sin(phi)); // z>0 为前
      sx *= 1 - 0.13 * front * front;
      x = Math.cos(phi) * rho * sx;
      z = Math.sin(phi) * rho * sz;
      const u = x / (W / 2);
      const v = z / (Lc / 2);
      if (y > 0) {
        // 背甲: 平缓隆起, 额区略低
        y = y * H * (0.82 + 0.1 * Math.cos(v * 1.4)) - 0.04 * Math.max(0, v - 0.55);
        // H 形沟: 两条纵沟 + 中部横沟 (胃区与心区之间)
        const hy = Math.exp(-Math.pow((Math.abs(u) - 0.3) / 0.05, 2)) * Math.exp(-Math.pow(v / 0.38, 2));
        const hx = Math.exp(-Math.pow((v + 0.02) / 0.05, 2)) * Math.exp(-Math.pow(u / 0.32, 2));
        const groove = Math.min(1, hy + hx);
        const gran = noise3(x * 26, y * 26, z * 26);
        y += (-0.035 * groove + 0.012 * gran) * Math.min(1, y * 8);
        const mott = noise3(x * 4 + 3, 0, z * 4);
        c.copy(cMid).lerp(cDark, 0.55 * groove + 0.5 * mott).lerp(cLight, Math.max(0, gran - 0.62) * 1.6);
        // 甲缘稍浅
        c.lerp(cLight, Math.max(0, Math.min(1, (rho - 0.9) * 6)) * 0.4);
      } else {
        y = y * 0.2;
        c.copy(cBelly).lerp(cLight, 0.25 + 0.2 * noise3(x * 10, 1, z * 10));
      }
      pos.setXYZ(i, x, y, z);
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    cg.setAttribute('color', new THREE.BufferAttribute(col, 3));
    cg.computeVertexNormals();
    const shellMat = shell('#ffffff', { vertexColors: true, roughness: 0.62, clearcoat: 0.25, clearcoatRoughness: 0.5 });
    const cara = new THREE.Mesh(cg, shellMat);
    body.add(cara);

    const spineMat = shell('#4a4128', { roughness: 0.5 });
    // 额缘 4 个额齿, 前侧缘每侧 4 个侧齿 (最后一个最小)
    const cone = (r: number, h: number) => {
      const g = new THREE.ConeGeometry(r, h, 8);
      g.rotateX(Math.PI / 2);
      g.translate(0, 0, h / 2);
      return g;
    };
    for (let i = 0; i < 4; i++) {
      const x = (i - 1.5) * 0.11;
      const t = new THREE.Mesh(cone(0.035, 0.08), spineMat);
      t.position.set(x, 0.05, Lc / 2 - 0.02);
      body.add(t);
    }
    for (const sgn of [-1, 1]) {
      for (let i = 0; i < 4; i++) {
        const a = 0.5 - i * 0.28; // 从前外角向后
        const x = sgn * (W / 2) * (0.78 + i * 0.07);
        const z = (Lc / 2) * (0.62 - i * 0.24);
        const t = new THREE.Mesh(cone(0.04 - i * 0.006, 0.11 - i * 0.018), spineMat);
        t.position.set(x, 0.04, z);
        t.rotation.y = sgn * (Math.PI / 2 - a);
        body.add(t);
      }
    }

    // 复眼: 眼柄 + 黑色眼球, 位于额齿两侧的眼眶里
    const eyeMat = new THREE.MeshPhysicalMaterial({ color: '#0b0a08', roughness: 0.15, clearcoat: 1 });
    const stalkMat = shell('#7a6a3c');
    const eyes: THREE.Group[] = [];
    for (const sgn of [-1, 1]) {
      const eg = new THREE.Group();
      eg.position.set(sgn * 0.3, 0.07, Lc / 2 - 0.08);
      eg.rotation.y = sgn * 0.5;
      const st = new THREE.Mesh(segGeo(0.12, 0.03, 0.03), stalkMat);
      st.rotation.y = -Math.PI / 2;
      eg.add(st);
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 12), eyeMat);
      ball.position.set(0, 0.01, 0.12);
      eg.add(ball);
      body.add(eg);
      eyes.push(eg);
    }
    // 第二触角, 小而短
    const antMat = shell('#8a7442');
    for (const sgn of [-1, 1]) {
      const a = new THREE.Mesh(segGeo(0.16, 0.008, 0.003), antMat);
      a.position.set(sgn * 0.17, 0.03, Lc / 2 - 0.02);
      a.rotation.set(0, -Math.PI / 2 + sgn * -0.3, 0.3);
      body.add(a);
    }

    // 腹面的腹部 (雌圆雄三角, 这里做成雄蟹的窄三角形) 折在头胸甲下
    const abd = new THREE.Mesh(new THREE.CircleGeometry(0.28, 3), shell('#e2d8b8', { side: THREE.DoubleSide }));
    abd.rotation.x = Math.PI / 2;
    abd.rotation.z = -Math.PI / 2;
    abd.position.set(0, -0.075, -0.05);
    abd.scale.set(1.4, 0.8, 1);
    body.add(abd);

    const legMat = shell('#a8843e', { roughness: 0.5, clearcoat: 0.35 });
    const legDark = shell('#7c6230', { roughness: 0.5, clearcoat: 0.35 });
    const tipMat = shell('#3b2a14', { roughness: 0.4 });
    type Leg = { coxa: Joint; merus: Joint; carpus: Joint; prop: Joint; dact: Joint; sgn: number; phase: number };
    const legs: Leg[] = [];
    const sides: THREE.Group[] = [];
    for (const sgn of [-1, 1]) {
      const side = new THREE.Group();
      side.scale.x = sgn; // 左侧镜像
      body.add(side);
      sides.push(side);
      // 4 对步足: 从前侧缘到后侧缘, 第 2, 3 对最长; 长节, 前节扁平, 前节与指节边缘有刚毛
      const anchors: [number, number, number][] = [
        [0.66, 0.24, 1.0],
        [0.7, 0.02, 1.12],
        [0.66, -0.22, 1.1],
        [0.55, -0.44, 0.92],
      ];
      anchors.forEach(([ax, az, k], i) => {
        const root = new THREE.Group();
        root.position.set(ax, -0.04, az);
        side.add(root);
        const { joints, meshes } = limb(
          root,
          [
            [0.16, 0.07, 0.065],
            [0.72 * k, 0.07, 0.055],
            [0.34 * k, 0.05, 0.045],
            [0.42 * k, 0.045, 0.03],
            [0.36 * k, 0.03, 0.004],
          ],
          legMat,
          0.55,
        );
        meshes[1].material = legDark;
        meshes[4].material = tipMat;
        const [coxa, merus, carpus, prop, dact] = joints;
        // 静止姿态: 向外伸, 长节上抬, 腕节下折, 指节点地; 越靠后的足越向后指
        const yaw = 0.42 - i * 0.36;
        setBase(coxa, 0, yaw, -0.25);
        setBase(merus, 0, 0, 0.52);
        setBase(carpus, 0, 0, -0.75);
        setBase(prop, 0, 0, -0.42);
        setBase(dact, 0, 0, -0.38);
        // 前节与指节的长刚毛 (绒螯蟹步足的特征之一)
        setae(meshes[3], 140, 0.05, '#5a4120', 11 + i * 7 + (sgn > 0 ? 100 : 0), (t, a) => Math.abs(a) > 0.8 && t > 0.05);
        setae(meshes[2], 60, 0.035, '#5a4120', 17 + i * 5 + (sgn > 0 ? 100 : 0), (t, a) => Math.abs(a) > 1.2);
        legs.push({ coxa, merus, carpus, prop, dact, sgn, phase: (i % 2 === 0 ? 0 : Math.PI) + (sgn > 0 ? Math.PI : 0) });
      });
    }

    // 螯足: 长节 → 腕节 → 掌节 (鼓起的大螯), 掌节外侧与内侧密生棕色绒毛 ("绒螯")
    const clawMat = shell('#8f6e38', { roughness: 0.5 });
    const fingerMat = shell('#b49464', { roughness: 0.35 });
    const chelae: { arm: Joint; carpus: Joint; dact: THREE.Group; sgn: number }[] = [];
    let clawAnchor: THREE.Object3D | null = null;
    let mittenAnchor: THREE.Object3D | null = null;
    for (const side of sides) {
      const sgn = side.scale.x;
      const root = new THREE.Group();
      root.position.set(0.48, -0.02, 0.5);
      side.add(root);
      const { joints, tip, meshes } = limb(
        root,
        [
          [0.12, 0.07, 0.07],
          [0.42, 0.075, 0.07],
          [0.26, 0.08, 0.09],
        ],
        clawMat,
        0.75,
      );
      const [cox, merus, carpus] = joints;
      setBase(cox, 0, -0.55, -0.15);
      setBase(merus, 0, -0.75, 0.55);
      setBase(carpus, 0, -1.05, -0.3);
      setae(meshes[2], 60, 0.03, '#4a3418', 51 + (sgn > 0 ? 9 : 0), () => true);
      // 掌节: 鼓胀的椭球, 末端接不动指
      const palmG = new THREE.Group();
      tip.add(palmG);
      palmG.rotation.set(0, -0.2, -0.25);
      const palm = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), clawMat);
      palm.scale.set(0.24, 0.17, 0.11);
      palm.position.x = 0.2;
      palmG.add(palm);
      // 绒毛: 掌节远端 2/3 一圈密毛
      const fur = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 24), new THREE.MeshStandardMaterial({ color: '#4b311a', roughness: 1 }));
      fur.scale.set(0.2, 0.185, 0.13);
      fur.position.set(0.26, -0.005, 0);
      palmG.add(fur);
      // 毛长在单位球坐标里给, 随绒毛团一起缩放
      setae(fur, 900, 0.45, '#5b3b1d', 77 + (sgn > 0 ? 3 : 0), (t) => t > 0.08, 6);
      // 不动指与可动指, 白色指尖
      const fixed = new THREE.Mesh(segGeo(0.26, 0.045, 0.01, 0.7), fingerMat);
      fixed.position.set(0.4, -0.06, 0);
      fixed.rotation.z = 0.05;
      palmG.add(fixed);
      const dact = new THREE.Group();
      dact.position.set(0.38, 0.05, 0);
      palmG.add(dact);
      const dm = new THREE.Mesh(segGeo(0.28, 0.045, 0.01, 0.7), fingerMat);
      dm.rotation.z = -0.12;
      dact.add(dm);
      chelae.push({ arm: merus, carpus, dact, sgn });
      if (sgn > 0) {
        clawAnchor = dact;
        mittenAnchor = fur;
      }
    }

    // 底面的柔和阴影, 表明它趴在水底
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshBasicMaterial({ map: blobTex(), transparent: true, depthWrite: false, opacity: 0.55, color: '#000000' }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.userData.shadow = true;
    shadow.position.y = -0.02;
    shadow.scale.set(2.3, 1.6, 1);
    G.add(shadow);

    const legAnchor = legs.find((l) => l.sgn > 0)!;
    this.parts = [
      { key: 'carapace', zh: '头胸甲', anchor: tagAt(body, 0.18, 0.3, -0.1) },
      { key: 'rostralTeeth', zh: '额齿', anchor: tagAt(body, 0.0, 0.08, Lc / 2 + 0.04) },
      { key: 'anterolateral', zh: '前侧齿', anchor: tagAt(body, -(W / 2) * 0.8, 0.05, (Lc / 2) * 0.62) },
      { key: 'eye', zh: '复眼', anchor: eyes[0] },
      { key: 'cheliped', zh: '螯足', anchor: clawAnchor! },
      { key: 'mitten', zh: '绒毛', anchor: mittenAnchor! },
      { key: 'pereiopod', zh: '步足', anchor: legAnchor.prop.g },
    ];

    this.anim = (t) => {
      // 侧向慢步 (横行): 每侧相邻的足反相, 左右也反相, 身体随步伐轻轻起伏
      const f = 0.55;
      for (const l of legs) {
        const ph = t * f * Math.PI * 2 + l.phase;
        const lift = Math.max(0, Math.sin(ph));
        l.coxa.g.rotation.y = l.coxa.base.y + 0.16 * Math.cos(ph);
        l.merus.g.rotation.z = l.merus.base.z + 0.22 * lift;
        l.carpus.g.rotation.z = l.carpus.base.z - 0.12 * lift;
      }
      body.position.y = 0.55 + 0.012 * Math.sin(t * f * Math.PI * 4);
      body.rotation.z = 0.02 * Math.sin(t * f * Math.PI * 2);
      for (const ch of chelae) {
        const k = Math.sin(t * 0.7 + (ch.sgn > 0 ? 0 : 1.4));
        ch.arm.g.rotation.z = ch.arm.base.z + 0.08 * k;
        ch.dact.rotation.z = 0.12 + 0.12 * Math.max(0, Math.sin(t * 1.3 + ch.sgn));
      }
      for (const e of eyes) e.rotation.x = -0.15 + 0.08 * Math.sin(t * 0.9);
    };
    return G;
  }

  // ---------------------------------------------------------------- 日本沼虾 (青虾)
  private buildPrawn(): THREE.Group {
    const G = new THREE.Group();
    const body = new THREE.Group();
    body.position.y = 0.25;
    G.add(body);
    // 半透明的青灰褐色外壳, 背面有深色斑纹
    const mkMat = (color: string, opacity = 0.9) =>
      new THREE.MeshPhysicalMaterial({ color, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.2, transparent: opacity < 1, opacity, vertexColors: true, depthWrite: true });
    const baseC = new THREE.Color('#8a7c58');
    const darkC = new THREE.Color('#3e301c');
    const paleC = new THREE.Color('#cfc6a4');
    const paint = (g: THREE.BufferGeometry, seed: number, band = 0) => {
      const p = g.getAttribute('position') as THREE.BufferAttribute;
      const col = new Float32Array(p.count * 3);
      const c = new THREE.Color();
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i);
        const y = p.getY(i);
        const z = p.getZ(i);
        const n = noise3(x * 9 + seed, y * 9, z * 9);
        c.copy(baseC).lerp(darkC, Math.max(0, n - 0.45) * 1.6).lerp(paleC, Math.max(0, -y * 6) * 0.5);
        if (band) c.lerp(darkC, band * Math.max(0, y * 5) * 0.6);
        col[i * 3] = c.r;
        col[i * 3 + 1] = c.g;
        col[i * 3 + 2] = c.b;
      }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      return g;
    };

    // 头胸甲: 侧扁的长椭球, 前端接额角
    const cg = new THREE.SphereGeometry(1, 48, 32);
    cg.scale(0.55, 0.27, 0.24);
    const cp = cg.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < cp.count; i++) {
      const x = cp.getX(i);
      const y = cp.getY(i);
      // 前端略收窄, 背面平直, 腹面平
      const k = 1 - 0.25 * Math.max(0, -x / 0.55);
      cp.setY(i, (y > 0 ? y * 0.95 : y * 0.8) * k);
      cp.setZ(i, cp.getZ(i) * k);
    }
    cg.computeVertexNormals();
    const cara = new THREE.Mesh(paint(cg, 1, 1), mkMat('#ffffff', 0.92));
    cara.position.set(-0.85, 0.06, 0);
    body.add(cara);

    // 额角: 短于头胸甲, 上缘十余齿, 下缘少数几齿
    const rost = new THREE.Group();
    rost.position.set(-1.33, 0.12, 0);
    rost.rotation.z = -0.1;
    body.add(rost);
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.05, 0.022), mkMat('#ffffff', 0.9));
    paint(blade.geometry, 2);
    blade.position.x = -0.22;
    rost.add(blade);
    const toothGeo = new THREE.ConeGeometry(0.012, 0.035, 5);
    const toothMat = shell('#6b6844');
    for (let i = 0; i < 13; i++) {
      const t = new THREE.Mesh(toothGeo, toothMat);
      const x = 0.3 - i * 0.045;
      t.position.set(x - 0.22 - 0.0, 0.035, 0);
      t.rotation.z = 0.6;
      if (x < 0.3) rost.add(t);
    }
    for (let i = 0; i < 3; i++) {
      const t = new THREE.Mesh(toothGeo, toothMat);
      t.position.set(-0.32 - i * 0.05, -0.035, 0);
      t.rotation.z = Math.PI - 0.6;
      rost.add(t);
    }

    // 腹部 6 节, 背面弓起, 第 6 节最长; 每节是一个侧扁的环, 两侧下垂的侧甲覆盖游泳足基部
    const segs: THREE.Group[] = [];
    const segLen = [0.3, 0.3, 0.31, 0.28, 0.26, 0.38];
    const segH = [0.215, 0.21, 0.2, 0.18, 0.155, 0.115];
    let x = -0.42;
    let prev: THREE.Object3D = body;
    const abdRoot = new THREE.Group();
    abdRoot.position.set(x, 0.06, 0);
    body.add(abdRoot);
    prev = abdRoot;
    for (let i = 0; i < 6; i++) {
      const sg = new THREE.Group();
      if (i > 0) sg.position.x = segLen[i - 1] * 0.92;
      prev.add(sg);
      // 每节是一段前粗后细的筒, 前缘略外翻成节间的环褶, 下一节从这一节的末端接上, 看起来是连续的腹部
      const r0 = segH[i];
      const r1 = i < 5 ? segH[i + 1] : segH[5] * 0.75;
      const prof: THREE.Vector2[] = [];
      const len = segLen[i] * 0.98;
      for (let k = 0; k <= 16; k++) {
        const u = k / 16;
        let r = THREE.MathUtils.lerp(r0 * 1.04, r1 * 1.0, u) * (1 + 0.04 * Math.sin(Math.PI * u));
        if (k === 0) r *= 0.75;
        if (i === 5 && k === 16) r *= 0.6;
        prof.push(new THREE.Vector2(Math.max(0.001, r), u * len - 0.02));
      }
      const g = new THREE.LatheGeometry(prof, 28);
      g.rotateZ(-Math.PI / 2);
      g.scale(1, 1, 0.78);
      const m = new THREE.Mesh(paint(g, 3 + i, 1), mkMat('#ffffff', 0.9));
      sg.add(m);
      segs.push(sg);
      prev = sg;
      x += segLen[i] * 0.92;
    }
    // 尾扇: 尾节 (中间的尖三角) + 一对尾肢 (各有内外两片)
    const fan = new THREE.Group();
    fan.position.x = segLen[5] * 0.95;
    segs[5].add(fan);
    const telG = new THREE.ConeGeometry(0.06, 0.42, 4);
    telG.rotateZ(-Math.PI / 2);
    telG.scale(1, 0.4, 1);
    telG.translate(0.21, 0, 0);
    fan.add(new THREE.Mesh(paint(telG, 9), mkMat('#ffffff', 0.85)));
    const uroMat = new THREE.MeshPhysicalMaterial({ color: '#9a9a78', roughness: 0.35, clearcoat: 0.8, transparent: true, opacity: 0.78, side: THREE.DoubleSide });
    const uros: THREE.Mesh[] = [];
    for (const sgn of [-1, 1])
      for (const k of [0, 1]) {
        const ug = new THREE.CircleGeometry(1, 24);
        ug.scale(0.27, 0.075, 1);
        ug.translate(0.22, 0, 0);
        const u = new THREE.Mesh(ug, uroMat);
        u.rotation.x = Math.PI / 2;
        u.rotation.z = sgn * (0.28 + k * 0.22);
        u.position.set(0.02, -0.01 + k * 0.01, sgn * 0.03);
        fan.add(u);
        uros.push(u);
      }

    // 复眼 (有柄)
    const eyeMat = new THREE.MeshPhysicalMaterial({ color: '#141008', roughness: 0.15, clearcoat: 1 });
    const eyes: THREE.Group[] = [];
    for (const sgn of [-1, 1]) {
      const eg = new THREE.Group();
      eg.position.set(-1.3, 0.13, sgn * 0.08);
      eg.rotation.y = Math.PI + sgn * 0.6;
      const st = new THREE.Mesh(segGeo(0.08, 0.035, 0.04), shell('#8a8456'));
      eg.add(st);
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 12), eyeMat);
      ball.position.x = 0.1;
      eg.add(ball);
      body.add(eg);
      eyes.push(eg);
    }

    // 触角: 第一触角 (3 根短鞭), 第二触角 (一对长鞭, 比体长还长) 与扁平的鳞片 (第二触角鳞片)
    const whipMat = shell('#b8b48e', { roughness: 0.5, clearcoat: 0.2 });
    const whips: { j: Joint[]; amp: number; ph: number }[] = [];
    const whip = (parent: THREE.Object3D, len: number, r: number, n: number, ry: number, rz: number, ph: number) => {
      const segs2: [number, number, number][] = [];
      for (let i = 0; i < n; i++) segs2.push([len / n, r * (1 - i / n) + 0.002, r * (1 - (i + 1) / n) + 0.0015]);
      const { joints } = limb(parent, segs2, whipMat);
      setBase(joints[0], 0, ry, rz);
      for (let i = 1; i < n; i++) setBase(joints[i], 0, 0.0, 0);
      whips.push({ j: joints, amp: 0.04, ph });
      return joints;
    };
    const antBase = new THREE.Group();
    antBase.position.set(-1.35, 0.06, 0);
    antBase.rotation.y = Math.PI; // 朝 -x
    body.add(antBase);
    let antennaAnchor: THREE.Object3D | null = null;
    for (const sgn of [-1, 1]) {
      // 第二触角长鞭: 先向前外, 再向后弯 (每节略向后转)
      const js = whip(antBase, 3.4, 0.014, 24, sgn * 0.3, 0.05, sgn);
      js.forEach((j, i) => {
        if (i > 2) setBase(j, 0, -sgn * 0.075, -0.004);
      });
      if (sgn > 0) antennaAnchor = js[8].g;
      // 第一触角: 三根短鞭
      for (let k = 0; k < 3; k++) {
        const j2 = whip(antBase, 0.9 + k * 0.25, 0.008, 10, sgn * (0.1 + k * 0.12), 0.25 - k * 0.12, k + sgn);
        j2.forEach((j, i) => i > 0 && setBase(j, 0, -sgn * 0.02, -0.03));
      }
      // 鳞片
      const sc = new THREE.Mesh(new THREE.CircleGeometry(1, 16), new THREE.MeshPhysicalMaterial({ color: '#a8a684', transparent: true, opacity: 0.8, side: THREE.DoubleSide, roughness: 0.4 }));
      sc.scale.set(0.2, 0.05, 1);
      sc.rotation.x = Math.PI / 2;
      sc.position.set(-1.47, 0.05, sgn * 0.12);
      body.add(sc);
    }

    // 步足 (胸足) 5 对: 第 1 对细小有钳, 第 2 对特别长 (成熟雄虾长过体长), 第 3–5 对是步行足
    const legMat = shell('#8f8b62', { roughness: 0.45, clearcoat: 0.6 });
    const bandMat = shell('#3c4a2c', { roughness: 0.4, clearcoat: 0.7 });
    type L = { j: Joint[]; ph: number };
    const walk: L[] = [];
    const big: Joint[][] = [];
    let p2Anchor: THREE.Object3D | null = null;
    let legAnchor: THREE.Object3D | null = null;
    const legXs = [-1.12, -1.0, -0.86, -0.72, -0.58];
    for (const sgn of [-1, 1]) {
      const side = new THREE.Group();
      side.scale.z = sgn;
      body.add(side);
      legXs.forEach((lx, i) => {
        const root = new THREE.Group();
        root.position.set(lx, -0.12, 0.1);
        side.add(root);
        if (i === 1) {
          // 第二步足: 座节, 长节, 腕节 (最长), 掌节, 两指; 青绿色深浅相间
          const { joints, meshes, tip } = limb(
            root,
            [
              [0.18, 0.03, 0.03],
              [0.55, 0.035, 0.034],
              [0.62, 0.032, 0.03],
              [0.55, 0.038, 0.036],
            ],
            legMat,
          );
          meshes[1].material = bandMat;
          meshes[3].material = bandMat;
          setBase(joints[0], 0, Math.PI - 0.55, -0.35); // 向前外方
          setBase(joints[1], 0, 0.38, 0.22);
          setBase(joints[2], 0, -0.12, 0.05);
          setBase(joints[3], 0, -0.08, 0.0);
          // 两指
          const f1 = new THREE.Mesh(segGeo(0.3, 0.03, 0.006), bandMat);
          f1.rotation.y = 0.05;
          tip.add(f1);
          const f2 = new THREE.Group();
          tip.add(f2);
          f2.add(new THREE.Mesh(segGeo(0.3, 0.028, 0.006), legMat));
          f2.rotation.y = -0.12;
          big.push(joints);
          if (sgn > 0) p2Anchor = joints[3].g;
          return;
        }
        const len = i === 0 ? 0.62 : 0.78 - (i - 2) * 0.04;
        const { joints } = limb(
          root,
          [
            [len * 0.15, 0.022, 0.02],
            [len * 0.38, 0.02, 0.018],
            [len * 0.22, 0.017, 0.015],
            [len * 0.25, 0.014, 0.004],
          ],
          legMat,
        );
        const yaw = i === 0 ? Math.PI - 0.3 : Math.PI / 2 + 0.25 - (i - 2) * 0.3;
        setBase(joints[0], 0, yaw, -0.5);
        setBase(joints[1], 0, 0, 0.55);
        setBase(joints[2], 0, 0, -0.9);
        setBase(joints[3], 0, 0, -0.4);
        walk.push({ j: joints, ph: i * 1.3 + (sgn > 0 ? Math.PI : 0) });
        if (sgn > 0 && i === 3) legAnchor = joints[2].g;
      });
    }

    // 游泳足 (腹肢) 5 对: 挂在第 1–5 腹节腹面, 后浪式划水
    const pleo: { g: THREE.Group; i: number }[] = [];
    const pleoMat = new THREE.MeshPhysicalMaterial({ color: '#b3b08c', transparent: true, opacity: 0.75, side: THREE.DoubleSide, roughness: 0.5 });
    for (let i = 0; i < 5; i++) {
      for (const sgn of [-1, 1]) {
        const pg = new THREE.Group();
        pg.position.set(segLen[i] * 0.5, -segH[i] * 0.8, sgn * 0.06);
        segs[i].add(pg);
        const pg2 = new THREE.PlaneGeometry(0.06, 0.2);
        pg2.translate(0, -0.1, 0);
        const m = new THREE.Mesh(pg2, pleoMat);
        m.rotation.y = Math.PI / 2;
        pg.add(m);
        pleo.push({ g: pg, i });
      }
    }

    const shadow = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshBasicMaterial({ map: blobTex(), transparent: true, depthWrite: false, opacity: 0.45, color: '#000000' }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.userData.shadow = true;
    shadow.position.set(-0.2, -0.17, 0);
    shadow.scale.set(2.4, 0.9, 1);
    G.add(shadow);

    this.parts = [
      { key: 'carapace', zh: '头胸甲', anchor: tagAt(body, -0.9, 0.3, 0) },
      { key: 'rostrum', zh: '额角', anchor: tagAt(rost, -0.3, 0.05, 0) },
      { key: 'eye', zh: '复眼', anchor: eyes[1] },
      { key: 'antenna', zh: '第二触角', anchor: antennaAnchor! },
      { key: 'cheliped', zh: '第二步足', anchor: p2Anchor! },
      { key: 'pereiopod', zh: '步足', anchor: legAnchor! },
      { key: 'abdomen', zh: '腹部', anchor: tagAt(segs[2], 0.15, 0.24, 0) },
      { key: 'pleopod', zh: '游泳足', anchor: pleo[4].g },
      { key: 'tailfan', zh: '尾扇', anchor: tagAt(fan, 0.3, 0, 0) },
    ];

    this.anim = (t) => {
      // 腹肢后浪式划水: 从后往前依次摆动
      for (const p of pleo) p.g.rotation.z = 0.35 * Math.sin(t * 9 - p.i * 0.9);
      // 腹部轻微屈伸, 尾扇张合
      segs.forEach((s, i) => (s.rotation.z = (i ? -0.035 : -0.06) + 0.015 * Math.sin(t * 1.1 - i * 0.4)));
      for (let i = 0; i < uros.length; i++) uros[i].rotation.z = (i < 2 ? -1 : 1) * ((i % 2 ? 0.5 : 0.28) + 0.05 * Math.sin(t * 1.1));
      // 触角缓慢摆动
      for (const w of whips)
        w.j.forEach((j, i) => {
          if (i === 0) return;
          j.g.rotation.z = j.base.z + w.amp * Math.sin(t * 1.4 + w.ph - i * 0.3);
        });
      // 第二步足缓慢开合, 步足轻点
      big.forEach((js, k) => {
        js[1].g.rotation.y = js[1].base.y + 0.05 * Math.sin(t * 0.6 + k * 2);
      });
      for (const l of walk) l.j[1].g.rotation.z = l.j[1].base.z + 0.1 * Math.max(0, Math.sin(t * 1.6 + l.ph));
      body.position.y = 0.25 + 0.015 * Math.sin(t * 0.8);
      for (const e of eyes) e.rotation.z = 0.05 * Math.sin(t * 0.7);
    };
    return G;
  }
}

function tagAt(parent: THREE.Object3D, x: number, y: number, z: number) {
  const o = new THREE.Object3D();
  o.position.set(x, y, z);
  parent.add(o);
  return o;
}

let blob: THREE.Texture | null = null;
function blobTex() {
  if (blob) return blob;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,255,255,0.9)');
  grd.addColorStop(0.5, 'rgba(255,255,255,0.35)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  blob = new THREE.CanvasTexture(c);
  return blob;
}
