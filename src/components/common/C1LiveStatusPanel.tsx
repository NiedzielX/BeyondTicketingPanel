import React, { useEffect, useState } from 'react';
import { fetchC1LiveStatus } from '../../services/c1LiveStatusService';
import type { C1LiveStatus } from '../../services/c1LiveStatusContract';
import { MetricCard } from './MetricCard';

const number = new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const metric = (value: number | null) => value === null ? '—' : `${number.format(value)} osób`;
const date = (value: string | null) => value === null ? 'brak' : new Date(value).toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw' });

export function C1LiveStatusPanel() {
  const [data, setData] = useState<C1LiveStatus | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    setState('loading');
    fetchC1LiveStatus().then(value => {
      if (active) { setData(value); setState('ready'); }
    }).catch(() => {
      if (active) { setData(null); setState('error'); }
    });
    return () => { active = false; };
  }, [refresh]);
  return <section aria-label="Wyniki eksperymentu C1 v8" className="rounded-lg border border-indigo-200 dark:border-indigo-900 bg-indigo-50/30 dark:bg-indigo-950/10 p-4 space-y-3">
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">C1 v8 · prognozy live w trybie testowym</h2>
        <p className="text-xs text-zinc-500 mt-1">Wszystkie kluby, niezależnie od filtra strony. Wynik dotyczy końcowej frekwencji.</p>
      </div>
      <button type="button" onClick={() => setRefresh(value => value + 1)} disabled={state === 'loading'} className="text-xs font-medium text-indigo-700 dark:text-indigo-300 disabled:opacity-50">Odśwież C1</button>
    </div>
    {state === 'loading' ? <p role="status" className="text-xs text-zinc-500">Wczytywanie wyników C1…</p>
      : state === 'error' ? <p role="alert" className="text-xs text-amber-700 dark:text-amber-300">Nie udało się pobrać poprawnych wyników C1. MAE pozostaje niedostępne.</p>
      : !data ? <p className="text-xs text-zinc-500">Brak opublikowanego zestawienia C1.</p>
      : <>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <MetricCard label="MAE C1 v8" value={metric(data.policyMae)} subtext="Wynik po regule wyboru prognozy" />
          <MetricCard label="MAE bazy na tych samych meczach" value={metric(data.priorMae)} subtext="Ostatnia prognoza per mecz" />
          <MetricCard label="MAE surowego eksperta live" value={metric(data.rawMae)} subtext="Przed regułą wyboru" />
          <MetricCard label="Ocenione mecze C1" value={data.scoredEvents} subtext={`${data.forecastEvents} meczów z prognozą · ${data.predictionRows} zapisów`} />
        </div>
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          {data.scoredEvents === 0 ? 'Oczekuje na potwierdzone wyniki. Brak ocen nie oznacza zerowego błędu.'
            : 'Każdy oceniony mecz ma wagę 1. MAE główne używa ostatniej zapisanej prognozy przed meczem; wynik pozostaje eksperymentalny.'}
        </p>
        <p className="text-xs text-zinc-500">MAE w oknie obserwacji C1: {metric(data.policyWindowMae)}. Osobna agregacja, obejmująca wiele chwil prognozy.</p>
        <dl className="text-xs text-zinc-500 grid sm:grid-cols-2 gap-x-4 gap-y-1">
          <div><dt className="inline">Ostatnia ocena: </dt><dd className="inline">{date(data.latestScoreAt)}</dd></div>
          <div><dt className="inline">Ostatnia prognoza: </dt><dd className="inline">{date(data.latestPredictionAt)}</dd></div>
          <div><dt className="inline">Odczyt danych: </dt><dd className="inline">{date(data.refreshedAt)} (czas Warszawy)</dd></div>
        </dl>
        <details className="text-xs text-zinc-500"><summary className="cursor-pointer">Wersja ocenianego modelu</summary><p className="mt-1 font-mono break-all">{data.packageVersion}</p></details>
      </>}
  </section>;
}
