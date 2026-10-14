import React, { useEffect, useMemo, useState } from 'react';
import { BadgeEuro, Beaker, CircleDollarSign, FlaskConical, ShieldCheck } from 'lucide-react';
import { GrowthExperimentMeasurement, growthExperimentService } from '../services/growthExperimentService';

interface Props {
  selectedClubFilter: string;
}

const isAll = (club: string) => club === 'Wszystkie kluby' || club === 'Wszystkie';
const fmt = (value?: number, digits = 0) => value === undefined || Number.isNaN(value) ? '—' : value.toLocaleString('pl-PL', { minimumFractionDigits: digits, maximumFractionDigits: digits });
const money = (value: number | undefined, currency = 'PLN') => value === undefined ? '—' : `${fmt(value, 0)} ${currency}`;

const playLabel: Record<string, string> = {
  protect_yield: 'Protect yield',
  demand_activation: 'Demand activation',
  last_mile_conversion: 'Last-mile conversion',
  monitor: 'Monitor',
  hold_data_quality: 'Hold · Data quality'
};

const statusLabel: Record<string, string> = {
  draft: 'Draft',
  planned: 'Planned',
  running: 'Running',
  completed: 'Completed',
  cancelled: 'Cancelled'
};

const measurementLabel: Record<string, string> = {
  awaiting_data: 'Czekamy na dane',
  collecting_sample: 'Zbieramy próbę',
  descriptive_only: 'Opisowo',
  experiment_observed: 'Wynik dostępny'
};

export const GrowthPortfolioPage: React.FC<Props> = ({ selectedClubFilter }) => {
  const [rows, setRows] = useState<GrowthExperimentMeasurement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    growthExperimentService.getAll()
      .then((data) => { if (mounted) setRows(data); })
      .catch(() => { if (mounted) setRows([]); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(
    () => isAll(selectedClubFilter) ? rows : rows.filter((row) => row.homeTeam === selectedClubFilter),
    [rows, selectedClubFilter]
  );

  const measured = filtered.filter((row) => row.incrementalGrossRevenue !== undefined);
  const running = filtered.filter((row) => row.status === 'running').length;
  const drafts = filtered.filter((row) => row.status === 'draft').length;
  const completed = filtered.filter((row) => row.status === 'completed').length;
  const totalIncrementalTickets = measured.reduce((sum, row) => sum + (row.incrementalTickets ?? 0), 0);
  const totalContribution = measured.reduce((sum, row) => sum + (row.incrementalContribution ?? 0), 0);
  const currency = measured[0]?.currency ?? filtered[0]?.currency ?? 'PLN';

  if (loading) {
    return <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 text-xs text-zinc-500">Ładowanie Growth Portfolio...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div className="flex items-center gap-2">
          <BadgeEuro className="w-5 h-5 text-indigo-600" />
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Growth</h1>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-3xl">
          Rekomendacja → eksperyment → treatment/holdout → incremental tickets → incremental revenue. Beyond mierzy efekt dopiero wtedy, gdy istnieją dane obu ramion; brak danych nie jest zerowym wynikiem.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
          <p className="text-[10px] uppercase tracking-wide text-zinc-400">Eksperymenty</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{filtered.length}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
          <p className="text-[10px] uppercase tracking-wide text-zinc-400">Draft</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{drafts}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
          <p className="text-[10px] uppercase tracking-wide text-zinc-400">Running</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-indigo-600">{running}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/10 p-4">
          <p className="text-[10px] uppercase tracking-wide text-emerald-600">Incremental tickets</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300">{measured.length ? fmt(totalIncrementalTickets, 1) : '—'}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/10 p-4 col-span-2 lg:col-span-1">
          <p className="text-[10px] uppercase tracking-wide text-emerald-600">Incremental contribution</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300">{measured.length ? money(totalContribution, currency) : '—'}</p>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6">
          <div className="flex items-start gap-2.5">
            <Beaker className="w-4 h-4 mt-0.5 text-zinc-500" />
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Brak eksperymentów Growth</p>
              <p className="mt-1 text-xs text-zinc-500">Dla wybranego klubu nie ma jeszcze zapisanego eksperymentu. Rekomendacje w Event Detail mogą nadal działać jako decision support.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-950/70 text-[10px] uppercase tracking-wide text-zinc-400">
                <tr>
                  <th className="px-4 py-3 text-left">Mecz</th>
                  <th className="px-4 py-3 text-left">Play</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Design</th>
                  <th className="px-4 py-3 text-left">Measurement</th>
                  <th className="px-4 py-3 text-right">Incremental tickets</th>
                  <th className="px-4 py-3 text-right">Contribution</th>
                  <th className="px-4 py-3 text-right">ROI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filtered.map((row) => (
                  <tr key={row.experimentId} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30">
                    <td className="px-4 py-3 min-w-[220px]">
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">{row.homeTeam} – {row.awayTeam}</p>
                      <p className="mt-0.5 text-[10px] text-zinc-400">{new Intl.DateTimeFormat('pl-PL', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(row.kickoffAt))}</p>
                    </td>
                    <td className="px-4 py-3">{playLabel[row.play] ?? row.play}</td>
                    <td className="px-4 py-3"><span className="rounded-full border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 text-[10px] font-semibold">{statusLabel[row.status] ?? row.status}</span></td>
                    <td className="px-4 py-3">{row.evidenceDesign.replaceAll('_', ' ')}</td>
                    <td className="px-4 py-3">{measurementLabel[row.measurementStatus] ?? row.measurementStatus}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{fmt(row.incrementalTickets, 1)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{money(row.incrementalContribution, row.currency)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{row.roi === undefined ? '—' : `${fmt(row.roi, 2)}×`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold"><FlaskConical className="w-4 h-4 text-indigo-600" />1. Experiment</div>
          <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">Treatment i holdout są zapisane przed startem. W v1 preferujemy randomized holdout; manual comparison jest oznaczany jako non-causal.</p>
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold"><ShieldCheck className="w-4 h-4 text-emerald-600" />2. Measurement</div>
          <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">Gate 100 exposed / arm jest minimum operacyjnym. Nie udajemy, że sam ten próg oznacza statistical significance.</p>
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold"><CircleDollarSign className="w-4 h-4 text-emerald-600" />3. Business result</div>
          <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">Incremental contribution = uplift w net ticket revenue minus incremental campaign cost. ROI pojawia się tylko przy dodatnim koszcie incremental.</p>
        </div>
      </div>

      {completed === 0 && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/10 p-3.5 text-[11px] text-amber-800 dark:text-amber-300">
          Nie ma jeszcze zakończonego eksperymentu z realnym wynikiem. To poprawny stan POC — pierwsze liczby pojawią się dopiero po dostarczeniu treatment/holdout outcome data.
        </div>
      )}
    </div>
  );
};
