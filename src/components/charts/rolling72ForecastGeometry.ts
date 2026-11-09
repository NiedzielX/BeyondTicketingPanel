/** Plot only actual observations and immutable persisted rolling72 benchmarks. */
import type { Rolling72ModelName, Rolling72Vintage } from '../../services/rolling72ForecastService.ts';

const HOUR_MS = 3_600_000;
export interface Rolling72PlotPoint {
  at: string;
  value: number;
  kind: 'observation' | 'prediction' | 'realized';
  horizonHours?: 24 | 48 | 72;
  x: number;
  y: number;
}
export interface Rolling72GeometryOptions {
  width?: number;
  height?: number;
  viewport?: 'recent' | 'full';
}

function path(segments: Rolling72PlotPoint[][]): string {
  return segments.map(segment => segment.map((point, index) =>
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')).join(' ');
}

export function rolling72ForecastGeometry(vintage: Rolling72Vintage, model: Rolling72ModelName,
  options: Rolling72GeometryOptions = {}) {
  const { width = 900, height = 310, viewport = 'recent' } = options;
  if (![width, height].every(Number.isFinite) || width < 200 || height < 120
    || !['recent', 'full'].includes(viewport)) throw new Error('Invalid rolling72 plot dimensions/viewport');
  const padding = { left: 66, right: 24, top: 24, bottom: 46 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const issued = Date.parse(vintage.issued_at);
  const first = vintage.observations[0];
  const latest = vintage.observations[vintage.observations.length - 1];
  const firstTime = first ? Date.parse(first.captured_at) : issued;
  const start = viewport === 'full' ? firstTime : Math.max(firstTime, issued - 7 * 24 * HOUR_MS);
  const end = Math.max(start + HOUR_MS, issued, Math.min(issued + 72 * HOUR_MS, Date.parse(vintage.kickoff_at)));
  const future = [...vintage.points].sort((a, b) => a.horizon_hours - b.horizon_hours);
  const values = [0, ...vintage.observations.map(point => point.available_total),
    ...future.flatMap(point => {
      const prediction = point.models[model];
      return [...(prediction.predicted_available_total === null ? [] : [prediction.predicted_available_total]),
        ...(prediction.score === null ? [] : [prediction.score.target_available_total])];
    })];
  const maximum = Math.max(1, ...values);
  const magnitude = 10 ** Math.floor(Math.log10(maximum));
  const yMax = Math.ceil(maximum * 1.08 / magnitude) * magnitude;
  const getX = (at: string | number) => padding.left +
    ((typeof at === 'number' ? at : Date.parse(at)) - start) / (end - start) * plotWidth;
  const getY = (value: number) => padding.top + plotHeight - value / yMax * plotHeight;
  const makePoint = (at: string, value: number, kind: Rolling72PlotPoint['kind'], horizonHours?: 24 | 48 | 72): Rolling72PlotPoint =>
    ({ at, value, kind, ...(horizonHours === undefined ? {} : { horizonHours }), x: getX(at), y: getY(value) });
  // Keep the entire real prefix in data; viewport clipping never alters input history.
  const observed = vintage.observations.map(point => makePoint(point.captured_at, point.available_total, 'observation'));
  const observationSegments: Rolling72PlotPoint[][] = [];
  for (const point of observed) {
    const previous = observationSegments[observationSegments.length - 1];
    if (!previous || Date.parse(point.at) - Date.parse(previous[previous.length - 1].at) > 6 * HOUR_MS) observationSegments.push([point]);
    else previous.push(point);
  }
  const anchor = latest ? makePoint(latest.captured_at, latest.available_total, 'observation') : null;
  const predicted: Rolling72PlotPoint[] = [];
  const realized: Rolling72PlotPoint[] = [];
  const predictionSegments: Rolling72PlotPoint[][] = [];
  let current: Rolling72PlotPoint[] = anchor ? [anchor] : [];
  function flush() {
    if (current.some(point => point.kind === 'prediction')) predictionSegments.push(current);
    current = [];
  }
  for (const coordinate of future) {
    const prediction = coordinate.models[model];
    if (prediction.predicted_available_total === null || coordinate.target_at === null) {
      // An unavailable +48h cannot be silently bridged by a +24h→+72h segment.
      flush();
    } else {
      const point = makePoint(coordinate.target_at, prediction.predicted_available_total, 'prediction', coordinate.horizon_hours);
      predicted.push(point);
      current.push(point);
    }
    if (prediction.score !== null) realized.push(makePoint(prediction.score.target_captured_at,
      prediction.score.target_available_total, 'realized', coordinate.horizon_hours));
  }
  flush();
  return { width, height, padding, plotWidth, plotHeight, start, end, yMax, model,
    anchor, observed, predicted, realized, observationSegments, predictionSegments,
    observedPath: path(observationSegments), predictedPath: path(predictionSegments),
    issueX: getX(issued), getX, getY };
}
