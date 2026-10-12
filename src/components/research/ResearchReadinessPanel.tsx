import React, { useEffect, useState } from 'react';
import { FlaskConical, ShieldCheck } from 'lucide-react';
import { researchService, ResearchReadiness } from '../../services/researchService';

const progress = (value: number, target: number) =>
  target > 0 ? Math.max(0, Math.min(100, (value / target) * 100)) : 0;

const Gate: React.FC<{ label: string; value: number; target: number; met?: boolean; note?: string }> = ({ label, value, target, met, note }) => (
  <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5">
    <div className="flex items-center justify-between text-xs mb-2">
      <span className="font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
      <span className={`font-semibold tabular-nums ${met ? 'text-emerald-600' : 'text-zinc-900 dark:text-zinc-100'}`}>{value} / {target}</span>
    </div>
    <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
      <div className={`h-full rounded-full ${met ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${progress(value, target)}%` }} />
    </div>
    {note && <div className="mt-2 text-[10px] text-zinc-400">{note}</div>}
  </div>
);

export const ResearchReadinessPanel: React.FC = () => {
  const [data, setData] = useState<ResearchReadiness | null>(null);

  useEffect(() => {
    researchService.getReadiness().then(setData).catch(() => setData(null));
  }, []);

  if (!data) return null;

  const status = data.learnedCorrectionGateMet
    ? 'Mamy wystarczająco dużo meczów, żeby zacząć kolejny test modelu.'
    : data.crossClubGateMet
    ? 'Mamy dość danych do badania wielu klubów, ale jeszcze nie do uczenia korekty live.'
    : 'Brakuje jeszcze części meczów do pełnego badania wielu klubów.';

  return (
    <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/30 dark:bg-indigo-950/10 p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div className="flex items-start gap-2.5">
          <FlaskConical className="w-4 h-4 mt-0.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Czy mamy już dość danych, żeby ulepszać model?</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Liczymy zakończone mecze z poprawnymi danymi, a nie liczbę pojedynczych odczytów.</p>
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1 text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
          <ShieldCheck className="w-3.5 h-3.5" />{status}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Gate label="Mecze gotowe do badania" value={data.crossClubStudyEvents} target={data.crossClubEventTarget} met={data.crossClubGateMet} note={`${data.strictStudyRows} poprawnych punktów porównawczych`} />
        <Gate label="Różne kluby w próbie" value={data.crossClubStudyClubs} target={data.crossClubClubTarget} met={data.crossClubStudyClubs >= data.crossClubClubTarget} note={`${data.outcomeClubsTotal} klubów ma już zweryfikowaną frekwencję`} />
        <Gate label="Mecze do uczenia korekty live" value={data.independentOutcomeEventsTotal} target={data.learnedCorrectionEventTarget} met={data.learnedCorrectionGateMet} note="Po osiągnięciu celu robimy kolejny test — bez automatycznego wdrożenia" />
      </div>

      <div className="mt-3 text-[11px] text-zinc-500 dark:text-zinc-400">
        Mamy <strong className="text-zinc-700 dark:text-zinc-300">{data.independentOutcomeEventsTotal}</strong> zakończonych meczów z potwierdzoną frekwencją. Z nich <strong className="text-zinc-700 dark:text-zinc-300">{data.crossClubStudyEvents}</strong> spełnia wszystkie warunki potrzebne do obecnego badania cross-club.
      </div>

      <details className="mt-3 text-[10px] text-zinc-400">
        <summary className="cursor-pointer">Pokaż nazwy techniczne</summary>
        <p className="mt-1">Cross-club study v2 · strict canonical rows · learned correction evidence gate.</p>
      </details>
    </div>
  );
};
