import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, RefreshCw, ShieldCheck, TriangleAlert } from 'lucide-react';
import {
  SportingShadowEvent,
  SportingShadowSummary,
  sportingShadowService
} from '../../services/sportingShadowService';

const formatScore = (value?: number) => (value === undefined ? '—' : value.toFixed(1));

export const SportingShadowValidationPanel: React.FC = () => {
  const [summary, setSummary] = useState<SportingShadowSummary | null>(null);
  const [events, setEvents] = useState<SportingShadowEvent[]>([]);

  useEffect(() => {
    Promise.all([sportingShadowService.getSummary(), sportingShadowService.getLatestEvents()])
      .then(([nextSummary, nextEvents]) => {
        setSummary(nextSummary);
        setEvents(nextEvents);
      })
      .catch(() => {
        setSummary(null);
        setEvents([]);
      });
  }, []);

  const changed = useMemo(
    () => events.filter((event) => event.validationStatus === 'different_from_reference'),
    [events]
  );

  if (!summary || summary.totalEvents === 0) return null;

  const matchRate = Math.round((summary.matchedReference / summary.totalEvents) * 100);

  return (
    <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" />
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Automatyczny Match Stakes — shadow</h2>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400 max-w-3xl">
              Beyond automatycznie odtwarza tabelę Ekstraklasy z zakończonych meczów i porównuje wynik z ostatnim zweryfikowanym snapshotem. Automat niczego nie nadpisuje.
            </p>
          </div>
        </div>
        <span className="inline-flex w-fit items-center rounded-full border border-violet-200 dark:border-violet-900/60 bg-violet-50 dark:bg-violet-950/20 px-2.5 py-1 text-[10px] font-semibold text-violet-700 dark:text-violet-300">
          Shadow · bez wpływu na P50
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3.5">
          <p className="text-[10px] uppercase tracking-wide text-zinc-400">Zgodność z referencją</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
            {summary.matchedReference}/{summary.totalEvents}
          </p>
          <p className="mt-1 text-[11px] text-zinc-500">{matchRate}% porównywanych meczów ma identyczny score.</p>
        </div>

        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3.5">
          <p className="text-[10px] uppercase tracking-wide text-zinc-400">Inny niż snapshot referencyjny</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">{summary.differentReference}</p>
          <p className="mt-1 text-[11px] text-zinc-500">To nie musi oznaczać błędu — automat może mieć nowszy zakończony mecz.</p>
        </div>

        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3.5">
          <p className="text-[10px] uppercase tracking-wide text-zinc-400">Średnia bezwzględna różnica</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
            {summary.meanAbsDelta !== undefined ? summary.meanAbsDelta.toFixed(2) : '—'}
          </p>
          <p className="mt-1 text-[11px] text-zinc-500">Punkty na skali Match Stakes 0–100.</p>
        </div>
      </div>

      {changed.length > 0 && (
        <div className="mt-4 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/10 p-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            <TriangleAlert className="w-3.5 h-3.5 text-amber-600" />
            Różnice do obserwacji
          </div>
          <div className="mt-2 divide-y divide-amber-100 dark:divide-amber-900/30">
            {changed.slice(0, 4).map((event) => (
              <div key={event.ticketEventId} className="py-2 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 text-[11px]">
                <span className="font-medium text-zinc-700 dark:text-zinc-300">{event.homeTeam} – {event.awayTeam}</span>
                <span className="text-zinc-500 tabular-nums">
                  shadow {formatScore(event.numericValue)} · reference {formatScore(event.manualReferenceNumeric)} · Δ {event.deltaNumeric !== undefined && event.deltaNumeric > 0 ? '+' : ''}{formatScore(event.deltaNumeric)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[10px] text-zinc-400">
        <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />Liczymy wyłącznie mecze ze statusem FT — wyniki live/HT są ignorowane.</span>
        {summary.latestObservedAt && (
          <span className="inline-flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5" />Ostatni shadow: {new Date(summary.latestObservedAt).toLocaleString('pl-PL')}</span>
        )}
      </div>
    </section>
  );
};
