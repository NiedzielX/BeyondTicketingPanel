import React, { useId, useState } from 'react';
import { Forecast, Snapshot } from '../../types/ticketing';
import { formatDateShort, formatNumber } from '../../utils/formatters';

interface SalesForecastChartProps {
  snapshots: Snapshot[];
  forecasts: Forecast[];
  eventDate: string;
  capacity?: number;
  actualOutcome?: number;
  eventName?: string;
}

interface MergedPoint {
  index: number;
  timestamp: string;
  dateLabel: string;
  daysBefore: number;
  proxy?: number;
  forecast?: number;
  forecastDelta?: number;
}

export const SalesForecastChart: React.FC<SalesForecastChartProps> = ({
  snapshots,
  forecasts,
  eventDate,
  capacity,
  actualOutcome
}) => {
  const chartId = useId();
  const [hoveredPoint, setHoveredPoint] = useState<MergedPoint | null>(null);
  const [cursorX, setCursorX] = useState<number | null>(null);

  const timelineMap = new Map<string, { timestamp: string; proxy?: number; forecast?: number }>();
  snapshots.forEach((snapshot) => {
    const dayKey = snapshot.timestamp.substring(0, 10);
    const existing = timelineMap.get(dayKey) || { timestamp: snapshot.timestamp };
    existing.proxy = snapshot.sold;
    timelineMap.set(dayKey, existing);
  });
  forecasts.forEach((forecast) => {
    const dayKey = forecast.timestamp.substring(0, 10);
    const existing = timelineMap.get(dayKey) || { timestamp: forecast.timestamp };
    existing.forecast = forecast.predictedFinalSales;
    timelineMap.set(dayKey, existing);
  });

  const sortedDays = Array.from(timelineMap.entries()).sort(
    (a, b) => new Date(a[1].timestamp).getTime() - new Date(b[1].timestamp).getTime()
  );

  let previousForecast: number | undefined;
  const points: MergedPoint[] = sortedDays.map(([, value], index) => {
    const daysBefore = Math.max(
      0,
      Math.ceil((new Date(eventDate).getTime() - new Date(value.timestamp).getTime()) / (1000 * 60 * 60 * 24))
    );
    let forecastDelta: number | undefined;
    if (value.forecast !== undefined) {
      if (previousForecast !== undefined) forecastDelta = value.forecast - previousForecast;
      previousForecast = value.forecast;
    }
    return {
      index,
      timestamp: value.timestamp,
      dateLabel: formatDateShort(value.timestamp),
      daysBefore,
      proxy: value.proxy,
      forecast: value.forecast,
      forecastDelta
    };
  });

  if (points.length === 0) {
    return <div className="flex h-64 items-center justify-center text-xs text-zinc-400">Brak wystarczającej liczby snapshotów do wygenerowania wykresu.</div>;
  }

  const width = 800;
  const height = 300;
  const padding = { top: 24, right: 36, bottom: 44, left: 60 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const allValues: number[] = [];
  points.forEach((point) => {
    if (point.proxy !== undefined) allValues.push(point.proxy);
    if (point.forecast !== undefined) allValues.push(point.forecast);
  });
  if (actualOutcome) allValues.push(actualOutcome);
  if (capacity && capacity < 50000) allValues.push(capacity * 1.05);
  const yMax = Math.ceil(Math.max(...allValues, 1000) / 5000) * 5000;
  const getX = (index: number) => points.length === 1 ? padding.left + plotWidth / 2 : padding.left + (index / (points.length - 1)) * plotWidth;
  const getY = (value: number) => padding.top + plotHeight - (Math.max(0, Math.min(yMax, value)) / yMax) * plotHeight;

  const proxyPoints = points.filter((point) => point.proxy !== undefined);
  const proxyPath = proxyPoints.map((point, index) => `${index === 0 ? 'M' : 'L'} ${getX(point.index)} ${getY(point.proxy!)}`).join(' ');
  const forecastPoints = points.filter((point) => point.forecast !== undefined);
  const forecastPath = forecastPoints.map((point, index) => `${index === 0 ? 'M' : 'L'} ${getX(point.index)} ${getY(point.forecast!)}`).join(' ');
  const actualY = actualOutcome ? getY(actualOutcome) : null;
  const capacityY = capacity && capacity <= yMax ? getY(capacity) : null;
  const yTicks = [0, yMax * 0.25, yMax * 0.5, yMax * 0.75, yMax];

  return (
    <div className="relative w-full select-none">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 text-xs text-zinc-600 dark:text-zinc-400">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 bg-indigo-600 rounded" />
            <span className="font-medium text-zinc-900 dark:text-zinc-100">Sygnał popytu (inventory proxy)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 border-t-2 border-dashed border-emerald-600" />
            <span className="font-medium text-zinc-900 dark:text-zinc-100">Prognoza frekwencji P50</span>
          </div>
          {actualOutcome !== undefined && (
            <div className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 border-t-2 border-dotted border-amber-600" />
              <span className="font-medium text-zinc-900 dark:text-zinc-100">Rzeczywista frekwencja ({formatNumber(actualOutcome)})</span>
            </div>
          )}
          {capacity !== undefined && (
            <div className="flex items-center gap-1.5 text-zinc-400">
              <span className="h-px w-4 border-t border-zinc-300 dark:border-zinc-700" />
              <span>Pojemność referencyjna ({formatNumber(capacity)})</span>
            </div>
          )}
        </div>
        <span className="text-[11px] text-zinc-400 hidden sm:inline">Inventory proxy nie jest potwierdzoną sprzedażą</span>
      </div>

      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[550px] overflow-visible" onMouseLeave={() => { setHoveredPoint(null); setCursorX(null); }}>
          <defs>
            <linearGradient id={`${chartId}-proxy-grad`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
            </linearGradient>
          </defs>

          {yTicks.map((tickValue, index) => {
            const y = getY(tickValue);
            return (
              <g key={`ytick-${index}`}>
                <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="currentColor" strokeDasharray="2 3" className="text-zinc-100 dark:text-zinc-800" />
                <text x={padding.left - 8} y={y + 3} textAnchor="end" className="fill-zinc-400 text-[10px] tabular-nums">{formatNumber(tickValue)}</text>
              </g>
            );
          })}

          {capacityY !== null && (
            <g>
              <line x1={padding.left} y1={capacityY} x2={width - padding.right} y2={capacityY} stroke="#a1a1aa" strokeWidth="1" strokeDasharray="4 4" strokeOpacity="0.6" />
              <text x={width - padding.right - 4} y={capacityY - 4} textAnchor="end" className="fill-zinc-400 text-[9px] font-medium">Pojemność: {formatNumber(capacity)}</text>
            </g>
          )}

          {actualY !== null && (
            <g>
              <line x1={padding.left} y1={actualY} x2={width - padding.right} y2={actualY} stroke="#d97706" strokeWidth="1.5" strokeDasharray="4 3" />
              <text x={padding.left + 8} y={actualY - 6} className="fill-amber-700 dark:fill-amber-400 text-[10px] font-medium">Frekwencja: {formatNumber(actualOutcome)}</text>
            </g>
          )}

          {proxyPoints.length > 1 && (
            <path d={`${proxyPath} L ${getX(proxyPoints[proxyPoints.length - 1].index)} ${getY(0)} L ${getX(proxyPoints[0].index)} ${getY(0)} Z`} fill={`url(#${chartId}-proxy-grad)`} />
          )}
          {forecastPath && <path d={forecastPath} fill="none" stroke="#10b981" strokeWidth="2.25" strokeDasharray="5 3" strokeLinecap="round" />}
          {proxyPath && <path d={proxyPath} fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" />}

          {forecastPoints.map((point) => (
            <circle key={`fc-${point.index}`} cx={getX(point.index)} cy={getY(point.forecast!)} r={hoveredPoint?.index === point.index ? 5 : 3.5} className="fill-emerald-500 stroke-white dark:stroke-zinc-900 transition-all" strokeWidth="2" />
          ))}
          {proxyPoints.map((point) => (
            <circle key={`proxy-${point.index}`} cx={getX(point.index)} cy={getY(point.proxy!)} r={hoveredPoint?.index === point.index ? 5.5 : 4} className="fill-indigo-600 stroke-white dark:stroke-zinc-900 transition-all" strokeWidth="2" />
          ))}

          {points.map((point) => {
            const x = getX(point.index);
            return (
              <g key={`x-${point.index}`}>
                <line x1={x} y1={height - padding.bottom} x2={x} y2={height - padding.bottom + 4} stroke="currentColor" className="text-zinc-300 dark:text-zinc-700" />
                <text x={x} y={height - padding.bottom + 15} textAnchor="middle" className="fill-zinc-600 dark:fill-zinc-300 text-[10px] font-medium">{point.daysBefore === 0 ? 'Dzień meczu' : `-${point.daysBefore} d`}</text>
                <text x={x} y={height - padding.bottom + 26} textAnchor="middle" className="fill-zinc-400 dark:fill-zinc-500 text-[9px]">{point.dateLabel.split(',')[0]}</text>
              </g>
            );
          })}

          {cursorX !== null && <line x1={cursorX} y1={padding.top} x2={cursorX} y2={height - padding.bottom} stroke="#6366f1" strokeWidth="1" strokeDasharray="2 2" />}
          {points.map((point) => {
            const x = getX(point.index);
            const zoneWidth = plotWidth / points.length;
            return <rect key={`zone-${point.index}`} x={x - zoneWidth / 2} y={padding.top} width={zoneWidth} height={plotHeight} fill="transparent" className="cursor-crosshair" onMouseEnter={() => { setHoveredPoint(point); setCursorX(x); }} />;
          })}
        </svg>
      </div>

      {hoveredPoint && cursorX !== null && (
        <div className="pointer-events-none absolute z-20 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 px-3 py-2 text-xs shadow-lg backdrop-blur-sm transition-all" style={{ left: `${Math.min(Math.max(cursorX, 100), width - 150)}px`, top: '35px', transform: 'translateX(-50%)' }}>
          <div className="border-b border-zinc-100 dark:border-zinc-800 pb-1 mb-1.5 flex items-center justify-between gap-3">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">{hoveredPoint.daysBefore === 0 ? 'Dzień eventu' : `${hoveredPoint.daysBefore} dni do meczu`}</span>
            <span className="text-[10px] text-zinc-400">{hoveredPoint.dateLabel}</span>
          </div>
          <div className="space-y-1">
            {hoveredPoint.proxy !== undefined && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-zinc-500 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />Inventory proxy:</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100 tabular-nums">{formatNumber(hoveredPoint.proxy)}</span>
              </div>
            )}
            {hoveredPoint.forecast !== undefined && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-zinc-500 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Prognoza P50:</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">{formatNumber(hoveredPoint.forecast)}</span>
              </div>
            )}
            {hoveredPoint.forecastDelta !== undefined && (
              <div className="flex items-center justify-between gap-4 text-[11px] pt-0.5 border-t border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-400">Zmiana prognozy:</span>
                <span className={`tabular-nums font-medium ${hoveredPoint.forecastDelta > 0 ? 'text-emerald-600' : hoveredPoint.forecastDelta < 0 ? 'text-rose-600' : 'text-zinc-500'}`}>{hoveredPoint.forecastDelta > 0 ? '+' : ''}{formatNumber(hoveredPoint.forecastDelta)}</span>
              </div>
            )}
            {actualOutcome !== undefined && (
              <div className="flex items-center justify-between gap-4 text-[11px] pt-0.5">
                <span className="text-amber-600 dark:text-amber-400">Rzeczywista frekwencja:</span>
                <span className="tabular-nums font-semibold text-zinc-900 dark:text-zinc-100">{formatNumber(actualOutcome)}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
