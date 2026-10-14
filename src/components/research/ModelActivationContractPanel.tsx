import React, { useEffect, useState } from 'react';
import { Activity, LockKeyhole, RotateCcw, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import {
  ActivationContractRow,
  ActivationSummary,
  modelActivationContractService
} from '../../services/modelActivationContractService';

const fmt = (value: number, digits = 0) =>
  value.toLocaleString('pl-PL', { minimumFractionDigits: digits, maximumFractionDigits: digits });

export const ModelActivationContractPanel: React.FC = () => {
  const [summary, setSummary] = useState<ActivationSummary | null>(null);
  const [contracts, setContracts] = useState<ActivationContractRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      modelActivationContractService.getSummary(),
      modelActivationContractService.getContracts()
    ])
      .then(([nextSummary, nextContracts]) => {
        if (!mounted) return;
        setSummary(nextSummary);
        setContracts(nextContracts);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 text-xs text-zinc-500">Ładowanie Production Activation Contract...</div>;
  }

  if (!summary) return null;

  return (
    <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Production Activation Contract v1</h2>
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-4xl">
            Ostatnia bariera przed wpływem modelu na P50. Approved for promotion tworzy dopiero kontrakt operacyjny z bounded adjustment, fallbackiem do championa, monitoringiem i kill switchem. Contract v1 nie jest podłączony do forecast writera i nie może włączyć execution.
          </p>
        </div>
        <span className="inline-flex w-fit items-center rounded-full border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
          Fail closed · execution disabled
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 mb-5">
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
          <p className="text-[10px] uppercase tracking-wide text-zinc-400">Approved packages</p>
          <p className="mt-1 text-xl font-bold tabular-nums">{summary.approvedPromotionPackages}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
          <p className="text-[10px] uppercase tracking-wide text-zinc-400">Contracts</p>
          <p className="mt-1 text-xl font-bold tabular-nums">{summary.contractCount}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
          <p className="text-[10px] uppercase tracking-wide text-zinc-400">Ready</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-blue-600">{summary.readyCount}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
          <p className="text-[10px] uppercase tracking-wide text-zinc-400">Activation approved</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-amber-600">{summary.activationApprovedCount}</p>
        </div>
        <div className="rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50/40 dark:bg-red-950/10 p-3 col-span-2 md:col-span-1">
          <p className="text-[10px] uppercase tracking-wide text-red-500">Execution enabled</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-red-700 dark:text-red-300">{summary.anyExecutionEnabled ? 'YES' : 'NO'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5 mb-5">
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950/60 p-3">
          <p className="text-[10px] uppercase tracking-wide text-zinc-400">Max correction</p>
          <p className="mt-1 text-lg font-bold">±{fmt(summary.defaultMaxAbsAdjustmentPct)}%</p>
        </div>
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950/60 p-3">
          <p className="text-[10px] uppercase tracking-wide text-zinc-400">Input stale after</p>
          <p className="mt-1 text-lg font-bold">{summary.defaultMaxInputStalenessMinutes} min</p>
        </div>
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950/60 p-3">
          <p className="text-[10px] uppercase tracking-wide text-zinc-400">Monitor window</p>
          <p className="mt-1 text-lg font-bold">{summary.defaultMonitorWindowEvents} events</p>
        </div>
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950/60 p-3">
          <p className="text-[10px] uppercase tracking-wide text-zinc-400">Max MAE ratio</p>
          <p className="mt-1 text-lg font-bold">{summary.defaultMaxMaeRatioToChampion.toFixed(2)}×</p>
        </div>
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950/60 p-3">
          <p className="text-[10px] uppercase tracking-wide text-zinc-400">Consecutive worse</p>
          <p className="mt-1 text-lg font-bold">{summary.defaultMaxConsecutiveWorseOutcomes}</p>
        </div>
      </div>

      {contracts.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 p-4 mb-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            <LockKeyhole className="w-4 h-4 text-zinc-500" /> Brak production activation contracts
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
            To jest oczekiwany stan. Kontrakt powstanie dopiero dla frozen promotion package, który został manualnie oznaczony jako Approved for promotion. Obecnie żadna kategoria nie doszła do tego etapu.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden mb-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-950/70 text-[10px] uppercase tracking-wide text-zinc-400">
                <tr>
                  <th className="px-3 py-2.5 text-left">Category</th>
                  <th className="px-3 py-2.5 text-left">Candidate → Champion</th>
                  <th className="px-3 py-2.5 text-left">Status</th>
                  <th className="px-3 py-2.5 text-right">Max correction</th>
                  <th className="px-3 py-2.5 text-right">Staleness</th>
                  <th className="px-3 py-2.5 text-left">Writer</th>
                  <th className="px-3 py-2.5 text-left">Execution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {contracts.map((contract) => (
                  <tr key={contract.id}>
                    <td className="px-3 py-3 font-semibold">{contract.categoryKey}</td>
                    <td className="px-3 py-3 min-w-[240px]">
                      <p className="font-medium">{contract.candidateKey}</p>
                      <p className="mt-0.5 text-[10px] text-zinc-400">champion: {contract.championModelKey}</p>
                    </td>
                    <td className="px-3 py-3">{contract.contractStatus.replaceAll('_', ' ')}</td>
                    <td className="px-3 py-3 text-right tabular-nums">±{fmt(contract.maxAbsAdjustmentPct)}%</td>
                    <td className="px-3 py-3 text-right tabular-nums">{contract.maxInputStalenessMinutes}m</td>
                    <td className="px-3 py-3">{contract.writerBindingStatus.replaceAll('_', ' ')}</td>
                    <td className={`px-3 py-3 font-semibold ${contract.executionEnabled ? 'text-red-600' : 'text-emerald-600'}`}>{contract.executionEnabled ? 'ENABLED' : 'DISABLED'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-[11px]">
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950/60 p-3">
          <div className="flex items-center gap-1.5 font-medium"><SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />Bounded overlay</div>
          <p className="mt-1 text-zinc-500">Pierwsza wersja może korygować tylko T‑24h i maksymalnie o ±10% względem championa.</p>
        </div>
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950/60 p-3">
          <div className="flex items-center gap-1.5 font-medium"><ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />Fail closed</div>
          <p className="mt-1 text-zinc-500">Brak, błąd lub dane starsze niż 45 min oznaczają fallback do championa, nie zgadywanie.</p>
        </div>
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950/60 p-3">
          <div className="flex items-center gap-1.5 font-medium"><Activity className="w-3.5 h-3.5 text-blue-600" />Health monitor</div>
          <p className="mt-1 text-zinc-500">Po outcome’ach challenger jest porównywany równolegle z championem na rolling 5-event window.</p>
        </div>
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950/60 p-3">
          <div className="flex items-center gap-1.5 font-medium"><RotateCcw className="w-3.5 h-3.5 text-red-500" />Kill switch</div>
          <p className="mt-1 text-zinc-500">Alert po MAE &gt;105% championa lub 3 kolejnych gorszych outcome’ach. Rollback target = champion immediate.</p>
        </div>
      </div>

      <p className="mt-4 text-[10px] text-zinc-400">{summary.governanceNote}</p>
    </section>
  );
};
