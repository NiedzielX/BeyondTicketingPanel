import React, { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, Clock, Eye, Sparkles, Users } from 'lucide-react';
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
  const visibleAvailable = event.inventoryAvailable ?? event.remainingCapacity;
  const intervalLabel =
    event.forecastLow !== undefined && event.forecastHigh !== undefined
      ? `${formatNumber(event.forecastLow)}–${formatNumber(event.forecastHigh)} widzów`
      : 'Jeszcze brak wystarczających danych';

  const statusExplanation = (() => {
    switch (event.commercialStatus) {
      case 'Bardzo dobra sprzedaż':
        return 'Zainteresowanie wygląda mocno na tle obecnych oczekiwań.';
      case 'Poniżej oczekiwań':
        return 'Zainteresowanie jest słabsze niż oczekiwaliśmy i warto je obserwować.';
      case 'Wymaga uwagi':
        return 'Ten mecz odbiega od oczekiwań i warto sprawdzić, czy potrzebna jest reakcja.';
      default:
        return 'Zainteresowanie rozwija się mniej więcej zgodnie z oczekiwaniami.';
    }
  })();

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
              <span>·</span><span>Pojemność stadionu: {formatNumber(event.capacity)}</span>
              {event.status === 'completed' && <><span>·</span><span className="text-emerald-600 font-semibold">Mecz zakończony</span></>}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-800/60 px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700">
            <Clock className="w-3.5 h-3.5 text-zinc-400" /><span>Dane odświeżone:</span>
            <strong className="text-zinc-800 dark:text-zinc-200 tabular-nums">{formatRelativeUpdate(event.lastUpdated)}</strong>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/30 dark:bg-indigo-950/10 p-4 sm:p-5">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Najważniejsze wnioski</h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Najpierw interpretacja. Szczegółowe liczby i dane techniczne są niżej.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-lg border border-indigo-100 dark:border-indigo-900/50 bg-white dark:bg-zinc-900 p-4">
            <div className="flex items-center gap-2 text-[11px] font-medium text-zinc-500"><Users className="w-3.5 h-3.5 text-indigo-600" />Przewidywana frekwencja</div>
            <div className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">{event.currentForecast !== undefined ? formatNumber(event.currentForecast) : 'Jeszcze brak'}</div>
            <p className="mt-1 text-[11px] text-zinc-500">Najbardziej prawdopodobny wynik według obecnego modelu.</p>
          </div>
          <div className="rounded-lg border border-indigo-100 dark:border-indigo-900/50 bg-white dark:bg-zinc-900 p-4">
            <div className="text-[11px] font-medium text-zinc-500">Jak wygląda zainteresowanie?</div>
            <div className="mt-2"><CommercialStatusBadge status={event.commercialStatus} /></div>
            <p className="mt-2 text-[11px] text-zinc-500 leading-relaxed">{statusExplanation}</p>
          </div>
          <div className="rounded-lg border border-indigo-100 dark:border-indigo-900/50 bg-white dark:bg-zinc-900 p-4">
            <div className="flex items-center gap-2 text-[11px] font-medium text-zinc-500"><Eye className="w-3.5 h-3.5 text-indigo-600" />Widoczne wolne miejsca</div>
            <div className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">{formatNumber(visibleAvailable)}</div>
            <p className="mt-1 text-[11px] text-zinc-500">Tyle miejsc widzimy jako dostępne publicznie. To nie jest liczba niesprzedanych biletów.</p>
          </div>
        </div>
      </div>

      {issues.length > 0 && (
        <div className="space-y-2">
          {issues.map((issue) => (
            <div key={issue.id} className="p-3.5 rounded-lg border border-amber-300 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1"><span className="font-semibold">Co warto sprawdzić</span><SeverityBadge severity={issue.severity} /></div>
                <p className="opacity-90">{issue.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 text-xs text-zinc-600 dark:text-zinc-300">
        <strong>Jak czytać dane o dostępności?</strong> Obserwujemy miejsca widoczne w publicznym systemie biletowym. Ich zmiana jest dla nas sygnałem zainteresowania, ale nie jest bezpośrednią informacją o sprzedaży.
      </div>

      <div>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Szczegóły</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <MetricCard
            label="Szacowane zajęcie teraz"
            value={formatPercent(event.currentUtilization)}
            subtext="Na podstawie widocznych miejsc"
            tooltip="Szacunek oparty na pojemności referencyjnej i publicznej dostępności miejsc. Nie jest to potwierdzona sprzedaż."
          />
          <MetricCard
            label="Przewidywana frekwencja"
            value={event.currentForecast !== undefined ? formatNumber(event.currentForecast) : 'W trakcie'}
            subtext="Najbardziej prawdopodobny wynik"
            tooltip="Technicznie jest to prognoza P50, czyli środkowy scenariusz modelu."
          />
          <MetricCard
            label="Realistyczny zakres"
            value={event.forecastLow !== undefined && event.forecastHigh !== undefined ? `${formatNumber(event.forecastLow)}–${formatNumber(event.forecastHigh)}` : '—'}
            subtext="Niższy–wyższy scenariusz"
            tooltip="Technicznie P10–P90. Pokazuje szerokość niepewności prognozy."
          />
          <MetricCard
            label="Przewidywane wypełnienie"
            value={event.utilizationRate !== undefined ? formatPercent(event.utilizationRate) : '—'}
            subtext="Według obecnej prognozy"
            tooltip="Prognozowana frekwencja jako procent pojemności stadionu."
          />
          <MetricCard
            label="Widoczne wolne miejsca"
            value={formatNumber(visibleAvailable)}
            subtext="Najnowszy publiczny odczyt"
            tooltip="Miejsca widoczne jako dostępne w publicznym systemie ticketingowym."
          />
          {outcome ? (
            <MetricCard
              label="Rzeczywista frekwencja"
              value={formatNumber(outcome.actualFinalSales)}
              subtext={event.finalPercentageError !== undefined ? `Błąd prognozy: ${formatPercent(event.finalPercentageError)}` : 'Zweryfikowany wynik'}
              tooltip="Zweryfikowana końcowa frekwencja, niezależna od publicznej dostępności miejsc."
              highlight="normal"
            />
          ) : (
            <MetricCard label="Do meczu" value={event.daysToEvent} subtext={intervalLabel} tooltip="Czas do kickoffu i obecny zakres prognozy." />
          )}
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Jak zmienia się zainteresowanie i prognoza</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Porównujemy zmiany widocznej dostępności miejsc z kolejnymi prognozami frekwencji.</p>
          </div>
          {event.currentForecast !== undefined && (
            <div className="text-xs text-zinc-700 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-800 px-3 py-1 rounded border border-zinc-200 dark:border-zinc-700">
              Obecna prognoza: <strong>{formatNumber(event.currentForecast)}</strong>{event.forecastLow !== undefined && event.forecastHigh !== undefined ? ` · zakres ${formatNumber(event.forecastLow)}–${formatNumber(event.forecastHigh)}` : ''}
            </div>
          )}
        </div>
        <SalesForecastChart snapshots={snapshots} forecasts={forecasts} eventDate={event.eventDate} capacity={event.capacity} actualOutcome={outcome?.actualFinalSales} eventName={event.name} />
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Jak zmieniała się prognoza ({historyItems.length})</h2>
          <p className="text-xs text-zinc-500">Historia pokazuje, jak przewidywana frekwencja zmieniała się wraz z napływem nowych danych.</p>
        </div>
        <ForecastHistoryTable items={historyItems} hasOutcome={outcome !== undefined} />
      </div>

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">Informacje techniczne</h3>
        </div>
        <p className="text-[11px] text-zinc-500 mb-3">Ta sekcja jest pomocnicza i nie jest potrzebna do codziennej interpretacji meczu.</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs text-zinc-600 dark:text-zinc-300">
          <div><span className="text-zinc-400 block text-[11px]">Ostatni odczyt</span><span className="font-medium tabular-nums">{modelDiagnostics.lastSnapshotAt ? formatRelativeUpdate(modelDiagnostics.lastSnapshotAt) : 'Brak danych'}</span></div>
          <div><span className="text-zinc-400 block text-[11px]">Ostatnia prognoza</span><span className="font-medium tabular-nums">{modelDiagnostics.lastForecastAt ? formatRelativeUpdate(modelDiagnostics.lastForecastAt) : 'Oczekuje'}</span></div>
          <div><span className="text-zinc-400 block text-[11px]">Liczba odczytów</span><span className="font-medium tabular-nums">{modelDiagnostics.snapshotsCount}</span></div>
          <div><span className="text-zinc-400 block text-[11px]">Liczba prognoz</span><span className="font-medium tabular-nums">{modelDiagnostics.forecastsCount}</span></div>
          <div><span className="text-zinc-400 block text-[11px]">Wersja modelu</span><span className="font-mono text-[11px] text-zinc-800 dark:text-zinc-200">{modelDiagnostics.activeModel}</span></div>
        </div>
      </div>
    </div>
  );
};
