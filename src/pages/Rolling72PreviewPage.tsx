import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Rolling72ForecastChart } from '../components/charts/Rolling72ForecastChart';

/** Explicit research snapshot view; never the normal event feed fallback. */
export const Rolling72PreviewPage: React.FC = () => <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 sm:p-8 text-zinc-900 dark:text-zinc-100">
  <div className="mx-auto max-w-6xl space-y-5">
    <a href="/" className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"><ArrowLeft className="h-3.5 w-3.5" />Wróć do panelu</a>
    <header>
      <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Beyond · podgląd badawczy</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight">Od rzeczywistych odczytów do kolejnych 72 godzin</h1>
      <p className="mt-2 max-w-3xl text-sm text-zinc-500">Autentyczne prognozy zapisane przed przyszłymi odczytami. Ten widok pokazuje zapis z badania; dokładność będzie można ocenić dopiero po nadejściu wyników.</p>
    </header>
    <Rolling72ForecastChart feedUrl="/research/rolling72-shadow-snapshot-v1.json" researchSnapshot />
  </div>
</main>;
