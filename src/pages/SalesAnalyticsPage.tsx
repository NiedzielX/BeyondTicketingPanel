import React, { useEffect, useState } from 'react';
import { EnrichedEvent } from '../types/ticketing';
import { eventsService, isAllClubs } from '../services/eventsService';
import { MetricCard } from '../components/common/MetricCard';
import { CommercialStatusBadge, TrendIndicator } from '../components/common/StatusBadge';
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
        <p className="mt-3 text-xs text-zinc-500">Porównywanie zainteresowania między meczami...</p>
      </div>
    );
  }

  const totalPredictedAttendance = events.reduce((sum, event) => sum + (event.currentForecast ?? 0), 0);
  const totalPublicAvailable = events.reduce((sum, event) => sum + (event.inventoryAvailable ?? event.remainingCapacity ?? 0), 0);
  const acceleratingCount = events.filter((event) => event.trend === 'Przyspiesza').length;
  const slowingCount = events.filter((event) => event.trend === 'Zwalnia').length;
  const averageCurrentUtilization = events.length > 0
    ? events.reduce((sum, event) => sum + event.currentUtilization, 0) / events.length
    : 0;

  return (
    <div className="space-y-6">
      <div className="border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Trendy zainteresowania</h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-3xl">
          Porównujemy nadchodzące mecze: gdzie zainteresowanie jest mocne, gdzie słabnie i jak obecna prognoza frekwencji wygląda na tle pojemności stadionu.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="Średnie szacowane zajęcie teraz"
          value={formatPercent(averageCurrentUtilization)}
          subtext={`Na ${events.length} monitorowanych meczach`}
          tooltip="Szacunek na podstawie pojemności stadionu i miejsc widocznych jako dostępne publicznie. Nie jest to potwierdzona sprzedaż."
        />
        <MetricCard
          label="Łączna przewidywana frekwencja"
          value={formatNumber(totalPredictedAttendance)}
          subtext="Suma obecnych prognoz"
          tooltip="Suma najbardziej prawdopodobnej frekwencji dla wszystkich aktywnych meczów z dostępną prognozą."
        />
        <MetricCard
          label="Widoczne wolne miejsca"
          value={formatNumber(totalPublicAvailable)}
          subtext="Łącznie w publicznych odczytach"
          tooltip="Suma miejsc widocznych jako dostępne publicznie. Nie jest to liczba niesprzedanych biletów."
        />
        <MetricCard
          label="Mecze z rosnącym zainteresowaniem"
          value={acceleratingCount}
          subtext={slowingCount > 0 ? `${slowingCount} z osłabieniem` : 'Brak wykrytego osłabienia'}
          tooltip="Porównujemy zmianę sygnału zainteresowania w czasie."
          highlight={acceleratingCount > 0 ? 'success' : 'normal'}
        />
      </div>

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Porównanie meczów</h2>
          <p className="text-xs text-zinc-500">
            Pasek pokazuje szacowane zajęcie teraz oraz to, do jakiego poziomu wypełnienia prowadzi obecna prognoza frekwencji.
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
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 transition-colors">{event.name}</span>
                      <span className="text-[11px] text-zinc-400">({formatDaysRemaining(event.daysToEvent)})</span>
                    </div>
                    <div className="mt-1"><TrendIndicator trend={event.trend} /></div>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="tabular-nums font-medium text-zinc-700 dark:text-zinc-300">
                      Teraz: <strong>{formatPercent(event.currentUtilization)}</strong>
                    </span>
                    <span className="text-zinc-300">→</span>
                    <span className="tabular-nums font-semibold text-indigo-600 dark:text-indigo-400">
                      Prognoza: <strong>{event.currentForecast !== undefined ? formatNumber(event.currentForecast) : '—'} widzów</strong>
                    </span>
                    <CommercialStatusBadge status={event.commercialStatus} size="sm" />
                  </div>
                </div>

                <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
                  <div style={{ width: `${currentPct}%` }} className="bg-indigo-600 h-full transition-all duration-300" title={`Szacowane zajęcie teraz: ${currentPct.toFixed(1)}%`} />
                  <div style={{ width: `${additionalPct}%` }} className="bg-emerald-500/80 h-full transition-all duration-300" title={`Dodatkowe przewidywane wypełnienie: +${additionalPct.toFixed(1)} pp`} />
                </div>

                <div className="flex items-center justify-between mt-1 text-[10px] text-zinc-400">
                  <span>Pojemność stadionu: {formatNumber(event.capacity)}</span>
                  <span>Widoczne wolne miejsca: <strong>{formatNumber(event.inventoryAvailable ?? event.remainingCapacity)}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 px-4 py-3 text-[11px] text-zinc-500">
        Pamiętaj: „zajęcie teraz” jest szacunkiem z publicznej dostępności miejsc. Nie traktujemy go jako rzeczywistej sprzedaży ani liczby sprzedanych biletów.
      </div>
    </div>
  );
};
