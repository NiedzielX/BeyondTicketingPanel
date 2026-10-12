import React, { useEffect, useState } from 'react';
import { CloudRain, FlaskConical, ShieldAlert } from 'lucide-react';
import { researchService, WeatherResearchStatus } from '../../services/researchService';

const n = (value: number, digits = 0) =>
  value.toLocaleString('pl-PL', { maximumFractionDigits: digits, minimumFractionDigits: digits });

const ComparisonCard: React.FC<{ label: string; baseline: number; weather: number; uplift: number }> = ({ label, baseline, weather, uplift }) => {
  const improved = uplift > 0;
  const delta = Math.abs(uplift);
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5">
      <div className="text-[11px] font-medium text-zinc-500">{label}</div>
      <div className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
        Bez pogody: <strong>{n(baseline, 0)} osób średniego błędu</strong>
      </div>
      <div className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
        Z pogodą: <strong>{n(weather, 0)} osób</strong>
      </div>
      <div className={`mt-2 text-xs font-semibold ${improved ? 'text-emerald-600' : 'text-rose-600'}`}>
        {improved ? `Lepiej o ${n(delta, 0)} osób` : `Gorzej o ${n(delta, 0)} osób`}
      </div>
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
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Czy pogoda pomaga przewidywać frekwencję?</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Sprawdzamy to osobno, żeby nie dodawać pogody do modelu tylko dlatego, że intuicyjnie wydaje się ważna.</p>
          </div>
        </div>
        <div className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-semibold ${noUplift ? 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300' : 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300'}`}>
          {noUplift ? <ShieldAlert className="w-3.5 h-3.5" /> : <FlaskConical className="w-3.5 h-3.5" />}
          {noUplift ? 'Na razie nie pomaga' : 'Warto badać dalej'}
        </div>
      </div>

      <div className="rounded-lg border border-sky-100 dark:border-sky-900/40 bg-white/70 dark:bg-zinc-900/40 px-4 py-3 mb-3 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
        <strong>Wniosek:</strong> w dotychczasowym historycznym teście dodanie pogody zwiększyło błąd prognozy. Dlatego <strong>nie używamy jej obecnie do wyliczania głównej prognozy frekwencji</strong>. Zbieramy jednak nowe dane, żeby sprawdzić, czy efekt pojawi się na większej i bardziej zróżnicowanej próbie.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <ComparisonCard label="Test 1 · porównanie mecz po meczu" baseline={data.baselineMae} weather={data.loocvWeatherMae} uplift={data.loocvUplift} />
        <ComparisonCard label="Test 2 · sprawdzenie między sezonami" baseline={data.baselineMae} weather={data.losoWeatherMae} uplift={data.losoUplift} />
      </div>

      <div className="mt-3 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-lg bg-white/70 dark:bg-zinc-900/50 border border-sky-100 dark:border-sky-900/40 p-3">
          <div className="text-[10px] uppercase tracking-wide text-zinc-400">Historyczny test</div>
          <div className="mt-1 text-lg font-semibold tabular-nums">{data.historicalSampleSize}</div>
          <div className="text-[10px] text-zinc-400">meczów z {data.historicalSeasons} sezonów</div>
        </div>
        <div className="rounded-lg bg-white/70 dark:bg-zinc-900/50 border border-sky-100 dark:border-sky-900/40 p-3">
          <div className="text-[10px] uppercase tracking-wide text-zinc-400">Nowe mecze z pogodą</div>
          <div className="mt-1 text-lg font-semibold tabular-nums">{data.prospectiveWeatherEvents}</div>
          <div className="text-[10px] text-zinc-400">dla tylu eventów zapisujemy prognozę pogody</div>
        </div>
        <div className="rounded-lg bg-white/70 dark:bg-zinc-900/50 border border-sky-100 dark:border-sky-900/40 p-3">
          <div className="text-[10px] uppercase tracking-wide text-zinc-400">Zapisane prognozy pogody</div>
          <div className="mt-1 text-lg font-semibold tabular-nums">{data.prospectiveWeatherRows}</div>
          <div className="text-[10px] text-zinc-400">kolejne odczyty przed meczami</div>
        </div>
        <div className="rounded-lg bg-white/70 dark:bg-zinc-900/50 border border-sky-100 dark:border-sky-900/40 p-3">
          <div className="text-[10px] uppercase tracking-wide text-zinc-400">Pełne pary do analizy</div>
          <div className="mt-1 text-lg font-semibold tabular-nums">{data.prospectiveT24OutcomePairs}</div>
          <div className="text-[10px] text-zinc-400">pogoda 24h przed meczem + rzeczywista frekwencja</div>
        </div>
      </div>

      <details className="mt-3 text-[10px] text-zinc-400">
        <summary className="cursor-pointer">Pokaż nazwy techniczne</summary>
        <p className="mt-1">{data.historicalStudyVersion} · LOOCV · leave-one-season-out · T-24 prospective pairs.</p>
      </details>
    </div>
  );
};
