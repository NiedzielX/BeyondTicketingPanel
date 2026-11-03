import React, { useEffect, useId, useState } from 'react';
import { AlertCircle, CalendarClock, RefreshCw } from 'lucide-react';
import { fetchDailyInventoryPaths } from '../../services/dailyInventoryPathService';
import type { DailyInventoryPathEvent, DailyInventoryPathFeed } from '../../services/dailyInventoryPathService';
import { dailyInventoryPathGeometry, daysToKickoff } from './dailyInventoryPathGeometry';
import type { InventoryPlotPoint } from './dailyInventoryPathGeometry';
import { formatNumber } from '../../utils/formatters';

interface DailyInventoryPathChartProps {
  eventId: string;
}

type LoadState =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'error' }
  | { status: 'ready'; events: DailyInventoryPathEvent[]; generatedAt: string; trainingSupport?: DailyInventoryPathFeed['training_support'] };

const dateTime = (at: string) => new Intl.DateTimeFormat('pl-PL', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(at));
const dateOnly = (at: string | number) => new Intl.DateTimeFormat('pl-PL', { day: '2-digit', month: '2-digit' }).format(new Date(at));
const vintageKey = (event: DailyInventoryPathEvent) => `${event.issued_as_of_at}|${event.model_sha256 || event.status}`;

export const DailyInventoryPathChart: React.FC<DailyInventoryPathChartProps> = ({ eventId }) => {
  const chartId = useId();
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [selectedKey, setSelectedKey] = useState('');
  const [hovered, setHovered] = useState<InventoryPlotPoint | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading' });
    setSelectedKey('');
    setHovered(null);
    fetchDailyInventoryPaths(controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        if (result.status === 'missing') {
          setState({ status: 'missing' });
          return;
        }
        const events = result.feed.events
          .filter((event) => String(event.ticket_event_id) === eventId)
          .sort((a, b) => Date.parse(b.issued_as_of_at) - Date.parse(a.issued_as_of_at));
        setState({ status: 'ready', events, generatedAt: result.feed.generated_at, trainingSupport: result.feed.training_support });
        if (events[0]) setSelectedKey(vintageKey(events[0]));
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: 'error' });
      });
    return () => controller.abort();
  }, [eventId, refreshIndex]);

  const event = state.status === 'ready' ? state.events.find((item) => vintageKey(item) === selectedKey) : undefined;
  const geometry = event?.status === 'READY' && event.observations.length ? dailyInventoryPathGeometry(event) : undefined;
  const leadPoints = [1, 3, 7].map((lead) => ({ lead, point: event?.points.find((point) => point.lead_days === lead) }));
  const scoredPoints = event?.points.filter((point) => point.score) ?? [];
  const vintageMae = scoredPoints.length ? scoredPoints.reduce((sum, point) => sum + point.score!.candidate_abs_error, 0) / scoredPoints.length : undefined;
  const baselineMae = scoredPoints.length ? scoredPoints.reduce((sum, point) => sum + point.score!.baseline_abs_error, 0) / scoredPoints.length : undefined;
  const trainedLead = state.status === 'ready' && state.trainingSupport && event && state.trainingSupport.model_sha256 === event.model_sha256 ? state.trainingSupport.max_lead_days : undefined;

  let emptyMessage: string | undefined;
  if (state.status === 'missing' || (state.status === 'ready' && state.events.length === 0)) {
    emptyMessage = 'Dla tego meczu nie ma jeszcze zapisanej prognozy kolejnych dni.';
  } else if (state.status === 'error') {
    emptyMessage = 'Nie udało się wczytać poprawnej ścieżki prognozy. Spróbuj odświeżyć dane.';
  } else if (event && event.status !== 'READY') {
    emptyMessage = 'W tej chwili dane nie spełniały warunków potrzebnych do utworzenia prognozy kolejnych dni.';
  }

  return (
    <section className="rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-white dark:bg-zinc-900 p-5 shadow-xs" aria-labelledby={`${chartId}-heading`}>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 id={`${chartId}-heading`} className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Prognoza dostępności na kolejne dni</h2>
            <span className="rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 px-2 py-0.5 text-[10px] font-medium text-amber-800 dark:text-amber-300">Podgląd badawczy</span>
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Historia publicznej dostępności i przewidywane wartości w następnych dniach. Każda wersja zachowuje chwilę utworzenia.</p>
        </div>
        <button type="button" onClick={() => setRefreshIndex((value) => value + 1)} disabled={state.status === 'loading'} className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-600 dark:text-zinc-300 disabled:opacity-50 cursor-pointer">
          <RefreshCw className={`h-3.5 w-3.5 ${state.status === 'loading' ? 'animate-spin' : ''}`} />Odśwież
        </button>
      </div>

      {state.status === 'loading' && <div className="py-12 text-center text-xs text-zinc-500">Wczytywanie zapisanych ścieżek…</div>}
      {emptyMessage && <div className={`flex items-start gap-2 rounded-lg p-4 text-xs ${state.status === 'error' ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-200' : 'bg-zinc-50 dark:bg-zinc-800/40 text-zinc-500 dark:text-zinc-400'}`}>
        <AlertCircle className="h-4 w-4 shrink-0" /><p>{emptyMessage}</p>
      </div>}

      {state.status === 'ready' && state.events.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs mb-4">
          <label htmlFor={`${chartId}-vintage`} className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
            <CalendarClock className="h-4 w-4 text-indigo-500" />Wersja prognozy
            <select id={`${chartId}-vintage`} value={selectedKey} onChange={(change) => { setSelectedKey(change.target.value); setHovered(null); }} className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1 text-xs">
              {state.events.map((item) => <option key={vintageKey(item)} value={vintageKey(item)}>{dateTime(item.issued_as_of_at)} · P-{Math.round(daysToKickoff(item.issued_as_of_at, item.kickoff_at))}</option>)}
            </select>
          </label>
          <span className="text-zinc-400">Eksport: {dateTime(state.generatedAt)}</span>
        </div>
      )}

      {event?.status === 'READY' && geometry && (
        <>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-zinc-600 dark:text-zinc-300 mb-3">
            <span className="inline-flex items-center gap-1.5"><span className="w-5 border-t-2 border-indigo-500" />Zaobserwowane wolne miejsca</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-5 border-t-2 border-dashed border-emerald-600" />Przewidywane wolne miejsca</span>
            {geometry.realized.length > 0 && <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" />Późniejszy rzeczywisty odczyt</span>}
            <span className="inline-flex items-center gap-1.5"><span className="h-3 border-l border-dashed border-zinc-400" />Stan wiedzy w chwili prognozy</span>
          </div>
          <svg viewBox={`0 0 ${geometry.width} ${geometry.height}`} className="w-full overflow-visible" role="img" aria-labelledby={`${chartId}-title ${chartId}-description`}>
            <title id={`${chartId}-title`}>Publiczna dostępność i modelowa prognoza kolejnych dni</title>
            <desc id={`${chartId}-description`}>Linia ciągła oznacza rzeczywiste obserwacje do {dateTime(event.issued_as_of_at)}. Punkty na linii przerywanej to przewidywania przyszłych dni. Przerwy w obserwacjach dłuższe niż dobę pozostają widoczne. Nie jest to potwierdzona sprzedaż biletów.</desc>
            {geometry.yTicks.map((value) => <g key={value}>
              <line x1={geometry.padding.left} x2={geometry.width - geometry.padding.right} y1={geometry.getY(value)} y2={geometry.getY(value)} stroke="currentColor" className="text-zinc-100 dark:text-zinc-800" />
              <text x={geometry.padding.left - 10} y={geometry.getY(value) + 4} textAnchor="end" className="fill-zinc-400 text-[10px]">{formatNumber(value)}</text>
            </g>)}
            {geometry.xTicks.map((at, index) => <g key={at}>
              <text x={geometry.getX(at)} y={geometry.height - 23} textAnchor={index === 0 ? 'start' : index === geometry.xTicks.length - 1 ? 'end' : 'middle'} className="fill-zinc-500 text-[10px]">{dateOnly(at)}</text>
              <text x={geometry.getX(at)} y={geometry.height - 8} textAnchor={index === 0 ? 'start' : index === geometry.xTicks.length - 1 ? 'end' : 'middle'} className="fill-zinc-400 text-[9px]">P-{Math.round(daysToKickoff(new Date(at).toISOString(), event.kickoff_at))}</text>
            </g>)}
            <line x1={geometry.issueX} x2={geometry.issueX} y1={geometry.padding.top} y2={geometry.height - geometry.padding.bottom} stroke="#a1a1aa" strokeDasharray="4 4" />
            <text x={Math.max(geometry.padding.left, Math.min(geometry.width - 100, geometry.issueX + 5))} y={geometry.padding.top - 8} className="fill-zinc-500 text-[10px]">Chwila prognozy</text>
            {geometry.observedPath && <path d={geometry.observedPath} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinejoin="round" />}
            {geometry.predictedPath && <path d={geometry.predictedPath} fill="none" stroke="#059669" strokeWidth="2.5" strokeDasharray="6 4" strokeLinejoin="round" />}
            {[...geometry.observed, ...geometry.predicted, ...geometry.realized].map((point, index) => <circle key={`${point.kind}-${point.at}-${index}`} cx={point.x} cy={point.y} r={point.kind === 'observation' ? 2.5 : 4} fill={point.kind === 'prediction' ? '#059669' : point.kind === 'realized' ? '#f59e0b' : '#6366f1'} stroke="white" strokeWidth="1" tabIndex={0} aria-label={`${point.kind === 'prediction' ? 'Prognoza' : 'Obserwacja'} ${dateTime(point.at)}: ${formatNumber(point.value)} miejsc`} onMouseEnter={() => setHovered(point)} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered(point)} onBlur={() => setHovered(null)} />)}
          </svg>
          <div className="min-h-7 text-xs text-zinc-600 dark:text-zinc-300">
            {hovered ? <span><strong>{hovered.kind === 'prediction' ? `Prognoza +${hovered.leadDays} d` : 'Obserwacja'}</strong> · {dateTime(hovered.at)} · {formatNumber(hovered.value)} wolnych miejsc</span> : <span className="text-zinc-400">Wskaż punkt, aby odczytać datę i wartość.</span>}
          </div>
          {vintageMae !== undefined && <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-300">Błąd tej wersji: <strong>{formatNumber(vintageMae)} miejsc</strong> · baseline bez zmiany: {formatNumber(baselineMae!)} miejsc · ocenione punkty: {scoredPoints.length}/{event.points.length}. To wynik jednego meczu i jednej wersji prognozy.</p>}
          {event.points.length > 0 ? <div className="mt-3 grid grid-cols-3 gap-3">
            {leadPoints.map(({ lead, point }) => <div key={lead} className="rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30 px-3 py-2">
              <div className="text-[10px] text-zinc-500">Za {lead} {lead === 1 ? 'dzień' : 'dni'}</div>
              <div className="mt-0.5 text-base font-semibold tabular-nums text-zinc-800 dark:text-zinc-100">{point ? formatNumber(point.predicted_available_total) : '—'}</div>
              <div className="text-[10px] text-zinc-400">{point ? 'przewidywana dostępność' : 'poza zakresem przed meczem'}</div>
            </div>)}
          </div> : <p className="mt-2 text-xs text-zinc-500">Do meczu nie pozostał już kolejny pełny dzienny punkt prognozy.</p>}
          <p className="mt-3 text-[11px] text-zinc-500 leading-relaxed">To prognoza miejsc widocznych jako dostępne publicznie. Wzrost lub spadek tej liczby nie wyjaśnia samodzielnie sprzedaży, blokad ani uwalniania puli. Podgląd nie stanowi jeszcze potwierdzenia jakości na przyszłych meczach.</p>
          {trainedLead !== undefined && event.points.some((point) => point.lead_days > trainedLead) && <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">Punkty dalsze niż {trainedLead} dni od chwili wydania są ekstrapolacją poza zakresem dni obecnych w treningu. Ich dokładność wymaga osobnego sprawdzenia.</p>}
          <details className="mt-3 text-xs text-zinc-500">
            <summary className="cursor-pointer">Wartości na kolejne dni i pochodzenie prognozy</summary>
            <p className="mt-2 break-all font-mono text-[10px]">{event.model_version} · {event.model_sha256}</p>
            {event.points.length > 0 && <div className="mt-2 overflow-x-auto"><table className="w-full text-left text-[11px]">
              <thead><tr className="border-b border-zinc-100 dark:border-zinc-800"><th className="py-2">Dzień</th><th>Do meczu</th><th>Prognoza miejsc</th><th>Baseline bez zmiany</th><th>Odczyt</th><th>Błąd prognozy</th></tr></thead>
              <tbody>{event.points.map((point) => <tr key={point.target_at} className="border-b border-zinc-50 dark:border-zinc-800/60"><td className="py-1.5">{dateOnly(point.target_at)} (+{point.lead_days} d)</td><td>P-{Math.round(daysToKickoff(point.target_at, event.kickoff_at))}</td><td className="tabular-nums">{formatNumber(point.predicted_available_total)}</td><td className="tabular-nums">{formatNumber(point.baseline_available_total)}</td><td className="tabular-nums">{point.score ? formatNumber(point.score.target_available_total) : 'Oczekuje'}</td><td className="tabular-nums">{point.score ? formatNumber(point.score.candidate_abs_error) : '—'}</td></tr>)}</tbody>
            </table></div>}
          </details>
        </>
      )}
    </section>
  );
};
