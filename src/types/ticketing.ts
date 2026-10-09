export type CompetitionType = 'Ekstraklasa' | 'Puchar Polski' | 'Liga Konferencji' | 'Mecz Towarzyski';

export type EventStatus = 'active' | 'completed' | 'cancelled';

export type DataStatus = 'Aktualne' | 'Nieaktualne' | 'Brak danych' | 'Problem';

export type ForecastStatus = 'Aktualna' | 'Brak prognozy' | 'Do przeliczenia' | 'Problem';

export type ClubCommercialStatus =
  | 'Bardzo dobra sprzedaż'
  | 'Zgodnie z oczekiwaniami'
  | 'Poniżej oczekiwań'
  | 'Wymaga uwagi';

export type SalesTrend = 'Przyspiesza' | 'Stabilny' | 'Zwalnia';

export type IssueType =
  | 'stale_snapshot'
  | 'missing_forecast'
  | 'unusual_sales_drop'
  | 'forecast_older_than_data';

export type IssueSeverity = 'critical' | 'warning' | 'info';

export interface SportEvent {
  id: string;
  name: string;
  homeTeam: string;
  awayTeam: string;
  club: string; // Klub gospodarz
  competition: CompetitionType;
  eventDate: string; // ISO string
  capacity: number;
  status: EventStatus;
}

export interface Snapshot {
  id: string;
  eventId: string;
  timestamp: string; // ISO string
  sold: number;
}

export interface Forecast {
  id: string;
  eventId: string;
  timestamp: string; // ISO string
  predictedFinalSales: number;
  sourceSnapshotId: string;
  modelVersion?: string;
}

export interface Outcome {
  eventId: string;
  actualFinalSales: number;
  recordedAt: string;
}

export interface DataIssue {
  id: string;
  eventId: string;
  type: IssueType;
  description: string;
  detectedAt: string; // ISO string
  severity: IssueSeverity;
}

export interface EnrichedEvent extends SportEvent {
  latestSnapshot?: Snapshot;
  latestForecast?: Forecast;
  previousForecast?: Forecast;
  outcome?: Outcome;
  dataStatus: DataStatus;
  forecastStatus: ForecastStatus;
  currentSold: number;
  currentForecast?: number;
  forecastDelta?: number;
  daysToEvent: number;
  lastUpdated: string;
  utilizationRate?: number; // predicted / capacity * 100
  currentUtilization: number; // currentSold / capacity * 100
  remainingCapacity: number; // capacity - currentSold
  forecastRemainingUnsold: number; // capacity - currentForecast
  commercialStatus: ClubCommercialStatus;
  trend: SalesTrend;
  hasIssues: boolean;
  issuesCount: number;
  // For completed events:
  finalAbsoluteError?: number;
  finalPercentageError?: number;
}

export interface EventDetailData {
  event: EnrichedEvent;
  snapshots: Snapshot[];
  forecasts: Forecast[];
  outcome?: Outcome;
  issues: DataIssue[];
  modelDiagnostics: {
    lastSnapshotAt?: string;
    lastForecastAt?: string;
    snapshotsCount: number;
    forecastsCount: number;
    activeModel: string;
    pipelineLatencyMinutes: number;
    lastRefreshStatus: 'ok' | 'degraded' | 'error';
  };
}

export interface ForecastHistoryItem {
  id: string;
  timestamp: string;
  daysToEvent: number;
  sold: number;
  forecast: number;
  forecastDelta?: number;
  actualOutcome?: number;
  signedError?: number;
  absoluteError?: number;
  percentageError?: number;
}

export interface ClubOverviewKPIs {
  upcomingEventsCount: number;
  avgCurrentUtilization: number;
  avgPredictedUtilization: number;
  eventsNeedingAttentionCount: number;
  modelAccuracyScore: number;
  closestMatch?: {
    event: EnrichedEvent;
    snapshots: Snapshot[];
    forecasts: Forecast[];
  };
  totalMonitoredEvents: number;
}

export type HorizonBucket =
  | '30+ dni'
  | '15–29 dni'
  | '8–14 dni'
  | '4–7 dni'
  | '1–3 dni'
  | 'dzień eventu';

export interface HorizonMetric {
  horizon: HorizonBucket;
  forecastsCount: number;
  mae: number;
  mape: number;
  bias: number;
  medianError: number;
}

export interface BusinessAccuracyKPIs {
  mae: number;
  medianError: number;
  mape: number;
  bias: number;
  accuracyWithin5Pct: number; // np. 78.5%
  accuracyWithin10Pct: number; // np. 94.2%
  evaluatedMatchesCount: number;
  totalEvaluatedForecasts: number;
}

export interface ModelPerformanceData {
  businessKpis: BusinessAccuracyKPIs;
  horizonMetrics: HorizonMetric[];
  trendByTime: Array<{
    daysBefore: number;
    label: string;
    mape: number;
    mae: number;
  }>;
}

export interface DataIssueEnriched extends DataIssue {
  eventName: string;
  club: string;
  eventDate: string;
  dataStatus: DataStatus;
}
