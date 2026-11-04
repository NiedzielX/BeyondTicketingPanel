import type { DailyInventoryPathEvent } from '../../services/dailyInventoryPathService.ts';

export const DAY_MS = 24 * 60 * 60 * 1000;

/** A date-based axis: gaps in observations keep their actual duration. */
export function timePosition(time: number, start: number, end: number, left: number, width: number): number {
  if (![time, start, end, left, width].every(Number.isFinite) || end <= start || width < 0) {
    throw new Error('Invalid daily-path time axis');
  }
  return left + ((time - start) / (end - start)) * width;
}

export function daysToKickoff(timestamp: string, kickoff: string): number {
  return (Date.parse(kickoff) - Date.parse(timestamp)) / DAY_MS;
}

export interface InventoryPlotPoint {
  at: string;
  value: number;
  kind: 'observation' | 'prediction' | 'realized';
  leadDays?: number;
  x: number;
  y: number;
}

export function dailyInventoryPathGeometry(event: DailyInventoryPathEvent, width = 900, height = 310) {
  const padding = { left: 66, right: 24, top: 24, bottom: 46 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const observations = [...event.observations].sort((a, b) => Date.parse(a.captured_at) - Date.parse(b.captured_at));
  const predictions = [...event.points].sort((a, b) => Date.parse(a.target_at) - Date.parse(b.target_at));
  const issueTime = Date.parse(event.issued_as_of_at);
  const start = observations.length ? Date.parse(observations[0].captured_at) : issueTime - DAY_MS;
  const end = Date.parse(event.kickoff_at);
  const values = [...observations.map((point) => point.available_total), ...predictions.map((point) => point.predicted_available_total),
    ...predictions.flatMap((point) => point.score ? [point.score.target_available_total] : [])];
  const maximum = Math.max(1, ...values);
  const magnitude = 10 ** Math.floor(Math.log10(maximum));
  const yMax = Math.ceil((maximum * 1.08) / magnitude) * magnitude;
  const getX = (at: string | number) => timePosition(typeof at === 'number' ? at : Date.parse(at), start, end, padding.left, plotWidth);
  const getY = (value: number) => padding.top + plotHeight - (value / yMax) * plotHeight;
  const observed: InventoryPlotPoint[] = observations.map((point) => ({
    at: point.captured_at, value: point.available_total, kind: 'observation', x: getX(point.captured_at), y: getY(point.available_total)
  }));
  const predicted: InventoryPlotPoint[] = predictions.map((point) => ({
    at: point.target_at, value: point.predicted_available_total, kind: 'prediction', leadDays: point.lead_days, x: getX(point.target_at), y: getY(point.predicted_available_total)
  }));
  const realized: InventoryPlotPoint[] = predictions.flatMap((point) => point.score ? [{
    at: point.score.target_captured_at, value: point.score.target_available_total, kind: 'realized' as const,
    leadDays: point.lead_days, x: getX(point.score.target_captured_at), y: getY(point.score.target_available_total)
  }] : []);
  // A long gap is a missing observation, not an interpolated daily history.
  const observedPath = observed.map((point, index) => {
    const startsSegment = index === 0 || Date.parse(point.at) - Date.parse(observed[index - 1].at) > DAY_MS;
    return `${startsSegment ? 'M' : 'L'} ${point.x} ${point.y}`;
  }).join(' ');
  // Only model-produced target points enter this path. Never connect inventory to terminal attendance.
  const predictedPath = predicted.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const maxDays = Math.floor((end - start) / DAY_MS);
  const tickStep = Math.max(1, Math.ceil(maxDays / 5));
  const tickDays: number[] = [];
  for (let days = maxDays; days >= 0; days -= tickStep) tickDays.push(days);
  if (tickDays[tickDays.length - 1] !== 0) tickDays.push(0);
  return {
    width, height, padding, plotWidth, plotHeight, start, end, yMax,
    issueX: getX(issueTime), observed, predicted, realized, observedPath, predictedPath,
    xTicks: tickDays.map((days) => end - days * DAY_MS),
    yTicks: Array.from({ length: 5 }, (_, index) => (yMax * index) / 4),
    getX, getY
  };
}
