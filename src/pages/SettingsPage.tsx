import React, { useState } from 'react';
import {
  Database,
  Layers,
  Cpu,
  CheckCircle2,
  Code2,
  Server,
  Zap,
  RefreshCw,
  Sliders
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [staleThresholdHours, setStaleThresholdHours] = useState('18');
  const [targetMapeAlert, setTargetMapeAlert] = useState('5.0');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Ustawienia & Gotowość integracyjna
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Architektura separacji danych, przygotowanie pod Supabase oraz parametry pipeline'u ML
          </p>
        </div>
      </div>

      {/* Supabase & Beyond Architecture Card */}
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Architektura gotowa na Supabase & Backend Beyond
          </h2>
        </div>

        <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
          Wszystkie komponenty interfejsu <strong>Beyond Ticketing</strong> są całkowicie odseparowane od
          sposobu składowania danych. Komponenty odpytują wyłącznie interfejs warstwy usługowej{' '}
          <code className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[11px] font-mono text-zinc-800 dark:text-zinc-200">
            eventsService
          </code>
          . Podłączenie produkcyjnego Supabase lub API wymaga jedynie podmiany metod w{' '}
          <code className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[11px] font-mono text-zinc-800 dark:text-zinc-200">
            src/services/eventsService.ts
          </code>
          , bez modyfikacji kodu stron czy wykresów.
        </p>

        {/* Visual Layer Flow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
              <Layers className="w-4 h-4 text-zinc-500" />
              1. Warstwa UI (Views)
            </div>
            <p className="text-[11px] text-zinc-500 leading-snug">
              Overview, EventsList, EventDetail, ModelPerformance. Konsumują ustrukturyzowane obiekty{' '}
              <code className="text-zinc-700 dark:text-zinc-300">EnrichedEvent</code>.
            </p>
          </div>

          <div className="p-3.5 rounded-lg border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-950 dark:text-indigo-200 mb-1">
              <Code2 className="w-4 h-4 text-indigo-600" />
              2. Service & Metrics Layer
            </div>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-snug">
              Oblicza MAE, MAPE, bias, delty, dni do meczu oraz mapuje statusy. Czysta logika biznesowa.
            </p>
          </div>

          <div className="p-3.5 rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-950 dark:text-emerald-200 mb-1">
              <Server className="w-4 h-4 text-emerald-600" />
              3. Data Connector (Docelowo Supabase)
            </div>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-snug">
              Obecnie lokalne repozytorium demo. Gotowe pod zapytania <code className="text-zinc-700 dark:text-zinc-300">supabase.from('events').select()</code>.
            </p>
          </div>
        </div>
      </div>

      {/* Target Schema Representation */}
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs space-y-3">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-zinc-500" />
          Docelowy schemat tabel w Supabase
        </h3>
        <p className="text-xs text-zinc-500">
          Struktura encji zaimplementowana w typach TypeScript przygotowana do mapowania 1:1 z tabelami PostgreSQL:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono">
          <div className="p-2.5 rounded bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800">
            <span className="font-semibold text-indigo-600 dark:text-indigo-400 block mb-1">events</span>
            <ul className="text-[11px] text-zinc-500 space-y-0.5 font-normal">
              <li>id (uuid pk)</li>
              <li>name (text)</li>
              <li>club (text)</li>
              <li>event_date (timestamptz)</li>
              <li>capacity (int)</li>
              <li>status (enum)</li>
            </ul>
          </div>

          <div className="p-2.5 rounded bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800">
            <span className="font-semibold text-indigo-600 dark:text-indigo-400 block mb-1">snapshots</span>
            <ul className="text-[11px] text-zinc-500 space-y-0.5 font-normal">
              <li>id (uuid pk)</li>
              <li>event_id (uuid fk)</li>
              <li>timestamp (timestamptz)</li>
              <li>sold (int)</li>
            </ul>
          </div>

          <div className="p-2.5 rounded bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800">
            <span className="font-semibold text-indigo-600 dark:text-indigo-400 block mb-1">forecasts</span>
            <ul className="text-[11px] text-zinc-500 space-y-0.5 font-normal">
              <li>id (uuid pk)</li>
              <li>event_id (uuid fk)</li>
              <li>timestamp (timestamptz)</li>
              <li>predicted_sales (int)</li>
              <li>source_snapshot_id</li>
            </ul>
          </div>

          <div className="p-2.5 rounded bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800">
            <span className="font-semibold text-indigo-600 dark:text-indigo-400 block mb-1">outcomes</span>
            <ul className="text-[11px] text-zinc-500 space-y-0.5 font-normal">
              <li>event_id (uuid fk)</li>
              <li>actual_sales (int)</li>
              <li>recorded_at (timestamptz)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Model & Alert Configuration form */}
      <form onSubmit={handleSave} className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs space-y-4">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <Zap className="w-4 h-4 text-zinc-500" />
          Parametry progowe audytu danych
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Próg nieaktualnego snapshotu (godziny)
            </label>
            <input
              type="number"
              value={staleThresholdHours}
              onChange={(e) => setStaleThresholdHours(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 tabular-nums"
            />
            <p className="mt-1 text-[11px] text-zinc-400">
              Gdy snapshot nie zostanie pobrany w tym oknie, status danych zmienia się na „Nieaktualne”.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Docelowy próg błędu MAPE dla portfela (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={targetMapeAlert}
              onChange={(e) => setTargetMapeAlert(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 tabular-nums"
            />
            <p className="mt-1 text-[11px] text-zinc-400">
              Próg akceptowalnego błędu w oknie 14 dni przed rozpoczęciem wydarzenia sportowego.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-zinc-500">
            Aktywny model inferencji: <strong className="text-zinc-800 dark:text-zinc-200 font-mono">Current production model (v2.4)</strong>
          </span>

          <div className="flex items-center gap-2">
            {isSaved && (
              <span className="text-xs text-emerald-600 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Zapisano pomyślnie
              </span>
            )}
            <button
              type="submit"
              className="px-3.5 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors cursor-pointer shadow-xs"
            >
              Zapisz parametry
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
