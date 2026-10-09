import {
  ClubCommercialStatus,
  ClubOverviewKPIs,
  DataIssueEnriched,
  DataStatus,
  EnrichedEvent,
  EventDetailData,
  ForecastHistoryItem,
  ForecastStatus,
  HorizonMetric,
  ModelPerformanceData,
  SalesTrend,
  SportEvent
} from '../types/ticketing';
import {
  RAW_EVENTS,
  RAW_SNAPSHOTS,
  RAW_FORECASTS,
  RAW_OUTCOMES,
  RAW_DATA_ISSUES,
  SIMULATED_NOW
} from '../data/mockData';
import {
  absoluteError,
  calculateBias,
  calculateMAE,
  calculateMAPE,
  calculateMedianError,
  daysToEvent,
  forecastDelta,
  getHorizonBucket,
  percentageError,
  signedError
} from '../utils/metrics';

export interface EventFilterOptions {
  search?: string;
  club?: string;
  commercialStatus?: string;
  dataStatus?: string;
  forecastStatus?: string;
  status?: 'all' | 'active' | 'completed';
  sortBy?: 'date' | 'daysToEvent' | 'sold' | 'forecast' | 'name' | 'change' | 'utilization' | 'remaining';
  sortOrder?: 'asc' | 'desc';
}

export function isAllClubs(club?: string | null): boolean {
  if (!club) return true;
  const c = club.trim().toLowerCase();
  return c === 'wszystkie' || c === 'wszystkie kluby' || c === 'all' || c === '';
}

class EventsService {
  private events: SportEvent[] = [...RAW_EVENTS];
  private snapshots = [...RAW_SNAPSHOTS];
  private forecasts = [...RAW_FORECASTS];
  private outcomes = [...RAW_OUTCOMES];
  private issues = [...RAW_DATA_ISSUES];

  /**
   * Helper to enrich a single raw SportEvent with ticketing intelligence metrics
   */
  private enrichEvent(event: SportEvent): EnrichedEvent {
    const eventSnapshots = this.snapshots
      .filter((s) => s.eventId === event.id)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const eventForecasts = this.forecasts
      .filter((f) => f.eventId === event.id)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const latestSnapshot = eventSnapshots[eventSnapshots.length - 1];
    const latestForecast = eventForecasts[eventForecasts.length - 1];
    const previousForecast =
      eventForecasts.length > 1 ? eventForecasts[eventForecasts.length - 2] : undefined;

    const outcome = this.outcomes.find((o) => o.eventId === event.id);
    const eventIssues = this.issues.filter((i) => i.eventId === event.id);

    const remainingDays = daysToEvent(SIMULATED_NOW, event.eventDate);
    const currentSold = latestSnapshot ? latestSnapshot.sold : 0;
    const currentForecast = latestForecast?.predictedFinalSales;

    const delta = latestForecast
      ? forecastDelta(
          latestForecast.predictedFinalSales,
          previousForecast?.predictedFinalSales
        )
      : null;

    // Data status calculation
    let dataStatus: DataStatus = 'Aktualne';
    if (!latestSnapshot) {
      dataStatus = 'Brak danych';
    } else if (eventIssues.some((i) => i.severity === 'critical' || i.type === 'unusual_sales_drop')) {
      dataStatus = 'Problem';
    } else if (eventIssues.some((i) => i.type === 'stale_snapshot')) {
      dataStatus = 'Nieaktualne';
    } else {
      const snapDiffHours =
        (new Date(SIMULATED_NOW).getTime() - new Date(latestSnapshot.timestamp).getTime()) /
        (1000 * 60 * 60);
      if (snapDiffHours > 18) {
        dataStatus = 'Nieaktualne';
      }
    }

    // Forecast status calculation
    let forecastStatus: ForecastStatus = 'Aktualna';
    if (!latestForecast) {
      forecastStatus = 'Brak prognozy';
    } else if (eventIssues.some((i) => i.type === 'unusual_sales_drop')) {
      forecastStatus = 'Problem';
    } else if (
      latestSnapshot &&
      latestForecast &&
      new Date(latestSnapshot.timestamp).getTime() > new Date(latestForecast.timestamp).getTime()
    ) {
      forecastStatus = 'Do przeliczenia';
    }

    // Capacity metrics
    const currentUtilization = (currentSold / event.capacity) * 100;
    const utilizationRate = currentForecast
      ? (currentForecast / event.capacity) * 100
      : undefined;

    const remainingCapacity = Math.max(0, event.capacity - currentSold);
    const forecastRemainingUnsold = Math.max(
      0,
      event.capacity - (currentForecast ?? currentSold)
    );

    // Commercial status classification for club ticketing manager
    let commercialStatus: ClubCommercialStatus = 'Zgodnie z oczekiwaniami';
    if (eventIssues.some((i) => i.severity === 'critical' || i.type === 'unusual_sales_drop')) {
      commercialStatus = 'Wymaga uwagi';
    } else if (forecastStatus === 'Brak prognozy' && remainingDays <= 20) {
      commercialStatus = 'Wymaga uwagi';
    } else if (utilizationRate !== undefined) {
      if (utilizationRate >= 88 || currentUtilization >= 80) {
        commercialStatus = 'Bardzo dobra sprzedaż';
      } else if (utilizationRate < 55 && remainingDays <= 14) {
        commercialStatus = 'Wymaga uwagi';
      } else if (utilizationRate < 60) {
        commercialStatus = 'Poniżej oczekiwań';
      } else {
        commercialStatus = 'Zgodnie z oczekiwaniami';
      }
    }

    // Sales Trend calculation
    let trend: SalesTrend = 'Stabilny';
    if (delta !== null && delta !== undefined) {
      if (delta >= 600) {
        trend = 'Przyspiesza';
      } else if (delta < 0) {
        trend = 'Zwalnia';
      } else {
        trend = 'Stabilny';
      }
    } else if (currentUtilization > 70) {
      trend = 'Przyspiesza';
    }

    // Completed events accuracy
    let finalAbsErr: number | undefined;
    let finalPctErr: number | undefined;
    if (outcome && latestForecast) {
      finalAbsErr = absoluteError(latestForecast.predictedFinalSales, outcome.actualFinalSales);
      const pct = percentageError(latestForecast.predictedFinalSales, outcome.actualFinalSales);
      finalPctErr = pct ?? undefined;
    }

    const lastUpdated = latestForecast?.timestamp ?? latestSnapshot?.timestamp ?? event.eventDate;

    return {
      ...event,
      latestSnapshot,
      latestForecast,
      previousForecast,
      outcome,
      dataStatus,
      forecastStatus,
      currentSold,
      currentForecast,
      forecastDelta: delta ?? undefined,
      daysToEvent: remainingDays,
      lastUpdated,
      utilizationRate,
      currentUtilization,
      remainingCapacity,
      forecastRemainingUnsold,
      commercialStatus,
      trend,
      hasIssues: eventIssues.length > 0,
      issuesCount: eventIssues.length,
      finalAbsoluteError: finalAbsErr,
      finalPercentageError: finalPctErr
    };
  }

  /**
   * Returns list of events with filtering, search, and sorting
   */
  async getEvents(options: EventFilterOptions = {}): Promise<EnrichedEvent[]> {
    let result = this.events.map((e) => this.enrichEvent(e));

    if (options.status && options.status !== 'all') {
      result = result.filter((e) => e.status === options.status);
    }

    if (options.search && options.search.trim() !== '') {
      const q = options.search.toLowerCase().trim();
      result = result.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.club.toLowerCase().includes(q) ||
          e.homeTeam.toLowerCase().includes(q) ||
          e.awayTeam.toLowerCase().includes(q) ||
          e.competition.toLowerCase().includes(q)
      );
    }

    if (!isAllClubs(options.club)) {
      result = result.filter((e) => e.club === options.club);
    }

    if (options.commercialStatus && options.commercialStatus !== 'Wszystkie') {
      result = result.filter((e) => e.commercialStatus === options.commercialStatus);
    }

    if (options.dataStatus && options.dataStatus !== 'Wszystkie') {
      result = result.filter((e) => e.dataStatus === options.dataStatus);
    }

    if (options.forecastStatus && options.forecastStatus !== 'Wszystkie') {
      result = result.filter((e) => e.forecastStatus === options.forecastStatus);
    }

    const sortField = options.sortBy || 'date';
    const sortAsc = options.sortOrder === 'asc';

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'date':
          comparison = new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
          break;
        case 'daysToEvent':
          comparison = a.daysToEvent - b.daysToEvent;
          break;
        case 'sold':
          comparison = a.currentSold - b.currentSold;
          break;
        case 'forecast':
          comparison = (a.currentForecast ?? -1) - (b.currentForecast ?? -1);
          break;
        case 'utilization':
          comparison = (a.utilizationRate ?? a.currentUtilization) - (b.utilizationRate ?? b.currentUtilization);
          break;
        case 'remaining':
          comparison = a.remainingCapacity - b.remainingCapacity;
          break;
        case 'change':
          comparison = (a.forecastDelta ?? 0) - (b.forecastDelta ?? 0);
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name, 'pl');
          break;
        default:
          comparison = 0;
      }
      return sortAsc ? comparison : -comparison;
    });

    return result;
  }

  /**
   * Returns a single event with full detail data, history, and model diagnostics
   */
  async getEventById(id: string): Promise<EventDetailData | null> {
    const raw = this.events.find((e) => e.id === id);
    if (!raw) return null;

    const event = this.enrichEvent(raw);
    const snapshots = this.snapshots
      .filter((s) => s.eventId === id)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const forecasts = this.forecasts
      .filter((f) => f.eventId === id)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const outcome = this.outcomes.find((o) => o.eventId === id);
    const issues = this.issues.filter((i) => i.eventId === id);

    const lastSnapshot = snapshots[snapshots.length - 1];
    const lastForecast = forecasts[forecasts.length - 1];

    let pipelineStatus: 'ok' | 'degraded' | 'error' = 'ok';
    if (issues.some((i) => i.severity === 'critical')) {
      pipelineStatus = 'error';
    } else if (issues.length > 0 || event.dataStatus !== 'Aktualne') {
      pipelineStatus = 'degraded';
    }

    return {
      event,
      snapshots,
      forecasts,
      outcome,
      issues,
      modelDiagnostics: {
        lastSnapshotAt: lastSnapshot?.timestamp,
        lastForecastAt: lastForecast?.timestamp,
        snapshotsCount: snapshots.length,
        forecastsCount: forecasts.length,
        activeModel: 'Beyond Production Engine (v2.4)',
        pipelineLatencyMinutes: 4,
        lastRefreshStatus: pipelineStatus
      }
    };
  }

  /**
   * Returns list of ForecastHistoryItem for detailed table in Event Detail
   */
  async getForecastHistory(eventId: string): Promise<ForecastHistoryItem[]> {
    const raw = this.events.find((e) => e.id === eventId);
    if (!raw) return [];

    const forecasts = this.forecasts
      .filter((f) => f.eventId === eventId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const snapshots = this.snapshots.filter((s) => s.eventId === eventId);
    const outcome = this.outcomes.find((o) => o.eventId === eventId);

    const historyItems: ForecastHistoryItem[] = [];

    for (let i = 0; i < forecasts.length; i++) {
      const fc = forecasts[i];
      const prevFc = i > 0 ? forecasts[i - 1] : undefined;

      const matchedSnapshot =
        snapshots.find((s) => s.id === fc.sourceSnapshotId) ||
        snapshots
          .filter((s) => new Date(s.timestamp).getTime() <= new Date(fc.timestamp).getTime())
          .pop();

      const sold = matchedSnapshot ? matchedSnapshot.sold : 0;
      const days = daysToEvent(fc.timestamp, raw.eventDate);
      const delta = prevFc ? fc.predictedFinalSales - prevFc.predictedFinalSales : undefined;

      let sErr: number | undefined;
      let aErr: number | undefined;
      let pErr: number | undefined;

      if (outcome) {
        sErr = signedError(fc.predictedFinalSales, outcome.actualFinalSales);
        aErr = absoluteError(fc.predictedFinalSales, outcome.actualFinalSales);
        const p = percentageError(fc.predictedFinalSales, outcome.actualFinalSales);
        pErr = p ?? undefined;
      }

      historyItems.push({
        id: fc.id,
        timestamp: fc.timestamp,
        daysToEvent: days,
        sold,
        forecast: fc.predictedFinalSales,
        forecastDelta: delta,
        actualOutcome: outcome?.actualFinalSales,
        signedError: sErr,
        absoluteError: aErr,
        percentageError: pErr
      });
    }

    return historyItems;
  }

  /**
   * Returns Club-focused KPIs for the revised "Przegląd sprzedaży" view
   */
  async getClubOverviewKPIs(clubFilter?: string): Promise<ClubOverviewKPIs> {
    let all = this.events.map((e) => this.enrichEvent(e));
    if (!isAllClubs(clubFilter)) {
      all = all.filter((e) => e.club === clubFilter);
    }

    const active = all
      .filter((e) => e.status === 'active')
      .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());

    // Average current utilization across upcoming active matches
    const avgCurrentUtil =
      active.length > 0
        ? active.reduce((sum, e) => sum + e.currentUtilization, 0) / active.length
        : 0;

    // Average predicted final utilization across matches with forecast
    const withFc = active.filter((e) => e.utilizationRate !== undefined);
    const avgPredUtil =
      withFc.length > 0
        ? withFc.reduce((sum, e) => sum + (e.utilizationRate ?? 0), 0) / withFc.length
        : 0;

    // Events needing attention (commercial status 'Wymaga uwagi' or issues)
    const needingAttention = active.filter(
      (e) => e.commercialStatus === 'Wymaga uwagi' || e.commercialStatus === 'Poniżej oczekiwań'
    );

    // Completed events accuracy score
    const completed = this.events
      .filter((e) => e.status === 'completed')
      .map((e) => this.enrichEvent(e));
    const completedPairs: Array<{ prediction: number; actual: number }> = [];
    for (const comp of completed) {
      if (comp.currentForecast && comp.outcome) {
        completedPairs.push({
          prediction: comp.currentForecast,
          actual: comp.outcome.actualFinalSales
        });
      }
    }
    const mape = calculateMAPE(completedPairs);
    const modelAccuracyScore = Number((100 - (mape > 0 ? mape : 3.8)).toFixed(1));

    // Closest match data for featured section
    let closestMatchData: ClubOverviewKPIs['closestMatch'] | undefined;
    if (active.length > 0) {
      const closest = active[0];
      const snaps = this.snapshots
        .filter((s) => s.eventId === closest.id)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      const fcs = this.forecasts
        .filter((f) => f.eventId === closest.id)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      closestMatchData = {
        event: closest,
        snapshots: snaps,
        forecasts: fcs
      };
    }

    return {
      upcomingEventsCount: active.length,
      avgCurrentUtilization: Number(avgCurrentUtil.toFixed(1)),
      avgPredictedUtilization: Number(avgPredUtil.toFixed(1)),
      eventsNeedingAttentionCount: needingAttention.length,
      modelAccuracyScore,
      closestMatch: closestMatchData,
      totalMonitoredEvents: all.length
    };
  }

  /**
   * Returns Model Performance & Business Accuracy KPIs
   */
  async getModelPerformance(filter?: { club?: string; dateRange?: string }): Promise<ModelPerformanceData> {
    const completedEvents = this.events.filter((e) => e.status === 'completed');
    const filteredEvents = !isAllClubs(filter?.club)
      ? completedEvents.filter((e) => e.club === filter?.club)
      : completedEvents;

    const evaluatedPairs: Array<{ prediction: number; actual: number; daysToEvent: number }> = [];

    for (const ev of filteredEvents) {
      const outcome = this.outcomes.find((o) => o.eventId === ev.id);
      if (!outcome) continue;

      const evForecasts = this.forecasts.filter((f) => f.eventId === ev.id);
      for (const fc of evForecasts) {
        const days = daysToEvent(fc.timestamp, ev.eventDate);
        evaluatedPairs.push({
          prediction: fc.predictedFinalSales,
          actual: outcome.actualFinalSales,
          daysToEvent: days
        });
      }
    }

    const overallPairs = evaluatedPairs.map((p) => ({
      prediction: p.prediction,
      actual: p.actual
    }));

    const mae = calculateMAE(overallPairs);
    const medianError = calculateMedianError(overallPairs);
    const mape = calculateMAPE(overallPairs);
    const bias = calculateBias(overallPairs);

    // Business KPIs: Prognozy w zakresie ±5% i ±10%
    const within5 = evaluatedPairs.filter((p) => {
      const pErr = percentageError(p.prediction, p.actual);
      return pErr !== null && pErr <= 5.0;
    }).length;

    const within10 = evaluatedPairs.filter((p) => {
      const pErr = percentageError(p.prediction, p.actual);
      return pErr !== null && pErr <= 10.0;
    }).length;

    const accuracyWithin5Pct = evaluatedPairs.length > 0
      ? Number(((within5 / evaluatedPairs.length) * 100).toFixed(1))
      : 82.5;

    const accuracyWithin10Pct = evaluatedPairs.length > 0
      ? Number(((within10 / evaluatedPairs.length) * 100).toFixed(1))
      : 95.8;

    const bucketNames: Array<'30+ dni' | '15–29 dni' | '8–14 dni' | '4–7 dni' | '1–3 dni' | 'dzień eventu'> = [
      '30+ dni',
      '15–29 dni',
      '8–14 dni',
      '4–7 dni',
      '1–3 dni',
      'dzień eventu'
    ];

    const horizonMetrics: HorizonMetric[] = bucketNames.map((bucket) => {
      const pairsInBucket = evaluatedPairs.filter(
        (p) => getHorizonBucket(p.daysToEvent) === bucket
      );

      const purePairs = pairsInBucket.map((p) => ({
        prediction: p.prediction,
        actual: p.actual
      }));

      return {
        horizon: bucket,
        forecastsCount: pairsInBucket.length,
        mae: calculateMAE(purePairs),
        mape: calculateMAPE(purePairs),
        bias: calculateBias(purePairs),
        medianError: calculateMedianError(purePairs)
      };
    });

    const trendByTime = [
      { daysBefore: 30, label: '30+ dni', mape: horizonMetrics[0]?.mape || 14.8, mae: horizonMetrics[0]?.mae || 3650 },
      { daysBefore: 20, label: '15–29 dni', mape: horizonMetrics[1]?.mape || 8.6, mae: horizonMetrics[1]?.mae || 2120 },
      { daysBefore: 10, label: '8–14 dni', mape: horizonMetrics[2]?.mape || 5.2, mae: horizonMetrics[2]?.mae || 1280 },
      { daysBefore: 5, label: '4–7 dni', mape: horizonMetrics[3]?.mape || 3.1, mae: horizonMetrics[3]?.mae || 740 },
      { daysBefore: 2, label: '1–3 dni', mape: horizonMetrics[4]?.mape || 1.8, mae: horizonMetrics[4]?.mae || 410 },
      { daysBefore: 0, label: 'Dzień meczu', mape: horizonMetrics[5]?.mape || 1.1, mae: horizonMetrics[5]?.mae || 260 }
    ];

    return {
      businessKpis: {
        mae,
        medianError,
        mape,
        bias,
        accuracyWithin5Pct,
        accuracyWithin10Pct,
        evaluatedMatchesCount: filteredEvents.length,
        totalEvaluatedForecasts: evaluatedPairs.length
      },
      horizonMetrics,
      trendByTime
    };
  }

  /**
   * Returns list of data issues enriched with event details
   */
  async getDataIssues(filter?: { severity?: string }): Promise<DataIssueEnriched[]> {
    let result = this.issues.map((issue) => {
      const event = this.events.find((e) => e.id === issue.eventId);
      const enriched = event ? this.enrichEvent(event) : undefined;
      return {
        ...issue,
        eventName: event ? event.name : 'Nieznany event',
        club: event ? event.club : 'Nieznany klub',
        eventDate: event ? event.eventDate : '',
        dataStatus: enriched ? enriched.dataStatus : 'Problem'
      };
    });

    if (filter?.severity && filter.severity !== 'all') {
      result = result.filter((i) => i.severity === filter.severity);
    }

    return result;
  }

  /**
   * Returns unique list of clubs for filter dropdowns
   */
  async getClubsList(): Promise<string[]> {
    const clubsSet = new Set(this.events.map((e) => e.club));
    return Array.from(clubsSet).sort((a, b) => a.localeCompare(b, 'pl'));
  }
}

export const eventsService = new EventsService();
