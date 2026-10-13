import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Database, ShieldCheck } from 'lucide-react';
import {
  CrossClubBaselineComparison,
  CrossClubBaselineRow,
  crossClubBaselineService
} from '../../services/crossClubBaselineService';

const sourceLabel = (row: CrossClubBaselineRow): string => {
  switch (row.selectedBaselineSource) {
    case 'incumbent_engine_baseline': return 'Incumbent engine';
    case 'crossclub_fallback': return 'Cross-club fallback';
    default: return 'Brak baseline';
  }
};

const statusCopy = (row: CrossClubBaselineRow): string => {
  if (row.selectedBaselineP50 !== undefined) {
    return `${sourceLabel(row)} · P50 ${row.selectedBaselineP50.toLocaleString('pl-PL')}`;
  }
  if (row.baselineStatus === 'unsupported_competition') {
    return 'Fallback v3 obejmuje obecnie tylko home Ekstraklasa.';
  }
  return `Za mało historii: ${row.historyCount}/3 wcześniejsze home outcomes.`;
};

export const CrossClubBaselinePanel: React.FC = () => {
  const [rows, setRows] = useState<CrossClubBaselineRow[]>([]);
  const [comparison, setComparison] = useState<CrossClubBaselineComparison[]>([]);

  useEffect(() => {
    Promise.all([
      crossClubBaselineService.getRows(),
      crossClubBaselineService.getSameEventComparison()
    ])
      .then(([nextRows, nextComparison]) => {
        setRows(nextRows);
        setComparison(nextComparison);
      })
      .catch(() => {
        setRows([]);
        setComparison([]);
      });
  }, []);

  const summary = useMemo(() => {
    const completed = rows.filter((row) => row.hasOutcome && row.selectedBaselineP50 !== undefined);
    return {
      clubs: new Set(completed.map((row) => row.clubSlug)).size,
      fallbackRows: rows.filter((row) => row.selectedBaselineSource === 'crossclub_fallback').length,
      incumbentRows: rows.filter((row) => row.selectedBaselineSource === 'incumbent_engine_baseline').length,
      missingRows: rows.filter((row) => row.selectedBaselineP50 === undefined).length
    };
  }, [rows]);

  const upcoming = useMemo(() => {
    const now = Date.now();
    const byEvent = new Map<number, CrossClubBaselineRow>();
    rows
      .filter((row) => new Date(row.kickoffAt).getTime() > now)
      .sort((a, b) => new Date(a.checkpointAt).getTime() - new Date(b.checkpointAt).getTime())
      .forEach((row) => {
        const existing = byEvent.get(row.ticketEventId);
        if (!existing || new Date(row.checkpointAt).getTime() > new Date(existing.checkpointAt).getTime()) {
          byEvent.set(row.ticketEventId, row);
        }
      });
    return Array.from(byEvent.values())
      .sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime())
      .slice(0, 10);
  }, [rows]);

  if (rows.length === 0) return null;

  return (
    <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 mb-5">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Cross-club Baseline v3</h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-3xl">
            Fallback badawczy dla klubów bez incumbent P50. Retrospektywny backfill rekonstruuje fakty znane po rozegraniu wcześniejszych meczów; przyszłe checkpointy wymagają również, żeby dane były już obecne w systemie.
          </p>
        </div>
        <span className="inline-flex w-fit items-center rounded-full border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50 dark:bg-indigo-950/20 px-2.5 py-1 text-[10px] font-semibold text-indigo-700 dark:text-indigo-300">minimum 3 mecze</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-5">
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3"><p className="text-[10px] uppercase tracking-wide text-zinc-400">Kluby w ewaluacji</p><p className="mt-1 text-xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">{summary.clubs}</p></div>
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3"><p className="text-[10px] uppercase tracking-wide text-zinc-400">Fallback rows</p><p className="mt-1 text-xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">{summary.fallbackRows}</p></div>
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3"><p className="text-[10px] uppercase tracking-wide text-zinc-400">Incumbent rows</p><p className="mt-1 text-xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">{summary.incumbentRows}</p></div>
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3"><p className="text-[10px] uppercase tracking-wide text-zinc-400">Bez baseline</p><p className="mt-1 text-xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">{summary.missingRows}</p></div>
      </div>

      {comparison.length > 0 && (
        <div className="mb-5 rounded-lg border border-indigo-200 dark:border-indigo-900/60 overflow-hidden">
          <div className="px-3.5 py-2.5 bg-indigo-50/60 dark:bg-indigo-950/20 text-[10px] uppercase tracking-wide text-indigo-600 dark:text-indigo-300">Challenger vs incumbent — dokładnie te same eventy</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-[10px] uppercase tracking-wide text-zinc-400"><tr><th className="px-3 py-2 text-left">Checkpoint</th><th className="px-3 py-2 text-right">N</th><th className="px-3 py-2 text-right">Incumbent MAE</th><th className="px-3 py-2 text-right">Median MAE</th><th className="px-3 py-2 text-right">Uplift</th></tr></thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {comparison.map((row) => (
                  <tr key={row.checkpointCode}><td className="px-3 py-2.5 font-medium">{row.checkpointCode}</td><td className="px-3 py-2.5 text-right tabular-nums">{row.eventCount}</td><td className="px-3 py-2.5 text-right tabular-nums">{row.incumbentMae.toLocaleString('pl-PL')}</td><td className="px-3 py-2.5 text-right tabular-nums">{row.challengerMae.toLocaleString('pl-PL')}</td><td className="px-3 py-2.5 text-right tabular-nums font-medium text-emerald-600">+{row.challengerMaeUplift.toLocaleString('pl-PL')}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="px-3.5 py-2.5 text-[10px] text-zinc-500">To bardzo mała próbka i wyłącznie challenger research. Lepszy wynik nie zmienia produkcyjnego P50.</p>
        </div>
      )}

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950/70 text-[10px] uppercase tracking-wide text-zinc-400">Najbliższe mecze — ostatni dostępny checkpoint</div>
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {upcoming.map((row) => (
            <div key={row.ticketEventId} className="px-3.5 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div><p className="text-xs font-medium text-zinc-900 dark:text-zinc-100">{row.homeTeam} – {row.awayTeam}</p><p className="mt-0.5 text-[10px] text-zinc-400">{row.checkpointCode} · historia {row.historyCount} meczów</p></div>
              <p className={row.selectedBaselineP50 !== undefined ? 'text-[11px] font-medium text-zinc-800 dark:text-zinc-200' : 'text-[11px] font-medium text-amber-700 dark:text-amber-300'}>{statusCopy(row)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950/60 p-3 text-zinc-600 dark:text-zinc-300"><div className="flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-200"><ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />Checkpoint-safe</div><p className="mt-1 text-zinc-500">Mecz rozegrany po checkpointcie nie może wejść do historii tego checkpointu.</p></div>
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950/60 p-3 text-zinc-600 dark:text-zinc-300"><div className="flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-200"><Database className="w-3.5 h-3.5 text-indigo-600" />Fallback, nie replacement</div><p className="mt-1 text-zinc-500">Jeśli engine ma już własny historyczny P50, cross-club median go nie nadpisuje.</p></div>
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950/60 p-3 text-zinc-600 dark:text-zinc-300"><div className="flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-200"><AlertTriangle className="w-3.5 h-3.5 text-amber-600" />Brak danych pozostaje brakiem danych</div><p className="mt-1 text-zinc-500">Nie używamy mediany ligowej jako zastępstwa dla klubu bez własnej historii.</p></div>
      </div>
    </section>
  );
};
