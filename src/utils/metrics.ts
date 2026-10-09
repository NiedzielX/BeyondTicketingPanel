import { HorizonBucket } from '../types/ticketing';

/**
 * Calculates absolute difference between prediction and actual value
 */
export function absoluteError(prediction: number, actual: number): number {
  return Math.abs(prediction - actual);
}

/**
 * Calculates signed difference (prediction - actual)
 * Positive: over-forecasting (model overestimated)
 * Negative: under-forecasting (model underestimated)
 */
export function signedError(prediction: number, actual: number): number {
  return prediction - actual;
}

/**
 * Calculates percentage error: abs(prediction - actual) / actual * 100
 * Returns null if actual is 0 or invalid to avoid division by zero.
 */
export function percentageError(prediction: number, actual: number): number | null {
  if (!actual || actual <= 0) return null;
  return (Math.abs(prediction - actual) / actual) * 100;
}

/**
 * Calculates difference between current forecast and previous forecast
 */
export function forecastDelta(
  currentForecast: number,
  previousForecast: number | null | undefined
): number | null {
  if (previousForecast === null || previousForecast === undefined) {
    return null;
  }
  return currentForecast - previousForecast;
}

/**
 * Calculates calendar days between two ISO dates or Date objects.
 * If targetDate is snapshot/forecast time and eventDate is match day,
 * returns positive days remaining until match.
 */
export function daysToEvent(
  pointInTime: string | Date,
  eventDate: string | Date
): number {
  const pTime = new Date(pointInTime).getTime();
  const eTime = new Date(eventDate).getTime();
  const diffDays = Math.ceil((eTime - pTime) / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Map days-to-event count into standard horizon buckets
 */
export function getHorizonBucket(days: number): HorizonBucket {
  if (days >= 30) return '30+ dni';
  if (days >= 15) return '15–29 dni';
  if (days >= 8) return '8–14 dni';
  if (days >= 4) return '4–7 dni';
  if (days >= 1) return '1–3 dni';
  return 'dzień eventu';
}

/**
 * Mean Absolute Error (MAE)
 */
export function calculateMAE(pairs: Array<{ prediction: number; actual: number }>): number {
  if (pairs.length === 0) return 0;
  const sum = pairs.reduce((acc, curr) => acc + absoluteError(curr.prediction, curr.actual), 0);
  return Math.round(sum / pairs.length);
}

/**
 * Mean Absolute Percentage Error (MAPE)
 */
export function calculateMAPE(pairs: Array<{ prediction: number; actual: number }>): number {
  const valid = pairs.filter((p) => p.actual > 0);
  if (valid.length === 0) return 0;
  const sum = valid.reduce((acc, curr) => {
    const err = percentageError(curr.prediction, curr.actual);
    return acc + (err ?? 0);
  }, 0);
  return Number((sum / valid.length).toFixed(1));
}

/**
 * Median Absolute Error
 */
export function calculateMedianError(pairs: Array<{ prediction: number; actual: number }>): number {
  if (pairs.length === 0) return 0;
  const errors = pairs
    .map((p) => absoluteError(p.prediction, p.actual))
    .sort((a, b) => a - b);
  const mid = Math.floor(errors.length / 2);
  if (errors.length % 2 === 0) {
    return Math.round((errors[mid - 1] + errors[mid]) / 2);
  }
  return errors[mid];
}

/**
 * Forecast Bias (Signed Mean Error)
 * A positive bias indicates systemic overforecasting; negative indicates underforecasting.
 */
export function calculateBias(pairs: Array<{ prediction: number; actual: number }>): number {
  if (pairs.length === 0) return 0;
  const sum = pairs.reduce((acc, curr) => acc + signedError(curr.prediction, curr.actual), 0);
  return Math.round(sum / pairs.length);
}
