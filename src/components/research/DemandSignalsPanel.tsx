import React, { useEffect, useState } from 'react';
import { Activity, CloudRain, Eye, Gauge, Thermometer, Wind } from 'lucide-react';
import {
  EventLiveState,
  EventWeatherState,
  researchService
} from '../../services/researchService';

const n = (value?: number, digits = 0) =>
  value === undefined || Number.isNaN(value)
    ? '—'
    : value.toLocaleString('pl-PL', { maximumFractionDigits: digits, minimumFractionDigits: digits });

const weatherLabel = (code?: number) => {
  if (code === undefined) return 'Brak danych';
  if (code === 0) return 'Bezchmurnie';
  if ([1, 2, 3].includes(code)) return 'Zachmurzenie';
  if ([45, 48].includes(code)) return 'Mgła';
  if (code >= 51 && code <= 57) return 'Mżawka';
  if (code >= 61 && code <= 67) return 'Deszcz';
  if (code >= 71 && code <= 77) return 'Śnieg';
  if (code >= 80 && code <= 82) return 'Przelotny deszcz';
  if (code >= 85 && code <= 86) return 'Przelotny śnieg';
  if (code >= 95) return 'Burza';
  return 'Inne warunki';
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
  const availabilityChangePct = availableIndexPct !== undefined ? availableIndexPct - 100 : undefined;
  const availabilityMessage = (() => {
    if (availabilityChangePct === undefined) return 'Za mało danych, aby porównać zmianę dostępności.';
    if (availabilityChangePct <= -10) return `Widzimy około ${n(Math.abs(availabilityChangePct), 0)}% mniej dostępnych miejsc niż przy pierwszym pomiarze.`;
    if (availabilityChangePct >= 10) return `Widzimy około ${n(availabilityChangePct, 0)}% więcej dostępnych miejsc niż przy pierwszym pomiarze. Mogły pojawić się nowe pule lub sektory.`;
    return 'Liczba widocznych wolnych miejsc jest zbliżona do pierwszego pomiaru.';
  })();

  const structuralMessage = live?.releaseActivityFlag || live?.sectorCoverageChangeFlag
    ? 'Uwaga: zmieniła się publiczna oferta miejsc. Część zmiany może wynikać z otwarcia lub zamknięcia puli, a nie wyłącznie z popytu.'
    : 'Nie widzimy obecnie dużej zmiany w strukturze publicznie dostępnych sektorów.';

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
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Co mówi nam publiczna dostępność miejsc?</h2>
              <p className="text-xs text-zinc-500 mt-0.5">To dodatkowy sygnał zainteresowania, a nie bezpośredni raport sprzedaży.</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 p-4 mb-3">
          <div className="flex items-start gap-2.5">
            <Gauge className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Zmiana od początku obserwacji</div>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">{availabilityMessage}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/60 p-3">
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500"><Eye className="w-3.5 h-3.5" />Widoczne teraz</div>
            <div className="mt-1 text-lg font-semibold tabular-nums">{n(live?.availableTotal)}</div>
            <div className="text-[10px] text-zinc-400">publicznie dostępne miejsca</div>
          </div>
          <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/60 p-3">
            <div className="text-[11px] text-zinc-500">Liczba odczytów</div>
            <div className="mt-1 text-lg font-semibold tabular-nums">{n(live?.rawSnapshotCount)}</div>
            <div className="text-[10px] text-zinc-400">ile razy sprawdziliśmy dostępność</div>
          </div>
        </div>

        <div className={`mt-3 rounded-lg border px-3.5 py-3 text-[11px] leading-relaxed ${live?.releaseActivityFlag || live?.sectorCoverageChangeFlag ? 'border-amber-200 bg-amber-50/70 text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300' : 'border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-300'}`}>
          {structuralMessage}
        </div>

        <details className="mt-3 text-[11px] text-zinc-500">
          <summary className="cursor-pointer font-medium text-zinc-600 dark:text-zinc-300">Pokaż dane techniczne</summary>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
            <div><span className="text-zinc-400">Inventory index:</span> <strong>{availableIndexPct === undefined ? '—' : `${n(availableIndexPct, 1)}%`}</strong></div>
            <div><span className="text-zinc-400">Velocity 6h:</span> <strong>{n(live?.velocity6h, 1)}</strong></div>
            <div><span className="text-zinc-400">Velocity 24h:</span> <strong>{n(live?.velocity24h, 1)}</strong></div>
            <div><span className="text-zinc-400">Acceleration:</span> <strong>{n(live?.acceleration6hVs24h, 1)}</strong></div>
            <div><span className="text-zinc-400">Matched sectors:</span> <strong>{n(live?.matchedSectorCount)}</strong></div>
            <div><span className="text-zinc-400">Feature quality:</span> <strong>{live?.featureQuality || '—'}</strong></div>
          </div>
        </details>
      </div>

      <div className="rounded-xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/30 dark:bg-sky-950/10 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-2.5">
            <CloudRain className="w-4 h-4 mt-0.5 text-sky-600 dark:text-sky-400" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Pogoda na mecz</h2>
                <span className="text-[9px] uppercase tracking-wide font-bold rounded border border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:border-amber-900 dark:text-amber-300 px-1.5 py-0.5">
                  informacyjnie
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">Pokazujemy ją jako kontekst. Pogoda nie wpływa obecnie na główną prognozę frekwencji.</p>
            </div>
          </div>
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
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-500"><CloudRain className="w-3.5 h-3.5" />Szansa opadów</div>
                <div className="mt-1 text-lg font-semibold tabular-nums">{weather.precipitationProbabilityPct === undefined ? '—' : `${n(weather.precipitationProbabilityPct)}%`}</div>
                <div className="text-[10px] text-zinc-400">prognoza na kickoff</div>
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
              Prognoza pogody zapisana: <strong>{weatherCaptured || '—'}</strong>
            </div>
          </>
        ) : (
          <div className="rounded-lg border border-dashed border-sky-200 dark:border-sky-900 p-4 text-xs text-zinc-500">
            Prognoza pogody dla tego meczu nie jest jeszcze dostępna.
          </div>
        )}
      </div>
    </div>
  );
};
