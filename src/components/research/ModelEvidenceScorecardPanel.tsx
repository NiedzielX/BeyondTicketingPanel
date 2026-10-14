import React, { useEffect, useState } from 'react';
import { CheckCircle2, CircleDashed, FlaskConical, ShieldCheck, XCircle, Ban } from 'lucide-react';
import {
  EvidenceDecisionStatus,
  EvidenceSignal,
  ModelEvidenceRow,
  ModelEvidenceSummary,
  modelEvidenceScorecardService
} from '../../services/modelEvidenceScorecardService';

const statusLabel = (status: EvidenceDecisionStatus) => {
  switch (status) {
    case 'promotable': return 'Promotable';
    case 'collecting': return 'Collecting';
    case 'rejected': return 'Rejected';
    case 'blocked': return 'Blocked';
  }
};

const statusClass = (status: EvidenceDecisionStatus) => {
  switch (status) {
    case 'promotable': return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-300';
    case 'collecting': return 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/20 dark:text-blue-300';
    case 'rejected': return 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-300';
    case 'blocked': return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-300';
  }
};

const signalLabel = (signal: EvidenceSignal) => {
  switch (signal) {
    case 'positive': return 'Positive evidence';
    case 'negative': return 'Negative evidence';
    case 'mixed': return 'Mixed evidence';
    case 'unproven': return 'Unproven';
  }
};

const StatusIcon = ({ status }: { status: EvidenceDecisionStatus }) => {
  if (status === 'promotable') return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
  if (status === 'rejected') return <XCircle className="h-4 w-4 text-red-500" />;
  if (status === 'blocked') return <Ban className="h-4 w-4 text-amber-500" />;
  return <CircleDashed className="h-4 w-4 text-blue-500" />;
};

const fmt = (value?: number, digits = 1) =>
  value === undefined || Number.isNaN(value)
    ? '—'
    : value.toLocaleString('pl-PL', { minimumFractionDigits: digits, maximumFractionDigits: digits });

const signed = (value?: number) => {
  if (value === undefined || Number.isNaN(value)) return '—';
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toLocaleString('pl-PL', { maximumFractionDigits: 1 })}`;
};

export const ModelEvidenceScorecardPanel: React.FC = () => {
  const [rows, setRows] = useState<ModelEvidenceRow[]>([]);
  const [summary, setSummary] = useState<ModelEvidenceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      modelEvidenceScorecardService.getRows(),
      modelEvidenceScorecardService.getSummary()
    ])
      .then(([nextRows, nextSummary]) => {
        if (!mounted) return;
        setRows(nextRows);
        setSummary(nextSummary);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 text-xs text-zinc-500">Ładowanie Model Evidence Scorecard...</div>;
  }

  if (!rows.length) return null;

  return (
    <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Model Evidence Scorecard v1</h2>
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-4xl">
            Jedna warstwa decyzyjna nad Context Matrix. Research prior mówi, co chcieliśmy badać; ten scorecard mówi, co faktycznie ma dowody. Status Promotable wymaga dodatniego wyniku poza próbą oraz spełnienia promotion gate — sam wysoki prior nie wystarcza.
          </p>
        </div>
        <span className="inline-flex w-fit items-center rounded-full border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50 dark:bg-indigo-950/20 px-2.5 py-1 text-[10px] font-semibold text-indigo-700 dark:text-indigo-300">
          Governance layer · no auto-promotion
        </span>
      </div>

      {summary && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-2.5 mb-4">
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
              <p className="text-[10px] uppercase tracking-wide text-zinc-400">Promotable</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-emerald-600">{summary.promotableCount}</p>
            </div>
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
              <p className="text-[10px] uppercase tracking-wide text-zinc-400">Collecting</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-blue-600">{summary.collectingCount}</p>
            </div>
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
              <p className="text-[10px] uppercase tracking-wide text-zinc-400">Rejected</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-red-600">{summary.rejectedCount}</p>
            </div>
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
              <p className="text-[10px] uppercase tracking-wide text-zinc-400">Blocked</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-amber-600">{summary.blockedCount}</p>
            </div>
            <div className="rounded-lg border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/10 p-3 col-span-2 md:col-span-4 xl:col-span-1">
              <p className="text-[10px] uppercase tracking-wide text-indigo-500">Positive evidence</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-indigo-700 dark:text-indigo-300">{summary.positiveSignalCount}/{summary.categoryCount}</p>
            </div>
          </div>

          <div className="rounded-lg border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/30 dark:bg-indigo-950/10 p-3.5 mb-5">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-800 dark:text-indigo-200">
              <FlaskConical className="w-4 h-4" /> Evidence-backed chain: {summary.currentEvidenceBackedChain}
            </div>
            <p className="mt-1 text-[11px] text-indigo-700/80 dark:text-indigo-300/80">{summary.governanceNote}</p>
          </div>
        </>
      )}

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-950/70 text-[10px] uppercase tracking-wide text-zinc-400">
              <tr>
                <th className="px-3 py-2.5 font-medium">Kategoria</th>
                <th className="px-3 py-2.5 font-medium text-right">Research prior</th>
                <th className="px-3 py-2.5 font-medium">Decyzja</th>
                <th className="px-3 py-2.5 font-medium">Evidence</th>
                <th className="px-3 py-2.5 font-medium text-right">N / kluby</th>
                <th className="px-3 py-2.5 font-medium text-right">Incumbent MAE</th>
                <th className="px-3 py-2.5 font-medium text-right">Challenger MAE</th>
                <th className="px-3 py-2.5 font-medium text-right">Uplift</th>
                <th className="px-3 py-2.5 font-medium">Promotion gate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {rows.map((row) => (
                <tr key={row.categoryKey} className="align-top">
                  <td className="px-3 py-3 min-w-[180px]">
                    <div className="flex items-start gap-2">
                      <StatusIcon status={row.decisionStatus} />
                      <div>
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100">{row.displayName}</p>
                        <p className="mt-0.5 text-[10px] text-zinc-400">{row.candidateKey ?? 'No candidate yet'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">{fmt(row.researchPriorWeightPct, 0)}%</td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusClass(row.decisionStatus)}`}>{statusLabel(row.decisionStatus)}</span>
                  </td>
                  <td className="px-3 py-3 min-w-[130px]">
                    <p className="font-medium text-zinc-700 dark:text-zinc-200">{signalLabel(row.evidenceSignal)}</p>
                    <p className="mt-0.5 text-[10px] text-zinc-400">{row.primaryProtocol?.replaceAll('_', ' ') ?? '—'}</p>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums whitespace-nowrap text-zinc-600 dark:text-zinc-300">
                    {row.validationEventCount ?? 0}{row.validationClubCount !== undefined ? ` / ${row.validationClubCount}` : ''}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-zinc-600 dark:text-zinc-300">{fmt(row.incumbentMae)}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-zinc-600 dark:text-zinc-300">{fmt(row.challengerMae)}</td>
                  <td className={`px-3 py-3 text-right font-semibold tabular-nums ${row.upliftVsIncumbent !== undefined && row.upliftVsIncumbent > 0 ? 'text-emerald-600' : row.upliftVsIncumbent !== undefined && row.upliftVsIncumbent < 0 ? 'text-red-600' : 'text-zinc-400'}`}>{signed(row.upliftVsIncumbent)}</td>
                  <td className="px-3 py-3 min-w-[175px]">
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1.5">
                      <span>{row.promotionEvidenceCount}/{row.promotionEventTarget} eventów</span>
                      <span>{fmt(row.promotionProgressPct, 0)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.min(100, Math.max(0, row.promotionProgressPct))}%` }} />
                    </div>
                    {row.promotionClubTarget !== undefined && <p className="mt-1 text-[10px] text-zinc-400">Club gate: ≥{row.promotionClubTarget}</p>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
        {rows.map((row) => (
          <div key={`${row.categoryKey}-decision`} className="rounded-lg bg-zinc-50 dark:bg-zinc-950/60 p-3.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{row.displayName}</p>
              <span className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold ${statusClass(row.decisionStatus)}`}>{statusLabel(row.decisionStatus)}</span>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-300">{row.decisionReason}</p>
            <p className="mt-2 text-[10px] leading-relaxed text-zinc-400"><span className="font-semibold text-zinc-500 dark:text-zinc-300">Next:</span> {row.nextAction}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 text-[10px] leading-relaxed text-zinc-500">
        <span className="font-semibold text-zinc-700 dark:text-zinc-300">Interpretacja:</span> dodatni uplift oznacza niższy MAE challengera od aktualnego incumbenta. Progress bar mierzy wyłącznie dojrzałość próbki względem promotion gate — nie jest syntetycznym „score jakości modelu”.
      </div>
    </section>
  );
};
