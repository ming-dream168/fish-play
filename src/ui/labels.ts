// 图版式标注: 标签排成鱼体上方与下方两排, 细引线指向结构. 每帧随游动更新, 位置经平滑避免抖动.

import * as THREE from 'three';
import type { Part } from '../core/fish';
import type { StructureId } from '../data/types';

export interface LabelItem {
  key: string;
  sid: StructureId;
  part?: Part;
  anchor: () => THREE.Vector3 | null;
  text: string;
  sub?: string;
}

interface Node {
  item: LabelItem;
  el: HTMLDivElement;
  g: SVGGElement;
  line: SVGPolylineElement;
  dot: SVGCircleElement;
  x: number;
  y: number;
  w: number;
  h: number;
  init: boolean;
  alpha: number;
  up: boolean;
  rank: number;
}

const SVGNS = 'http://www.w3.org/2000/svg';
const v = new THREE.Vector3();

export class LabelLayer {
  readonly root: HTMLDivElement;
  private svg: SVGSVGElement;
  private nodes = new Map<string, Node>();
  private sideClock = 0;
  active: string | null = null;
  hover: string | null = null;
  onHover?: (it: LabelItem | null) => void;
  onClick?: (it: LabelItem) => void;
  visible = true;

  constructor(parent: HTMLElement) {
    this.root = document.createElement('div');
    this.root.className = 'labels';
    this.svg = document.createElementNS(SVGNS, 'svg');
    this.root.appendChild(this.svg);
    parent.appendChild(this.root);
  }

  setItems(items: LabelItem[]) {
    const keep = new Set(items.map((i) => i.key));
    for (const [k, n] of this.nodes) {
      if (!keep.has(k)) {
        n.el.remove();
        n.g.remove();
        this.nodes.delete(k);
      }
    }
    this.sideClock = 0;
    for (const it of items) {
      const old = this.nodes.get(it.key);
      if (old) {
        old.item = it;
        old.el.innerHTML = `${it.text}${it.sub ? `<small>${it.sub}</small>` : ''}`;
        old.w = 0;
        continue;
      }
      const el = document.createElement('div');
      el.className = 'lab';
      el.innerHTML = `${it.text}${it.sub ? `<small>${it.sub}</small>` : ''}`;
      el.style.opacity = '0';
      el.addEventListener('mouseenter', () => {
        this.hover = it.key;
        this.onHover?.(this.nodes.get(it.key)?.item ?? it);
      });
      el.addEventListener('mouseleave', () => {
        this.hover = null;
        this.onHover?.(null);
      });
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        this.onClick?.(this.nodes.get(it.key)?.item ?? it);
      });
      this.root.appendChild(el);
      const g = document.createElementNS(SVGNS, 'g');
      const line = document.createElementNS(SVGNS, 'polyline');
      const dot = document.createElementNS(SVGNS, 'circle');
      dot.setAttribute('r', '2');
      g.appendChild(line);
      g.appendChild(dot);
      this.svg.appendChild(g);
      this.nodes.set(it.key, { item: it, el, g, line, dot, x: 0, y: 0, w: 0, h: 0, init: false, alpha: 0, up: true, rank: 0 });
    }
  }

  update(camera: THREE.Camera, W: number, H: number, box: { top: number; bottom: number; cy: number }, reserve: { left: number; right: number }) {
    const all: { n: Node; ax: number; ay: number }[] = [];
    for (const n of this.nodes.values()) {
      const p = n.item.anchor();
      if (!p || !this.visible) {
        n.alpha = 0;
        n.el.style.opacity = '0';
        n.g.style.opacity = '0';
        continue;
      }
      v.copy(p).project(camera);
      if (v.z > 1 || v.z < -1) {
        n.el.style.opacity = '0';
        n.g.style.opacity = '0';
        continue;
      }
      const ax = (v.x * 0.5 + 0.5) * W;
      const ay = (-v.y * 0.5 + 0.5) * H;
      if (!n.w) {
        n.w = n.el.offsetWidth;
        n.h = n.el.offsetHeight;
      }
      all.push({ n, ax, ay });
    }
    // 上下两排尽量均衡: 先按锚点高低分, 多的一侧把最靠中线的挪到另一侧. 每半秒重排一次, 避免随摆尾来回跳.
    if (this.sideClock-- <= 0) {
      this.sideClock = 30;
      const sorted = [...all].sort((a, b) => a.ay - b.ay);
      let nUp = sorted.filter((e) => e.ay < box.cy).length;
      const n = sorted.length;
      nUp = Math.min(Math.max(nUp, Math.floor(n / 2) - 1), Math.ceil(n / 2) + 1);
      sorted.forEach((e, i) => (e.n.up = i < nUp));
    }
    const upper = all.filter((e) => e.n.up);
    const lower = all.filter((e) => !e.n.up);
    const gap = 10;
    const place = (list: typeof upper, up: boolean) => {
      // 按锚点横坐标排序; 两个锚点靠得很近时保持上一帧的先后, 不然鱼一摆动两个标注就来回换位, 平滑后叠在一起
      list.sort((a, b) => a.ax - b.ax);
      for (let i = 0; i + 1 < list.length; i++) {
        const a = list[i];
        const b = list[i + 1];
        if (b.ax - a.ax < 16 && b.n.rank < a.n.rank) {
          list[i] = b;
          list[i + 1] = a;
        }
      }
      list.forEach((e, i) => (e.n.rank = i));
      const tierY = up ? [box.top - 40, box.top - 66] : [box.bottom + 20, box.bottom + 46];
      const lastRight = [-1e9, -1e9];
      const minX = reserve.left + 8;
      const maxX = W - reserve.right - 8;
      for (const it of list) {
        const w = it.n.w;
        const want = Math.min(Math.max(it.ax - w / 2, minX), maxX - w);
        let best = 0;
        let bestX = 0;
        let bestCost = Infinity;
        for (let t = 0; t < 2; t++) {
          const x = Math.max(want, lastRight[t] + gap);
          const cost = Math.abs(x - want) + t * 90;
          if (cost < bestCost) {
            bestCost = cost;
            best = t;
            bestX = x;
          }
        }
        lastRight[best] = bestX + w;
        const ty = tierY[best];
        const n = it.n;
        // 标注排不进可视区 (鱼被放大时), 或者正在查看另一个结构时, 这条标注淡出
        const fits = ty > 64 && ty < H - 150;
        const focusOther = !!this.active && this.nodes.has(this.active) && this.active !== n.item.key;
        const target = fits && !focusOther ? 1 : 0;
        const tx = bestX;
        const tyy = up ? ty - n.h : ty;
        if (!n.init) {
          n.x = tx;
          n.y = tyy;
          n.init = true;
        } else {
          n.x += (tx - n.x) * 0.22;
          n.y += (tyy - n.y) * 0.22;
        }
        n.alpha += Math.sign(target - n.alpha) * Math.min(Math.abs(target - n.alpha), 0.07);
        n.el.style.transform = `translate(${n.x.toFixed(1)}px, ${n.y.toFixed(1)}px)`;
        n.el.style.opacity = String(n.alpha);
        n.el.style.pointerEvents = n.alpha > 0.5 ? 'auto' : 'none';
        const attachX = n.x + n.w / 2;
        const attachY = up ? n.y + n.h : n.y;
        const bendY = attachY + (up ? 10 : -10);
        n.line.setAttribute('points', `${it.ax.toFixed(1)},${it.ay.toFixed(1)} ${it.ax.toFixed(1)},${bendY.toFixed(1)} ${attachX.toFixed(1)},${attachY.toFixed(1)}`);
        n.dot.setAttribute('cx', it.ax.toFixed(1));
        n.dot.setAttribute('cy', it.ay.toFixed(1));
        n.g.style.opacity = String(n.alpha * 0.95);
        const on = this.active === n.item.key || this.hover === n.item.key;
        n.el.classList.toggle('on', on);
        n.g.classList.toggle('on', on);
      }
    };
    place(upper, true);
    place(lower, false);
  }

  clear() {
    this.setItems([]);
  }
}
