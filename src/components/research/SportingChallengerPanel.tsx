import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Beaker, ShieldCheck, Trophy } from 'lucide-react';
import {
  SportingChallengerSummary,
  sportingChallengerService
} from '../../services/sportingChallengerService';

const fmt = (value: number, digits = 0) =>
  value.toLocaleString('pl-PL', { minimumFractionDigits: digits, maximumFractionDigits: digits });

const protocolLabel = (protocol: string) => {
  if (protocol === 'leave_one_club_out') return 'Leave-one-club-out';
  if (protocol === 'leave_one_event_out') return 'Leave-one-event-out';
  return protocol;
};

export const SportingChallengerPanel: React.FC = () => {
  const [rows, setRows] = useState<SportingChallengerSummary[]>([]);

  useEffect(() => {
    sportingChallengerService.getSummary().then(setRows).catch(() => setRows([]));
  }, []);

  const loco = useMemo(
    () => rows.find((row) => row.protocol === 'leave_one_club_out'),
    [rows]
  );

  if (rows.length === 0) return null;

  return (
    <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 mb-5">
        <div className="flex items-start gap-2.5">
          <Trophy className="w-4 h-4 mt-0.5 text-amber-600 shrink-0" />
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Sporting Challenger v1</h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-3xl">
              Pierwszy test sprawdzał, czy Match Stakes poprawia Baseline + Ticketing na T‑24h. Historycznie stawkę meczu rekonstruujemy wyłącznie z wyników rozegranych przed targetem; prospektywnie używamy zamrożonego snapshotu.
            </p>
          </div>
        </div>
        <span className="inline-flex w-fit items-center rounded-full border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/20 px-2.5 py-1 text-[10px] font-semibold text-red-700 dark:text-red-300">
          Current candidate rejected
        </span>
      </div>

      {loco && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-5">
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
            <p className="text-[10px] uppercase tracking-wide text-zinc-400">Ticketing MAE</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">{fmt(loco.baselineTicketingMae, 1)}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
            <p className="text-[10px] uppercase tracking-wide text-zinc-400">Bias-only MAE</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">{fmt(loco.biasControlMae, 1)}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
            <p className="text-[10px] uppercase tracking-wide text-zinc-400">+ Stakes MAE</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">{fmt(loco.challengerMae, 1)}</p>
          </div>
          <div className="rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/10 p-3">
            <p className="text-[10px] uppercase tracking-wide text-red-600 dark:text-red-400">Sporting vs bias</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-red-700 dark:text-red-300">{fmt(loco.incrementalSportingUplift, 1)}</p>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden mb-4">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-950/70 text-[10px] uppercase tracking-wide text-zinc-400">
              <tr>
                <th className="px-3 py-2.5 text-left font-medium">Walidacja</th>
                <th className="px-3 py-2.5 text-right font-medium">N</th>
                <th className="px-3 py-2.5 text-right font-medium">Kluby</th>
                <th className="px-3 py-2.5 text-right font-medium">Ticketing MAE</th>
                <th className="px-3 py-2.5 text-right font-medium">Bias-only</th>
                <th className="px-3 py-2.5 text-right font-medium">+ Stakes</th>
                <th className="px-3 py-2.5 text-right font-medium">Δ vs Ticketing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {rows.map((row) => (
                <tr key={row.protocol}>
                  <td className="px-3 py-3 font-medium text-zinc-800 dark:text-zinc-200">{protocolLabel(row.protocol)}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-zinc-600 dark:text-zinc-300">{row.eventCount}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-zinc-600 dark:text-zinc-300">{row.clubCount}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{fmt(row.baselineTicketingMae, 1)}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{fmt(row.biasControlMae, 1)}</td>
                  <td className="px-3 py-3 text-right tabular-nums font-medium">{fmt(row.challengerMae, 1)}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-red-600">{fmt(row.upliftVsTicketing, 1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50/40 dark:bg-red-950/10 p-3.5 mb-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-red-700 dark:text-red-300">
          <AlertTriangle className="w-4 h-4" />Nie tworzymy Sporting P50 z tego kandydata
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-red-700/80 dark:text-red-300/80">
          Match Stakes pogorszył błąd zarówno względem Baseline + Ticketing, jak i względem bias-only control. Dlatego ablation + Sporting pozostaje bez predykcji zamiast pokazywać sztuczny wynik.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950/60 p-3">
          <div className="flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-200"><ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />Bez backfill leakage</div>
          <p className="mt-1 text-zinc-500">Historyczna tabela ligowa używa tylko spotkań z datą wcześniejszą niż target. Dzisiejsze sporting observations nie są cofane do starych checkpointów.</p>
        </div>
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950/60 p-3">
          <div className="flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-200"><Beaker className="w-3.5 h-3.5 text-violet-600" />Hipoteza odrzucona, nie obszar</div>
          <p className="mt-1 text-zinc-500">Odrzucamy obecny heurystyczny Match Stakes jako korektę P50. Sporting Context nadal zbieramy prospektywnie.</p>
        </div>
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950/60 p-3">
          <div className="flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-200"><Trophy className="w-3.5 h-3.5 text-amber-600" />Co testujemy później</div>
          <p className="mt-1 text-zinc-500">Pełny Sporting powinien łączyć stakes z Form5, rivalry i zweryfikowanymi absencjami dopiero, gdy te sygnały będą dostępne point-in-time.</p>
        </div>
      </div>
    </section>
  );
};
