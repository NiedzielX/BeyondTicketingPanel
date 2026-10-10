import React, { useEffect, useState } from 'react';
import { FlaskConical, ShieldCheck } from 'lucide-react';
import { researchService, ResearchReadiness } from '../../services/researchService';

const progress = (value: number, target: number) =>
  target > 0 ? Math.max(0, Math.min(100, (value / target) * 100)) : 0;

const Gate: React.FC<{ label: string; value: number; target: number; met?: boolean }> = ({
  label,
  value,
  target,
  met
}) => (
  <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5">
    <div className="flex items-center justify-between text-xs mb-2">
      <span className="font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
      <span className={`font-semibold tabular-nums ${met ? 'text-emerald-600' : 'text-zinc-900 dark:text-zinc-100'}`}>
        {value} / {target}
      </span>
    </div>
    <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
      <div
        className={`h-full rounded-full ${met ? 'bg-emerald-500' : 'bg-indigo-500'}`}
        style={{ width: `${progress(value, target)}%` }}
      />
    </div>
  </div>
);

export const ResearchReadinessPanel: React.FC = () => {
  const [data, setData] = useState<ResearchReadiness | null>(null);

  useEffect(() => {
    researchService.getReadiness().then(setData).catch(() => setData(null));
  }, []);

  if (!data) return null;

  const status = data.learnedCorrectionGateMet
    ? 'Gotowe do benchmarku live-correction challenger'
    : data.crossClubGateMet
    ? 'Cross-club study gotowe — bez promocji modelu'
    : 'Zbieramy niezależne outcome’y';

  return (
    <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/30 dark:bg-indigo-950/10 p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div className="flex items-start gap-2.5">
          <FlaskConical className="w-4 h-4 mt-0.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Live Signal Research Readiness</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Gate’y badawcze liczone po niezależnych meczach, nie po snapshotach.
            </p>
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1 text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
          <ShieldCheck className="w-3.5 h-3.5" />
          {status}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Gate
          label="Independent outcomes"
          value={data.independentOutcomeEvents}
          target={data.crossClubEventTarget}
          met={data.independentOutcomeEvents >= data.crossClubEventTarget}
        />
        <Gate
          label="Kluby z outcome"
          value={data.clubsWithOutcome}
          target={data.crossClubClubTarget}
          met={data.clubsWithOutcome >= data.crossClubClubTarget}
        />
        <Gate
          label="Live-correction gate"
          value={data.independentOutcomeEvents}
          target={data.learnedCorrectionEventTarget}
          met={data.learnedCorrectionGateMet}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-zinc-500 dark:text-zinc-400">
        <span>Strict study rows: <strong className="text-zinc-700 dark:text-zinc-300">{data.strictStudyRows}</strong></span>
        <span>Modele ze strict rows: <strong className="text-zinc-700 dark:text-zinc-300">{data.modelsWithStrictRows}</strong></span>
        <span>Cross-club gate: <strong className={data.crossClubGateMet ? 'text-emerald-600' : 'text-amber-600'}>{data.crossClubGateMet ? 'spełniony' : 'nie spełniony'}</strong></span>
      </div>
    </div>
  );
};
