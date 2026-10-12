import React, { useEffect, useState } from 'react';
import { CloudRain, FlaskConical, ShieldAlert } from 'lucide-react';
import { researchService, WeatherResearchStatus } from '../../services/researchService';

const n = (value: number, digits = 0) =>
  value.toLocaleString('pl-PL', { maximumFractionDigits: digits, minimumFractionDigits: digits });

const DeltaCard: React.FC<{ label: string; baseline: number; weather: number; uplift: number }> = ({
  label,
  baseline,
  weather,
  uplift
}) => {
  const improved = uplift > 0;
  const delta = Math.abs(uplift);
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5">
      <div className="text-[11px] font-medium text-zinc-500">{label}</div>
      <div className="mt-1 flex items-end gap-2">
        <span className="text-lg font-semibold tabular-nums">{n(weather, 0)}</span>
        <span className={`text-[11px] font-semibold mb-0.5 ${improved ? 'text-emerald-600' : 'text-rose-600'}`}>
          {improved ? '−' : '+'}{n(delta, 0)} MAE
        </span>
      </div>
      <div className="text-[10px] text-zinc-400">baseline {n(baseline, 0)} · {improved ? 'lepiej' : 'gorzej'}</div>
    </div>
  );
};

export const WeatherResearchPanel: React.FC = () => {
  const [data, setData] = useState<WeatherResearchStatus | null>(null);

  useEffect(() => {
    researchService.getWeatherResearchStatus().then(setData).catch(() => setData(null));
  }, []);

  if (!data) return null;

  const noUplift = data.historicalSignalStatus === 'research_only_no_uplift';

  return (
    <div className="rounded-xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/30 dark:bg-sky-950/10 p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div className="flex items-start gap-2.5">
          <CloudRain className="w-4 h-4 mt-0.5 text-sky-600 dark:text-sky-400 shrink-0" />
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Weather Research Track</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Pogoda jest zbierana prospektywnie jako telemetry badawcze. Nie wpływa obecnie na P50/P10/P90.
            </p>
          </div>
        </div>
        <div className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-semibold ${noUplift ? 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300' : 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300'}`}>
          {noUplift ? <ShieldAlert className="w-3.5 h-3.5" /> : <FlaskConical className="w-3.5 h-3.5" />}
          {noUplift ? 'RESEARCH ONLY · brak upliftu' : 'Candidate signal'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <DeltaCard
          label="Historyczny test · event LOOCV"
          baseline={data.baselineMae}
          weather={data.loocvWeatherMae}
          uplift={data.loocvUplift}
        />
        <DeltaCard
          label="Historyczny test · leave-one-season-out"
          baseline={data.baselineMae}
          weather={data.losoWeatherMae}
          uplift={data.losoUplift}
        />
      </div>

      <div className="mt-3 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-lg bg-white/70 dark:bg-zinc-900/50 border border-sky-100 dark:border-sky-900/40 p-3">
          <div className="text-[10px] uppercase tracking-wide text-zinc-400">Historyczny sample</div>
          <div className="mt-1 text-lg font-semibold tabular-nums">{data.historicalSampleSize}</div>
          <div className="text-[10px] text-zinc-400">{data.historicalSeasons} sezony · T-7</div>
        </div>
        <div className="rounded-lg bg-white/70 dark:bg-zinc-900/50 border border-sky-100 dark:border-sky-900/40 p-3">
          <div className="text-[10px] uppercase tracking-wide text-zinc-400">Prospective events</div>
          <div className="mt-1 text-lg font-semibold tabular-nums">{data.prospectiveWeatherEvents}</div>
          <div className="text-[10px] text-zinc-400">eventy z zapisanym forecastem</div>
        </div>
        <div className="rounded-lg bg-white/70 dark:bg-zinc-900/50 border border-sky-100 dark:border-sky-900/40 p-3">
          <div className="text-[10px] uppercase tracking-wide text-zinc-400">Weather captures</div>
          <div className="mt-1 text-lg font-semibold tabular-nums">{data.prospectiveWeatherRows}</div>
          <div className="text-[10px] text-zinc-400">prospektywne obserwacje</div>
        </div>
        <div className="rounded-lg bg-white/70 dark:bg-zinc-900/50 border border-sky-100 dark:border-sky-900/40 p-3">
          <div className="text-[10px] uppercase tracking-wide text-zinc-400">T-24 outcome pairs</div>
          <div className="mt-1 text-lg font-semibold tabular-nums">{data.prospectiveT24OutcomePairs}</div>
          <div className="text-[10px] text-zinc-400">uczciwe pary forecast pogody + outcome</div>
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-sky-100 dark:border-sky-900/40 bg-white/60 dark:bg-zinc-900/30 px-3.5 py-3 text-[11px] text-zinc-600 dark:text-zinc-300">
        Decyzja: <strong>nie promujemy pogody do modelu punktowego</strong>. Zbieramy ją dalej w tle i wracamy do testu dopiero, gdy wzrośnie liczba niezależnych prospektywnych par. Historyczny eksperyment {data.historicalStudyVersion} pogorszył MAE w obu protokołach walidacji.
      </div>
    </div>
  );
};
