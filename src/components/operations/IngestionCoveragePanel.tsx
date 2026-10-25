import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, DatabaseZap, ShieldCheck } from 'lucide-react';
import { MetricCard } from '../common/MetricCard';
import {
  IngestionCoverageRow,
  ingestionCoverageService,
  ingestionStatusLabel,
  isActionableIngestionStatus
} from '../../services/ingestionCoverageService';

interface IngestionCoveragePanelProps {
  onSelectEvent: (eventId: string) => void;
}

const statusClass = (status: IngestionCoverageRow['ingestion_status']) => {
  if (status === 'TRACKED') return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
  if (status === 'BUFFERING_AWAITING_KICKOFF') return 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800';
  if (status === 'TRACKED_NO_SNAPSHOT' || status === 'MATCH_DISCOVERED_NO_BUFFER') return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800';
  return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
};

const formatKickoff = (value: string | null) => {
  if (!value) return 'Oczekuje na kickoff';
  return new Intl.DateTimeFormat('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Warsaw'
  }).format(new Date(value));
};

export const IngestionCoveragePanel: React.FC<IngestionCoveragePanelProps> = ({ onSelectEvent }) => {
  const [rows, setRows] = useState<IngestionCoverageRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    ingestionCoverageService.getOperationalRows()
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const activeRows = useMemo(
    () => rows.filter((row) => row.ingestion_status !== 'COMPLETED_TRACKED'),
    [rows]
  );
  const healthy = activeRows.filter((row) => row.ingestion_status === 'TRACKED').length;
  const protectedRows = activeRows.filter((row) => row.ingestion_status === 'BUFFERING_AWAITING_KICKOFF').length;
  const alerts = activeRows.filter((row) => isActionableIngestionStatus(row.ingestion_status) && row.ingestion_status !== 'BUFFERING_AWAITING_KICKOFF').length;

  if (isLoading) {
    return <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 text-xs text-zinc-500">Ładowanie pokrycia ingestu…</div>;
  }

  if (error) {
    return <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">Nie udało się odczytać monitoringu ingestu: {error}</div>;
  }

  return (
    <section className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <DatabaseZap className="w-4 h-4 text-indigo-600" />
            Pokrycie ingestu meczów
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Czy każdy wykryty domowy mecz jest już śledzony lub ma zabezpieczoną surową krzywą przed pełnym mapowaniem.
          </p>
        </div>
        <div className="text-[11px] text-zinc-400 whitespace-nowrap">
          {rows[0]?.refreshed_at ? `Odświeżono ${formatKickoff(rows[0].refreshed_at)}` : ''}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <MetricCard label="Śledzone" value={healthy} subtext="Normalny collector aktywny" tooltip="Przyszłe wydarzenia z poprawnym ticket_event i co najmniej jednym snapshotem inventory." />
        <MetricCard label="Krzywa zabezpieczona" value={protectedRows} subtext="Czeka na dokładny kickoff" tooltip="Mecz nie jest jeszcze w normalnym pipeline, ale surowe snapshoty są zapisywane z oryginalnym captured_at i mogą zostać później bezpiecznie podpięte." highlight={protectedRows > 0 ? 'warning' : 'normal'} />
        <MetricCard label="Luki wymagające uwagi" value={alerts} subtext="Brak snapshotu lub promocji" tooltip="Prawdziwe mecze, dla których ingest nie jest jeszcze w stanie bezpiecznym." highlight={alerts > 0 ? 'danger' : 'normal'} />
      </div>

      {activeRows.length === 0 ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/20 p-4 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="w-4 h-4" /> Brak aktywnych meczów wymagających monitoringu.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/75 dark:bg-zinc-900/50 text-zinc-500 font-medium">
                <th className="py-3 px-4">Klub / mecz</th>
                <th className="py-3 px-3">Kickoff</th>
                <th className="py-3 px-3">Status ingestu</th>
                <th className="py-3 px-3 text-right">Snapshoty</th>
                <th className="py-3 px-3 text-right">Raw buffer</th>
                <th className="py-3 px-4">Diagnoza</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {activeRows.map((row) => (
                <tr key={row.record_key} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40">
                  <td className="py-3 px-4 min-w-[230px]">
                    <button
                      type="button"
                      disabled={!row.ticket_event_id}
                      onClick={() => row.ticket_event_id && onSelectEvent(String(row.ticket_event_id))}
                      className={`text-left ${row.ticket_event_id ? 'cursor-pointer hover:text-indigo-600' : 'cursor-default'} transition-colors`}
                    >
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">{row.label || 'Nieopisany kandydat'}</div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">{row.club_name || row.club_slug || '—'} · RoboTicket {row.external_event_id || '—'}</div>
                    </button>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap text-zinc-600 dark:text-zinc-300">{formatKickoff(row.kickoff_at)}</td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-[11px] font-semibold ${statusClass(row.ingestion_status)}`}>
                      {row.ingestion_status === 'TRACKED' ? <ShieldCheck className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                      {ingestionStatusLabel(row.ingestion_status)}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums font-medium text-zinc-700 dark:text-zinc-200">{row.snapshot_count}</td>
                  <td className="py-3 px-3 text-right tabular-nums font-medium text-zinc-700 dark:text-zinc-200">{row.raw_snapshot_count}</td>
                  <td className="py-3 px-4 text-zinc-500 max-w-[320px]">{row.issue_reason || 'Pipeline działa poprawnie.'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
