import React, { useState, useEffect } from 'react';
import { Search, Filter, RotateCcw } from 'lucide-react';
import { EnrichedEvent } from '../types/ticketing';
import { eventsService, isAllClubs } from '../services/eventsService';
import { EventsTable } from '../components/table/EventsTable';

interface EventsListPageProps {
  onSelectEvent: (eventId: string) => void;
  selectedClubFilter?: string;
  onClubFilterChange?: (club: string) => void;
}

export const EventsListPage: React.FC<EventsListPageProps> = ({
  onSelectEvent,
  selectedClubFilter,
  onClubFilterChange
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed'>('active');
  const [events, setEvents] = useState<EnrichedEvent[]>([]);
  const [clubs, setClubs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClub, setSelectedClub] = useState(selectedClubFilter || 'Wszystkie kluby');
  const [selectedCommercialStatus, setSelectedCommercialStatus] = useState('Wszystkie');

  // Sorting
  const [sortBy, setSortBy] = useState<'date' | 'daysToEvent' | 'sold' | 'forecast' | 'name' | 'change' | 'utilization' | 'remaining'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    if (selectedClubFilter) {
      setSelectedClub(selectedClubFilter);
    }
  }, [selectedClubFilter]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const clubsList = await eventsService.getClubsList();
        setClubs(clubsList);

        const activeClub = isAllClubs(selectedClub) ? undefined : selectedClub;

        const list = await eventsService.getEvents({
          status: activeTab,
          search: searchQuery,
          club: activeClub,
          commercialStatus: selectedCommercialStatus !== 'Wszystkie' ? selectedCommercialStatus : undefined,
          sortBy,
          sortOrder
        });
        setEvents(list);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [activeTab, searchQuery, selectedClub, selectedCommercialStatus, sortBy, sortOrder]);

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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Harmonogram meczów
            </h1>
            {!isAllClubs(selectedClub) && (
              <span className="text-xs px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800">
                {selectedClub}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Kompletne zestawienie spotkań z bieżącym zapełnieniem, prognozowaną frekwencją i zapasem biletów
          </p>
        </div>

        {/* Segmented Tab Control */}
        <div className="inline-flex rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100/80 dark:bg-zinc-800/80 p-0.5 text-xs">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-3 py-1 font-medium rounded-md transition-colors cursor-pointer ${
              activeTab === 'active'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
            }`}
          >
            Aktywne w sprzedaży
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-3 py-1 font-medium rounded-md transition-colors cursor-pointer ${
              activeTab === 'completed'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
            }`}
          >
            Zakończone (z wynikiem)
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 font-medium rounded-md transition-colors cursor-pointer ${
              activeTab === 'all'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
            }`}
          >
            Wszystkie
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-[240px] flex-1 sm:flex-initial">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Szukaj po rywalu, rozgrywkach..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Club Filter */}
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

          {/* Commercial status filter */}
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

      {/* Events Table */}
      <EventsTable
        events={events}
        onSelectEvent={onSelectEvent}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        showOutcomeColumns={activeTab === 'completed' || activeTab === 'all'}
      />
    </div>
  );
};
