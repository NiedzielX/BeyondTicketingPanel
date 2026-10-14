import React, { useEffect, useState } from 'react';
import { Beaker, CircleDollarSign, FlaskConical, Gauge, ShieldCheck, Users } from 'lucide-react';
import { GrowthExperimentMeasurement, growthExperimentService } from '../../services/growthExperimentService';

interface Props {
  eventId: string;
}

const fmt = (value?: number, digits = 0) =>
  value === undefined || Number.isNaN(value)
    ? '—'
    : value.toLocaleString('pl-PL', { minimumFractionDigits: digits, maximumFractionDigits: digits });

const pct = (value?: number) => value === undefined ? '—' : `${fmt(value * 100, 1)}%`;

const statusLabel = (status: string) => {
  if (status === 'draft') return 'Draft';
  if (status === 'planned') return 'Planned';
  if (status === 'running') return 'Running';
  if (status === 'completed') return 'Completed';
  if (status === 'cancelled') return 'Cancelled';
  return status;
};

const measurementLabel = (status: string) => {
  if (status === 'awaiting_data') return 'Czekamy na dane';
  if (status === 'collecting_sample') return 'Zbieramy próbę';
  if (status === 'descriptive_only') return 'Opisowo';
  if (status === 'experiment_observed') return 'Wynik dostępny';
  return status;
};

export const GrowthExperimentPanel: React.FC<Props> = ({ eventId }) => {
  const [rows, setRows] = useState<GrowthExperimentMeasurement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    growthExperimentService.getForEvent(eventId)
      .then((data) => { if (mounted) setRows(data); })
      .catch(() => { if (mounted) setRows([]); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [eventId]);

  if (loading) {
    return <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 text-xs text-zinc-500">Ładowanie Growth Experiment Tracker...</div>;
  }

  if (rows.length === 0) {
    return (
      <section className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 sm:p-5">
        <div className="flex items-start gap-2.5">
          <Beaker className="w-4 h-4 mt-0.5 text-zinc-500" />
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Growth Experiment Tracker</h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Dla tego meczu nie ma jeszcze eksperymentu. Rekomendacja Growth pozostaje decision support — brak eksperymentu nie oznacza zerowego efektu.</p>
          </div>
        </div>
      </section>
    );
  }

  const row = rows[0];
  const hasMeasurement = row.incrementalGrossRevenue !== undefined;

  return (
    <section className="rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 mb-5">
        <div className="flex items-start gap-2.5">
          <FlaskConical className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Growth Experiment Tracker</h2>
              <span className="rounded-full border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 text-[10px] font-semibold text-zinc-600 dark:text-zinc-300">{statusLabel(row.status)}</span>
              <span className="rounded-full border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">{measurementLabel(row.measurementStatus)}</span>
            </div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Treatment vs holdout. Aggregate measurement only — bez PII i bez automatycznego uruchamiania kampanii.</p>
          </div>
        </div>
        <div className="text-[10px] text-zinc-400">Design: <strong className="text-zinc-600 dark:text-zinc-300">{row.evidenceDesign.replaceAll('_', ' ')}</strong></div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 mb-4">
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3.5">
          <p className="text-[10px] uppercase tracking-wide text-zinc-400">Hipoteza</p>
          <p className="mt-1.5 text-xs leading-relaxed text-zinc-700 dark:text-zinc-200">{row.hypothesis}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3.5">
          <p className="text-[10px] uppercase tracking-wide text-zinc-400">Testowana akcja</p>
          <p className="mt-1.5 text-xs leading-relaxed text-zinc-700 dark:text-zinc-200">{row.actionDescription}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-4">
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950/60 p-3">
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-400"><Users className="w-3.5 h-3.5" />Treatment</div>
          <p className="mt-1 text-lg font-bold tabular-nums">{row.treatmentSharePct === undefined ? '—' : `${fmt(row.treatmentSharePct)}%`}</p>
          <p className="text-[10px] text-zinc-400">exposed: {fmt(row.treatmentExposed)}</p>
        </div>
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950/60 p-3">
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-400"><ShieldCheck className="w-3.5 h-3.5" />Holdout</div>
          <p className="mt-1 text-lg font-bold tabular-nums">{row.holdoutSharePct === undefined ? '—' : `${fmt(row.holdoutSharePct)}%`}</p>
          <p className="text-[10px] text-zinc-400">exposed: {fmt(row.holdoutExposed)}</p>
        </div>
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950/60 p-3">
          <p className="text-[10px] text-zinc-400">Treatment conversion</p>
          <p className="mt-1 text-lg font-bold tabular-nums">{pct(row.treatmentConversionRate)}</p>
          <p className="text-[10px] text-zinc-400">buyers / exposed</p>
        </div>
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950/60 p-3">
          <p className="text-[10px] text-zinc-400">Holdout conversion</p>
          <p className="mt-1 text-lg font-bold tabular-nums">{pct(row.holdoutConversionRate)}</p>
          <p className="text-[10px] text-zinc-400">buyers / exposed</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-4">
        <div className="rounded-lg border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/10 p-3">
          <p className="text-[10px] uppercase tracking-wide text-emerald-600">Incremental tickets</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300">{fmt(row.incrementalTickets, 1)}</p>
        </div>
        <div className="rounded-lg border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/10 p-3">
          <p className="text-[10px] uppercase tracking-wide text-emerald-600">Incremental gross</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300">{row.incrementalGrossRevenue === undefined ? '—' : `${fmt(row.incrementalGrossRevenue, 0)} ${row.currency}`}</p>
        </div>
        <div className="rounded-lg border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/10 p-3">
          <p className="text-[10px] uppercase tracking-wide text-emerald-600">Contribution</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300">{row.incrementalContribution === undefined ? '—' : `${fmt(row.incrementalContribution, 0)} ${row.currency}`}</p>
        </div>
        <div className="rounded-lg border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/10 p-3">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-emerald-600"><Gauge className="w-3.5 h-3.5" />ROI</div>
          <p className="mt-1 text-xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300">{row.roi === undefined ? '—' : `${fmt(row.roi, 2)}×`}</p>
        </div>
      </div>

      {!hasMeasurement && (
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 p-3.5 mb-4">
          <div className="flex items-start gap-2">
            <CircleDollarSign className="w-4 h-4 mt-0.5 text-zinc-500 shrink-0" />
            <div>
              <p className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-200">Revenue nie jest jeszcze mierzalne</p>
              <p className="mt-1 text-[10px] leading-relaxed text-zinc-500">System czeka na kumulatywne dane obu ramion: exposed, purchasers, tickets, gross revenue, refunds i campaign cost. Brak danych nie jest interpretowany jako zero.</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-3 text-[10px] text-zinc-400">
        <span>Minimum exposure gate: {row.minExposedPerArm} / arm. To gate operacyjny, nie test istotności.</span>
        <span>{row.interpretationNote}</span>
      </div>
    </section>
  );
};
