import { chromium } from 'playwright';
import path from 'node:path';
const variants = [
  { name: 'chrome-headless-default', opts: { channel: 'chrome', headless: true } },
  { name: 'chrome-headless-metal', opts: { channel: 'chrome', headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-webgpu'] } },
];
for (const v of variants) {
  try {
    const b = await chromium.launch(v.opts);
    const p = await b.newPage();
    await p.goto('file://' + path.resolve('scripts/probe.html'));
    await p.waitForTimeout(300);
    console.log(v.name, await p.title());
    await b.close();
  } catch (e) { console.log(v.name, 'ERR', e.message.split('\n')[0]); }
}
