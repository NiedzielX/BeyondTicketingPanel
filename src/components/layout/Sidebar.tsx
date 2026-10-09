import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  LineChart,
  BarChart3,
  ShieldAlert,
  Settings,
  X,
  Sparkles,
  Building2
} from 'lucide-react';

export type NavItemKey =
  | 'overview'
  | 'events'
  | 'sales-analytics'
  | 'forecast-accuracy'
  | 'data-quality'
  | 'settings';

interface SidebarProps {
  currentTab: NavItemKey;
  onSelectTab: (tab: NavItemKey) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  dataIssuesCount?: number;
  selectedClubContext?: string;
  onSelectClubContext?: (club: string) => void;
  clubs?: string[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  dataIssuesCount = 0,
  selectedClubContext = 'Lech Poznań',
  onSelectClubContext,
  clubs = ['Lech Poznań', 'Legia Warszawa', 'Jagiellonia Białystok', 'Pogoń Szczecin', 'Wszystkie kluby']
}) => {
  const clubNavItems = [
    { key: 'overview' as NavItemKey, label: 'Przegląd sprzedaży', icon: LayoutDashboard },
    { key: 'events' as NavItemKey, label: 'Mecze', icon: CalendarDays },
    { key: 'sales-analytics' as NavItemKey, label: 'Analiza sprzedaży', icon: BarChart3 },
    { key: 'forecast-accuracy' as NavItemKey, label: 'Trafność prognoz', icon: LineChart }
  ];

  const operationsNavItems = [
    {
      key: 'data-quality' as NavItemKey,
      label: 'Jakość danych',
      icon: ShieldAlert,
      badge: dataIssuesCount > 0 ? dataIssuesCount : undefined
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-zinc-900/60 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 flex h-screen w-64 flex-col border-r border-zinc-200 dark:border-zinc-800 bg-zinc-900 text-zinc-300 transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-14 items-center justify-between px-5 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-zinc-950 font-bold text-xs tracking-wider shadow-xs">
              B
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm text-white tracking-tight">Beyond</span>
                <span className="text-[10px] text-zinc-400 font-mono tracking-widest uppercase">
                  TICKETING
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-none">Club Intelligence Platform</p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1 text-zinc-400 hover:text-white rounded"
            aria-label="Zamknij menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Club Profile Switcher / Banner */}
        <div className="px-3 pt-3.5 pb-1">
          <div className="rounded-lg bg-zinc-800/80 p-2.5 border border-zinc-700/60">
            <div className="flex items-center justify-between text-[10px] font-semibold tracking-wider text-zinc-400 uppercase mb-1">
              <span className="flex items-center gap-1">
                <Building2 className="w-3 h-3 text-indigo-400" />
                {selectedClubContext === 'Wszystkie kluby' || selectedClubContext === 'Wszystkie'
                  ? 'Tryb benchmarku'
                  : 'Klub partnerski'}
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">
                {selectedClubContext === 'Wszystkie kluby' || selectedClubContext === 'Wszystkie'
                  ? 'BENCHMARK'
                  : 'LIVE'}
              </span>
            </div>
            {onSelectClubContext ? (
              <select
                value={
                  selectedClubContext === 'Wszystkie' || selectedClubContext === 'Wszystkie kluby'
                    ? 'Wszystkie kluby'
                    : selectedClubContext
                }
                onChange={(e) => onSelectClubContext(e.target.value)}
                className="w-full bg-zinc-900 text-xs font-semibold text-white rounded px-2 py-1.5 border border-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="Wszystkie kluby">Wszystkie kluby</option>
                {clubs
                  .filter((c) => c !== 'Wszystkie kluby' && c !== 'Wszystkie')
                  .map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
              </select>
            ) : (
              <div className="text-xs font-semibold text-white">Lech Poznań</div>
            )}
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
          {/* KLUB */}
          <div>
            <div className="px-2 pb-1.5 text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
              Klub
            </div>
            <nav className="space-y-0.5">
              {clubNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => {
                      onSelectTab(item.key);
                      onCloseMobile();
                    }}
                    className={`group flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-zinc-800 text-white font-semibold shadow-xs'
                        : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`w-4 h-4 transition-colors ${
                          isActive ? 'text-indigo-400' : 'text-zinc-400 group-hover:text-zinc-300'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* BEYOND OPERATIONS */}
          <div>
            <div className="px-2 pb-1.5 text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
              Beyond Operations
            </div>
            <nav className="space-y-0.5">
              {operationsNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => {
                      onSelectTab(item.key);
                      onCloseMobile();
                    }}
                    className={`group flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-zinc-800 text-white font-semibold shadow-xs'
                        : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`w-4 h-4 transition-colors ${
                          isActive ? 'text-indigo-400' : 'text-zinc-400 group-hover:text-zinc-300'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span className="flex h-4 min-w-4 items-center justify-center rounded bg-amber-500/20 px-1 text-[10px] font-semibold text-amber-400 border border-amber-500/30">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Footer / Bottom Actions */}
        <div className="p-3 border-t border-zinc-800 space-y-2">
          {/* Settings button */}
          <button
            onClick={() => {
              onSelectTab('settings');
              onCloseMobile();
            }}
            className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
              currentTab === 'settings'
                ? 'bg-zinc-800 text-white font-semibold'
                : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
            }`}
          >
            <Settings className="w-4 h-4 text-zinc-400" />
            <span>Ustawienia & Integracja</span>
          </button>
        </div>
      </aside>
    </>
  );
};
