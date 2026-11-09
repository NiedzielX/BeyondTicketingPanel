/** Explicitly synthetic contract tests; never a served research feed. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { fetchRolling72Forecasts, parseRolling72Feed, ROLLING72_MODELS } from './rolling72ForecastService.ts';

const ISSUE = '2026-11-09T12:03:00.123456Z';
const HOUR_MS = 3_600_000;
const target = (h: number) => new Date(Date.parse(ISSUE) + h * HOUR_MS).toISOString().replace('.123Z', '.123456Z');

function fixture(): any {
  return {
    version: 'rolling72-shadow-feed-v1', generated_at: '2026-11-09T13:00:00Z', frozen_at: '2026-11-09T11:00:00Z',
    metric: 'public-displayed-available-total-v1', evidence_kind: 'immutable_shadow_ledger',
    production_change: false, live_adjustment: 0,
    vintages: [{ ticket_event_id: 1, club_slug: 'synthetic-club', kickoff_at: '2026-12-29T12:07:00Z',
      event_known_at: '2026-11-09T12:01:00Z', issued_at: ISSUE, written_at: '2026-11-09T12:03:01Z',
      status: 'READY', measurement_key: 'public-displayed-available-total-v1:roboticket/roboticket',
      input_manifest_sha256: 'a'.repeat(64), prefix_sha256: 'b'.repeat(64), source_receipt_sha256: 'c'.repeat(64),
      precommit_sha256: 'd'.repeat(64), freeze_sha256: 'e'.repeat(64), scenario_stability: 'UNKNOWN',
      cohort: 'exposed_or_unverified_fixture_not_new_review',
      observations: [{ snapshot_id: 1, captured_at: '2026-11-09T10:03:00Z', known_at: '2026-11-09T12:01:00Z',
        available_total: 1000, measurement_key: 'public-displayed-available-total-v1:roboticket/roboticket',
        source_active: null, source_visible: null }],
      points: [24, 48, 72].map(h => ({ horizon_hours: h, target_at: target(h), status: 'READY',
        models: Object.fromEntries(Object.entries(ROLLING72_MODELS).map(([name, id]) => [name, {
          model_id: id, status: name === 'persistence' ? 'READY' : 'UNAVAILABLE',
          status_reason: name === 'persistence' ? null : 'SUPPORT_INSUFFICIENT',
          predicted_available_total: name === 'persistence' ? 1000 : null,
          predicted_delta: name === 'persistence' ? 0 : null, score: null,
        }])) })),
    }],
  };
}

function scoredFixture(): any {
  const data = fixture();
  data.generated_at = '2026-11-10T13:00:00Z';
  data.vintages[0].points[0].models.persistence.score = {
    target_snapshot_id: 2, target_captured_at: '2026-11-10T12:00:00Z',
    target_known_at: '2026-11-10T12:04:00Z', target_available_total: 800,
    scored_at: '2026-11-10T12:05:00Z', absolute_error: 200,
  };
  return data;
}

test('one genuine point and arbitrary early issue keep all three immutable horizons', () => {
  const data = parseRolling72Feed(fixture());
  const v = data.vintages[0];
  assert.equal(v.observations.length, 1);
  assert.notEqual(v.observations[0].captured_at, v.issued_at);
  assert.deepEqual(v.points.map(p => p.horizon_hours), [24, 48, 72]);
  assert.equal(v.points[2].target_at, target(72));
  assert.equal(v.points[0].models.drift.predicted_available_total, null);
});

test('real zero, missing prediction and unknown flags retain different meanings', () => {
  const data = fixture();
  data.vintages[0].observations[0].available_total = 0;
  for (const p of data.vintages[0].points) p.models.persistence.predicted_available_total = 0;
  const v = parseRolling72Feed(data).vintages[0];
  assert.equal(v.observations[0].available_total, 0);
  assert.equal(v.points[0].models.persistence.predicted_available_total, 0);
  assert.equal(v.points[0].models.pickup.predicted_available_total, null);
  assert.equal(v.observations[0].source_active, null);
});

test('late-known or future observations and metadata are rejected', () => {
  for (const field of ['known_at', 'captured_at']) {
    const data = fixture(); data.vintages[0].observations[0][field] = '2026-11-09T12:03:00.123457Z';
    assert.throws(() => parseRolling72Feed(data));
  }
  const data = fixture(); data.vintages[0].event_known_at = '2026-11-09T12:03:00.123457Z';
  assert.throws(() => parseRolling72Feed(data));
});

test('READY stale input is rejected while a declared failed vintage remains honest', () => {
  const data = fixture(); data.vintages[0].observations[0].captured_at = '2026-11-09T06:03:00.123455Z';
  assert.throws(() => parseRolling72Feed(data));
  data.vintages[0].status = 'STALE_INPUT';
  for (const p of data.vintages[0].points) {
    p.target_at = null; p.status = 'STALE_INPUT';
    for (const m of Object.values(p.models) as any[]) Object.assign(m,
      { status: 'UNAVAILABLE', status_reason: 'STALE_INPUT', predicted_available_total: null, predicted_delta: null });
  }
  assert.equal(parseRolling72Feed(data).vintages[0].status, 'STALE_INPUT');
});

test('false source flags cannot produce READY forecasts', () => {
  for (const field of ['source_active', 'source_visible']) {
    const data = fixture(); data.vintages[0].observations[0][field] = false;
    assert.throws(() => parseRolling72Feed(data));
  }
});

test('nonfinite, negative and coercible counts never become zero', () => {
  for (const bad of [null, undefined, '0', true, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
    const data = fixture(); data.vintages[0].observations[0].available_total = bad;
    assert.throws(() => parseRolling72Feed(data));
  }
});

test('all horizon identities and model sets are exact and unique', () => {
  const duplicate = fixture(); duplicate.vintages[0].points[1] = structuredClone(duplicate.vintages[0].points[0]);
  assert.throws(() => parseRolling72Feed(duplicate));
  const missing = fixture(); missing.vintages[0].points.pop();
  assert.throws(() => parseRolling72Feed(missing));
  const model = fixture(); model.vintages[0].points[0].models.livec1 = {};
  assert.throws(() => parseRolling72Feed(model));
});

test('microsecond target coordinate and kickoff boundaries are preserved', () => {
  const shifted = fixture(); shifted.vintages[0].points[0].target_at = target(24).replace('123456', '123455');
  assert.throws(() => parseRolling72Feed(shifted));
  const kickoff = fixture(); kickoff.vintages[0].kickoff_at = target(72);
  assert.throws(() => parseRolling72Feed(kickoff));
  kickoff.vintages[0].points[2].status = 'TARGET_NOT_BEFORE_KICKOFF';
  for (const m of Object.values(kickoff.vintages[0].points[2].models) as any[]) Object.assign(m,
    { status: 'UNAVAILABLE', status_reason: 'TARGET_NOT_BEFORE_KICKOFF', predicted_available_total: null, predicted_delta: null });
  assert.equal(parseRolling72Feed(kickoff).vintages[0].points[2].status, 'TARGET_NOT_BEFORE_KICKOFF');
});

test('vintage duplication and lineage contamination are rejected', () => {
  const duplicate = fixture(); duplicate.vintages.push(structuredClone(duplicate.vintages[0]));
  assert.throws(() => parseRolling72Feed(duplicate));
  const mixed = fixture(); const other = structuredClone(mixed.vintages[0]);
  other.ticket_event_id = 2; other.freeze_sha256 = 'f'.repeat(64); mixed.vintages.push(other);
  assert.throws(() => parseRolling72Feed(mixed));
});

test('later accepted outcomes stay separate from the selected old prefix', () => {
  const v = parseRolling72Feed(scoredFixture()).vintages[0];
  assert.equal(v.points[0].models.persistence.score?.target_available_total, 800);
  assert.equal(v.points[0].models.persistence.score?.absolute_error, 200);
  assert.equal(v.observations.length, 1);
});

test('premature, stale and inconsistent scores fail closed', () => {
  for (const [field, value] of [
    ['target_captured_at', '2026-11-10T12:04:00Z'],
    ['target_captured_at', '2026-11-10T06:03:00.123455Z'],
    ['target_known_at', '2026-11-10T11:00:00Z'],
    ['scored_at', '2026-11-10T12:03:00.123455Z'],
    ['scored_at', '2026-11-10T14:00:00Z'], ['absolute_error', 0],
  ]) {
    const data = scoredFixture(); data.vintages[0].points[0].models.persistence.score[field] = value;
    assert.throws(() => parseRolling72Feed(data));
  }
});

test('cross-model partial or different accepted target is rejected', () => {
  const data = scoredFixture(); const drift = data.vintages[0].points[0].models.drift;
  Object.assign(drift, { status: 'READY', status_reason: null, predicted_available_total: 1000, predicted_delta: 0 });
  assert.throws(() => parseRolling72Feed(data));
  drift.score = structuredClone(data.vintages[0].points[0].models.persistence.score);
  drift.score.target_snapshot_id = 99;
  assert.throws(() => parseRolling72Feed(data));
});

test('missing/HTML/malformed responses cannot return a synthetic or terminal-attendance fallback', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response('', { status: 404 });
    assert.deepEqual(await fetchRolling72Forecasts(), { status: 'missing' });
    globalThis.fetch = async () => new Response('<html/>', { headers: { 'content-type': 'text/html' } });
    assert.deepEqual(await fetchRolling72Forecasts(), { status: 'missing' });
    globalThis.fetch = async () => new Response('{}', { headers: { 'content-type': 'application/json' } });
    await assert.rejects(fetchRolling72Forecasts());
  } finally { globalThis.fetch = original; }
});

test('read-only fetch omits credentials and validates the returned rolling72 contract', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async (url, options) => {
      assert.equal(url, '/research/rolling72-shadow-v1.json');
      assert.equal(options?.credentials, 'omit'); assert.equal(options?.cache, 'no-store');
      return new Response(JSON.stringify(fixture()), { headers: { 'content-type': 'application/json' } });
    };
    assert.equal((await fetchRolling72Forecasts()).status, 'ready');
  } finally { globalThis.fetch = original; }
});
