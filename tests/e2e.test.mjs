// Browser end-to-end tests. Needs playwright-core + a Chromium binary:
//   cd tests && npm install && node --test e2e.test.mjs
// Chromium is found via PLAYWRIGHT_CHROMIUM_PATH, /opt/pw-browsers/chromium,
// or playwright-core's own download. Skips (doesn't fail) if unavailable.
// Serves the app through the companion server so auth/sync are covered too.

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 8600 + Math.floor(Math.random() * 300);
const BASE = `http://127.0.0.1:${PORT}`;

let chromium = null;
try { ({ chromium } = await import('playwright-core')); } catch { /* not installed */ }

const executablePath = [
  process.env.PLAYWRIGHT_CHROMIUM_PATH,
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  '/opt/pw-browsers/chromium/chrome'
].find((p) => p && existsSync(p));

const available = Boolean(chromium && (executablePath || process.env.PLAYWRIGHT_BROWSERS_PATH));
const t = (name, fn) => test(name, { skip: available ? false : 'playwright-core/Chromium not available' }, fn);

let proc, dataDir, browser, context, page;
const consoleErrors = [];

before(async () => {
  if (!available) return;
  dataDir = await mkdtemp(path.join(tmpdir(), 'elements-e2e-'));
  proc = spawn(process.execPath, [path.join(ROOT, 'server', 'index.mjs')], {
    env: {
      ...process.env, PORT: String(PORT), DEV_FAKE_AUTH: '1',
      ADMIN_EMAILS: 'teacher@test.school', SESSION_SECRET: 'e2e-secret',
      DATA_DIR: dataDir, MONGODB_URI: ''
    },
    stdio: 'ignore'
  });
  for (let i = 0; i < 50; i++) {
    try { if ((await fetch(BASE + '/api/health')).ok) break; } catch { /* retry */ }
    await new Promise((r) => setTimeout(r, 100));
  }
  browser = await chromium.launch(executablePath ? { executablePath } : {});
  context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  page = await context.newPage();
  page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push('console: ' + m.text()); });
});

after(async () => {
  await browser?.close();
  proc?.kill();
  if (dataDir) await rm(dataDir, { recursive: true, force: true });
});

t('periodic table renders all 118 elements', async () => {
  await page.goto(BASE + '/#/home');
  await page.waitForSelector('.el-tile');
  assert.equal(await page.locator('.el-tile').count(), 118);
});

t('featured profile and never-measured mystery card', async () => {
  await page.goto(BASE + '/#/element/6');
  await page.waitForSelector('.superpower');
  await page.waitForSelector('#crystal-canvas'); // carbon has the crystal viewer
  await page.goto(BASE + '/#/element/118');
  await page.waitForSelector('.mystery-props'); // oganesson: honest unknowns
});

t('journey: chapter 2 unlocks after meeting all of chapter 1', async () => {
  await page.goto(BASE + '/#/learn');
  await page.waitForSelector('.chapter');
  assert.equal(await page.locator('.chapter').count(), 25);
  const lockedBefore = await page.locator('.chapter.locked').count();
  for (const n of [8, 7, 1, 2]) {
    await page.goto(`${BASE}/#/element/${n}`);
    await page.waitForSelector('.superpower');
  }
  await page.goto(BASE + '/#/learn');
  await page.waitForSelector('.chapter');
  const lockedAfter = await page.locator('.chapter.locked').count();
  assert.equal(lockedBefore - lockedAfter, 1);
  assert.equal(await page.locator('.chapter.complete').count(), 1);
});

t('intro proton counter names the right elements', async () => {
  await page.goto(BASE + '/#/intro');
  await page.click('#intro-next');
  await page.click('#intro-next');
  await page.waitForSelector('#p-plus');
  await page.click('#p-plus');
  await page.click('#p-plus');
  assert.match(await page.locator('.proton-element').textContent(), /Lithium/);
});

t('detective is solvable and match is winnable', async () => {
  await page.goto(BASE + '/#/detective');
  await page.waitForSelector('.option-btn');
  for (let i = 0; i < 6; i++) {
    if (await page.locator('#next-case').count()) break;
    await page.locator('.option-btn:not([disabled])').first().click();
    await page.waitForTimeout(550);
  }
  assert.ok(await page.locator('#next-case').count());

  await page.goto(BASE + '/#/match');
  await page.waitForSelector('.match-card');
  const pairs = (await (await fetch(BASE + '/data/games.json')).json()).match;
  const objectByName = Object.fromEntries(pairs.map((p) => [p.name, p.object]));
  const nameByObject = Object.fromEntries(pairs.map((p) => [p.object, p.name]));
  for (let i = 0; i < 6; i++) {
    const first = page.locator('.match-card:not(.matched)').first();
    const sub = (await first.locator('.mc-sub').textContent()).trim();
    await first.click();
    await page.locator('.match-card:not(.matched) .mc-sub', { hasText: objectByName[sub] || nameByObject[sub] }).last().click();
    await page.waitForTimeout(120);
  }
  assert.equal(await page.locator('.match-card.matched').count(), 12);
});

t('family finder and heavier-or-lighter play correctly', async () => {
  await page.goto(BASE + '/#/family');
  await page.waitForSelector('.family-options .option-btn');
  for (let i = 0; i < 4; i++) {
    if (await page.locator('#next-el').count()) break;
    await page.locator('.option-btn:not([disabled])').first().click();
    await page.waitForTimeout(120);
  }
  assert.ok(await page.locator('#next-el').count());

  const kid = (await (await fetch(BASE + '/data/kid-content.json')).json()).featured;
  await page.goto(BASE + '/#/heavier');
  await page.waitForSelector('.versus-card');
  const ns = await page.$$eval('.versus-card', (cards) => cards.map((c) => c.dataset.n));
  const denser = kid[ns[0]].props.density >= kid[ns[1]].props.density ? ns[0] : ns[1];
  await page.click(`.versus-card[data-n="${denser}"]`);
  await page.waitForSelector('#next-round');
  assert.match(await page.locator('#status').textContent(), /Streak: 1/);
});

t('compare picker only offers measurable elements', async () => {
  await page.goto(BASE + '/#/compare');
  await page.waitForSelector('.verdict');
  assert.equal(await page.locator('#pick-a option').count(), 97);
});

t('auth: dev login syncs and merges progress', async () => {
  await page.goto(BASE + '/#/home');
  await page.waitForFunction(() => window.__devLogin, null, { timeout: 8000 });
  await page.evaluate(() => window.__devLogin('kid@test.school', 'Test Kid'));
  await page.waitForSelector('.avatar');
  await page.waitForTimeout(2000); // debounce window
  const remote = await page.evaluate(() =>
    fetch('/api/progress', { credentials: 'same-origin' }).then((r) => r.json()));
  assert.ok(remote.progress.visited.includes(8)); // synced from earlier tests
});

t('desktop chrome: sidebar nav and hover preview', async () => {
  await page.goto(BASE + '/#/home');
  await page.waitForSelector('.el-tile');
  const tabbarBox = await page.locator('.tabbar').boundingBox();
  assert.ok(tabbarBox.width < 300 && tabbarBox.height > 500, 'tabbar is a left sidebar at 1440px');
  await page.hover('.el-tile[data-el="26"]');
  await page.waitForTimeout(150);
  assert.match(await page.locator('#el-preview').textContent(), /Iron/);
});

t('works offline via service worker', async () => {
  await page.goto(BASE + '/#/learn');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForTimeout(1500); // let precache finish
  await context.setOffline(true);
  await page.goto(BASE + '/#/element/79');
  await page.waitForSelector('.superpower', { timeout: 5000 });
  await context.setOffline(false);
});

t('scientists gallery, bio page, and linkify in element profiles', async () => {
  await page.goto(BASE + '/#/scientists');
  await page.waitForSelector('.sci-card');
  assert.ok(await page.locator('.sci-card').count() >= 40, 'gallery shows 40+ scientists');

  await page.fill('#sci-filter', 'curie');
  await page.waitForTimeout(200);
  assert.ok(await page.locator('.sci-card:not([hidden])').count() >= 1, 'filter finds Curie');

  await page.locator('.sci-card:not([hidden])').first().click();
  await page.waitForSelector('.sci-hero');
  assert.ok(await page.locator('.sci-el-chip').count() >= 1, 'bio page shows element chips');

  await page.locator('.breadcrumb .text-link').click();
  await page.waitForSelector('.sci-grid');

  await page.goto(BASE + '/#/element/9');
  await page.waitForSelector('.el-hero');
  assert.ok(await page.locator('.sci-link').count() >= 1, 'Fluorine links to a scientist');
  const href = await page.locator('.sci-link').first().getAttribute('href');
  await page.locator('.sci-link').first().click();
  await page.waitForSelector('.sci-hero');
  assert.ok(href.startsWith('#/scientists/'), 'navigated to scientist bio');
});

t('accessibility: skip link, focus management, aria-current, game status', async () => {
  await page.goto(BASE + '/#/learn');
  await page.waitForSelector('.chapter');
  assert.ok(await page.locator('.skip-link').count(), 'skip-to-content link exists');
  assert.equal(await page.locator('.tab[aria-current="page"]').count(), 1, 'one tab has aria-current');
  assert.match(await page.locator('.tab[aria-current="page"]').textContent(), /Learn/);

  await page.goto(BASE + '/#/home');
  await page.waitForSelector('.el-tile');
  assert.match(await page.locator('.tab[aria-current="page"]').textContent(), /Explore/);

  const title = await page.title();
  assert.ok(title.includes('Elements'), 'title includes app name');

  await page.goto(BASE + '/#/intro');
  await page.waitForSelector('.intro-card');
  assert.ok(await page.locator('.intro-dots .sr-only').count(), 'intro dots have SR text');

  await page.goto(BASE + '/#/heavier');
  await page.waitForSelector('.versus-card');
  const statusRole = await page.locator('#status').getAttribute('role');
  assert.equal(statusRole, 'status', 'game status has role=status');
});

t('SEO: document.title updates per route', async () => {
  await page.goto(BASE + '/#/learn');
  await page.waitForSelector('.chapter');
  assert.match(await page.title(), /Your Journey/);

  await page.goto(BASE + '/#/home');
  await page.waitForSelector('.el-tile');
  assert.match(await page.title(), /Elements/);

  await page.goto(BASE + '/#/scientists');
  await page.waitForSelector('.sci-card');
  assert.match(await page.title(), /Scientists/);

  await page.goto(BASE + '/#/element/79');
  await page.waitForSelector('.superpower');
  assert.match(await page.title(), /Gold/);
});

t('no console or page errors across the whole run', async () => {
  assert.deepEqual(consoleErrors, []);
});
