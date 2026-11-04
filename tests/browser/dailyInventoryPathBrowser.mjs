import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const tools = process.env.DAILY_PATH_BROWSER_TOOLS;
const output = process.env.DAILY_PATH_BROWSER_OUTPUT;
if (!tools || !output) throw new Error('Isolated browser tooling/output paths required');
await mkdir(output, { recursive: true });
const { chromium } = await import(pathToFileURL(path.join(tools, 'node_modules/playwright/index.mjs')).href);
const base = 'http://127.0.0.1:4173';
const DAY = 86400000;
const MODEL = 'a'.repeat(64);
const iso = (value) => new Date(value).toISOString();

function fixture() {
  const kickoff = Date.parse('2026-11-10T12:00:00Z');
  const events = [7, 6].map((days, vintage) => {
    const issue = kickoff - days * DAY;
    const latest = vintage ? 600 : 700;
    return {
      ticket_event_id: 42, club_slug: 'synthetic-test-only', kickoff_at: iso(kickoff), issued_as_of_at: iso(issue),
      status: 'READY', measurement_key: 'synthetic/public-inventory', model_version: 'synthetic-browser-contract', model_sha256: MODEL,
      observations: [48, 36, 12, 1].map((hours, index) => ({
        snapshot_id: 1000 + vintage * 100 + index, captured_at: iso(issue - hours * 3600000),
        available_total: latest + (3 - index) * 100,
      })),
      points: Array.from({ length: days - 1 }, (_, index) => {
        const lead = index + 1;
        const predicted = latest - 50 * lead;
        return {
          ticket_event_id: 42, issued_as_of_at: iso(issue), target_at: iso(issue + lead * DAY), lead_days: lead,
          model_version: 'synthetic-browser-contract', model_sha256: MODEL,
          predicted_available_total: predicted, baseline_available_total: latest,
          measurement_key: 'synthetic/public-inventory', input_manifest_sha256: (vintage ? 'b' : 'c').repeat(64),
          evidence_kind: 'research_preview_not_prospective',
          ...(vintage && lead === 1 ? { score: {
            target_snapshot_id: 5000, target_captured_at: '2026-11-05T11:55:00Z', target_available_total: 0,
            candidate_abs_error: predicted, baseline_abs_error: latest, scored_at: '2026-11-05T12:05:00Z',
            measurement_key: 'synthetic/public-inventory',
          } } : {}),
        };
      }),
    };
  });
  return {
    version: 'daily-inventory-path-preview-v1', generated_at: '2026-11-05T13:00:00Z',
    evidence_kind: 'research_preview_not_prospective', production_change: false,
    training_support: { model_sha256: MODEL, max_lead_days: 3 }, events,
  };
}

const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '4173'], {
  stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, DISABLE_HMR: 'true' },
});
let serverLog = '';
server.stdout.on('data', (chunk) => { serverLog += chunk; });
server.stderr.on('data', (chunk) => { serverLog += chunk; });
let browser, page;
const checks = [];
try {
  let available = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    try { const response = await fetch(base + '/tests/browser/daily-path.html'); if (response.ok) { available = true; break; } }
    catch { /* Vite is starting. */ }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.ok(available, 'isolated Vite server did not start');
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ timezoneId: 'Europe/Warsaw', locale: 'pl-PL', viewport: { width: 1280, height: 900 } });
  await context.route('**/*', (route) => route.request().url().startsWith(base) ? route.continue() : route.abort());
  page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  const feedPattern = '**/research/daily-inventory-path-v1.json';
  async function load(data, status = 200, contentType = 'application/json') {
    await page.unroute(feedPattern);
    await page.route(feedPattern, (route) => route.fulfill({ status, contentType,
      body: contentType === 'application/json' ? JSON.stringify(data) : String(data) }));
    await page.goto(base + '/tests/browser/daily-path.html');
  }
  const plot = () => page.locator('svg[role="img"]');
  const predictions = () => plot().locator('circle[aria-label^="Prognoza"]');
  const waitPointCount = (count) => page.waitForFunction((expected) =>
    document.querySelectorAll('svg[role="img"] circle[aria-label^="Prognoza"]').length === expected, count);

  await load(fixture());
  await plot().waitFor();
  assert.equal(await predictions().count(), 5, 'latest vintage must plot every remaining daily target');
  assert.equal(await page.getByLabel('Wersja prognozy').locator('option').count(), 2);
  await page.getByText('Błąd tej wersji:', { exact: false }).waitFor();
  await page.getByText('Punkty dalsze niż 3 dni', { exact: false }).waitFor();
  await predictions().first().focus();
  await page.getByText('Prognoza +1 d', { exact: true }).waitFor();
  await page.getByText('Wartości na kolejne dni i pochodzenie prognozy', { exact: true }).click();
  assert.equal(await page.locator('tbody tr').count(), 5);
  assert.equal((await page.locator('tbody tr').first().locator('td').nth(4).textContent()).trim(), '0');
  assert.equal((await page.locator('tbody tr').first().locator('td').nth(5).textContent()).trim(), '550');
  assert.equal((await page.locator('tbody tr').last().locator('td').nth(1).textContent()).trim(), 'P-1');
  await page.screenshot({ path: path.join(output, 'daily-path-desktop.png'), fullPage: true });
  checks.push('latest prefix/future path, zero outcome/error, lead support and keyboard inspection');

  await page.getByLabel('Wersja prognozy').selectOption({ index: 1 });
  await waitPointCount(6);
  assert.equal(await predictions().count(), 6, 'older vintage must retain its own complete issued path');
  assert.equal(await page.getByText('Błąd tej wersji:', { exact: false }).count(), 0);
  const refreshed = page.waitForResponse((response) => response.url().endsWith('/research/daily-inventory-path-v1.json'));
  await page.getByRole('button', { name: 'Odśwież' }).click();
  await refreshed; await plot().waitFor();
  await waitPointCount(5);
  assert.equal(await predictions().count(), 5);
  checks.push('immutable vintage selection and explicit refresh');

  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'mobile chart must not overflow the page');
  await page.screenshot({ path: path.join(output, 'daily-path-mobile.png'), fullPage: true });
  checks.push('mobile width without page overflow');

  const zeroOnly = fixture();
  for (const vintage of zeroOnly.events) {
    for (const observation of vintage.observations) observation.available_total = 0;
    for (const point of vintage.points) {
      point.predicted_available_total = 0;
      point.baseline_available_total = 0;
      if (point.score) { point.score.candidate_abs_error = 0; point.score.baseline_abs_error = 0; }
    }
  }
  await load(zeroOnly); await plot().waitFor();
  await page.getByText('Historia zawiera wyłącznie zerowe odczyty dostępności.', { exact: false }).waitFor();
  assert.equal(await predictions().count(), 5);
  checks.push('zero-only observed history remains distinct from confirmed sellout or sales');

  for (const [name, data, status, type, message] of [
    ['missing', {}, 404, 'application/json', 'Dla tego meczu nie ma jeszcze zapisanej prognozy kolejnych dni.'],
    ['SPA absent export', '<html>missing export</html>', 200, 'text/html', 'Dla tego meczu nie ma jeszcze zapisanej prognozy kolejnych dni.'],
    ['malformed', { ...fixture(), events: [{}] }, 200, 'application/json', 'Nie udało się wczytać poprawnej ścieżki prognozy.'],
  ]) {
    await load(data, status, type);
    await page.getByText(message, { exact: false }).waitFor();
    assert.equal(await plot().count(), 0, `${name} must not manufacture a plot`);
    assert.equal(await page.getByText('Błąd tej wersji:', { exact: false }).count(), 0);
    checks.push(`${name}: explicit empty/error state`);
  }
  const failed = fixture();
  failed.events = [{ ...failed.events[1], status: 'MODEL_INPUT_INSUFFICIENT', observations: [], points: [] }];
  await load(failed);
  await page.getByText('dane nie spełniały warunków', { exact: false }).waitFor();
  assert.equal(await plot().count(), 0);
  checks.push('failed-input vintage has no invented predictions');

  // Independent synthetic C1 status proves this card never borrows the panel's
  // structural forecast aggregate or treats missing outcomes as zero MAE.
  const c1Pattern = '**/rest/v1/dashboard_c1_shadow_v8_status_v1?*';
  const c1Row = {
    status: 'EXPERIMENTAL_SHADOW', package_version: 'c1-shadow-v8-frozen-2026-10-16-n9',
    live_model_id: 'c1-v2-live-ridge-directocc-compact-generic-a10',
    policy_id: 'c1-alpha-reliability-policy-v8-fixed-10pp-positive-slope-20pp-single', production_live_adjustment: 0,
    prediction_row_count: 8, prospective_event_count: 3, scored_event_count: 2,
    latest_row_policy_mae: 123.45, latest_row_prior_mae: 234.56, latest_row_live_mae: 345.67,
    representative_window_policy_mae: 456.78, latest_prediction_at: '2026-11-03T12:00:00Z',
    latest_score_at: '2026-11-02T12:00:00Z', refreshed_at: '2026-11-04T12:00:00Z',
  };
  async function loadC1(rows, status = 200) {
    await page.unroute(c1Pattern);
    await page.route(c1Pattern, route => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(rows) }));
    await page.goto(base + '/tests/browser/c1-live.html');
  }
  await loadC1([c1Row]);
  const c1 = page.getByRole('region', { name: 'Wyniki eksperymentu C1 v8' });
  await c1.getByText('123,45 osób', { exact: true }).waitFor();
  await c1.getByText('234,56 osób', { exact: true }).waitFor();
  await c1.getByText('345,67 osób', { exact: true }).waitFor();
  await c1.getByText('Wszystkie kluby, niezależnie od filtra strony.', { exact: false }).waitFor();
  const refreshC1 = page.waitForResponse(response => response.url().includes('/dashboard_c1_shadow_v8_status_v1?'));
  await page.getByRole('button', { name: 'Odśwież C1' }).click(); await refreshC1;
  await c1.getByText('123,45 osób', { exact: true }).waitFor();
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  await page.screenshot({ path: path.join(output, 'c1-live-synthetic-mobile.png'), fullPage: true });
  checks.push('C1 independent live scoreboard, global scope, refresh and mobile width');
  await loadC1([{ ...c1Row, scored_event_count: 0, latest_score_at: null, latest_row_policy_mae: null,
    latest_row_prior_mae: null, latest_row_live_mae: null, representative_window_policy_mae: null }]);
  await c1.getByText('Oczekuje na potwierdzone wyniki.', { exact: false }).waitFor();
  assert.equal(await c1.getByText('0,00 osób', { exact: true }).count(), 0);
  await loadC1([]); await c1.getByText('Brak opublikowanego zestawienia C1.').waitFor();
  await loadC1([{ ...c1Row, live_model_id: 'wrong-model' }]);
  await c1.getByRole('alert').waitFor();
  await loadC1({}, 503); await c1.getByRole('alert').waitFor();
  checks.push('C1 pending/missing/wrong-model/HTTP failure never manufacture zero MAE');
  assert.deepEqual(errors, [], 'browser must not have unhandled runtime errors');
  await writeFile(path.join(output, 'result.json'), JSON.stringify({ status: 'PASS', fixture_only: true, checks }, null, 2));
  console.log(JSON.stringify({ status: 'PASS', fixture_only: true, checks }, null, 2));
} catch (error) {
  if (page) await page.screenshot({ path: path.join(output, 'failure.png'), fullPage: true }).catch(() => {});
  await writeFile(path.join(output, 'result.json'), JSON.stringify({ status: 'FAIL', fixture_only: true, checks, error: String(error) }, null, 2));
  const diagnostic = String(error.stack || error).replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A');
  console.log(`::error title=Synthetic daily-path browser contract::${diagnostic}`);
  throw error;
} finally {
  if (browser) await browser.close();
  server.kill('SIGTERM');
  await writeFile(path.join(output, 'vite.log'), serverLog);
}
