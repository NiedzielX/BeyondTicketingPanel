import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Crosshair, ShieldCheck } from 'lucide-react';
import { P9MaeStatus, p9MaeStatusService } from '../../services/p9MaeStatusService';

const number = (value?: number) =>
  value === undefined || Number.isNaN(value) ? '—' : Math.round(value).toLocaleString('pl-PL');

const deltaLabel = (value?: number) => {
  if (value === undefined) return '—';
  const rounded = Math.round(value).toLocaleString('pl-PL');
  return `${value > 0 ? '+' : ''}${rounded}`;
};

const attemptTime = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('pl-PL');
};

export const P9MaeStatusPanel: React.FC = () => {
  const [data, setData] = useState<P9MaeStatus | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    p9MaeStatusService
      .getStatus()
      .then((status) => setData(status))
      .catch(() => setFailed(true));
  }, []);

  if (failed) {
    return (
      <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/10 p-4 text-xs text-rose-800 dark:text-rose-300">
        Nie udało się pobrać kanonicznego statusu P9. Nie zastępujemy go starszym licznikiem readiness.
      </div>
    );
  }

  if (!data) return null;

  const hasMaeEvidence =
    data.prospectiveScoredEvents > 0 &&
    data.incumbentEventBalancedMae !== undefined &&
    data.challengerEventBalancedMae !== undefined &&
    data.deltaEventBalancedMae !== undefined;

  const improvesMae = hasMaeEvidence && (data.deltaEventBalancedMae ?? 0) < 0;
  const hasAttempts = data.prospectiveAttemptRows > 0;
  const hasFailClosedSupport = data.prospectiveSupportInsufficientAttempts > 0;
  const hasMissingIncumbent = data.prospectiveNoTargetIncumbentAttempts > 0;
  const hasReadyPrediction = data.prospectivePredictionReadyAttempts > 0;

  const prospectiveState = !hasAttempts
    ? 'WAITING FOR FIRST WINDOW'
    : hasReadyPrediction
      ? 'IMMUTABLE WINDOW CAPTURED'
      : hasFailClosedSupport
        ? 'WINDOW CAPTURED · SUPPORT INSUFFICIENT'
        : hasMissingIncumbent
          ? 'WINDOW CAPTURED · NO INCUMBENT'
          : data.prospectiveEvidenceStatus;

  const prospectiveNote = !hasAttempts
    ? 'Pierwsze immutable T-48/T-24 window jeszcze nie zostało przechwycone. 0 predykcji nie jest wynikiem MAE.'
    : data.prospectivePredictionRows === 0 && hasFailClosedSupport
      ? 'Okno zostało przechwycone poprawnie, ale frozen learner nie miał minimum 3 PIT-safe residual references. To kontrolowany fail-closed, nie wynik MAE.'
      : data.prospectivePredictionRows === 0 && hasMissingIncumbent
        ? 'Okno zostało przechwycone, ale nie było PIT-safe incumbent forecastu dla targetu. Nie powstała challenger prediction.'
        : data.prospectiveScoredEvents === 0
          ? 'Immutable prediction została zapisana. Czekamy na genuine outcome; do tego momentu nie ma prospective ΔMAE.'
          : 'Mamy genuine prospective scored events. North Star poniżej pokazuje event-balanced challenger MAE vs incumbent.';

  const hasFallbackMaeEvidence =
    data.fallbackScoredEvents > 0 &&
    data.fallbackIncumbentEventBalancedMae !== undefined &&
    data.fallbackChallengerEventBalancedMae !== undefined &&
    data.fallbackDeltaEventBalancedMae !== undefined;

  const fallbackImprovesMae = hasFallbackMaeEvidence && (data.fallbackDeltaEventBalancedMae ?? 0) < 0;

  const fallbackState = data.fallbackAttemptRows === 0
    ? 'WAITING FOR FIRST POST-PRECOMMIT WINDOW'
    : data.fallbackReadyAttempts > 0
      ? 'FALLBACK PREDICTION CAPTURED'
      : data.fallbackV1CoveredAttempts > 0
        ? 'V1 COVERED · NO FALLBACK NEEDED'
        : data.fallbackSupportInsufficientAttempts > 0
          ? 'FALLBACK SUPPORT INSUFFICIENT'
          : 'CAPTURED';

  const fallbackNote = data.fallbackAttemptRows === 0
    ? 'v2 nie backfilluje event443. Pierwsza próba może powstać dopiero w genuine window po precommit. Zero jest teraz oczekiwanym stanem.'
    : data.fallbackReadyAttempts > 0 && data.fallbackScoredEvents === 0
      ? 'v1 nie miał wystarczającego D2 supportu, a te same frozen neighbors miały >=3 Structural residuals. Prediction jest immutable; czekamy na genuine outcome.'
      : data.fallbackV1CoveredAttempts > 0 && data.fallbackPredictionRows === 0
        ? 'v1 miał >=3 usable same-family references, więc zgodnie z kontraktem v2 nie wygenerował duplikatu.'
        : data.fallbackSupportInsufficientAttempts > 0 && data.fallbackPredictionRows === 0
          ? 'Ani frozen v1 family, ani dozwolony Structural fallback nie osiągnęły minimum 3 refs. v2 poprawnie fail-closed.'
          : hasFallbackMaeEvidence
            ? 'To jest wyłącznie MAE na fallback-only eventach. Nie łączymy tego wyniku z v1 ani z produkcyjnym P50.'
            : 'v2 pozostaje osobnym evidence lane. Nie jest używany do produkcyjnej prognozy.';

  return (
    <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/20 dark:bg-indigo-950/10 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-2.5">
          <Crosshair className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">P9 · North Star: prospective event-balanced MAE</h2>
            <p className="mt-0.5 max-w-3xl text-xs text-zinc-500 dark:text-zinc-400">
              Readiness mówi, czy możemy wykonać test. Sukces modelu mierzymy dopiero przez ΔMAE na nieznanych wcześniej outcome'ach.
            </p>
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 self-start rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
          <ShieldCheck className="h-3.5 w-3.5" />
          Production OFF · live adjustment {data.liveAdjustment}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/60 dark:bg-amber-950/10">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Historyczny P9 v1</div>
              <div className="mt-1 text-[11px] font-medium text-amber-700 dark:text-amber-300">NOT EVALUABLE</div>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
            <div><span className="text-zinc-500">T-168:</span> <strong>{data.historicalT168Events}/9</strong></div>
            <div><span className="text-zinc-500">Kluby:</span> <strong>{data.historicalT168Clubs}</strong></div>
            <div><span className="text-zinc-500">T-24 support:</span> <strong>{data.historicalT24SupportReadyTargets}/{data.historicalT24ComparatorTargets}</strong></div>
            <div><span className="text-zinc-500">T-48 support:</span> <strong>{data.historicalT48SupportReadyTargets}/{data.historicalT48ComparatorTargets}</strong></div>
          </div>
          <p className="mt-3 text-[10px] leading-relaxed text-zinc-500 dark:text-zinc-400">
            Pełny gate został osiągnięty, ale brak historycznego PIT supportu uniemożliwił uczciwe policzenie challenger MAE. To nie jest porażka ani wygrana modelu.
          </p>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
            <div>
              <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Prospective P9 v1</div>
              <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">{prospectiveState}</div>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2 text-center">
            <div><div className="text-lg font-semibold tabular-nums">{data.prospectiveAttemptRows}</div><div className="text-[10px] text-zinc-500">próby</div></div>
            <div><div className="text-lg font-semibold tabular-nums">{data.prospectivePredictionReadyAttempts}</div><div className="text-[10px] text-zinc-500">ready</div></div>
            <div><div className="text-lg font-semibold tabular-nums">{data.prospectivePredictionRows}</div><div className="text-[10px] text-zinc-500">predykcje</div></div>
            <div><div className="text-lg font-semibold tabular-nums">{data.prospectiveScoredEvents}</div><div className="text-[10px] text-zinc-500">scored</div></div>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-zinc-500 dark:text-zinc-400">
            <span>support insufficient: <strong>{data.prospectiveSupportInsufficientAttempts}</strong></span>
            <span>no incumbent: <strong>{data.prospectiveNoTargetIncumbentAttempts}</strong></span>
            <span>last attempt: <strong>{attemptTime(data.prospectiveLastAttemptedAt)}</strong></span>
          </div>
          <p className="mt-3 text-[10px] leading-relaxed text-zinc-500 dark:text-zinc-400">
            {prospectiveNote}
          </p>
        </div>

        <div className={`rounded-lg border p-4 ${hasMaeEvidence ? (improvesMae ? 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/60 dark:bg-emerald-950/10' : 'border-rose-200 bg-rose-50/40 dark:border-rose-900/60 dark:bg-rose-950/10') : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'}`}>
          <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Wynik North Star · v1</div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div><div className="text-base font-semibold tabular-nums">{number(data.incumbentEventBalancedMae)}</div><div className="text-[10px] text-zinc-500">incumbent MAE</div></div>
            <div><div className="text-base font-semibold tabular-nums">{number(data.challengerEventBalancedMae)}</div><div className="text-[10px] text-zinc-500">challenger MAE</div></div>
            <div><div className="text-base font-semibold tabular-nums">{deltaLabel(data.deltaEventBalancedMae)}</div><div className="text-[10px] text-zinc-500">ΔMAE</div></div>
          </div>
          <p className="mt-3 text-[10px] leading-relaxed text-zinc-500 dark:text-zinc-400">
            {hasMaeEvidence
              ? improvesMae
                ? 'ΔMAE < 0: challenger poprawia wynik punktowo. Nadal wymagamy wystarczającej liczby niezależnych eventów i kontroli downside.'
                : 'ΔMAE ≥ 0: challenger nie poprawia obecnie North Star.'
              : 'Nie ma jeszcze prospective MAE evidence. Readiness i liczba snapshotów nie są przedstawiane jako poprawa modelu.'}
          </p>
        </div>
      </div>

      <div className={`mt-3 rounded-lg border p-4 ${hasFallbackMaeEvidence ? (fallbackImprovesMae ? 'border-emerald-200 bg-emerald-50/30 dark:border-emerald-900/60 dark:bg-emerald-950/10' : 'border-rose-200 bg-rose-50/30 dark:border-rose-900/60 dark:bg-rose-950/10') : 'border-violet-200 bg-violet-50/30 dark:border-violet-900/60 dark:bg-violet-950/10'}`}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">P9 v2 · family fallback · separate evidence</div>
            <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">{fallbackState}</div>
          </div>
          <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
            D2 support &lt; 3 → Structural only if same frozen 5 neighbors give ≥ 3 refs
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-center sm:grid-cols-4 lg:grid-cols-7">
          <div><div className="text-base font-semibold tabular-nums">{data.fallbackAttemptRows}</div><div className="text-[10px] text-zinc-500">próby</div></div>
          <div><div className="text-base font-semibold tabular-nums">{data.fallbackV1CoveredAttempts}</div><div className="text-[10px] text-zinc-500">v1 covered</div></div>
          <div><div className="text-base font-semibold tabular-nums">{data.fallbackPredictionRows}</div><div className="text-[10px] text-zinc-500">fallback preds</div></div>
          <div><div className="text-base font-semibold tabular-nums">{data.fallbackScoredEvents}</div><div className="text-[10px] text-zinc-500">scored</div></div>
          <div><div className="text-base font-semibold tabular-nums">{number(data.fallbackIncumbentEventBalancedMae)}</div><div className="text-[10px] text-zinc-500">incumbent MAE</div></div>
          <div><div className="text-base font-semibold tabular-nums">{number(data.fallbackChallengerEventBalancedMae)}</div><div className="text-[10px] text-zinc-500">challenger MAE</div></div>
          <div><div className="text-base font-semibold tabular-nums">{deltaLabel(data.fallbackDeltaEventBalancedMae)}</div><div className="text-[10px] text-zinc-500">fallback ΔMAE</div></div>
        </div>

        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-zinc-500 dark:text-zinc-400">
          <span>fallback ready: <strong>{data.fallbackReadyAttempts}</strong></span>
          <span>support insufficient: <strong>{data.fallbackSupportInsufficientAttempts}</strong></span>
          <span>attempt events: <strong>{data.fallbackAttemptEvents}</strong></span>
          <span>last attempt: <strong>{attemptTime(data.fallbackLastAttemptedAt)}</strong></span>
        </div>

        <p className="mt-3 text-[10px] leading-relaxed text-zinc-500 dark:text-zinc-400">
          {fallbackNote}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[10px] text-zinc-500 dark:text-zinc-400">
        <span>Precommit: <strong>{data.designPrecommitted ? 'tak' : 'nie'}</strong></span>
        <span>Historical gate: <strong>{data.fullWindowGateOpen ? 'open' : 'closed'}</strong></span>
        <span>Historical labels opened: <strong>{data.historicalAttendanceValuesOpened ? 'tak' : 'nie'}</strong></span>
        <span>Prospective v1 attempt events: <strong>{data.prospectiveAttemptEvents}</strong></span>
        <span>Fallback v2 prediction events: <strong>{data.fallbackPredictionEvents}</strong></span>
        <span>Production activation: <strong>{data.productionActivationAllowed ? 'allowed' : 'blocked'}</strong></span>
      </div>
    </div>
  );
};
