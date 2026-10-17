import React, { useEffect, useState } from 'react';
import { AlertTriangle, BadgeEuro, Beaker, CheckCircle2, Gauge, Megaphone, ShieldAlert } from 'lucide-react';
import { GrowthOpportunity, growthOpportunityService } from '../../services/growthOpportunityService';

interface Props {
  eventId: string;
}

const playLabel: Record<GrowthOpportunity['play'], string> = {
  hold_data_quality: 'Hold · Data quality',
  protect_yield: 'Protect yield',
  demand_activation: 'Demand activation',
  last_mile_conversion: 'Last-mile conversion',
  monitor: 'Monitor',
  insufficient_data: 'Insufficient data'
};

const playClass: Record<GrowthOpportunity['play'], string> = {
  hold_data_quality: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300',
  protect_yield: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300',
  demand_activation: 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/20 dark:text-indigo-300',
  last_mile_conversion: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/20 dark:text-violet-300',
  monitor: 'border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  insufficient_data: 'border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
};

const confidenceLabel = (value: GrowthOpportunity['confidence']) => {
  if (value === 'high') return 'wysoka';
  if (value === 'medium') return 'średnia';
  return 'niska';
};

export const GrowthOpportunityPanel: React.FC<Props> = ({ eventId }) => {
  const [opportunity, setOpportunity] = useState<GrowthOpportunity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    growthOpportunityService.getForEvent(eventId)
      .then((next) => { if (mounted) setOpportunity(next); })
      .catch(() => { if (mounted) setOpportunity(null); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [eventId]);

  if (loading) {
    return <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 text-xs text-zinc-500">Analizuję opportunity Growth...</div>;
  }
  if (!opportunity) return null;

  return (
    <section className="rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 mb-5">
        <div className="flex items-start gap-2.5">
          <BadgeEuro className="w-4 h-4 mt-0.5 text-indigo-600 shrink-0" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Beyond Growth · Opportunity</h2>
              <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${playClass[opportunity.play]}`}>
                {playLabel[opportunity.play]}
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Rules-first recommendation. To warstwa decyzyjna nad forecastem — nie automatyczne wykonanie akcji.</p>
          </div>
        </div>
        <div className="text-[10px] text-zinc-400">Confidence: <strong className="text-zinc-600 dark:text-zinc-300">{confidenceLabel(opportunity.confidence)}</strong></div>
      </div>

      <div className="rounded-lg bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-900/50 p-4 mb-4">
        <div className="flex items-start gap-2.5">
          <Gauge className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{opportunity.headline}</p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">{opportunity.diagnosis}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100"><Megaphone className="w-3.5 h-3.5 text-indigo-600" />Rekomendowany play</div>
          <p className="mt-2 text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-300">{opportunity.recommendedAction}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100"><ShieldAlert className="w-3.5 h-3.5 text-amber-600" />Czego nie robić</div>
          <p className="mt-2 text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-300">{opportunity.doNotDo}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100"><Beaker className="w-3.5 h-3.5 text-emerald-600" />Jak mierzymy efekt</div>
          <p className="mt-2 text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-300">{opportunity.pilotMeasurementPlan}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2.5 mb-4">
        {opportunity.evidence.map((item) => (
          <div key={item.label} className="rounded-lg bg-zinc-50 dark:bg-zinc-950/60 p-3">
            <p className="text-[10px] text-zinc-400">{item.label}</p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">{item.value}</p>
          </div>
        ))}
      </div>

      <div className={`rounded-lg border p-3.5 ${opportunity.executionSourceConnected ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/10' : 'border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/10'}`}>
        <div className="flex items-start gap-2">
          {opportunity.executionSourceConnected
            ? <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" />
            : <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-600 shrink-0" />}
          <div>
            <p className={`text-[11px] font-semibold ${opportunity.executionSourceConnected ? 'text-emerald-800 dark:text-emerald-300' : 'text-amber-800 dark:text-amber-300'}`}>
              {opportunity.executionSourceConnected
                ? `Execution source podłączony${opportunity.executionSourceName ? ` · ${opportunity.executionSourceName}` : ''}`
                : 'Measurement gotowy · execution source jeszcze niepodłączony'}
            </p>
            <p className={`mt-1 text-[10px] leading-relaxed ${opportunity.executionSourceConnected ? 'text-emerald-700/80 dark:text-emerald-300/80' : 'text-amber-700/80 dark:text-amber-300/80'}`}>
              {opportunity.dataCaveat}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
