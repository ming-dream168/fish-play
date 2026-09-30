// 声音引擎验证脚本: 起一个 vite (5181), 用已安装的 Chrome 打开 audio-test.html,
// 跑离线渲染套件 (电平 / NaN / 直流 / 爆音 / 削波) + 实时冒烟测试, 打印统计并给出通过 / 失败.
//
// 用法:
//   node scripts/audio-test.mjs                 # 全套, 自动起停 vite
//   node scripts/audio-test.mjs --only ambience,oneshots
//   node scripts/audio-test.mjs --skip-live
//   node scripts/audio-test.mjs --soak 60       # 另跑 N 秒实时长跑 (泄漏 / 定时器 / 电平)
//   node scripts/audio-test.mjs --png /tmp/png  # 另导出频谱图 PNG
//   node scripts/audio-test.mjs --wav /tmp/wavs # 另外导出几段 WAV 供人耳试听
//   node scripts/audio-test.mjs --url http://127.0.0.1:5181  # 用已在跑的服务, 不自己起
//   node scripts/audio-test.mjs --json out.json # 把原始结果存盘
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true) : def;
};
const PORT = 5181;
const externalUrl = opt('--url', null);
const only = opt('--only', null);
const wavDir = opt('--wav', null);
const jsonOut = opt('--json', null);
const pngDir = opt('--png', null);
const skipLive = args.includes('--skip-live');
const soakSeconds = Number(opt('--soak', 0)) || 0;

// ---------------------------------------------------------------------------
// vite 起停. 用 vite 的 JS API 在本进程内起服务 (等价于 `npx vite --port 5181 --strictPort`), 结束时 close,
// 不产生任何后台进程. 用独立的 cacheDir, 只扫描 audio-test.html, 关掉文件监听和 HMR:
// 这样宿主应用的 dev server / 别人正在改的文件 (比如 index.html 引入了新依赖) 都不会触发本页面的整页重载.
// ---------------------------------------------------------------------------
let server = null;

async function startVite() {
  const { createServer } = await import('vite');
  server = await createServer({
    root,
    configFile: false,
    cacheDir: path.join(root, 'node_modules/.vite-audio-test'),
    optimizeDeps: { entries: ['audio-test.html'] },
    server: { host: '127.0.0.1', port: PORT, strictPort: true, hmr: false, watch: null },
    logLevel: 'warn',
    clearScreen: false,
  });
  await server.listen();
  return `http://127.0.0.1:${PORT}`;
}

async function stopVite() {
  const s = server;
  server = null;
  if (s) await s.close();
}
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { stopVite().finally(() => process.exit(130)); });

/** 页面偶尔会因为 dev server 的依赖优化重载一次, 这时 evaluate 会报 "Execution context was destroyed", 等页面稳定后重试 */
async function withRetry(page, fn, arg) {
  for (let i = 0; ; i++) {
    try {
      return await page.evaluate(fn, arg);
    } catch (e) {
      if (i >= 3 || !/context was destroyed|navigation/i.test(String(e))) throw e;
      await page.waitForLoadState('load');
      await page.waitForFunction(() => window.__ready === true);
    }
  }
}

// ---------------------------------------------------------------------------
// 打印 / 检查
// ---------------------------------------------------------------------------
const checks = [];
const check = (name, ok, detail = '') => checks.push({ name, ok, detail });
const pad = (s, n) => String(s).padEnd(n);
const lpad = (s, n) => String(s).padStart(n);
const f1 = (x) => (Number.isFinite(x) ? x.toFixed(1) : String(x));
const sci = (x) => x.toExponential(1);
const title = (t) => console.log(`\n=== ${t} ${'='.repeat(Math.max(0, 96 - t.length))}`);

function printChain(rows) {
  title('主母线增益校准 (220 Hz 正弦注入主链入口, 量输出 RMS)');
  console.log(rows.map((r) => `${lpad(r.inDb, 4)} dB in -> ${lpad(f1(r.outDb), 6)} dB out  (gain ${lpad(f1(r.gainDb), 5)} dB)`).join('\n'));
}

function printAmbience(rows) {
  title('环境层: RMS / 峰值 / 直流 / 频谱 (窗口 2..18 s, 音量 1.0)');
  console.log(pad('scene', 20) + lpad('RMS dB', 8) + lpad('peak dB', 9) + lpad('centroid', 10) + lpad('DC L', 10) + lpad('DC R', 10) + '  events');
  for (const r of rows) {
    const ev = Object.entries(r.events).map(([k, v]) => `${k}:${v}`).join(' ');
    console.log(pad(r.name, 20) + lpad(f1(r.rmsDb), 8) + lpad(f1(r.peakDb), 9) + lpad(r.centroidHz + ' Hz', 10) + lpad(sci(r.meanL), 10) + lpad(sci(r.meanR), 10) + '  ' + ev);
  }
  console.log('\n每秒 RMS (dBFS):');
  for (const r of rows) console.log(pad(r.name, 20) + r.perSecondDb.map((x) => lpad(f1(x), 6)).join(''));
  console.log('\n倍频带电平 (dBFS)      31    63   125   250   500    1k    2k    4k    8k   16k');
  for (const r of rows) console.log(pad(r.name, 20) + r.bandsDb.map((x) => lpad(f1(x), 6)).join(''));
  console.log('\n2.5 kHz 以上 (枪虾爆裂等) / 左右声道相关 / 渲染速度');
  for (const r of rows) console.log(pad(r.name, 20) + `HF RMS ${lpad(f1(r.hfRmsDb), 6)} dB   HF peak ${lpad(f1(r.hfPeakDb), 6)} dB   L/R corr ${lpad(r.corr.toFixed(2), 5)}   ${lpad(r.xRealtime, 4)}x realtime`);
}

const BAND_NAMES = ['31', '63', '125', '250', '500', '1k', '2k', '4k', '8k', '16k'];

/** 一次性发声相对底噪的余量: 事件峰值 - 底噪在事件主频带 (倍频程) 的电平. 宽带 RMS 会被低频轰鸣主导, 不适合做可听性判据 */
function margins(r, amb) {
  const dom = r.bandsDb.indexOf(Math.max(...r.bandsDb));
  const own = /deepTone/.test(r.name) ? 'abyss' : /glassPing/.test(r.name) ? 'anatomy' : /relay|^xray/.test(r.name) ? 'xray' : 'living d0';
  const bed = amb.find((a) => a.name === own)?.bandsDb[dom] ?? -60;
  const worst = Math.max(...['living d0', 'anatomy', 'cleared', 'xray', 'flow', 'living d0 swim1'].map((n) => amb.find((a) => a.name === n)?.bandsDb[dom] ?? -200));
  return { dom, band: BAND_NAMES[dom], vsBed: r.peakDb - bed, vsWorst: r.peakDb - worst };
}

function printOneShots(rows, amb) {
  title('一次性发声 (孤立渲染, 无底噪). mBed = 峰值 - 底噪在事件主频带的电平; mWorst = 同上, 取所有场景里最吵的底噪');
  console.log(pad('event', 22) + lpad('peak', 7) + lpad('actRMS', 8) + lpad('band', 6) + lpad('mBed', 7) + lpad('mWorst', 8) + lpad('act ms', 8) + lpad('tail ms', 9) + lpad('centroid', 10) + lpad('step/pk', 9) + lpad('click', 7));
  for (const r of rows) {
    const m = margins(r, amb);
    console.log(
      pad(r.name, 22) + lpad(f1(r.peakDb), 7) + lpad(f1(r.activeRmsDb), 8) + lpad(m.band, 6) + lpad(f1(m.vsBed), 7) + lpad(f1(m.vsWorst), 8) +
        lpad(r.activeMs, 8) + lpad(r.tailMs, 9) + lpad(r.centroidHz, 10) + lpad(r.stepRatio.toFixed(2), 9) + lpad(f1(r.click), 7),
    );
  }
  console.log('\n倍频带电平 (dBFS)      31    63   125   250   500    1k    2k    4k    8k   16k');
  for (const r of rows) console.log(pad(r.name, 22) + r.bandsDb.map((x) => lpad(f1(x), 6)).join(''));
}

/** 可听余量的期望区间 [min, max] (dB) 以及最坏场景下的下限 */
function expectFor(name) {
  if (name === 'amb: snap') return null;
  if (name === 'ui hover') return { min: 6, max: 30, worst: null };
  if (name.startsWith('ui ')) return { min: 12, max: 34, worst: 6 };
  if (name.startsWith('amb:')) return { min: 3, max: 22, worst: null };
  if (name.startsWith('xray')) return { min: 0, max: 24, worst: null };
  if (name === 'escape') return { min: 10, max: 40, worst: null };
  return { min: 8, max: 36, worst: null };
}

function printTimeline(name, t) {
  title(name);
  console.log(`peak ${f1(t.peakDb)} dBFS   RMS ${f1(t.rmsDb)} dBFS   DC L ${sci(t.meanL)} R ${sci(t.meanR)}   non-finite ${t.nonFinite}`);
  console.log('per-second RMS: ' + t.perSecondDb.map(f1).join('  '));
  console.log('events: ' + JSON.stringify(t.events));
}

// ---------------------------------------------------------------------------
async function main() {
  const url = externalUrl || (await startVite());
  console.log(`serving at ${url}${externalUrl ? '' : ' (in-process vite, closed on exit)'}`);
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(0);
    const pageErrors = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));
    page.on('console', (m) => {
      const t = m.text();
      if (t.startsWith('[suite')) console.log('  ' + t);
      else if (m.type() === 'error') pageErrors.push('console.error: ' + t);
    });
    await page.goto(`${url}/audio-test.html`);
    await page.waitForFunction(() => window.__ready === true);

    // -------- 离线套件
    const onlyArr = only && only !== true ? String(only).split(',') : undefined;
    const res = await withRetry(page, (o) => window.__audioTest.runSuite(o), onlyArr);
    console.log(`\nChrome: ${res.meta.ua.match(/Chrome\/[\d.]+/)?.[0]}, suite time ${res.meta.seconds.toFixed(1)} s`);

    if (res.chain) printChain(res.chain);

    if (res.ambience) {
      printAmbience(res.ambience);
      const by = Object.fromEntries(res.ambience.map((r) => [r.name, r]));
      for (const r of res.ambience) {
        check(`amb ${r.name}: RMS in [-38, -26] dBFS`, r.rmsDb >= -38 && r.rmsDb <= -26, `${f1(r.rmsDb)}`);
        check(`amb ${r.name}: peak < -1 dBFS`, r.peakDb < -1, `${f1(r.peakDb)}`);
        check(`amb ${r.name}: no NaN/Inf`, r.nonFinite === 0);
        check(`amb ${r.name}: DC < 1e-3`, Math.abs(r.meanL) < 1e-3 && Math.abs(r.meanR) < 1e-3, `${sci(r.meanL)} ${sci(r.meanR)}`);
        check(`amb ${r.name}: no warnings`, r.errors.length === 0, r.errors.join('; '));
        check(`amb ${r.name}: stereo image sane (L/R corr in [-0.1, 0.9])`, r.corr >= -0.1 && r.corr <= 0.9, String(r.corr));
      }
      if (by['living d0'] && by['living d4000'] && by['living d8000']) {
        check('depth: darker (centroid falls 0 -> 4000 -> 8000 m)', by['living d0'].centroidHz > by['living d4000'].centroidHz && by['living d4000'].centroidHz >= by['living d8000'].centroidHz,
          `${by['living d0'].centroidHz} > ${by['living d4000'].centroidHz} >= ${by['living d8000'].centroidHz}`);
        check('depth: shrimp crackle present at 0 m, gone by 1000 m', (by['living d0'].events.snap ?? 0) > 10 && (by['living d1000'].events.snap ?? 0) === 0,
          `snaps d0=${by['living d0'].events.snap ?? 0} d1000=${by['living d1000'].events.snap ?? 0}`);
      }
      if (by.abyss) check('abyss: no crackle', (by.abyss.events.snap ?? 0) === 0);
    }

    if (res.oneshots) {
      const amb = res.ambience ?? [];
      printOneShots(res.oneshots, amb);
      for (const r of res.oneshots) {
        const m = margins(r, amb);
        const ex = expectFor(r.name) ?? { min: -Infinity, max: Infinity, worst: null };
        check(`one-shot ${r.name}: peak < -1 dBFS`, r.peakDb < -1, `${f1(r.peakDb)}`);
        check(`one-shot ${r.name}: not harsh (peak <= -6 dBFS)`, r.peakDb <= -6, `${f1(r.peakDb)}`);
        check(`one-shot ${r.name}: no NaN/warnings`, r.nonFinite === 0 && r.errors.length === 0, r.errors.join('; '));
        check(`one-shot ${r.name}: audible but soft (margin over bed in [${ex.min}, ${ex.max}] dB)`, m.vsBed >= ex.min && m.vsBed <= ex.max, `${f1(m.vsBed)} in ${m.band} band`);
        if (ex.worst !== null) check(`one-shot ${r.name}: still audible in the noisiest scene (>= ${ex.worst} dB)`, m.vsWorst >= ex.worst, `${f1(m.vsWorst)}`);
        // 本来就带瞬态的声音 (枪虾 / 继电器 / 吱嘎的粘滑脉冲 / 声呐起音的水压 "边") 放宽, 其余必须平滑
        const impulsive = /snap|relay|creak|sonar/.test(r.name);
        check(`one-shot ${r.name}: no unintended click (score <= ${impulsive ? 16 : 8})`, r.click <= (impulsive ? 16 : 8), `${r.click}`);
        if (/^(ui|sonar|heartbeat|bubble)/.test(r.name)) check(`one-shot ${r.name}: no click (step/peak < 0.6)`, r.stepRatio < 0.6, `${r.stepRatio}`);
        if (r.name.startsWith('ui ')) check(`one-shot ${r.name}: short (active <= 160 ms)`, r.activeMs <= 160, `${r.activeMs} ms`);
      }
    }

    if (res.timeline) {
      printTimeline('12 s 综合时间线 (环境 + 全部一次性发声 + 电嗡声), 音量 1.0', res.timeline);
      const t = res.timeline;
      check('timeline: peak < -1 dBFS', t.peakDb < -1, f1(t.peakDb));
      check('timeline: no NaN/Inf', t.nonFinite === 0);
      check('timeline: DC < 1e-3', Math.abs(t.meanL) < 1e-3 && Math.abs(t.meanR) < 1e-3);
      check('timeline: no warnings', t.errors.length === 0, t.errors.join('; '));
    }
    if (res.stress) {
      printTimeline('压力测试: 所有声音同时反复触发, 音量 1.0', res.stress);
      check('stress: peak < -1 dBFS', res.stress.peakDb < -1, f1(res.stress.peakDb));
      check('stress: no NaN/Inf', res.stress.nonFinite === 0);
      check('stress: no warnings', res.stress.errors.length === 0, res.stress.errors.join('; '));
    }

    if (res.transitions) {
      title('过渡: 开关 / 切场景 / 音量 / 层摘除重接 / 深度扫动 (clickScore: 10 ms 块内二阶差分 最大值/RMS, 平滑信号约 4, 爆音 > 10)');
      for (const t of res.transitions) console.log(`${t.name}\n   ${JSON.stringify(t.detail)}`);
      const by = (prefix) => res.transitions.find((t) => t.name.startsWith(prefix))?.detail;
      const CLICK = 7;
      const dis = by('disable at');
      check('disable: output goes silent (< -90 dBFS)', dis.afterDb < -90, f1(dis.afterDb));
      check('disable: fade takes about 0.6 s (>= 25 dB down at 0.55 s)', dis.fade_0p5_to_0p6s_db <= -25, f1(dis.fade_0p5_to_0p6s_db));
      check('disable: no click', dis.clickDuring <= CLICK, `${dis.clickDuring}`);
      const en = by('enable at');
      check('enable from disabled: silent before, audible after', en.beforeDb < -90 && en.steadyDb > -40, `${f1(en.beforeDb)} -> ${f1(en.steadyDb)}`);
      check('enable: fade-in has no click', en.clickDuring <= CLICK, `${en.clickDuring}`);
      const sc = by('scene living -> abyss');
      check('scene switch: no click', sc.clickDuring <= CLICK, `${sc.clickDuring}`);
      const vol = by('volume');
      check('volume 1.0 -> 0.5 gives about -12 dB (+-1) vs control render', Math.abs(vol.deltaDb + 12.04) <= 1, f1(vol.deltaDb));
      check('volume change: no click', vol.clickDuring <= CLICK, `${vol.clickDuring}`);
      const re = by('scene anatomy -> living');
      check('re-attaching detached layers: no click', re.clickDuring <= CLICK, `${re.clickDuring}`);
      check('re-attach: settles to the living level (-36..-27 dBFS)', re.settledDb <= -27 && re.settledDb >= -36, String(re.settledDb));
      const sw = by('swim 0 -> 1');
      check('swim on/off: no click', sw.clickDuring <= CLICK && sw.clickAfter <= CLICK, `${sw.clickDuring} / ${sw.clickAfter}`);
      check('swim 1 is louder than swim 0 and level returns after', sw.duringDb - sw.beforeDb >= 0.5 && Math.abs(sw.afterDb - sw.beforeDb) <= 3, `${sw.beforeDb} -> ${sw.duringDb} -> ${sw.afterDb}`);
      const hop = by('rapid scene hopping');
      check('rapid scene hopping: same level as control (+-1 dB), no click, no warnings', Math.abs(hop.settledDb - hop.controlDb) <= 1 && hop.clickDuring <= CLICK && hop.errors === 0, `${hop.settledDb} vs ${hop.controlDb}, click ${hop.clickDuring}`);
      const cd = by('click detector self-test');
      check('click detector self-test: an injected step scores > 10 (detector is sensitive)', cd.withStep > 10 && cd.clean < 7, `clean ${cd.clean}, step ${cd.withStep}`);
      const dp = by('depth sweep');
      check('depth sweep: no click, no warnings', dp.clickDuring <= CLICK && dp.errors === 0, `${dp.clickDuring}`);
    }

    if (res.trains) {
      title('周期性触发 (16 s, 相对同种子的纯底噪渲染): 长时间重复不能盖过底噪');
      console.log(pad('train', 34) + lpad('RMS', 8) + lpad('vs bed', 8) + lpad('peak', 8));
      for (const t of res.trains) {
        console.log(pad(t.name, 34) + lpad(f1(t.rmsDb), 8) + lpad(f1(t.deltaDb), 8) + lpad(f1(t.peakDb), 8));
        check(`train ${t.name}: peak < -1 dBFS`, t.peakDb < -1, f1(t.peakDb));
        check(`train ${t.name}: adds <= 5 dB RMS over the bed (not fatiguing)`, t.deltaDb <= 5, f1(t.deltaDb));
      }
    }

    if (res.dsp) {
      title('DSP 自检: 噪声无缝循环 / 谱斜率 / 混响衰减');
      console.log('loop seam step / mean step (1 = seamless): ' + JSON.stringify(res.dsp.seamRatio));
      console.log('spectral slope dB/oct (white 0, pink -3, brown -6): ' + JSON.stringify(res.dsp.slopeDbPerOct));
      console.log(`reverb through the full chain: RT60 ~ ${res.dsp.reverb.rt60} s, centroid early ${res.dsp.reverb.centroidEarlyHz} Hz -> late ${res.dsp.reverb.centroidLateHz} Hz`);
      console.log('energy decay curve at 0.25 0.5 1 1.5 2 2.5 3 s: ' + res.dsp.reverb.decayDb.join('  '));
      for (const [k, v] of Object.entries(res.dsp.seamRatio)) check(`noise ${k}: loop seam is seamless (step <= 4x mean step)`, v <= 4, String(v));
      check('noise pink slope near -3 dB/oct', Math.abs(res.dsp.slopeDbPerOct.pink + 3) <= 1, String(res.dsp.slopeDbPerOct.pink));
      check('noise brown slope near -6 dB/oct', Math.abs(res.dsp.slopeDbPerOct.brown + 6) <= 1.5, String(res.dsp.slopeDbPerOct.brown));
      check('reverb RT60 about 2.5 s (1.5 .. 3.5)', res.dsp.reverb.rt60 >= 1.5 && res.dsp.reverb.rt60 <= 3.5, String(res.dsp.reverb.rt60));
      check('reverb gets darker over time (late centroid < early centroid)', res.dsp.reverb.centroidLateHz < res.dsp.reverb.centroidEarlyHz, `${res.dsp.reverb.centroidEarlyHz} -> ${res.dsp.reverb.centroidLateHz}`);
    }

    if (res.robustness) {
      title('鲁棒性: 乱参数 (NaN / Infinity / 负数 / undefined / 字符串 / 对象)');
      console.log(res.robustness.log.join('\n'));
      check('robustness: junk input never throws, output finite and < -1 dBFS', res.robustness.ok);
    }
    if (res.sampleRates) {
      title('采样率无关性 (living + 几个一次性发声)');
      for (const s of res.sampleRates) console.log(`${lpad(s.sr, 6)} Hz  RMS ${f1(s.rmsDb)}  peak ${f1(s.peakDb)}  centroid ${s.centroidHz} Hz`);
      const rms = res.sampleRates.map((s) => s.rmsDb);
      check('sample rates: RMS within 2.5 dB across 22.05k..96k', Math.max(...rms) - Math.min(...rms) <= 2.5, rms.map(f1).join(' '));
      check('sample rates: peak < -1 dBFS everywhere', res.sampleRates.every((s) => s.peakDb < -1));
    }
    if (res.determinism) {
      title('确定性 (同种子同调用序列)');
      console.log(JSON.stringify(res.determinism));
      check('determinism: same seed gives the same render (max diff < -100 dBFS)', res.determinism.maxDiff < 1e-5, `maxDiff ${res.determinism.maxDiff}`);
    }

    // -------- 实时冒烟 (需要真实用户手势: 用 playwright 点击按钮)
    let smoke = null;
    if (!skipLive) {
      await page.reload();
      await page.waitForFunction(() => window.__ready === true);
      await page.click('#smoke');
      await page.waitForFunction(() => window.__smoke !== undefined);
      smoke = await page.evaluate(() => window.__smoke);
      title('实时 AudioContext 冒烟测试 (真实点击手势触发 init)');
      console.log(JSON.stringify(smoke, null, 2));
      check('live: no error', !smoke.error, smoke.error || '');
      check('live: init inside click gesture -> context running & ready', smoke.stateAfterInit === 'running' && smoke.readyAfterInit === true, `${smoke.stateAfterInit} ready=${smoke.readyAfterInit}`);
      check('live: init idempotent', smoke.initIdempotent === true);
      check('live: audio clock runs in real time (0.85..1.15)', smoke.clockRatio > 0.85 && smoke.clockRatio < 1.15, String(smoke.clockRatio));
      check('live: ambience audible in the real graph (> -60 dBFS RMS)', smoke.ambienceLive.rmsDb > -60, f1(smoke.ambienceLive.rmsDb));
      check('live: live peak < -1 dBFS', smoke.eventsLive.peakDb < -1, f1(smoke.eventsLive.peakDb));
      check('live: hidden tab suspends, visible again resumes', smoke.stateHidden === 'suspended' && smoke.stateVisibleAgain === 'running', `${smoke.stateHidden} / ${smoke.stateVisibleAgain}`);
      check('live: setEnabled(false) suspends, true resumes', smoke.stateDisabled === 'suspended' && smoke.stateReenabled === 'running', `${smoke.stateDisabled} / ${smoke.stateReenabled}`);
      check('live: dispose closes the context', smoke.stateAfterDispose === 'closed', String(smoke.stateAfterDispose));
      check('live: no engine warnings', (smoke.warnings || []).length === 0, (smoke.warnings || []).join('; '));
      check('live: tick is cheap (< 1 ms avg)', smoke.tickAvgMs < 1, String(smoke.tickAvgMs));
    }
    if (soakSeconds > 0) {
      await page.reload();
      await page.waitForFunction(() => window.__ready === true);
      await page.evaluate((n) => { window.__soakSeconds = n; }, soakSeconds);
      await page.click('#soak');
      await page.waitForFunction(() => window.__soak !== undefined);
      const sk = await page.evaluate(() => window.__soak);
      title(`实时长跑 ${soakSeconds} s (随机触发全部接口, 每 12 s 换场景, 深度 / 游速随机游走)`);
      console.log(JSON.stringify(sk, null, 2));
      check('soak: no error / warnings', !sk.error && (sk.warnings || []).length === 0, sk.error || (sk.warnings || []).join('; '));
      check('soak: audio clock real-time (0.9..1.1)', sk.clockRatio > 0.9 && sk.clockRatio < 1.1, String(sk.clockRatio));
      check('soak: peak < -1 dBFS at volume 1.0', sk.peakDb < -1, String(sk.peakDb));
      check('soak: voice count bounded (< 40)', sk.maxVoices < 40, String(sk.maxVoices));
      check('soak: no node leak (voices/scopes back to 0 after disable)', sk.voicesAfterDisable === 0 && sk.scopesAfterDisable === 0, `${sk.voicesAfterDisable}/${sk.scopesAfterDisable}`);
      const late = (sk.samples || []).slice(-3).map((s) => s.scopes);
      check('soak: scope count stable in the last samples', late.length === 0 || Math.max(...late) < 25, late.join(','));
    }
    check('page: no uncaught errors / console.error', pageErrors.length === 0, pageErrors.join('; '));

    if (wavDir && wavDir !== true) {
      await page.reload();
      await page.waitForFunction(() => window.__ready === true);
      const wavs = await page.evaluate(() => window.__audioTest.renderWavs());
      fs.mkdirSync(wavDir, { recursive: true });
      for (const [k, b64] of Object.entries(wavs)) fs.writeFileSync(path.join(wavDir, `${k}.wav`), Buffer.from(b64, 'base64'));
      console.log(`\nWAV 已写入 ${wavDir}: ${Object.keys(wavs).join(', ')}`);
    }
    if (pngDir && pngDir !== true) {
      await page.reload();
      await page.waitForFunction(() => window.__ready === true);
      const pngs = await page.evaluate(() => window.__audioTest.renderSpectrograms());
      fs.mkdirSync(pngDir, { recursive: true });
      for (const [k, url] of Object.entries(pngs)) fs.writeFileSync(path.join(pngDir, `${k}.png`), Buffer.from(url.split(',')[1], 'base64'));
      console.log(`\n频谱图已写入 ${pngDir}: ${Object.keys(pngs).join(', ')}`);
    }
    if (jsonOut && jsonOut !== true) fs.writeFileSync(jsonOut, JSON.stringify({ res, smoke }, null, 2));
  } finally {
    await browser.close();
  }

  title('检查结果');
  const bad = checks.filter((c) => !c.ok);
  for (const c of bad) console.log(`FAIL  ${c.name}${c.detail ? '   [' + c.detail + ']' : ''}`);
  console.log(`\n${checks.length - bad.length}/${checks.length} checks passed${bad.length ? `, ${bad.length} FAILED` : ''}`);
  return bad.length === 0 ? 0 : 1;
}

let code = 1;
try {
  code = await main();
} catch (e) {
  console.error(e);
} finally {
  await stopVite();
}
process.exit(code);
