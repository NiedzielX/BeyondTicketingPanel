/** Actual sanitized paired-shadow snapshot; tampering cases are test-only. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { parseRolling72MlFeed, fetchRolling72MlForecasts } from './rolling72MlForecastService.ts';

const actual = JSON.parse(readFileSync(new URL('../../public/research/rolling72-shadow-snapshot-v2.json', import.meta.url), 'utf8'));
const mutate = (change: (feed: any) => void) => { const value = structuredClone(actual); change(value); return value; };
const reject = (change: (feed: any) => void) => assert.throws(() => parseRolling72MlFeed(mutate(change)));

test('actual paired v2 snapshot preserves candidate and benchmark values and identity', () => {
  const feed = parseRolling72MlFeed(actual);
  assert.equal(feed.version, 'rolling72-shadow-feed-v2');
  assert.equal(feed.synthetic_test, false);
  assert.equal(feed.vintages.length, 2);
  for (const [i, vintage] of feed.vintages.entries()) {
    assert.deepEqual(vintage.points.map(p => p.horizon_hours), [24, 48, 72]);
    for (const [j, point] of vintage.points.entries()) {
      assert.equal(point.models.candidate.model_id, 'rolling72-capture-segment-quantile-tree-v2');
      assert.equal(point.models.candidate.predicted_available_total, actual.vintages[i].points[j].models.candidate.predicted_available_total);
      assert.equal(point.models.persistence.predicted_available_total, vintage.observations.at(-1)!.available_total);
      assert.equal(point.models.pickup.predicted_available_total, null);
      assert.equal(point.models.candidate.score, null);
    }
  }
  assert.equal(feed.vintages.find(v => v.club_slug === 'jagiellonia')!.points[0].models.candidate.outside_training_maturity_range, true);
});

test('rejects old version, synthetic or production-on feed', () => {
  reject(v => { v.version = 'rolling72-shadow-feed-v1'; });
  reject(v => { v.synthetic_test = true; });
  reject(v => { v.production_change = true; });
});
test('four exact model names and distinct candidate ID are required', () => {
  reject(v => { delete v.vintages[0].points[0].models.candidate; });
  reject(v => { v.vintages[0].points[0].models.candidate.model_id = 'rolling72-persistence-v1'; });
  reject(v => { v.vintages[0].points[0].models.extra = {}; });
});
test('model freeze must precede lane freeze and manifest lineage stays common', () => {
  reject(v => { v.model_frozen_at = v.generated_at; });
  reject(v => { v.vintages[0].model_manifest_sha256 = '0'.repeat(64); });
});
test('historical training knowledge cannot be presented as proven', () => {
  reject(v => { v.historical_training_knowledge_unproven = false; });
  reject(v => { v.vintages[0].historical_training_knowledge_unproven = false; });
  reject(v => { v.vintages[0].points[0].models.candidate.historical_training_knowledge_unproven = false; });
});
test('quality flags cannot silently disappear or become strings', () => {
  reject(v => { delete v.vintages[0].points[0].models.candidate.outside_training_maturity_range; });
  reject(v => { v.vintages[0].points[0].models.candidate.outside_training_maturity_range = 'false'; });
});
test('late writes and model issue before lane freeze fail closed', () => {
  reject(v => { v.vintages[0].written_at = new Date(Date.parse(v.vintages[0].issued_at) + 91_000).toISOString(); });
  reject(v => { v.frozen_at = v.generated_at; });
  reject(v => { v.frozen_at = v.vintages[0].issued_at; });
});
test('future-known prefix and changed measurement fail closed', () => {
  reject(v => { v.vintages[0].observations[0].known_at = v.generated_at; });
  reject(v => { v.vintages[0].observations[0].measurement_key = 'another-pool'; });
});
test('hidden sources cannot be a READY prefix', () => reject(v => { v.vintages[0].observations[0].source_visible = false; }));
test('all numeric paired models obey maximum one-hour source age', () => reject(v => {
  const last = v.vintages[0].observations.at(-1);
  last.captured_at = new Date(Date.parse(v.vintages[0].issued_at) - 3_700_000).toISOString();
}));
test('nominal horizons and prediction arithmetic are enforced', () => {
  reject(v => { v.vintages[0].points[0].target_at = v.vintages[0].points[1].target_at; });
  reject(v => { v.vintages[0].points[0].models.candidate.predicted_delta += 1; });
});
test('unavailable stays null, never silently zero or fallback', () => {
  reject(v => { v.vintages[0].points[0].models.pickup.predicted_available_total = 0; });
  reject(v => { v.vintages[0].points[0].models.candidate.status = 'UNAVAILABLE'; });
});
test('literal predicted zero remains a genuine numeric point', () => {
  const feed = mutate(v => { const m = v.vintages[0].points[0].models.candidate;
    m.predicted_available_total = 0; m.predicted_delta = -v.vintages[0].observations.at(-1).available_total; });
  assert.equal(parseRolling72MlFeed(feed).vintages[0].points[0].models.candidate.predicted_available_total, 0);
});
test('scores cannot precede nominal target or appear without forecasts', () => {
  const fake = (v: any) => ({ target_snapshot_id: 999999, target_captured_at: v.issued_at,
    target_known_at: v.issued_at, target_available_total: 100, scored_at: v.issued_at, absolute_error: 0 });
  reject(v => { v.vintages[0].points[0].models.candidate.score = fake(v.vintages[0]); });
  reject(v => { v.vintages[0].points[0].models.pickup.score = fake(v.vintages[0]); });
});
test('duplicate vintage or horizon does not count as new evidence', () => {
  reject(v => { v.vintages.push(v.vintages[0]); });
  reject(v => { v.vintages[0].points[1] = v.vintages[0].points[0]; });
});
test('missing explicit research URL returns missing without making requests', async () => {
  const original = globalThis.fetch; let calls = 0;
  globalThis.fetch = async () => { calls++; throw new Error('must not fetch'); };
  try { assert.deepEqual(await fetchRolling72MlForecasts(), { status: 'missing' }); assert.equal(calls, 0); }
  finally { globalThis.fetch = original; }
});
test('explicit research URL fetch uses no credentials and validates response', async () => {
  const original = globalThis.fetch; let options: RequestInit | undefined;
  globalThis.fetch = async (url, init) => { assert.equal(url, '/explicit-v2.json'); options = init;
    return new Response(JSON.stringify(actual), { headers: { 'content-type': 'application/json' } }); };
  try { assert.equal((await fetchRolling72MlForecasts('/explicit-v2.json')).status, 'ready'); assert.equal(options?.credentials, 'omit'); }
  finally { globalThis.fetch = original; }
});


test('a later paired realization stays separate and needs a post-target receipt', () => {
  const feed = mutate(v => {
    const point = v.vintages[0].points[0], target = Date.parse(point.target_at);
    v.generated_at = new Date(target + 2 * 3_600_000).toISOString();
    for (const m of Object.values(point.models) as any[]) if (m.predicted_available_total !== null) m.score = {
      target_snapshot_id: 999999, target_captured_at: new Date(target - 300_000).toISOString(),
      target_known_at: new Date(target + 900_000).toISOString(), target_available_total: 8200,
      scored_at: new Date(target + 1_000_000).toISOString(), absolute_error: Math.abs(m.predicted_available_total - 8200),
    };
  });
  assert.equal(parseRolling72MlFeed(feed).vintages[0].points[0].models.candidate.score!.target_available_total, 8200);
  assert.equal(parseRolling72MlFeed(feed).vintages[0].observations.length, actual.vintages[0].observations.length);
  for (const m of Object.values(feed.vintages[0].points[0].models) as any[]) if (m.score) m.score.target_known_at = m.score.target_captured_at;
  assert.throws(() => parseRolling72MlFeed(feed));
});
