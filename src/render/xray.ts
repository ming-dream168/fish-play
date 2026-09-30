// X 光: 把每个部件按 (背面深度 - 正面深度) × 密度 累加到浮点缓冲, 得到沿视线的质量厚度,
// 再按 Beer–Lambert 衰减显影成底片. 鳔里是空气, 密度为负, 所以在片子上是一块暗区, 和真实 X 光片一致.

import * as THREE from 'three';
import type { Fish } from '../core/fish';
import { makeXrayMaterial } from '../core/materials';

const FILM_FRAG = /* glsl */ `
uniform sampler2D tAcc;
uniform vec2 uTexel;
uniform float uExposure;
uniform float uTime;
uniform float uGain;
varying vec2 vUv;
float h(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
float acc(vec2 uv) { return max(texture2D(tAcc, uv).r, 0.0); }
void main() {
  float v = acc(vUv);
  // 反锐化掩模: 增强骨骼边缘, 模拟放射片的清晰度
  float b = 0.0;
  for (int i = 0; i < 8; i++) {
    float a = float(i) * 0.785398;
    b += acc(vUv + vec2(cos(a), sin(a)) * uTexel * 3.0);
  }
  b /= 8.0;
  float vs = max(0.0, v + (v - b) * 1.6);
  float T = exp(-vs * uExposure);
  float film = 1.0 - T;
  film = smoothstep(0.0, 1.0, pow(film, 0.9)) * uGain;
  vec3 col = mix(vec3(0.0, 0.01, 0.02), vec3(0.78, 0.9, 1.0), film);
  col += vec3(0.9, 0.95, 1.0) * pow(film, 3.0) * 0.35;
  // 胶片颗粒与暗角
  float g = h(vUv * 1000.0 + uTime) - 0.5;
  col += g * 0.035;
  vec2 d = vUv - 0.5;
  col *= 1.0 - dot(d, d) * 0.9;
  gl_FragColor = vec4(col, 1.0);
}
`;

const bladderDensity = (sp: Fish['specA']) => (sp.organs.swimBladder.kind === 3 ? -0.12 : -1);

export class XRayRenderer {
  readonly rt: THREE.WebGLRenderTarget;
  private quad: THREE.Mesh;
  private quadScene = new THREE.Scene();
  private quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  readonly filmMat: THREE.ShaderMaterial;
  exposure = 3.2;

  constructor(private renderer: THREE.WebGLRenderer) {
    // 32 位浮点目标上做加法混合需要 EXT_float_blend (部分 Safari / 移动端没有), 没有就退回半精度
    const type = renderer.extensions.has('EXT_float_blend') ? THREE.FloatType : THREE.HalfFloatType;
    this.rt = new THREE.WebGLRenderTarget(4, 4, { type, format: THREE.RGBAFormat, depthBuffer: false });
    this.filmMat = new THREE.ShaderMaterial({
      uniforms: {
        tAcc: { value: this.rt.texture },
        uTexel: { value: new THREE.Vector2(1 / 4, 1 / 4) },
        uExposure: { value: this.exposure },
        uTime: { value: 0 },
        uGain: { value: 1 },
      },
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
      fragmentShader: FILM_FRAG,
      depthTest: false,
      depthWrite: false,
    });
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.filmMat);
    this.quad.frustumCulled = false;
    this.quadScene.add(this.quad);
  }

  setSize(w: number, h: number) {
    this.rt.setSize(w, h);
    this.filmMat.uniforms.uTexel.value.set(1 / w, 1 / h);
  }

  /** 累积 X 光厚度到 rt, 然后显影到 target (null = 屏幕). */
  render(fish: Fish, camera: THREE.Camera, target: THREE.WebGLRenderTarget | null, time: number, visibleLayers: (p: Fish['parts'][number]) => boolean) {
    const r = this.renderer;
    const saved: [THREE.Mesh, THREE.Material | THREE.Material[], boolean][] = [];
    const center = new THREE.Vector3();
    fish.root.getWorldPosition(center);
    const ref = camera.position.distanceTo(center);
    for (const p of fish.parts) {
      saved.push([p.mesh, p.mesh.material, p.mesh.visible]);
      const on = visibleLayers(p) && p.density !== 0;
      if (!on) {
        p.mesh.visible = false;
        continue;
      }
      if (!p.mats.xray) p.mats.xray = makeXrayMaterial(fish.shared, p.flags, p.local, p.density, !!p.sheet);
      const lu = p.local as unknown as { uDepthRef: { value: number }; uDensity: { value: number } };
      lu.uDepthRef.value = ref;
      // 鳔里是气体, 在片子上是一团暗影; 矛尾鱼的是充满脂肪的退化肺, 只比肌肉略透
      if (p.key === 'swimBladder') lu.uDensity.value = bladderDensity(fish.specA) + (bladderDensity(fish.specB) - bladderDensity(fish.specA)) * fish.morph;
      p.mesh.material = p.mats.xray;
      p.mesh.visible = true;
    }
    const prevTarget = r.getRenderTarget();
    const prevClear = r.getClearColor(new THREE.Color());
    const prevAlpha = r.getClearAlpha();
    const auto = r.autoClear;
    r.setRenderTarget(this.rt);
    r.setClearColor(0x000000, 0);
    r.clear(true, false, false);
    r.autoClear = false;
    r.render(fish.root, camera);
    r.autoClear = auto;
    for (const [m, mat, vis] of saved) {
      m.material = mat;
      m.visible = vis;
    }
    this.filmMat.uniforms.uTime.value = time;
    this.filmMat.uniforms.uExposure.value = this.exposure;
    r.setRenderTarget(target);
    r.render(this.quadScene, this.quadCam);
    r.setRenderTarget(prevTarget);
    r.setClearColor(prevClear, prevAlpha);
  }
}
