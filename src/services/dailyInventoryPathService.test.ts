import assert from 'node:assert/strict';
import test from 'node:test';
import { fetchDailyInventoryPaths, parseDailyInventoryPathFeed } from './dailyInventoryPathService.ts';

const DAY_MS = 24 * 60 * 60 * 1000;
const ISSUE = '2026-11-03T12:00:00Z';
const MODEL_HASH = 'a'.repeat(64);
const INPUT_HASH = 'b'.repeat(64);

function fixture() {
  return {
    version: 'daily-inventory-path-preview-v1', generated_at: '2026-11-03T13:00:00Z',
    evidence_kind: 'research_preview_not_prospective', production_change: false,
    events: [{
      ticket_event_id: 446, club_slug: 'wisla-plock', kickoff_at: '2026-11-06T12:00:00Z', issued_as_of_at: ISSUE,
      status: 'READY', measurement_key: 'public-v1', model_version: 'daily-inventory-direct-median-v1', model_sha256: MODEL_HASH,
      observations: [30, 24, 12, 0].map((hoursAgo, index) => ({
        snapshot_id: index + 1,
        captured_at: new Date(Date.parse(ISSUE) - hoursAgo * 60 * 60 * 1000).toISOString(),
        available_total: [0, 100, 50, 0][index]
      })),
      points: [1, 2].map((lead) => ({
        ticket_event_id: 446, issued_as_of_at: ISSUE, target_at: new Date(Date.parse(ISSUE) + lead * DAY_MS).toISOString(),
        lead_days: lead, model_version: 'daily-inventory-direct-median-v1', predicted_available_total: 10 * lead,
        baseline_available_total: 0, measurement_key: 'public-v1', input_manifest_sha256: INPUT_HASH,
        model_sha256: MODEL_HASH, evidence_kind: 'research_preview_not_prospective'
      }))
    }]
  };
}

function scoredFixture() {
  const feed: any = fixture();
  feed.generated_at = '2026-11-04T13:00:00Z';
  feed.events[0].points[0].score = {
    target_snapshot_id: 50, target_captured_at: '2026-11-04T11:55:00Z',
    target_available_total: 0, scored_at: '2026-11-04T12:05:00Z',
    candidate_abs_error: 10, baseline_abs_error: 0, measurement_key: 'public-v1'
  };
  return feed;
}

test('later genuine outcomes remain separate from the immutable forecast prefix', () => {
  const parsed = parseDailyInventoryPathFeed(scoredFixture());
  const event = parsed.events[0];
  assert.equal(event.points[0].score?.target_available_total, 0);
  assert.equal(event.points[0].score?.candidate_abs_error, 10);
  assert.equal(event.observations.length, 4);
  assert.ok(event.observations.every((point) => Date.parse(point.captured_at) <= Date.parse(event.issued_as_of_at)));
  assert.equal(event.points[0].predicted_available_total, 10);
});

test('rejects premature, stale, mismatched or fabricated score rows', () => {
  for (const [field, value] of [
    ['target_captured_at', '2026-11-04T12:00:01Z'],
    ['target_captured_at', '2026-11-04T05:00:00Z'],
    ['scored_at', '2026-11-04T11:59:59Z'],
    ['scored_at', '2026-11-04T14:00:00Z'],
    ['measurement_key', 'different-source'],
    ['candidate_abs_error', 0], ['baseline_abs_error', 10],
    ['target_snapshot_id', 0], ['target_available_total', null]
  ] as const) {
    const feed = scoredFixture();
    feed.events[0].points[0].score[field] = value;
    assert.throws(() => parseDailyInventoryPathFeed(feed), field);
  }
});

test('preserves real zero inventory and every future day, without deriving sales', () => {
  const parsed = parseDailyInventoryPathFeed(fixture());
  assert.equal(parsed.events[0].observations[0].available_total, 0);
  assert.deepEqual(parsed.events[0].points.map((point) => point.lead_days), [1, 2]);
  assert.equal(parsed.events[0].points[1].predicted_available_total, 20);
});

test('training-range metadata is optional, model-bound and does not replace predictions', () => {
  const feed: any = fixture();
  feed.training_support = { model_sha256: MODEL_HASH, max_lead_days: 1 };
  const parsed = parseDailyInventoryPathFeed(feed);
  assert.equal(parsed.training_support?.max_lead_days, 1);
  assert.equal(parsed.events[0].points.length, 2);
  feed.training_support.max_lead_days = 60;
  assert.throws(() => parseDailyInventoryPathFeed(feed));
});

test('rejects unknown, non-finite, negative and string values instead of replacing them with zero', () => {
  for (const value of [null, undefined, Number.NaN, Number.POSITIVE_INFINITY, -1, '0']) {
    const feed = fixture();
    (feed.events[0].observations[0] as any).available_total = value;
    assert.throws(() => parseDailyInventoryPathFeed(feed));
  }
});

test('rejects input after the issue cutoff and target timestamp leakage', () => {
  const futureInput = fixture();
  futureInput.events[0].observations[0].captured_at = '2026-11-03T12:00:01Z';
  assert.throws(() => parseDailyInventoryPathFeed(futureInput));
  const pastTarget = fixture();
  pastTarget.events[0].points[0].target_at = ISSUE;
  assert.throws(() => parseDailyInventoryPathFeed(pastTarget));
  const kickoffTarget = fixture();
  kickoffTarget.events[0].points[1].target_at = kickoffTarget.events[0].kickoff_at;
  kickoffTarget.events[0].points[1].lead_days = 3;
  assert.throws(() => parseDailyInventoryPathFeed(kickoffTarget));
});

test('requires exact daily lead and issue timestamps, not calendar-day buckets', () => {
  const feed = fixture();
  feed.events[0].points[0].target_at = '2026-11-04T13:00:00Z';
  assert.throws(() => parseDailyInventoryPathFeed(feed));
  const nonDailyIssue = fixture();
  nonDailyIssue.events[0].issued_as_of_at = '2026-11-03T12:00:01Z';
  assert.throws(() => parseDailyInventoryPathFeed(nonDailyIssue));
  const invalidDate = fixture();
  invalidDate.events[0].observations[0].captured_at = '2026-02-31T12:00:00Z';
  assert.throws(() => parseDailyInventoryPathFeed(invalidDate));
});

test('rejects cross-event/source/model/manifest contamination', () => {
  for (const [key, value] of [
    ['ticket_event_id', 447], ['measurement_key', 'another-source'], ['model_sha256', 'c'.repeat(64)],
    ['model_version', 'another-model'], ['issued_as_of_at', '2026-11-02T12:00:00Z'],
    ['input_manifest_sha256', 'd'.repeat(64)], ['evidence_kind', 'prospective']
  ] as const) {
    const feed = fixture();
    (feed.events[0].points[1] as any)[key] = value;
    assert.throws(() => parseDailyInventoryPathFeed(feed), key);
  }
});

test('rejects duplicate vintages, observations, leads and incomplete paths', () => {
  const duplicateVintage = fixture();
  duplicateVintage.events.push(structuredClone(duplicateVintage.events[0]));
  assert.throws(() => parseDailyInventoryPathFeed(duplicateVintage));
  const duplicateObservation = fixture();
  duplicateObservation.events[0].observations.push(structuredClone(duplicateObservation.events[0].observations[0]));
  assert.throws(() => parseDailyInventoryPathFeed(duplicateObservation));
  const duplicateLead = fixture();
  duplicateLead.events[0].points[1] = structuredClone(duplicateLead.events[0].points[0]);
  assert.throws(() => parseDailyInventoryPathFeed(duplicateLead));
  const missingLead = fixture();
  missingLead.events[0].points.pop();
  assert.throws(() => parseDailyInventoryPathFeed(missingLead));
});

test('READY requires four distinct hourly observations spanning at least a day', () => {
  const insufficient = fixture();
  insufficient.events[0].observations.pop();
  assert.throws(() => parseDailyInventoryPathFeed(insufficient), /insufficient prefix observations/);
  const shortSpan = fixture();
  shortSpan.events[0].observations.forEach((observation, index) => {
    observation.captured_at = new Date(Date.parse(ISSUE) - (3 - index) * 60 * 60 * 1000).toISOString();
  });
  assert.throws(() => parseDailyInventoryPathFeed(shortSpan), /insufficient prefix span/);
  const repeatedHour = fixture();
  repeatedHour.events[0].observations[0].captured_at = '2026-11-02T12:05:00Z';
  assert.throws(() => parseDailyInventoryPathFeed(repeatedHour), /duplicate UTC-hour bucket/);
});

test('accepts exactly six-hour staleness but rejects an older READY prefix', () => {
  const boundary = fixture();
  boundary.events[0].observations.forEach((observation) => {
    observation.captured_at = new Date(Date.parse(observation.captured_at) - 6 * 60 * 60 * 1000).toISOString();
  });
  assert.equal(parseDailyInventoryPathFeed(boundary).events[0].status, 'READY');
  boundary.events[0].observations.forEach((observation) => {
    observation.captured_at = new Date(Date.parse(observation.captured_at) - 1).toISOString();
  });
  assert.throws(() => parseDailyInventoryPathFeed(boundary), /stale prefix/);
});

test('every persistence baseline equals the latest genuine observation, including zero', () => {
  const feed = fixture();
  assert.equal(parseDailyInventoryPathFeed(feed).events[0].points[0].baseline_available_total, 0);
  feed.events[0].points[1].baseline_available_total = 1;
  assert.throws(() => parseDailyInventoryPathFeed(feed), /persistence baseline/);
});

test('accepts a fail-closed issue without invented metadata or predictions', () => {
  const feed = fixture();
  const issue = feed.events[0] as any;
  issue.status = 'NO_OBSERVATIONS';
  issue.measurement_key = null;
  delete issue.model_version;
  delete issue.model_sha256;
  issue.observations = [];
  issue.points = [];
  const parsed = parseDailyInventoryPathFeed(feed);
  assert.equal(parsed.events[0].status, 'NO_OBSERVATIONS');
  assert.deepEqual(parsed.events[0].points, []);
});

test('missing export and SPA HTML response produce honest missing state', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response('', { status: 404 });
    assert.deepEqual(await fetchDailyInventoryPaths(), { status: 'missing' });
    globalThis.fetch = async () => new Response('<!doctype html>', { headers: { 'content-type': 'text/html' } });
    assert.deepEqual(await fetchDailyInventoryPaths(), { status: 'missing' });
    globalThis.fetch = async () => new Response('broken', { headers: { 'content-type': 'application/json' } });
    await assert.rejects(fetchDailyInventoryPaths());
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('fetch uses a read-only request without credentials and validates the response', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url, options) => {
      assert.equal(url, '/research/daily-inventory-path-v1.json');
      assert.equal(options?.credentials, 'omit');
      assert.equal(options?.cache, 'no-store');
      assert.equal(options?.method, undefined);
      return new Response(JSON.stringify(fixture()), { headers: { 'content-type': 'application/json' } });
    };
    const response = await fetchDailyInventoryPaths();
    assert.equal(response.status, 'ready');
    if (response.status === 'ready') assert.equal(response.feed.events[0].points.length, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
