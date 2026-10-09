import React, { useEffect, useState } from 'react';
import { EnrichedEvent } from '../types/ticketing';
import { eventsService, isAllClubs } from '../services/eventsService';
import { MetricCard } from '../components/common/MetricCard';
import { CommercialStatusBadge } from '../components/common/StatusBadge';
import { formatNumber, formatPercent, formatDaysRemaining } from '../utils/formatters';

interface SalesAnalyticsPageProps {
  onSelectEvent: (eventId: string) => void;
  selectedClubFilter?: string;
}

export const SalesAnalyticsPage: React.FC<SalesAnalyticsPageProps> = ({
  onSelectEvent,
  selectedClubFilter
}) => {
  const [events, setEvents] = useState<EnrichedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const activeClub = isAllClubs(selectedClubFilter) ? undefined : selectedClubFilter;
        setEvents(await eventsService.getEvents({ status: 'active', club: activeClub }));
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [selectedClubFilter]);

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-flex h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        <p className="mt-3 text-xs text-zinc-500">Przeliczanie analizy popytu...</p>
      </div>
    );
  }

  const totalDemandProxy = events.reduce((sum, event) => sum + event.currentSold, 0);
  const totalPredictedAttendance = events.reduce((sum, event) => sum + (event.currentForecast ?? 0), 0);
  const totalPublicAvailable = events.reduce((sum, event) => sum + (event.inventoryAvailable ?? 0), 0);
  const acceleratingCount = events.filter((event) => event.trend === 'Przyspiesza').length;
  const slowingCount = events.filter((event) => event.trend === 'Zwalnia').length;

  return (
    <div className="space-y-6">
      <div className="border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Analiza popytu i inventory</h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Publiczne inventory jako proxy popytu + prognoza końcowej frekwencji Beyond. Proxy nie jest potwierdzoną sprzedażą.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="Sygnał popytu łącznie (proxy)"
          value={formatNumber(totalDemandProxy)}
          subtext={`Na ${events.length} aktywnych meczach`}
          tooltip="Pojemność referencyjna minus publicznie dostępne inventory. To proxy popytu, nie liczba sprzedanych biletów."
        />
        <MetricCard
          label="Prognozowana frekwencja łącznie"
          value={formatNumber(totalPredictedAttendance)}
          subtext="Suma dostępnych forecastów P50"
          tooltip="Suma prognozowanej końcowej frekwencji dla meczów posiadających P50."
        />
        <MetricCard
          label="Publicznie dostępne inventory"
          value={formatNumber(totalPublicAvailable)}
          subtext="Stan z najnowszych snapshotów"
          tooltip="Suma miejsc widocznych jako dostępne w publicznych źródłach ticketingowych."
        />
        <MetricCard
          label="Mecze z przyspieszającym sygnałem"
          value={acceleratingCount}
          subtext={slowingCount > 0 ? `${slowingCount} ze spowolnieniem` : 'Brak wykrytego spowolnienia'}
          tooltip="Trend wynika ze zmian forecastu/live signal, nie z potwierdzonego strumienia transakcji."
          highlight={acceleratingCount > 0 ? 'success' : 'normal'}
        />
      </div>

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Proxy zajętości vs prognoza frekwencji</h2>
          <p className="text-xs text-zinc-500">
            Część niebieska to proxy wynikające z publicznego inventory; zielona pokazuje różnicę do prognozy P50.
          </p>
        </div>

        <div className="space-y-3.5 pt-2">
          {events.map((event) => {
            const currentPct = Math.min(100, event.currentUtilization);
            const targetPct = Math.min(100, event.utilizationRate ?? event.currentUtilization);
            const additionalPct = Math.max(0, targetPct - currentPct);

            return (
              <div
                key={event.id}
                onClick={() => onSelectEvent(event.id)}
                className="group cursor-pointer p-3 rounded-lg border border-zinc-100 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50/50 transition-all"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 transition-colors">{event.name}</span>
                    <span className="text-[11px] text-zinc-400">({formatDaysRemaining(event.daysToEvent)})</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="tabular-nums font-medium text-zinc-700 dark:text-zinc-300">
                      Proxy: <strong>{formatNumber(event.currentSold)}</strong> ({formatPercent(event.currentUtilization)})
                    </span>
                    <span className="text-zinc-300">|</span>
                    <span className="tabular-nums font-semibold text-indigo-600 dark:text-indigo-400">
                      P50: <strong>{event.currentForecast !== undefined ? formatNumber(event.currentForecast) : '—'}</strong>
                    </span>
                    <CommercialStatusBadge status={event.commercialStatus} size="sm" />
                  </div>
                </div>

                <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
                  <div style={{ width: `${currentPct}%` }} className="bg-indigo-600 h-full transition-all duration-300" title={`Zajętość proxy: ${currentPct.toFixed(1)}%`} />
                  <div style={{ width: `${additionalPct}%` }} className="bg-emerald-500/80 h-full transition-all duration-300" title={`Różnica do P50: +${additionalPct.toFixed(1)} pp`} />
                </div>

                <div className="flex items-center justify-between mt-1 text-[10px] text-zinc-400">
                  <span>Pojemność referencyjna: {formatNumber(event.capacity)}</span>
                  <span>Publicznie dostępne: <strong>{formatNumber(event.inventoryAvailable ?? event.remainingCapacity)}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
