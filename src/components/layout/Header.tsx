import React from 'react';
import { Menu, ChevronRight, RefreshCw, CheckCircle2 } from 'lucide-react';
import { NavItemKey } from './Sidebar';

interface HeaderProps {
  currentTab: NavItemKey;
  selectedEventName?: string;
  onBackToEvents?: () => void;
  onOpenMobileMenu: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  selectedEventName,
  onBackToEvents,
  onOpenMobileMenu,
  onRefresh,
  isRefreshing = false
}) => {
  const getTabLabel = (tab: NavItemKey) => {
    switch (tab) {
      case 'overview':
        return 'Przegląd sprzedaży';
      case 'events':
        return 'Mecze';
      case 'sales-analytics':
        return 'Analiza sprzedaży';
      case 'forecast-accuracy':
        return 'Trafność prognoz';
      case 'data-quality':
        return 'Jakość danych';
      case 'settings':
        return 'Ustawienia';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 px-4 sm:px-6 backdrop-blur-xs">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-1.5 rounded-md text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          aria-label="Otwórz nawigację"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">Beyond Ticketing</span>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600" />
          
          {selectedEventName ? (
            <>
              <button
                onClick={onBackToEvents}
                className="hover:text-zinc-900 dark:hover:text-zinc-100 hover:underline transition-colors cursor-pointer"
              >
                {getTabLabel(currentTab)}
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600" />
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[200px] sm:max-w-md">
                {selectedEventName}
              </span>
            </>
          ) : (
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              {getTabLabel(currentTab)}
            </span>
          )}
        </nav>
      </div>

      {/* Right controls - Klubowy styl */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
          <span>Dane biletowe zaktualizowane 12 minut temu</span>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-700/80 transition-colors cursor-pointer disabled:opacity-50"
            title="Odśwież dane z systemu biletowego"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
            <span className="hidden sm:inline">Synchronizuj</span>
          </button>
        )}
      </div>
    </header>
  );
};
