import React, { useState, useId } from 'react';
import { Snapshot, Forecast } from '../../types/ticketing';
import { formatNumber, formatDateShort } from '../../utils/formatters';

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
  sold?: number;
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

  // Combine timestamps into unified timeline
  const timelineMap = new Map<string, { timestamp: string; sold?: number; forecast?: number }>();

  // Add snapshots
  snapshots.forEach((s) => {
    // Round to day or keep exact key
    const dayKey = s.timestamp.substring(0, 10);
    const existing = timelineMap.get(dayKey) || { timestamp: s.timestamp };
    existing.sold = s.sold;
    timelineMap.set(dayKey, existing);
  });

  // Add forecasts
  forecasts.forEach((f) => {
    const dayKey = f.timestamp.substring(0, 10);
    const existing = timelineMap.get(dayKey) || { timestamp: f.timestamp };
    existing.forecast = f.predictedFinalSales;
    timelineMap.set(dayKey, existing);
  });

  // Sort chronologically
  const sortedDays = Array.from(timelineMap.entries()).sort(
    (a, b) => new Date(a[1].timestamp).getTime() - new Date(b[1].timestamp).getTime()
  );

  let prevFc: number | undefined;
  const points: MergedPoint[] = sortedDays.map(([_, val], idx) => {
    const eTime = new Date(eventDate).getTime();
    const pTime = new Date(val.timestamp).getTime();
    const daysBefore = Math.max(0, Math.ceil((eTime - pTime) / (1000 * 60 * 60 * 24)));
    
    let fDelta: number | undefined;
    if (val.forecast !== undefined) {
      if (prevFc !== undefined) {
        fDelta = val.forecast - prevFc;
      }
      prevFc = val.forecast;
    }

    return {
      index: idx,
      timestamp: val.timestamp,
      dateLabel: formatDateShort(val.timestamp),
      daysBefore,
      sold: val.sold,
      forecast: val.forecast,
      forecastDelta: fDelta
    };
  });

  if (points.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-xs text-zinc-400">
        Brak wystarczającej liczby snapshotów do wygenerowania wykresu.
      </div>
    );
  }

  // Determine chart dimensions & scale
  const width = 800;
  const height = 300;
  const padding = { top: 24, right: 36, bottom: 44, left: 60 };

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Max value calculation
  const allValues: number[] = [];
  points.forEach((p) => {
    if (p.sold !== undefined) allValues.push(p.sold);
    if (p.forecast !== undefined) allValues.push(p.forecast);
  });
  if (actualOutcome) allValues.push(actualOutcome);
  if (capacity && capacity < 50000) allValues.push(capacity * 1.05);

  const rawMax = Math.max(...allValues, 1000);
  // Round max up to neat round number
  const yMax = Math.ceil(rawMax / 5000) * 5000;
  const yMin = 0;

  const getX = (index: number) => {
    if (points.length === 1) return padding.left + plotWidth / 2;
    return padding.left + (index / (points.length - 1)) * plotWidth;
  };

  const getY = (val: number) => {
    const clamped = Math.max(yMin, Math.min(yMax, val));
    return padding.top + plotHeight - ((clamped - yMin) / (yMax - yMin)) * plotHeight;
  };

  // Build SVG path strings
  // Sold line (blue/indigo)
  const soldPoints = points.filter((p) => p.sold !== undefined);
  const soldPath = soldPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.index)} ${getY(p.sold!)}`)
    .join(' ');

  // Forecast line (emerald / cyan dashed)
  const forecastPoints = points.filter((p) => p.forecast !== undefined);
  const forecastPath = forecastPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.index)} ${getY(p.forecast!)}`)
    .join(' ');

  // Actual outcome horizontal line Y
  const actualY = actualOutcome ? getY(actualOutcome) : null;
  // Stadium capacity horizontal line Y
  const capacityY = capacity && capacity <= yMax ? getY(capacity) : null;

  // Y grid ticks
  const yTicks = [0, yMax * 0.25, yMax * 0.5, yMax * 0.75, yMax];

  return (
    <div className="relative w-full select-none">
      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 text-xs text-zinc-600 dark:text-zinc-400">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 bg-indigo-600 rounded" />
            <span className="font-medium text-zinc-900 dark:text-zinc-100">Sprzedaż rzeczywista</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 border-t-2 border-dashed border-emerald-600" />
            <span className="font-medium text-zinc-900 dark:text-zinc-100">Prognoza ML</span>
          </div>
          {actualOutcome !== undefined && (
            <div className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 border-t-2 border-dotted border-amber-600" />
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                Wynik rzeczywisty ({formatNumber(actualOutcome)})
              </span>
            </div>
          )}
          {capacity !== undefined && (
            <div className="flex items-center gap-1.5 text-zinc-400">
              <span className="h-px w-4 border-t border-zinc-300 dark:border-zinc-700" />
              <span>Pojemność ({formatNumber(capacity)})</span>
            </div>
          )}
        </div>
        <span className="text-[11px] text-zinc-400 hidden sm:inline">
          Najedź kursorem, aby sprawdzić snapshot
        </span>
      </div>

      {/* SVG Canvas */}
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[550px] overflow-visible"
          onMouseLeave={() => {
            setHoveredPoint(null);
            setCursorX(null);
          }}
        >
          <defs>
            <linearGradient id={`${chartId}-sold-grad`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.00" />
            </linearGradient>
            <linearGradient id={`${chartId}-fc-grad`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.00" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yTicks.map((tickVal, i) => {
            const y = getY(tickVal);
            return (
              <g key={`ytick-${i}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="currentColor"
                  strokeDasharray="2 3"
                  className="text-zinc-100 dark:text-zinc-800"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-zinc-400 text-[10px] tabular-nums"
                >
                  {formatNumber(tickVal)}
                </text>
              </g>
            );
          })}

          {/* Capacity reference line */}
          {capacityY !== null && (
            <g>
              <line
                x1={padding.left}
                y1={capacityY}
                x2={width - padding.right}
                y2={capacityY}
                stroke="#a1a1aa"
                strokeWidth="1"
                strokeDasharray="4 4"
                strokeOpacity="0.6"
              />
              <text
                x={width - padding.right - 4}
                y={capacityY - 4}
                textAnchor="end"
                className="fill-zinc-400 text-[9px] font-medium"
              >
                Max pojemność: {formatNumber(capacity)}
              </text>
            </g>
          )}

          {/* Actual outcome reference line (if completed) */}
          {actualY !== null && (
            <g>
              <line
                x1={padding.left}
                y1={actualY}
                x2={width - padding.right}
                y2={actualY}
                stroke="#d97706"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
              <text
                x={padding.left + 8}
                y={actualY - 6}
                className="fill-amber-700 dark:fill-amber-400 text-[10px] font-medium"
              >
                Actual: {formatNumber(actualOutcome)}
              </text>
            </g>
          )}

          {/* Sold area fill */}
          {soldPoints.length > 1 && (
            <path
              d={`${soldPath} L ${getX(soldPoints[soldPoints.length - 1].index)} ${getY(0)} L ${getX(
                soldPoints[0].index
              )} ${getY(0)} Z`}
              fill={`url(#${chartId}-sold-grad)`}
            />
          )}

          {/* Forecast line */}
          {forecastPath && (
            <path
              d={forecastPath}
              fill="none"
              stroke="#10b981"
              strokeWidth="2.25"
              strokeDasharray="5 3"
              strokeLinecap="round"
            />
          )}

          {/* Sold line */}
          {soldPath && (
            <path
              d={soldPath}
              fill="none"
              stroke="#4f46e5"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          )}

          {/* Data points markers */}
          {forecastPoints.map((p) => {
            const x = getX(p.index);
            const y = getY(p.forecast!);
            const isHovered = hoveredPoint?.index === p.index;
            return (
              <circle
                key={`fc-dot-${p.index}`}
                cx={x}
                cy={y}
                r={isHovered ? 5 : 3.5}
                className="fill-emerald-500 stroke-white dark:stroke-zinc-900 transition-all"
                strokeWidth="2"
              />
            );
          })}

          {soldPoints.map((p) => {
            const x = getX(p.index);
            const y = getY(p.sold!);
            const isHovered = hoveredPoint?.index === p.index;
            return (
              <circle
                key={`sold-dot-${p.index}`}
                cx={x}
                cy={y}
                r={isHovered ? 5.5 : 4}
                className="fill-indigo-600 stroke-white dark:stroke-zinc-900 transition-all"
                strokeWidth="2"
              />
            );
          })}

          {/* X axis labels (days before / date) */}
          {points.map((p) => {
            const x = getX(p.index);
            return (
              <g key={`x-tick-${p.index}`}>
                <line
                  x1={x}
                  y1={height - padding.bottom}
                  x2={x}
                  y2={height - padding.bottom + 4}
                  stroke="currentColor"
                  className="text-zinc-300 dark:text-zinc-700"
                />
                <text
                  x={x}
                  y={height - padding.bottom + 15}
                  textAnchor="middle"
                  className="fill-zinc-600 dark:fill-zinc-300 text-[10px] font-medium"
                >
                  {p.daysBefore === 0 ? 'Dzień meczu' : `-${p.daysBefore} d`}
                </text>
                <text
                  x={x}
                  y={height - padding.bottom + 26}
                  textAnchor="middle"
                  className="fill-zinc-400 dark:fill-zinc-500 text-[9px]"
                >
                  {p.dateLabel.split(',')[0]}
                </text>
              </g>
            );
          })}

          {/* Hover Crosshair Line */}
          {cursorX !== null && (
            <line
              x1={cursorX}
              y1={padding.top}
              x2={cursorX}
              y2={height - padding.bottom}
              stroke="#6366f1"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
          )}

          {/* Invisible interactive zones for scrubbing */}
          {points.map((p) => {
            const x = getX(p.index);
            const zoneWidth = plotWidth / points.length;
            return (
              <rect
                key={`zone-${p.index}`}
                x={x - zoneWidth / 2}
                y={padding.top}
                width={zoneWidth}
                height={plotHeight}
                fill="transparent"
                className="cursor-crosshair"
                onMouseEnter={() => {
                  setHoveredPoint(p);
                  setCursorX(x);
                }}
              />
            );
          })}
        </svg>
      </div>

      {/* Interactive Tooltip Card */}
      {hoveredPoint && cursorX !== null && (
        <div
          className="pointer-events-none absolute z-20 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 px-3 py-2 text-xs shadow-lg backdrop-blur-sm transition-all"
          style={{
            left: `${Math.min(Math.max(cursorX, 100), width - 150)}px`,
            top: '35px',
            transform: 'translateX(-50%)'
          }}
        >
          <div className="border-b border-zinc-100 dark:border-zinc-800 pb-1 mb-1.5 flex items-center justify-between gap-3">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {hoveredPoint.daysBefore === 0 ? 'Dzień eventu' : `${hoveredPoint.daysBefore} dni do meczu`}
            </span>
            <span className="text-[10px] text-zinc-400">{hoveredPoint.dateLabel}</span>
          </div>

          <div className="space-y-1">
            {hoveredPoint.sold !== undefined && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-zinc-500 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                  Sprzedane:
                </span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100 tabular-nums">
                  {formatNumber(hoveredPoint.sold)}
                </span>
              </div>
            )}

            {hoveredPoint.forecast !== undefined && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-zinc-500 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Prognoza ML:
                </span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {formatNumber(hoveredPoint.forecast)}
                </span>
              </div>
            )}

            {hoveredPoint.forecastDelta !== undefined && (
              <div className="flex items-center justify-between gap-4 text-[11px] pt-0.5 border-t border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-400">Zmiana prognozy:</span>
                <span
                  className={`tabular-nums font-medium ${
                    hoveredPoint.forecastDelta > 0
                      ? 'text-emerald-600'
                      : hoveredPoint.forecastDelta < 0
                      ? 'text-rose-600'
                      : 'text-zinc-500'
                  }`}
                >
                  {hoveredPoint.forecastDelta > 0 ? '+' : ''}
                  {formatNumber(hoveredPoint.forecastDelta)}
                </span>
              </div>
            )}

            {actualOutcome !== undefined && (
              <div className="flex items-center justify-between gap-4 text-[11px] pt-0.5">
                <span className="text-amber-600 dark:text-amber-400">Wynik actual:</span>
                <span className="tabular-nums font-semibold text-zinc-900 dark:text-zinc-100">
                  {formatNumber(actualOutcome)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
