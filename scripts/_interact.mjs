// 交互测试: 切换物种 (截取变形中途), 悬停提示, 点击选择
import { chromium } from 'playwright';
const out = process.argv[2];
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
const logs = [];
page.on('pageerror', (e) => logs.push('[pageerror] ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('404')) logs.push('[error] ' + m.text().slice(0, 300)); });
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'load' });
await page.waitForFunction(() => window.__ready === true, null, { timeout: 20000 });
await page.waitForTimeout(2500);
// 1. 点物种索引里的蓝鳍金枪鱼, 截变形中途
await page.click('.sp:nth-of-type(5)');
await page.waitForTimeout(1300);
await page.screenshot({ path: out + '/i0-morph.png' });
await page.waitForTimeout(2500);
// 2. 悬停鱼身中部
await page.mouse.move(760, 430);
await page.waitForTimeout(600);
await page.screenshot({ path: out + '/i1-hover.png' });
// 3. 点击选择 (活体模式点身体会触发逃逸反射)
await page.mouse.click(760, 430);
await page.waitForTimeout(200);
await page.screenshot({ path: out + '/i2-startle.png' });
// 4. 解剖模式, 点心脏附近
await page.keyboard.press('2');
await page.waitForTimeout(2500);
await page.mouse.move(500, 470);
await page.waitForTimeout(500);
await page.screenshot({ path: out + '/i3-anat-hover.png' });
await page.mouse.click(500, 470);
await page.waitForTimeout(1800);
await page.screenshot({ path: out + '/i4-anat-select.png' });
console.log(logs.join('\n') || 'no errors');
await browser.close();
