/**
 * 试听台: 一页按钮 / 滑块, 手动触发 AudioEngine 的每个接口, 人耳验证用.
 * 只给 audio-test.html 用, 不参与应用打包.
 */

import type { AudioEngine, SceneFlavor } from './AudioEngine';
import type { UiKind } from './voices';

const FLAVORS: SceneFlavor[] = ['living', 'anatomy', 'cleared', 'xray', 'flow', 'abyss'];
const UIS: UiKind[] = ['hover', 'click', 'toggle', 'open', 'close', 'scan', 'error'];

export function mountLab(root: HTMLElement, engine: AudioEngine): void {
  const row = (label: string): HTMLDivElement => {
    const d = document.createElement('div');
    d.className = 'row';
    const l = document.createElement('span');
    l.textContent = label;
    d.appendChild(l);
    root.appendChild(d);
    return d;
  };
  const btn = (parent: HTMLElement, text: string, fn: () => void, id?: string): HTMLButtonElement => {
    const b = document.createElement('button');
    b.textContent = text;
    if (id) b.id = id;
    b.addEventListener('click', fn);
    parent.appendChild(b);
    return b;
  };
  const slider = (parent: HTMLElement, min: number, max: number, value: number, step: number, fn: (v: number) => void): HTMLInputElement => {
    const s = document.createElement('input');
    s.type = 'range';
    s.min = String(min); s.max = String(max); s.step = String(step); s.value = String(value);
    s.addEventListener('input', () => fn(parseFloat(s.value)));
    parent.appendChild(s);
    return s;
  };

  const r0 = row('总开关');
  let on = false;
  const toggle = btn(r0, '开启声音', async () => {
    await engine.init();
    on = !on;
    engine.setEnabled(on);
    toggle.textContent = on ? '关闭声音' : '开启声音';
  }, 'lab-toggle');
  slider(r0, 0, 1, 0.8, 0.01, (v) => engine.setVolume(v));

  const r1 = row('场景');
  for (const f of FLAVORS) btn(r1, f, () => engine.setScene(f));

  const r2 = row('深度 m');
  slider(r2, 0, 8000, 0, 10, (v) => engine.setDepth(v));
  const r3 = row('游速');
  slider(r3, 0, 1, 0, 0.01, (v) => engine.setSwimSpeed(v));

  const r4 = row('身体');
  btn(r4, 'heartbeat', () => engine.heartbeat(0.7));
  btn(r4, 'gillPulse', () => engine.gillPulse());
  btn(r4, 'bubble 0.2', () => engine.bubble(0.2));
  btn(r4, 'bubble 0.5', () => engine.bubble(0.5));
  btn(r4, 'bubble 0.9', () => engine.bubble(0.9));
  btn(r4, 'sonar L', () => engine.sonarPing(-0.8));
  btn(r4, 'sonar R', () => engine.sonarPing(0.8));
  btn(r4, 'escape', () => engine.escape());
  btn(r4, 'morph 3s', () => engine.morph(3));

  const r5 = row('界面');
  for (const k of UIS) btn(r5, k, () => engine.ui(k));
  btn(r5, 'toggle off', () => engine.ui('toggle', false));

  const r6 = row('充气');
  slider(r6, 0, 1, 0, 0.005, (v) => engine.inflate(v));
  const r7 = row('X 光');
  let hum = false;
  btn(r7, 'xrayHum 开/关', () => {
    hum = !hum;
    engine.xrayHum(hum);
  });

  const r8 = row('环境事件 (强制触发)');
  for (const k of ['snap', 'bubble', 'creak', 'whale', 'tone', 'ping', 'relay'] as const) btn(r8, k, () => engine.trigger(k));
}
