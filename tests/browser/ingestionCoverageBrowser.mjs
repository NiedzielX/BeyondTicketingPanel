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
const now = Date.parse('2026-11-05T15:40:00Z');
function row(changes = {}) {
  return { record_key: 'synthetic-future', record_type: 'tracked', club_slug: 'synthetic-only', club_name: 'Synthetic',
    external_event_id: 'synthetic', label: 'Nadchodzący mecz testowy', candidate_kind: 'match', ingestion_status: 'TRACKED',
    kickoff_at: '2026-11-06T17:00:00Z', ticket_event_id: 999999, snapshot_count: 3,
    first_snapshot_at: '2026-11-04T15:00:00Z', last_snapshot_at: '2026-11-05T15:35:00Z',
    raw_snapshot_count: 0, first_raw_snapshot_at: null, last_raw_snapshot_at: null,
    source_url: null, mapping_source: 'synthetic-only', issue_reason: null,
    first_seen_at: '2026-11-04T15:00:00Z', last_seen_at: '2026-11-05T15:36:00Z',
    refreshed_at: '2026-11-05T15:39:00Z', ...changes };
}
function fixture() {
  return [row(),
    row({ record_key: 'unknown', label: 'Niepotwierdzony termin testowy', kickoff_at: null,
      ticket_event_id: null, ingestion_status: 'BUFFERING_AWAITING_KICKOFF', snapshot_count: 0,
      last_snapshot_at: null, raw_snapshot_count: 20, last_raw_snapshot_at: '2026-11-05T15:33:00Z' }),
    row({ record_key: 'old-buffer', label: 'Dawny bufor testowy', kickoff_at: '2026-10-27T16:30:00Z',
      ticket_event_id: null, ingestion_status: 'BUFFERING_AWAITING_KICKOFF', snapshot_count: 0,
      last_snapshot_at: null, raw_snapshot_count: 291, last_raw_snapshot_at: '2026-10-27T18:23:00Z' }),
    row({ record_key: 'old-empty', label: 'Dawna luka testowa', kickoff_at: '2026-11-02T17:00:00Z',
      ticket_event_id: null, ingestion_status: 'MATCH_DISCOVERED_NO_BUFFER', snapshot_count: 0,
      last_snapshot_at: null, last_seen_at: '2026-11-02T18:53:00Z' })];
}
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '4173'],
  { stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, DISABLE_HMR: 'true' } });
let log = ''; server.stdout.on('data', (v) => { log += v; }); server.stderr.on('data', (v) => { log += v; });
let browser, page;
const checks = [];
try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    try { ready = (await fetch(base + '/tests/browser/ingestion.html')).ok; if (ready) break; } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  assert.ok(ready, 'isolated Vite server did not start');
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ timezoneId: 'Europe/Warsaw', locale: 'pl-PL', viewport: { width: 1440, height: 1100 } });
  await context.route('**/*', (route) => route.request().url().startsWith(base) ? route.continue() : route.abort());
  page = await context.newPage();
  await page.clock.install({ time: new Date(now) });
  const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
  let payload = fixture(), status = 200, reads = 0;
  await page.route('**/rest/v1/dashboard_ticketing_ingestion_status_v1?*', async (route) => {
    reads++; await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(status === 200 ? payload : { message: 'synthetic read failure' }) });
  });
  await page.goto(base + '/tests/browser/ingestion.html');
  await page.getByRole('button', { name: 'Bieżący monitoring (2)', exact: true }).waitFor();
  assert.equal(await page.locator('tbody tr').count(), 2);
  assert.equal(await page.locator('tbody').getByText('Dawny bufor testowy').count(), 0);
  await page.getByText('Czas monitoringu nie oznacza świeżego inventory.', { exact: false }).waitFor();
  await page.getByRole('button', { name: 'Minione nierozwiązane (2)', exact: true }).click();
  assert.equal(await page.locator('tbody tr').count(), 2);
  await page.locator('tbody').getByText('Dawny bufor testowy').waitFor();
  assert.equal(await page.getByText('Termin minął — wpis nierozwiązany', { exact: true }).count(), 2);
  assert.equal(await page.locator('tbody').getByText('291', { exact: true }).count(), 1);
  checks.push('elapsed unresolved candidates separated while raw evidence remains visible');
  await page.screenshot({ path: path.join(output, 'synthetic-ingestion-history.png'), fullPage: true });
  await page.getByRole('button', { name: 'Bieżący monitoring (2)', exact: true }).click();
  payload = fixture(); payload[0].label = 'Zaktualizowany mecz testowy';
  const beforeManual = reads;
  await page.getByRole('button', { name: 'Odśwież monitoring', exact: true }).click();
  await page.locator('tbody').getByText('Zaktualizowany mecz testowy').waitFor();
  assert.ok(reads > beforeManual); checks.push('manual reload updates actual component rows');
  status = 500;
  await page.getByRole('button', { name: 'Odśwież monitoring', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'Odświeżenie nie powiodło się' }).waitFor();
  await page.locator('tbody').getByText('Zaktualizowany mecz testowy').waitFor();
  checks.push('failed refresh preserves last good rows with visible warning');
  status = 200; payload = fixture(); payload[0].label = 'Po powrocie do karty';
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await page.locator('tbody').getByText('Po powrocie do karty').waitFor();
  assert.equal(await page.getByRole('alert').count(), 0); checks.push('focus reload recovers data and clears failure warning');
  payload = fixture(); payload[0].kickoff_at = '2026-11-05T15:40:30Z';
  payload[0].label = 'Termin minął podczas otwartej karty';
  await page.clock.runFor(60_000);
  await page.getByRole('button', { name: 'Bieżący monitoring (1)', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Minione nierozwiązane (3)', exact: true }).waitFor();
  checks.push('minute polling refreshes and reclassifies elapsed scheduled time');
  payload = [row({ refreshed_at: '2026-11-05T12:00:00Z' })];
  await page.getByRole('button', { name: 'Odśwież monitoring', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'ostatnich 20 minut' }).waitFor();
  checks.push('old DB projection warning remains visible after a successful browser read');
  await page.screenshot({ path: path.join(output, 'synthetic-ingestion-stale-projection.png'), fullPage: true });
  status = 500; await page.reload();
  await page.getByText('Nie udało się odczytać monitoringu ingestu:', { exact: false }).waitFor();
  status = 200; payload = fixture();
  await page.getByRole('button', { name: 'Spróbuj ponownie', exact: true }).click();
  await page.getByRole('button', { name: 'Bieżący monitoring (2)', exact: true }).waitFor();
  checks.push('first-read error has working retry instead of an empty healthy state');
  assert.deepEqual(errors, []);
  await writeFile(path.join(output, 'ingestion-contract.json'), JSON.stringify({ synthetic_only: true, checks, page_errors: errors }, null, 2));
  console.log(JSON.stringify({ synthetic_only: true, checks, total_checks: checks.length }));
} catch (error) {
  await writeFile(path.join(output, 'ingestion-server.log'), log);
  if (page) await page.screenshot({ path: path.join(output, 'synthetic-ingestion-failure.png'), fullPage: true }).catch(() => {});
  throw error;
} finally {
  if (browser) await browser.close();
  server.kill('SIGTERM');
}
