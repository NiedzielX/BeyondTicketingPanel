import React, { useEffect, useMemo, useState } from 'react';
import { Beaker, CheckCircle2, Database, ShieldCheck } from 'lucide-react';
import {
  ContextAblationRow,
  ContextSnapshotReadiness,
  contextEvaluationService
} from '../../services/contextEvaluationService';

const fmt = (value?: number, digits = 0) =>
  value === undefined ? '—' : value.toLocaleString('pl-PL', { maximumFractionDigits: digits, minimumFractionDigits: digits });

export const ContextEvaluationPanel: React.FC = () => {
  const [readiness, setReadiness] = useState<ContextSnapshotReadiness[]>([]);
  const [ablation, setAblation] = useState<ContextAblationRow[]>([]);

  useEffect(() => {
    Promise.all([
      contextEvaluationService.getSnapshotReadiness(),
      contextEvaluationService.getAblationMatrix()
    ])
      .then(([nextReadiness, nextAblation]) => {
        setReadiness(nextReadiness);
        setAblation(nextAblation);
      })
      .catch(() => {
        setReadiness([]);
        setAblation([]);
      });
  }, []);

  const totalProspective = useMemo(
    () => readiness.reduce((sum, row) => sum + row.prospectiveCount, 0),
    [readiness]
  );
  const totalOutcomePairs = useMemo(
    () => readiness.reduce((sum, row) => sum + row.outcomePairedCount, 0),
    [readiness]
  );

  if (readiness.length === 0 && ablation.length === 0) return null;

  return (
    <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 mb-5">
        <div className="flex items-start gap-2.5">
          <Beaker className="w-4 h-4 mt-0.5 text-indigo-600 shrink-0" />
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Context Snapshot & Ablation v1</h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-3xl">
              Zamrażamy stan danych na T‑7d, T‑3d, T‑24h i T‑6h. Po meczu porównujemy tylko realnie wygenerowane warianty prognozy na tej samej grupie eventów.
            </p>
          </div>
        </div>
        <span className="inline-flex w-fit items-center rounded-full border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
          Leakage-safe snapshots
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-5">
        {readiness.map((row) => (
          <div key={row.checkpointCode} className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
            <p className="text-[10px] uppercase tracking-wide text-zinc-400">{row.checkpointCode}</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">{row.capturedCount}/{row.dueEventCount}</p>
            <p className="mt-0.5 text-[10px] text-zinc-500">snapshoty · baseline {row.baselineReadyCount} · outcome {row.outcomePairedCount}</p>
          </div>
        ))}
      </div>

      {totalProspective === 0 && (
        <div className="mb-5 rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/10 p-3.5 text-[11px] text-blue-800 dark:text-blue-300">
          Pierwszy bootstrap jest retrospektywny point-in-time. To poprawne: używa wyłącznie danych, które faktycznie istniały przed checkpointem. Prospektywne snapshoty zaczną rosnąć przy kolejnych checkpointach przyszłych meczów.
        </div>
      )}

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden mb-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-950/70 text-[10px] uppercase tracking-wide text-zinc-400">
              <tr>
                <th className="px-3 py-2.5 font-medium">Checkpoint</th>
                <th className="px-3 py-2.5 font-medium">Wariant</th>
                <th className="px-3 py-2.5 font-medium text-right">Eventy</th>
                <th className="px-3 py-2.5 font-medium text-right">Kluby</th>
                <th className="px-3 py-2.5 font-medium text-right">MAE</th>
                <th className="px-3 py-2.5 font-medium text-right">Δ vs baseline</th>
                <th className="px-3 py-2.5 font-medium text-right">Bias</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {ablation.map((row) => (
                <tr key={`${row.checkpointCode}-${row.variantKey}`}>
                  <td className="px-3 py-3 font-medium text-zinc-700 dark:text-zinc-300">{row.checkpointCode}</td>
                  <td className="px-3 py-3 min-w-[190px]">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">{row.displayName}</p>
                    <p className="mt-0.5 text-[10px] text-zinc-400">{row.description}</p>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-zinc-600 dark:text-zinc-300">{row.eventCount}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-zinc-600 dark:text-zinc-300">{row.clubCount}</td>
                  <td className="px-3 py-3 text-right tabular-nums font-medium text-zinc-900 dark:text-zinc-100">{fmt(row.variantMae, 1)}</td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {row.maeUplift === undefined ? (
                      <span className="text-zinc-400">—</span>
                    ) : (
                      <span className={row.maeUplift > 0 ? 'text-emerald-600' : row.maeUplift < 0 ? 'text-red-600' : 'text-zinc-500'}>
                        {row.maeUplift > 0 ? '+' : ''}{fmt(row.maeUplift, 1)}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-zinc-600 dark:text-zinc-300">{fmt(row.variantBias, 1)}</td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {row.evaluationStatus === 'evaluated' ? (
                      <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-300">Policzone</span>
                    ) : (
                      <span className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-medium text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">Brak predykcji</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950/60 p-3 text-zinc-600 dark:text-zinc-300">
          <div className="flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-200"><ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />Bez leakage</div>
          <p className="mt-1 text-zinc-500">Context musi być observed, created i source-observed przed checkpointem. Później dodany fakt nie może zostać cofnięty.</p>
        </div>
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950/60 p-3 text-zinc-600 dark:text-zinc-300">
          <div className="flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-200"><Database className="w-3.5 h-3.5 text-indigo-600" />{totalOutcomePairs} par snapshot–outcome</div>
          <p className="mt-1 text-zinc-500">Outcome pair nie oznacza automatycznie gotowości do ablation — wariant musi mieć własną P50.</p>
        </div>
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950/60 p-3 text-zinc-600 dark:text-zinc-300">
          <div className="flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-200"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />Fair comparison</div>
          <p className="mt-1 text-zinc-500">MAE wariantu i baseline są liczone na dokładnie tych samych eventach, więc różnica nie wynika ze zmiany próbki.</p>
        </div>
      </div>
    </section>
  );
};
