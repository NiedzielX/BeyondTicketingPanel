/** Exact existing live-shadow scoreboard; never combine it with panel forecasts. */
export const C1_PACKAGE = 'c1-shadow-v8-frozen-2026-10-16-n9';
const C1_MODEL = 'c1-v2-live-ridge-directocc-compact-generic-a10';
const C1_POLICY = 'c1-alpha-reliability-policy-v8-fixed-10pp-positive-slope-20pp-single';

export interface C1LiveStatus {
  packageVersion: string;
  predictionRows: number;
  forecastEvents: number;
  scoredEvents: number;
  policyMae: number | null;
  priorMae: number | null;
  rawMae: number | null;
  policyWindowMae: number | null;
  latestPredictionAt: string | null;
  latestScoreAt: string | null;
  refreshedAt: string;
}

function invalid(field: string): never { throw new Error(`Invalid C1 live status: ${field}`); }
function count(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) invalid(field);
  return value;
}
function date(value: unknown, field: string): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value)
    || !Number.isFinite(Date.parse(value))) invalid(field);
  return value;
}

export function parseC1LiveStatus(input: unknown): C1LiveStatus | null {
  if (!Array.isArray(input)) invalid('rows');
  if (!input.length) return null;
  if (input.length !== 1 || !input[0] || typeof input[0] !== 'object' || Array.isArray(input[0])) invalid('unique row');
  const row = input[0] as Record<string, unknown>;
  if (row.package_version !== C1_PACKAGE || row.live_model_id !== C1_MODEL || row.policy_id !== C1_POLICY
    || row.status !== 'EXPERIMENTAL_SHADOW' || row.production_live_adjustment !== 0) invalid('model/governance identity');
  const predictionRows = count(row.prediction_row_count, 'prediction rows');
  const forecastEvents = count(row.prospective_event_count, 'forecast events');
  const scoredEvents = count(row.scored_event_count, 'scored events');
  if (scoredEvents > forecastEvents || forecastEvents > predictionRows) invalid('event denominator');
  const metric = (key: string): number | null => {
    const value = row[key];
    if (scoredEvents === 0) {
      if (value !== null) invalid(key);
      return null;
    }
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) invalid(key);
    return value;
  };
  const optionalDate = (key: string, required: boolean): string | null => {
    if (!required) {
      if (row[key] !== null) invalid(key);
      return null;
    }
    return date(row[key], key);
  };
  const refreshedAt = date(row.refreshed_at, 'refreshed_at');
  const latestPredictionAt = optionalDate('latest_prediction_at', predictionRows > 0);
  const latestScoreAt = optionalDate('latest_score_at', scoredEvents > 0);
  if ([latestPredictionAt, latestScoreAt].some(value => value && Date.parse(value) > Date.parse(refreshedAt))) invalid('future summary timestamp');
  return { packageVersion: C1_PACKAGE, predictionRows, forecastEvents, scoredEvents,
    policyMae: metric('latest_row_policy_mae'), priorMae: metric('latest_row_prior_mae'), rawMae: metric('latest_row_live_mae'),
    policyWindowMae: metric('representative_window_policy_mae'), latestPredictionAt, latestScoreAt, refreshedAt };
}
