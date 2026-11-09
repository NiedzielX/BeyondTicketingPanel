import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const tools = process.env.ROLLING72_BROWSER_TOOLS ?? process.env.DAILY_PATH_BROWSER_TOOLS;
const output = process.env.ROLLING72_BROWSER_OUTPUT;
if (!tools || !output) throw new Error('Isolated browser tooling and ROLLING72_BROWSER_OUTPUT required');
await mkdir(output, { recursive: true });
const { chromium } = await import(pathToFileURL(path.join(tools, 'node_modules/playwright/index.mjs')).href);
const actualFeed = JSON.parse(await readFile('public/research/rolling72-shadow-snapshot-v1.json', 'utf8'));
assert.equal(actualFeed.evidence_kind, 'immutable_shadow_ledger');
const base = 'http://127.0.0.1:4175';
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '4175'], {
  stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, DISABLE_HMR: 'true' },
});
let log = '';
server.stdout.on('data', chunk => { log += chunk; });
server.stderr.on('data', chunk => { log += chunk; });
let browser;
const checks = [];
try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(base + '/tests/browser/rolling72.html')).ok) { ready = true; break; } } catch { /* Starting. */ }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.ok(ready, 'Isolated Vite server did not start');
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ timezoneId: 'Europe/Warsaw', locale: 'pl-PL', viewport: { width: 1280, height: 1000 } });
  const externalRequests = [];
  await context.route('**/*', route => {
    if (route.request().url().startsWith(base)) return route.continue();
    externalRequests.push(route.request().url()); return route.abort();
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  const predictions = () => page.locator('svg[role="img"] circle[aria-label^="Prognoza"]');

  await page.goto(base + '/rolling72-preview');
  await page.getByTestId('rolling72-snapshot').waitFor();
  await page.locator('svg[role="img"]').waitFor();
  assert.equal(await predictions().count(), 3);
  assert.equal(await page.getByLabel('Mecz i wersja prognozy').locator('option').count(), actualFeed.vintages.length);
  for (const h of [24, 48, 72]) await page.getByTestId(`rolling72-card-${h}`).waitFor();
  await page.getByText('To zapisany stan, a nie źródło aktualizowane na żywo.', { exact: false }).waitFor();
  const initialVintage = actualFeed.vintages.slice().sort((a, b) => Date.parse(b.issued_at) - Date.parse(a.issued_at) || a.ticket_event_id - b.ticket_event_id)[0];
  const format = value => Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  for (const point of initialVintage.points) {
    assert.equal((await page.getByTestId(`rolling72-card-${point.horizon_hours}`).getByTestId('forecast-value').textContent()).trim(), format(point.models.drift.predicted_available_total));
  }
  assert.equal(externalRequests.length, 0, 'Research route must not mount unrelated live dashboard fetches');
  await page.screenshot({ path: path.join(output, 'rolling72-genuine-snapshot-desktop.png'), fullPage: true });
  checks.push('actual immutable snapshot route, exact stored model values, 24/48/72 cards, no production requests');

  await page.getByLabel('Mecz i wersja prognozy').selectOption({ index: 1 });
  await page.getByLabel('Wariant prognozy').selectOption('persistence');
  assert.equal(await predictions().count(), 3);
  await predictions().first().focus();
  await page.getByText('Prognoza +24 h ·', { exact: false }).waitFor();
  await page.getByLabel('Wariant prognozy').selectOption('pickup');
  assert.equal(await predictions().count(), 0);
  for (const h of [24, 48, 72]) assert.equal((await page.getByTestId(`rolling72-card-${h}`).getByTestId('forecast-value').textContent()).trim(), '—');
  checks.push('vintage/model selection, keyboard point inspection, unavailable pickup stays null');

  await page.getByLabel('Wariant prognozy').selectOption('drift');
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'Mobile page must not overflow');
  await page.screenshot({ path: path.join(output, 'rolling72-genuine-snapshot-mobile.png'), fullPage: true });
  checks.push('mobile actual snapshot without page overflow');

  let contractFetches = 0;
  await page.route('**/research/rolling72-ui-contract.json', route => { contractFetches++; return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(actualFeed) }); });
  await page.goto(base + '/tests/browser/rolling72.html?mode=unconfigured');
  await page.getByTestId('rolling72-unavailable').waitFor();
  assert.equal(contractFetches, 0, 'Unconfigured event widget must not fetch or substitute snapshot');
  assert.equal(await page.locator('svg[role="img"]').count(), 0);
  checks.push('normal widget has no static snapshot fallback when URL is absent');

  await page.unroute('**/research/rolling72-ui-contract.json');
  await page.route('**/research/rolling72-ui-contract.json', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
  await page.goto(base + '/tests/browser/rolling72.html');
  await page.getByRole('alert').waitFor();
  assert.equal(await page.locator('svg[role="img"]').count(), 0);
  checks.push('malformed feed fails closed without fabricated chart');
  assert.deepEqual(errors, []);
  await writeFile(path.join(output, 'rolling72-browser-proof.json'), JSON.stringify({
    version: 'rolling72-ui-browser-contract-v1', genuine_snapshot_generated_at: actualFeed.generated_at,
    model_accuracy_proven: false, live_backend_proven: false, checks, page_errors: errors,
  }, null, 2));
} finally {
  if (browser) await browser.close();
  server.kill('SIGTERM');
  await writeFile(path.join(output, 'rolling72-vite.log'), log);
}
