import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Clock3, Database, ShieldCheck } from 'lucide-react';
import {
  MatchContextCandidateRow,
  MatchContextReadinessRow,
  matchContextChallengerService
} from '../../services/matchContextChallengerService';

const fmt = (value: number, digits = 0) =>
  value.toLocaleString('pl-PL', { minimumFractionDigits: digits, maximumFractionDigits: digits });

const label = (key: string) => {
  if (key === 'timing_weekend_flag') return 'Weekend flag';
  if (key === 'timing_prime_window') return 'Prime window';
  if (key === 'timing_local_hour') return 'Local hour';
  if (key === 'match.timing') return 'Timing';
  if (key === 'match.competition_stage') return 'Competition stage';
  if (key === 'match.opponent_historical_uplift') return 'Opponent historical uplift';
  return key;
};

export const MatchContextChallengerPanel: React.FC = () => {
  const [candidates, setCandidates] = useState<MatchContextCandidateRow[]>([]);
  const [readiness, setReadiness] = useState<MatchContextReadinessRow[]>([]);

  useEffect(() => {
    Promise.all([
      matchContextChallengerService.getCandidates(),
      matchContextChallengerService.getReadiness()
    ])
      .then(([nextCandidates, nextReadiness]) => {
        setCandidates(nextCandidates);
        setReadiness(nextReadiness);
      })
      .catch(() => {
        setCandidates([]);
        setReadiness([]);
      });
  }, []);

  const loco = useMemo(
    () => candidates.filter((row) => row.protocol === 'leave_one_club_out'),
    [candidates]
  );

  if (candidates.length === 0 && readiness.length === 0) return null;

  return (
    <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 mb-5">
        <div className="flex items-start gap-2.5">
          <Clock3 className="w-4 h-4 mt-0.5 text-sky-600 shrink-0" />
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Match Context Challenger v1</h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-3xl">
              Sprawdzamy osobno timing, competition stage i historyczny wpływ rywala. Match Context nie dostaje P50, dopóki któryś komponent nie poprawi Baseline + Ticketing na uczciwym teście.
            </p>
          </div>
        </div>
        <span className="inline-flex w-fit items-center rounded-full border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/20 px-2.5 py-1 text-[10px] font-semibold text-red-700 dark:text-red-300">
          No promotable candidate
        </span>
      </div>

      {loco.length > 0 && (
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden mb-5">
          <div className="px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950/70 text-[10px] uppercase tracking-wide text-zinc-400">
            Timing candidates — leave-one-club-out
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-[10px] uppercase tracking-wide text-zinc-400">
                <tr>
                  <th className="px-3 py-2.5 text-left font-medium">Feature</th>
                  <th className="px-3 py-2.5 text-right font-medium">N</th>
                  <th className="px-3 py-2.5 text-right font-medium">Kluby</th>
                  <th className="px-3 py-2.5 text-right font-medium">Ticketing MAE</th>
                  <th className="px-3 py-2.5 text-right font-medium">Candidate MAE</th>
                  <th className="px-3 py-2.5 text-right font-medium">Δ vs Ticketing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {loco.map((row) => (
                  <tr key={row.featureKey}>
                    <td className="px-3 py-3 font-medium text-zinc-800 dark:text-zinc-200">{label(row.featureKey)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{row.eventCount}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{row.clubCount}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{fmt(row.baselineTicketingMae, 1)}</td>
                    <td className="px-3 py-3 text-right tabular-nums font-medium">{fmt(row.challengerMae, 1)}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-red-600">{fmt(row.upliftVsTicketing, 1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {readiness.map((row) => (
          <div key={row.featureKey} className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3.5">
            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{label(row.featureKey)}</p>
            <p className="mt-1 text-[10px] uppercase tracking-wide text-zinc-400">{row.readinessStatus.replaceAll('_', ' ')}</p>
            <p className="mt-2 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">{row.reason}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50/40 dark:bg-red-950/10 p-3.5 mb-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-red-700 dark:text-red-300">
          <AlertTriangle className="w-4 h-4" />Match Context pozostaje poza forecastem
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-red-700/80 dark:text-red-300/80">
          Timing nie poprawia obecnego wyniku. Competition stage nie ma dziś wiarygodnej zmienności, a opponent uplift nie przechodzi minimalnego gate’u historii. Dlatego nie tworzymy kolejnego P50 tylko po to, żeby zapełnić ablation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950/60 p-3">
          <div className="flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-200"><ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />Timing bez leakage</div>
          <p className="mt-1 text-zinc-500">Dzień i godzina są odtwarzane bezpośrednio z kickoff_at w Europe/Warsaw.</p>
        </div>
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950/60 p-3">
          <div className="flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-200"><Database className="w-3.5 h-3.5 text-indigo-600" />Opponent gate</div>
          <p className="mt-1 text-zinc-500">Uplift wymaga 8 wcześniejszych home outcomes i 3 wcześniejszych home spotkań z tym samym rywalem. Brak danych nie staje się zerem.</p>
        </div>
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950/60 p-3">
          <div className="flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-200"><Clock3 className="w-3.5 h-3.5 text-sky-600" />Stage później</div>
          <p className="mt-1 text-zinc-500">Stage wróci do testów, gdy źródło zacznie dostarczać realną fazę rozgrywek zamiast samej nazwy competition.</p>
        </div>
      </div>
    </section>
  );
};
