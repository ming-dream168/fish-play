// 用法: node scripts/shot.mjs <url-path-and-query> <out.png> [waitMs] [w] [h]
import { chromium } from 'playwright';
const [, , path = '/', out = 'shot.png', wait = '2500', w = '1600', h = '900'] = process.argv;
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
const logs = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text()}`); });
page.on("pageerror", (e) => logs.push(`[pageerror] ${e.message}\n${(e.stack||"").split("\n").slice(0,6).join("\n")}`));
await page.goto('http://127.0.0.1:5173' + path, { waitUntil: 'load' });
try { await page.waitForFunction(() => window.__ready === true, null, { timeout: 20000 }); } catch { logs.push('[timeout] __ready not set'); }
await page.waitForTimeout(+wait);
await page.screenshot({ path: out });
console.log(logs.slice(0, 30).join('\n') || 'no console errors');
await browser.close();
