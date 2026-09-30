// GPU 拾取: 只渲染光标下的 1 个像素, 输出结构编号与体表参数. 与游动变形完全一致.

import * as THREE from 'three';
import type { Fish, Part } from '../core/fish';
import { makeIdMaterial } from '../core/materials';

export interface PickResult {
  part: Part;
  u: number;
  v: number;
}

export class Picker {
  private rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.FloatType, format: THREE.RGBAFormat });
  private buf = new Float32Array(4);

  constructor(private renderer: THREE.WebGLRenderer) {}

  /** include: 哪些部件参与拾取 (默认 = 当前可见的). 透明的外壳可以排除, 这样能点到里面的器官. */
  pick(fish: Fish, camera: THREE.PerspectiveCamera, x: number, y: number, w: number, h: number, include: (p: Part) => boolean = (p) => p.mesh.visible): PickResult | null {
    const r = this.renderer;
    const saved: [THREE.Mesh, THREE.Material | THREE.Material[], boolean][] = [];
    fish.parts.forEach((p, i) => {
      saved.push([p.mesh, p.mesh.material, p.mesh.visible]);
      if (!include(p)) {
        p.mesh.visible = false;
        return;
      }
      if (!p.mats.id) p.mats.id = makeIdMaterial(fish.shared, p.flags, p.local, i + 1);
      p.mesh.material = p.mats.id;
      p.mesh.visible = true;
    });
    // 主相机可能带有视口偏移 (把鱼挪到面板之间的空白处), 拾取时在它的基础上再取 1 个像素
    const view = camera.view && camera.view.enabled ? { ...camera.view } : null;
    if (view) camera.setViewOffset(view.fullWidth, view.fullHeight, view.offsetX + x, view.offsetY + y, 1, 1);
    else camera.setViewOffset(w, h, x, y, 1, 1);
    const prev = r.getRenderTarget();
    const prevClear = r.getClearColor(new THREE.Color());
    const prevAlpha = r.getClearAlpha();
    r.setRenderTarget(this.rt);
    r.setClearColor(0x000000, 0);
    r.clear();
    r.render(fish.root, camera);
    r.readRenderTargetPixels(this.rt, 0, 0, 1, 1, this.buf);
    r.setRenderTarget(prev);
    r.setClearColor(prevClear, prevAlpha);
    if (view) camera.setViewOffset(view.fullWidth, view.fullHeight, view.offsetX, view.offsetY, view.width, view.height);
    else camera.clearViewOffset();
    for (const [m, mat, vis] of saved) {
      m.material = mat;
      m.visible = vis;
    }
    const id = Math.round(this.buf[0]);
    if (id <= 0 || id > fish.parts.length) return null;
    return { part: fish.parts[id - 1], u: this.buf[1], v: this.buf[2] };
  }
}
