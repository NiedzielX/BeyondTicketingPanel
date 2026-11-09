/** Explicitly synthetic geometry fixtures, never production research data. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { parseRolling72Feed, ROLLING72_MODELS } from '../../services/rolling72ForecastService.ts';
import { rolling72ForecastGeometry } from './rolling72ForecastGeometry.ts';

const ISSUE = '2026-11-09T12:03:00Z';
const HOUR = 3_600_000;
function vintage() {
  return parseRolling72Feed({ version: 'rolling72-shadow-feed-v1', generated_at: '2026-11-09T13:00:00Z',
    frozen_at: '2026-11-09T11:00:00Z', metric: 'public-displayed-available-total-v1', evidence_kind: 'immutable_shadow_ledger',
    production_change: false, live_adjustment: 0, vintages: [{ ticket_event_id: 1, club_slug: 'synthetic',
      kickoff_at: '2026-12-29T12:00:00Z', event_known_at: '2026-11-09T12:01:00Z', issued_at: ISSUE,
      written_at: '2026-11-09T12:03:01Z', status: 'READY', measurement_key: 'public-variable',
      input_manifest_sha256: 'a'.repeat(64), prefix_sha256: 'b'.repeat(64), source_receipt_sha256: 'c'.repeat(64),
      precommit_sha256: 'd'.repeat(64), freeze_sha256: 'e'.repeat(64), scenario_stability: 'UNKNOWN',
      cohort: 'exposed_or_unverified_fixture_not_new_review', observations: [{ snapshot_id: 1,
        captured_at: '2026-11-09T10:03:00Z', known_at: '2026-11-09T12:01:00Z', available_total: 1000,
        measurement_key: 'public-variable', source_active: null, source_visible: null }],
      points: [24, 48, 72].map(h => ({ horizon_hours: h, target_at: new Date(Date.parse(ISSUE) + h * HOUR).toISOString(), status: 'READY',
        models: Object.fromEntries(Object.entries(ROLLING72_MODELS).map(([name, model_id]) => [name,
          { model_id, status: name === 'persistence' ? 'READY' : 'UNAVAILABLE',
            status_reason: name === 'persistence' ? null : 'INSUFFICIENT',
            predicted_available_total: name === 'persistence' ? 1000 : null,
            predicted_delta: name === 'persistence' ? 0 : null, score: null }])) })) }] }).vintages[0];
}

test('forecast starts at actual last capture, without a fabricated observation at issue', () => {
  const v = vintage(); const geometry = rolling72ForecastGeometry(v, 'persistence');
  assert.equal(geometry.observed.length, 1);
  assert.equal(geometry.anchor?.at, v.observations[0].captured_at);
  assert.equal(geometry.predictionSegments[0][0].at, v.observations[0].captured_at);
  assert.notEqual(geometry.predictionSegments[0][0].at, v.issued_at);
  assert.equal(geometry.predicted.length, 3);
  assert.ok(geometry.issueX > geometry.anchor!.x);
});

test('missing selected-model +48h splits +24h and +72h rather than bridging it', () => {
  const v = vintage(); Object.assign(v.points[1].models.persistence,
    { status: 'UNAVAILABLE', status_reason: 'UNAVAILABLE', predicted_available_total: null, predicted_delta: null });
  const geometry = rolling72ForecastGeometry(v, 'persistence');
  assert.deepEqual(geometry.predicted.map(p => p.horizonHours), [24, 72]);
  assert.deepEqual(geometry.predictionSegments.map(s => s.map(p => p.horizonHours)), [[undefined, 24], [72]]);
  assert.equal((geometry.predictedPath.match(/M /g) ?? []).length, 2);
});

test('unavailable benchmark has no invented line and literal zero is still a point', () => {
  const v = vintage();
  assert.equal(rolling72ForecastGeometry(v, 'drift').predictedPath, '');
  v.observations[0].available_total = 0;
  for (const p of v.points) { p.models.persistence.predicted_available_total = 0; p.models.persistence.predicted_delta = 0; }
  const geometry = rolling72ForecastGeometry(v, 'persistence');
  assert.equal(geometry.predicted.length, 3);
  assert.equal(geometry.anchor?.value, 0);
  assert.ok(Number.isFinite(geometry.predicted[0].y));
});

test('recent viewport preserves the full genuine prefix and actual temporal gaps', () => {
  const v = vintage();
  v.observations.unshift({ ...v.observations[0], snapshot_id: 2, captured_at: '2026-10-01T10:03:00Z', available_total: 2000 });
  const recent = rolling72ForecastGeometry(v, 'persistence');
  const full = rolling72ForecastGeometry(v, 'persistence', { viewport: 'full' });
  assert.equal(recent.observed.length, 2);
  assert.equal(full.observed.length, 2);
  assert.ok(recent.start > full.start);
  assert.equal(recent.observationSegments.length, 2);
  assert.equal(recent.observed[0].at, v.observations[0].captured_at);
});

test('later realization stays separate from original observations and forecasts', () => {
  const v = vintage(); const before = structuredClone(v.observations);
  v.points[0].models.persistence.score = { target_snapshot_id: 4, target_captured_at: '2026-11-10T12:00:00Z',
    target_known_at: '2026-11-10T12:04:00Z', target_available_total: 800, scored_at: '2026-11-10T12:05:00Z', absolute_error: 200 };
  const geometry = rolling72ForecastGeometry(v, 'persistence');
  assert.deepEqual(v.observations, before);
  assert.equal(geometry.realized.length, 1);
  assert.equal(geometry.realized[0].value, 800);
  assert.equal(geometry.predicted[0].value, 1000);
});

test('invalid dimensions fail rather than emit NaN SVG positions', () => {
  for (const width of [Number.NaN, 0, -1, Number.POSITIVE_INFINITY])
    assert.throws(() => rolling72ForecastGeometry(vintage(), 'persistence', { width }));
});
