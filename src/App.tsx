import React, { useState, useEffect } from 'react';
import { Sidebar, NavItemKey } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { OverviewPage } from './pages/OverviewPage';
import { EventsListPage } from './pages/EventsListPage';
import { EventDetailPage } from './pages/EventDetailPage';
import { SalesAnalyticsPage } from './pages/SalesAnalyticsPage';
import { ForecastAccuracyPage } from './pages/ForecastAccuracyPage';
import { DataQualityPage } from './pages/DataQualityPage';
import { SettingsPage } from './pages/SettingsPage';
import { ResearchReadinessPanel } from './components/research/ResearchReadinessPanel';
import { DemandSignalsPanel } from './components/research/DemandSignalsPanel';
import { eventsService } from './services/eventsService';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavItemKey>('overview');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedEventName, setSelectedEventName] = useState<string | undefined>(undefined);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [dataIssuesCount, setDataIssuesCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);

  // Club context for ticketing manager POC demo
  const [selectedClubContext, setSelectedClubContext] = useState<string>('Lech Poznań');
  const [clubsList, setClubsList] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [issues, clubs] = await Promise.all([
        eventsService.getDataIssues(),
        eventsService.getClubsList()
      ]);
      setDataIssuesCount(issues.length);
      setClubsList(['Wszystkie kluby', ...clubs]);
    };
    fetchData();
  }, []);

  const handleSelectEvent = async (eventId: string) => {
    setSelectedEventId(eventId);
    const eventDetail = await eventsService.getEventById(eventId);
    if (eventDetail) {
      setSelectedEventName(eventDetail.event.name);
    }
  };

  const handleBackToEvents = () => {
    setSelectedEventId(null);
    setSelectedEventName(undefined);
  };

  const handleSelectTab = (tab: NavItemKey) => {
    setCurrentTab(tab);
    setSelectedEventId(null);
    setSelectedEventName(undefined);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await eventsService.refresh();
      const [issues, clubs] = await Promise.all([
        eventsService.getDataIssues(),
        eventsService.getClubsList()
      ]);
      setDataIssuesCount(issues.length);
      setClubsList(['Wszystkie kluby', ...clubs]);
      setRefreshVersion((version) => version + 1);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100 antialiased selection:bg-indigo-500 selection:text-white">
      <Sidebar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        dataIssuesCount={dataIssuesCount}
        selectedClubContext={selectedClubContext}
        onSelectClubContext={setSelectedClubContext}
        clubs={clubsList}
      />

      <div className="flex flex-1 flex-col min-w-0">
        <Header
          currentTab={currentTab}
          selectedEventName={selectedEventName}
          onBackToEvents={handleBackToEvents}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        <main
          key={refreshVersion}
          className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto"
        >
          {selectedEventId ? (
            <div className="space-y-6">
              <EventDetailPage eventId={selectedEventId} onBack={handleBackToEvents} />
              <DemandSignalsPanel eventId={selectedEventId} />
            </div>
          ) : (
            <>
              {currentTab === 'overview' && (
                <OverviewPage
                  onSelectEvent={handleSelectEvent}
                  onNavigateToAccuracy={() => handleSelectTab('forecast-accuracy')}
                  selectedClubFilter={selectedClubContext}
                  onClubFilterChange={setSelectedClubContext}
                />
              )}

              {currentTab === 'events' && (
                <EventsListPage
                  onSelectEvent={handleSelectEvent}
                  selectedClubFilter={selectedClubContext}
                  onClubFilterChange={setSelectedClubContext}
                />
              )}

              {currentTab === 'sales-analytics' && (
                <SalesAnalyticsPage
                  onSelectEvent={handleSelectEvent}
                  selectedClubFilter={selectedClubContext}
                />
              )}

              {currentTab === 'forecast-accuracy' && (
                <div className="space-y-6">
                  <ResearchReadinessPanel />
                  <ForecastAccuracyPage
                    selectedClubFilter={selectedClubContext}
                    onClubFilterChange={setSelectedClubContext}
                  />
                </div>
              )}

              {currentTab === 'data-quality' && (
                <DataQualityPage onSelectEvent={handleSelectEvent} />
              )}

              {currentTab === 'settings' && <SettingsPage />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
