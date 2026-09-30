// 用法: node scripts/shots.mjs <outDir> <w> <h> <wait> path1 path2 ...  (每个 path 生成 outDir/<序号>.png)
import { chromium } from 'playwright';
const [, , outDir, w = '1600', h = '900', wait = '3000', ...paths] = process.argv;
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
const logs = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !m.text().includes('404')) logs.push(`[${m.type()}] ${m.text().slice(0, 400)}`); });
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}\n${(e.stack || '').split('\n').slice(0, 5).join('\n')}`));
let i = 0;
for (const p of paths) {
  await page.goto('http://127.0.0.1:5173' + p, { waitUntil: 'load' });
  try { await page.waitForFunction(() => window.__ready === true, null, { timeout: 20000 }); } catch { logs.push('[timeout] ' + p); }
  await page.waitForTimeout(+wait);
  const name = `${outDir}/${String(i).padStart(2, '0')}.png`;
  await page.screenshot({ path: name });
  console.log(name, p);
  i++;
}
console.log(logs.slice(0, 20).join('\n') || 'no console errors');
await browser.close();
