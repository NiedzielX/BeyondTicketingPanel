import React, { useEffect, useState } from 'react';
import { Archive, CheckCircle2, Clock3, LockKeyhole, ShieldCheck, XCircle } from 'lucide-react';
import {
  PromotionGovernanceSummary,
  PromotionPackageRow,
  PromotionReviewStatus,
  modelPromotionGovernanceService
} from '../../services/modelPromotionGovernanceService';

const statusLabel = (status: PromotionReviewStatus) => {
  switch (status) {
    case 'ready_for_review': return 'Ready for review';
    case 'approved_for_promotion': return 'Approved for promotion';
    case 'rejected': return 'Rejected';
    case 'superseded': return 'Superseded';
  }
};

const statusClass = (status: PromotionReviewStatus) => {
  switch (status) {
    case 'ready_for_review': return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-300';
    case 'approved_for_promotion': return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-300';
    case 'rejected': return 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-300';
    case 'superseded': return 'border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300';
  }
};

const fmt = (value?: number, digits = 1) => value === undefined
  ? '—'
  : value.toLocaleString('pl-PL', { minimumFractionDigits: digits, maximumFractionDigits: digits });

const signed = (value?: number) => {
  if (value === undefined) return '—';
  return `${value > 0 ? '+' : ''}${fmt(value)}`;
};

export const ModelPromotionGovernancePanel: React.FC = () => {
  const [summary, setSummary] = useState<PromotionGovernanceSummary | null>(null);
  const [packages, setPackages] = useState<PromotionPackageRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      modelPromotionGovernanceService.getSummary(),
      modelPromotionGovernanceService.getPackages()
    ])
      .then(([nextSummary, nextPackages]) => {
        if (!mounted) return;
        setSummary(nextSummary);
        setPackages(nextPackages);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 text-xs text-zinc-500">Ładowanie promotion governance...</div>;
  }

  if (!summary) return null;

  return (
    <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <LockKeyhole className="h-4 w-4 text-indigo-600" />
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Promotion Governance v1</h2>
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-4xl">
            Przekroczenie evidence gate nie zmienia P50. System zamraża pełny evidence package i ustawia go jako Ready for review. Dopiero osobna, audytowalna decyzja może oznaczyć kandydat jako Approved for promotion — nadal bez automatycznej aktywacji produkcyjnej.
          </p>
        </div>
        <span className="inline-flex w-fit items-center rounded-full border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50 dark:bg-indigo-950/20 px-2.5 py-1 text-[10px] font-semibold text-indigo-700 dark:text-indigo-300">
          Human gate required
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 mb-5">
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
          <p className="text-[10px] uppercase tracking-wide text-zinc-400">Ready for review</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-amber-600">{summary.readyForReviewCount}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
          <p className="text-[10px] uppercase tracking-wide text-zinc-400">Approved</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-emerald-600">{summary.approvedCount}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
          <p className="text-[10px] uppercase tracking-wide text-zinc-400">Rejected</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-red-600">{summary.rejectedCount}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
          <p className="text-[10px] uppercase tracking-wide text-zinc-400">Superseded</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-zinc-600 dark:text-zinc-300">{summary.supersededCount}</p>
        </div>
        <div className="rounded-lg border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/10 p-3 col-span-2 md:col-span-1">
          <p className="text-[10px] uppercase tracking-wide text-indigo-500">Frozen packages</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-indigo-700 dark:text-indigo-300">{summary.totalPackages}</p>
        </div>
      </div>

      {summary.nearestDisplayName && summary.nearestEventTarget !== undefined && (
        <div className="rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/10 p-3.5 mb-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-800 dark:text-blue-200">
              <Clock3 className="h-4 w-4" /> Najbliżej review gate: {summary.nearestDisplayName}
            </div>
            <span className="text-xs font-bold tabular-nums text-blue-700 dark:text-blue-300">
              {summary.nearestEvidenceCount ?? 0}/{summary.nearestEventTarget} · {fmt(summary.nearestProgressPct, 0)}%
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-blue-100 dark:bg-blue-950/50">
            <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min(100, Math.max(0, summary.nearestProgressPct ?? 0))}%` }} />
          </div>
          <p className="mt-2 text-[11px] text-blue-700/80 dark:text-blue-300/80">
            Evidence: {summary.nearestEvidenceSignal ?? 'unproven'}. Pakiet zostanie utworzony dopiero po spełnieniu pełnego gate’u i pozytywnym wyniku challengera.
          </p>
        </div>
      )}

      {packages.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 p-4 mb-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            <Archive className="h-4 w-4 text-zinc-500" /> Brak frozen candidate packages
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
            To jest poprawny stan. Żaden sygnał nie przekroczył jeszcze pełnego promotion gate’u. Scorecard może pokazywać positive evidence wcześniej, ale governance nie tworzy pakietu do review przed 100% gate.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden mb-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-950/70 text-[10px] uppercase tracking-wide text-zinc-400">
                <tr>
                  <th className="px-3 py-2.5 font-medium">Kategoria</th>
                  <th className="px-3 py-2.5 font-medium">Kandydat</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-3 py-2.5 font-medium text-right">N / kluby</th>
                  <th className="px-3 py-2.5 font-medium text-right">Incumbent MAE</th>
                  <th className="px-3 py-2.5 font-medium text-right">Candidate MAE</th>
                  <th className="px-3 py-2.5 font-medium text-right">Uplift</th>
                  <th className="px-3 py-2.5 font-medium">Frozen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {packages.map((pkg) => (
                  <tr key={pkg.id} className="align-top">
                    <td className="px-3 py-3 font-semibold text-zinc-900 dark:text-zinc-100">{pkg.displayName}</td>
                    <td className="px-3 py-3 min-w-[180px]">
                      <p className="font-medium text-zinc-700 dark:text-zinc-200">{pkg.candidateKey}</p>
                      <p className="mt-0.5 text-[10px] text-zinc-400">{pkg.primaryProtocol.replaceAll('_', ' ')}</p>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusClass(pkg.reviewStatus)}`}>{statusLabel(pkg.reviewStatus)}</span>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums whitespace-nowrap text-zinc-600 dark:text-zinc-300">{pkg.validationEventCount}{pkg.validationClubCount !== undefined ? ` / ${pkg.validationClubCount}` : ''}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-zinc-600 dark:text-zinc-300">{fmt(pkg.incumbentMae)}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-zinc-600 dark:text-zinc-300">{fmt(pkg.challengerMae)}</td>
                    <td className={`px-3 py-3 text-right font-semibold tabular-nums ${pkg.upliftVsIncumbent > 0 ? 'text-emerald-600' : 'text-red-600'}`}>{signed(pkg.upliftVsIncumbent)}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-[10px] text-zinc-500">{new Date(pkg.frozenAt).toLocaleString('pl-PL')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950/60 p-3">
          <div className="flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-200"><ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />Frozen evidence</div>
          <p className="mt-1 text-zinc-500">Metryki, protocol, sample size i supporting evidence są zamrażane przy utworzeniu pakietu. Późniejsze refresh’e nie przepisują historii.</p>
        </div>
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950/60 p-3">
          <div className="flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-200"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />Manual approval</div>
          <p className="mt-1 text-zinc-500">Akceptacja jest osobną decyzją z reviewerem, timestampem i notatką. Dashboard pozostaje read-only.</p>
        </div>
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950/60 p-3">
          <div className="flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-200"><XCircle className="h-3.5 w-3.5 text-red-500" />No auto activation</div>
          <p className="mt-1 text-zinc-500">Nawet status Approved for promotion nie zmienia forecastu. Pole auto activation jest wymuszone na false na poziomie bazy.</p>
        </div>
      </div>

      <p className="mt-4 text-[10px] text-zinc-400">{summary.governanceNote}</p>
    </section>
  );
};
