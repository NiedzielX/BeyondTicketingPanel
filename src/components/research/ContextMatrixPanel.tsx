import React, { useEffect, useMemo, useState } from 'react';
import { Database, FlaskConical, ShieldCheck } from 'lucide-react';
import {
  ContextCollectionStatus,
  ContextMatrixItem,
  ContextProductionRole,
  contextMatrixService
} from '../../services/contextMatrixService';

const GROUP_ORDER = ['ticketing', 'sporting', 'hype', 'match_context', 'weather', 'data_quality'];

const GROUP_LABELS: Record<string, string> = {
  ticketing: 'Live Ticketing',
  sporting: 'Sporting Context',
  hype: 'Attention & Hype',
  match_context: 'Match Context',
  weather: 'Weather',
  data_quality: 'Data Quality'
};

const roleLabel = (role: ContextProductionRole): string => {
  switch (role) {
    case 'active_prior':
      return 'Priorytet badawczy';
    case 'shadow':
      return 'Shadow';
    case 'data_quality_modifier':
      return 'Jakość danych';
    default:
      return 'Referencyjne';
  }
};

const readinessLabel = (status?: ContextCollectionStatus): string => {
  switch (status) {
    case 'active_automated':
      return 'Automatycznie';
    case 'active_manual':
      return 'Manual research';
    case 'verified_registry':
      return 'Weryfikacja + automat';
    case 'shadow_automated':
      return 'Automatycznie · shadow';
    case 'blocked_external_access':
      return 'Blokada źródła';
    case 'planned':
      return 'Planowane';
    default:
      return 'Nieokreślone';
  }
};

const readinessClass = (status?: ContextCollectionStatus): string => {
  switch (status) {
    case 'active_automated':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-300';
    case 'active_manual':
      return 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/20 dark:text-blue-300';
    case 'verified_registry':
      return 'border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900/60 dark:bg-cyan-950/20 dark:text-cyan-300';
    case 'shadow_automated':
      return 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/20 dark:text-violet-300';
    case 'blocked_external_access':
      return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-300';
    default:
      return 'border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300';
  }
};

export const ContextMatrixPanel: React.FC = () => {
  const [items, setItems] = useState<ContextMatrixItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    contextMatrixService
      .getMatrix()
      .then((rows) => {
        if (mounted) setItems(rows);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const groups = useMemo(() => {
    return GROUP_ORDER.map((groupKey) => {
      const rows = items.filter((item) => item.groupKey === groupKey);
      return {
        groupKey,
        label: GROUP_LABELS[groupKey] ?? groupKey,
        weight: rows.reduce((sum, item) => sum + item.weightPct, 0),
        rows
      };
    }).filter((group) => group.rows.length > 0);
  }, [items]);

  const activeWeight = useMemo(
    () => items.filter((item) => item.productionRole === 'active_prior').reduce((sum, item) => sum + item.weightPct, 0),
    [items]
  );

  const readinessSummary = useMemo(
    () => ({
      automated: items.filter((item) => item.collectionStatus === 'active_automated').length,
      registry: items.filter((item) => item.collectionStatus === 'verified_registry').length,
      manual: items.filter((item) => item.collectionStatus === 'active_manual').length,
      shadow: items.filter((item) => item.collectionStatus === 'shadow_automated').length,
      planned: items.filter((item) => item.collectionStatus === 'planned').length,
      blocked: items.filter((item) => item.collectionStatus === 'blocked_external_access').length
    }),
    [items]
  );

  if (isLoading) {
    return (
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 text-xs text-zinc-500">
        Ładowanie Context Matrix...
      </div>
    );
  }

  return (
    <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Context Matrix v0.1</h2>
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-3xl">
            Mapa priorytetów badawczych: jakie sygnały chcemy mierzyć, jaką mają wagę roboczą, skąd bierzemy dane i co faktycznie działa już dzisiaj.
          </p>
        </div>
        <span className="inline-flex w-fit items-center rounded-full border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50 dark:bg-indigo-950/20 px-2.5 py-1 text-[10px] font-semibold text-indigo-700 dark:text-indigo-300">
          Wagi nie są współczynnikami modelu
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2.5 mb-4">
        {groups.map((group) => (
          <div key={group.groupKey} className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
            <p className="text-[10px] uppercase tracking-wide text-zinc-400">{group.label}</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">{group.weight}%</p>
            <p className="mt-0.5 text-[10px] text-zinc-500">{group.rows.length} sygnałów</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-5 text-[10px]">
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-300">{readinessSummary.automated} automatycznych</span>
        <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 font-medium text-cyan-700 dark:border-cyan-900/60 dark:bg-cyan-950/20 dark:text-cyan-300">{readinessSummary.registry} weryfikacja + automat</span>
        <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 font-medium text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/20 dark:text-blue-300">{readinessSummary.manual} manual research</span>
        <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 font-medium text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/20 dark:text-violet-300">{readinessSummary.shadow} shadow</span>
        <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">{readinessSummary.planned} planowane</span>
        {readinessSummary.blocked > 0 && (
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 font-medium text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-300">{readinessSummary.blocked} blokada zewnętrzna</span>
        )}
      </div>

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-950/70 text-[10px] uppercase tracking-wide text-zinc-400">
              <tr>
                <th className="px-3 py-2.5 font-medium">Sygnał</th>
                <th className="px-3 py-2.5 font-medium">Obszar</th>
                <th className="px-3 py-2.5 font-medium text-right">Waga</th>
                <th className="px-3 py-2.5 font-medium">Status danych</th>
                <th className="px-3 py-2.5 font-medium">Główne źródło</th>
                <th className="px-3 py-2.5 font-medium">Odświeżanie</th>
                <th className="px-3 py-2.5 font-medium">Rola</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {groups.flatMap((group) =>
                group.rows
                  .slice()
                  .sort((a, b) => b.weightPct - a.weightPct)
                  .map((item) => (
                    <tr key={item.featureKey} className="align-top">
                      <td className="px-3 py-3 min-w-[210px]">
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">{item.displayName}</p>
                        <p className="mt-0.5 text-[10px] leading-relaxed text-zinc-400">{item.description}</p>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-zinc-500">{group.label}</td>
                      <td className="px-3 py-3 text-right font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">{item.weightPct}%</td>
                      <td className="px-3 py-3 min-w-[150px]">
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${readinessClass(item.collectionStatus)}`}>
                          {readinessLabel(item.collectionStatus)}
                        </span>
                        {item.collectionNote && <p className="mt-1.5 max-w-[260px] text-[10px] leading-relaxed text-zinc-400">{item.collectionNote}</p>}
                      </td>
                      <td className="px-3 py-3 min-w-[190px] text-zinc-600 dark:text-zinc-300">
                        <div className="flex items-start gap-1.5">
                          <Database className="w-3 h-3 mt-0.5 shrink-0 text-zinc-400" />
                          <span>{item.primarySource ?? 'Do ustalenia'}</span>
                        </div>
                        {item.fallbackSource && <p className="mt-1 pl-[18px] text-[10px] text-zinc-400">Fallback: {item.fallbackSource}</p>}
                      </td>
                      <td className="px-3 py-3 min-w-[140px] text-zinc-500">{item.refreshCadence ?? '—'}</td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="inline-flex rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:text-zinc-300">
                          {roleLabel(item.productionRole)}
                        </span>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950/60 p-3 text-zinc-600 dark:text-zinc-300">
          <div className="flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-200"><ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />Aktywne priorytety sumują się do {activeWeight}%</div>
          <p className="mt-1 text-zinc-500">Służy to do ustalenia kolejności badań i interpretacji sygnałów, a nie do mechanicznego ważenia prognozy.</p>
        </div>
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950/60 p-3 text-zinc-600 dark:text-zinc-300">
          <p className="font-medium text-zinc-800 dark:text-zinc-200">Warunek wejścia do P50</p>
          <p className="mt-1 text-zinc-500">Każdy kontekst musi najpierw pokazać dodatni uplift poza próbą względem właściwego baseline. Sam wysoki research-prior nie wystarcza.</p>
        </div>
      </div>
    </section>
  );
};
