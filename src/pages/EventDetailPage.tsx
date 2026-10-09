import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Sparkles,
  TrendingUp,
  Ticket,
  Users,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { EventDetailData, ForecastHistoryItem } from '../types/ticketing';
import { eventsService } from '../services/eventsService';
import {
  formatDateDayOnly,
  formatDaysRemaining,
  formatNumber,
  formatPercent,
  formatRelativeUpdate
} from '../utils/formatters';
import { CommercialStatusBadge, TrendIndicator, SeverityBadge } from '../components/common/StatusBadge';
import { MetricCard } from '../components/common/MetricCard';
import { SalesForecastChart } from '../components/charts/SalesForecastChart';
import { ForecastHistoryTable } from '../components/table/ForecastHistoryTable';

interface EventDetailPageProps {
  eventId: string;
  onBack: () => void;
}

export const EventDetailPage: React.FC<EventDetailPageProps> = ({ eventId, onBack }) => {
  const [data, setData] = useState<EventDetailData | null>(null);
  const [historyItems, setHistoryItems] = useState<ForecastHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      setIsLoading(true);
      try {
        const [detail, history] = await Promise.all([
          eventsService.getEventById(eventId),
          eventsService.getForecastHistory(eventId)
        ]);
        setData(detail);
        setHistoryItems(history);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetail();
  }, [eventId]);

  if (isLoading || !data) {
    return (
      <div className="py-24 text-center">
        <div className="inline-flex h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        <p className="mt-3 text-xs text-zinc-500">Wczytywanie analizy meczu...</p>
      </div>
    );
  }

  const { event, snapshots, forecasts, outcome, issues, modelDiagnostics } = data;

  return (
    <div className="space-y-6">
      {/* Back button & Title Header */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 mb-3 cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Wróć do listy meczów</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {event.name}
              </h1>
              <div className="flex items-center gap-2 ml-1">
                <CommercialStatusBadge status={event.commercialStatus} size="sm" />
                <TrendIndicator trend={event.trend} />
              </div>
            </div>

            {/* Subtitle format: Ekstraklasa • 24 października 2026 • 18 dni do eventu */}
            <p className="text-xs text-zinc-500 dark:text-zinc-400 flex flex-wrap items-center gap-2">
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                {event.competition}
              </span>
              <span aria-hidden="true">·</span>
              <span>{formatDateDayOnly(event.eventDate)}</span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {formatDaysRemaining(event.daysToEvent)}
              </span>
              <span aria-hidden="true">·</span>
              <span>Stadion: {event.club} ({formatNumber(event.capacity)} miejsc)</span>
              {event.status === 'completed' && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-emerald-600 font-semibold">Mecz zakończony</span>
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-800/60 px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span>Aktualizacja biletowa:</span>
            <strong className="text-zinc-800 dark:text-zinc-200 tabular-nums">
              {formatRelativeUpdate(event.lastUpdated)}
            </strong>
          </div>
        </div>
      </div>

      {/* Commercial alert if issues exist */}
      {issues.length > 0 && (
        <div className="space-y-2">
          {issues.map((iss) => (
            <div
              key={iss.id}
              className="p-3.5 rounded-lg border border-amber-300 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3"
            >
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">Uwaga w sprzedaży biletów</span>
                  <SeverityBadge severity={iss.severity} />
                </div>
                <p className="opacity-90">{iss.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. Event Header: Wymagane 6 kluczowych metryk ticketing managera */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Sprzedane */}
        <MetricCard
          label="Sprzedane"
          value={formatNumber(event.currentSold)}
          subtext="Łącznie wejściówek"
          tooltip="Liczba biletów i karnetów sprzedanych do bieżącego snapshotu"
        />

        {/* 2. Obecne wypełnienie */}
        <MetricCard
          label="Obecne wypełnienie"
          value={formatPercent(event.currentUtilization)}
          subtext={`z ${formatNumber(event.capacity)} pojemności`}
          tooltip="Procentowe zapełnienie stadionu na ten moment"
        />

        {/* 3. Prognoza końcowa */}
        <MetricCard
          label="Prognoza końcowa"
          value={event.currentForecast ? formatNumber(event.currentForecast) : 'W trakcie'}
          subtext={
            event.forecastDelta !== undefined
              ? `Ostatnia zmiana: ${event.forecastDelta > 0 ? '+' : ''}${formatNumber(event.forecastDelta)}`
              : 'Oczekuje na przeliczenie'
          }
          tooltip="Szacowana ostateczna sprzedaż w dniu meczu wyliczona przez model Beyond"
          highlight="normal"
        />

        {/* 4. Prognozowane wypełnienie */}
        <MetricCard
          label="Prognozowane wypełnienie"
          value={event.utilizationRate ? formatPercent(event.utilizationRate) : '—'}
          subtext="Przewidywany fill-rate"
          tooltip="Docelowy procent zapełnienia trybun stadionu"
          highlight={
            event.utilizationRate && event.utilizationRate >= 85
              ? 'success'
              : event.utilizationRate && event.utilizationRate < 60
              ? 'warning'
              : 'normal'
          }
        />

        {/* 5. Pozostały potencjał */}
        <MetricCard
          label="Pozostały potencjał"
          value={formatNumber(event.remainingCapacity)}
          subtext={`Zapas prognozy: ${formatNumber(event.forecastRemainingUnsold)}`}
          tooltip="Maksymalna liczba miejsc pozostająca do wyprzedania trybun"
        />

        {/* 6. Dni do meczu / Wynik końcowy */}
        {outcome ? (
          <MetricCard
            label="Wynik rzeczywisty"
            value={formatNumber(outcome.actualFinalSales)}
            subtext={
              event.finalPercentageError !== undefined
                ? `Błąd prognozy: ${formatPercent(event.finalPercentageError)}`
                : 'Mecz rozegrany'
            }
            tooltip="Faktyczna ostateczna liczba kibiców na stadionie"
            highlight="success"
          />
        ) : (
          <MetricCard
            label="Dni do meczu"
            value={event.daysToEvent}
            subtext={event.daysToEvent <= 3 ? 'Ostatnie dni sprzedaży' : 'Standardowy cykl'}
            tooltip="Czas pozostały do gwizdka rozpoczynającego spotkanie"
          />
        )}
      </div>

      {/* Główny wykres: Sprzedaż rzeczywista + prognoza ML */}
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Sprzedaż rzeczywista + prognoza ML
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Dynamika napływu transakcji kibiców zestawiona z kolejnymi wyliczeniami docelowej frekwencji Beyond
            </p>
          </div>
          {event.currentForecast && (
            <div className="text-xs text-zinc-700 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-800 px-3 py-1 rounded border border-zinc-200 dark:border-zinc-700">
              Prognoza na dzień meczu: <strong>{formatNumber(event.currentForecast)} kibiców</strong>
            </div>
          )}
        </div>

        <SalesForecastChart
          snapshots={snapshots}
          forecasts={forecasts}
          eventDate={event.eventDate}
          capacity={event.capacity}
          actualOutcome={outcome?.actualFinalSales}
          eventName={event.name}
        />
      </div>

      {/* Historia prognoz i snapshotów */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Historia rozwoju prognozy ({historyItems.length})
            </h2>
            <p className="text-xs text-zinc-500">
              Ewolucja estymacji końcowej w miarę dopływu kolejnych snapshotów biletowych
            </p>
          </div>
        </div>

        <ForecastHistoryTable items={historyItems} hasOutcome={outcome !== undefined} />
      </div>

      {/* Dyskretna sekcja wspierająca silnik analityczny Beyond */}
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
            Silnik analityczny Beyond Ticketing
          </h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-zinc-600 dark:text-zinc-300">
          <div>
            <span className="text-zinc-400 block text-[11px]">Ostatni snapshot sprzedaży</span>
            <span className="font-medium tabular-nums">
              {modelDiagnostics.lastSnapshotAt
                ? formatRelativeUpdate(modelDiagnostics.lastSnapshotAt)
                : 'Brak danych'}
            </span>
          </div>

          <div>
            <span className="text-zinc-400 block text-[11px]">Wyliczenie prognozy</span>
            <span className="font-medium tabular-nums">
              {modelDiagnostics.lastForecastAt
                ? formatRelativeUpdate(modelDiagnostics.lastForecastAt)
                : 'Oczekuje'}
            </span>
          </div>

          <div>
            <span className="text-zinc-400 block text-[11px]">Liczba punktów pomiarowych</span>
            <span className="font-medium tabular-nums">
              {modelDiagnostics.snapshotsCount} snapshotów biletowych
            </span>
          </div>

          <div>
            <span className="text-zinc-400 block text-[11px]">Wersja silnika Beyond</span>
            <span className="font-mono text-[11px] text-zinc-800 dark:text-zinc-200">
              Beyond Production v2.4
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
