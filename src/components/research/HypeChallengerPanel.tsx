import React, { useEffect, useMemo, useState } from 'react';
import { Activity, Ban, Radio, ShieldCheck } from 'lucide-react';
import {
  HypeChallengerSummary,
  HypeCvRow,
  HypeReadinessRow,
  hypeChallengerService
} from '../../services/hypeChallengerService';

const fmt = (value: number, digits = 0) =>
  value.toLocaleString('pl-PL', { minimumFractionDigits: digits, maximumFractionDigits: digits });

const label = (key: string) => {
  const labels: Record<string, string> = {
    'hype.media_attention': 'Media attention',
    'hype.mention_acceleration': 'Mention acceleration',
    'hype.search_interest': 'Search interest',
    'hype.social_volume': 'Social volume',
    'hype.local_fan_buzz': 'Local fan buzz',
    'hype.sentiment': 'Sentiment'
  };
  return labels[key] ?? key;
};

export const HypeChallengerPanel: React.FC = () => {
  const [summary, setSummary] = useState<HypeChallengerSummary | null>(null);
  const [readiness, setReadiness] = useState<HypeReadinessRow[]>([]);
  const [cv, setCv] = useState<HypeCvRow[]>([]);

  useEffect(() => {
    Promise.all([
      hypeChallengerService.getSummary(),
      hypeChallengerService.getReadiness(),
      hypeChallengerService.getCv()
    ])
      .then(([nextSummary, nextReadiness, nextCv]) => {
        setSummary(nextSummary);
        setReadiness(nextReadiness);
        setCv(nextCv);
      })
      .catch(() => {
        setSummary(null);
        setReadiness([]);
        setCv([]);
      });
  }, []);

  const clubOut = useMemo(() => cv.filter((row) => row.protocol === 'leave_one_club_out'), [cv]);

  if (!summary && readiness.length === 0) return null;

  return (
    <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 mb-5">
        <div className="flex items-start gap-2.5">
          <Radio className="w-4 h-4 mt-0.5 text-fuchsia-600 shrink-0" />
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Attention &amp; Hype Challenger v1</h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-3xl">
              Ta warstwa jest oceniana wyłącznie prospektywnie. Nie cofamy dzisiejszych danych medialnych do historycznych checkpointów i nie pokazujemy MAE, dopóki nie ma realnej próbki.
            </p>
          </div>
        </div>
        <span className="inline-flex w-fit items-center rounded-full border border-fuchsia-200 dark:border-fuchsia-900/60 bg-fuchsia-50 dark:bg-fuchsia-950/20 px-2.5 py-1 text-[10px] font-semibold text-fuchsia-700 dark:text-fuchsia-300">
          Prospective only
        </span>
      </div>

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-5">
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
            <p className="text-[10px] uppercase tracking-wide text-zinc-400">Collector v2 rows</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">{summary.collectorSampleRows}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
            <p className="text-[10px] uppercase tracking-wide text-zinc-400">Non-zero events</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">{summary.collectorNonzeroEventCount}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
            <p className="text-[10px] uppercase tracking-wide text-zinc-400">Prospective T‑24h</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">{summary.prospectiveT24Count}</p>
          </div>
          <div className="rounded-lg border border-fuchsia-200 dark:border-fuchsia-900/60 bg-fuchsia-50/40 dark:bg-fuchsia-950/10 p-3">
            <p className="text-[10px] uppercase tracking-wide text-fuchsia-600 dark:text-fuchsia-400">Outcome gate</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-fuchsia-700 dark:text-fuchsia-300">
              {summary.completedMediaEligibleCount}/{summary.promotionGateEventTarget}
            </p>
            <p className="text-[10px] text-fuchsia-600/70 mt-0.5">{summary.completedMediaClubCount}/{summary.promotionGateClubTarget} klubów</p>
          </div>
        </div>
      )}

      {clubOut.length > 0 ? (
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden mb-5">
          <div className="px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950/70 text-[10px] uppercase tracking-wide text-zinc-400">Prospective leave-one-club-out</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-[10px] uppercase tracking-wide text-zinc-400">
                <tr><th className="px-3 py-2 text-left">Feature</th><th className="px-3 py-2 text-right">N</th><th className="px-3 py-2 text-right">Kluby</th><th className="px-3 py-2 text-right">Ticketing MAE</th><th className="px-3 py-2 text-right">Hype MAE</th><th className="px-3 py-2 text-right">Δ</th></tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {clubOut.map((row) => (
                  <tr key={row.featureKey}><td className="px-3 py-2.5 font-medium">{label(row.featureKey)}</td><td className="px-3 py-2.5 text-right">{row.eventCount}</td><td className="px-3 py-2.5 text-right">{row.clubCount}</td><td className="px-3 py-2.5 text-right">{fmt(row.baselineTicketingMae, 1)}</td><td className="px-3 py-2.5 text-right">{fmt(row.challengerMae, 1)}</td><td className="px-3 py-2.5 text-right">{fmt(row.upliftVsTicketing, 1)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/10 p-3.5 mb-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-300"><Activity className="w-4 h-4" />Jeszcze nie liczymy Hype MAE</div>
          <p className="mt-1 text-[11px] leading-relaxed text-amber-700/80 dark:text-amber-300/80">Najpierw musimy zebrać co najmniej 8 zakończonych, prospektywnych eventów T‑24h z 5 klubów oraz niezerową zmienność sygnału. Do tego czasu Hype pozostaje czystym shadow research.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        {readiness.map((row) => (
          <div key={row.featureKey} className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3.5">
            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{label(row.featureKey)}</p>
            <p className="mt-1 text-[10px] uppercase tracking-wide text-zinc-400">{row.readinessStatus.replaceAll('_', ' ')}</p>
            <p className="mt-2 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">{row.reason}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950/60 p-3">
          <div className="flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-200"><ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />Zero backfill leakage</div>
          <p className="mt-1 text-zinc-500">Historyczne checkpointy nie dostaną dzisiejszych media signals. Dataset challengera przyjmuje tylko capture_mode=prospective.</p>
        </div>
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950/60 p-3">
          <div className="flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-200"><Radio className="w-3.5 h-3.5 text-fuchsia-600" />Broad + pair</div>
          <p className="mt-1 text-zinc-500">Broad attention mierzy publikacje o którymkolwiek klubie po mocnych aliasach. Exact pair pozostaje precyzyjnym sygnałem diagnostycznym.</p>
        </div>
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950/60 p-3">
          <div className="flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-200"><Ban className="w-3.5 h-3.5 text-zinc-500" />Brak protez</div>
          <p className="mt-1 text-zinc-500">Brak Google Trends/X/local fan data pozostaje brakiem danych. Nie uzupełniamy go zerami ani nieoficjalnym scrapingiem.</p>
        </div>
      </div>
    </section>
  );
};
