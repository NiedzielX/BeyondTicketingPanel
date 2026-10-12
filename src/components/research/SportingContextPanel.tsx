import React, { useEffect, useMemo, useState } from 'react';
import { Activity, ShieldAlert, Trophy } from 'lucide-react';
import {
  SportingContextItem,
  sportingContextService
} from '../../services/sportingContextService';

interface SportingContextPanelProps {
  eventId: string;
}

const stakesLabel = (score?: number): string => {
  if (score === undefined) return 'Jeszcze oceniamy';
  if (score >= 70) return 'Bardzo wysoka';
  if (score >= 50) return 'Wysoka';
  if (score >= 35) return 'Umiarkowana';
  return 'Niska';
};

const byKey = (items: SportingContextItem[], key: SportingContextItem['featureKey']) =>
  items.find((item) => item.featureKey === key);

export const SportingContextPanel: React.FC<SportingContextPanelProps> = ({ eventId }) => {
  const [items, setItems] = useState<SportingContextItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    sportingContextService
      .getEventContext(eventId)
      .then((rows) => {
        if (mounted) setItems(rows);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [eventId]);

  const form = useMemo(() => byKey(items, 'sport.form5'), [items]);
  const stakes = useMemo(() => byKey(items, 'sport.match_stakes'), [items]);
  const absence = useMemo(() => byKey(items, 'sport.absence_impact'), [items]);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 text-xs text-zinc-500">
        Ładowanie kontekstu sportowego...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Kontekst sportowy</h2>
        <p className="mt-1 text-xs text-zinc-500">Dla tego meczu zbieramy jeszcze formę, stawkę i informacje o absencjach.</p>
      </div>
    );
  }

  return (
    <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Kontekst sportowy</h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Co dzieje się wokół meczu poza systemem biletowym.
          </p>
        </div>
        <span className="inline-flex w-fit items-center rounded-full border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/20 px-2.5 py-1 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
          Na razie nie zmienia prognozy
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
          <div className="flex items-center gap-2 text-[11px] font-medium text-zinc-500">
            <Activity className="w-3.5 h-3.5 text-indigo-600" />Forma ostatnich meczów
          </div>
          <p className="mt-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {form?.textValue ?? 'Brak wystarczających danych'}
          </p>
          <p className="mt-1 text-[11px] text-zinc-500">Porównujemy ostatnie 5 wyników obu drużyn.</p>
        </div>

        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
          <div className="flex items-center gap-2 text-[11px] font-medium text-zinc-500">
            <Trophy className="w-3.5 h-3.5 text-indigo-600" />Stawka meczu
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{stakesLabel(stakes?.numericValue)}</span>
            {stakes?.numericValue !== undefined && (
              <span className="text-[11px] text-zinc-400 tabular-nums">{Math.round(stakes.numericValue)}/100</span>
            )}
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
            {stakes?.textValue ?? 'Brak wystarczających danych do oceny stawki.'}
          </p>
        </div>

        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
          <div className="flex items-center gap-2 text-[11px] font-medium text-zinc-500">
            <ShieldAlert className="w-3.5 h-3.5 text-indigo-600" />Absencje
          </div>
          <p className="mt-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {absence ? 'Mamy potwierdzone informacje' : 'Brak potwierdzonego sygnału'}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
            {absence?.textValue ?? 'Nie mamy obecnie wiarygodnej informacji o absencji, która mogłaby zmienić zainteresowanie meczem.'}
          </p>
          {absence && absence.numericValue === undefined && (
            <p className="mt-2 text-[10px] font-medium text-amber-700 dark:text-amber-300">
              Sama absencja nie oznacza jeszcze wpływu na popyt.
            </p>
          )}
        </div>
      </div>
    </section>
  );
};
