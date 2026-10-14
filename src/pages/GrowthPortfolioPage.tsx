import React, { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, Eye, Lightbulb, ShieldCheck, Sparkles } from 'lucide-react';
import { GrowthOpportunity, growthOpportunityService } from '../services/growthOpportunityService';

interface Props {
  selectedClubFilter: string;
}

const isAll = (club: string) => club === 'Wszystkie kluby' || club === 'Wszystkie';
const fmt = (value?: number, digits = 0) => value === undefined || Number.isNaN(value)
  ? '—'
  : value.toLocaleString('pl-PL', { minimumFractionDigits: digits, maximumFractionDigits: digits });

const playLabel: Record<string, string> = {
  protect_yield: 'Protect yield',
  demand_activation: 'Demand activation',
  last_mile_conversion: 'Last-mile conversion',
  monitor: 'Monitor',
  hold_data_quality: 'Data hold',
  insufficient_data: 'Za mało danych'
};

const demandLabel: Record<string, string> = {
  accelerating: 'Przyspiesza',
  stable: 'Stabilny',
  slowing: 'Zwalnia',
  scarce: 'Niska dostępność',
  uncertain: 'Niepewny'
};

const priorityLabel: Record<string, string> = {
  high: 'Działaj teraz',
  medium: 'Warto rozważyć',
  low: 'Monitoruj',
  data_hold: 'Wstrzymaj decyzję'
};

const priorityClass: Record<string, string> = {
  high: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-300',
  medium: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-300',
  low: 'border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-300',
  data_hold: 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/20 dark:text-indigo-300'
};

export const GrowthPortfolioPage: React.FC<Props> = ({ selectedClubFilter }) => {
  const [rows, setRows] = useState<GrowthOpportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    growthOpportunityService.getAll()
      .then((data) => { if (mounted) setRows(data); })
      .catch(() => { if (mounted) setRows([]); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(
    () => isAll(selectedClubFilter) ? rows : rows.filter((row) => row.homeTeam === selectedClubFilter),
    [rows, selectedClubFilter]
  );

  const high = filtered.filter((row) => row.priority === 'high').length;
  const protectYield = filtered.filter((row) => row.play === 'protect_yield').length;
  const monitor = filtered.filter((row) => row.play === 'monitor').length;
  const dataHold = filtered.filter((row) => row.priority === 'data_hold').length;

  if (loading) {
    return <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 text-xs text-zinc-500">Ładowanie Growth Opportunity Engine...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Growth Opportunity Engine</h1>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-4xl">
          Publiczny ticketing → sygnał popytu → forecast → rekomendacja → obserwacja kolejnych checkpointów. Ten POC działa bez CRM, danych klientów i integracji wykonawczej z klubem.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
          <p className="text-[10px] uppercase tracking-wide text-zinc-400">Aktywne mecze</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{filtered.length}</p>
        </div>
        <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/10 p-4">
          <p className="text-[10px] uppercase tracking-wide text-rose-600">Działaj teraz</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-rose-700 dark:text-rose-300">{high}</p>
        </div>
        <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/10 p-4">
          <p className="text-[10px] uppercase tracking-wide text-amber-600">Protect yield</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-amber-700 dark:text-amber-300">{protectYield}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
          <p className="text-[10px] uppercase tracking-wide text-zinc-400">Monitor</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{monitor}</p>
        </div>
        <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/30 dark:bg-indigo-950/10 p-4 col-span-2 lg:col-span-1">
          <p className="text-[10px] uppercase tracking-wide text-indigo-600">Data hold</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-indigo-700 dark:text-indigo-300">{dataHold}</p>
        </div>
      </div>

      <div className="rounded-lg border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/30 dark:bg-indigo-950/10 p-4">
        <div className="flex items-start gap-2.5">
          <Eye className="w-4 h-4 mt-0.5 text-indigo-600" />
          <div>
            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Co Beyond potrafi udowodnić na etapie POC?</p>
            <p className="mt-1 text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-300">
              Potrafimy wykryć zmianę publicznej dostępności, tempo tej zmiany, zestawić ją z forecastem i wskazać sensowną reakcję komercyjną. Nie przypisujemy jednak późniejszej zmiany do kampanii i nie raportujemy fikcyjnego incremental revenue bez danych wykonawczych klubu.
            </p>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6">
          <div className="flex items-start gap-2.5">
            <Lightbulb className="w-4 h-4 mt-0.5 text-zinc-500" />
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Brak aktywnych okazji Growth</p>
              <p className="mt-1 text-xs text-zinc-500">Dla wybranego klubu nie ma obecnie aktywnego meczu z danymi do analizy.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((row) => (
            <div key={row.eventId} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5">
              <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{row.eventName}</h2>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${priorityClass[row.priority]}`}>
                      {priorityLabel[row.priority]}
                    </span>
                    <span className="rounded-full border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 text-[10px] font-semibold text-zinc-600 dark:text-zinc-300">
                      {playLabel[row.play]}
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] text-zinc-400">{row.competition} · {Math.max(0, Math.round(row.daysToEvent))} dni do meczu · confidence: {row.confidence}</p>

                  <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-zinc-400">Diagnoza</p>
                      <p className="mt-1 text-xs font-semibold text-zinc-900 dark:text-zinc-100">{row.headline}</p>
                      <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">{row.diagnosis}</p>
                      <p className="mt-2 text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-300"><strong>Dlaczego teraz:</strong> {row.whyNow}</p>
                    </div>
                    <div className="rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/10 p-3.5">
                      <p className="text-[10px] uppercase tracking-wide text-emerald-600">Rekomendowane działanie</p>
                      <p className="mt-1 text-[11px] leading-relaxed text-zinc-700 dark:text-zinc-200">{row.recommendedAction}</p>
                      <p className="mt-2 text-[10px] leading-relaxed text-zinc-500"><strong>Nie rób:</strong> {row.doNotDo}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-2 gap-2 xl:w-[330px] shrink-0">
                  <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/40 p-3">
                    <p className="text-[9px] uppercase tracking-wide text-zinc-400">Sygnał</p>
                    <p className="mt-1 text-xs font-semibold">{demandLabel[row.demandState]}</p>
                  </div>
                  <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/40 p-3">
                    <p className="text-[9px] uppercase tracking-wide text-zinc-400">Forecast P50</p>
                    <p className="mt-1 text-xs font-semibold tabular-nums">{fmt(row.forecastP50, 0)}</p>
                  </div>
                  <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/40 p-3">
                    <p className="text-[9px] uppercase tracking-wide text-zinc-400">Widoczne miejsca</p>
                    <p className="mt-1 text-xs font-semibold tabular-nums">{fmt(row.visibleAvailability, 0)}</p>
                  </div>
                  <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/40 p-3">
                    <p className="text-[9px] uppercase tracking-wide text-zinc-400">Gap do pojemności wg P50</p>
                    <p className="mt-1 text-xs font-semibold tabular-nums">{fmt(row.forecastGapToCapacity, 0)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3 border-t border-zinc-100 dark:border-zinc-800 pt-4">
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400"><Activity className="w-3.5 h-3.5" />Jak obserwujemy efekt</div>
                  <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">{row.observationPlan}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400"><ShieldCheck className="w-3.5 h-3.5" />Pomiar w pilocie</div>
                  <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">{row.pilotMeasurementPlan}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold"><Eye className="w-4 h-4 text-indigo-600" />1. Detect</div>
          <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">Scraping publicznego ticketingu, inventory snapshots, velocity i forecast. Bez danych osobowych i bez integracji z CRM klubu.</p>
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold"><Lightbulb className="w-4 h-4 text-amber-600" />2. Recommend</div>
          <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">Beyond wybiera play: protect yield, demand activation, last-mile conversion, monitor albo data hold.</p>
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold"><Activity className="w-4 h-4 text-emerald-600" />3. Observe</div>
          <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">Po działaniu patrzymy, czy zmienia się tempo publicznej dostępności i forecast. To directional evidence, nie causal attribution.</p>
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold"><AlertTriangle className="w-4 h-4 text-zinc-500" />4. Prove later</div>
          <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">Treatment/Holdout, incremental tickets i revenue włączamy dopiero w pilocie, kiedy klub udostępni dane wykonawcze.</p>
        </div>
      </div>
    </div>
  );
};
