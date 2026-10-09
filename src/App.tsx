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
import { eventsService } from './services/eventsService';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavItemKey>('overview');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedEventName, setSelectedEventName] = useState<string | undefined>(undefined);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [dataIssuesCount, setDataIssuesCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
      const issues = await eventsService.getDataIssues();
      setDataIssuesCount(issues.length);
      await new Promise((r) => setTimeout(r, 450));
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100 antialiased selection:bg-indigo-500 selection:text-white">
      {/* Sidebar with KLUB and BEYOND OPERATIONS sections */}
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

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        <Header
          currentTab={currentTab}
          selectedEventName={selectedEventName}
          onBackToEvents={handleBackToEvents}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {selectedEventId ? (
            <EventDetailPage eventId={selectedEventId} onBack={handleBackToEvents} />
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
                <ForecastAccuracyPage
                  selectedClubFilter={selectedClubContext}
                  onClubFilterChange={setSelectedClubContext}
                />
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
