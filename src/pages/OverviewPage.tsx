import React, { useState, useEffect } from 'react';
import { Search, Filter, AlertTriangle, ArrowRight, ShieldCheck, CheckCircle2, RotateCcw } from 'lucide-react';
import { EnrichedEvent, ClubOverviewKPIs } from '../types/ticketing';
import { eventsService, isAllClubs } from '../services/eventsService';
import { MetricCard } from '../components/common/MetricCard';
import { FeaturedMatchCard } from '../components/common/FeaturedMatchCard';
import { EventsTable } from '../components/table/EventsTable';
import { formatPercent } from '../utils/formatters';

interface OverviewPageProps {
  onSelectEvent: (eventId: string) => void;
  onNavigateToAccuracy: () => void;
  selectedClubFilter?: string;
  onClubFilterChange?: (club: string) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  onSelectEvent,
  onNavigateToAccuracy,
  selectedClubFilter,
  onClubFilterChange
}) => {
  const [kpis, setKpis] = useState<ClubOverviewKPIs | null>(null);
  const [events, setEvents] = useState<EnrichedEvent[]>([]);
  const [clubs, setClubs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClub, setSelectedClub] = useState(selectedClubFilter || 'Wszystkie kluby');
  const [selectedCommercialStatus, setSelectedCommercialStatus] = useState('Wszystkie');

  // Sorting state
  const [sortBy, setSortBy] = useState<'date' | 'daysToEvent' | 'sold' | 'forecast' | 'name' | 'change' | 'utilization' | 'remaining'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Sync when parent selectedClubFilter changes
  useEffect(() => {
    if (selectedClubFilter) {
      setSelectedClub(selectedClubFilter);
    }
  }, [selectedClubFilter]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const activeClub = isAllClubs(selectedClub) ? undefined : selectedClub;

      const [kpisData, clubsData] = await Promise.all([
        eventsService.getClubOverviewKPIs(activeClub),
        eventsService.getClubsList()
      ]);
      setKpis(kpisData);
      setClubs(clubsData);

      const eventsData = await eventsService.getEvents({
        status: 'active',
        search: searchQuery,
        club: activeClub,
        commercialStatus: selectedCommercialStatus !== 'Wszystkie' ? selectedCommercialStatus : undefined,
        sortBy,
        sortOrder
      });
      setEvents(eventsData);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery, selectedClub, selectedCommercialStatus, sortBy, sortOrder]);

  const handleSort = (field: 'date' | 'daysToEvent' | 'sold' | 'forecast' | 'name' | 'change' | 'utilization' | 'remaining') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleClubChange = (clubName: string) => {
    setSelectedClub(clubName);
    onClubFilterChange?.(clubName);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedClub('Wszystkie kluby');
    setSelectedCommercialStatus('Wszystkie');
    onClubFilterChange?.('Wszystkie kluby');
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    !isAllClubs(selectedClub) ||
    selectedCommercialStatus !== 'Wszystkie';

  return (
    <div className="space-y-6">
      {/* 1. Page Title & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Przegląd sprzedaży
            </h1>
            {!isAllClubs(selectedClub) && (
              <span className="text-xs px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800">
                {selectedClub}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Prognozy sprzedaży biletów dla nadchodzących meczów
          </p>
        </div>

        {/* Badges / Model Accuracy Teaser */}
        {kpis && (
          <div
            onClick={onNavigateToAccuracy}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/20 text-xs text-indigo-900 dark:text-indigo-300 hover:border-indigo-300 cursor-pointer transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>
              Trafność prognoz Beyond: <strong>{kpis.modelAccuracyScore}%</strong>
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-indigo-400 ml-1" />
          </div>
        )}
      </div>

      {/* 2. Klubowe KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Nadchodzące mecze"
          value={kpis ? kpis.upcomingEventsCount : '—'}
          subtext={!isAllClubs(selectedClub) ? `Dla klubu ${selectedClub}` : 'Wszystkie kluby'}
          tooltip="Liczba zaplanowanych wydarzeń, dla których prowadzona jest dystrybucja biletów"
        />

        <MetricCard
          label="Średnie aktualne wypełnienie"
          value={kpis ? formatPercent(kpis.avgCurrentUtilization) : '—'}
          subtext="Stan na dzisiejszy snapshot"
          tooltip="Średni procent wyprzedanych miejsc w stosunku do pojemności stadionów"
        />

        <MetricCard
          label="Średnie prognozowane wypełnienie"
          value={kpis ? formatPercent(kpis.avgPredictedUtilization) : '—'}
          subtext="Ostateczny wynik wg Beyond ML"
          tooltip="Przewidywane ostateczne zapełnienie trybun wyliczone przez model dla nadchodzących meczów"
          highlight="normal"
        />

        <MetricCard
          label="Mecze wymagające uwagi"
          value={kpis ? kpis.eventsNeedingAttentionCount : '—'}
          subtext={
            kpis && kpis.eventsNeedingAttentionCount > 0
              ? 'Wymagają wsparcia marketingowego'
              : 'Wszystkie mecze w normie'
          }
          tooltip="Mecze ze statusem 'Wymaga uwagi' lub 'Poniżej oczekiwań', gdzie dynamika sprzedaży jest zagrożona"
          highlight={kpis && kpis.eventsNeedingAttentionCount > 0 ? 'warning' : 'success'}
        />
      </div>

      {/* 3. Wyróżniona sekcja „Najbliższy mecz” */}
      {kpis?.closestMatch && (
        <FeaturedMatchCard
          event={kpis.closestMatch.event}
          snapshots={kpis.closestMatch.snapshots}
          forecasts={kpis.closestMatch.forecasts}
          onSelectEvent={onSelectEvent}
        />
      )}

      {/* 4. Przebudowana tabela nadchodzących meczów */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Nadchodzące mecze ({events.length})
            </h2>
            <p className="text-xs text-zinc-500">
              Monitoruj tempo sprzedaży, prognozę frekwencji i pozostałe wolne miejsca na trybunach
            </p>
          </div>

          {/* Filtry i wyszukiwarka */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Wyszukiwarka */}
            <div className="relative min-w-[180px] flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Szukaj rywala, meczu..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Filtr Klubu (w tym przycisk / opcja 'Wszystkie kluby') */}
            <select
              value={isAllClubs(selectedClub) ? 'Wszystkie kluby' : selectedClub}
              onChange={(e) => handleClubChange(e.target.value)}
              className="py-1.5 px-2.5 text-xs rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer font-medium"
            >
              <option value="Wszystkie kluby">Wszystkie kluby</option>
              {clubs.filter((c) => !isAllClubs(c)).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Filtr Statusu handlowego */}
            <select
              value={selectedCommercialStatus}
              onChange={(e) => setSelectedCommercialStatus(e.target.value)}
              className="py-1.5 px-2.5 text-xs rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="Wszystkie">Status sprzedaży: Wszystkie</option>
              <option value="Bardzo dobra sprzedaż">Bardzo dobra sprzedaż</option>
              <option value="Zgodnie z oczekiwaniami">Zgodnie z oczekiwaniami</option>
              <option value="Poniżej oczekiwań">Poniżej oczekiwań</option>
              <option value="Wymaga uwagi">Wymaga uwagi</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 py-1.5 px-2.5 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded cursor-pointer transition-colors"
                title="Pokaż wszystkie kluby i zresetuj filtry"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Pokaż wszystkie kluby</span>
              </button>
            )}
          </div>
        </div>

        {/* Tabela meczów */}
        <EventsTable
          events={events}
          onSelectEvent={onSelectEvent}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
        />
      </div>
    </div>
  );
};
