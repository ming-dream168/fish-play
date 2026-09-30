// Screenshot test for the FlowTank demo (flowtank.html).
// Needs a running dev server:  npx vite --port 5180 --strictPort
// Usage: node scripts/flowtank-shot.mjs [--out DIR] [--url URL] [--t SIM_SECONDS] [--shots a,b,c]
//        [--w 1600] [--h 900] [--dpr 1] [--div] [--q "extra=query&params"]
// Shots: vorticity, piv, both, stationary, persp, stationary-piv (or name:querystring for custom).
// Uses the installed Google Chrome (real GPU through ANGLE/Metal on macOS).

import { chromium } from 'playwright';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (k, d) => {
  const i = args.indexOf('--' + k);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : d;
};
const flag = (k) => args.includes('--' + k);

const out = opt('out', process.env.FLOWTANK_SHOT_DIR || path.join(os.tmpdir(), 'flowtank-shots'));
const base = opt('url', 'http://127.0.0.1:5180/flowtank.html');
const simSeconds = parseFloat(opt('t', '6'));
const shots = opt('shots', 'vorticity,piv,both,stationary').split(',');
const width = parseInt(opt('w', '1600'), 10);
const height = parseInt(opt('h', '900'), 10);
const dpr = parseFloat(opt('dpr', '1'));
const extra = opt('q', '');

const PRESETS = {
  vorticity: 'mode=vorticity',
  piv: 'mode=piv',
  both: 'mode=both',
  stationary: 'mode=vorticity&swim=0',
  'stationary-piv': 'mode=piv&swim=0',
  persp: 'mode=both&cam=persp',
};

fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
let failures = 0;
try {
  for (const shot of shots) {
    const [name, custom] = shot.includes(':') ? shot.split(/:(.*)/s) : [shot, PRESETS[shot] ?? ''];
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: dpr });
    const logs = [];
    page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
    page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
    const q = ['fixed=1', custom, extra].filter(Boolean).join('&');
    await page.goto(`${base}?${q}`, { waitUntil: 'load' });
    await page.waitForFunction((T) => window.__flowtank && window.__flowtank.simTime >= T, simSeconds, {
      timeout: 180000,
      polling: 100,
    });
    const info = await page.evaluate((withDiv) => {
      const s = window.__flowtank;
      const r = { ...s.stats, fps: s.fps, simTime: s.simTime, frames: s.frames };
      if (withDiv) r.divergence = s.tank.measureDivergence();
      const gl = document.querySelector('canvas').getContext('webgl2');
      const dbg = gl.getExtension('WEBGL_debug_renderer_info');
      r.gpu = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
      r.glError = gl.getError();
      return r;
    }, flag('div'));
    const file = path.join(out, `flowtank-${name}.png`);
    await page.screenshot({ path: file });
    console.log(`${name}: ${file}`);
    console.log('   ' + JSON.stringify(info));
    const bad = logs.filter((l) => /error|warn|GL_INVALID|WebGL/i.test(l));
    for (const l of logs) console.log('   ' + l);
    if (bad.length || info.glError) failures++;
    await page.close();
  }
} finally {
  await browser.close();
}
if (failures) {
  console.log(`${failures} shot(s) reported console warnings/errors`);
  process.exitCode = 1;
}
