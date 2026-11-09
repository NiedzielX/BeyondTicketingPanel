import React, { useEffect, useId, useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { parseRolling72Feed, ROLLING72_MODEL_LABELS } from '../../services/rolling72ForecastService';
import type { Rolling72Feed, Rolling72ModelName, Rolling72Vintage } from '../../services/rolling72ForecastService';
import { rolling72ForecastGeometry } from './rolling72ForecastGeometry';
import type { Rolling72PlotPoint } from './rolling72ForecastGeometry';
import { formatDelta, formatNumber } from '../../utils/formatters';

interface Rolling72ForecastChartProps {
  eventId?: string;
  /** Explicit preview URL only; normal event widgets use the configured feed. */
  feedUrl?: string;
  researchSnapshot?: boolean;
}
type State = { status: 'loading' | 'missing' | 'error' } | { status: 'ready'; feed: Rolling72Feed; vintages: Rolling72Vintage[] };
const dateTime = (at: string | number) => new Intl.DateTimeFormat('pl-PL', {
  timeZone: 'Europe/Warsaw', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
}).format(new Date(at));
const clubName = (slug: string) => ({ jagiellonia: 'Jagiellonia Białystok', piastgliwice: 'Piast Gliwice' }[slug]
  ?? slug.replace(/[-_]/g, ' ').replace(/^./, value => value.toUpperCase()));
const key = (v: Rolling72Vintage) => `${v.ticket_event_id}:${v.issued_at}`;

export const Rolling72ForecastChart: React.FC<Rolling72ForecastChartProps> = ({ eventId, feedUrl, researchSnapshot = false }) => {
  const id = useId().replace(/:/g, '');
  const configured = import.meta.env?.VITE_ROLLING72_FEED_URL;
  const url = feedUrl === undefined ? (typeof configured === 'string' ? configured.trim() : '') : feedUrl.trim();
  const [state, setState] = useState<State>({ status: url ? 'loading' : 'missing' });
  const [selectedKey, setSelectedKey] = useState('');
  const [model, setModel] = useState<Rolling72ModelName>('drift');
  const [viewport, setViewport] = useState<'recent' | 'full'>('recent');
  const [hovered, setHovered] = useState<Rolling72PlotPoint | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setSelectedKey(''); setHovered(null);
    if (!url) { setState({ status: 'missing' }); return () => controller.abort(); }
    setState({ status: 'loading' });
    fetch(url, { signal: controller.signal, credentials: 'omit', cache: 'no-store' })
      .then(async response => {
        if (controller.signal.aborted) return;
        if (response.status === 404 || (response.headers.get('content-type') ?? '').includes('text/html')) {
          setState({ status: 'missing' }); return;
        }
        if (!response.ok) throw new Error('Feed unavailable');
        const feed = parseRolling72Feed(await response.json());
        if (controller.signal.aborted) return;
        const vintages = feed.vintages.filter(v => eventId === undefined || String(v.ticket_event_id) === eventId)
          .sort((a, b) => Date.parse(b.issued_at) - Date.parse(a.issued_at) || a.ticket_event_id - b.ticket_event_id);
        setState({ status: 'ready', feed, vintages });
        if (vintages[0]) {
          setSelectedKey(key(vintages[0]));
          // Choose an available named benchmark for the initial view; never
          // put persistence numbers under the drift label at a cold start.
          setModel(vintages[0].points.some(point => point.models.drift.status === 'READY') ? 'drift' : 'persistence');
        }
      })
      .catch(() => { if (!controller.signal.aborted) setState({ status: 'error' }); });
    return () => controller.abort();
  }, [eventId, url, refresh]);

  const vintage = state.status === 'ready' ? state.vintages.find(v => key(v) === selectedKey
    && (eventId === undefined || String(v.ticket_event_id) === eventId)) : undefined;
  const geometry = vintage ? rolling72ForecastGeometry(vintage, model, { viewport }) : undefined;
  const latest = vintage?.observations[vintage.observations.length - 1];
  const unavailable = state.status === 'missing' || (state.status === 'ready' && state.vintages.length === 0);
  const evaluated = vintage?.points.filter(p => p.models[model].score !== null) ?? [];

  return <section data-testid="rolling72-chart" aria-labelledby={`${id}-heading`} className="rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-xs">
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 id={`${id}-heading`} className="text-base font-semibold">Prognoza dostępności +24 / +48 / +72 h</h2>
          <span className="rounded-full border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 text-[10px] font-medium text-amber-800 dark:text-amber-300">Benchmark badawczy</span>
        </div>
        <p className="mt-1 text-xs text-zinc-500">Rzeczywiste odczyty i zapisane przewidywania kolejnych trzech dni.</p>
      </div>
      <button type="button" disabled={!url || state.status === 'loading'} onClick={() => setRefresh(value => value + 1)} className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 px-2.5 py-1.5 text-xs disabled:opacity-40 cursor-pointer">
        <RefreshCw className={`h-3.5 w-3.5 ${state.status === 'loading' ? 'animate-spin' : ''}`} />Odśwież
      </button>
    </div>

    {state.status === 'loading' && <p className="py-12 text-center text-xs text-zinc-500">Wczytywanie zapisanych prognoz…</p>}
    {unavailable && <p data-testid="rolling72-unavailable" className="rounded-lg bg-zinc-50 dark:bg-zinc-800/40 p-4 text-xs text-zinc-500">Prognozy +24/+48/+72 h nie są jeszcze dostępne dla tego meczu.</p>}
    {state.status === 'error' && <p role="alert" className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 p-4 text-xs text-amber-800 dark:text-amber-300"><AlertCircle className="h-4 w-4 shrink-0" />Nie udało się wczytać poprawnej prognozy. Spróbuj odświeżyć.</p>}

    {vintage && geometry && state.status === 'ready' && <>
      {researchSnapshot && <div data-testid="rolling72-snapshot" className="mb-4 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/20 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
        <strong>Zapis badawczy z {dateTime(state.feed.generated_at)}</strong> · To zapisany stan, a nie źródło aktualizowane na żywo.
      </div>}
      <div className="mb-4 flex flex-wrap gap-3 text-xs">
        <label className="flex min-w-0 flex-col gap-1 text-zinc-500" htmlFor={`${id}-vintage`}>Mecz i wersja prognozy
          <select id={`${id}-vintage`} aria-label="Mecz i wersja prognozy" value={selectedKey} onChange={e => { setSelectedKey(e.target.value); setHovered(null); }} className="max-w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-zinc-800 dark:text-zinc-100">
            {state.vintages.map(v => <option key={key(v)} value={key(v)}>{clubName(v.club_slug)} · {dateTime(v.issued_at)}</option>)}
          </select>
        </label>
        <label className="flex min-w-0 flex-col gap-1 text-zinc-500" htmlFor={`${id}-model`}>Wariant
          <select id={`${id}-model`} aria-label="Wariant prognozy" value={model} onChange={e => { setModel(e.target.value as Rolling72ModelName); setHovered(null); }} className="max-w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-zinc-800 dark:text-zinc-100">
            {(Object.keys(ROLLING72_MODEL_LABELS) as Rolling72ModelName[]).map(name => <option key={name} value={name}>{ROLLING72_MODEL_LABELS[name]}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-zinc-500" htmlFor={`${id}-viewport`}>Historia
          <select id={`${id}-viewport`} aria-label="Zakres historii" value={viewport} onChange={e => setViewport(e.target.value as 'recent' | 'full')} className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-zinc-800 dark:text-zinc-100">
            <option value="recent">Ostatnie 7 dni</option><option value="full">Cała historia</option>
          </select>
        </label>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {vintage.points.map(point => {
          const prediction = point.models[model];
          return <div key={point.horizon_hours} data-testid={`rolling72-card-${point.horizon_hours}`} className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30 p-3">
            <div className="text-xs font-medium text-zinc-500">Za {point.horizon_hours} h</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums" data-testid="forecast-value">{prediction.predicted_available_total === null ? '—' : formatNumber(prediction.predicted_available_total)}</div>
            <div className="text-[11px] text-zinc-500">{prediction.predicted_available_total === null ? (point.status === 'TARGET_NOT_BEFORE_KICKOFF' ? 'Horyzont poza okresem przed meczem' : 'Ten wariant jest niedostępny') : 'przewidywane wolne miejsca'}</div>
            {prediction.predicted_delta !== null && <div className="mt-1 text-xs tabular-nums text-zinc-600 dark:text-zinc-300">{formatDelta(prediction.predicted_delta)} względem ostatniego odczytu</div>}
            {point.target_at && <time dateTime={point.target_at} className="mt-1 block text-[10px] text-zinc-400">{dateTime(point.target_at)}</time>}
            {prediction.score && <p className="mt-2 text-[11px] text-amber-700 dark:text-amber-300">Późniejszy odczyt: {formatNumber(prediction.score.target_available_total)} · błąd: {formatNumber(prediction.score.absolute_error)}</p>}
          </div>;
        })}
      </div>

      <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-zinc-500">
        <span className="inline-flex items-center gap-1.5"><span className="w-5 border-t-2 border-indigo-500" />Rzeczywiste odczyty</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-5 border-t-2 border-dashed border-emerald-600" />Zapisana prognoza</span>
        {geometry.realized.length > 0 && <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" />Późniejszy odczyt</span>}
      </div>
      <svg viewBox={`0 0 ${geometry.width} ${geometry.height}`} className="w-full" role="img" aria-labelledby={`${id}-title ${id}-description`}>
        <title id={`${id}-title`}>Rzeczywista dostępność i prognoza kolejnych 24, 48 i 72 godzin</title>
        <desc id={`${id}-description`}>Punkty przyszłe pochodzą z wersji wydanej {dateTime(vintage.issued_at)}. Kotwicą jest ostatni rzeczywisty odczyt. Brak prognozy przerywa linię. Publiczna dostępność nie jest potwierdzoną sprzedażą.</desc>
        <defs><clipPath id={`${id}-clip`}><rect x={geometry.padding.left} y={geometry.padding.top} width={geometry.plotWidth} height={geometry.plotHeight} /></clipPath></defs>
        {[0, 1, 2, 3, 4].map(i => {
          const value = geometry.yMax * i / 4;
          return <g key={i}><line x1={geometry.padding.left} x2={geometry.width - geometry.padding.right} y1={geometry.getY(value)} y2={geometry.getY(value)} stroke="currentColor" className="text-zinc-100 dark:text-zinc-800" /><text x={geometry.padding.left - 10} y={geometry.getY(value) + 4} textAnchor="end" className="fill-zinc-400 text-[10px]">{formatNumber(value)}</text></g>;
        })}
        {[geometry.start, Date.parse(vintage.issued_at), geometry.end].filter((at, i, values) => values.indexOf(at) === i).map((at, i, values) => <text key={at} x={geometry.getX(at)} y={geometry.height - 17} textAnchor={i === 0 ? 'start' : i === values.length - 1 ? 'end' : 'middle'} className="fill-zinc-500 text-[10px]">{dateTime(at)}</text>)}
        <g clipPath={`url(#${id}-clip)`}>
          <line x1={geometry.issueX} x2={geometry.issueX} y1={geometry.padding.top} y2={geometry.height - geometry.padding.bottom} stroke="#a1a1aa" strokeDasharray="4 4" />
          <path d={geometry.observedPath} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinejoin="round" />
          <path d={geometry.predictedPath} fill="none" stroke="#059669" strokeWidth="2.5" strokeDasharray="6 4" strokeLinejoin="round" />
          {[...(geometry.anchor ? [geometry.anchor] : []), ...geometry.predicted, ...geometry.realized].map((point, i) => <circle key={`${point.kind}-${i}`} cx={point.x} cy={point.y} r={4} fill={point.kind === 'prediction' ? '#059669' : point.kind === 'realized' ? '#f59e0b' : '#6366f1'} stroke="white" strokeWidth="1" tabIndex={0} aria-label={`${point.kind === 'prediction' ? `Prognoza +${point.horizonHours} h` : 'Odczyt'}: ${formatNumber(point.value)} miejsc, ${dateTime(point.at)}`} onMouseEnter={() => setHovered(point)} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered(point)} onBlur={() => setHovered(null)} />)}
        </g>
      </svg>
      <p className="min-h-5 text-xs text-zinc-500">{hovered ? `${hovered.kind === 'prediction' ? `Prognoza +${hovered.horizonHours} h` : 'Rzeczywisty odczyt'} · ${dateTime(hovered.at)} · ${formatNumber(hovered.value)} miejsc` : 'Wskaż punkt, aby zobaczyć jego czas i wartość.'}</p>
      <div className="mt-3 border-t border-zinc-100 dark:border-zinc-800 pt-3 text-[11px] leading-relaxed text-zinc-500">
        {latest && <p>Ostatni odczyt: <strong>{formatNumber(latest.available_total)} miejsc</strong> · {dateTime(latest.captured_at)}. Wersja wydana: {dateTime(vintage.issued_at)}.</p>}
        <p>{evaluated.length ? `Późniejsze odczyty oceniono dla ${evaluated.length} z 3 horyzontów tej wersji.` : 'Ocena tej wersji czeka na późniejsze odczyty po 24, 48 i 72 godzinach.'}</p>
        <p className="mt-1">Dane dotyczą publicznie widocznych miejsc, nie potwierdzonej sprzedaży. Wpływ zmian cen i promocji nie jest tu oszacowany.</p>
      </div>
    </>}
  </section>;
};
