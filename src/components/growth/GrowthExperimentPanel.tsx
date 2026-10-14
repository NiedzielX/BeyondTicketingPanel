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
  if (status === 'draft_not_started') return 'Draft · bez execution';
  if (status === 'awaiting_assignment') return 'Czekamy na assignment';
  if (status === 'assignment_mismatch') return 'Błąd assignmentu';
  if (status === 'awaiting_outcome_data') return 'Czekamy na outcome';
  if (status === 'collecting_sample') return 'Zbieramy próbę';
  if (status === 'descriptive_only') return 'Opisowo';
  if (status === 'experiment_observed') return 'Wynik dostępny';
  return status;
};

const assignmentLabel = (status: string) => {
  if (status === 'not_received') return 'Assignment niepodłączony';
  if (status === 'aggregate_only') return 'Aggregate only';
  if (status === 'manifest_received') return 'Manifest otrzymany';
  if (status === 'manifest_complete') return 'Exact manifest';
  if (status === 'manifest_mismatch') return 'Błąd manifestu';
  return status;
};

const sourceLabel = (row: GrowthExperimentMeasurement) => {
  if (!row.latestBatchSource) return 'Brak execution source';
  return `${row.latestBatchSource}${row.latestAssignmentMode ? ` · ${row.latestAssignmentMode.replaceAll('_', ' ')}` : ''}`;
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
  const reportable = row.measurementStatus === 'experiment_observed' || row.measurementStatus === 'descriptive_only';
  const assignmentProblem = row.assignmentStatus === 'manifest_mismatch' || row.measurementStatus === 'assignment_mismatch';

  return (
    <section className="rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 mb-5">
        <div className="flex items-start gap-2.5">
          <FlaskConical className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Growth Experiment Tracker</h2>
              <span className="rounded-full border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 text-[10px] font-semibold text-zinc-600 dark:text-zinc-300">{statusLabel(row.status)}</span>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${assignmentProblem ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/20 dark:text-red-300' : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300'}`}>
                {measurementLabel(row.measurementStatus)}
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Intent-to-treat: wynik liczymy po faktycznie przypisanym Treatment/Holdout, nie po samym exposure. Exact manifest używa tylko pseudonimowych hashy — bez surowego PII.</p>
          </div>
        </div>
        <div className="text-[10px] text-zinc-400 text-right">
          <div>Design: <strong className="text-zinc-600 dark:text-zinc-300">{row.evidenceDesign.replaceAll('_', ' ')}</strong></div>
          <div className="mt-0.5">Source: <strong className="text-zinc-600 dark:text-zinc-300">{sourceLabel(row)}</strong></div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 mb-4">
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3.5">
          <p className="text-[10px] uppercase tracking-wide text-zinc-400">Hipoteza</p>
          <p className="mt-1.5 text-xs leading-relaxed text-zinc-700 dark:text-zinc-200">{row.hypothesis}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3.5">
          <p className="text-[10px] uppercase tracking-wide text-zinc-400">Execution data</p>
          <p className="mt-1.5 text-xs leading-relaxed text-zinc-700 dark:text-zinc-200">{assignmentLabel(row.assignmentStatus)}</p>
          <p className="mt-1 text-[10px] text-zinc-400">{row.latestBatchAt ? `Ostatni batch: ${new Intl.DateTimeFormat('pl-PL', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(row.latestBatchAt))}` : 'Nie odebraliśmy jeszcze żadnego batcha wykonawczego.'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950/60 p-3.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100"><Users className="w-3.5 h-3.5 text-indigo-600" />Treatment · plan {row.treatmentSharePct === undefined ? '—' : `${fmt(row.treatmentSharePct)}%`}</div>
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div><p className="text-[10px] text-zinc-400">Assigned</p><p className="mt-0.5 text-base font-bold tabular-nums">{fmt(row.treatmentAssigned)}</p></div>
            <div><p className="text-[10px] text-zinc-400">Exposed</p><p className="mt-0.5 text-base font-bold tabular-nums">{fmt(row.treatmentExposed)}</p></div>
            <div><p className="text-[10px] text-zinc-400">Exposure rate</p><p className="mt-0.5 text-base font-bold tabular-nums">{pct(row.treatmentExposureRate)}</p></div>
          </div>
        </div>
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950/60 p-3.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100"><ShieldCheck className="w-3.5 h-3.5 text-zinc-500" />Holdout · plan {row.holdoutSharePct === undefined ? '—' : `${fmt(row.holdoutSharePct)}%`}</div>
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div><p className="text-[10px] text-zinc-400">Assigned</p><p className="mt-0.5 text-base font-bold tabular-nums">{fmt(row.holdoutAssigned)}</p></div>
            <div><p className="text-[10px] text-zinc-400">Exposed</p><p className="mt-0.5 text-base font-bold tabular-nums">{fmt(row.holdoutExposed)}</p></div>
            <div><p className="text-[10px] text-zinc-400">Exposure rate</p><p className="mt-0.5 text-base font-bold tabular-nums">{pct(row.holdoutExposureRate)}</p></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-4">
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
          <p className="text-[10px] text-zinc-400">Treatment conversion · ITT</p>
          <p className="mt-1 text-lg font-bold tabular-nums">{pct(row.treatmentConversionRateItt)}</p>
          <p className="text-[10px] text-zinc-400">buyers / assigned</p>
        </div>
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
          <p className="text-[10px] text-zinc-400">Holdout conversion · ITT</p>
          <p className="mt-1 text-lg font-bold tabular-nums">{pct(row.holdoutConversionRateItt)}</p>
          <p className="text-[10px] text-zinc-400">buyers / assigned</p>
        </div>
        <div className="rounded-lg border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/10 p-3">
          <p className="text-[10px] uppercase tracking-wide text-emerald-600">Incremental tickets</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300">{reportable ? fmt(row.incrementalTickets, 1) : '—'}</p>
        </div>
        <div className="rounded-lg border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/10 p-3">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-emerald-600"><Gauge className="w-3.5 h-3.5" />ROI</div>
          <p className="mt-1 text-xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300">{reportable && row.roi !== undefined ? `${fmt(row.roi, 2)}×` : '—'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mb-4">
        <div className="rounded-lg border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/10 p-3">
          <p className="text-[10px] uppercase tracking-wide text-emerald-600">Incremental gross revenue</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300">{reportable && row.incrementalGrossRevenue !== undefined ? `${fmt(row.incrementalGrossRevenue, 0)} ${row.currency}` : '—'}</p>
        </div>
        <div className="rounded-lg border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/10 p-3">
          <p className="text-[10px] uppercase tracking-wide text-emerald-600">Incremental contribution</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300">{reportable && row.incrementalContribution !== undefined ? `${fmt(row.incrementalContribution, 0)} ${row.currency}` : '—'}</p>
        </div>
      </div>

      {!reportable && (
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 p-3.5 mb-4">
          <div className="flex items-start gap-2">
            <CircleDollarSign className="w-4 h-4 mt-0.5 text-zinc-500 shrink-0" />
            <div>
              <p className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-200">Wynik biznesowy nie jest jeszcze raportowalny</p>
              <p className="mt-1 text-[10px] leading-relaxed text-zinc-500">Najpierw potrzebujemy assignmentu oraz kumulatywnych outcome data obu ramion: assigned, exposed, purchasers, tickets, gross revenue, refunds i campaign cost. Brak danych nie jest interpretowany jako zero.</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-3 text-[10px] text-zinc-400">
        <span>Minimum assigned gate: {row.minAssignedPerArm} / arm. To gate operacyjny, nie test istotności.</span>
        <span>{row.interpretationNote}</span>
      </div>
    </section>
  );
};
