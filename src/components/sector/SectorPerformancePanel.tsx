import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  Layers3,
  Minus,
  TrendingDown,
  TrendingUp
} from 'lucide-react';
import {
  SectorDecisionRow,
  SectorStatus,
  SectorSummaryRow,
  SectorTrend,
  sectorDecisionService
} from '../../services/sectorDecisionService';
import { formatNumber, formatPercent } from '../../utils/formatters';

interface SectorPerformancePanelProps {
  eventId: string;
}

const STATUS_META: Record<
  SectorStatus,
  { label: string; className: string }
> = {
  UNDERPERFORMING: {
    label: 'Poniżej tempa',
    className:
      'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300'
  },
  ON_TRACK: {
    label: 'W normie',
    className:
      'border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
  },
  OUTPERFORMING: {
    label: 'Powyżej tempa',
    className:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300'
  },
  INSUFFICIENT_SIGNAL: {
    label: 'Brak sygnału',
    className:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300'
  }
};

const TREND_LABEL: Record<SectorTrend, string> = {
  IMPROVING: 'Poprawia się',
  WEAKENING: 'Słabnie',
  STABLE: 'Stabilnie',
  FLAT: 'Bez zmian',
  UNKNOWN: 'Brak danych'
};

function StatusPill({ status }: { status: SectorStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-semibold ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}

function TrendLabel({ trend }: { trend: SectorTrend }) {
  const Icon =
    trend === 'IMPROVING'
      ? TrendingUp
      : trend === 'WEAKENING'
        ? TrendingDown
        : Minus;
  const tone =
    trend === 'IMPROVING'
      ? 'text-emerald-600 dark:text-emerald-400'
      : trend === 'WEAKENING'
        ? 'text-rose-600 dark:text-rose-400'
        : 'text-zinc-500';

  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap text-[11px] ${tone}`}>
      <Icon className="h-3 w-3" />
      {TREND_LABEL[trend]}
    </span>
  );
}

function signedSeats(value: number | null): string {
  if (value === null || Number.isNaN(value)) return '—';
  const rounded = Math.round(value);
  return `${rounded > 0 ? '+' : ''}${formatNumber(rounded)}`;
}

function confidenceLabel(value: SectorDecisionRow['projection_confidence']): string {
  switch (value) {
    case 'HIGH':
      return 'Wysoka';
    case 'MEDIUM':
      return 'Średnia';
    case 'LOW':
      return 'Niska';
    default:
      return 'Brak';
  }
}

const SUMMARY_CARD =
  'rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900';

export const SectorPerformancePanel: React.FC<SectorPerformancePanelProps> = ({ eventId }) => {
  const [summary, setSummary] = useState<SectorSummaryRow | null>(null);
  const [sectors, setSectors] = useState<SectorDecisionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await sectorDecisionService.getEventSectorDecision(eventId);
        if (!cancelled) {
          setSummary(result.summary);
          setSectors(result.sectors);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Nie udało się pobrać danych sektorowych.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const visibleSectors = useMemo(() => {
    if (showAll) return sectors;
    return sectors.slice(0, 12);
  }, [sectors, showAll]);

  if (isLoading) {
    return (
      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          <Layers3 className="h-4 w-4 text-indigo-600" />
          Sektory: wyniki i projekcja
        </div>
        <div className="mt-4 h-24 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-200">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <div className="font-semibold">Dane sektorowe są chwilowo niedostępne</div>
            <div className="mt-1 opacity-80">{error}</div>
          </div>
        </div>
      </section>
    );
  }

  if (!summary || sectors.length === 0) return null;

  const projectionCoverage = (summary.projection_coverage_ratio ?? 0) * 100;
  const topGap = summary.top_underperforming_gap_available;
  const topProjected = summary.top_underperforming_projected_available;

  return (
    <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-200 px-4 py-4 dark:border-zinc-800 sm:px-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Layers3 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Sektory: wyniki i projekcja
              </h2>
            </div>
            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              Pokazujemy, które sektory poruszają się wolniej lub szybciej niż cały event oraz ile miejsc może pozostać publicznie dostępnych na kickoff, jeśli obecny trend się utrzyma. To nie jest potwierdzona sprzedaż.
            </p>
          </div>
          <div className="text-[10px] text-zinc-400">
            Model: <span className="font-mono text-zinc-500">{summary.decision_version}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 bg-zinc-50/60 p-4 dark:bg-zinc-950/30 sm:grid-cols-2 lg:grid-cols-4 sm:p-5">
        <div className={SUMMARY_CARD}>
          <div className="flex items-center gap-2 text-[11px] font-medium text-zinc-500">
            <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
            Sektory poniżej tempa
          </div>
          <div className="mt-1 text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
            {summary.underperforming_count}
          </div>
          <p className="mt-1 text-[11px] text-zinc-500">
            z {summary.sector_count} obserwowanych sektorów
          </p>
        </div>

        <div className={SUMMARY_CARD}>
          <div className="flex items-center gap-2 text-[11px] font-medium text-zinc-500">
            <Activity className="h-3.5 w-3.5 text-indigo-600" />
            Największy problem
          </div>
          {summary.top_underperforming_sector ? (
            <>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {summary.top_underperforming_sector}
                </span>
                <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                  {signedSeats(topGap)} miejsc
                </span>
              </div>
              <p className="mt-1 text-[11px] text-zinc-500">
                Przy obecnym trendzie: około {formatNumber(topProjected)} publicznie dostępnych na kickoff.
              </p>
            </>
          ) : (
            <>
              <div className="mt-1 text-lg font-semibold text-emerald-700 dark:text-emerald-400">
                Brak materialnego problemu
              </div>
              <p className="mt-1 text-[11px] text-zinc-500">Żaden sektor nie przekracza obecnego progu underperformance.</p>
            </>
          )}
        </div>

        <div className={SUMMARY_CARD}>
          <div className="flex items-center gap-2 text-[11px] font-medium text-zinc-500">
            <Layers3 className="h-3.5 w-3.5 text-indigo-600" />
            Pokrycie projekcją
          </div>
          <div className="mt-1 text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
            {formatPercent(projectionCoverage)}
          </div>
          <p className="mt-1 text-[11px] text-zinc-500">
            {summary.projected_sector_count} sektorów ma wiarygodną projekcję do kickoffu.
          </p>
        </div>

        <div className={SUMMARY_CARD}>
          <div className="flex items-center gap-2 text-[11px] font-medium text-zinc-500">
            <CircleDollarSign className="h-3.5 w-3.5 text-zinc-400" />
            Dynamic pricing
          </div>
          <div className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Brak danych cenowych
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
            Rekomendacja ceny pojawi się po podłączeniu rzeczywistych cen sektorów. Nie estymujemy ich z dostępności.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-xs">
          <thead className="border-y border-zinc-200 bg-zinc-50 text-[10px] uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/80">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Sektor</th>
              <th className="px-3 py-2.5 text-right font-semibold">Dostępne</th>
              <th className="px-3 py-2.5 text-right font-semibold">Gap vs tempo</th>
              <th className="px-3 py-2.5 font-semibold">Status</th>
              <th className="px-3 py-2.5 font-semibold">Trend</th>
              <th className="px-3 py-2.5 text-right font-semibold">Na kickoff</th>
              <th className="px-3 py-2.5 font-semibold">Pewność</th>
              <th className="px-4 py-2.5 font-semibold">Cena / akcja</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/70">
            {visibleSectors.map((row) => (
              <tr key={`${row.ticket_event_id}-${row.sector}`} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/30">
                <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">{row.sector}</td>
                <td className="px-3 py-3 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                  {formatNumber(row.current_public_availability)}
                </td>
                <td className={`px-3 py-3 text-right font-medium tabular-nums ${
                  (row.sector_gap_available ?? 0) > 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : (row.sector_gap_available ?? 0) < 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-zinc-500'
                }`}>
                  {signedSeats(row.sector_gap_available)}
                </td>
                <td className="px-3 py-3"><StatusPill status={row.sector_status} /></td>
                <td className="px-3 py-3"><TrendLabel trend={row.trend_state} /></td>
                <td className="px-3 py-3 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                  {row.projected_public_availability_at_kickoff === null
                    ? '—'
                    : formatNumber(row.projected_public_availability_at_kickoff)}
                </td>
                <td className="px-3 py-3 text-zinc-600 dark:text-zinc-300">
                  {confidenceLabel(row.projection_confidence)}
                </td>
                <td className="px-4 py-3">
                  {row.price_data_status === 'PRICE_DATA_MISSING' ? (
                    <span className="text-[11px] text-zinc-400">Brak ceny · rekomendacja oczekuje</span>
                  ) : (
                    <span className="font-medium text-zinc-700 dark:text-zinc-200">
                      {row.current_price !== null ? `${row.current_price} ${row.currency ?? ''}` : '—'}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sectors.length > 12 && (
        <button
          type="button"
          onClick={() => setShowAll((current) => !current)}
          className="flex w-full cursor-pointer items-center justify-center gap-1.5 border-t border-zinc-200 px-4 py-3 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800/40 dark:hover:text-zinc-100"
        >
          {showAll ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          {showAll ? 'Pokaż najważniejsze sektory' : `Pokaż wszystkie sektory (${sectors.length})`}
        </button>
      )}

      <div className="border-t border-zinc-200 bg-zinc-50/60 px-4 py-3 text-[10px] leading-relaxed text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/30 sm:px-5">
        „Gap” oznacza różnicę względem tempa całego eventu. Dodatni gap = więcej publicznie dostępnych miejsc niż oczekiwalibyśmy przy obecnym tempie eventu. Projekcja „na kickoff” jest scenariuszem kontynuacji obecnego trendu, nie prognozą potwierdzonej sprzedaży.
      </div>
    </section>
  );
};
