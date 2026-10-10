import React, { useEffect, useState } from 'react';
import { Activity, CloudRain, Database, Gauge, Thermometer, Wind } from 'lucide-react';
import {
  EventLiveState,
  EventWeatherState,
  researchService
} from '../../services/researchService';

const n = (value?: number, digits = 0) =>
  value === undefined || Number.isNaN(value)
    ? '—'
    : value.toLocaleString('pl-PL', { maximumFractionDigits: digits, minimumFractionDigits: digits });

const signed = (value?: number, digits = 1) => {
  if (value === undefined || Number.isNaN(value)) return '—';
  return `${value > 0 ? '+' : ''}${n(value, digits)}`;
};

const weatherLabel = (code?: number) => {
  if (code === undefined) return 'Brak kodu pogody';
  if (code === 0) return 'Bezchmurnie';
  if ([1, 2, 3].includes(code)) return 'Zachmurzenie';
  if ([45, 48].includes(code)) return 'Mgła';
  if (code >= 51 && code <= 57) return 'Mżawka';
  if (code >= 61 && code <= 67) return 'Deszcz';
  if (code >= 71 && code <= 77) return 'Śnieg';
  if (code >= 80 && code <= 82) return 'Przelotny deszcz';
  if (code >= 85 && code <= 86) return 'Przelotny śnieg';
  if (code >= 95) return 'Burza';
  return `Kod WMO ${code}`;
};

const qualityLabel = (quality?: string) => {
  if (quality === 'sector_matched_plus_raw') return 'sector-matched + raw';
  if (quality === 'raw_total_only') return 'raw inventory';
  if (quality === 'single_snapshot_only') return 'pojedynczy snapshot';
  if (quality === 'no_live_state') return 'brak live state';
  return quality || '—';
};

interface Props {
  eventId: string;
}

export const DemandSignalsPanel: React.FC<Props> = ({ eventId }) => {
  const [live, setLive] = useState<EventLiveState | null>(null);
  const [weather, setWeather] = useState<EventWeatherState | null>(null);

  useEffect(() => {
    Promise.all([
      researchService.getEventLiveState(eventId),
      researchService.getEventWeather(eventId)
    ])
      .then(([liveState, weatherState]) => {
        setLive(liveState);
        setWeather(weatherState);
      })
      .catch(() => {
        setLive(null);
        setWeather(null);
      });
  }, [eventId]);

  if (!live && !weather) return null;

  const availableIndexPct = live?.availableIndex !== undefined ? live.availableIndex * 100 : undefined;
  const weatherCaptured = weather?.capturedAt
    ? new Intl.DateTimeFormat('pl-PL', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(weather.capturedAt))
    : undefined;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-2.5">
            <Activity className="w-4 h-4 mt-0.5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Demand Signals</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Live inventory jako proxy popytu, nie potwierdzona sprzedaż.</p>
            </div>
          </div>
          <span className="text-[10px] uppercase tracking-wide font-semibold rounded border border-zinc-200 dark:border-zinc-700 px-2 py-1 text-zinc-500">
            {qualityLabel(live?.featureQuality)}
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/60 p-3">
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500"><Gauge className="w-3.5 h-3.5" />Inventory index</div>
            <div className="mt-1 text-lg font-semibold tabular-nums">{availableIndexPct === undefined ? '—' : `${n(availableIndexPct, 1)}%`}</div>
            <div className="text-[10px] text-zinc-400">vs pierwszy zaobserwowany inventory</div>
          </div>
          <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/60 p-3">
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500"><Database className="w-3.5 h-3.5" />Public seat map</div>
            <div className="mt-1 text-lg font-semibold tabular-nums">{live?.availablePctOfPublicSeatMap === undefined ? '—' : `${n(live.availablePctOfPublicSeatMap, 1)}%`}</div>
            <div className="text-[10px] text-zinc-400">dostępne z publicznej mapy miejsc</div>
          </div>
          <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/60 p-3">
            <div className="text-[11px] text-zinc-500">Velocity 6h</div>
            <div className="mt-1 text-lg font-semibold tabular-nums">{signed(live?.velocity6h, 1)}</div>
            <div className="text-[10px] text-zinc-400">miejsc proxy / h</div>
          </div>
          <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/60 p-3">
            <div className="text-[11px] text-zinc-500">Velocity 24h</div>
            <div className="mt-1 text-lg font-semibold tabular-nums">{signed(live?.velocity24h, 1)}</div>
            <div className="text-[10px] text-zinc-400">miejsc proxy / h</div>
          </div>
          <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/60 p-3">
            <div className="text-[11px] text-zinc-500">Acceleration</div>
            <div className="mt-1 text-lg font-semibold tabular-nums">{signed(live?.acceleration6hVs24h, 1)}</div>
            <div className="text-[10px] text-zinc-400">velocity 6h − 24h</div>
          </div>
          <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/60 p-3">
            <div className="text-[11px] text-zinc-500">Historia sygnału</div>
            <div className="mt-1 text-lg font-semibold tabular-nums">{n(live?.rawSnapshotCount)}</div>
            <div className="text-[10px] text-zinc-400">snapshotów widocznych</div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
          <span className={`rounded px-2 py-1 border ${live?.releaseActivityFlag ? 'border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:border-amber-900' : 'border-zinc-200 text-zinc-500 dark:border-zinc-700'}`}>
            Release activity: {live?.releaseActivityFlag ? 'TAK' : 'nie'}
          </span>
          <span className={`rounded px-2 py-1 border ${live?.sectorCoverageChangeFlag ? 'border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:border-amber-900' : 'border-zinc-200 text-zinc-500 dark:border-zinc-700'}`}>
            Coverage change: {live?.sectorCoverageChangeFlag ? 'TAK' : 'nie'}
          </span>
          {live?.matchedSectorCount !== undefined && (
            <span className="rounded px-2 py-1 border border-zinc-200 text-zinc-500 dark:border-zinc-700">Matched sectors: {n(live.matchedSectorCount)}</span>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/30 dark:bg-sky-950/10 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-2.5">
            <CloudRain className="w-4 h-4 mt-0.5 text-sky-600 dark:text-sky-400" />
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Pogoda na kickoff</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Forecast zapisany prospektywnie — nie pogoda odczytana po meczu.</p>
            </div>
          </div>
          {weather?.locationQuality && (
            <span className="text-[10px] uppercase tracking-wide font-semibold rounded border border-sky-200 dark:border-sky-800 px-2 py-1 text-sky-700 dark:text-sky-300">
              {weather.locationQuality === 'city_centroid' ? 'city centroid' : weather.locationQuality}
            </span>
          )}
        </div>

        {weather ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="rounded-lg bg-white/80 dark:bg-zinc-900/60 p-3 border border-sky-100 dark:border-sky-900/40">
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-500"><Thermometer className="w-3.5 h-3.5" />Temperatura</div>
                <div className="mt-1 text-lg font-semibold tabular-nums">{weather.temperatureC === undefined ? '—' : `${n(weather.temperatureC, 1)}°C`}</div>
                <div className="text-[10px] text-zinc-400">odczuwalna {weather.apparentTemperatureC === undefined ? '—' : `${n(weather.apparentTemperatureC, 1)}°C`}</div>
              </div>
              <div className="rounded-lg bg-white/80 dark:bg-zinc-900/60 p-3 border border-sky-100 dark:border-sky-900/40">
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-500"><CloudRain className="w-3.5 h-3.5" />Opady</div>
                <div className="mt-1 text-lg font-semibold tabular-nums">{weather.precipitationProbabilityPct === undefined ? '—' : `${n(weather.precipitationProbabilityPct)}%`}</div>
                <div className="text-[10px] text-zinc-400">{weather.precipitationMm === undefined ? '—' : `${n(weather.precipitationMm, 1)} mm/h`}</div>
              </div>
              <div className="rounded-lg bg-white/80 dark:bg-zinc-900/60 p-3 border border-sky-100 dark:border-sky-900/40">
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-500"><Wind className="w-3.5 h-3.5" />Wiatr</div>
                <div className="mt-1 text-lg font-semibold tabular-nums">{weather.windSpeedKmh === undefined ? '—' : `${n(weather.windSpeedKmh, 1)} km/h`}</div>
                <div className="text-[10px] text-zinc-400">porywy {weather.windGustsKmh === undefined ? '—' : `${n(weather.windGustsKmh, 1)} km/h`}</div>
              </div>
              <div className="rounded-lg bg-white/80 dark:bg-zinc-900/60 p-3 border border-sky-100 dark:border-sky-900/40">
                <div className="text-[11px] text-zinc-500">Warunki</div>
                <div className="mt-1 text-sm font-semibold">{weatherLabel(weather.weatherCode)}</div>
                <div className="text-[10px] text-zinc-400">zachmurzenie {weather.cloudCoverPct === undefined ? '—' : `${n(weather.cloudCoverPct)}%`}</div>
              </div>
            </div>
            <div className="mt-3 text-[10px] text-zinc-500 dark:text-zinc-400">
              Forecast capture: <strong>{weatherCaptured || '—'}</strong> · provider: <strong>{weather.provider || '—'}</strong> · model: <strong>{weather.sourceModel || '—'}</strong>
            </div>
          </>
        ) : (
          <div className="rounded-lg border border-dashed border-sky-200 dark:border-sky-900 p-4 text-xs text-zinc-500">
            Brak zapisanego forecastu pogody dla tego eventu. Collector obejmuje wydarzenia w 16-dniowym oknie prognozy.
          </div>
        )}
      </div>
    </div>
  );
};
