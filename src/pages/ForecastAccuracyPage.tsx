import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { EnrichedEvent, ModelPerformanceData } from '../types/ticketing';
import { eventsService, isAllClubs } from '../services/eventsService';
import { MetricCard } from '../components/common/MetricCard';
import { HorizonPerformanceChart } from '../components/charts/HorizonPerformanceChart';
import { formatNumber, formatPercent } from '../utils/formatters';

interface ForecastAccuracyPageProps {
  selectedClubFilter?: string;
  onClubFilterChange?: (club: string) => void;
}

export const ForecastAccuracyPage: React.FC<ForecastAccuracyPageProps> = ({
  selectedClubFilter,
  onClubFilterChange
}) => {
  const [perfData, setPerfData] = useState<ModelPerformanceData | null>(null);
  const [completedEvents, setCompletedEvents] = useState<EnrichedEvent[]>([]);
  const [clubs, setClubs] = useState<string[]>([]);
  const [selectedClub, setSelectedClub] = useState(selectedClubFilter || 'Wszystkie kluby');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (selectedClubFilter) {
      setSelectedClub(selectedClubFilter);
    }
  }, [selectedClubFilter]);

  useEffect(() => {
    const loadPerformance = async () => {
      setIsLoading(true);
      try {
        const activeClub = isAllClubs(selectedClub) ? undefined : selectedClub;
        const [perf, clubsList, completed] = await Promise.all([
          eventsService.getModelPerformance({ club: activeClub }),
          eventsService.getClubsList(),
          eventsService.getEvents({ status: 'completed', club: activeClub })
        ]);
        setPerfData(perf);
        setClubs(clubsList);
        setCompletedEvents(completed);
      } finally {
        setIsLoading(false);
      }
    };

    loadPerformance();
  }, [selectedClub]);

  if (isLoading || !perfData) {
    return (
      <div className="py-24 text-center">
        <div className="inline-flex h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        <p className="mt-3 text-xs text-zinc-500">Przeliczanie wskaźników trafności prognoz...</p>
      </div>
    );
  }

  const { businessKpis, horizonMetrics } = perfData;

  // Headline accuracy is one observation per completed match: the latest P50 forecast
  // available for that match. This prevents matches with more stored forecasts from
  // receiving a larger weight in the executive KPI.
  const evaluableEvents = completedEvents.filter(
    (event) => event.outcome && event.currentForecast !== undefined
  );

  const headlineErrors = evaluableEvents.map((event) => {
    const actual = event.outcome!.actualFinalSales;
    const prediction = event.currentForecast!;
    const signed = prediction - actual;
    const absolute = Math.abs(signed);
    const percentage = actual > 0 ? (absolute / actual) * 100 : 0;
    return { signed, absolute, percentage };
  });

  const average = (values: number[]) =>
    values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

  const median = (values: number[]) => {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[middle - 1] + sorted[middle]) / 2
      : sorted[middle];
  };

  const headlineKpis = {
    mae: average(headlineErrors.map((error) => error.absolute)),
    medianError: median(headlineErrors.map((error) => error.absolute)),
    mape: average(headlineErrors.map((error) => error.percentage)),
    bias: average(headlineErrors.map((error) => error.signed)),
    accuracyWithin5Pct:
      headlineErrors.length > 0
        ? (headlineErrors.filter((error) => error.percentage <= 5).length / headlineErrors.length) * 100
        : 0,
    accuracyWithin10Pct:
      headlineErrors.length > 0
        ? (headlineErrors.filter((error) => error.percentage <= 10).length / headlineErrors.length) * 100
        : 0,
    evaluatedMatchesCount: evaluableEvents.length,
    modelVersions: Array.from(
      new Set(
        evaluableEvents
          .map((event) => event.latestForecast?.modelVersion)
          .filter((version): version is string => Boolean(version))
      )
    ).sort()
  };

  const sampleTooSmall = headlineKpis.evaluatedMatchesCount < 10;
  const within10Strong = headlineKpis.accuracyWithin10Pct >= 80;
  const within10Moderate = headlineKpis.accuracyWithin10Pct >= 50;
  const populatedHorizons = horizonMetrics.filter((row) => row.forecastsCount > 0).length;
  const modelVersionLabel =
    headlineKpis.modelVersions.length > 0
      ? headlineKpis.modelVersions.join(', ')
      : 'brak wersji do oceny';

  const accuracyHighlight = (value: number): 'normal' | 'warning' | 'danger' | 'success' => {
    if (sampleTooSmall) return 'warning';
    if (value >= 80) return 'success';
    if (value >= 50) return 'warning';
    return 'danger';
  };

  const reliabilityPanel = sampleTooSmall
    ? {
        className:
          'border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/20 text-amber-950 dark:text-amber-200',
        icon: <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />,
        title: 'Wynik wstępny — zbyt mała próba do decyzji operacyjnych',
        body: (
          <>
            Headline jest liczony z <strong>ostatniej prognozy P50 dla każdego zakończonego meczu</strong>.
            Obecnie mamy tylko <strong>{headlineKpis.evaluatedMatchesCount} takie mecze</strong>; ewaluowalna wersja to{' '}
            <strong>{modelVersionLabel}</strong>. W tej próbie{' '}
            <strong>{formatPercent(headlineKpis.accuracyWithin10Pct)}</strong> prognoz mieści się w przedziale ±10%.
            To za mało, aby deklarować produkcyjną wiarygodność lub bezpieczeństwo planowania ochrony,
            cateringu czy personelu. Nowsze wersje bez zakończonych meczów nie są jeszcze oceniane tym KPI.
          </>
        )
      }
    : within10Strong
    ? {
        className:
          'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-950 dark:text-emerald-200',
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />,
        title: 'Stabilna trafność w bieżącej próbie',
        body: (
          <>
            <strong>{formatPercent(headlineKpis.accuracyWithin10Pct)}</strong> ostatnich prognoz per mecz mieści się
            w przedziale ±10%. Wynik dotyczy: <strong>{modelVersionLabel}</strong>. Nadal należy czytać go razem
            z wielkością próby, biasem i dokładnością dla konkretnego horyzontu czasowego.
          </>
        )
      }
    : {
        className:
          'border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 text-rose-950 dark:text-rose-200',
        icon: <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />,
        title: 'Model wymaga dalszej walidacji przed użyciem operacyjnym',
        body: (
          <>
            Tylko <strong>{formatPercent(headlineKpis.accuracyWithin10Pct)}</strong> ostatnich prognoz per mecz mieści
            się w przedziale ±10%. Wynik dotyczy: <strong>{modelVersionLabel}</strong>. Nie traktujemy tego poziomu
            jako podstawy do samodzielnych decyzji operacyjnych.
          </>
        )
      };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Trafność prognoz Beyond
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Headline: ostatnia prognoza per mecz · horyzonty: pełna historia punktów predykcji
          </p>
        </div>

        <select
          value={isAllClubs(selectedClub) ? 'Wszystkie kluby' : selectedClub}
          onChange={(e) => {
            setSelectedClub(e.target.value);
            onClubFilterChange?.(e.target.value);
          }}
          className="py-1.5 px-2.5 text-xs rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer font-medium"
        >
          <option value="Wszystkie kluby">Wszystkie kluby</option>
          {clubs.filter((club) => !isAllClubs(club)).map((club) => (
            <option key={club} value={club}>{club}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <MetricCard
          label="Średni błąd prognozy"
          value={formatPercent(headlineKpis.mape)}
          subtext={`MAE: około ${formatNumber(headlineKpis.mae)} osób`}
          tooltip="Headline MAPE/MAE: jedna obserwacja na zakończony mecz — ostatnia dostępna prognoza P50."
          highlight={sampleTooSmall ? 'warning' : 'normal'}
        />

        <MetricCard
          label="Mediana błędu"
          value={`${formatNumber(headlineKpis.medianError)} osób`}
          subtext="Ostatnia prognoza per mecz"
          tooltip="Mediana bezwzględnego błędu ostatniej prognozy P50 dla każdego zakończonego meczu."
        />

        <MetricCard
          label="Prognozy w zakresie ±5%"
          value={formatPercent(headlineKpis.accuracyWithin5Pct)}
          subtext={sampleTooSmall ? 'Wynik wstępny' : 'Ścisły próg trafności'}
          tooltip="Odsetek zakończonych meczów, dla których ostatnia prognoza P50 pomyliła się maksymalnie o 5%."
          highlight={accuracyHighlight(headlineKpis.accuracyWithin5Pct)}
        />

        <MetricCard
          label="Prognozy w zakresie ±10%"
          value={formatPercent(headlineKpis.accuracyWithin10Pct)}
          subtext={sampleTooSmall ? 'Za mała próba do wniosku' : within10Strong ? 'Stabilny wynik' : within10Moderate ? 'Wymaga poprawy' : 'Poniżej celu'}
          tooltip="Odsetek zakończonych meczów, dla których ostatnia prognoza P50 pomyliła się maksymalnie o 10%."
          highlight={accuracyHighlight(headlineKpis.accuracyWithin10Pct)}
        />

        <MetricCard
          label="Ocenione mecze"
          value={headlineKpis.evaluatedMatchesCount}
          subtext={`${businessKpis.totalEvaluatedForecasts} punktów do analizy horyzontów`}
          tooltip="Headline używa jednej prognozy per mecz; wszystkie zapisane prognozy służą osobno do analizy horyzontów."
          highlight={sampleTooSmall ? 'warning' : 'normal'}
        />
      </div>

      <div className={`rounded-lg border p-4 text-xs ${reliabilityPanel.className}`}>
        <div className="flex items-start gap-2.5">
          {reliabilityPanel.icon}
          <div className="space-y-1">
            <h4 className="font-semibold">{reliabilityPanel.title}</h4>
            <p className="leading-relaxed opacity-90">{reliabilityPanel.body}</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Jak zmienia się błąd wraz z czasem do meczu?
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Tu wykorzystujemy wszystkie zweryfikowane punkty predykcji, ponieważ analizujemy konkretny horyzont
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2.5 py-1 rounded">
            <Info className="w-3.5 h-3.5" />
            <span>{businessKpis.totalEvaluatedForecasts} prognoz · {populatedHorizons} horyzontów z danymi</span>
          </div>
        </div>

        <HorizonPerformanceChart metrics={horizonMetrics} />
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Dokładność według horyzontu czasowego
          </h2>
          <p className="text-xs text-zinc-500">
            Potencjalne zastosowania biznesowe są hipotezami do walidacji — nie gwarancją operacyjną
          </p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/75 dark:bg-zinc-900/50 text-zinc-500 font-medium">
                <th className="py-3 px-4">Horyzont czasowy</th>
                <th className="py-3 px-3 text-right">Liczba prognoz</th>
                <th className="py-3 px-3 text-right">MAE</th>
                <th className="py-3 px-3 text-right">MAPE</th>
                <th className="py-3 px-3 text-right">Bias</th>
                <th className="py-3 px-4">Potencjalne zastosowanie po walidacji</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {horizonMetrics.map((row) => {
                let recommendation = 'Wczesna kalibracja popytu i planowanie kampanii';
                if (row.horizon === '15–29 dni') recommendation = 'Planowanie kampanii reklamowej / social media';
                if (row.horizon === '8–14 dni') recommendation = 'Planowanie ochrony, służb medycznych i cateringu';
                if (row.horizon === '4–7 dni') recommendation = 'Promocje sektorowe i aktywacja bazy kibiców';
                if (row.horizon === '1–3 dni') recommendation = 'Planowanie wejść i przepustowości bramek';
                if (row.horizon === 'dzień eventu') recommendation = 'Końcowa estymacja frekwencji';

                return (
                  <tr key={row.horizon} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-zinc-900 dark:text-zinc-100">{row.horizon}</td>
                    <td className="py-3.5 px-3 text-right tabular-nums text-zinc-600 dark:text-zinc-400">{row.forecastsCount}</td>
                    <td className="py-3.5 px-3 text-right tabular-nums font-medium text-zinc-900 dark:text-zinc-100">
                      {row.forecastsCount > 0 ? `±${formatNumber(row.mae)}` : '—'}
                    </td>
                    <td className="py-3.5 px-3 text-right tabular-nums font-bold">
                      {row.forecastsCount > 0 ? formatPercent(row.mape) : '—'}
                    </td>
                    <td className="py-3.5 px-3 text-right tabular-nums font-medium text-zinc-600">
                      {row.forecastsCount > 0 ? (row.bias > 0 ? `+${formatNumber(row.bias)}` : formatNumber(row.bias)) : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-300">{recommendation}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
