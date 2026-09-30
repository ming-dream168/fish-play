// 水下环境: 程序化天空盒 (斯涅尔窗, 太阳, 光束), 环境反射贴图, 光柱, 海雪粒子.

import * as THREE from 'three';
import { lerp } from '../core/math';

export interface WaterLook {
  top: THREE.Color;
  mid: THREE.Color;
  deep: THREE.Color;
  fog: THREE.Color;
  sun: THREE.Color;
  abyss: number; // 0 浅海 → 1 深海
}

const BG_VERT = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  vec4 p = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * p;
  gl_Position.z = gl_Position.w; // 永远在最远处
}
`;

const BG_FRAG = /* glsl */ `
uniform vec3 uTop; uniform vec3 uMid; uniform vec3 uDeep; uniform vec3 uSun; uniform vec3 uSunDir;
uniform float uTime; uniform float uAbyss; uniform float uStudio; uniform vec3 uStudioColor; uniform float uEnvPass;
varying vec3 vDir;
float h1(float n) { return fract(sin(n) * 43758.5453); }
float n1(float x) { float i = floor(x); float f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(h1(i), h1(i + 1.0), f); }
float h2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n2(vec2 p) { vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h2(i), h2(i + vec2(1, 0)), f.x), mix(h2(i + vec2(0, 1)), h2(i + vec2(1, 1)), f.x), f.y); }
void main() {
  vec3 d = normalize(vDir);
  float y = d.y;
  vec3 col = mix(uMid, uTop, smoothstep(-0.05, 0.85, y));
  col = mix(col, uDeep, 1.0 - smoothstep(-0.75, 0.02, y));
  // 斯涅尔窗: 天顶 48.6° 内能看见水面之上的天空
  float zen = acos(clamp(y, -1.0, 1.0));
  float ripple = n2(d.xz / max(y, 0.2) * 3.0 + uTime * 0.25) * 0.5 + n2(d.xz / max(y, 0.2) * 7.0 - uTime * 0.35) * 0.5;
  float snell = 1.0 - smoothstep(0.80, 0.88, zen + (ripple - 0.5) * 0.05);
  col += uTop * 0.9 * snell * (0.75 + 0.5 * ripple);
  // 窗口边缘的全反射亮环
  col += uTop * 0.35 * (1.0 - smoothstep(0.0, 0.08, abs(zen - 0.85)));
  // 太阳
  float sd = max(dot(d, uSunDir), 0.0);
  col += uSun * (pow(sd, 400.0) * 3.0 + pow(sd, 40.0) * 0.45 + pow(sd, 6.0) * 0.12) * (1.0 - uAbyss);
  // 光束: 以天顶为中心的放射状条纹
  float az = atan(d.z, d.x);
  float shafts = n1(az * 9.0 + uTime * 0.05) * n1(az * 23.0 - uTime * 0.08 + 4.0);
  col += uTop * 0.28 * shafts * smoothstep(-0.25, 0.75, y) * (1.0 - snell) * (1.0 - uAbyss);
  col *= 1.0 - uAbyss * 0.92;
  // 摄影棚背景 (解剖/透明模式)
  vec3 studio = uStudioColor * (0.55 + 0.45 * smoothstep(-0.6, 0.6, y));
  col = mix(col, studio, uStudio);
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

export class Environment {
  readonly group = new THREE.Group();
  readonly bg: THREE.Mesh;
  readonly bgMat: THREE.ShaderMaterial;
  readonly sun: THREE.DirectionalLight;
  readonly hemi: THREE.HemisphereLight;
  readonly rim: THREE.DirectionalLight;
  readonly rov: THREE.DirectionalLight; // 深海里模拟潜水器的补光
  readonly snow: THREE.Points;
  readonly shafts: THREE.Group;
  private snowMat: THREE.ShaderMaterial;
  private shaftMat: THREE.ShaderMaterial;
  envMap: THREE.Texture | null = null;
  studioEnv: THREE.Texture | null = null;
  studioK = 0; // 0 水下 → 1 摄影棚
  private studioTarget = 0;
  private modeName = 'living';
  look: WaterLook;
  flow = 1; // 相对水流速度 (世界单位/秒)
  abyss = 0; // 目标深海程度 (物种栖息深度), 0 浅海 → 1 无光层
  private abyssK = 0;
  warm = 0; // 近岸浑水: 悬浮泥沙把蓝光滤掉, 水下的光偏黄绿, 金黄色的鱼才显出本色
  private warmK = 0;

  constructor(private renderer: THREE.WebGLRenderer, private scene: THREE.Scene) {
    this.look = {
      top: new THREE.Color('#5fd2e8'),
      mid: new THREE.Color('#0d4d6b'),
      deep: new THREE.Color('#020b16'),
      fog: new THREE.Color('#06283a'),
      sun: new THREE.Color('#fff2d6'),
      abyss: 0,
    };
    this.bgMat = new THREE.ShaderMaterial({
      vertexShader: BG_VERT,
      fragmentShader: BG_FRAG,
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uTop: { value: this.look.top },
        uMid: { value: this.look.mid },
        uDeep: { value: this.look.deep },
        uSun: { value: this.look.sun },
        uSunDir: { value: new THREE.Vector3(0.25, 1, 0.35).normalize() },
        uTime: { value: 0 },
        uAbyss: { value: 0 },
        uStudio: { value: 0 },
        uStudioColor: { value: new THREE.Color('#0b1016') },
        uEnvPass: { value: 0 },
      },
    });
    this.bg = new THREE.Mesh(new THREE.SphereGeometry(60, 48, 24), this.bgMat);
    this.bg.renderOrder = -10;
    this.bg.frustumCulled = false;
    this.group.add(this.bg);

    this.sun = new THREE.DirectionalLight('#fff3dd', 2.6);
    this.sun.position.set(2.5, 10, 3.5);
    this.hemi = new THREE.HemisphereLight('#7fd6ee', '#061522', 0.9);
    this.rim = new THREE.DirectionalLight('#6fb8ff', 1.1);
    this.rim.position.set(-4, 1.5, -6);
    this.rov = new THREE.DirectionalLight('#dcecff', 0);
    this.rov.position.set(2.5, 2.2, 8);
    this.group.add(this.sun, this.hemi, this.rim, this.rov);

    // 海雪
    const n = 2600;
    const pos = new Float32Array(n * 3);
    const seed = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 18;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 9;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 12;
      seed[i * 4] = Math.random();
      seed[i * 4 + 1] = Math.random();
      seed[i * 4 + 2] = Math.random();
      seed[i * 4 + 3] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
    this.snowMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
        uniforms: {
        uTime: { value: 0 },
        uDrift: { value: 0 },
        uColor: { value: new THREE.Color('#bfe6f0') },
        uPx: { value: renderer.getPixelRatio() },
        uAlpha: { value: 1 },
        uBio: { value: 0 },
      },
      vertexShader: /* glsl */ `
        attribute vec4 aSeed;
        uniform float uTime; uniform float uDrift; uniform float uPx; uniform float uBio;
        varying float vA;
        varying float vBio;
        void main() {
          vec3 p = position;
          p.x = mod(p.x + uDrift * (0.6 + aSeed.x * 0.8) + 9.0, 18.0) - 9.0;
          p.y = mod(p.y - uTime * (0.02 + aSeed.y * 0.05) + 4.5, 9.0) - 4.5;
          p.x += sin(uTime * (0.3 + aSeed.z) + aSeed.w * 6.28) * 0.08;
          p.z += cos(uTime * (0.25 + aSeed.x) + aSeed.y * 6.28) * 0.08;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          float size = mix(1.2, 4.5, pow(aSeed.w, 3.0));
          gl_PointSize = size * uPx * (7.0 / -mv.z);
          float fade = smoothstep(1.0, 3.0, -mv.z) * (1.0 - smoothstep(12.0, 22.0, -mv.z));
          vA = fade * mix(0.15, 0.55, aSeed.z);
          // 深海: 少数颗粒是会闪烁的发光浮游生物
          float isBio = step(0.9, aSeed.y);
          float blink = pow(max(0.0, sin(uTime * (0.4 + aSeed.x * 1.3) + aSeed.w * 40.0)), 24.0);
          vBio = uBio * isBio * blink;
          vA *= 1.0 - uBio * 0.7;
          gl_PointSize *= 1.0 + vBio * 1.5;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor; uniform float uAlpha;
        varying float vA;
        varying float vBio;
        void main() {
          vec2 c = gl_PointCoord - 0.5;
          float d = length(c);
          float a = 1.0 - smoothstep(0.0, 0.5, d);
          vec3 col = uColor * a * vA + vec3(0.25, 0.95, 1.0) * pow(a, 2.0) * vBio * 2.5;
          gl_FragColor = vec4(col * uAlpha, 1.0);
        }
      `,
    });
    this.snow = new THREE.Points(g, this.snowMat);
    this.snow.frustumCulled = false;
    this.group.add(this.snow);

    // 光柱
    this.shafts = new THREE.Group();
    this.shaftMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color('#9fe6ff') }, uAlpha: { value: 1 } },
      vertexShader: /* glsl */ `
        varying vec2 vUv; varying float vDepth;
        void main() { vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0); vDepth = -mv.z; gl_Position = projectionMatrix * mv; }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime; uniform vec3 uColor; uniform float uAlpha;
        varying vec2 vUv; varying float vDepth;
        float h(float n) { return fract(sin(n) * 43758.5453); }
        float nz(float x) { float i = floor(x); float f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(h(i), h(i + 1.0), f); }
        void main() {
          float x = vUv.x;
          float band = nz(x * 7.0 + uTime * 0.12) * nz(x * 15.0 - uTime * 0.07 + 3.0);
          float edge = smoothstep(0.0, 0.25, x) * (1.0 - smoothstep(0.75, 1.0, x));
          float vert = smoothstep(0.0, 0.7, vUv.y) * (0.35 + 0.65 * vUv.y);
          float near = smoothstep(1.5, 4.0, vDepth);
          float a = band * edge * vert * near * 0.07 * uAlpha;
          gl_FragColor = vec4(uColor * a, 1.0);
        }
      `,
    });
    for (let i = 0; i < 9; i++) {
      const w = 1.2 + Math.random() * 2.2;
      const geo = new THREE.PlaneGeometry(w, 14, 1, 1);
      geo.translate(0, 7, 0);
      const m = new THREE.Mesh(geo, this.shaftMat);
      m.position.set((Math.random() - 0.5) * 12, -5 - Math.random() * 2, -3 - Math.random() * 7);
      m.rotation.z = (Math.random() - 0.5) * 0.35 + 0.18;
      m.rotation.y = (Math.random() - 0.5) * 0.6;
      m.frustumCulled = false;
      this.shafts.add(m);
    }
    this.group.add(this.shafts);
    scene.add(this.group);
    scene.fog = new THREE.FogExp2(this.look.fog.getHex(), 0.03);
    this.bakeEnv();
  }

  /** 把程序化天空烘焙成 PMREM 环境贴图, 用于银色鱼鳞的反射. */
  bakeEnv() {
    const pm = new THREE.PMREMGenerator(this.renderer);
    const envScene = new THREE.Scene();
    const m = new THREE.Mesh(new THREE.SphereGeometry(10, 64, 32), this.bgMat.clone());
    (m.material as THREE.ShaderMaterial).uniforms = THREE.UniformsUtils.clone(this.bgMat.uniforms);
    (m.material as THREE.ShaderMaterial).uniforms.uStudio.value = 0;
    envScene.add(m);
    const rt = pm.fromScene(envScene, 0.02);
    this.envMap?.dispose();
    this.envMap = rt.texture;
    this.scene.environment = this.envMap;
    this.scene.environmentIntensity = 0.9;
    pm.dispose();
  }

  /** 中性摄影棚环境: 顶部柔光箱 + 侧面反光板, 用于解剖与标本模式. */
  bakeStudio() {
    const pm = new THREE.PMREMGenerator(this.renderer);
    const s = new THREE.Scene();
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(10, 32, 16),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `varying vec3 vD; void main(){
          float y = vD.y;
          vec3 c = mix(vec3(0.05,0.055,0.06), vec3(0.32,0.33,0.34), smoothstep(-0.4, 0.8, y));
          // 顶部柔光箱
          c += vec3(2.2,2.1,2.0) * smoothstep(0.82, 0.9, y);
          // 正面与侧面的条形反光板
          c += vec3(0.9,0.92,0.95) * smoothstep(0.93, 0.98, vD.z) * smoothstep(-0.2, 0.2, y) * (1.0 - smoothstep(0.35, 0.5, y));
          c += vec3(0.5,0.55,0.6) * smoothstep(0.9, 0.97, -vD.x) * (1.0 - smoothstep(0.3, 0.6, abs(y)));
          gl_FragColor = vec4(c, 1.0);
        }`,
      }),
    );
    s.add(sky);
    this.studioEnv = pm.fromScene(s, 0.03).texture;
    pm.dispose();
  }

  setStudio(on: boolean, mode: string) {
    this.studioTarget = on ? 1 : 0;
    this.modeName = mode;
    if (on && !this.studioEnv) this.bakeStudio();
  }

  update(dt: number, time: number, camera: THREE.Camera) {
    const k0 = this.studioK;
    this.studioK += (this.studioTarget - this.studioK) * Math.min(1, dt * 2.5);
    const k = this.studioK;
    this.abyssK += (this.abyss - this.abyssK) * Math.min(1, dt * 1.5);
    // 深海只影响水下场景, 摄影棚模式不受影响
    const ab = this.abyssK * (1 - k);
    this.warmK += (this.warm - this.warmK) * Math.min(1, dt * 1.5);
    const wm = this.warmK * (1 - k) * (1 - ab);
    if ((k > 0.5) !== (k0 > 0.5) || !this.scene.environment) this.scene.environment = k > 0.5 && this.studioEnv ? this.studioEnv : this.envMap;
    this.scene.environmentIntensity = (k > 0.5 ? 0.85 : 0.9) * (1 - 0.88 * ab);
    this.sun.color.set('#fff3dd').lerp(new THREE.Color('#ffffff'), k);
    this.sun.intensity = lerp(2.6, 2.2, k) * (1 - 0.985 * ab) * (1 + 0.2 * wm);
    this.hemi.color.set('#7fd6ee').lerp(new THREE.Color('#dfe6ee'), k).lerp(new THREE.Color('#1c3a66'), ab).lerp(new THREE.Color('#e8d6a4'), 0.6 * wm);
    this.hemi.groundColor.set('#061522').lerp(new THREE.Color('#2a2622'), k).lerp(new THREE.Color('#000000'), ab).lerp(new THREE.Color('#3a2c14'), 0.5 * wm);
    this.hemi.intensity = lerp(0.9, 0.55, k) * (1 - 0.7 * ab) * (1 + 0.25 * wm);
    this.rim.color.set('#6fb8ff').lerp(new THREE.Color('#bcd6ff'), k).lerp(new THREE.Color('#3f7dff'), ab).lerp(new THREE.Color('#d8c8a0'), 0.45 * wm);
    this.rim.intensity = lerp(1.1, 1.6, k) * (1 + 0.3 * ab);
    this.rov.intensity = 2.0 * ab;
    this.rov.position.copy(camera.position).add(new THREE.Vector3(1.5, 2.5, 0));
    this.snowMat.uniforms.uAlpha.value = 1 - k * 0.85;
    this.snowMat.uniforms.uBio.value = ab;
    this.shaftMat.uniforms.uAlpha.value = (1 - k) * (1 - ab);
    this.shafts.visible = k < 0.99 && ab < 0.99;
    this.bgMat.uniforms.uAbyss.value = ab;
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.density = lerp(0.03, 0.0, k) + 0.02 * ab;
      this.scene.fog.color.copy(this.look.fog).lerp(new THREE.Color('#010205'), ab);
    }
    this.bgMat.uniforms.uTime.value = time;
    this.snowMat.uniforms.uTime.value = time;
    this.snowMat.uniforms.uDrift.value += dt * this.flow;
    this.shaftMat.uniforms.uTime.value = time;
    this.bg.position.copy(camera.position);
    // 光柱绕竖直轴朝向相机
    for (const s of this.shafts.children) {
      const dx = camera.position.x - s.position.x;
      const dz = camera.position.z - s.position.z;
      s.rotation.y = Math.atan2(dx, dz);
    }
  }
}
