import React, { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, Clock, Sparkles } from 'lucide-react';
import { EventDetailData, ForecastHistoryItem } from '../types/ticketing';
import { eventsService } from '../services/eventsService';
import {
  formatDateDayOnly,
  formatDaysRemaining,
  formatNumber,
  formatPercent,
  formatRelativeUpdate
} from '../utils/formatters';
import { CommercialStatusBadge, SeverityBadge, TrendIndicator } from '../components/common/StatusBadge';
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
  const intervalLabel =
    event.forecastLow !== undefined && event.forecastHigh !== undefined
      ? `P10–P90: ${formatNumber(event.forecastLow)}–${formatNumber(event.forecastHigh)}`
      : 'Brak pełnego przedziału P10–P90';

  return (
    <div className="space-y-6">
      <div>
        <button onClick={onBack} className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 mb-3 cursor-pointer transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /><span>Wróć do listy meczów</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{event.name}</h1>
              <div className="flex items-center gap-2 ml-1"><CommercialStatusBadge status={event.commercialStatus} size="sm" /><TrendIndicator trend={event.trend} /></div>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 flex flex-wrap items-center gap-2">
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">{event.competition}</span>
              <span>·</span><span>{formatDateDayOnly(event.eventDate)}</span><span>·</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{formatDaysRemaining(event.daysToEvent)}</span>
              <span>·</span><span>Pojemność referencyjna: {formatNumber(event.capacity)}</span>
              {event.status === 'completed' && <><span>·</span><span className="text-emerald-600 font-semibold">Mecz zakończony</span></>}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-800/60 px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700">
            <Clock className="w-3.5 h-3.5 text-zinc-400" /><span>Ostatni snapshot:</span>
            <strong className="text-zinc-800 dark:text-zinc-200 tabular-nums">{formatRelativeUpdate(event.lastUpdated)}</strong>
          </div>
        </div>
      </div>

      {issues.length > 0 && (
        <div className="space-y-2">
          {issues.map((issue) => (
            <div key={issue.id} className="p-3.5 rounded-lg border border-amber-300 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1"><span className="font-semibold">Uwaga w danych / prognozie</span><SeverityBadge severity={issue.severity} /></div>
                <p className="opacity-90">{issue.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-lg border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/10 px-4 py-3 text-xs text-zinc-600 dark:text-zinc-300">
        Publiczne inventory jest używane jako <strong>proxy popytu</strong>. Nie interpretujemy wartości proxy jako potwierdzonej liczby sprzedanych biletów.
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard
          label="Sygnał popytu (proxy)"
          value={formatNumber(event.currentSold)}
          subtext="Capacity − public inventory"
          tooltip="Wartość wyprowadzona z publicznie dostępnego inventory. Nie jest to potwierdzona sprzedaż."
        />
        <MetricCard
          label="Zajętość proxy"
          value={formatPercent(event.currentUtilization)}
          subtext={`vs ${formatNumber(event.capacity)} pojemności`}
          tooltip="Udział pojemności referencyjnej niewidoczny obecnie jako publicznie dostępne inventory."
        />
        <MetricCard
          label="Prognoza frekwencji P50"
          value={event.currentForecast !== undefined ? formatNumber(event.currentForecast) : 'W trakcie'}
          subtext={event.forecastDelta !== undefined ? `Zmiana: ${event.forecastDelta > 0 ? '+' : ''}${formatNumber(event.forecastDelta)}` : 'Oczekuje na forecast'}
          tooltip="Mediana prognozowanej końcowej frekwencji."
        />
        <MetricCard
          label="Przedział prognozy"
          value={event.forecastLow !== undefined && event.forecastHigh !== undefined ? `${formatNumber(event.forecastLow)}–${formatNumber(event.forecastHigh)}` : '—'}
          subtext="P10–P90"
          tooltip="Przedział probabilistyczny. Jego jakość należy oceniać przez empirical coverage."
        />
        <MetricCard
          label="Publicznie dostępne"
          value={formatNumber(event.inventoryAvailable ?? event.remainingCapacity)}
          subtext="Najnowszy snapshot inventory"
          tooltip="Miejsca widoczne jako dostępne w publicznym systemie ticketingowym."
        />
        {outcome ? (
          <MetricCard
            label="Rzeczywista frekwencja"
            value={formatNumber(outcome.actualFinalSales)}
            subtext={event.finalPercentageError !== undefined ? `Błąd ostatniej P50: ${formatPercent(event.finalPercentageError)}` : 'Zweryfikowany outcome'}
            tooltip="Zweryfikowana końcowa frekwencja, niezależna od publicznego inventory proxy."
            highlight="normal"
          />
        ) : (
          <MetricCard label="Dni do meczu" value={event.daysToEvent} subtext={intervalLabel} tooltip="Czas do kickoffu oraz obecna dostępność przedziału probabilistycznego." />
        )}
      </div>

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Publiczne inventory proxy + prognoza frekwencji</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Ewolucja sygnału z publicznego inventory zestawiona z kolejnymi prognozami P50.</p>
          </div>
          {event.currentForecast !== undefined && (
            <div className="text-xs text-zinc-700 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-800 px-3 py-1 rounded border border-zinc-200 dark:border-zinc-700">
              P50: <strong>{formatNumber(event.currentForecast)}</strong>{event.forecastLow !== undefined && event.forecastHigh !== undefined ? ` · P10–P90 ${formatNumber(event.forecastLow)}–${formatNumber(event.forecastHigh)}` : ''}
            </div>
          )}
        </div>
        <SalesForecastChart snapshots={snapshots} forecasts={forecasts} eventDate={event.eventDate} capacity={event.capacity} actualOutcome={outcome?.actualFinalSales} eventName={event.name} />
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Historia prognozy ({historyItems.length})</h2>
          <p className="text-xs text-zinc-500">Zmiany P50 wraz z dopływem kolejnych snapshotów publicznego inventory.</p>
        </div>
        <ForecastHistoryTable items={historyItems} hasOutcome={outcome !== undefined} />
      </div>

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">Silnik analityczny Beyond</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs text-zinc-600 dark:text-zinc-300">
          <div><span className="text-zinc-400 block text-[11px]">Ostatni snapshot</span><span className="font-medium tabular-nums">{modelDiagnostics.lastSnapshotAt ? formatRelativeUpdate(modelDiagnostics.lastSnapshotAt) : 'Brak danych'}</span></div>
          <div><span className="text-zinc-400 block text-[11px]">Ostatni forecast</span><span className="font-medium tabular-nums">{modelDiagnostics.lastForecastAt ? formatRelativeUpdate(modelDiagnostics.lastForecastAt) : 'Oczekuje'}</span></div>
          <div><span className="text-zinc-400 block text-[11px]">Snapshoty</span><span className="font-medium tabular-nums">{modelDiagnostics.snapshotsCount}</span></div>
          <div><span className="text-zinc-400 block text-[11px]">Forecasty</span><span className="font-medium tabular-nums">{modelDiagnostics.forecastsCount}</span></div>
          <div><span className="text-zinc-400 block text-[11px]">Aktywny model</span><span className="font-mono text-[11px] text-zinc-800 dark:text-zinc-200">{modelDiagnostics.activeModel}</span></div>
        </div>
      </div>
    </div>
  );
};
