import React from 'react';
import { CheckCircle2, HelpCircle, Users } from 'lucide-react';

export const ForecastAccuracyGuide: React.FC = () => (
  <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5">
    <div className="flex items-start gap-2.5 mb-4">
      <HelpCircle className="w-4 h-4 mt-0.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
      <div>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Jak czytać trafność prognoz?</h2>
        <p className="text-xs text-zinc-500 mt-0.5">Nie musisz znać statystyki. Najważniejsze są trzy pytania.</p>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 p-3.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />Jak często jesteśmy blisko?</div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-500">Patrz przede wszystkim na <strong>„w zakresie ±10%”</strong>. Np. 80% oznacza, że w 8 na 10 ocenionych meczów prognoza pomyliła się o nie więcej niż 10%.</p>
      </div>
      <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 p-3.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100"><Users className="w-3.5 h-3.5 text-indigo-600" />O ile osób średnio się mylimy?</div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-500"><strong>MAE</strong> to po prostu średnia liczba widzów, o którą prognoza różniła się od rzeczywistej frekwencji. Im mniej, tym lepiej.</p>
      </div>
      <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 p-3.5">
        <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Czy model stale zawyża lub zaniża?</div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-500"><strong>Bias</strong> pokazuje kierunek błędu. Dodatni = zwykle prognozujemy za dużo widzów. Ujemny = zwykle za mało.</p>
      </div>
    </div>

    <p className="mt-3 text-[10px] text-zinc-400">MAPE i pozostałe wskaźniki zostają dostępne dla analityków, ale nie są potrzebne do podstawowej oceny jakości prognozy.</p>
  </div>
);
