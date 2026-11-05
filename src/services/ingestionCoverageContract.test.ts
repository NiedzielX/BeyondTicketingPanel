import assert from 'node:assert/strict';
import test from 'node:test';
import { partitionIngestionRows, ingestionObservation, ingestionProjectionTime, isIngestionProjectionStale } from './ingestionCoverageContract.ts';
import type { IngestionCoverageRow } from './ingestionCoverageContract.ts';

const NOW = Date.parse('2026-11-05T15:40:00Z');
function fixture(change: Partial<IngestionCoverageRow> = {}): IngestionCoverageRow {
  return { record_key: 'synthetic-only', record_type: 'candidate', club_slug: 'synthetic', club_name: 'Synthetic',
    external_event_id: 'test', label: 'Synthetic test', candidate_kind: 'match', ingestion_status: 'BUFFERING_AWAITING_KICKOFF',
    kickoff_at: '2026-11-06T17:00:00Z', ticket_event_id: null, snapshot_count: 0, first_snapshot_at: null,
    last_snapshot_at: null, raw_snapshot_count: 10, first_raw_snapshot_at: '2026-11-04T12:00:00Z',
    last_raw_snapshot_at: '2026-11-05T15:35:00Z', source_url: null, mapping_source: null, issue_reason: null,
    first_seen_at: '2026-11-04T12:00:00Z', last_seen_at: '2026-11-05T15:36:00Z', refreshed_at: '2026-11-05T15:39:00Z', ...change };
}

test('elapsed buffered and empty candidates leave current counts without losing evidence', () => {
  const oldBuffer = fixture({ kickoff_at: '2026-10-27T16:30:00Z' });
  const oldEmpty = fixture({ record_key: 'empty', kickoff_at: '2026-11-02T17:00:00Z', ingestion_status: 'MATCH_DISCOVERED_NO_BUFFER', raw_snapshot_count: 0 });
  const current = fixture({ record_key: 'future' });
  const before = structuredClone([oldBuffer, oldEmpty, current]);
  const view = partitionIngestionRows([oldBuffer, oldEmpty, current], NOW);
  assert.deepEqual(view.current, [current]); assert.deepEqual(view.pastUnresolved, [oldBuffer, oldEmpty]);
  assert.deepEqual([oldBuffer, oldEmpty, current], before);
});

test('unknown and malformed kickoff stays visible for verification', () => {
  for (const kickoff_at of [null, 'invalid', '2026-11-05T14:00:00']) {
    assert.equal(partitionIngestionRows([fixture({ kickoff_at })], NOW).current.length, 1);
  }
});

test('known completed and excluded products never become active unresolved matches', () => {
  for (const ingestion_status of ['COMPLETED_TRACKED', 'NON_MATCH_EXCLUDED', 'UNKNOWN_EXCLUDED'] as const) {
    assert.deepEqual(partitionIngestionRows([fixture({ ingestion_status })], NOW), { current: [], pastUnresolved: [] });
  }
});

test('elapsed transition uses timestamp and does not assert a played result', () => {
  const row = fixture({ kickoff_at: '2026-11-05T15:40:00Z' });
  assert.equal(partitionIngestionRows([row], NOW - 1).current.length, 1);
  assert.equal(partitionIngestionRows([row], NOW).pastUnresolved.length, 1);
});

test('timestamp offsets and Warsaw midnight do not change elapsed classification', () => {
  const a = fixture({ kickoff_at: '2026-11-05T16:40:00+01:00' });
  assert.equal(partitionIngestionRows([a], NOW).pastUnresolved.length, 1);
});

test('projection time uses oldest row and never replaces actual observation time', () => {
  const old = fixture({ refreshed_at: '2026-11-05T14:00:00Z' });
  assert.equal(ingestionProjectionTime([fixture(), old]), old.refreshed_at);
  assert.equal(isIngestionProjectionStale([fixture(), old], NOW), true);
  assert.equal(ingestionObservation(old).at, old.last_raw_snapshot_at);
});

test('invalid projection freshness is unknown, not a successful fresh read', () => {
  assert.equal(ingestionProjectionTime([fixture({ refreshed_at: 'bad' })]), null);
  assert.equal(isIngestionProjectionStale([fixture({ refreshed_at: 'bad' })], NOW), true);
  assert.equal(isIngestionProjectionStale([], NOW), false);
});

test('a new dashboard refresh cannot hide missing inventory', () => {
  const row = fixture({ raw_snapshot_count: 0, last_raw_snapshot_at: null, refreshed_at: '2026-11-05T15:40:00Z' });
  assert.match(ingestionObservation(row).label, /brak obserwacji inventory/);
  assert.equal(ingestionObservation(row).at, row.last_seen_at);
});

test('tracked inventory time takes precedence over discovery or raw buffer time', () => {
  const row = fixture({ snapshot_count: 3, last_snapshot_at: '2026-11-05T15:30:00Z' });
  assert.deepEqual(ingestionObservation(row), { label: 'Inventory', at: row.last_snapshot_at });
});
