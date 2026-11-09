import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const tools = process.env.ROLLING72_BROWSER_TOOLS;
const output = process.env.ROLLING72_BROWSER_OUTPUT;
if (!tools || !output) throw new Error('Isolated tooling and output required');
await mkdir(output, { recursive: true });
const { chromium } = await import(pathToFileURL(path.join(tools, 'node_modules/playwright/index.mjs')).href);
const feed = JSON.parse(await readFile('public/research/rolling72-shadow-snapshot-v2.json', 'utf8'));
const base = 'http://127.0.0.1:4176';
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '4176'], {
  stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, DISABLE_HMR: 'true' },
});
let log = '', browser;
server.stdout.on('data', chunk => { log += chunk; }); server.stderr.on('data', chunk => { log += chunk; });
const checks = [];
try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(base + '/tests/browser/rolling72Ml.html')).ok) { ready = true; break; } } catch { /* Starting. */ }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.ok(ready, 'Vite startup');
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ timezoneId: 'Europe/Warsaw', locale: 'pl-PL', viewport: { width: 1280, height: 1050 } });
  const external = [], errors = [];
  await context.route('**/*', route => {
    if (route.request().url().startsWith(base)) return route.continue();
    external.push(route.request().url()); return route.abort();
  });
  const page = await context.newPage(); page.on('pageerror', error => errors.push(String(error)));
  const predictions = () => page.locator('svg[role="img"] circle[aria-label^="Prognoza"]');
  const formatted = value => Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const vintages = feed.vintages.slice().sort((a, b) => Date.parse(b.issued_at) - Date.parse(a.issued_at) || a.ticket_event_id - b.ticket_event_id);
  await page.goto(base + '/rolling72-ml-preview');
  await page.getByTestId('rolling72-ml-snapshot').waitFor();
  assert.equal(await page.getByLabel('Wariant prognozy').inputValue(), 'candidate');
  assert.equal(await predictions().count(), 3);
  for (const point of vintages[0].points) assert.equal((await page.getByTestId(`rolling72-ml-card-${point.horizon_hours}`).getByTestId('forecast-value').textContent()).trim(), formatted(point.models.candidate.predicted_available_total));
  await page.getByTestId('rolling72-ml-extrapolation').waitFor();
  await page.getByText('To zapisany stan, a nie źródło aktualizowane na żywo.', { exact: false }).waitFor();
  await page.getByText('Prognoza wydana:', { exact: false }).waitFor();
  assert.equal(external.length, 0, 'Research route must not mount normal database fetches');
  await page.screenshot({ path: path.join(output, 'rolling72-ml-genuine-desktop.png'), fullPage: true });
  checks.push('actual v2 route and exact candidate values, real future points, static issue clocks, extrapolation flag, no external fetches');

  await predictions().first().focus();
  await page.getByText('Prognoza +24 h ·', { exact: false }).waitFor();
  await page.getByLabel('Mecz i wersja prognozy').selectOption({ index: 1 });
  assert.equal(await page.getByTestId('rolling72-ml-extrapolation').count(), 0);
  await page.getByLabel('Wariant prognozy').selectOption('persistence');
  for (const point of vintages[1].points) assert.equal((await page.getByTestId(`rolling72-ml-card-${point.horizon_hours}`).getByTestId('forecast-value').textContent()).trim(), formatted(point.models.persistence.predicted_available_total));
  await page.getByLabel('Wariant prognozy').selectOption('pickup');
  assert.equal(await predictions().count(), 0);
  for (const h of [24, 48, 72]) assert.equal((await page.getByTestId(`rolling72-ml-card-${h}`).getByTestId('forecast-value').textContent()).trim(), '—');
  checks.push('candidate and benchmark identities stay separate, focus API inspection, unavailable horizon never substitutes model');
  await page.getByLabel('Wariant prognozy').selectOption('candidate');
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  await page.screenshot({ path: path.join(output, 'rolling72-ml-genuine-mobile.png'), fullPage: true });
  checks.push('mobile no horizontal overflow, not a claim of visual readability');
  let count = 0;
  await page.route('**/research/rolling72-ml-ui-contract.json', route => { count++; return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(feed) }); });
  await page.goto(base + '/tests/browser/rolling72Ml.html?mode=unconfigured');
  await page.getByTestId('rolling72-ml-unavailable').waitFor(); assert.equal(count, 0);
  assert.equal(await page.locator('svg[role="img"]').count(), 0);
  await page.unroute('**/research/rolling72-ml-ui-contract.json');
  await page.route('**/research/rolling72-ml-ui-contract.json', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
  await page.goto(base + '/tests/browser/rolling72Ml.html');
  await page.getByRole('alert').waitFor(); assert.equal(await page.locator('svg[role="img"]').count(), 0);
  checks.push('absent explicit configuration never fetches; malformed data fails closed');
  assert.deepEqual(errors, []);
  await writeFile(path.join(output, 'rolling72-ml-browser-proof.json'), JSON.stringify({ version: 'rolling72-ml-browser-contract-v2', generated_at: feed.generated_at,
    first_actual_issue: vintages[0].issued_at, model_accuracy_proven: false, live_hosting_proven: false, checks, page_errors: errors }, null, 2));
} finally {
  if (browser) await browser.close(); server.kill('SIGTERM');
  await writeFile(path.join(output, 'rolling72-ml-vite.log'), log);
}
