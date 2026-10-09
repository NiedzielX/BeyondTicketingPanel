import React, { useState } from 'react';
import { HorizonMetric } from '../../types/ticketing';
import { formatNumber, formatPercent } from '../../utils/formatters';

interface HorizonPerformanceChartProps {
  metrics: HorizonMetric[];
}

export const HorizonPerformanceChart: React.FC<HorizonPerformanceChartProps> = ({ metrics }) => {
  const [hoveredBucket, setHoveredBucket] = useState<HorizonMetric | null>(null);

  const populatedMape = metrics.filter((m) => m.forecastsCount > 0).map((m) => m.mape);
  const maxMape = Math.max(...populatedMape, 15);
  const chartHeight = 220;
  const chartWidth = 720;
  const padding = { top: 20, right: 30, bottom: 44, left: 50 };

  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;
  const barWidth = 42;

  const yTicks = Array.from(new Set([0, 5, 10, 15, Math.ceil(maxMape / 5) * 5])).sort((a, b) => a - b);

  const getY = (val: number) => {
    const topLimit = Math.max(15, Math.ceil(maxMape / 5) * 5);
    return padding.top + plotHeight - (val / topLimit) * plotHeight;
  };

  return (
    <div className="relative w-full select-none">
      <div className="flex items-center justify-between pb-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-indigo-600 rounded-sm" />
            <span className="font-medium text-zinc-900 dark:text-zinc-100">MAPE (%) błąd względny</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-500">
            <span className="w-2.5 h-0.5 bg-emerald-500" />
            <span>Próg referencyjny 5%</span>
          </div>
        </div>
        <span className="text-[11px] text-zinc-400">
          Porównanie canonical horizons — bez założenia o kierunku poprawy
        </span>
      </div>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto min-w-[500px]"
          onMouseLeave={() => setHoveredBucket(null)}
        >
          {yTicks.map((tick) => {
            const y = getY(tick);
            return (
              <g key={`y-${tick}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={chartWidth - padding.right}
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
                  {tick}%
                </text>
              </g>
            );
          })}

          <line
            x1={padding.left}
            y1={getY(5)}
            x2={chartWidth - padding.right}
            y2={getY(5)}
            stroke="#10b981"
            strokeWidth="1.25"
            strokeDasharray="4 3"
          />
          <text
            x={chartWidth - padding.right - 4}
            y={getY(5) - 4}
            textAnchor="end"
            className="fill-emerald-600 dark:fill-emerald-400 text-[9px] font-medium"
          >
            5%
          </text>

          {metrics.map((m, idx) => {
            const step = plotWidth / metrics.length;
            const xCenter = padding.left + step * idx + step / 2;
            const x = xCenter - barWidth / 2;
            const hasData = m.forecastsCount > 0;
            const barHeight = hasData
              ? Math.max(4, (m.mape / Math.max(15, Math.ceil(maxMape / 5) * 5)) * plotHeight)
              : 0;
            const y = padding.top + plotHeight - barHeight;
            const isHovered = hoveredBucket?.horizon === m.horizon;

            return (
              <g
                key={`bar-${m.horizon}`}
                className={hasData ? 'cursor-pointer transition-opacity' : undefined}
                onMouseEnter={() => hasData && setHoveredBucket(m)}
              >
                {hasData ? (
                  <>
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      rx="3"
                      className={`transition-colors ${
                        isHovered
                          ? 'fill-indigo-500'
                          : m.mape <= 5
                          ? 'fill-indigo-600'
                          : 'fill-indigo-400'
                      }`}
                    />
                    <text
                      x={xCenter}
                      y={y - 6}
                      textAnchor="middle"
                      className="fill-zinc-700 dark:fill-zinc-200 text-[11px] font-medium tabular-nums"
                    >
                      {formatPercent(m.mape)}
                    </text>
                  </>
                ) : (
                  <text
                    x={xCenter}
                    y={padding.top + plotHeight - 8}
                    textAnchor="middle"
                    className="fill-zinc-400 text-[11px]"
                  >
                    —
                  </text>
                )}

                <text
                  x={xCenter}
                  y={chartHeight - padding.bottom + 16}
                  textAnchor="middle"
                  className={`text-[11px] font-medium transition-colors ${
                    isHovered
                      ? 'fill-indigo-600 dark:fill-indigo-400 font-semibold'
                      : 'fill-zinc-600 dark:fill-zinc-300'
                  }`}
                >
                  {m.horizon}
                </text>

                <text
                  x={xCenter}
                  y={chartHeight - padding.bottom + 30}
                  textAnchor="middle"
                  className="fill-zinc-400 text-[9px]"
                >
                  {m.forecastsCount} {m.forecastsCount === 1 ? 'mecz' : 'mecze'}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {hoveredBucket && hoveredBucket.forecastsCount > 0 && (
        <div className="mt-2 flex items-center justify-between rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-600 dark:text-zinc-300">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              Horyzont: {hoveredBucket.horizon}
            </span>
            <span>·</span>
            <span>Mecze: {hoveredBucket.forecastsCount}</span>
          </div>
          <div className="flex items-center gap-4 tabular-nums">
            <span>
              MAPE: <strong className="text-indigo-600">{formatPercent(hoveredBucket.mape)}</strong>
            </span>
            <span>
              MAE: <strong className="text-zinc-900 dark:text-zinc-100">{formatNumber(hoveredBucket.mae)} osób</strong>
            </span>
            <span>
              Bias: <strong className={hoveredBucket.bias >= 0 ? 'text-zinc-700 dark:text-zinc-300' : 'text-amber-600'}>
                {hoveredBucket.bias > 0 ? '+' : ''}{formatNumber(hoveredBucket.bias)}
              </strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
