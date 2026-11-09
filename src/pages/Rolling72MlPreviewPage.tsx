import React from 'react';
import { Rolling72MlForecastChart } from '../components/charts/Rolling72MlForecastChart';

/** Explicit dated snapshot, separate from the v1 benchmark preview and normal panel. */
export const Rolling72MlPreviewPage: React.FC = () => <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 sm:p-8 text-zinc-900 dark:text-zinc-100">
  <div className="mx-auto max-w-6xl space-y-5">
    <a href="/" className="text-xs text-zinc-500 underline">Wróć do panelu</a>
    <header><p className="text-xs uppercase tracking-wider text-indigo-600">Beyond · eksperyment ML v2</p>
      <h1 className="mt-1 text-2xl font-bold">Od prawdziwej historii do przyszłych 72 godzin</h1>
      <p className="mt-2 text-sm text-zinc-500">Zapisane prognozy modelu i benchmarków z tego samego momentu. Podgląd badawczy bez aktywacji modelu w produkcji.</p>
    </header>
    <Rolling72MlForecastChart feedUrl="/research/rolling72-shadow-snapshot-v2.json" researchSnapshot />
  </div>
</main>;
