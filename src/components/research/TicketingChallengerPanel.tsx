import React, { useEffect, useMemo, useState } from 'react';
import { Activity, Beaker, Gauge, ShieldCheck } from 'lucide-react';
import {
  TicketingChallengerModel,
  TicketingChallengerSummary,
  ticketingChallengerService
} from '../../services/ticketingChallengerService';

const fmt = (value: number, digits = 0) =>
  value.toLocaleString('pl-PL', { minimumFractionDigits: digits, maximumFractionDigits: digits });

const protocolLabel = (protocol: string) => {
  if (protocol === 'leave_one_club_out') return 'Leave-one-club-out';
  if (protocol === 'leave_one_event_out') return 'Leave-one-event-out';
  return protocol;
};

export const TicketingChallengerPanel: React.FC = () => {
  const [rows, setRows] = useState<TicketingChallengerSummary[]>([]);
  const [model, setModel] = useState<TicketingChallengerModel | null>(null);

  useEffect(() => {
    Promise.all([
      ticketingChallengerService.getSummary(),
      ticketingChallengerService.getModel()
    ])
      .then(([nextRows, nextModel]) => {
        setRows(nextRows);
        setModel(nextModel);
      })
      .catch(() => {
        setRows([]);
        setModel(null);
      });
  }, []);

  const loco = useMemo(
    () => rows.find((row) => row.protocol === 'leave_one_club_out'),
    [rows]
  );

  if (rows.length === 0 && !model) return null;

  return (
    <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 mb-5">
        <div className="flex items-start gap-2.5">
          <Activity className="w-4 h-4 mt-0.5 text-indigo-600 shrink-0" />
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Ticketing Challenger v1</h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-3xl">
              Sprawdzamy, czy tempo ubywania publicznie dostępnych miejsc na T‑24h poprawia prognozę ponad sam baseline i prostą korektę jego biasu.
            </p>
          </div>
        </div>
        <span className="inline-flex w-fit items-center rounded-full border border-violet-200 dark:border-violet-900/60 bg-violet-50 dark:bg-violet-950/20 px-2.5 py-1 text-[10px] font-semibold text-violet-700 dark:text-violet-300">
          Shadow · bez wpływu na P50
        </span>
      </div>

      {loco && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-5">
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
            <p className="text-[10px] uppercase tracking-wide text-zinc-400">Baseline MAE</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">{fmt(loco.baselineMae, 1)}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
            <p className="text-[10px] uppercase tracking-wide text-zinc-400">Bias-only MAE</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">{fmt(loco.biasControlMae, 1)}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
            <p className="text-[10px] uppercase tracking-wide text-zinc-400">Ticketing MAE</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">{fmt(loco.challengerMae, 1)}</p>
          </div>
          <div className="rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/10 p-3">
            <p className="text-[10px] uppercase tracking-wide text-emerald-600 dark:text-emerald-400">Ticketing ponad bias</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300">+{fmt(loco.incrementalTicketingUplift, 1)}</p>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden mb-4">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-950/70 text-[10px] uppercase tracking-wide text-zinc-400">
              <tr>
                <th className="px-3 py-2.5 text-left font-medium">Walidacja</th>
                <th className="px-3 py-2.5 text-right font-medium">N</th>
                <th className="px-3 py-2.5 text-right font-medium">Kluby</th>
                <th className="px-3 py-2.5 text-right font-medium">Baseline MAE</th>
                <th className="px-3 py-2.5 text-right font-medium">Bias-only</th>
                <th className="px-3 py-2.5 text-right font-medium">Ticketing</th>
                <th className="px-3 py-2.5 text-right font-medium">Δ vs baseline</th>
                <th className="px-3 py-2.5 text-right font-medium">Δ vs bias-only</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {rows.map((row) => (
                <tr key={row.protocol}>
                  <td className="px-3 py-3 font-medium text-zinc-800 dark:text-zinc-200">{protocolLabel(row.protocol)}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-zinc-600 dark:text-zinc-300">{row.eventCount}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-zinc-600 dark:text-zinc-300">{row.clubCount}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{fmt(row.baselineMae, 1)}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{fmt(row.biasControlMae, 1)}</td>
                  <td className="px-3 py-3 text-right tabular-nums font-medium">{fmt(row.challengerMae, 1)}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-emerald-600">+{fmt(row.upliftVsBaseline, 1)}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-emerald-600">+{fmt(row.incrementalTicketingUplift, 1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {model && (
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3.5 mb-4">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px]">
            <div><span className="text-zinc-400">Model</span><span className="ml-1.5 font-medium text-zinc-800 dark:text-zinc-200">Ridge α={model.ridgeAlpha}</span></div>
            <div><span className="text-zinc-400">Feature</span><span className="ml-1.5 font-medium text-zinc-800 dark:text-zinc-200">hybrid velocity 6h</span></div>
            <div><span className="text-zinc-400">Training</span><span className="ml-1.5 font-medium text-zinc-800 dark:text-zinc-200">{model.trainingEventCount} eventów / {model.trainingClubCount} klubów</span></div>
            <div><span className="text-zinc-400">Status</span><span className="ml-1.5 font-medium text-violet-700 dark:text-violet-300">shadow active</span></div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950/60 p-3">
          <div className="flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-200"><Gauge className="w-3.5 h-3.5 text-indigo-600" />Hybrid velocity 6h</div>
          <p className="mt-1 text-zinc-500">Preferujemy sector-matched velocity. Raw velocity jest fallbackiem, gdy nie ma stabilnego dopasowania sektorów.</p>
        </div>
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950/60 p-3">
          <div className="flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-200"><Beaker className="w-3.5 h-3.5 text-violet-600" />Bias control</div>
          <p className="mt-1 text-zinc-500">Pokazujemy osobno poprawę wynikającą tylko z kalibracji baseline, żeby nie przypisywać jej ticketingowi.</p>
        </div>
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950/60 p-3">
          <div className="flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-200"><ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />Najmocniejszy test: club-out</div>
          <p className="mt-1 text-zinc-500">W leave-one-club-out model nie widzi żadnego meczu klubu, który właśnie prognozuje.</p>
        </div>
      </div>
    </section>
  );
};
