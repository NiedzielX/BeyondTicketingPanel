import assert from 'node:assert/strict';
import test from 'node:test';
import { C1_PACKAGE, parseC1LiveStatus } from './c1LiveStatusContract.ts';

function fixture() {
  return { status: 'EXPERIMENTAL_SHADOW', package_version: C1_PACKAGE,
    live_model_id: 'c1-v2-live-ridge-directocc-compact-generic-a10',
    policy_id: 'c1-alpha-reliability-policy-v8-fixed-10pp-positive-slope-20pp-single', production_live_adjustment: 0,
    prediction_row_count: 8, prospective_event_count: 3, scored_event_count: 2,
    latest_row_policy_mae: 123.45, latest_row_prior_mae: 234.56, latest_row_live_mae: 345.67,
    representative_window_policy_mae: 456.78, latest_prediction_at: '2026-11-03T12:00:00Z',
    latest_score_at: '2026-11-02T12:00:00Z', refreshed_at: '2026-11-04T12:00:00Z' };
}

test('distinct policy/raw/prior/window metrics and event denominator survive unchanged', () => {
  const row = fixture(); const before = structuredClone(row); const result = parseC1LiveStatus([row])!;
  assert.equal(result.policyMae, 123.45); assert.equal(result.priorMae, 234.56);
  assert.equal(result.rawMae, 345.67); assert.equal(result.policyWindowMae, 456.78);
  assert.equal(result.scoredEvents, 2); assert.equal(result.predictionRows, 8);
  assert.deepEqual(row, before);
});

test('missing scoreboard is distinct from invalid or duplicate rows', () => {
  assert.equal(parseC1LiveStatus([]), null);
  for (const value of [{}, [null], [fixture(), fixture()]]) assert.throws(() => parseC1LiveStatus(value));
});

test('no outcomes require null metrics, never fabricated zero', () => {
  const row = { ...fixture(), scored_event_count: 0, latest_score_at: null,
    latest_row_policy_mae: null, latest_row_prior_mae: null, latest_row_live_mae: null, representative_window_policy_mae: null };
  assert.equal(parseC1LiveStatus([row])!.policyMae, null);
  assert.throws(() => parseC1LiveStatus([{ ...row, latest_row_policy_mae: 0 }]));
});

test('actual scored zero error is retained', () => {
  assert.equal(parseC1LiveStatus([{ ...fixture(), latest_row_policy_mae: 0 }])!.policyMae, 0);
});

test('different model or production adjustment cannot appear as frozen shadow C1', () => {
  for (const change of [{ package_version: 'other' }, { live_model_id: 'other' }, { policy_id: 'other' },
    { status: 'PRODUCTION' }, { production_live_adjustment: 1 }]) {
    assert.throws(() => parseC1LiveStatus([{ ...fixture(), ...change }]));
  }
});

test('invalid counters cannot silently change the independent event denominator', () => {
  for (const change of [{ scored_event_count: 4 }, { prospective_event_count: 9 }, { scored_event_count: -1 },
    { prediction_row_count: 8.5 }, { prospective_event_count: '3' }]) {
    assert.throws(() => parseC1LiveStatus([{ ...fixture(), ...change }]));
  }
});

test('invalid or missing scored MAE is rejected', () => {
  for (const value of [null, undefined, NaN, Infinity, -1, '123']) {
    assert.throws(() => parseC1LiveStatus([{ ...fixture(), latest_row_policy_mae: value }]));
  }
});

test('missing, malformed and future evidence timestamps fail closed', () => {
  for (const change of [{ latest_score_at: null }, { latest_prediction_at: 'invalid' },
    { latest_score_at: '2026-11-05T12:00:00Z' }, { refreshed_at: '2026-11-04' }]) {
    assert.throws(() => parseC1LiveStatus([{ ...fixture(), ...change }]));
  }
});
