import React, { useEffect, useMemo, useState } from 'react';
import { CalendarClock, CheckCircle2, History, ShieldCheck } from 'lucide-react';
import {
  OpponentUpliftItem,
  matchContextResearchService
} from '../../services/matchContextResearchService';

const readinessCopy = (item: OpponentUpliftItem): string => {
  if (item.readinessStatus === 'ready') {
    return item.upliftPct === undefined
      ? 'Historia spełnia gate, czekamy na wynik obliczenia.'
      : `Uplift historyczny: ${item.upliftPct > 0 ? '+' : ''}${item.upliftPct.toFixed(1)}%`;
  }
  if (item.readinessStatus === 'insufficient_opponent_history') {
    return `Klub ma już ${item.clubHistoryCount} outcome’ów, ale tylko ${item.opponentHistoryCount}/3 z tym rywalem.`;
  }
  return `Mamy ${item.clubHistoryCount}/8 wcześniejszych outcome’ów klubu w tej klasie rozgrywek.`;
};

export const MatchContextResearchPanel: React.FC = () => {
  const [items, setItems] = useState<OpponentUpliftItem[]>([]);

  useEffect(() => {
    matchContextResearchService
      .getOpponentUpliftReadiness()
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  const summary = useMemo(() => {
    const ready = items.filter((item) => item.readinessStatus === 'ready').length;
    const clubHistoryBlocked = items.filter(
      (item) => item.readinessStatus === 'insufficient_club_history'
    ).length;
    const opponentHistoryBlocked = items.filter(
      (item) => item.readinessStatus === 'insufficient_opponent_history'
    ).length;
    return { ready, clubHistoryBlocked, opponentHistoryBlocked };
  }, [items]);

  if (items.length === 0) return null;

  return (
    <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div className="flex items-start gap-2.5">
          <CalendarClock className="w-4 h-4 mt-0.5 text-indigo-600 shrink-0" />
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Match Context — gotowość danych</h2>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400 max-w-3xl">
              Dzień i godzina meczu oraz rozgrywki są zbierane automatycznie. Historyczny efekt konkretnego rywala liczymy dopiero po przekroczeniu minimalnej próby.
            </p>
          </div>
        </div>
        <span className="inline-flex w-fit items-center rounded-full border border-violet-200 dark:border-violet-900/60 bg-violet-50 dark:bg-violet-950/20 px-2.5 py-1 text-[10px] font-semibold text-violet-700 dark:text-violet-300">
          Uplift rywala · shadow
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3.5">
          <p className="text-[10px] uppercase tracking-wide text-zinc-400">Gotowe do liczenia</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">{summary.ready}</p>
          <p className="mt-1 text-[11px] text-zinc-500">Gate: ≥8 outcome’ów klubu i ≥3 mecze z tym rywalem.</p>
        </div>
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3.5">
          <p className="text-[10px] uppercase tracking-wide text-zinc-400">Za mało historii klubu</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">{summary.clubHistoryBlocked}</p>
          <p className="mt-1 text-[11px] text-zinc-500">Nie pokazujemy wtedy sztucznego 0%.</p>
        </div>
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3.5">
          <p className="text-[10px] uppercase tracking-wide text-zinc-400">Za mało spotkań z rywalem</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">{summary.opponentHistoryBlocked}</p>
          <p className="mt-1 text-[11px] text-zinc-500">Rywal musi pojawić się co najmniej 3 razy w historii home.</p>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {items.slice(0, 10).map((item) => (
            <div key={item.ticketEventId} className="px-3.5 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-1.5">
              <div>
                <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">{item.homeTeam} – {item.awayTeam}</p>
                <p className="mt-0.5 text-[10px] text-zinc-400">{readinessCopy(item)}</p>
              </div>
              <div className="text-[10px] text-zinc-500 tabular-nums whitespace-nowrap">
                klub {item.clubHistoryCount}/8 · rywal {item.opponentHistoryCount}/3
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950/60 p-3 text-zinc-600 dark:text-zinc-300">
          <div className="flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-200"><History className="w-3.5 h-3.5 text-indigo-600" />Leakage-safe history</div>
          <p className="mt-1 text-zinc-500">Do targetu trafiają wyłącznie outcome’y z kickoffem wcześniejszym niż analizowany mecz, maksymalnie 730 dni wstecz.</p>
        </div>
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950/60 p-3 text-zinc-600 dark:text-zinc-300">
          <div className="flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-200"><ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />Brak danych ≠ brak efektu</div>
          <p className="mt-1 text-zinc-500">Dopóki gate nie jest spełniony, feature pozostaje pusty i nie wpływa na P50.</p>
        </div>
      </div>

      <div className="mt-3 text-[10px] text-zinc-400 inline-flex items-center gap-1.5">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />Timing i competition context są odświeżane automatycznie co 6 godzin.
      </div>
    </section>
  );
};
