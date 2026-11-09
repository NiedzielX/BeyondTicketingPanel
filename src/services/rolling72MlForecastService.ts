/** Separate actual-time paired ML research feed; public availability, not attendance. */
export const ROLLING72_ML_HORIZONS = [24, 48, 72] as const;
export type Rolling72MlHorizon = typeof ROLLING72_ML_HORIZONS[number];
export type Rolling72MlModelName = 'candidate' | 'persistence' | 'drift' | 'pickup';
export const ROLLING72_ML_MODELS: Record<Rolling72MlModelName, string> = {
  candidate: 'rolling72-capture-segment-quantile-tree-v2',
  persistence: 'rolling72-persistence-v1',
  drift: 'rolling72-observed-24h-drift-v1',
  pickup: 'rolling72-conditional-pickup-v1',
};
export const ROLLING72_ML_MODEL_LABELS: Record<Rolling72MlModelName, string> = {
  candidate: 'Model ML — eksperyment v2',
  persistence: 'Ostatni odczyt — benchmark', drift: 'Tempo 24 h — benchmark', pickup: 'Historyczna zmiana — benchmark',
};
export interface Rolling72MlObservation {
  snapshot_id: number; captured_at: string; known_at: string; available_total: number;
  measurement_key: string; source_active: boolean | null; source_visible: boolean | null;
}
export interface Rolling72MlScore {
  target_snapshot_id: number; target_captured_at: string; target_known_at: string;
  target_available_total: number; scored_at: string; absolute_error: number;
}
export interface Rolling72MlModel {
  model_id: string; status: 'READY' | 'UNAVAILABLE'; status_reason: string | null;
  predicted_available_total: number | null; predicted_delta: number | null; score: Rolling72MlScore | null;
  outside_training_maturity_range: boolean | null; historical_training_knowledge_unproven: boolean | null;
}
export interface Rolling72MlPoint {
  horizon_hours: Rolling72MlHorizon; target_at: string | null; status: string;
  models: Record<Rolling72MlModelName, Rolling72MlModel>;
}
export interface Rolling72MlVintage {
  ticket_event_id: number; club_slug: string; kickoff_at: string; event_known_at: string;
  issued_at: string; written_at: string; status: string; measurement_key: string | null;
  input_manifest_sha256: string; prefix_sha256: string; source_receipt_sha256: string;
  precommit_sha256: string; freeze_sha256: string; scenario_stability: 'UNKNOWN';
  cohort: 'exposed_or_unverified_fixture_not_new_review';
  model_manifest_sha256: string; historical_training_knowledge_unproven: true; observations: Rolling72MlObservation[]; points: Rolling72MlPoint[];
}
export interface Rolling72MlFeed {
  version: 'rolling72-shadow-feed-v2'; generated_at: string; frozen_at: string;
  model_frozen_at: string | null; model_manifest_sha256: string; historical_training_knowledge_unproven: true; synthetic_test: false;
  metric: 'public-displayed-available-total-v1'; evidence_kind: 'immutable_actual_time_paired_shadow';
  production_change: false; live_adjustment: 0; vintages: Rolling72MlVintage[];
}

const HOUR_US = 3_600_000_000n;
const MODEL_NAMES = Object.keys(ROLLING72_ML_MODELS) as Rolling72MlModelName[];
function fail(field: string): never { throw new Error(`Invalid rolling72 feed: ${field}`); }
function record(value: unknown, field: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(field);
  return value as Record<string, unknown>;
}
function text(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) fail(field);
  return value;
}
function number(value: unknown, field: string, nonnegative = false): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || (nonnegative && value < 0)) fail(field);
  return value;
}
function id(value: unknown, field: string): number {
  const n = number(value, field, true);
  if (!Number.isSafeInteger(n) || n < 1) fail(field);
  return n;
}
function hash(value: unknown, field: string): string {
  if (typeof value !== 'string' || !/^[a-f0-9]{64}$/.test(value)) fail(field);
  return value;
}
/** Preserve microsecond boundaries; Date.parse alone silently truncates them. */
function micros(value: unknown, field: string): bigint {
  const valueText = text(value, field);
  const match = valueText.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,6}))?(Z|[+-]\d{2}:\d{2})$/);
  if (!match) fail(field);
  const [, y, m, d, h, min, sec, fraction = '', offset] = match;
  const year = Number(y), month = Number(m), day = Number(d), hour = Number(h), minute = Number(min), second = Number(sec);
  const calendar = new Date(0);
  calendar.setUTCFullYear(year, month - 1, day);
  calendar.setUTCHours(hour, minute, second, 0);
  if (year < 1 || month < 1 || month > 12 || day < 1 || hour > 23 || minute > 59 || second > 59
    || calendar.getUTCFullYear() !== year || calendar.getUTCMonth() !== month - 1 || calendar.getUTCDate() !== day) fail(field);
  let offsetMinutes = 0;
  if (offset !== 'Z') {
    const hours = Number(offset.slice(1, 3)), minutes = Number(offset.slice(4));
    if (hours > 23 || minutes > 59) fail(field);
    offsetMinutes = (hours * 60 + minutes) * (offset[0] === '+' ? 1 : -1);
  }
  return BigInt(calendar.getTime() - offsetMinutes * 60_000) * 1000n + BigInt(fraction.padEnd(6, '0'));
}
function timestamp(value: unknown, field: string): string { micros(value, field); return value as string; }
function flag(value: unknown, field: string): boolean | null {
  if (value !== null && typeof value !== 'boolean') fail(field);
  return value as boolean | null;
}
function close(a: number, b: number): boolean { return Math.abs(a - b) <= Math.max(1e-8, Math.abs(b) * 1e-12); }

/** Validate semantics and declared lineage consistency, not source authenticity. */
export function parseRolling72MlFeed(input: unknown): Rolling72MlFeed {
  const feed = record(input, 'feed');
  if (feed.version !== 'rolling72-shadow-feed-v2' || feed.metric !== 'public-displayed-available-total-v1'
    || feed.evidence_kind !== 'immutable_actual_time_paired_shadow' || feed.production_change !== false || feed.live_adjustment !== 0
    || feed.historical_training_knowledge_unproven !== true || feed.synthetic_test !== false) fail('identity');
  const generated = timestamp(feed.generated_at, 'generated_at'), frozen = timestamp(feed.frozen_at, 'frozen_at');
  const generatedUs = micros(generated, 'generated_at'), frozenUs = micros(frozen, 'frozen_at');
  const modelHash = hash(feed.model_manifest_sha256, 'model_manifest_sha256');
  const modelFrozen = feed.model_frozen_at === null ? null : timestamp(feed.model_frozen_at, 'model_frozen_at');
  if (modelFrozen !== null && micros(modelFrozen, 'model_frozen_at') > frozenUs) fail('model freeze after lane freeze');
  if (frozenUs > generatedUs || !Array.isArray(feed.vintages)) fail('freeze/vintages');
  const seenVintages = new Set<string>();
  let commonPrecommit: string | undefined, commonFreeze: string | undefined;
  const vintages = feed.vintages.map((value, index): Rolling72MlVintage => {
    const at = `vintages[${index}]`, v = record(value, at);
    const eventId = id(v.ticket_event_id, `${at}.event`), club = text(v.club_slug, `${at}.club`);
    const kickoff = timestamp(v.kickoff_at, `${at}.kickoff`), known = timestamp(v.event_known_at, `${at}.event_known_at`);
    const issued = timestamp(v.issued_at, `${at}.issued_at`), written = timestamp(v.written_at, `${at}.written_at`);
    const issueUs = micros(issued, at), writtenUs = micros(written, at), kickoffUs = micros(kickoff, at);
    if (frozenUs >= issueUs || micros(known, at) > issueUs || writtenUs < issueUs || writtenUs > generatedUs
      || writtenUs - issueUs > 90_000_000n) fail(`${at}.clocks`);
    const identity = `${eventId}:${issueUs}`;
    if (seenVintages.has(identity)) fail(`${at}.duplicate vintage`);
    seenVintages.add(identity);
    const status = text(v.status, `${at}.status`);
    const measurement = v.measurement_key === null ? null : text(v.measurement_key, `${at}.measurement`);
    const inputHash = hash(v.input_manifest_sha256, `${at}.input`), prefixHash = hash(v.prefix_sha256, `${at}.prefix`);
    const sourceHash = hash(v.source_receipt_sha256, `${at}.source`);
    const precommitHash = hash(v.precommit_sha256, `${at}.precommit`), freezeHash = hash(v.freeze_sha256, `${at}.freeze`);
    if ((commonPrecommit && precommitHash !== commonPrecommit) || (commonFreeze && freezeHash !== commonFreeze)
      || v.scenario_stability !== 'UNKNOWN' || v.cohort !== 'exposed_or_unverified_fixture_not_new_review') fail(`${at}.lineage/scenario`);
    commonPrecommit = precommitHash; commonFreeze = freezeHash;
    if (v.model_manifest_sha256 !== modelHash || v.historical_training_knowledge_unproven !== true) fail(`${at}.model lineage`);
    if (!Array.isArray(v.observations) || !Array.isArray(v.points)) fail(`${at}.arrays`);
    const snapshotIds = new Set<number>(); const captureTimes = new Set<string>();
    let previousCapture: bigint | undefined;
    const observations = v.observations.map((item, i): Rolling72MlObservation => {
      const path = `${at}.observations[${i}]`, r = record(item, path);
      const snapshot = id(r.snapshot_id, path), captured = timestamp(r.captured_at, path), receipt = timestamp(r.known_at, path);
      const capturedUs = micros(captured, path), knownUs = micros(receipt, path);
      if (capturedUs > knownUs || knownUs > issueUs || knownUs !== micros(known, path)
        || (previousCapture !== undefined && capturedUs <= previousCapture)
        || snapshotIds.has(snapshot) || captureTimes.has(String(capturedUs))
        || r.measurement_key !== measurement) fail(`${path}.identity/clocks`);
      snapshotIds.add(snapshot); captureTimes.add(String(capturedUs)); previousCapture = capturedUs;
      return { snapshot_id: snapshot, captured_at: captured, known_at: receipt,
        available_total: number(r.available_total, path, true), measurement_key: text(r.measurement_key, path),
        source_active: flag(r.source_active, path), source_visible: flag(r.source_visible, path) };
    });
    const latest = observations[observations.length - 1];
    if (status === 'READY' && (!measurement || !latest || issueUs >= kickoffUs
      || issueUs - micros(latest.captured_at, at) > 6n * HOUR_US
      || observations.some(o => o.source_active === false || o.source_visible === false))) fail(`${at}.READY prefix`);
    if (v.points.length !== ROLLING72_ML_HORIZONS.length) fail(`${at}.horizon count`);
    const seenHorizons = new Set<number>();
    const points = v.points.map((item, i): Rolling72MlPoint => {
      const path = `${at}.points[${i}]`, p = record(item, path);
      const horizon = number(p.horizon_hours, `${path}.horizon`);
      if (!ROLLING72_ML_HORIZONS.includes(horizon as Rolling72MlHorizon) || seenHorizons.has(horizon)) fail(`${path}.horizon`);
      seenHorizons.add(horizon);
      const coordinateStatus = text(p.status, `${path}.status`);
      const target = p.target_at === null ? null : timestamp(p.target_at, `${path}.target`);
      const nominal = issueUs + BigInt(horizon) * HOUR_US;
      if ((target !== null && micros(target, path) !== nominal)
        || (coordinateStatus === 'READY' && (status !== 'READY' || target === null || nominal >= kickoffUs))) fail(`${path}.coordinate`);
      if (status !== 'READY' && (target !== null || coordinateStatus !== status)) fail(`${path}.failed coordinate`);
      if (status === 'READY' && coordinateStatus !== (nominal < kickoffUs ? 'READY' : 'TARGET_NOT_BEFORE_KICKOFF')) fail(`${path}.target status`);
      const modelValues = record(p.models, `${path}.models`);
      if (Object.keys(modelValues).sort().join('|') !== MODEL_NAMES.slice().sort().join('|')) fail(`${path}.model set`);
      let commonScore: string | undefined;
      const models = {} as Record<Rolling72MlModelName, Rolling72MlModel>;
      for (const model of MODEL_NAMES) {
        const m = record(modelValues[model], `${path}.${model}`);
        if (m.model_id !== ROLLING72_ML_MODELS[model] || !['READY', 'UNAVAILABLE'].includes(String(m.status))) fail(`${path}.${model}.identity`);
        let prediction: number | null = null, delta: number | null = null;
        if (m.status === 'READY') {
          prediction = number(m.predicted_available_total, path, true); delta = number(m.predicted_delta, path);
          if (coordinateStatus !== 'READY' || !latest || nominal <= writtenUs || m.status_reason !== null
            || !close(delta, prediction - latest.available_total)) fail(`${path}.${model}.prediction`);
        } else if (m.predicted_available_total !== null || m.predicted_delta !== null) fail(`${path}.${model}.unavailable number`);
        const reason = m.status === 'READY' ? null : text(m.status_reason, `${path}.${model}.reason`);
        if (model === 'candidate') {
          if (m.historical_training_knowledge_unproven !== true
            || (m.status === 'READY' ? typeof m.outside_training_maturity_range !== 'boolean' : m.outside_training_maturity_range !== null)) fail(`${path}.candidate quality`);
        } else if (m.historical_training_knowledge_unproven !== null || m.outside_training_maturity_range !== null) fail(`${path}.baseline quality`);
        if (m.status === 'READY' && issueUs - micros(latest.captured_at, at) > HOUR_US) fail(`${path}.v2 freshness`);
        let score: Rolling72MlScore | null = null;
        if (m.score !== null) {
          if (prediction === null || target === null) fail(`${path}.${model}.score without prediction`);
          const s = record(m.score, `${path}.${model}.score`);
          const captured = timestamp(s.target_captured_at, path), receipt = timestamp(s.target_known_at, path), scored = timestamp(s.scored_at, path);
          const capturedUs = micros(captured, path), knownUs = micros(receipt, path), scoredUs = micros(scored, path);
          const actual = number(s.target_available_total, path, true), error = number(s.absolute_error, path, true);
          if (capturedUs <= issueUs || capturedUs > nominal || nominal - capturedUs > 6n * HOUR_US
            || knownUs < capturedUs || knownUs < nominal || knownUs > scoredUs || scoredUs < nominal || scoredUs > generatedUs
            || !close(error, Math.abs(prediction - actual))) fail(`${path}.${model}.score clocks/arithmetic`);
          score = { target_snapshot_id: id(s.target_snapshot_id, path), target_captured_at: captured,
            target_known_at: receipt, target_available_total: actual, scored_at: scored, absolute_error: error };
          const scoreIdentity = JSON.stringify([score.target_snapshot_id, String(capturedUs), String(knownUs), actual, String(scoredUs)]);
          if (commonScore && commonScore !== scoreIdentity) fail(`${path}.shared target mismatch`);
          commonScore = scoreIdentity;
        }
        models[model] = { model_id: m.model_id as string, status: m.status as 'READY' | 'UNAVAILABLE', status_reason: reason,
          predicted_available_total: prediction, predicted_delta: delta, score,
          outside_training_maturity_range: m.outside_training_maturity_range as boolean | null,
          historical_training_knowledge_unproven: m.historical_training_knowledge_unproven as boolean | null };
      }
      const numericModels = MODEL_NAMES.filter(name => models[name].predicted_available_total !== null);
      if (numericModels.some(name => models[name].score !== null) && numericModels.some(name => models[name].score === null)) fail(`${path}.partial accepted score`);
      return { horizon_hours: horizon as Rolling72MlHorizon, target_at: target, status: coordinateStatus, models };
    }).sort((a, b) => a.horizon_hours - b.horizon_hours);
    return { ticket_event_id: eventId, club_slug: club, kickoff_at: kickoff, event_known_at: known, issued_at: issued, written_at: written,
      status, measurement_key: measurement, input_manifest_sha256: inputHash, prefix_sha256: prefixHash,
      source_receipt_sha256: sourceHash, precommit_sha256: precommitHash, freeze_sha256: freezeHash,
      scenario_stability: 'UNKNOWN', cohort: 'exposed_or_unverified_fixture_not_new_review',
      model_manifest_sha256: modelHash, historical_training_knowledge_unproven: true, observations, points };
  });
  return { version: 'rolling72-shadow-feed-v2', generated_at: generated, frozen_at: frozen,
    metric: 'public-displayed-available-total-v1', evidence_kind: 'immutable_actual_time_paired_shadow',
    production_change: false, live_adjustment: 0, model_frozen_at: modelFrozen, model_manifest_sha256: modelHash,
    historical_training_knowledge_unproven: true, synthetic_test: false, vintages };
}

export type Rolling72MlResponse = { status: 'ready'; feed: Rolling72MlFeed } | { status: 'missing' };
/** Research-only helper; absent explicit URL never fetches or substitutes a snapshot. */
export async function fetchRolling72MlForecasts(feedUrl?: string, signal?: AbortSignal): Promise<Rolling72MlResponse> {
  const url = feedUrl?.trim() ?? ''; // Explicit research URL only; no implicit production feed.
  if (!url) return { status: 'missing' };
  const response = await fetch(url, { signal, credentials: 'omit', cache: 'no-store' });
  if (response.status === 404) return { status: 'missing' };
  if (!response.ok) throw new Error(`Rolling72Ml feed unavailable (${response.status})`);
  if ((response.headers.get('content-type') ?? '').includes('text/html')) return { status: 'missing' };
  return { status: 'ready', feed: parseRolling72MlFeed(await response.json()) };
}
