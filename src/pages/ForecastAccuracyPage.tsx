import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { EnrichedEvent, ModelPerformanceData, ModelVersionMetric } from '../types/ticketing';
import { eventsService, isAllClubs } from '../services/eventsService';
import { modelPerformanceService } from '../services/modelPerformanceService';
import { MetricCard } from '../components/common/MetricCard';
import { HorizonPerformanceChart } from '../components/charts/HorizonPerformanceChart';
import { formatNumber, formatPercent } from '../utils/formatters';

interface ForecastAccuracyPageProps {
  selectedClubFilter?: string;
  onClubFilterChange?: (club: string) => void;
}

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

export const ForecastAccuracyPage: React.FC<ForecastAccuracyPageProps> = ({
  selectedClubFilter,
  onClubFilterChange
}) => {
  const [perfData, setPerfData] = useState<ModelPerformanceData | null>(null);
  const [completedEvents, setCompletedEvents] = useState<EnrichedEvent[]>([]);
  const [versionMetrics, setVersionMetrics] = useState<ModelVersionMetric[]>([]);
  const [clubs, setClubs] = useState<string[]>([]);
  const [selectedClub, setSelectedClub] = useState(selectedClubFilter || 'Wszystkie kluby');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (selectedClubFilter) setSelectedClub(selectedClubFilter);
  }, [selectedClubFilter]);

  useEffect(() => {
    const loadPerformance = async () => {
      setIsLoading(true);
      try {
        const activeClub = isAllClubs(selectedClub) ? undefined : selectedClub;
        const [perf, clubsList, completed, versions] = await Promise.all([
          eventsService.getModelPerformance({ club: activeClub }),
          eventsService.getClubsList(),
          eventsService.getEvents({ status: 'completed', club: activeClub }),
          modelPerformanceService.getVersionMetrics(activeClub)
        ]);
        setPerfData(perf);
        setClubs(clubsList);
        setCompletedEvents(completed);
        setVersionMetrics(versions);
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
  const evaluableEvents = completedEvents.filter(
    (event) => event.outcome && event.currentForecast !== undefined
  );

  const headlineErrors = evaluableEvents.map((event) => {
    const actual = event.outcome!.actualFinalSales;
    const prediction = event.currentForecast!;
    const signed = prediction - actual;
    const absolute = Math.abs(signed);
    return {
      signed,
      absolute,
      percentage: actual > 0 ? (absolute / actual) * 100 : 0
    };
  });

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
  const modelVersionLabel = headlineKpis.modelVersions.length
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
            Headline liczymy z <strong>ostatniej prognozy P50 dla każdego zakończonego meczu</strong>.
            Obecnie mamy <strong>{headlineKpis.evaluatedMatchesCount} ocenione mecze</strong>; ewaluowalna wersja to{' '}
            <strong>{modelVersionLabel}</strong>. W tej próbie{' '}
            <strong>{formatPercent(headlineKpis.accuracyWithin10Pct)}</strong> prognoz mieści się w ±10%.
            Nowsze wersje bez zakończonych meczów nie są przedstawiane jako „dokładne” — czekają na outcome.
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
            w ±10%. Wynik dotyczy <strong>{modelVersionLabel}</strong> i należy czytać go razem z biasem oraz
            wielkością próby.
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
            się w ±10%. Wynik dotyczy <strong>{modelVersionLabel}</strong> i nie jest podstawą do samodzielnych
            decyzji operacyjnych.
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
            Headline: ostatnia prognoza per mecz · wersje i horyzonty oceniane osobno
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

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <MetricCard
          label="MAPE"
          value={formatPercent(headlineKpis.mape)}
          subtext="Ostatnia prognoza per mecz"
          tooltip="Średni bezwzględny błąd procentowy. Każdy zakończony mecz ma wagę 1."
          highlight={sampleTooSmall ? 'warning' : 'normal'}
        />
        <MetricCard
          label="MAE"
          value={`${formatNumber(headlineKpis.mae)} osób`}
          subtext="Średni błąd bezwzględny"
          tooltip="Średnia liczba osób, o którą ostatnia prognoza P50 różniła się od rzeczywistej frekwencji."
        />
        <MetricCard
          label="Bias"
          value={`${headlineKpis.bias > 0 ? '+' : ''}${formatNumber(headlineKpis.bias)}`}
          subtext={headlineKpis.bias > 0 ? 'Tendencja do zawyżania' : 'Tendencja do zaniżania'}
          tooltip="Średni podpisany błąd. Wartość dodatnia oznacza zawyżanie prognozy."
        />
        <MetricCard
          label="W zakresie ±5%"
          value={formatPercent(headlineKpis.accuracyWithin5Pct)}
          subtext={sampleTooSmall ? 'Wynik wstępny' : 'Ścisły próg'}
          tooltip="Odsetek zakończonych meczów z błędem ostatniej prognozy P50 nie większym niż 5%."
          highlight={accuracyHighlight(headlineKpis.accuracyWithin5Pct)}
        />
        <MetricCard
          label="W zakresie ±10%"
          value={formatPercent(headlineKpis.accuracyWithin10Pct)}
          subtext={sampleTooSmall ? 'Za mała próba' : within10Strong ? 'Stabilny wynik' : within10Moderate ? 'Wymaga poprawy' : 'Poniżej celu'}
          tooltip="Odsetek zakończonych meczów z błędem ostatniej prognozy P50 nie większym niż 10%."
          highlight={accuracyHighlight(headlineKpis.accuracyWithin10Pct)}
        />
        <MetricCard
          label="Ocenione mecze"
          value={headlineKpis.evaluatedMatchesCount}
          subtext={`${businessKpis.totalEvaluatedForecasts} punktów do analizy horyzontów`}
          tooltip="Headline używa jednej prognozy per mecz; wszystkie punkty służą wyłącznie do analizy horyzontów."
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

      <div className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Wyniki według wersji modelu</h2>
          <p className="text-xs text-zinc-500">
            Każda wersja jest oceniana z ostatniej prognozy dla danego meczu. Brak outcome'u oznacza „oczekuje na wynik”, a nie 0% trafności.
          </p>
        </div>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/75 dark:bg-zinc-900/50 text-zinc-500 font-medium">
                <th className="py-3 px-4">Wersja</th>
                <th className="py-3 px-3 text-right">Mecze z forecastem</th>
                <th className="py-3 px-3 text-right">Ocenione</th>
                <th className="py-3 px-3 text-right">MAE</th>
                <th className="py-3 px-3 text-right">MAPE</th>
                <th className="py-3 px-3 text-right">WAPE</th>
                <th className="py-3 px-3 text-right">Bias</th>
                <th className="py-3 px-3 text-right">±5%</th>
                <th className="py-3 px-3 text-right">±10%</th>
                <th className="py-3 px-4 text-right">P10–P90 coverage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {versionMetrics.map((row) => (
                <tr key={row.modelVersion} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40">
                  <td className="py-3.5 px-4 font-mono text-[11px] font-semibold text-zinc-900 dark:text-zinc-100">{row.modelVersion}</td>
                  <td className="py-3.5 px-3 text-right tabular-nums">{row.forecastEventsCount}</td>
                  <td className="py-3.5 px-3 text-right tabular-nums">
                    {row.status === 'evaluated' ? row.evaluatedMatchesCount : <span className="text-amber-600">oczekuje</span>}
                  </td>
                  <td className="py-3.5 px-3 text-right tabular-nums">{row.mae !== undefined ? formatNumber(row.mae) : '—'}</td>
                  <td className="py-3.5 px-3 text-right tabular-nums font-semibold">{row.mape !== undefined ? formatPercent(row.mape) : '—'}</td>
                  <td className="py-3.5 px-3 text-right tabular-nums">{row.wape !== undefined ? formatPercent(row.wape) : '—'}</td>
                  <td className="py-3.5 px-3 text-right tabular-nums">{row.bias !== undefined ? `${row.bias > 0 ? '+' : ''}${formatNumber(row.bias)}` : '—'}</td>
                  <td className="py-3.5 px-3 text-right tabular-nums">{row.accuracyWithin5Pct !== undefined ? formatPercent(row.accuracyWithin5Pct) : '—'}</td>
                  <td className="py-3.5 px-3 text-right tabular-nums">{row.accuracyWithin10Pct !== undefined ? formatPercent(row.accuracyWithin10Pct) : '—'}</td>
                  <td className="py-3.5 px-4 text-right tabular-nums">{row.intervalCoveragePct !== undefined ? formatPercent(row.intervalCoveragePct) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Jak zmienia się błąd wraz z czasem do meczu?</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Wszystkie zweryfikowane punkty predykcji są używane tylko do analizy konkretnego horyzontu.
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
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Dokładność według horyzontu czasowego</h2>
          <p className="text-xs text-zinc-500">Zastosowania biznesowe są hipotezami do walidacji — nie gwarancją operacyjną.</p>
        </div>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/75 dark:bg-zinc-900/50 text-zinc-500 font-medium">
                <th className="py-3 px-4">Horyzont</th>
                <th className="py-3 px-3 text-right">Prognozy</th>
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
                    <td className="py-3.5 px-3 text-right tabular-nums font-medium">{row.forecastsCount ? `±${formatNumber(row.mae)}` : '—'}</td>
                    <td className="py-3.5 px-3 text-right tabular-nums font-bold">{row.forecastsCount ? formatPercent(row.mape) : '—'}</td>
                    <td className="py-3.5 px-3 text-right tabular-nums">{row.forecastsCount ? `${row.bias > 0 ? '+' : ''}${formatNumber(row.bias)}` : '—'}</td>
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
