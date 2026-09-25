// Smoke test: build, serve under /blissgarden/, load fixture saves in headless Chrome, click the core actions.
// Fails on any assertion, any console error / page error, and any failed request.
//
//   npm run smoke                 build + vite preview (the default)
//   npm run smoke -- --dev        same checks against the vite dev server
//   node scripts/smoke/run.mjs --static <dir> --legacy --record
//                                 re-record tests/fixtures/*.expected.json from a pre-module build
//                                 (classic scripts served from <dir> at /; --legacy maps window.__bliss onto its globals)
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { findChrome } from './chrome.mjs';
import { snapshot, eventChances, buyEverything, installLegacyShim } from './pageFns.mjs';

const ROOT     = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const FIXTURES = path.join(ROOT, 'tests/fixtures');
const args     = process.argv.slice(2);
const flag     = f => args.includes(f);
const RECORD = flag('--record'), LEGACY = flag('--legacy'), DEV = flag('--dev');
const STATIC = flag('--static') ? path.resolve(args[args.indexOf('--static') + 1]) : null;
const T      = 1790000000000;   // frozen clock for exact load comparisons

const fixture  = name => fs.readFileSync(path.join(FIXTURES, name), 'utf8');
const expected = name => JSON.parse(fixture(name));
const failures = [];
const sleep    = ms => new Promise(r => setTimeout(r, ms));

function check(name, ok, detail = '') {
  console.log(`${ok ? '  ✔' : '  ✘'} ${name}${ok || !detail ? '' : '\n      ' + detail}`);
  if (!ok) failures.push(name);
}
function diff(a, b, p = '', out = []) {
  if (typeof a !== typeof b || Array.isArray(a) !== Array.isArray(b) || (a === null) !== (b === null)) { out.push(`${p}: ${JSON.stringify(a)} -> ${JSON.stringify(b)}`); return out; }
  if (a && typeof a === 'object') {
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
      if (!(k in a)) out.push(`${p}.${k}: (absent) -> ${JSON.stringify(b[k])}`);
      else if (!(k in b)) out.push(`${p}.${k}: ${JSON.stringify(a[k])} -> (absent)`);
      else diff(a[k], b[k], `${p}.${k}`, out);
    }
  } else if (a !== b && !(typeof a === 'number' && Math.abs(a - b) <= 1e-12 * Math.max(1, Math.abs(a)))) out.push(`${p}: ${JSON.stringify(a)} -> ${JSON.stringify(b)}`);
  return out;
}
function golden(name, actual) {
  const file = path.join(FIXTURES, name);
  if (RECORD) { fs.writeFileSync(file, JSON.stringify(actual, null, 1) + '\n'); console.log(`  ● recorded ${name}`); return; }
  const d = diff(expected(name), actual);
  check(`matches ${name}`, d.length === 0, d.slice(0, 12).join('\n      '));
}

// ── Servers ──────────────────────────────────────────────────────────────
async function startServer() {
  if (STATIC) {
    const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' };
    const srv = http.createServer((req, res) => {
      const f = path.join(STATIC, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
      fs.readFile(f, (err, data) => {
        if (err) { res.writeHead(404); return res.end(); }
        res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); res.end(data);
      });
    });
    await new Promise(r => srv.listen(0, r));
    return { url: `http://localhost:${srv.address().port}/`, close: () => srv.close() };
  }
  const vite = await import('vite');
  if (DEV) {
    const server = await vite.createServer({ root: ROOT, logLevel: 'warn', server: { port: 0 } });
    await server.listen();
    return { url: server.resolvedUrls.local[0], close: () => server.close() };
  }
  console.log('building…');
  await vite.build({ root: ROOT, logLevel: 'warn' });
  const server = await vite.preview({ root: ROOT, logLevel: 'warn', preview: { port: 0 } });
  return { url: server.resolvedUrls.local[0], close: () => server.httpServer.close() };
}

// ── Page helpers ─────────────────────────────────────────────────────────
let browser, BASE;
async function open(save, { freeze = 0 } = {}) {
  const ctx  = await browser.createBrowserContext();
  const page = await ctx.newPage();
  page.errors = [];
  page.on('pageerror', e => page.errors.push('pageerror: ' + (e.message || e)));
  page.on('console', m => { if (m.type() === 'error') page.errors.push('console.error: ' + m.text()); });
  page.on('requestfailed', r => page.errors.push('request failed: ' + r.url()));
  page.on('response', r => { if (r.status() >= 400 && !r.url().endsWith('/favicon.ico')) page.errors.push(`HTTP ${r.status()}: ${r.url()}`); });
  page.requests = [];
  page.on('request', r => page.requests.push(r.url()));
  await page.setViewport({ width: 1400, height: 900 });
  await page.evaluateOnNewDocument((save, freeze) => {
    if (!sessionStorage.getItem('__smokeSeeded')) {
      localStorage.clear();
      if (save !== null) localStorage.setItem('blissfarm10', save);
      sessionStorage.setItem('__smokeSeeded', '1');
    }
    if (freeze) {
      Date.now = () => freeze;
      window.setInterval = () => 0;
      let x = 42; Math.random = () => ((x = (x * 16807) % 2147483647) / 2147483647);
    }
  }, save, freeze);
  await page.goto(BASE, { waitUntil: 'load' });
  await settle(page);
  page.close2 = () => ctx.close();
  return page;
}
async function settle(page) {
  await sleep(400);
  if (LEGACY) await page.evaluate(installLegacyShim);
}
async function reload(page) { await page.reload({ waitUntil: 'load' }); await settle(page); }
const xy = (page, sel) => page.evaluate(sel => {
  const el = typeof sel === 'number' ? document.querySelectorAll('#farm-grid .tile')[sel] : document.querySelector(sel);
  const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2];
}, sel);
async function press(page, sel) { const [x, y] = await xy(page, sel); await page.mouse.move(x, y); await page.mouse.down(); }
async function click(page, sel) { await press(page, sel); await page.mouse.up(); }
function errorsClean(page, label) { check(`${label}: no console errors or failed requests`, page.errors.length === 0, page.errors.join('\n      ')); }

// ── Suites ───────────────────────────────────────────────────────────────
const base = extra => JSON.stringify({ coins: 100000, tutorialDone: true, farmName: 'Smoke', debugMode: true, ...extra });

async function loadFixtures() {
  console.log('\nLoad fixtures (frozen clock)');
  for (const [save, exp] of [['legacy-v1.json', 'legacy-v1.expected.json'], ['v2.json', 'v2.expected.json']]) {
    const page = await open(fixture(save), { freeze: T });
    golden(exp, await page.evaluate(snapshot));
    errorsClean(page, save);
    await page.close2();
  }
}

async function assets() {
  console.log('\nAssets');
  const page = await open(fixture('legacy-v1.json'));
  const sprite = page.requests.filter(u => u.endsWith('sprites.png'));
  check('sprites.png requested under the base path', sprite.length > 0 && sprite.every(u => u.startsWith(BASE)), sprite.join(', '));
  const info = await page.evaluate(async () => {
    const bg = getComputedStyle(document.querySelector('#farm-grid .tile .t-icon div')).backgroundImage;
    const url = bg.slice(5, -2);
    const img = new Image(); img.src = url; await img.decode();
    return { url, w: img.naturalWidth, h: img.naturalHeight };
  });
  check(`tile sprite loads (${info.url} ${info.w}×${info.h})`, info.w === 192 && info.h === 1792);
  errorsClean(page, 'assets');
  await page.close2();
}

async function checklist() {
  console.log('\nPhase 1 checklist (real clicks)');
  const page = await open(base());
  const B = fn => page.evaluate(fn);

  const up = await B(() => {
    const card = [...document.querySelectorAll('#upgrades-list .upgrade-card')].find(c => c.textContent.includes('Golden Harvest'));
    card.querySelector('.ug-btn').click();
    const b = window.__bliss; return { sellValue: b.STATE.modifiers.sellValue, shared: b.STATE.upgrades === b.state.upgrades };
  });
  check('value upgrade applies immediately (sell value 1.3)', up.sellValue === 1.3);
  check('STATE.upgrades is state.upgrades', up.shared);

  await B(() => { const b = window.__bliss; b.state.tiles[0] = { seed: 'potato', plantedAt: Date.now(), burnedSeconds: 15 }; b.RenderFarm.renderTile(0); });
  await press(page, 0);
  const [px, py] = await xy(page, '#panel');
  await page.mouse.move(px, py, { steps: 3 }); await page.mouse.up();
  const hv = await B(() => { const s = window.__bliss.state; return { n: s.stats.totalHarvested, ach: !!s.achievements.firstHarvest, inv: s.inventory.potato || 0 }; });
  check('harvest counts totalHarvested and unlocks First Harvest', hv.n === 1 && hv.ach, JSON.stringify(hv));
  check('desktop drop puts the crop in inventory', hv.inv === 1);

  await B(() => { const b = window.__bliss; b.state.weeds[1] = { clicks: b.WEED_CLICKS - 1, spawnedAt: Date.now() };
    b.state.thornedWeeds[2] = { clicks: b.THORNED_WEED_CLICKS - 1, spawnedAt: Date.now() }; b.RenderFarm.renderGrid(); });
  await click(page, 1); await click(page, 2);
  const wd = await B(() => { const s = window.__bliss.state; return { n: s.stats.weedsCleared, ach: !!s.achievements.clearWeed, gone: s.weeds[1] === undefined && s.thornedWeeds[2] === undefined }; });
  check('weed + thorned weed clear, weedsCleared = 2, Weed Puller unlocks', wd.n === 2 && wd.ach && wd.gone, JSON.stringify(wd));

  await B(() => { const b = window.__bliss; b.state.tiles[3] = { seed: 'wheat', plantedAt: Date.now(), burnedSeconds: 1 };
    b.state.rotTiles[3] = { infectedAt: Date.now() }; b.RenderFarm.renderTile(3); });
  await click(page, 3);
  await click(page, '#tile-menu .tmenu-btn');
  await B(() => { const b = window.__bliss; b.state.upgrades.fastCure = true; b.state.tiles[4] = { seed: 'wheat', plantedAt: Date.now(), burnedSeconds: 1 };
    b.state.rotTiles[4] = { infectedAt: Date.now() }; b.RenderFarm.renderTile(4); });
  await click(page, 4);
  const rc = await B(() => { const s = window.__bliss.state; return { n: s.stats.rotCured, ach: !!s.achievements.cureRot, gone: !s.rotTiles[3] && !s.rotTiles[4] }; });
  check('rot cure by menu and by Fast Cure, rotCured = 2, Plant Doctor unlocks', rc.n === 2 && rc.ach && rc.gone, JSON.stringify(rc));

  await B(() => { const b = window.__bliss; b.state.stats.totalHarvested = 999; b.state.tiles[5] = { seed: 'potato', plantedAt: Date.now(), burnedSeconds: 15 }; b.RenderFarm.renderTile(5); });
  await click(page, 5);
  const ms = await B(() => { const b = window.__bliss; return !!b.state.achievements.harvest1000 && !!b.STATE.blueprints.bp_moonShrine; });
  check('harvest #1000 unlocks Seasoned Farmer and the Moon Shrine blueprint', ms);

  const wt = await B(() => {
    const b = window.__bliss; let emitted = 0; b.EventBus.on('crop:watered', () => emitted++);
    b.state.tiles[6] = { seed: 'sunflower', plantedAt: Date.now(), burnedSeconds: 0 };
    const before = b.getEffectiveSpeedMult('sunflower', 6); b.applyWater(6); const after = b.getEffectiveSpeedMult('sunflower', 6);
    const bonus = b.state.tiles[6].sellBonus; b.applyWater(6);
    return { emitted, ratio: +(after / before).toFixed(4), bonus, drowned: !!b.state.tiles[6].drowned, drownBonus: b.state.tiles[6].sellBonus };
  });
  check('watering: crop:watered, ×1.3333 speed, ×1.25 value; second water drowns (×0.25)',
    wt.emitted === 1 && wt.ratio === 1.3333 && wt.bonus === 1.25 && wt.drowned && wt.drownBonus === 0.25, JSON.stringify(wt));

  const lc = await B(() => { const b = window.__bliss; b.state.tiles[7] = { seed: 'carrot', plantedAt: 0, burnedSeconds: 10 }; b.locustAttack(); return b.state.tiles[7].burnedSeconds; });
  check('locust sets growth back 30% of burnedSeconds (10 → 7)', lc === 7, String(lc));

  await B(() => { const b = window.__bliss; b.state.hiredHandCount = 0; b.startItemDrag('hiredHand'); });
  await page.mouse.move(700, 30); await page.mouse.down(); await page.mouse.up();
  check('hired hand refunded on a failed drop', await B(() => window.__bliss.state.hiredHandCount) === 1);

  const pk = await B(() => {
    const b = window.__bliss; const g0 = b.STATE.modifiers.growSpeed; b.STATE.prestige.points = 5; b.RenderPanel.renderPrestige();
    [...document.querySelectorAll('#prestige-section .upgrade-card')].find(c => c.textContent.includes('Fertile Legacy')).querySelector('.ug-btn').click();
    return +(b.STATE.modifiers.growSpeed / g0).toFixed(4);
  });
  check('perk (Fertile Legacy, via its button) applies ×1.25 grow speed at once', pk === 1.25, String(pk));
  const shop = await B(() => { window.__bliss.RenderPanel.renderSeeds(); return document.querySelector('#seeds-list .sr-meta').textContent; });
  check('seed shop shows grow ÷ speed (potato "5 - 12s")', shop === '5 - 12s', shop);

  await B(() => {
    const b = window.__bliss; b.state.coins = 60000; b.checkStages();
    b.state.sellQueue.push({ seed: 'bread', bonus: 1, drowned: false, fungal: false, crafted: true });
    b.state.tiles[8] = { seed: 'sunflower', plantedAt: Date.now(), burnedSeconds: 0 }; b.save();
  });
  await reload(page);
  const r1 = await B(() => { const b = window.__bliss; return { stage: b.STATE.meta.stage, queue: b.state.sellQueue.map(q => q.seed + (q.crafted ? '*' : '')).join(), coins: b.state.coins, burned: b.state.tiles[8].burnedSeconds }; });
  check('stage survives a reload (stage 1)', r1.stage === 1, JSON.stringify(r1));
  check('crafted item keeps its flag through the reload', r1.queue === 'bread*', r1.queue);
  await B(() => { window.__bliss.STATE.session.sellElapsed = 1e9; });
  await sleep(1500);
  const r2 = await B(() => { const b = window.__bliss; return { queue: b.state.sellQueue.length, coins: b.state.coins, burned: b.state.tiles[8].burnedSeconds, sold: b.state.stats.craftedSold }; });
  check('crafted item sells after reload (+80, no freeze)', r2.queue === 0 && r2.coins - r1.coins === 80 && r2.sold === 1, JSON.stringify(r2));
  check('crops keep growing after reload', r2.burned > r1.burned);

  errorsClean(page, 'checklist');
  await page.close2();
}

async function purchases() {
  console.log('\nEvery buy button (frozen clock)');
  const page = await open(base({ coins: 5e6, stagesSeen: { 1: true, 2: true, 3: true, 4: true }, mature: true, reputation: 12 }), { freeze: T });
  golden('purchases.expected.json', await page.evaluate(buyEverything));
  errorsClean(page, 'purchases');
  await page.close2();
}

async function events() {
  console.log('\nEvent chances');
  const page = await open(base(), { freeze: T });
  golden('event-chances.expected.json', await page.evaluate(eventChances));
  errorsClean(page, 'event chances');
  await page.close2();
}

async function saveIO() {
  console.log('\nExport / import');
  let page = await open(fixture('legacy-v1.json'), { freeze: T });
  const before = await page.evaluate(snapshot);
  const exported = await page.evaluate(() => window.__bliss.exportSave());
  await page.close2();

  const importViaUI = async (page, text) => {
    await page.evaluate(() => { document.getElementById('settings-btn').click(); document.getElementById('import-btn').click(); });
    await page.evaluate(t => { document.getElementById('save-io').value = t; }, text);
    const nav = page.waitForNavigation({ timeout: 5000 });
    await page.evaluate(() => document.getElementById('import-btn').click());
    await nav; await settle(page);
  };
  page = await open(null, { freeze: T });
  await importViaUI(page, exported);
  // Debug mode comes from the imported save, so __bliss exists after the reload.
  const d = diff(before, await page.evaluate(snapshot)).filter(x => !x.startsWith('.meta.lastSeen'));
  check('export → import (Settings UI) round-trips to an identical state', d.length === 0, d.join('\n      '));
  errorsClean(page, 'import');
  await page.close2();

  page = await open(null, { freeze: T });
  await importViaUI(page, fixture('legacy-v1.json'));
  const d2 = diff(before, await page.evaluate(snapshot));
  check('importing the raw localStorage JSON equals loading it', d2.length === 0, d2.join('\n      '));
  await page.close2();

  page = await open(fixture('legacy-v1.json'), { freeze: T });
  const stored = await page.evaluate(() => localStorage.getItem('blissfarm10'));
  const msgs = [];
  for (const bad of ['hello world', '{}', JSON.stringify({ version: 3, coins: 1, tiles: [] })]) {
    msgs.push(await page.evaluate(t => {
      document.getElementById('settings-btn').click();
      const io = document.getElementById('save-io'), btn = document.getElementById('import-btn');
      if (io.style.display === 'none') btn.click();
      io.value = t; btn.click();
      return document.getElementById('save-io-msg').textContent;
    }, bad));
  }
  check('bad imports are rejected with a message', msgs.every(m => m && !m.startsWith('Save imported')), msgs.join(' | '));
  check('rejected imports leave the stored save untouched', stored === await page.evaluate(() => localStorage.getItem('blissfarm10')));
  errorsClean(page, 'rejections');
  await page.close2();
}

async function debugGate() {
  if (LEGACY) return;
  console.log('\nDebug gate');
  const page = await open(JSON.stringify({ coins: 10, tutorialDone: true, debugMode: false }));
  check('window.__bliss is absent while debug mode is off', await page.evaluate(() => window.__bliss === undefined));
  await page.evaluate(() => document.getElementById('debug-mode-toggle').click());
  check('window.__bliss appears when debug mode is switched on', await page.evaluate(() => typeof window.__bliss === 'object'));
  errorsClean(page, 'debug gate');
  await page.close2();
}

// ── Main ─────────────────────────────────────────────────────────────────
const server = await startServer();
BASE = server.url;
console.log(`serving ${BASE}${RECORD ? '  (RECORD mode)' : ''}`);
browser = await puppeteer.launch({ executablePath: findChrome(), headless: true, args: ['--no-sandbox', '--mute-audio'] });
try {
  await loadFixtures();
  await assets();
  await checklist();
  await purchases();
  await events();
  await saveIO();
  await debugGate();
} catch (e) {
  failures.push('crashed: ' + (e.stack || e));
  console.error(e);
} finally {
  await browser.close();
  await server.close();
}
console.log(failures.length ? `\nSMOKE FAILED (${failures.length}):\n - ${failures.join('\n - ')}` : '\nSMOKE PASSED');
process.exit(failures.length ? 1 : 0);
