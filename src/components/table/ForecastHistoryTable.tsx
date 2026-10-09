import React from 'react';
import { ForecastHistoryItem } from '../../types/ticketing';
import {
  formatDateNumeric,
  formatDateShort,
  formatDaysRemaining,
  formatDelta,
  formatNumber,
  formatPercent,
  formatSignedError
} from '../../utils/formatters';

interface ForecastHistoryTableProps {
  items: ForecastHistoryItem[];
  hasOutcome: boolean;
}

export const ForecastHistoryTable: React.FC<ForecastHistoryTableProps> = ({ items, hasOutcome }) => {
  if (items.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-zinc-400">
        Brak zarejestrowanej historii prognoz dla tego wydarzenia.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/75 dark:bg-zinc-900/50 text-zinc-500 font-medium">
            <th className="py-3 px-4">Data</th>
            <th className="py-3 px-3">Do eventu</th>
            <th className="py-3 px-3 text-right">Sprzedane</th>
            <th className="py-3 px-3 text-right">Prognoza</th>
            <th className="py-3 px-3 text-right">Zmiana prognozy</th>
            {hasOutcome && (
              <>
                <th className="py-3 px-3 text-right">Wynik rzeczywisty</th>
                <th className="py-3 px-3 text-right">Błąd</th>
                <th className="py-3 px-3 text-right">Błąd %</th>
              </>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
          {items.map((item) => {
            const hasDelta = item.forecastDelta !== undefined && item.forecastDelta !== null;
            const isPosDelta = hasDelta && item.forecastDelta! > 0;
            const isNegDelta = hasDelta && item.forecastDelta! < 0;

            const isSignedPos = item.signedError !== undefined && item.signedError > 0;
            const isSignedNeg = item.signedError !== undefined && item.signedError < 0;

            return (
              <tr key={item.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                {/* Date */}
                <td className="py-3 px-4 font-medium text-zinc-900 dark:text-zinc-100 tabular-nums">
                  <span className="hidden sm:inline">{formatDateShort(item.timestamp)}</span>
                  <span className="sm:hidden">{formatDateNumeric(item.timestamp)}</span>
                </td>

                {/* Days to event */}
                <td className="py-3 px-3 text-zinc-600 dark:text-zinc-300 tabular-nums">
                  {formatDaysRemaining(item.daysToEvent)}
                </td>

                {/* Sold */}
                <td className="py-3 px-3 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                  {formatNumber(item.sold)}
                </td>

                {/* Forecast */}
                <td className="py-3 px-3 text-right tabular-nums font-semibold text-zinc-900 dark:text-zinc-100">
                  {formatNumber(item.forecast)}
                </td>

                {/* Forecast Delta */}
                <td className="py-3 px-3 text-right tabular-nums font-medium">
                  {hasDelta ? (
                    <span
                      className={
                        isPosDelta
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : isNegDelta
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-zinc-500'
                      }
                    >
                      {formatDelta(item.forecastDelta)}
                    </span>
                  ) : (
                    <span className="text-zinc-400">—</span>
                  )}
                </td>

                {/* Outcome columns */}
                {hasOutcome && (
                  <>
                    <td className="py-3 px-3 text-right tabular-nums font-medium text-zinc-900 dark:text-zinc-100">
                      {formatNumber(item.actualOutcome)}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums font-medium">
                      {item.signedError !== undefined ? (
                        <span
                          className={
                            isSignedPos
                              ? 'text-amber-600 dark:text-amber-400'
                              : isSignedNeg
                              ? 'text-sky-600 dark:text-sky-400'
                              : 'text-zinc-500'
                          }
                        >
                          {formatSignedError(item.signedError)}
                        </span>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums font-semibold">
                      {item.percentageError !== undefined ? (
                        <span
                          className={
                            item.percentageError <= 3
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : item.percentageError <= 7
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }
                        >
                          {formatPercent(item.percentageError)}
                        </span>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
