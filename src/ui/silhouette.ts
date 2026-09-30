// 物种剪影: 直接从物种参数生成 (与 3D 模型同源), 用于索引列表.
import * as THREE from 'three';
import { BodyModel } from '../core/body';
import { finFrame } from '../core/parts/fins';
import type { SpeciesSpec } from '../core/spec';

export function drawSilhouette(canvas: HTMLCanvasElement, spec: SpeciesSpec, color: string, finColor: string) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = canvas.clientWidth || 64;
  const H = canvas.clientHeight || 26;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  const b = new BodyModel(spec);
  const L = b.L;
  const polys: { pts: [number, number][]; fin: boolean }[] = [];
  // 身体轮廓
  const top: [number, number][] = [];
  const bot: [number, number][] = [];
  const n = 60;
  for (let i = 0; i <= n; i++) {
    const s = (i / n) * b.sEnd;
    top.push([(s - 0.5) * L, (b.axis(s) + b.top(s)) * L]);
    bot.push([(s - 0.5) * L, (b.axis(s) - b.bottom(s)) * L]);
  }
  polys.push({ pts: [...top, ...bot.reverse()], fin: false });
  // 鳍
  const p = new THREE.Vector3();
  for (const f of spec.fins) {
    if (f.present < 0.05) continue;
    const fr = finFrame(b, f);
    const pts: [number, number][] = [];
    fr.point(0, 0, 1, p);
    pts.push([p.x, p.y]);
    for (let i = 0; i <= 16; i++) {
      fr.point(i / 16, 1, 1, p);
      pts.push([p.x, p.y]);
    }
    fr.point(1, 0, 1, p);
    pts.push([p.x, p.y]);
    polys.push({ pts, fin: true });
  }
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const pl of polys) for (const [x, y] of pl.pts) {
    x0 = Math.min(x0, x); x1 = Math.max(x1, x);
    y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
  const pad = 2;
  const k = Math.min((W - pad * 2) / (x1 - x0), (H - pad * 2) / (y1 - y0));
  const ox = (W - (x1 - x0) * k) / 2 - x0 * k;
  const oy = (H - (y1 - y0) * k) / 2 + y1 * k;
  for (const pl of polys.sort((a, c) => Number(c.fin) - Number(a.fin))) {
    ctx.beginPath();
    pl.pts.forEach(([x, y], i) => {
      const X = ox + x * k;
      const Y = oy - y * k;
      if (i === 0) ctx.moveTo(X, Y);
      else ctx.lineTo(X, Y);
    });
    ctx.closePath();
    ctx.fillStyle = pl.fin ? finColor : color;
    ctx.fill();
  }
}
