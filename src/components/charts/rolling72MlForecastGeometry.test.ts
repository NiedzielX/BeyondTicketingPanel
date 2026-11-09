/** Geometry on genuine persisted v2 data, with synthetic edge-case mutations. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { parseRolling72MlFeed } from '../../services/rolling72MlForecastService.ts';
import { rolling72MlForecastGeometry } from './rolling72MlForecastGeometry.ts';
const actual = parseRolling72MlFeed(JSON.parse(readFileSync(new URL('../../../public/research/rolling72-shadow-snapshot-v2.json', import.meta.url), 'utf8')));
const vintage = () => structuredClone(actual.vintages[0]);

test('candidate retains the last real capture anchor and three stored future coordinates', () => {
  const v = vintage(), g = rolling72MlForecastGeometry(v, 'candidate');
  assert.equal(g.observed.length, v.observations.length);
  assert.equal(g.anchor?.at, v.observations.at(-1)!.captured_at);
  assert.notEqual(g.anchor?.at, v.issued_at);
  assert.deepEqual(g.predicted.map(p => p.value), v.points.map(p => p.models.candidate.predicted_available_total));
  assert.deepEqual(g.predicted.map(p => p.at), v.points.map(p => p.target_at));
});
test('a missing horizon breaks candidate line instead of bridging future gaps', () => {
  const v = vintage(); v.points[1].models.candidate.predicted_available_total = null;
  const g = rolling72MlForecastGeometry(v, 'candidate');
  assert.deepEqual(g.predicted.map(p => p.horizonHours), [24, 72]);
  assert.equal(g.predictionSegments.length, 2);
});
test('unavailable benchmark never substitutes ML and zero is still numeric', () => {
  const v = vintage(); assert.equal(rolling72MlForecastGeometry(v, 'pickup').predicted.length, 0);
  v.points[0].models.candidate.predicted_available_total = 0;
  assert.equal(rolling72MlForecastGeometry(v, 'candidate').predicted[0].value, 0);
});
test('full history stays in input and existing temporal gaps stay broken', () => {
  const v = vintage(), before = structuredClone(v.observations);
  const recent = rolling72MlForecastGeometry(v, 'candidate'), full = rolling72MlForecastGeometry(v, 'candidate', { viewport: 'full' });
  assert.deepEqual(v.observations, before); assert.equal(recent.observed.length, full.observed.length);
  assert.ok(recent.start >= full.start);
  assert.ok(recent.observationSegments.length >= 2);
});
test('invalid SVG dimensions fail instead of plotting NaN', () => {
  for (const width of [0, Number.NaN, Number.POSITIVE_INFINITY]) assert.throws(() => rolling72MlForecastGeometry(vintage(), 'candidate', { width }));
});
