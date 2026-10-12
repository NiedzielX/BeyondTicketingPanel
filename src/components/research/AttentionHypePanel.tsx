import React, { useEffect, useMemo, useState } from 'react';
import { Newspaper, TrendingDown, TrendingUp } from 'lucide-react';
import {
  AttentionContextItem,
  attentionContextService
} from '../../services/attentionContextService';

interface AttentionHypePanelProps {
  eventId: string;
}

const byKey = (items: AttentionContextItem[], key: AttentionContextItem['featureKey']) =>
  items.find((item) => item.featureKey === key);

const accelerationLabel = (ratio?: number): { label: string; icon: React.ReactNode } => {
  if (ratio === undefined) {
    return { label: 'Jeszcze za mało danych', icon: <Newspaper className="w-4 h-4 text-zinc-400" /> };
  }
  if (ratio >= 1.5) {
    return { label: 'Zainteresowanie medialne przyspiesza', icon: <TrendingUp className="w-4 h-4 text-emerald-600" /> };
  }
  if (ratio < 0.75) {
    return { label: 'Zainteresowanie medialne słabnie', icon: <TrendingDown className="w-4 h-4 text-amber-600" /> };
  }
  return { label: 'Zainteresowanie medialne jest stabilne', icon: <Newspaper className="w-4 h-4 text-indigo-600" /> };
};

export const AttentionHypePanel: React.FC<AttentionHypePanelProps> = ({ eventId }) => {
  const [items, setItems] = useState<AttentionContextItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    attentionContextService
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

  const media = useMemo(() => byKey(items, 'hype.media_attention'), [items]);
  const acceleration = useMemo(() => byKey(items, 'hype.mention_acceleration'), [items]);
  const trend = accelerationLabel(acceleration?.numericValue);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 text-xs text-zinc-500">
        Ładowanie zainteresowania medialnego...
      </div>
    );
  }

  return (
    <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Attention &amp; Hype</h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Sprawdzamy, czy o meczu zaczyna mówić się więcej niż zwykle w polskich mediach online.
          </p>
        </div>
        <span className="inline-flex w-fit items-center rounded-full border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/20 px-2.5 py-1 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
          Badamy wpływ — nie zmienia prognozy
        </span>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 p-4 text-xs text-zinc-500">
          Collector zbiera pierwsze obserwacje. Potrzebujemy kilku punktów w czasie, żeby odróżnić zwykłą liczbę publikacji od rzeczywistego wzrostu zainteresowania.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
            <div className="flex items-center gap-2 text-[11px] font-medium text-zinc-500">
              <Newspaper className="w-3.5 h-3.5 text-indigo-600" />Zainteresowanie medialne
            </div>
            <div className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
              {media?.numericValue !== undefined ? Math.round(media.numericValue) : '—'}
            </div>
            <p className="mt-1 text-[11px] text-zinc-500">Publikacje o tym meczu wykryte w ostatnich 24 godzinach.</p>
            {media?.textValue && <p className="mt-2 text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-300">{media.textValue}</p>}
          </div>

          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
            <div className="flex items-center gap-2 text-[11px] font-medium text-zinc-500">{trend.icon}Dynamika zainteresowania</div>
            <p className="mt-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{trend.label}</p>
            {acceleration?.textValue ? (
              <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">{acceleration.textValue}</p>
            ) : (
              <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">Pierwsze odczyty są dopiero zbierane.</p>
            )}
            <p className="mt-2 text-[10px] text-zinc-400">Źródło badawcze: GDELT. To sygnał uwagi medialnej, nie bezpośrednia miara popytu na bilety.</p>
          </div>
        </div>
      )}
    </section>
  );
};
