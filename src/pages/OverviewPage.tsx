import React, { useEffect, useState } from 'react';
import { ArrowRight, Eye, RotateCcw, Search, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { ClubOverviewKPIs, EnrichedEvent } from '../types/ticketing';
import { eventsService, isAllClubs } from '../services/eventsService';
import { MetricCard } from '../components/common/MetricCard';
import { FeaturedMatchCard } from '../components/common/FeaturedMatchCard';
import { EventsTable } from '../components/table/EventsTable';
import { IngestionCoveragePanel } from '../components/operations/IngestionCoveragePanel';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClub, setSelectedClub] = useState(selectedClubFilter || 'Wszystkie kluby');
  const [selectedCommercialStatus, setSelectedCommercialStatus] = useState('Wszystkie');
  const [sortBy, setSortBy] = useState<'date' | 'daysToEvent' | 'sold' | 'forecast' | 'name' | 'change' | 'utilization' | 'remaining'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    if (selectedClubFilter) setSelectedClub(selectedClubFilter);
  }, [selectedClubFilter]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const activeClub = isAllClubs(selectedClub) ? undefined : selectedClub;
        const [kpisData, clubsData, eventsData] = await Promise.all([
          eventsService.getClubOverviewKPIs(activeClub),
          eventsService.getClubsList(),
          eventsService.getEvents({
            status: 'active',
            search: searchQuery,
            club: activeClub,
            commercialStatus: selectedCommercialStatus !== 'Wszystkie' ? selectedCommercialStatus : undefined,
            sortBy,
            sortOrder
          })
        ]);
        setKpis(kpisData);
        setClubs(clubsData);
        setEvents(eventsData);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [searchQuery, selectedClub, selectedCommercialStatus, sortBy, sortOrder]);

  const handleSort = (field: 'date' | 'daysToEvent' | 'sold' | 'forecast' | 'name' | 'change' | 'utilization' | 'remaining') => {
    if (sortBy === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else {
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

  const hasActiveFilters = searchQuery !== '' || !isAllClubs(selectedClub) || selectedCommercialStatus !== 'Wszystkie';

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-flex h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        <p className="mt-3 text-xs text-zinc-500">Wczytywanie danych o zainteresowaniu...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Zainteresowanie i prognoza frekwencji</h1>
            {!isAllClubs(selectedClub) && (
              <span className="text-xs px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800">{selectedClub}</span>
            )}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-3xl">
            Pokazujemy to, co widać publicznie w systemie biletowym, i na tej podstawie oceniamy zainteresowanie oraz przewidujemy frekwencję. Nie mamy dostępu do rzeczywistej liczby sprzedanych biletów.
          </p>
        </div>

        {kpis && (
          <div onClick={onNavigateToAccuracy} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/20 text-xs text-indigo-900 dark:text-indigo-300 hover:border-indigo-300 cursor-pointer transition-colors">
            <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Sprawdź, jak trafne są prognozy</span>
            <ArrowRight className="w-3.5 h-3.5 text-indigo-400 ml-1" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 flex gap-3">
          <Eye className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
          <div><div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">1. Widoczne wolne miejsca</div><p className="mt-1 text-[11px] text-zinc-500">Ile miejsc publiczny system pokazuje jako dostępne. To nie jest liczba niesprzedanych biletów.</p></div>
        </div>
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 flex gap-3">
          <Sparkles className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
          <div><div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">2. Zainteresowanie</div><p className="mt-1 text-[11px] text-zinc-500">Obserwujemy, czy widocznych miejsc ubywa i jak szybko zmienia się dostępność.</p></div>
        </div>
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 flex gap-3">
          <Users className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
          <div><div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">3. Prognoza frekwencji</div><p className="mt-1 text-[11px] text-zinc-500">Nasze przewidywanie, ilu widzów finalnie pojawi się na meczu.</p></div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Monitorowane mecze"
          value={kpis ? kpis.upcomingEventsCount : '—'}
          subtext={!isAllClubs(selectedClub) ? `Dla klubu ${selectedClub}` : 'Wszystkie kluby'}
          tooltip="Liczba nadchodzących meczów, dla których aktywnie zbieramy dane."
        />
        <MetricCard
          label="Szacowane zajęcie teraz"
          value={kpis ? formatPercent(kpis.avgCurrentUtilization) : '—'}
          subtext="Na podstawie widocznych wolnych miejsc"
          tooltip="To szacunek oparty na publicznej dostępności miejsc, a nie na rzeczywistych danych sprzedażowych."
        />
        <MetricCard
          label="Przewidywane wypełnienie"
          value={kpis ? formatPercent(kpis.avgPredictedUtilization) : '—'}
          subtext="Według obecnej prognozy frekwencji"
          tooltip="Jaki procent pojemności stadionu przewidujemy na koniec."
        />
        <MetricCard
          label="Mecze do sprawdzenia"
          value={kpis ? kpis.eventsNeedingAttentionCount : '—'}
          subtext={kpis && kpis.eventsNeedingAttentionCount > 0 ? 'Zainteresowanie słabsze od oczekiwań' : 'Brak aktywnych ostrzeżeń'}
          tooltip="Mecze, dla których obecne zainteresowanie lub prognoza odbiegają od oczekiwań."
          highlight={kpis && kpis.eventsNeedingAttentionCount > 0 ? 'warning' : 'normal'}
        />
      </div>

      <IngestionCoveragePanel onSelectEvent={onSelectEvent} />

      {kpis?.closestMatch && (
        <FeaturedMatchCard event={kpis.closestMatch.event} snapshots={kpis.closestMatch.snapshots} forecasts={kpis.closestMatch.forecasts} onSelectEvent={onSelectEvent} />
      )}

      <div className="space-y-3 pt-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Nadchodzące mecze ({events.length})</h2>
            <p className="text-xs text-zinc-500">Najważniejsze informacje o dostępności miejsc, zainteresowaniu i prognozowanej frekwencji.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[180px] flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Szukaj rywala, meczu..." className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
            <select value={isAllClubs(selectedClub) ? 'Wszystkie kluby' : selectedClub} onChange={(e) => handleClubChange(e.target.value)} className="py-1.5 px-2.5 text-xs rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer font-medium">
              <option value="Wszystkie kluby">Wszystkie kluby</option>
              {clubs.filter((club) => !isAllClubs(club)).map((club) => <option key={club} value={club}>{club}</option>)}
            </select>
            <select value={selectedCommercialStatus} onChange={(e) => setSelectedCommercialStatus(e.target.value)} className="py-1.5 px-2.5 text-xs rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer">
              <option value="Wszystkie">Ocena: Wszystkie</option>
              <option value="Bardzo dobra sprzedaż">Wysokie zainteresowanie</option>
              <option value="Zgodnie z oczekiwaniami">Zgodnie z oczekiwaniami</option>
              <option value="Poniżej oczekiwań">Słabsze zainteresowanie</option>
              <option value="Wymaga uwagi">Wymaga uwagi</option>
            </select>
            {hasActiveFilters && (
              <button onClick={resetFilters} className="flex items-center gap-1 py-1.5 px-2.5 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded cursor-pointer transition-colors" title="Pokaż wszystkie kluby i zresetuj filtry">
                <RotateCcw className="w-3 h-3" /><span>Resetuj</span>
              </button>
            )}
          </div>
        </div>

        <EventsTable events={events} onSelectEvent={onSelectEvent} sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
      </div>
    </div>
  );
};
