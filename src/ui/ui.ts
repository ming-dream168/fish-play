// 图鉴界面: 物种索引 (系统发育排列), 标本卡, 模式与图层控制, 生理监测, 结构标注.

import * as THREE from 'three';
import './style.css';
import type { Fish, Part } from '../core/fish';
import type { Mode, ModeController, LayerKey } from '../render/modes';
import { SPECIES_ORDER, type SpeciesId, type StructureId } from '../data/types';
import { speciesInfo, structureInfo, SYSTEM_ZH } from '../data';
import { drawSilhouette } from './silhouette';
import { EcgMonitor } from './ecg';
import { LabelLayer, type LabelItem } from './labels';
import type { SpeciesSpec } from '../core/spec';

export interface App {
  fish: Fish;
  modes: ModeController;
  camera: THREE.PerspectiveCamera;
  species: SpeciesId;
  selected: Part | null;
  paused: boolean;
  xrayExposure: number;
  soundOn: boolean;
  flowVisual: 'vorticity' | 'piv' | 'both';
  selectSpecies(id: SpeciesId): void;
  setMode(m: Mode): void;
  select(p: Part | null, focus?: boolean): void;
  hover(p: Part | null): void;
  setPaused(b: boolean): void;
  setSpeed(k: number): void;
  toggleSound(): Promise<void>;
  demo(id: string): void;
  demoFor(species: SpeciesId, index: number): { id: string; label: string } | null;
  specOf(id: SpeciesId): SpeciesSpec | null;
  setFlowVisual(v: 'vorticity' | 'piv' | 'both'): void;
  sfx(kind: 'hover' | 'click' | 'toggle' | 'open' | 'close'): void;
  /** 界面面板尺寸变了, 重新计算取景. */
  relayout(): void;
}

const MODE_DEF: { m: Mode; zh: string; c: string; key: string }[] = [
  { m: 'living', zh: '活体', c: '#7ff0dc', key: '1' },
  { m: 'anatomy', zh: '解剖', c: '#ebe5d6', key: '2' },
  { m: 'cleared', zh: '透明染色', c: '#f0436f', key: '3' },
  { m: 'xray', zh: 'X 光', c: '#bcd6ff', key: '4' },
  { m: 'flow', zh: '流场', c: '#7cff6b', key: '5' },
];

const LAYER_DEF: { k: LayerKey; zh: string; c: string }[] = [
  { k: 'skin', zh: '皮肤', c: '#a9dcff' },
  { k: 'muscle', zh: '肌肉', c: '#e0643f' },
  { k: 'skeleton', zh: '骨骼', c: '#ebe3cc' },
  { k: 'organs', zh: '内脏', c: '#d99a86' },
  { k: 'vessels', zh: '循环', c: '#cc1f2d' },
  { k: 'nerves', zh: '神经', c: '#f1e3cf' },
];

// 标注清单: 每种模式挑最有信息量的结构
const LABELS: Record<Mode, string[]> = {
  living: ['illicium', 'esca', 'male', 'spines', 'scutes', 'barbels', 'fringe', 'finlets', 'fin:dorsalFin', 'fin:adiposeFin', 'fin:secondDorsalFin', 'fin:caudalFin', 'fin:analFin', 'fin:pelvicFin', 'fin:pectoralFin', 'eye', '@operculum', '@lateralLine', '@nares', 'teeth', 'beak'],
  anatomy: ['brain', 'weberian', 'pharyngealTeeth', 'gills', 'filterPads', 'heart', 'liver', 'stomach', 'caeca', 'intestine', 'swimBladder', 'sonicMuscle', 'kidney', 'gonad', 'rete', 'rectalGland', 'rostralOrgan', 'muscle', 'redMuscle', 'notochord', 'lobedSkeleton', 'vertebrae', 'ribs', 'arteries', 'spleen', 'veins', 'eye', 'neural', 'spinalCord', 'neurocranium', 'gallBladder'],
  cleared: ['neurocranium', 'jaws', 'beak', 'opercular', 'gillArches', 'otoliths', 'weberian', 'pharyngealTeeth', 'pectoralGirdle', 'vertebrae', 'neural', 'haemal', 'ribs', 'intermuscular', 'pterygiophores', 'caudalSkeleton', 'finrays:dorsalFin', 'pelvicGirdle', 'branchiostegals', 'lobedSkeleton'],
  xray: ['neurocranium', 'otoliths', 'weberian', 'pharyngealTeeth', 'opercular', 'vertebrae', 'ribs', 'swimBladder', 'pterygiophores', 'caudalSkeleton', 'intermuscular', 'pectoralGirdle', 'eye', 'finrays:caudalFin'],
  flow: ['fin:caudalFin', 'fin:dorsalFin', 'fin:pectoralFin'],
};

const CLADE_NOTE = '按系统发育排列: 软骨鱼 → 软骨硬鳞鱼 → 真骨鱼. 左侧树线是它们的亲缘关系.';

// 系统发育树 (嵌套数组, 叶子是物种). 索引列表按叶子顺序排列, 树线按这个拓扑画.
// 软骨鱼 → 鲟 (软骨硬鳞类) → 真骨鱼: 鲤 (骨鳔类), 鲑, 再到鲈形总目: 金枪鱼与带鱼同属鲭形目,
// 黄鳝 (合鳃鱼目) 与真鲈类 (大黄鱼, 鮟鱇, 河鲀) 更近, 鮟鱇目与鲀形目互为姊妹.
type Clade = SpeciesId | Clade[];
const TREE: Clade = ['whaleshark', ['sturgeon', ['carp', ['chum', [['bluefin', 'hairtail'], ['ricefield', ['largeyellow', ['goosefish', 'puffer']]]]]]]];
const leaves = (c: Clade): SpeciesId[] => (Array.isArray(c) ? c.flatMap(leaves) : [c]);

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, html?: string) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
}

const fmt = (n: number, d = 0) => n.toLocaleString('zh-CN', { maximumFractionDigits: d, minimumFractionDigits: d });

export class AtlasUI {
  readonly root: HTMLDivElement;
  readonly labels: LabelLayer;
  private card: HTMLElement;
  private ctx: HTMLDivElement;
  private modeBtns = new Map<Mode, HTMLButtonElement>();
  private spBtns = new Map<SpeciesId, HTMLButtonElement>();
  private ecg: EcgMonitor;
  private vit: Record<string, HTMLElement> = {};
  private tip: HTMLDivElement;
  private toastEl: HTMLDivElement;
  private toastT = 0;
  private cladeSvg: SVGSVGElement;
  private indexEl: HTMLElement;
  private tools: Record<string, HTMLButtonElement> = {};
  private mouse = { x: 0, y: 0 };
  private hoverSid: StructureId | null = null;

  constructor(private app: App) {
    this.labels = new LabelLayer(document.body);
    this.root = el('div', 'ui');
    document.body.appendChild(this.root);

    // 标题
    const mast = el('header', 'mast');
    mast.innerHTML = `<div class="word">ICHTHYOTOMIA</div><div class="cn">鱼类解剖图鉴</div><div class="sub">程序化生成 · 无模型文件 · 实时解剖</div>`;
    this.root.appendChild(mast);

    // 物种索引
    this.indexEl = el('nav', 'index');
    this.indexEl.setAttribute('aria-label', '物种索引');
    const head = el('div', 'index-head', `<span>标本</span><span>${SPECIES_ORDER.length} 种</span>`);
    this.indexEl.appendChild(head);
    for (const id of leaves(TREE)) {
      const spec = app.specOf(id);
      const info = speciesInfo(id);
      const b = el('button', 'sp') as HTMLButtonElement;
      b.type = 'button';
      b.setAttribute('aria-pressed', String(id === app.species));
      b.disabled = !spec;
      b.innerHTML = `<span></span><canvas></canvas><span class="names"><span class="zh">${info?.zh ?? id}</span><span class="la">${info?.latin ?? ''}</span></span>`;
      b.addEventListener('click', () => {
        app.sfx('click');
        app.selectSpecies(id);
      });
      b.addEventListener('mouseenter', () => app.sfx('hover'));
      this.indexEl.appendChild(b);
      this.spBtns.set(id, b);
    }
    this.cladeSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.cladeSvg.classList.add('clade');
    this.indexEl.appendChild(this.cladeSvg);
    this.indexEl.appendChild(el('div', 'clade-note', CLADE_NOTE));
    this.root.appendChild(this.indexEl);

    // 工具
    const tools = el('div', 'tools');
    const mk = (key: string, label: string, icon: string, fn: () => void) => {
      const t = el('button', 'tool', `${icon}<span>${label}</span>`) as HTMLButtonElement;
      t.type = 'button';
      t.setAttribute('aria-pressed', 'false');
      t.addEventListener('click', fn);
      tools.appendChild(t);
      this.tools[key] = t;
    };
    mk('sound', '声音', '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M2 6h3l4-3v10L5 10H2z"/><path d="M11.5 5.5a3.5 3.5 0 0 1 0 5M13 3.5a6 6 0 0 1 0 9"/></svg>', async () => {
      await app.toggleSound();
      this.tools.sound.setAttribute('aria-pressed', String(app.soundOn));
    });
    mk('pause', '暂停', '<svg viewBox="0 0 16 16" fill="currentColor"><rect x="4" y="3" width="3" height="10" rx="0.8"/><rect x="9" y="3" width="3" height="10" rx="0.8"/></svg>', () => {
      app.setPaused(!app.paused);
      this.syncTools();
    });
    this.root.appendChild(tools);

    // 右侧卡片
    this.card = el('aside', 'card');
    this.root.appendChild(this.card);
    // 窄屏: 卡片可以收起, 让鱼占满大半个屏幕
    const fold = el('button', 'card-fold', '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 6l4 4 4-4"/></svg>') as HTMLButtonElement;
    fold.type = 'button';
    fold.setAttribute('aria-label', '收起卡片');
    fold.addEventListener('click', () => {
      const min = this.root.classList.toggle('card-min');
      fold.setAttribute('aria-label', min ? '展开卡片' : '收起卡片');
      app.sfx(min ? 'close' : 'open');
      setTimeout(() => app.relayout(), 380);
    });
    this.root.appendChild(fold);

    // 底部
    const dock = el('div', 'dock');
    this.ctx = el('div', 'ctx') as HTMLDivElement;
    const modes = el('div', 'modes');
    modes.setAttribute('role', 'group');
    modes.setAttribute('aria-label', '观察模式');
    for (const d of MODE_DEF) {
      const b = el('button', 'mode', `<i></i><span>${d.zh}</span>`) as HTMLButtonElement;
      b.type = 'button';
      b.style.setProperty('--c', d.c);
      b.title = `${d.zh} (${d.key})`;
      b.setAttribute('aria-pressed', String(app.modes.mode === d.m));
      b.addEventListener('click', () => {
        app.sfx('toggle');
        app.setMode(d.m);
      });
      modes.appendChild(b);
      this.modeBtns.set(d.m, b);
    }
    dock.appendChild(this.ctx);
    dock.appendChild(modes);
    this.root.appendChild(dock);

    // 生理监测
    const vit = el('section', 'vitals');
    vit.setAttribute('aria-label', '生理监测');
    vit.innerHTML = `<div class="top"><span>生理监测 · 实时</span><span data-k="sp"></span></div><canvas></canvas>
      <div class="vit-grid">
        <div class="vit"><div class="k">心率</div><div class="v hr" data-k="hr"></div></div>
        <div class="vit"><div class="k">鳃呼吸</div><div class="v" data-k="br"></div></div>
        <div class="vit"><div class="k">尾拍</div><div class="v" data-k="tb"></div></div>
        <div class="vit"><div class="k">体温</div><div class="v" data-k="tc"></div></div>
      </div>`;
    this.root.appendChild(vit);
    vit.querySelectorAll<HTMLElement>('[data-k]').forEach((e) => (this.vit[e.dataset.k!] = e));
    this.ecg = new EcgMonitor(vit.querySelector('canvas')!);

    this.tip = el('div', 'tip') as HTMLDivElement;
    document.body.appendChild(this.tip);
    this.toastEl = el('div', 'toast') as HTMLDivElement;
    this.toastEl.setAttribute('role', 'status');
    document.body.appendChild(this.toastEl);

    this.labels.onHover = (it) => {
      app.hover(it?.part ?? null);
      if (it) app.sfx('hover');
    };
    this.labels.onClick = (it) => {
      app.sfx('click');
      if (it.part) app.select(it.part, true);
      else this.showStructure(it.sid);
    };

    addEventListener('pointermove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });
    addEventListener('keydown', (e) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      const d = MODE_DEF.find((x) => x.key === e.key);
      if (d) app.setMode(d.m);
      if (e.key === ' ') {
        e.preventDefault();
        app.setPaused(!app.paused);
        this.syncTools();
      }
      if (e.key === 'Escape') app.select(null);
    });

    this.refreshSilhouettes();
    this.renderContext();
    this.renderSpecies();
    this.refreshLabels();
    requestAnimationFrame(() => this.drawClade());
    addEventListener('resize', () => this.drawClade());
    // 网页字体加载完后行高会变, 树线要跟着重画
    document.fonts?.ready.then(() => this.drawClade());
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => this.drawClade()).observe(this.indexEl);
  }

  // ---------- 物种索引 ----------
  refreshSilhouettes() {
    for (const [id, b] of this.spBtns) {
      const spec = this.app.specOf(id);
      if (!spec) continue;
      const cv = b.querySelector('canvas')!;
      const on = id === this.app.species;
      drawSilhouette(cv, spec, on ? '#f0436f' : '#b9b3a5', on ? 'rgba(240,67,111,0.55)' : 'rgba(185,179,165,0.45)');
    }
  }

  private drawClade() {
    const svg = this.cladeSvg;
    const rows = [...this.spBtns.values()];
    if (!rows.length || !rows[0].offsetHeight) return;
    const top0 = rows[0].offsetTop;
    const ys = rows.map((r) => r.offsetTop - top0 + r.offsetHeight / 2);
    const h = rows[rows.length - 1].offsetTop + rows[rows.length - 1].offsetHeight - top0;
    svg.style.top = `${top0}px`;
    svg.style.height = `${h}px`;
    svg.setAttribute('viewBox', `0 0 26 ${h}`);
    // 直角分支图: 内节点的横坐标按深度往右排, 纵坐标取首末两个子节点的中点
    const leafX = 22;
    const ids = [...this.spBtns.keys()];
    const yOf = new Map(ids.map((id, i) => [id, ys[i]]));
    let paths = '';
    const draw = (c: Clade, depth: number): { x: number; y: number } => {
      if (!Array.isArray(c)) return { x: leafX, y: yOf.get(c) ?? 0 };
      const x = 3 + depth * 2.3;
      const kids = c.map((k) => draw(k, depth + 1));
      for (const k of kids) paths += `M${k.x} ${k.y}H${x}`;
      paths += `M${x} ${kids[0].y}V${kids[kids.length - 1].y}`;
      return { x, y: (kids[0].y + kids[kids.length - 1].y) / 2 };
    };
    draw(TREE, 0);
    const dots = ys.map((y, i) => `<circle cx="${leafX + 1.5}" cy="${y}" r="2.4" data-i="${i}"/>`).join('');
    svg.innerHTML = `<path d="${paths}"/>${dots}`;
    // 让选中行的圆点变色
    rows.forEach((r, i) => {
      const c = svg.querySelector(`circle[data-i="${i}"]`);
      if (c) c.setAttribute('style', r.getAttribute('aria-pressed') === 'true' ? 'fill:#f0436f;stroke:#f0436f' : '');
    });
  }

  syncSpecies() {
    for (const [id, b] of this.spBtns) b.setAttribute('aria-pressed', String(id === this.app.species));
    this.refreshSilhouettes();
    this.drawClade();
    this.renderSpecies();
    this.refreshLabels();
  }

  // ---------- 卡片 ----------
  renderSpecies() {
    const id = this.app.species;
    const info = speciesInfo(id);
    const idx = SPECIES_ORDER.indexOf(id) + 1;
    const c = this.card;
    c.innerHTML = '';
    if (!info) {
      c.appendChild(el('div', 'eyebrow', `<span>标本 ${String(idx).padStart(2, '0')}</span>`));
      c.appendChild(el('h2', '', id));
      return;
    }
    c.appendChild(el('div', 'eyebrow', `<span>标本 ${String(idx).padStart(2, '0')} / ${String(SPECIES_ORDER.length).padStart(2, '0')}</span><span>${info.taxonomy.class.split(' ')[0]}</span>`));
    const h = el('div');
    h.appendChild(el('h2', '', info.zh));
    h.appendChild(el('div', 'latin', `${info.latin}<small>${info.authority}</small>`));
    c.appendChild(h);
    c.appendChild(el('div', 'taxo', `${info.en}<br>${info.taxonomy.order} · ${info.taxonomy.family}`));
    const st = el('div', 'stats');
    const lt = { TL: '全长', FL: '叉长', SL: '标准长' }[info.size.lengthType];
    const stat = (k: string, v: string) => `<div class="stat"><div class="k">${k}</div><div class="v">${v}</div></div>`;
    // 没有可靠数值的项 (资料里填 0) 显示破折号, 不显示 0
    const len = !(info.size.maxLengthCm > 0) ? '—' : info.size.maxLengthCm >= 100 ? `${fmt(info.size.maxLengthCm / 100, 1)} m` : `${fmt(info.size.maxLengthCm)} cm`;
    st.innerHTML =
      stat(`最大${lt}`, len) +
      stat('最大体重', info.size.maxWeightKg ? `${fmt(info.size.maxWeightKg, info.size.maxWeightKg < 10 ? 1 : 0)} kg` : '—') +
      stat('栖息深度', info.depth.maxM > 0 ? `${fmt(info.depth.minM)}–${fmt(info.depth.maxM)} m` : '—') +
      stat('保护等级', `<span class="iucn" data-s="${info.iucn}">${info.iucn}</span>${info.iucnYear ?? ''}`);
    c.appendChild(st);
    const m = info.meristics;
    const rows: [string, string | undefined][] = [
      ['D', m.dorsal],
      ['A', m.anal],
      ['P', m.pectoral],
      ['V', m.pelvic],
      ['C', m.caudal],
      ['脊椎', m.vertebrae],
      ['侧线', m.lateralLine],
    ];
    const dl = el('dl', 'formula');
    dl.innerHTML = rows.filter((r) => r[1]).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
    if (dl.innerHTML) c.appendChild(dl);
    c.appendChild(el('p', '', `<b style="color:var(--bone);font-weight:600">${info.swimming.zh}游泳</b> <span style="font-family:var(--f-display);font-style:italic">${info.swimming.mode}</span>. ${info.swimming.note}`));
    c.appendChild(el('p', '', info.summary));
    const hl = el('div', 'hl');
    info.highlights.forEach((x, i) => {
      const demo = this.app.demoFor(id, i);
      const b = el(demo ? 'button' : 'div', 'hl-item', `<b>${x.title}</b>${demo ? `<em class="go">${demo.label} →</em>` : ''}<span>${x.body}</span>`);
      if (demo) {
        (b as HTMLButtonElement).type = 'button';
        b.addEventListener('click', () => {
          this.app.sfx('open');
          this.app.demo(demo.id);
        });
      }
      hl.appendChild(b);
    });
    c.appendChild(hl);
    if (info.sources.length) {
      // 同一网站出现多次时加序号, 免得几条链接看起来一模一样
      const seen = new Map<string, number>();
      const links = info.sources.map((u) => {
        const d = u.replace(/^https?:\/\//, '').split('/')[0];
        const k = (seen.get(d) ?? 0) + 1;
        seen.set(d, k);
        return `<a href="${u}" target="_blank" rel="noopener">${d}${k > 1 ? ` (${k})` : ''}</a>`;
      });
      c.appendChild(el('div', 'src', '资料: ' + links.join(' · ')));
    }
    c.scrollTop = 0;
  }

  showStructure(sid: StructureId) {
    const s = structureInfo(sid);
    const note = s.speciesNotes?.[this.app.species];
    const c = this.card;
    const old = c.querySelector('.struct');
    old?.remove();
    const box = el('section', 'struct');
    box.innerHTML = `<div class="sys">${SYSTEM_ZH[s.system]}</div><h3>${s.zh}<small>${s.latin ?? s.en}</small></h3>${s.body ? `<p>${s.body}</p>` : ''}${note ? `<div class="note">${note}</div>` : ''}`;
    const close = el('button', 'close', '← 返回物种概览') as HTMLButtonElement;
    close.type = 'button';
    close.addEventListener('click', () => this.app.select(null));
    box.appendChild(close);
    c.prepend(box);
    c.scrollTop = 0;
  }

  hideStructure() {
    this.card.querySelector('.struct')?.remove();
  }

  // ---------- 模式与图层 ----------
  syncMode() {
    for (const [m, b] of this.modeBtns) b.setAttribute('aria-pressed', String(m === this.app.modes.mode));
    this.renderContext();
    this.refreshLabels();
  }

  syncTools() {
    this.tools.pause.setAttribute('aria-pressed', String(this.app.paused));
    this.tools.pause.querySelector('span')!.textContent = this.app.paused ? '继续' : '暂停';
    this.tools.sound.setAttribute('aria-pressed', String(this.app.soundOn));
    // 游速可能被演示改动 (带鱼竖起时放慢)
    const sp = this.ctx.querySelector<HTMLInputElement>('#swim-speed');
    if (sp) {
      const v = Math.max(0.2, this.app.fish.swimScale);
      sp.value = String(v);
      const o = sp.parentElement?.querySelector('output');
      if (o) o.textContent = `${v.toFixed(2)}×`;
    }
  }

  renderContext() {
    const app = this.app;
    const md = app.modes;
    const c = this.ctx;
    c.innerHTML = '';
    const chip = (label: string, on: boolean, fn: () => void, color?: string, plain = false) => {
      const b = el('button', 'chip' + (plain ? ' plain' : ''), label) as HTMLButtonElement;
      b.type = 'button';
      b.setAttribute('aria-pressed', String(on));
      if (color) b.style.setProperty('--c', color);
      b.addEventListener('click', () => {
        app.sfx('toggle');
        fn();
        this.renderContext();
        this.refreshLabels();
      });
      c.appendChild(b);
      return b;
    };
    const sep = () => c.appendChild(el('span', 'sep'));
    const slider = (id: string, label: string, min: number, max: number, step: number, val: number, show: (v: number) => string, fn: (v: number) => void) => {
      const w = el('label', 'slider');
      w.innerHTML = `<span>${label}</span><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${val}"><output>${show(val)}</output>`;
      const inp = w.querySelector('input')!;
      const out = w.querySelector('output')!;
      inp.addEventListener('input', () => {
        const v = Number(inp.value);
        out.textContent = show(v);
        fn(v);
      });
      c.appendChild(w);
    };
    if (md.mode === 'anatomy') {
      chip('透视', md.view === 'ghost', () => md.setView('ghost'), '#a9dcff');
      chip('剖开', md.view === 'dissect', () => md.setView('dissect'), '#e0643f');
      sep();
      for (const l of LAYER_DEF) chip(l.zh, md.layers[l.k], () => md.setLayer(l.k, !md.layers[l.k]), l.c);
      sep();
      chip('半剖头骨', md.cutaway, () => {
        md.cutaway = !md.cutaway;
        md.apply();
      }, '#f0436f');
    } else if (md.mode === 'xray') {
      slider('xray-exp', '曝光', 1, 6, 0.1, app.xrayExposure, (v) => `${Math.round(30 + v * 10)} kVp`, (v) => (app.xrayExposure = v));
      chip('游动', !app.paused, () => app.setPaused(!app.paused), '#7ff0dc');
    } else if (md.mode === 'cleared') {
      c.appendChild(el('span', 'chip plain', '<b style="color:#f0436f">●</b>&nbsp;茜素红 · 硬骨'));
      c.appendChild(el('span', 'chip plain', '<b style="color:#5b97ff">●</b>&nbsp;阿利新蓝 · 软骨'));
      sep();
      chip('游动', !app.paused, () => app.setPaused(!app.paused), '#7ff0dc');
    } else if (md.mode === 'flow') {
      chip('涡量', app.flowVisual === 'vorticity', () => app.setFlowVisual('vorticity'), '#5b97ff');
      chip('示踪粒子', app.flowVisual === 'piv', () => app.setFlowVisual('piv'), '#7cff6b');
      chip('叠加', app.flowVisual === 'both', () => app.setFlowVisual('both'), '#ebe5d6');
      sep();
      c.appendChild(el('span', 'chip plain', '<b style="color:#3d8bff">●</b>&nbsp;逆时针涡&nbsp;&nbsp;<b style="color:#ef3e6d">●</b>&nbsp;顺时针涡'));
      const st = el('span', 'chip plain');
      st.dataset.k = 'st';
      c.appendChild(st);
      slider('swim-speed', '游速', 0.2, 2, 0.05, app.fish.swimScale, (v) => `${v.toFixed(2)}×`, (v) => app.setSpeed(v));
    } else {
      chip('游动', !app.paused, () => app.setPaused(!app.paused), '#7ff0dc');
      slider('swim-speed', '游速', 0.2, 2, 0.05, Math.max(0.2, app.fish.swimScale), (v) => `${v.toFixed(2)}×`, (v) => app.setSpeed(v));
    }
  }

  // ---------- 标注 ----------
  refreshLabels() {
    const app = this.app;
    const f = app.fish;
    const list = LABELS[app.modes.mode];
    const items: LabelItem[] = [];
    const body = () => f.bodyA;
    for (const key of list) {
      if (key.startsWith('@')) {
        const b = body();
        const s = b.spec;
        let sid: StructureId;
        let at: () => THREE.Vector3;
        if (key === '@operculum') {
          if (s.gill.slits > 0) continue;
          sid = 'operculum';
          at = () => body().surface(body().opEdgeS(0.1) - 0.02, body().thetaAt(body().opEdgeS(0.1) - 0.02, 0.1));
        } else if (key === '@lateralLine') {
          sid = 'lateralLine';
          at = () => body().surface(0.6, body().thetaAt(0.6, body().lateralH(0.6)));
        } else {
          if (s.gill.slits > 0) continue;
          sid = 'nares';
          at = () => body().surface(body().spec.eye.s - body().spec.eye.r * 1.2, body().thetaAt(body().spec.eye.s - body().spec.eye.r * 1.2, body().spec.eye.h + 0.08));
        }
        const info = structureInfo(sid);
        items.push({
          key,
          sid,
          text: info.zh,
          anchor: () => {
            const p = at();
            f.midline.deform(p, p);
            return f.root.localToWorld(p);
          },
        });
        continue;
      }
      const p = f.parts.find((x) => x.key === key);
      if (!p || !p.anchorA) continue;
      if (!this.partPresent(p)) continue;
      if (app.modes.mode !== 'xray' && !app.modes.materialFor(p)) continue;
      const info = structureInfo(p.sid);
      items.push({ key, sid: p.sid, part: p, text: info.zh, anchor: () => (p.mesh.visible || app.modes.mode === 'xray' ? f.anchorWorld(p) : null) });
    }
    // 窄屏排不下那么多, 只留排在前面的; 当前选中的结构总是保留
    const cap = innerWidth < 860 ? 10 : app.modes.mode === 'anatomy' ? 15 : 14;
    const keep = items.slice(0, cap);
    const sel = app.selected ? items.find((it) => it.part === app.selected) : undefined;
    if (sel && !keep.includes(sel)) keep[keep.length - 1] = sel;
    this.labels.setItems(keep);
  }

  /** 该结构在当前物种里是否存在 (缩放为零的不标). */
  private partPresent(p: Part) {
    const s = this.app.fish.specA;
    const fin = (id: string) => s.fins.find((x) => x.id === id)?.present ?? 0;
    switch (p.key) {
      case 'fin:adiposeFin':
      case 'fin:secondDorsalFin':
      case 'fin:pelvicFin':
      case 'fin:dorsalFin':
      case 'fin:analFin':
      case 'fin:pectoralFin':
        return fin(p.key.slice(4)) > 0.05;
      case 'notochord':
        return s.skeleton.notochord > 0.5;
      case 'vertebrae':
        return s.skeleton.notochord < 0.5;
      case 'lobedSkeleton':
        return s.fins.some((x) => x.lobe > 0);
      case 'caeca':
        return s.organs.caeca.count > 0;
      case 'swimBladder':
        return s.organs.swimBladder.kind !== 0;
      case 'ribs':
        return s.skeleton.ribs > 0.05;
      case 'intermuscular':
        return s.skeleton.intermuscular > 0.05;
      case 'teeth':
        return s.mouth.teeth > 0;
      case 'opercular':
        return s.skeleton.opercle > 0.05;
      case 'illicium':
      case 'esca':
        return s.extras.lure.len > 0;
      case 'male':
        return s.extras.parasiticMale > 0;
      case 'spines':
        return s.extras.spines.count > 0;
      case 'finlets':
        return s.extras.finlets.dorsal > 0;
      case 'scutes':
        return s.extras.scutes.dorsal + s.extras.scutes.lateral + s.extras.scutes.ventral > 0;
      case 'barbels':
        return s.extras.barbels.items.some((x) => x.len > 0);
      case 'beak':
        return s.skeleton.beak > 0.05;
      case 'filterPads':
        return s.extras.filterPads > 0.05;
      case 'fringe':
        return s.extras.fringe.len > 0 && s.extras.fringe.jaw + s.extras.fringe.body > 0;
      case 'weberian':
        return s.skeleton.weberian > 0.05;
      case 'pharyngealTeeth':
        return s.skeleton.pharyngeal > 0.05;
      case 'rete':
        return s.organs.rete > 0;
      case 'sonicMuscle':
        return s.organs.sonicMuscle > 0;
      case 'rectalGland':
        return s.organs.rectalGland > 0;
      case 'rostralOrgan':
        return s.extras.rostralOrgan > 0;
      case 'gills':
      case 'redMuscle':
        return true;
    }
    return true;
  }

  // ---------- 提示 ----------
  toast(msg: string, ms = 2600) {
    this.toastEl.textContent = msg;
    this.toastEl.classList.add('show');
    this.toastT = ms / 1000;
  }

  setHover(sid: StructureId | null) {
    this.hoverSid = sid;
    if (!sid) {
      this.tip.style.opacity = '0';
      return;
    }
    const s = structureInfo(sid);
    this.tip.innerHTML = `${s.zh}<small>${SYSTEM_ZH[s.system]} · ${s.en}</small>`;
    this.tip.style.opacity = '1';
  }

  update(dt: number, box: { top: number; bottom: number; cy: number }) {
    const app = this.app;
    const f = app.fish;
    // 标注
    const W = innerWidth;
    const H = innerHeight;
    const narrow = W < 860;
    this.labels.active = app.selected ? app.selected.key : null;
    this.labels.update(app.camera, W, H, box, narrow ? { left: 0, right: 0 } : { left: 290, right: 380 });
    // 心电
    const hr = f.specA.physiology.heartRate + (f.specB.physiology.heartRate - f.specA.physiology.heartRate) * f.morph;
    this.ecg.push(app.paused ? 0 : dt, (tb) => {
      const ph = f.heart - (tb * hr) / 60;
      return ph - Math.floor(ph);
    });
    this.ecg.draw();
    const br = f.specA.physiology.breathRate + (f.specB.physiology.breathRate - f.specA.physiology.breathRate) * f.morph;
    const tc = f.specA.physiology.tempC + (f.specB.physiology.tempC - f.specA.physiology.tempC) * f.morph;
    const endo = f.specA.physiology.endotherm + (f.specB.physiology.endotherm - f.specA.physiology.endotherm) * f.morph;
    this.vit.hr.innerHTML = `${Math.round(hr)}<small>bpm</small>`;
    // 金枪鱼与鲨鱼靠游动时张口让水流过鳃 (冲压通气), 不做鳃盖泵动
    this.vit.br.innerHTML = br < 0.5 ? `冲压<small>通气</small>` : `${Math.round(br)}<small>/min</small>`;
    this.vit.tb.innerHTML = `${(f.swim.freq * (0.35 + 0.65 * f.swimScale)).toFixed(1)}<small>Hz</small>`;
    this.vit.tc.innerHTML = `${(tc + endo).toFixed(0)}<small>°C</small>`;
    const info = speciesInfo(app.species);
    this.vit.sp.textContent = info ? info.zh : '';
    // 流场: 斯特劳哈尔数 St = f·A / U (高效游泳的鱼多在 0.2 到 0.4 之间)
    if (app.modes.mode === 'flow') {
      const stEl = this.ctx.querySelector<HTMLElement>('[data-k="st"]');
      if (stEl) {
        const sw = f.swim;
        const k = f.swimScale;
        const freq = sw.freq * (0.35 + 0.65 * k);
        const A = 2 * Math.max(0.005, sw.amp[0] + sw.amp[1] + sw.amp[2]) * k;
        const U = sw.speed * Math.max(0.15, k);
        stEl.innerHTML = `St&nbsp;<b style="font-family:var(--f-mono);color:var(--bone)">${((freq * A) / U).toFixed(2)}</b>&nbsp;&nbsp;U&nbsp;<b style="font-family:var(--f-mono);color:var(--bone)">${U.toFixed(2)}</b>&nbsp;L/s`;
      }
    }
    // 提示框跟随鼠标
    if (this.hoverSid) this.tip.style.transform = `translate(${this.mouse.x + 14}px, ${this.mouse.y + 16}px)`;
    if (this.toastT > 0) {
      this.toastT -= dt;
      if (this.toastT <= 0) this.toastEl.classList.remove('show');
    }
  }
}
