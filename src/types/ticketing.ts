export type CompetitionType = string;

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
  club: string;
  clubSlug?: string;
  competition: CompetitionType;
  eventDate: string;
  capacity: number;
  status: EventStatus;
  provider?: string;
  externalEventId?: string;
}

export interface Snapshot {
  id: string;
  eventId: string;
  timestamp: string;
  /** Derived proxy: configured stadium capacity minus public inventory available. */
  sold: number;
  /** Public ticket inventory visible in the source system at the snapshot time. */
  available?: number;
  sectorCount?: number;
  interpretation?: 'demand_proxy_not_confirmed_sales';
}

export interface Forecast {
  id: string;
  eventId: string;
  timestamp: string;
  predictedFinalSales: number;
  predictedLow?: number;
  predictedHigh?: number;
  sourceSnapshotId: string;
  modelVersion?: string;
  rawStatus?: string;
  signalReadiness?: string;
  liveAdjustment?: number;
}

export interface Outcome {
  eventId: string;
  actualFinalSales: number;
  recordedAt: string;
  sourceName?: string;
  attendanceDefinition?: string;
}

export interface DataIssue {
  id: string;
  eventId: string;
  type: IssueType;
  description: string;
  detectedAt: string;
  severity: IssueSeverity;
}

export interface EnrichedEvent extends SportEvent {
  latestSnapshot?: Snapshot;
  latestForecast?: Forecast;
  previousForecast?: Forecast;
  outcome?: Outcome;
  dataStatus: DataStatus;
  forecastStatus: ForecastStatus;
  /** Capacity - public inventory. This is a demand proxy, not confirmed ticket sales. */
  currentSold: number;
  inventoryAvailable?: number;
  inventoryInterpretation: 'demand_proxy_not_confirmed_sales';
  currentForecast?: number;
  forecastLow?: number;
  forecastHigh?: number;
  forecastDelta?: number;
  daysToEvent: number;
  lastUpdated: string;
  utilizationRate?: number;
  currentUtilization: number;
  remainingCapacity: number;
  forecastRemainingUnsold: number;
  commercialStatus: ClubCommercialStatus;
  trend: SalesTrend;
  hasIssues: boolean;
  issuesCount: number;
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
  accuracyWithin5Pct: number;
  accuracyWithin10Pct: number;
  evaluatedMatchesCount: number;
  totalEvaluatedForecasts: number;
  evaluatedModelVersions: string[];
  headlineMethod: 'latest_forecast_per_match';
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
