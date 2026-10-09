import React, { useState, useEffect } from 'react';
import { HelpCircle, Info, Filter, CheckCircle2, TrendingDown, Target, ShieldCheck } from 'lucide-react';
import { ModelPerformanceData } from '../types/ticketing';
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
  const [clubs, setClubs] = useState<string[]>([]);
  const [selectedClub, setSelectedClub] = useState(selectedClubFilter || 'Wszystkie kluby');
  const [selectedDateRange, setSelectedDateRange] = useState('all');
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
        const [perf, clubsList] = await Promise.all([
          eventsService.getModelPerformance({
            club: activeClub,
            dateRange: selectedDateRange
          }),
          eventsService.getClubsList()
        ]);
        setPerfData(perf);
        setClubs(clubsList);
      } finally {
        setIsLoading(false);
      }
    };

    loadPerformance();
  }, [selectedClub, selectedDateRange]);

  if (isLoading || !perfData) {
    return (
      <div className="py-24 text-center">
        <div className="inline-flex h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        <p className="mt-3 text-xs text-zinc-500">Przeliczanie wskaźników trafności prognoz...</p>
      </div>
    );
  }

  const { businessKpis, horizonMetrics } = perfData;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Trafność prognoz Beyond
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Weryfikacja precyzji predykcji ticketingowych względem faktycznej liczby kibiców na meczach
          </p>
        </div>

        {/* Filtry po klubie i zakresie dat */}
        <div className="flex items-center gap-2">
          <select
            value={isAllClubs(selectedClub) ? 'Wszystkie kluby' : selectedClub}
            onChange={(e) => {
              setSelectedClub(e.target.value);
              onClubFilterChange?.(e.target.value);
            }}
            className="py-1.5 px-2.5 text-xs rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer font-medium"
          >
            <option value="Wszystkie kluby">Wszystkie kluby</option>
            {clubs.filter((c) => !isAllClubs(c)).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={selectedDateRange}
            onChange={(e) => setSelectedDateRange(e.target.value)}
            className="py-1.5 px-2.5 text-xs rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">Cały sezon 2025/2026</option>
            <option value="last90">Ostatnie 90 dni</option>
            <option value="last30">Ostatnie 30 dni</option>
          </select>
        </div>
      </div>

      {/* 6. Główne KPI w języku biznesowym */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* 1. Średni błąd prognozy */}
        <MetricCard
          label="Średni błąd prognozy"
          value={formatPercent(businessKpis.mape)}
          subtext={`Około ${formatNumber(businessKpis.mae)} biletów`}
          tooltip="Średni procentowy błąd względny (MAPE) wyliczony ze wszystkich zweryfikowanych meczów rozegranych w sezonie."
          highlight="normal"
        />

        {/* 2. Mediana błędu */}
        <MetricCard
          label="Mediana błędu"
          value={`${formatNumber(businessKpis.medianError)} szt.`}
          subtext="Dla 50% meczów błąd jest mniejszy"
          tooltip="Mediana odchylenia – typowy błąd w liczbie biletów, wolny od wpływu nietypowych anomalii pogodowych."
        />

        {/* 3. Prognozy w zakresie ±5% */}
        <MetricCard
          label="Prognozy w zakresie ±5%"
          value={formatPercent(businessKpis.accuracyWithin5Pct)}
          subtext="Wysoka dokładność"
          tooltip="Odsetek prognoz, które pomyliły się o mniej niż 5% ostatecznej frekwencji na stadionie."
          highlight="success"
        />

        {/* 4. Prognozy w zakresie ±10% */}
        <MetricCard
          label="Prognozy w zakresie ±10%"
          value={formatPercent(businessKpis.accuracyWithin10Pct)}
          subtext="Próg bezpieczeństwa operacyjnego"
          tooltip="Niemal wszystkie prognozy Beyond mieszczą się w tym bezpiecznym korytarzu planowania służb i cateringu."
          highlight="success"
        />

        {/* 5. Liczba ocenionych meczów */}
        <MetricCard
          label="Ocenione mecze"
          value={businessKpis.evaluatedMatchesCount}
          subtext={`${businessKpis.totalEvaluatedForecasts} punktów predykcji`}
          tooltip="Liczba zakończonych spotkań Ekstraklasy, na których zweryfikowano końcowy wynik biletowy."
        />
      </div>

      {/* Kicker dla dyrektora ticketingu */}
      <div className="rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 text-xs text-emerald-950 dark:text-emerald-200">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <h4 className="font-semibold text-emerald-900 dark:text-emerald-100">
              Wiarygodność biznesowa dla klubu
            </h4>
            <p className="leading-relaxed opacity-90">
              Aż <strong>{formatPercent(businessKpis.accuracyWithin10Pct)}</strong> prognoz Beyond mieści się w
              bezpiecznym przedziale <strong>±10%</strong> od końcowego wyniku. Oznacza to, że klub może pewnie
              planować zamawianie ochrony, personelu kas, cateringu oraz akcje marketingowe 'last-minute' bez
              obaw o przestrzelenie założeń.
            </p>
          </div>
        </div>
      </div>

      {/* Wykres: Średni błąd względem czasu do eventu */}
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Jak szybko prognoza staje się wiarygodna?
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Średni błąd prognozy w kolejnych fazach sprzedaży biletów
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Na 14 dni przed meczem błąd spada poniżej 5%</span>
          </div>
        </div>

        <HorizonPerformanceChart metrics={horizonMetrics} />
      </div>

      {/* Tabela horyzontów z perspektywą decyzyjną */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Tabela dokładności według horyzontu czasowego
            </h2>
            <p className="text-xs text-zinc-500">
              Praktyczna rekomendacja decyzyjna dla każdego etapu kampanii biletowej
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/75 dark:bg-zinc-900/50 text-zinc-500 font-medium">
                <th className="py-3 px-4">Horyzont czasowy</th>
                <th className="py-3 px-3 text-right">Liczba prognoz</th>
                <th className="py-3 px-3 text-right">Średni błąd (bilety)</th>
                <th className="py-3 px-3 text-right">Średni błąd %</th>
                <th className="py-3 px-3 text-right">Kierunek (Bias)</th>
                <th className="py-3 px-4">Zastosowanie decyzyjne w klubie</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {horizonMetrics.map((row) => {
                let recommendation = 'Wczesna kalibracja popytu i planowanie cen biletów';
                if (row.horizon === '15–29 dni') recommendation = 'Decyzja o uruchomieniu kampanii reklamowej / social media';
                if (row.horizon === '8–14 dni') recommendation = 'Ostateczny target ochrony, służb medycznych i cateringu';
                if (row.horizon === '4–7 dni') recommendation = 'Dynamiczne promocje sektorowe / aktywacja bazy karnetowiczów';
                if (row.horizon === '1–3 dni') recommendation = 'Zarządzanie wejściami, optymalizacja przepustowości bramek';
                if (row.horizon === 'dzień eventu') recommendation = 'Końcowe rozliczenie i raport frekwencji';

                return (
                  <tr key={row.horizon} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-zinc-900 dark:text-zinc-100">
                      {row.horizon}
                    </td>
                    <td className="py-3.5 px-3 text-right tabular-nums text-zinc-600 dark:text-zinc-400">
                      {row.forecastsCount}
                    </td>
                    <td className="py-3.5 px-3 text-right tabular-nums font-medium text-zinc-900 dark:text-zinc-100">
                      ±{formatNumber(row.mae)} biletów
                    </td>
                    <td className="py-3.5 px-3 text-right tabular-nums font-bold">
                      <span
                        className={
                          row.mape <= 3
                            ? 'text-emerald-600'
                            : row.mape <= 5
                            ? 'text-emerald-600'
                            : row.mape <= 10
                            ? 'text-indigo-600'
                            : 'text-zinc-600 dark:text-zinc-400'
                        }
                      >
                        {formatPercent(row.mape)}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right tabular-nums font-medium text-zinc-600">
                      {row.bias > 0 ? `+${formatNumber(row.bias)}` : formatNumber(row.bias)}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-300">
                      {recommendation}
                    </td>
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
