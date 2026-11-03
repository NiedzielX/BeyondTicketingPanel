import test from 'node:test';
import assert from 'node:assert/strict';
import { DAY_MS, dailyInventoryPathGeometry, daysToKickoff, timePosition } from './dailyInventoryPathGeometry.ts';
import type { DailyInventoryPathEvent } from '../../services/dailyInventoryPathService.ts';

function event(): DailyInventoryPathEvent {
  return {
    ticket_event_id: 1, club_slug: 'example', kickoff_at: '2026-12-10T12:00:00Z', issued_as_of_at: '2026-12-07T12:00:00Z', status: 'READY',
    measurement_key: 'test', model_version: 'test-model', model_sha256: 'a'.repeat(64),
    observations: [
      { snapshot_id: 1, captured_at: '2026-11-01T12:00:00Z', available_total: 100 },
      { snapshot_id: 2, captured_at: '2026-12-07T12:00:00Z', available_total: 80 }
    ],
    points: [1, 2].map((lead_days) => ({
      ticket_event_id: 1, issued_as_of_at: '2026-12-07T12:00:00Z', target_at: new Date(Date.parse('2026-12-07T12:00:00Z') + lead_days * DAY_MS).toISOString(), lead_days,
      model_version: 'test-model', predicted_available_total: 80 - lead_days * 10, baseline_available_total: 80,
      measurement_key: 'test', input_manifest_sha256: 'b'.repeat(64), model_sha256: 'a'.repeat(64), evidence_kind: 'research_preview_not_prospective'
    }))
  };
}

test('dates, not point indices, determine distance on the axis', () => {
  assert.equal(timePosition(1, 0, 10, 0, 100), 10);
  assert.equal(timePosition(9, 0, 10, 0, 100), 90);
  assert.throws(() => timePosition(1, 1, 1, 0, 100));
});

test('prefix keeps its genuine early observations and missing-day gaps', () => {
  const plot = dailyInventoryPathGeometry(event());
  assert.equal(plot.observed.length, 2);
  assert.equal(plot.start, Date.parse('2026-11-01T12:00:00Z'));
  assert.equal((plot.observedPath.match(/M /g) || []).length, 2);
  assert.equal((plot.observedPath.match(/L /g) || []).length, 0);
});

test('future path contains only actual model outputs and never a terminal-attendance endpoint', () => {
  const input = event();
  const plot = dailyInventoryPathGeometry(input);
  assert.deepEqual(plot.predicted.map((point) => point.value), [70, 60]);
  assert.equal((plot.predictedPath.match(/M /g) || []).length, 1);
  assert.equal((plot.predictedPath.match(/L /g) || []).length, 1);
  assert.ok(plot.predicted[0].x > plot.issueX);
  assert.ok(plot.predicted[1].x < plot.getX(input.kickoff_at));
});

test('a genuine zero remains plotted rather than converted to missing data', () => {
  const input = event();
  input.observations[1].available_total = 0;
  const plot = dailyInventoryPathGeometry(input);
  assert.equal(plot.observed[1].value, 0);
  assert.equal(plot.observed[1].y, plot.height - plot.padding.bottom);
});

test('P-N means actual 24-hour distance to kickoff', () => {
  assert.equal(daysToKickoff('2026-12-07T12:00:00Z', '2026-12-10T12:00:00Z'), 3);
});

test('realizations are separate later points and cannot replace the original predictions or prefix', () => {
  const input = event();
  input.points[0].score = {
    target_snapshot_id: 55, target_captured_at: '2026-12-08T11:58:00Z',
    target_available_total: 130, scored_at: '2026-12-08T12:05:00Z',
    candidate_abs_error: 60, baseline_abs_error: 50
  };
  const plot = dailyInventoryPathGeometry(input);
  assert.equal(plot.realized.length, 1);
  assert.equal(plot.realized[0].value, 130);
  assert.ok(plot.realized[0].x > plot.issueX);
  assert.equal(plot.predicted[0].value, 70);
  assert.equal(plot.observed.length, 2);
  assert.ok(plot.yMax >= 130);
});
