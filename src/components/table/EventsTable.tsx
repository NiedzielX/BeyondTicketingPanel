import React from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight } from 'lucide-react';
import { EnrichedEvent } from '../../types/ticketing';
import {
  formatDateShort,
  formatDaysRemaining,
  formatNumber,
  formatPercent,
  formatRelativeUpdate
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
      return sortOrder === 'asc' ? (
        <ArrowUp className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100" />
      ) : (
        <ArrowDown className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100" />
      );
    }
    return <ArrowUpDown className="w-3 h-3 text-zinc-400 opacity-60 group-hover:opacity-100" />;
  };

  if (events.length === 0) {
    return (
      <div className="py-12 text-center text-xs text-zinc-500">
        Brak meczów spełniających wybrane kryteria filtrowania.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/75 dark:bg-zinc-900/50 text-zinc-500 font-medium">
            {/* Mecz */}
            <th
              className="py-3 px-4 cursor-pointer select-none group"
              onClick={() => onSort?.('name')}
            >
              <div className="flex items-center gap-1">
                <span>Mecz</span>
                {renderSortIcon('name')}
              </div>
            </th>

            {/* Data */}
            <th
              className="py-3 px-3 cursor-pointer select-none group"
              onClick={() => onSort?.('date')}
            >
              <div className="flex items-center gap-1">
                <span>Data</span>
                {renderSortIcon('date')}
              </div>
            </th>

            {/* Sprzedane */}
            <th
              className="py-3 px-3 text-right cursor-pointer select-none group"
              onClick={() => onSort?.('sold')}
            >
              <div className="flex items-center justify-end gap-1">
                <span>Sprzedane</span>
                {renderSortIcon('sold')}
              </div>
            </th>

            {/* Obecne wypełnienie */}
            <th
              className="py-3 px-3 text-right cursor-pointer select-none group"
              onClick={() => onSort?.('utilization')}
            >
              <div className="flex items-center justify-end gap-1">
                <span>Obecne wypełnienie</span>
                {renderSortIcon('utilization')}
              </div>
            </th>

            {/* Prognoza */}
            <th
              className="py-3 px-3 text-right cursor-pointer select-none group"
              onClick={() => onSort?.('forecast')}
            >
              <div className="flex items-center justify-end gap-1">
                <span>Prognoza</span>
                {renderSortIcon('forecast')}
              </div>
            </th>

            {/* Prognozowane wypełnienie */}
            <th className="py-3 px-3 text-right">Prognozowane wypełnienie</th>

            {/* Pozostało do pojemności */}
            <th
              className="py-3 px-3 text-right cursor-pointer select-none group"
              onClick={() => onSort?.('remaining')}
            >
              <div className="flex items-center justify-end gap-1">
                <span>Pozostało do pojemności</span>
                {renderSortIcon('remaining')}
              </div>
            </th>

            {/* Trend */}
            <th className="py-3 px-3">Trend</th>

            {/* Status */}
            <th className="py-3 px-3">Status</th>

            {/* Outcome columns if viewing completed matches */}
            {showOutcomeColumns && (
              <>
                <th className="py-3 px-3 text-right">Wynik actual</th>
                <th className="py-3 px-3 text-right">Trafność</th>
              </>
            )}

            <th className="py-3 px-2 w-8"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
          {events.map((ev) => {
            return (
              <tr
                key={ev.id}
                onClick={() => onSelectEvent(ev.id)}
                className="group hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 cursor-pointer transition-colors duration-100"
              >
                {/* Mecz */}
                <td className="py-3.5 px-4 font-medium text-zinc-900 dark:text-zinc-100">
                  <div className="flex flex-col">
                    <span className="group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors font-semibold">
                      {ev.name}
                    </span>
                    <span className="text-[11px] text-zinc-400 font-normal">
                      {ev.competition} · Stadion {ev.club}
                    </span>
                  </div>
                </td>

                {/* Data */}
                <td className="py-3.5 px-3 tabular-nums text-zinc-600 dark:text-zinc-300 whitespace-nowrap">
                  <div>{formatDateShort(ev.eventDate)}</div>
                  <span className="text-[10px] text-zinc-400 font-normal">
                    {formatDaysRemaining(ev.daysToEvent)}
                  </span>
                </td>

                {/* Sprzedane */}
                <td className="py-3.5 px-3 text-right tabular-nums font-semibold text-zinc-900 dark:text-zinc-100">
                  {formatNumber(ev.currentSold)}
                </td>

                {/* Obecne wypełnienie */}
                <td className="py-3.5 px-3 text-right tabular-nums text-zinc-700 dark:text-zinc-300 font-medium">
                  {formatPercent(ev.currentUtilization)}
                </td>

                {/* Prognoza */}
                <td className="py-3.5 px-3 text-right tabular-nums font-bold text-indigo-700 dark:text-indigo-400">
                  {ev.currentForecast !== undefined ? (
                    formatNumber(ev.currentForecast)
                  ) : (
                    <span className="text-zinc-400 font-normal">Brak</span>
                  )}
                </td>

                {/* Prognozowane wypełnienie */}
                <td className="py-3.5 px-3 text-right tabular-nums">
                  {ev.utilizationRate !== undefined ? (
                    <span
                      className={`font-semibold ${
                        ev.utilizationRate >= 85
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : ev.utilizationRate < 60
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-zinc-800 dark:text-zinc-200'
                      }`}
                    >
                      {formatPercent(ev.utilizationRate)}
                    </span>
                  ) : (
                    <span className="text-zinc-400">—</span>
                  )}
                </td>

                {/* Pozostało do pojemności */}
                <td className="py-3.5 px-3 text-right tabular-nums text-zinc-600 dark:text-zinc-400">
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">
                    {formatNumber(ev.remainingCapacity)}
                  </span>
                  <span className="block text-[10px] text-zinc-400">
                    z {formatNumber(ev.capacity)}
                  </span>
                </td>

                {/* Trend */}
                <td className="py-3.5 px-3 whitespace-nowrap">
                  <TrendIndicator trend={ev.trend} />
                </td>

                {/* Status */}
                <td className="py-3.5 px-3 whitespace-nowrap">
                  <CommercialStatusBadge status={ev.commercialStatus} />
                </td>

                {/* Completed columns */}
                {showOutcomeColumns && (
                  <>
                    <td className="py-3.5 px-3 text-right tabular-nums font-medium text-zinc-900 dark:text-zinc-100">
                      {ev.outcome ? formatNumber(ev.outcome.actualFinalSales) : '—'}
                    </td>
                    <td className="py-3.5 px-3 text-right tabular-nums font-medium">
                      {ev.finalPercentageError !== undefined ? (
                        <span
                          className={
                            ev.finalPercentageError <= 3
                              ? 'text-emerald-600'
                              : ev.finalPercentageError <= 7
                              ? 'text-amber-600'
                              : 'text-rose-600'
                          }
                        >
                          błąd {ev.finalPercentageError.toFixed(1).replace('.', ',')}%
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </>
                )}

                {/* Chevron */}
                <td className="py-3.5 px-2 text-right text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200">
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
