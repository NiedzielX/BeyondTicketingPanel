import React from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight } from 'lucide-react';
import { EnrichedEvent } from '../../types/ticketing';
import {
  formatDateShort,
  formatDaysRemaining,
  formatNumber,
  formatPercent
} from '../../utils/formatters';
import { CommercialStatusBadge, TrendIndicator } from '../common/StatusBadge';

interface EventsTableProps {
  events: EnrichedEvent[];
  onSelectEvent: (eventId: string) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (field: 'date' | 'daysToEvent' | 'sold' | 'forecast' | 'name' | 'change' | 'utilization' | 'remaining') => void;
  showOutcomeColumns?: boolean;
}

export const EventsTable: React.FC<EventsTableProps> = ({
  events,
  onSelectEvent,
  sortBy = 'date',
  sortOrder = 'asc',
  onSort,
  showOutcomeColumns = false
}) => {
  const renderSortIcon = (field: string) => {
    if (!onSort) return null;
    if (sortBy === field) {
      return sortOrder === 'asc'
        ? <ArrowUp className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100" />
        : <ArrowDown className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100" />;
    }
    return <ArrowUpDown className="w-3 h-3 text-zinc-400 opacity-60 group-hover:opacity-100" />;
  };

  if (events.length === 0) {
    return <div className="py-12 text-center text-xs text-zinc-500">Brak meczów spełniających wybrane kryteria filtrowania.</div>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/75 dark:bg-zinc-900/50 text-zinc-500 font-medium">
            <th className="py-3 px-4 cursor-pointer select-none group" onClick={() => onSort?.('name')}>
              <div className="flex items-center gap-1"><span>Mecz</span>{renderSortIcon('name')}</div>
            </th>
            <th className="py-3 px-3 cursor-pointer select-none group" onClick={() => onSort?.('date')}>
              <div className="flex items-center gap-1"><span>Kiedy</span>{renderSortIcon('date')}</div>
            </th>
            <th className="py-3 px-3 text-right cursor-pointer select-none group" onClick={() => onSort?.('remaining')}>
              <div className="flex items-center justify-end gap-1"><span>Widoczne wolne miejsca</span>{renderSortIcon('remaining')}</div>
            </th>
            <th className="py-3 px-3 text-right cursor-pointer select-none group" onClick={() => onSort?.('utilization')}>
              <div className="flex items-center justify-end gap-1"><span>Szacowane zajęcie teraz</span>{renderSortIcon('utilization')}</div>
            </th>
            <th className="py-3 px-3 text-right cursor-pointer select-none group" onClick={() => onSort?.('forecast')}>
              <div className="flex items-center justify-end gap-1"><span>Przewidywana frekwencja</span>{renderSortIcon('forecast')}</div>
            </th>
            <th className="py-3 px-3">Co się dzieje?</th>
            <th className="py-3 px-3">Ocena</th>
            {showOutcomeColumns && (
              <>
                <th className="py-3 px-3 text-right">Rzeczywista frekwencja</th>
                <th className="py-3 px-3 text-right">Błąd prognozy</th>
              </>
            )}
            <th className="py-3 px-2 w-8"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
          {events.map((ev) => (
            <tr key={ev.id} onClick={() => onSelectEvent(ev.id)} className="group hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 cursor-pointer transition-colors duration-100">
              <td className="py-3.5 px-4 font-medium text-zinc-900 dark:text-zinc-100">
                <div className="flex flex-col">
                  <span className="group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors font-semibold">{ev.name}</span>
                  <span className="text-[11px] text-zinc-400 font-normal">{ev.competition} · {ev.club}</span>
                </div>
              </td>
              <td className="py-3.5 px-3 tabular-nums text-zinc-600 dark:text-zinc-300 whitespace-nowrap">
                <div>{formatDateShort(ev.eventDate)}</div>
                <span className="text-[10px] text-zinc-400 font-normal">{formatDaysRemaining(ev.daysToEvent)}</span>
              </td>
              <td className="py-3.5 px-3 text-right tabular-nums text-zinc-700 dark:text-zinc-300" title="Liczba miejsc widocznych jako dostępne w publicznym systemie biletowym. Nie jest to liczba niesprzedanych biletów.">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{formatNumber(ev.inventoryAvailable ?? ev.remainingCapacity)}</span>
                <span className="block text-[10px] text-zinc-400">widoczne publicznie</span>
              </td>
              <td className="py-3.5 px-3 text-right tabular-nums text-zinc-700 dark:text-zinc-300 font-medium" title="Szacunek na podstawie pojemności referencyjnej i widocznych wolnych miejsc. To nie jest potwierdzona sprzedaż.">
                {formatPercent(ev.currentUtilization)}
                <span className="block text-[10px] text-zinc-400">szacunek</span>
              </td>
              <td className="py-3.5 px-3 text-right tabular-nums">
                {ev.currentForecast !== undefined ? (
                  <>
                    <span className="font-bold text-indigo-700 dark:text-indigo-400">{formatNumber(ev.currentForecast)}</span>
                    <span className="block text-[10px] text-zinc-400">{ev.utilizationRate !== undefined ? `${formatPercent(ev.utilizationRate)} stadionu` : 'obecna prognoza'}</span>
                  </>
                ) : <span className="text-zinc-400 font-normal">Jeszcze brak</span>}
              </td>
              <td className="py-3.5 px-3 whitespace-nowrap"><TrendIndicator trend={ev.trend} /></td>
              <td className="py-3.5 px-3 whitespace-nowrap"><CommercialStatusBadge status={ev.commercialStatus} /></td>
              {showOutcomeColumns && (
                <>
                  <td className="py-3.5 px-3 text-right tabular-nums font-medium text-zinc-900 dark:text-zinc-100">{ev.outcome ? formatNumber(ev.outcome.actualFinalSales) : '—'}</td>
                  <td className="py-3.5 px-3 text-right tabular-nums font-medium">
                    {ev.finalPercentageError !== undefined ? (
                      <span className={ev.finalPercentageError <= 3 ? 'text-emerald-600' : ev.finalPercentageError <= 7 ? 'text-amber-600' : 'text-rose-600'}>
                        {ev.finalPercentageError.toFixed(1).replace('.', ',')}%
                      </span>
                    ) : '—'}
                  </td>
                </>
              )}
              <td className="py-3.5 px-2 text-right text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200"><ChevronRight className="w-4 h-4 ml-auto" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
