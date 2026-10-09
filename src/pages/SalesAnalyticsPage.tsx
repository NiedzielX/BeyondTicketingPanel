import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  BarChart3,
  Calendar,
  Users,
  Target,
  ArrowUpRight,
  TrendingDown,
  Filter
} from 'lucide-react';
import { EnrichedEvent } from '../types/ticketing';
import { eventsService, isAllClubs } from '../services/eventsService';
import { MetricCard } from '../components/common/MetricCard';
import { CommercialStatusBadge, TrendIndicator } from '../components/common/StatusBadge';
import { formatNumber, formatPercent, formatDateShort, formatDaysRemaining } from '../utils/formatters';

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
        const list = await eventsService.getEvents({
          status: 'active',
          club: activeClub
        });
        setEvents(list);
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
        <p className="mt-3 text-xs text-zinc-500">Przeliczanie analizy sprzedaży...</p>
      </div>
    );
  }

  const totalTicketsSold = events.reduce((sum, e) => sum + e.currentSold, 0);
  const totalPredictedTickets = events.reduce((sum, e) => sum + (e.currentForecast ?? e.currentSold), 0);
  const totalCapacity = events.reduce((sum, e) => sum + e.capacity, 0);
  const acceleratingCount = events.filter((e) => e.trend === 'Przyspiesza').length;
  const slowingCount = events.filter((e) => e.trend === 'Zwalnia').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Analiza dynamiki sprzedaży (Pacing)
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Tempo przyrostu biletów, porównanie popytu i identyfikacja ryzyka niewykorzystania pojemności
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="Bilety sprzedane łącznie"
          value={formatNumber(totalTicketsSold)}
          subtext={`Na ${events.length} aktywnych meczach`}
          tooltip="Suma wszystkich sprzedanych biletów i karnetów na nadchodzące mecze"
        />

        <MetricCard
          label="Prognozowana sprzedaż łączna"
          value={formatNumber(totalPredictedTickets)}
          subtext={`Z ${formatNumber(totalCapacity)} dostępnych`}
          tooltip="Szacowana ostateczna frekwencja na wszystkich zaplanowanych meczach"
        />

        <MetricCard
          label="Mecze z przyspieszającą sprzedażą"
          value={acceleratingCount}
          subtext="Wysoki popyt w ostatnich dniach"
          tooltip="Mecze, w których tempo sprzedaży przewyższa typową krzywą historyczną"
          highlight="success"
        />

        <MetricCard
          label="Mecze ze spadkiem dynamiki"
          value={slowingCount}
          subtext={slowingCount > 0 ? 'Wymagają impulsu promocyjnego' : 'Brak zatorów'}
          tooltip="Mecze, gdzie dynamika sprzedaży zwolniła względem oczekiwań modelu"
          highlight={slowingCount > 0 ? 'warning' : 'normal'}
        />
      </div>

      {/* Wykres porównawczy: Wykorzystanie pojemności według meczów */}
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Wskaźnik zapełnienia stadionu dla nadchodzących meczów
            </h2>
            <p className="text-xs text-zinc-500">
              Obecna sprzedaż (niebieski) vs dodatkowy potencjał prognozy Beyond (zielony) względem 100% stadionu
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-indigo-600 rounded-sm" />
              Obecnie sprzedane
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-emerald-500 rounded-sm" />
              Prognoza Beyond
            </span>
          </div>
        </div>

        {/* Horizontal Stacked Bars */}
        <div className="space-y-3.5 pt-2">
          {events.map((ev) => {
            const currentPct = Math.min(100, ev.currentUtilization);
            const targetPct = Math.min(100, ev.utilizationRate ?? ev.currentUtilization);
            const additionalPct = Math.max(0, targetPct - currentPct);
            const emptyPct = Math.max(0, 100 - targetPct);

            return (
              <div
                key={ev.id}
                onClick={() => onSelectEvent(ev.id)}
                className="group cursor-pointer p-3 rounded-lg border border-zinc-100 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50/50 transition-all"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 transition-colors">
                      {ev.name}
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      ({formatDaysRemaining(ev.daysToEvent)})
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="tabular-nums font-medium text-zinc-700 dark:text-zinc-300">
                      Sprzedane: <strong>{formatNumber(ev.currentSold)}</strong> ({formatPercent(ev.currentUtilization)})
                    </span>
                    <span className="text-zinc-300">|</span>
                    <span className="tabular-nums font-semibold text-indigo-600 dark:text-indigo-400">
                      Prognoza: <strong>{ev.currentForecast ? formatNumber(ev.currentForecast) : '—'}</strong> ({ev.utilizationRate ? formatPercent(ev.utilizationRate) : '—'})
                    </span>
                    <CommercialStatusBadge status={ev.commercialStatus} size="sm" />
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${currentPct}%` }}
                    className="bg-indigo-600 h-full transition-all duration-300"
                    title={`Sprzedane: ${currentPct.toFixed(1)}%`}
                  />
                  <div
                    style={{ width: `${additionalPct}%` }}
                    className="bg-emerald-500/80 h-full transition-all duration-300"
                    title={`Prognozowany przyrost: +${additionalPct.toFixed(1)}%`}
                  />
                </div>

                <div className="flex items-center justify-between mt-1 text-[10px] text-zinc-400">
                  <span>Pojemność: {formatNumber(ev.capacity)}</span>
                  <span>
                    Przewidywane wolne miejsca: <strong>{formatNumber(ev.forecastRemainingUnsold)}</strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
