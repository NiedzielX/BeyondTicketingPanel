import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ArrowUpRight,
  CheckCircle2
} from 'lucide-react';
import { DataIssueEnriched, IssueType } from '../types/ticketing';
import { eventsService } from '../services/eventsService';
import { MetricCard } from '../components/common/MetricCard';
import { SeverityBadge } from '../components/common/StatusBadge';
import { IngestionCoveragePanel } from '../components/operations/IngestionCoveragePanel';
import { formatRelativeUpdate } from '../utils/formatters';

interface DataQualityPageProps {
  onSelectEvent: (eventId: string) => void;
}

export const DataQualityPage: React.FC<DataQualityPageProps> = ({ onSelectEvent }) => {
  const [issues, setIssues] = useState<DataIssueEnriched[]>([]);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [resolvedIssues, setResolvedIssues] = useState<Set<string>>(new Set());

  const loadIssues = async () => {
    setIsLoading(true);
    try {
      const data = await eventsService.getDataIssues();
      setIssues(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadIssues();
  }, []);

  const totalCount = issues.length;
  const criticalCount = issues.filter((i) => i.severity === 'critical').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;

  const filteredIssues = issues.filter((issue) => {
    if (resolvedIssues.has(issue.id)) return false;
    if (severityFilter === 'critical') return issue.severity === 'critical';
    if (severityFilter === 'warning') return issue.severity === 'warning';
    return true;
  });

  const getIssueTypeLabel = (type: IssueType) => {
    switch (type) {
      case 'unusual_sales_drop':
        return 'Nietypowa zmiana sygnału';
      case 'stale_snapshot':
        return 'Nieaktualny snapshot';
      case 'missing_forecast':
        return 'Brak prognozy';
      case 'forecast_older_than_data':
        return 'Forecast starszy od danych';
      default:
        return type;
    }
  };

  const handleSimulateResolve = (issueId: string) => {
    setResolvedIssues((prev) => new Set([...prev, issueId]));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Jakość danych i monitoring pipeline'u
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Monitoring od wykrycia meczu i zabezpieczenia krzywej inventory aż po snapshoty i inferencję modelu.
          </p>
        </div>
      </div>

      <IngestionCoveragePanel onSelectEvent={onSelectEvent} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div
          className={`cursor-pointer transition-transform ${
            severityFilter === 'all' ? 'ring-2 ring-indigo-500 rounded-lg' : ''
          }`}
          onClick={() => setSeverityFilter('all')}
        >
          <MetricCard
            label="Problemy danych/modelu"
            value={totalCount - resolvedIssues.size}
            subtext="Po podpięciu eventu"
            tooltip="Aktywne anomalie snapshotów i inferencji. Luki wcześniejszego etapu discovery/ingest są monitorowane osobno powyżej."
          />
        </div>

        <div
          className={`cursor-pointer transition-transform ${
            severityFilter === 'critical' ? 'ring-2 ring-rose-500 rounded-lg' : ''
          }`}
          onClick={() => setSeverityFilter('critical')}
        >
          <MetricCard
            label="Krytyczne"
            value={criticalCount}
            subtext="Brak danych wejściowych"
            tooltip="Problemy blokujące poprawne wykorzystanie bieżącego meczu, np. brak snapshotu inventory."
            highlight={criticalCount > 0 ? 'danger' : 'normal'}
          />
        </div>

        <div
          className={`cursor-pointer transition-transform ${
            severityFilter === 'warning' ? 'ring-2 ring-amber-500 rounded-lg' : ''
          }`}
          onClick={() => setSeverityFilter('warning')}
        >
          <MetricCard
            label="Ostrzeżenia"
            value={warningCount}
            subtext="Snapshot / prognoza do odświeżenia"
            tooltip="Nieaktualne snapshoty lub brak bieżącej prognozy dla już śledzonego wydarzenia."
            highlight={warningCount > 0 ? 'warning' : 'normal'}
          />
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 p-4 text-xs">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-indigo-600" />
          Zasady walidacji w warstwie ingest Beyond Ticketing
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-zinc-600 dark:text-zinc-400">
          <div className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 mt-1.5 shrink-0" />
            <span>
              <strong>Discovery:</strong> nowy produkt meczowy jest wykrywany automatycznie; parking, VIP, Premium, vouchery, inne dyscypliny i zespoły rezerw są odrzucane fail-closed.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 mt-1.5 shrink-0" />
            <span>
              <strong>Pre-mapping buffer:</strong> jeżeli znamy mecz, ale nie mamy jeszcze zweryfikowanego kickoffu, inventory zapisujemy osobno z oryginalnym captured_at zamiast tracić początek krzywej.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 mt-1.5 shrink-0" />
            <span>
              <strong>Świeżość snapshotu:</strong> aktywny event z poprawnym mappingiem powinien otrzymywać regularne snapshoty; brak pierwszego snapshotu jest osobnym alertem krytycznym.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 mt-1.5 shrink-0" />
            <span>
              <strong>PIT safety:</strong> surowy buffer nie trafia do danych modelowych, dopóki event i kickoff nie są zweryfikowane; po promocji zachowujemy historyczne timestampy obserwacji.
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Wykryte anomalie po podpięciu eventu ({filteredIssues.length})
            </h2>
            <p className="text-xs text-zinc-500">
              Snapshoty inventory i stan inferencji dla meczów, które są już w normalnym pipeline.
            </p>
          </div>

          {severityFilter !== 'all' && (
            <button
              onClick={() => setSeverityFilter('all')}
              className="text-xs text-indigo-600 hover:underline cursor-pointer"
            >
              Pokaż wszystkie priorytety
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-zinc-500 border border-zinc-200 dark:border-zinc-800 rounded-lg">Ładowanie anomalii…</div>
        ) : filteredIssues.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
            <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Brak nierozwiązanych problemów
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              Dla już podpiętych meczów nie wykryto bieżących anomalii snapshotów ani inferencji.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/75 dark:bg-zinc-900/50 text-zinc-500 font-medium">
                  <th className="py-3 px-4">Event</th>
                  <th className="py-3 px-3">Typ problemu</th>
                  <th className="py-3 px-3">Opis</th>
                  <th className="py-3 px-3">Wykryto</th>
                  <th className="py-3 px-3">Priorytet</th>
                  <th className="py-3 px-4 text-right">Akcja</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {filteredIssues.map((issue) => (
                  <tr key={issue.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-zinc-900 dark:text-zinc-100">
                      <div onClick={() => onSelectEvent(issue.eventId)} className="cursor-pointer group flex flex-col">
                        <span className="group-hover:text-indigo-600 dark:group-hover:text-indigo-400 font-semibold transition-colors flex items-center gap-1">
                          {issue.eventName}
                          <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </span>
                        <span className="text-[11px] text-zinc-400 font-normal">{issue.club}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 font-medium text-zinc-800 dark:text-zinc-200 whitespace-nowrap">{getIssueTypeLabel(issue.type)}</td>
                    <td className="py-3.5 px-3 text-zinc-600 dark:text-zinc-300 max-w-md leading-relaxed">{issue.description}</td>
                    <td className="py-3.5 px-3 tabular-nums text-zinc-500 whitespace-nowrap">{formatRelativeUpdate(issue.detectedAt)}</td>
                    <td className="py-3.5 px-3 whitespace-nowrap"><SeverityBadge severity={issue.severity} /></td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => onSelectEvent(issue.eventId)} className="px-2.5 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded hover:bg-indigo-100 transition-colors cursor-pointer">Zobacz event</button>
                        <button onClick={() => handleSimulateResolve(issue.id)} className="px-2 py-1 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors cursor-pointer" title="Oznacz jako zweryfikowane">Wycisz</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
