import React, { useEffect, useState } from 'react';
import { Newspaper, TrendingDown, TrendingUp } from 'lucide-react';
import {
  AttentionContext,
  attentionContextService
} from '../../services/attentionContextService';

interface AttentionHypePanelProps {
  eventId: string;
}

const statusCopy = (context: AttentionContext): {
  headline: string;
  description: string;
  icon: React.ReactNode;
} => {
  switch (context.attentionStatus) {
    case 'collecting_baseline':
      return {
        headline: 'Zbieramy punkt odniesienia',
        description: `Mamy ${context.samples24h} ${context.samples24h === 1 ? 'próbkę' : 'próbki/próbek'} z ostatnich 24 godzin. Nie interpretujemy jeszcze braku dopasowań jako braku zainteresowania.`,
        icon: <Newspaper className="w-4 h-4 text-zinc-400" />
      };
    case 'collecting_comparison':
      return {
        headline: 'Budujemy okres porównawczy',
        description: 'Mamy już bieżące próbki, ale potrzebujemy również poprzedniego okresu, żeby ocenić, czy zainteresowanie rzeczywiście rośnie lub słabnie.',
        icon: <Newspaper className="w-4 h-4 text-indigo-600" />
      };
    case 'rising':
      return {
        headline: 'Zainteresowanie medialne rośnie',
        description: 'W aktualnych próbkach mecz pojawia się wyraźnie częściej niż w poprzednim porównywalnym okresie.',
        icon: <TrendingUp className="w-4 h-4 text-emerald-600" />
      };
    case 'falling':
      return {
        headline: 'Zainteresowanie medialne słabnie',
        description: 'W aktualnych próbkach mecz pojawia się wyraźnie rzadziej niż w poprzednim porównywalnym okresie.',
        icon: <TrendingDown className="w-4 h-4 text-amber-600" />
      };
    default:
      return {
        headline: 'Bez większej zmiany',
        description: 'Nie widzimy obecnie wyraźnego przyspieszenia ani spadku zainteresowania medialnego.',
        icon: <Newspaper className="w-4 h-4 text-indigo-600" />
      };
  }
};

export const AttentionHypePanel: React.FC<AttentionHypePanelProps> = ({ eventId }) => {
  const [context, setContext] = useState<AttentionContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    attentionContextService
      .getEventContext(eventId)
      .then((row) => {
        if (mounted) setContext(row);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [eventId]);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 text-xs text-zinc-500">
        Ładowanie zainteresowania medialnego...
      </div>
    );
  }

  if (!context) {
    return (
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-xs">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Zainteresowanie w mediach</h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Collector zbiera pierwsze obserwacje. Ta sekcja pojawi się, gdy mamy pierwszy punkt pomiarowy.
        </p>
      </section>
    );
  }

  const status = statusCopy(context);
  const hasComparableWindows =
    context.attentionStatus === 'rising' ||
    context.attentionStatus === 'falling' ||
    context.attentionStatus === 'stable';

  return (
    <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Zainteresowanie w mediach</h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Sprawdzamy, czy o tym meczu zaczyna się mówić częściej niż wcześniej.
          </p>
        </div>
        <span className="inline-flex w-fit items-center rounded-full border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/20 px-2.5 py-1 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
          Na razie nie zmienia prognozy
        </span>
      </div>

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
        <div className="flex items-center gap-2 text-[11px] font-medium text-zinc-500">
          {status.icon}Aktualny obraz
        </div>
        <p className="mt-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">{status.headline}</p>
        <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{status.description}</p>

        {hasComparableWindows && (
          <div className="mt-4 grid grid-cols-2 gap-3 max-w-md">
            <div className="rounded-md bg-zinc-50 dark:bg-zinc-950 px-3 py-2">
              <p className="text-[10px] text-zinc-400">Ostatnie 24h</p>
              <p className="mt-0.5 text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">{context.mentions24h}</p>
              <p className="text-[10px] text-zinc-400">dopasowań w próbkach</p>
            </div>
            <div className="rounded-md bg-zinc-50 dark:bg-zinc-950 px-3 py-2">
              <p className="text-[10px] text-zinc-400">Poprzednie 24h</p>
              <p className="mt-0.5 text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">{context.mentionsPrevious24h}</p>
              <p className="text-[10px] text-zinc-400">dopasowań w próbkach</p>
            </div>
          </div>
        )}

        <p className="mt-4 text-[10px] leading-relaxed text-zinc-400">
          To badawczy sygnał z próbkowanych publikacji GDELT. Nie jest pełnym licznikiem wszystkich artykułów, analizą sentymentu ani bezpośrednią miarą popytu na bilety.
        </p>
      </div>
    </section>
  );
};
