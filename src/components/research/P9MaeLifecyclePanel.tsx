import React, { useEffect, useState } from 'react';
import { Activity, LockKeyhole, ShieldCheck } from 'lucide-react';
import {
  P9MaeLifecycle,
  p9MaeLifecycleService
} from '../../services/p9MaeLifecycleService';
import { formatNumber, formatPercent } from '../../utils/formatters';

const valueOrDash = (value: number | undefined, suffix = '') =>
  value === undefined ? '—' : `${formatNumber(value)}${suffix}`;

const Metric: React.FC<{ label: string; value: React.ReactNode; note: string }> = ({ label, value, note }) => (
  <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5">
    <div className="text-[10px] uppercase tracking-wide text-zinc-400">{label}</div>
    <div className="mt-1 text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">{value}</div>
    <div className="mt-1 text-[10px] leading-relaxed text-zinc-500 dark:text-zinc-400">{note}</div>
  </div>
);

export const P9MaeLifecyclePanel: React.FC = () => {
  const [data, setData] = useState<P9MaeLifecycle | null>(null);

  useEffect(() => {
    p9MaeLifecycleService.getStatus().then(setData).catch(() => setData(null));
  }, []);

  if (!data) return null;

  const delta = data.deltaEventBalancedMae;
  const deltaLabel = delta === undefined ? '—' : `${delta > 0 ? '+' : ''}${formatNumber(delta)}`;
  const deltaNote = delta === undefined
    ? 'Brak wyniku do czasu pojawienia się genuine scored events.'
    : delta < 0
      ? 'Challenger ma niższy event-balanced MAE niż incumbent.'
      : 'Challenger nie poprawia event-balanced MAE względem incumbent.';

  const productionSafe =
    !data.productionActivationAllowed && !data.productionChange && data.liveAdjustment === 0;

  return (
    <section className="rounded-xl border border-violet-200 dark:border-violet-900/60 bg-violet-50/30 dark:bg-violet-950/10 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-2.5">
          <Activity className="mt-0.5 h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" />
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              P9 — walidacja prospective booking curve
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              North Star: niższy prospective event-balanced MAE. Readiness i liczba prognoz są tylko etapami dojścia do wyniku.
            </p>
          </div>
        </div>

        <div className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-medium ${
          productionSafe
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-300'
            : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-300'
        }`}>
          <ShieldCheck className="h-3.5 w-3.5" />
          {productionSafe ? 'Research only · produkcja OFF' : 'Sprawdź production gate'}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Metric
          label="Historyczny P9"
          value="NOT EVALUABLE"
          note={`${data.historicalSupportReadyTargetsT24}/${data.historicalComparatorTargetsT24} T-24 · ${data.historicalSupportReadyTargetsT48}/${data.historicalComparatorTargetsT48} T-48 support-ready. Attendance labels nie zostały otwarte.`}
        />
        <Metric
          label="Prospective predictions"
          value={data.prospectivePredictionEvents}
          note={`${data.prospectivePredictionRows} immutable prediction rows. Brak prognozy poza zamrożonym T-48/T-24 window.`}
        />
        <Metric
          label="Scored events"
          value={data.prospectiveScoredEvents}
          note="Tylko mecze z genuine outcome mogą wejść do oceny challengera."
        />
        <Metric
          label="Δ event-balanced MAE"
          value={deltaLabel}
          note={deltaNote}
        />
        <Metric
          label="Event improvement rate"
          value={data.eventImprovementRate === undefined ? '—' : formatPercent(data.eventImprovementRate * 100)}
          note={data.worstEventDegradation === undefined
            ? 'Pojawi się dopiero po score’owaniu prospective events.'
            : `Worst event degradation: ${formatNumber(data.worstEventDegradation)}.`}
        />
      </div>

      <div className="mt-3 grid gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 md:grid-cols-3">
        <div className="rounded-md border border-zinc-200/80 dark:border-zinc-800 px-3 py-2">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">Incumbent MAE:</span>{' '}
          {valueOrDash(data.incumbentEventBalancedMae)}
        </div>
        <div className="rounded-md border border-zinc-200/80 dark:border-zinc-800 px-3 py-2">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">Challenger MAE:</span>{' '}
          {valueOrDash(data.challengerEventBalancedMae)}
        </div>
        <div className="flex items-center gap-1.5 rounded-md border border-zinc-200/80 dark:border-zinc-800 px-3 py-2">
          <LockKeyhole className="h-3.5 w-3.5" />
          live_adjustment = {formatNumber(data.liveAdjustment)} · activation = {data.productionActivationAllowed ? 'ON' : 'OFF'}
        </div>
      </div>

      <details className="mt-3 text-[10px] text-zinc-400">
        <summary className="cursor-pointer">Pokaż status techniczny</summary>
        <p className="mt-1 font-mono break-all">
          {data.historicalStatus} · {data.prospectiveEvidenceStatus} · {data.version}
        </p>
      </details>
    </section>
  );
};
