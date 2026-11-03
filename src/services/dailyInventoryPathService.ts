/** Read-only daily inventory path previews. This is separate from attendance P50. */

export interface DailyInventoryPathObservation {
  snapshot_id: number;
  captured_at: string;
  available_total: number;
}

export interface DailyInventoryPathPoint {
  ticket_event_id: number;
  issued_as_of_at: string;
  target_at: string;
  lead_days: number;
  model_version: string;
  predicted_available_total: number;
  baseline_available_total: number;
  measurement_key: string;
  input_manifest_sha256: string;
  model_sha256: string;
  evidence_kind: 'research_preview_not_prospective';
  score?: {
    target_snapshot_id: number;
    target_captured_at: string;
    target_available_total: number;
    scored_at: string;
    candidate_abs_error: number;
    baseline_abs_error: number;
  };
}

export interface DailyInventoryPathEvent {
  ticket_event_id: number;
  club_slug: string;
  kickoff_at: string;
  issued_as_of_at: string;
  status: string;
  measurement_key?: string;
  observations: DailyInventoryPathObservation[];
  points: DailyInventoryPathPoint[];
  model_version?: string;
  model_sha256?: string;
}

export interface DailyInventoryPathFeed {
  version: 'daily-inventory-path-preview-v1';
  generated_at: string;
  evidence_kind: 'research_preview_not_prospective';
  production_change: false;
  events: DailyInventoryPathEvent[];
  training_support?: { model_sha256: string; max_lead_days: number };
}

export type DailyInventoryPathResponse =
  | { status: 'ready'; feed: DailyInventoryPathFeed }
  | { status: 'missing' };

const DAY_MS = 24 * 60 * 60 * 1000;
const PREVIEW_KIND = 'research_preview_not_prospective';
const FEED_VERSION = 'daily-inventory-path-preview-v1';

function invalid(field: string): never {
  throw new Error(`Invalid daily inventory path: ${field}`);
}

function record(value: unknown, field: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid(field);
  return value as Record<string, unknown>;
}

function text(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) invalid(field);
  return value;
}

function nonnegative(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) invalid(field);
  return value;
}

function integer(value: unknown, field: string): number {
  const result = nonnegative(value, field);
  if (!Number.isSafeInteger(result) || result < 1) invalid(field);
  return result;
}

function hash(value: unknown, field: string): string {
  if (typeof value !== 'string' || !/^[a-f0-9]{64}$/i.test(value)) invalid(field);
  return value.toLowerCase();
}

function timestamp(value: unknown, field: string): string {
  const result = text(value, field);
  const parts = result.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,6})?(Z|[+-]\d{2}:\d{2})$/);
  if (!parts || !Number.isFinite(Date.parse(result))) invalid(field);
  const [, year, month, day, hour, minute, second, offset] = parts;
  const calendar = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (
    calendar.getUTCFullYear() !== Number(year) || calendar.getUTCMonth() + 1 !== Number(month)
    || calendar.getUTCDate() !== Number(day) || Number(hour) > 23 || Number(minute) > 59
    || Number(second) > 59 || (offset !== 'Z' && (Number(offset.slice(1, 3)) > 23 || Number(offset.slice(4)) > 59))
  ) invalid(field);
  return result;
}

function sameTime(a: string, b: string): boolean {
  return Date.parse(a) === Date.parse(b);
}

/** Validate the complete feed. A malformed vintage is never silently discarded. */
export function parseDailyInventoryPathFeed(input: unknown): DailyInventoryPathFeed {
  const feed = record(input, 'feed');
  if (feed.version !== FEED_VERSION || feed.evidence_kind !== PREVIEW_KIND || feed.production_change !== false) {
    invalid('feed identity');
  }
  const generatedAt = timestamp(feed.generated_at, 'generated_at');
  let support: DailyInventoryPathFeed['training_support'];
  if (feed.training_support != null) {
    const rawSupport = record(feed.training_support, 'training_support');
    const maximum = integer(rawSupport.max_lead_days, 'training_support.max_lead_days');
    if (maximum > 59) invalid('training_support.max_lead_days');
    support = { model_sha256: hash(rawSupport.model_sha256, 'training_support.model_sha256'), max_lead_days: maximum };
  }
  if (!Array.isArray(feed.events)) invalid('events');
  const identities = new Set<string>();
  const events: DailyInventoryPathEvent[] = feed.events.map((value, eventIndex) => {
    const path = `events[${eventIndex}]`;
    const event = record(value, path);
    const eventId = integer(event.ticket_event_id, `${path}.ticket_event_id`);
    const clubSlug = text(event.club_slug, `${path}.club_slug`);
    const kickoff = timestamp(event.kickoff_at, `${path}.kickoff_at`);
    const issue = timestamp(event.issued_as_of_at, `${path}.issued_as_of_at`);
    const daysRemaining = (Date.parse(kickoff) - Date.parse(issue)) / DAY_MS;
    if (!Number.isInteger(daysRemaining) || daysRemaining < 1 || daysRemaining > 60 || Date.parse(issue) > Date.parse(generatedAt)) {
      invalid(`${path}.issue cutoff`);
    }
    const identity = `${eventId}:${Date.parse(issue)}`;
    if (identities.has(identity)) invalid(`${path}.duplicate vintage`);
    identities.add(identity);
    const status = text(event.status, `${path}.status`);
    const measurement = event.measurement_key == null ? undefined : text(event.measurement_key, `${path}.measurement_key`);
    const modelVersion = event.model_version == null ? undefined : text(event.model_version, `${path}.model_version`);
    const modelHash = event.model_sha256 == null ? undefined : hash(event.model_sha256, `${path}.model_sha256`);
    if (!Array.isArray(event.observations) || !Array.isArray(event.points)) invalid(`${path}.observations/points`);
    if (status === 'READY' && (!measurement || !modelVersion || !modelHash || event.observations.length === 0)) {
      invalid(`${path}.ready metadata`);
    }
    if (status !== 'READY' && event.points.length !== 0) invalid(`${path}.failed issue with predictions`);
    const snapshotIds = new Set<number>();
    const snapshotTimes = new Set<number>();
    const snapshotHours = new Set<number>();
    const observations = event.observations.map((raw, observationIndex) => {
      const at = `${path}.observations[${observationIndex}]`;
      const observation = record(raw, at);
      const snapshotId = integer(observation.snapshot_id, `${at}.snapshot_id`);
      const captured = timestamp(observation.captured_at, `${at}.captured_at`);
      const capturedMs = Date.parse(captured);
      if (capturedMs > Date.parse(issue) || capturedMs < Date.parse(kickoff) - 60 * DAY_MS) invalid(`${at}.future/out-of-scope observation`);
      if (snapshotIds.has(snapshotId) || snapshotTimes.has(capturedMs)) invalid(`${at}.duplicate observation`);
      const hourBucket = Math.floor(capturedMs / (60 * 60 * 1000));
      if (snapshotHours.has(hourBucket)) invalid(`${at}.duplicate UTC-hour bucket`);
      snapshotIds.add(snapshotId);
      snapshotTimes.add(capturedMs);
      snapshotHours.add(hourBucket);
      if (observation.measurement_key !== undefined && observation.measurement_key !== measurement) invalid(`${at}.measurement_key`);
      if (observation.source_active === false || observation.source_visible === false) invalid(`${at}.hidden/inactive`);
      return { snapshot_id: snapshotId, captured_at: captured, available_total: nonnegative(observation.available_total, `${at}.available_total`) };
    }).sort((a, b) => Date.parse(a.captured_at) - Date.parse(b.captured_at));
    const latestObservation = observations[observations.length - 1];
    if (status === 'READY') {
      if (observations.length < 4) invalid(`${path}.insufficient prefix observations`);
      if (Date.parse(latestObservation.captured_at) - Date.parse(observations[0].captured_at) < DAY_MS) {
        invalid(`${path}.insufficient prefix span`);
      }
      if (Date.parse(issue) - Date.parse(latestObservation.captured_at) > 6 * 60 * 60 * 1000) {
        invalid(`${path}.stale prefix`);
      }
    }
    const leads = new Set<number>();
    let inputHash: string | undefined;
    const points: DailyInventoryPathPoint[] = event.points.map((raw, pointIndex): DailyInventoryPathPoint => {
      const at = `${path}.points[${pointIndex}]`;
      const point = record(raw, at);
      const target = timestamp(point.target_at, `${at}.target_at`);
      const pointIssue = timestamp(point.issued_as_of_at, `${at}.issued_as_of_at`);
      const lead = integer(point.lead_days, `${at}.lead_days`);
      if (point.ticket_event_id !== eventId || !sameTime(pointIssue, issue) || point.measurement_key !== measurement
        || point.model_version !== modelVersion || hash(point.model_sha256, `${at}.model_sha256`) !== modelHash
        || point.evidence_kind !== PREVIEW_KIND) invalid(`${at}.identity`);
      if (Date.parse(target) !== Date.parse(issue) + lead * DAY_MS || Date.parse(target) >= Date.parse(kickoff)) invalid(`${at}.future target`);
      if (leads.has(lead)) invalid(`${at}.duplicate lead`);
      leads.add(lead);
      const pointInputHash = hash(point.input_manifest_sha256, `${at}.input_manifest_sha256`);
      if (inputHash && inputHash !== pointInputHash) invalid(`${at}.input identity`);
      inputHash = pointInputHash;
      const baseline = nonnegative(point.baseline_available_total, `${at}.baseline`);
      if (baseline !== latestObservation?.available_total) invalid(`${at}.persistence baseline`);
      const prediction = nonnegative(point.predicted_available_total, `${at}.prediction`);
      let score: DailyInventoryPathPoint['score'];
      if (point.score != null) {
        const rawScore = record(point.score, `${at}.score`);
        const captured = timestamp(rawScore.target_captured_at, `${at}.score.target_captured_at`);
        const scoredAt = timestamp(rawScore.scored_at, `${at}.score.scored_at`);
        const actual = nonnegative(rawScore.target_available_total, `${at}.score.actual`);
        const candidateError = nonnegative(rawScore.candidate_abs_error, `${at}.score.candidate_abs_error`);
        const baselineError = nonnegative(rawScore.baseline_abs_error, `${at}.score.baseline_abs_error`);
        if (Date.parse(captured) > Date.parse(target) || Date.parse(captured) <= Date.parse(issue)
          || Date.parse(target) - Date.parse(captured) > 6 * 60 * 60 * 1000
          || Date.parse(scoredAt) < Date.parse(target) || Date.parse(scoredAt) > Date.parse(generatedAt)
          || rawScore.measurement_key !== measurement
          || Math.abs(candidateError - Math.abs(prediction - actual)) > 1e-6
          || Math.abs(baselineError - Math.abs(baseline - actual)) > 1e-6) invalid(`${at}.score lineage`);
        score = { target_snapshot_id: integer(rawScore.target_snapshot_id, `${at}.score.snapshot_id`),
          target_captured_at: captured, target_available_total: actual, scored_at: scoredAt,
          candidate_abs_error: candidateError, baseline_abs_error: baselineError };
      }
      return {
        ticket_event_id: eventId, issued_as_of_at: pointIssue, target_at: target, lead_days: lead,
        model_version: modelVersion!, predicted_available_total: prediction, score,
        baseline_available_total: baseline,
        measurement_key: measurement!, input_manifest_sha256: pointInputHash, model_sha256: modelHash!, evidence_kind: PREVIEW_KIND
      };
    }).sort((a, b) => a.lead_days - b.lead_days);
    if (status === 'READY' && points.length !== daysRemaining - 1) invalid(`${path}.incomplete future path`);
    return {
      ticket_event_id: eventId, club_slug: clubSlug, kickoff_at: kickoff, issued_as_of_at: issue, status,
      measurement_key: measurement, observations, points, model_version: modelVersion, model_sha256: modelHash
    };
  }).sort((a, b) => Date.parse(a.issued_as_of_at) - Date.parse(b.issued_as_of_at));
  return { version: FEED_VERSION, generated_at: generatedAt, evidence_kind: PREVIEW_KIND, production_change: false, events, training_support: support };
}

/** Missing export is an explicit empty state, never a fallback to terminal P50. */
export async function fetchDailyInventoryPaths(signal?: AbortSignal): Promise<DailyInventoryPathResponse> {
  const configuredUrl = import.meta.env?.VITE_DAILY_INVENTORY_PATH_URL;
  const url = typeof configuredUrl === 'string' && configuredUrl.trim() ? configuredUrl : '/research/daily-inventory-path-v1.json';
  const response = await fetch(url, { signal, credentials: 'omit', cache: 'no-store' });
  if (response.status === 404) return { status: 'missing' };
  if (!response.ok) throw new Error(`Daily inventory path unavailable (${response.status})`);
  const contentType = response.headers.get('content-type') ?? '';
  // Vite/SPA hosts can return index.html with HTTP 200 for an absent static export.
  if (contentType.includes('text/html')) return { status: 'missing' };
  return { status: 'ready', feed: parseDailyInventoryPathFeed(await response.json()) };
}
