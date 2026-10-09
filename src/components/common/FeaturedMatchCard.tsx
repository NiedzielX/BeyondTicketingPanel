import React from 'react';
import { ArrowRight } from 'lucide-react';
import { EnrichedEvent, Forecast, Snapshot } from '../../types/ticketing';
import {
  formatDateDayOnly,
  formatDaysRemaining,
  formatNumber,
  formatPercent
} from '../../utils/formatters';
import { CommercialStatusBadge, TrendIndicator } from './StatusBadge';

interface FeaturedMatchCardProps {
  event: EnrichedEvent;
  snapshots: Snapshot[];
  forecasts: Forecast[];
  onSelectEvent: (eventId: string) => void;
}

export const FeaturedMatchCard: React.FC<FeaturedMatchCardProps> = ({
  event,
  snapshots,
  forecasts,
  onSelectEvent
}) => {
  const sortedSnaps = [...snapshots].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const svgWidth = 280;
  const svgHeight = 72;
  const pad = { top: 12, right: 12, bottom: 18, left: 12 };
  const pWidth = svgWidth - pad.left - pad.right;
  const pHeight = svgHeight - pad.top - pad.bottom;

  const maxVal = Math.max(
    event.capacity * 0.9,
    ...(event.currentForecast ? [event.currentForecast] : []),
    ...sortedSnaps.map((snapshot) => snapshot.sold),
    1000
  );

  const getY = (value: number) => pad.top + pHeight - (Math.min(value, maxVal) / maxVal) * pHeight;
  const getSnapX = (index: number) => {
    if (sortedSnaps.length <= 1) return pad.left + pWidth / 2;
    return pad.left + (index / Math.max(1, sortedSnaps.length - 1)) * (pWidth * 0.7);
  };

  const proxyPath = sortedSnaps
    .map((snapshot, index) => `${index === 0 ? 'M' : 'L'} ${getSnapX(index)} ${getY(snapshot.sold)}`)
    .join(' ');

  const lastSnap = sortedSnaps[sortedSnaps.length - 1];
  const lastSnapX = getSnapX(sortedSnaps.length - 1);
  const lastSnapY = lastSnap ? getY(lastSnap.sold) : pad.top + pHeight;
  const forecastX = pad.left + pWidth;
  const forecastY = event.currentForecast ? getY(event.currentForecast) : lastSnapY;
  const forecastPath = `M ${lastSnapX} ${lastSnapY} L ${forecastX} ${forecastY}`;

  return (
    <div className="relative overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/60 dark:bg-zinc-900/60 px-5 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
          <span className="text-[11px] font-bold tracking-wider text-indigo-700 dark:text-indigo-400 uppercase">Najbliższy mecz</span>
          <span className="text-zinc-300 dark:text-zinc-700">·</span>
          <span className="text-xs text-zinc-500 font-medium">{formatDateDayOnly(event.eventDate)} ({formatDaysRemaining(event.daysToEvent)})</span>
        </div>
        <div className="flex items-center gap-2">
          <CommercialStatusBadge status={event.commercialStatus} size="sm" />
          <TrendIndicator trend={event.trend} />
        </div>
      </div>

      <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-5 space-y-3">
          <div>
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block">{event.competition} · Stadion {event.club}</span>
            <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mt-0.5">{event.name}</h3>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Beyond prognozuje końcową frekwencję na poziomie{' '}
            <strong className="text-zinc-900 dark:text-zinc-100 font-semibold tabular-nums">{event.currentForecast ? formatNumber(event.currentForecast) : '—'} osób</strong>{' '}
            ({event.utilizationRate ? formatPercent(event.utilizationRate) : '—'} pojemności). Publicznie dostępne inventory:{' '}
            <strong className="text-zinc-900 dark:text-zinc-100 font-semibold tabular-nums">{formatNumber(event.inventoryAvailable ?? event.remainingCapacity)}</strong>.
          </p>
          <button onClick={() => onSelectEvent(event.id)} className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors cursor-pointer shadow-xs">
            <span>Przejdź do pełnej analizy meczu</span><ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="lg:col-span-4 grid grid-cols-2 gap-3 border-y lg:border-y-0 lg:border-x border-zinc-100 dark:border-zinc-800 py-4 lg:py-0 lg:px-4">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-zinc-400 block">Sygnał popytu (proxy)</span>
            <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">{formatNumber(event.currentSold)}</div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-500"><span className="font-semibold text-zinc-800 dark:text-zinc-200">{formatPercent(event.currentUtilization)}</span><span>zajętości proxy</span></div>
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 font-semibold block">Prognoza frekwencji P50</span>
            <div className="text-xl font-bold text-indigo-700 dark:text-indigo-400 tabular-nums">{event.currentForecast ? formatNumber(event.currentForecast) : '—'}</div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium"><span>Fill-rate:</span><strong>{event.utilizationRate ? formatPercent(event.utilizationRate) : '—'}</strong></div>
          </div>
          <div className="space-y-1 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
            <span className="text-[11px] font-medium text-zinc-400 block">Pojemność referencyjna</span>
            <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 tabular-nums">{formatNumber(event.capacity)} miejsc</div>
          </div>
          <div className="space-y-1 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
            <span className="text-[11px] font-medium text-zinc-400 block">Publicznie dostępne</span>
            <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 tabular-nums">{formatNumber(event.inventoryAvailable ?? event.remainingCapacity)}</div>
            <span className="text-[10px] text-zinc-400">inventory, nie potwierdzona sprzedaż</span>
          </div>
        </div>

        <div className="lg:col-span-3 flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between text-[11px] text-zinc-500">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">Trajektoria proxy i forecast</span>
            <span className="text-[10px] text-zinc-400">-{event.daysToEvent} d</span>
          </div>
          <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 p-2">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-16 overflow-visible">
              <line x1={pad.left} y1={svgHeight - pad.bottom} x2={svgWidth - pad.right} y2={svgHeight - pad.bottom} stroke="#e2e8f0" strokeWidth="1" />
              {proxyPath && <path d={proxyPath} fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" />}
              <path d={forecastPath} fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="4 3" strokeLinecap="round" />
              {sortedSnaps.map((snapshot, index) => <circle key={`snap-${index}`} cx={getSnapX(index)} cy={getY(snapshot.sold)} r="3" className="fill-indigo-600 stroke-white" strokeWidth="1.5" />)}
              <circle cx={forecastX} cy={forecastY} r="4" className="fill-emerald-500 stroke-white" strokeWidth="1.5" />
              <text x={pad.left} y={svgHeight - 4} className="fill-zinc-400 text-[9px]">Start</text>
              <text x={lastSnapX} y={svgHeight - 4} textAnchor="middle" className="fill-indigo-600 font-semibold text-[9px]">Dziś</text>
              <text x={forecastX} y={svgHeight - 4} textAnchor="end" className="fill-emerald-600 font-semibold text-[9px]">Mecz</text>
            </svg>
          </div>
          <div className="flex items-center justify-between text-[10px] text-zinc-400">
            <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-indigo-600" />Inventory proxy</span>
            <span className="flex items-center gap-1"><span className="w-2 h-0.5 border-t border-dashed border-emerald-500" />Prognoza P50</span>
          </div>
        </div>
      </div>
    </div>
  );
};
