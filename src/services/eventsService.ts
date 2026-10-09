import {
  ClubCommercialStatus,
  ClubOverviewKPIs,
  DataIssue,
  DataIssueEnriched,
  DataStatus,
  EnrichedEvent,
  EventDetailData,
  Forecast,
  ForecastHistoryItem,
  ForecastStatus,
  HorizonMetric,
  ModelPerformanceData,
  Outcome,
  SalesTrend,
  Snapshot,
  SportEvent
} from '../types/ticketing';
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
import { fetchRows } from './supabaseRest';

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

interface TicketEventRow {
  id: number;
  provider: string;
  external_event_id: string;
  home_team: string;
  away_team: string;
  competition: string | null;
  match_date: string;
  kickoff_at: string | null;
  mapping_confidence: string | null;
  club_slug: string | null;
  source_domain: string | null;
}

interface SnapshotRow {
  id: number;
  ticket_event_id: number;
  captured_at: string;
  event_match_date_at_capture: string | null;
  event_kickoff_at_capture: string | null;
  available_total: number | null;
  sector_count: number | null;
}

interface OutcomeRow {
  ticket_event_id: number;
  actual_attendance: number | null;
  attendance_definition: string | null;
  source_name: string | null;
  confirmed_at: string | null;
}

interface ForecastObservationRow {
  id: number;
  ticket_event_id: number;
  source_snapshot_id: number | null;
  forecast_generated_at: string;
  source_snapshot_captured_at: string | null;
  hours_to_kickoff: number | null;
  days_to_match: number | null;
  horizon: string | null;
  model_version: string | null;
  historical_p10: number | null;
  historical_p50: number | null;
  historical_p90: number | null;
  live_adjustment: number | null;
  final_p10: number | null;
  final_p50: number | null;
  final_p90: number | null;
  forecast_status: string | null;
  correction_status: string | null;
  signal_readiness: string | null;
  live_available_total: number | null;
  live_first_available_total: number | null;
  live_available_index: number | null;
  live_net_removed_since_first: number | null;
  live_net_removed_since_previous: number | null;
  live_velocity_since_previous: number | null;
  live_net_removed_6h: number | null;
  live_velocity_6h: number | null;
  live_net_removed_24h: number | null;
  live_velocity_24h: number | null;
  live_acceleration_6h_vs_24h: number | null;
  live_raw_snapshot_count: number | null;
  live_clean_snapshot_count: number | null;
  live_excluded_anomaly_count: number | null;
}

// POC configuration only. The ML database currently does not store stadium capacity.
// These values are used to translate public inventory into an occupancy proxy for the UI.
const CLUB_CAPACITY_BY_SLUG: Record<string, number> = {
  lech: 42837,
  jagiellonia: 22372,
  pogonszczecin: 21163,
  gornikzabrze: 24563,
  cracovia: 15114
};

const DATA_TTL_MS = 60_000;

export function isAllClubs(club?: string | null): boolean {
  if (!club) return true;
  const c = club.trim().toLowerCase();
  return c === 'wszystkie' || c === 'wszystkie kluby' || c === 'all' || c === '';
}

function currentIso(): string {
  return new Date().toISOString();
}

function eventTimestamp(row: TicketEventRow): string {
  return row.kickoff_at || `${row.match_date}T12:00:00Z`;
}

class EventsService {
  private events: SportEvent[] = [];
  private snapshots: Snapshot[] = [];
  private forecasts: Forecast[] = [];
  private outcomes: Outcome[] = [];
  private issues: DataIssue[] = [];
  private rawForecasts: ForecastObservationRow[] = [];
  private loadedAt = 0;
  private loadPromise: Promise<void> | null = null;

  private async ensureLoaded(force = false): Promise<void> {
    const fresh = Date.now() - this.loadedAt < DATA_TTL_MS;
    if (!force && this.loadedAt > 0 && fresh) return;

    if (!this.loadPromise) {
      this.loadPromise = this.loadData().finally(() => {
        this.loadPromise = null;
      });
    }

    await this.loadPromise;
  }

  async refresh(): Promise<void> {
    this.loadedAt = 0;
    await this.ensureLoaded(true);
  }

  private capacityForEvent(
    row: TicketEventRow,
    forecastRows: ForecastObservationRow[],
    outcome?: OutcomeRow,
    snapshotRows: SnapshotRow[] = []
  ): number {
    if (row.club_slug && CLUB_CAPACITY_BY_SLUG[row.club_slug]) {
      return CLUB_CAPACITY_BY_SLUG[row.club_slug];
    }

    const candidates = [
      ...forecastRows.flatMap((f) => [f.final_p90, f.final_p50, f.historical_p90]),
      outcome?.actual_attendance,
      ...snapshotRows.map((s) => s.available_total)
    ].filter((v): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0);

    return candidates.length > 0 ? Math.max(...candidates) : 1;
  }

  private async loadData(): Promise<void> {
    const [eventRows, snapshotRows, outcomeRows, forecastRows] = await Promise.all([
      fetchRows<TicketEventRow>('ticket_events', {
        select:
          'id,provider,external_event_id,home_team,away_team,competition,match_date,kickoff_at,mapping_confidence,club_slug,source_domain',
        order: 'match_date.asc,id.asc'
      }),
      fetchRows<SnapshotRow>('snapshots', {
        select:
          'id,ticket_event_id,captured_at,event_match_date_at_capture,event_kickoff_at_capture,available_total,sector_count',
        order: 'captured_at.asc,id.asc'
      }),
      fetchRows<OutcomeRow>('ticket_event_outcomes', {
        select:
          'ticket_event_id,actual_attendance,attendance_definition,source_name,confirmed_at',
        order: 'ticket_event_id.asc'
      }),
      fetchRows<ForecastObservationRow>('forecast_observations', {
        select:
          'id,ticket_event_id,source_snapshot_id,forecast_generated_at,source_snapshot_captured_at,hours_to_kickoff,days_to_match,horizon,model_version,historical_p10,historical_p50,historical_p90,live_adjustment,final_p10,final_p50,final_p90,forecast_status,correction_status,signal_readiness,live_available_total,live_first_available_total,live_available_index,live_net_removed_since_first,live_net_removed_since_previous,live_velocity_since_previous,live_net_removed_6h,live_velocity_6h,live_net_removed_24h,live_velocity_24h,live_acceleration_6h_vs_24h,live_raw_snapshot_count,live_clean_snapshot_count,live_excluded_anomaly_count',
        order: 'forecast_generated_at.asc,id.asc'
      })
    ]);

    this.rawForecasts = forecastRows;

    const outcomeByEvent = new Map<number, OutcomeRow>();
    for (const row of outcomeRows) outcomeByEvent.set(row.ticket_event_id, row);

    const snapshotsByEvent = new Map<number, SnapshotRow[]>();
    for (const row of snapshotRows) {
      const list = snapshotsByEvent.get(row.ticket_event_id) || [];
      list.push(row);
      snapshotsByEvent.set(row.ticket_event_id, list);
    }

    const forecastsByEvent = new Map<number, ForecastObservationRow[]>();
    for (const row of forecastRows) {
      const list = forecastsByEvent.get(row.ticket_event_id) || [];
      list.push(row);
      forecastsByEvent.set(row.ticket_event_id, list);
    }

    const capacityByEvent = new Map<number, number>();
    for (const row of eventRows) {
      capacityByEvent.set(
        row.id,
        this.capacityForEvent(
          row,
          forecastsByEvent.get(row.id) || [],
          outcomeByEvent.get(row.id),
          snapshotsByEvent.get(row.id) || []
        )
      );
    }

    const now = Date.now();

    this.events = eventRows.map((row) => {
      const date = eventTimestamp(row);
      const status = new Date(date).getTime() < now ? 'completed' : 'active';

      return {
        id: String(row.id),
        name: `${row.home_team} – ${row.away_team}`,
        homeTeam: row.home_team,
        awayTeam: row.away_team,
        club: row.home_team,
        clubSlug: row.club_slug || undefined,
        competition: row.competition || 'Nieokreślone rozgrywki',
        eventDate: date,
        capacity: capacityByEvent.get(row.id) || 1,
        status,
        provider: row.provider,
        externalEventId: row.external_event_id
      } as SportEvent;
    });

    this.snapshots = snapshotRows
      .filter((row) => row.available_total !== null)
      .map((row) => {
        const capacity = capacityByEvent.get(row.ticket_event_id) || 1;
        const available = Math.max(0, row.available_total || 0);
        const occupiedProxy = Math.max(0, capacity - available);

        return {
          id: String(row.id),
          eventId: String(row.ticket_event_id),
          timestamp: row.captured_at,
          sold: occupiedProxy,
          available,
          sectorCount: row.sector_count ?? undefined,
          interpretation: 'demand_proxy_not_confirmed_sales'
        } satisfies Snapshot;
      });

    this.forecasts = forecastRows
      .filter((row) => row.final_p50 !== null)
      .map((row) => ({
        id: String(row.id),
        eventId: String(row.ticket_event_id),
        timestamp: row.forecast_generated_at,
        predictedFinalSales: row.final_p50 as number,
        predictedLow: row.final_p10 ?? undefined,
        predictedHigh: row.final_p90 ?? undefined,
        sourceSnapshotId: row.source_snapshot_id !== null ? String(row.source_snapshot_id) : '',
        modelVersion: row.model_version ?? undefined,
        rawStatus: row.forecast_status ?? undefined,
        signalReadiness: row.signal_readiness ?? undefined,
        liveAdjustment: row.live_adjustment ?? undefined
      }));

    this.outcomes = outcomeRows
      .filter((row) => row.actual_attendance !== null)
      .map((row) => ({
        eventId: String(row.ticket_event_id),
        actualFinalSales: row.actual_attendance as number,
        recordedAt: row.confirmed_at || '',
        sourceName: row.source_name ?? undefined,
        attendanceDefinition: row.attendance_definition ?? undefined
      }));

    this.issues = this.buildDerivedIssues();
    this.loadedAt = Date.now();
  }

  private buildDerivedIssues(): DataIssue[] {
    const result: DataIssue[] = [];
    const now = Date.now();

    for (const event of this.events) {
      if (event.status !== 'active') continue;

      const eventSnapshots = this.snapshots
        .filter((s) => s.eventId === event.id)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      const eventForecasts = this.forecasts
        .filter((f) => f.eventId === event.id)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      const latestSnapshot = eventSnapshots[eventSnapshots.length - 1];
      const latestForecast = eventForecasts[eventForecasts.length - 1];

      if (!latestSnapshot) {
        result.push({
          id: `missing-snapshot-${event.id}`,
          eventId: event.id,
          type: 'stale_snapshot',
          description: 'Brak publicznego snapshotu inventory dla tego meczu.',
          detectedAt: currentIso(),
          severity: 'critical'
        });
        continue;
      }

      const snapshotAgeHours = (now - new Date(latestSnapshot.timestamp).getTime()) / 3_600_000;
      if (snapshotAgeHours > 18) {
        result.push({
          id: `stale-snapshot-${event.id}`,
          eventId: event.id,
          type: 'stale_snapshot',
          description: `Ostatni snapshot inventory ma ${Math.floor(snapshotAgeHours)} h.`,
          detectedAt: currentIso(),
          severity: 'warning'
        });
      }

      if (!latestForecast) {
        result.push({
          id: `missing-forecast-${event.id}`,
          eventId: event.id,
          type: 'missing_forecast',
          description: 'Model nie opublikował jeszcze prognozy P50 dla tego meczu.',
          detectedAt: currentIso(),
          severity: 'warning'
        });
      } else if (
        new Date(latestSnapshot.timestamp).getTime() >
        new Date(latestForecast.timestamp).getTime() + 30 * 60 * 1000
      ) {
        result.push({
          id: `forecast-older-${event.id}`,
          eventId: event.id,
          type: 'forecast_older_than_data',
          description: 'Dostępny jest nowszy snapshot inventory niż ostatnia prognoza modelu.',
          detectedAt: currentIso(),
          severity: 'info'
        });
      }
    }

    return result;
  }

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

    const remainingDays = daysToEvent(currentIso(), event.eventDate);
    const currentSold = latestSnapshot ? latestSnapshot.sold : 0;
    const currentForecast = latestForecast?.predictedFinalSales;

    const delta = latestForecast
      ? forecastDelta(latestForecast.predictedFinalSales, previousForecast?.predictedFinalSales)
      : null;

    let dataStatus: DataStatus = 'Aktualne';
    if (!latestSnapshot) {
      dataStatus = 'Brak danych';
    } else if (eventIssues.some((i) => i.severity === 'critical')) {
      dataStatus = 'Problem';
    } else if (event.status === 'active' && eventIssues.some((i) => i.type === 'stale_snapshot')) {
      dataStatus = 'Nieaktualne';
    }

    let forecastStatus: ForecastStatus = 'Aktualna';
    if (!latestForecast) {
      forecastStatus = 'Brak prognozy';
    } else if (eventIssues.some((i) => i.type === 'forecast_older_than_data')) {
      forecastStatus = 'Do przeliczenia';
    }

    const currentUtilization = event.capacity > 0 ? (currentSold / event.capacity) * 100 : 0;
    const utilizationRate =
      currentForecast !== undefined && event.capacity > 0
        ? (currentForecast / event.capacity) * 100
        : undefined;

    const remainingCapacity = latestSnapshot?.available ?? Math.max(0, event.capacity - currentSold);
    const forecastRemainingUnsold = Math.max(
      0,
      event.capacity - (currentForecast ?? currentSold)
    );

    let commercialStatus: ClubCommercialStatus = 'Zgodnie z oczekiwaniami';
    if (eventIssues.some((i) => i.severity === 'critical')) {
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
      }
    }

    let trend: SalesTrend = 'Stabilny';
    if (delta !== null && delta !== undefined) {
      if (delta >= 600) trend = 'Przyspiesza';
      else if (delta < 0) trend = 'Zwalnia';
    }

    let finalAbsErr: number | undefined;
    let finalPctErr: number | undefined;
    if (outcome && latestForecast) {
      finalAbsErr = absoluteError(latestForecast.predictedFinalSales, outcome.actualFinalSales);
      const pct = percentageError(latestForecast.predictedFinalSales, outcome.actualFinalSales);
      finalPctErr = pct ?? undefined;
    }

    const updateCandidates = [latestSnapshot?.timestamp, latestForecast?.timestamp].filter(
      (v): v is string => Boolean(v)
    );
    const lastUpdated =
      updateCandidates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ||
      event.eventDate;

    return {
      ...event,
      latestSnapshot,
      latestForecast,
      previousForecast,
      outcome,
      dataStatus,
      forecastStatus,
      currentSold,
      inventoryAvailable: latestSnapshot?.available,
      inventoryInterpretation: 'demand_proxy_not_confirmed_sales',
      currentForecast,
      forecastLow: latestForecast?.predictedLow,
      forecastHigh: latestForecast?.predictedHigh,
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

  async getEvents(options: EventFilterOptions = {}): Promise<EnrichedEvent[]> {
    await this.ensureLoaded();
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
      }
      return sortAsc ? comparison : -comparison;
    });

    return result;
  }

  async getEventById(id: string): Promise<EventDetailData | null> {
    await this.ensureLoaded();
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
    const sourceSnapshot = lastForecast?.sourceSnapshotId
      ? snapshots.find((s) => s.id === lastForecast.sourceSnapshotId)
      : undefined;

    let pipelineStatus: 'ok' | 'degraded' | 'error' = 'ok';
    if (issues.some((i) => i.severity === 'critical')) pipelineStatus = 'error';
    else if (issues.length > 0 || event.dataStatus !== 'Aktualne') pipelineStatus = 'degraded';

    const pipelineLatencyMinutes =
      lastForecast && sourceSnapshot
        ? Math.max(
            0,
            Math.round(
              (new Date(lastForecast.timestamp).getTime() - new Date(sourceSnapshot.timestamp).getTime()) /
                60_000
            )
          )
        : 0;

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
        activeModel: lastForecast?.modelVersion || 'Brak aktywnej prognozy',
        pipelineLatencyMinutes,
        lastRefreshStatus: pipelineStatus
      }
    };
  }

  async getForecastHistory(eventId: string): Promise<ForecastHistoryItem[]> {
    await this.ensureLoaded();
    const raw = this.events.find((e) => e.id === eventId);
    if (!raw) return [];

    const forecasts = this.forecasts
      .filter((f) => f.eventId === eventId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const snapshots = this.snapshots
      .filter((s) => s.eventId === eventId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const outcome = this.outcomes.find((o) => o.eventId === eventId);

    const historyItems: ForecastHistoryItem[] = [];

    for (let i = 0; i < forecasts.length; i++) {
      const fc = forecasts[i];
      const prevFc = i > 0 ? forecasts[i - 1] : undefined;

      const matchedSnapshot =
        snapshots.find((s) => s.id === fc.sourceSnapshotId) ||
        [...snapshots]
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

  async getClubOverviewKPIs(clubFilter?: string): Promise<ClubOverviewKPIs> {
    await this.ensureLoaded();
    let all = this.events.map((e) => this.enrichEvent(e));
    if (!isAllClubs(clubFilter)) {
      all = all.filter((e) => e.club === clubFilter);
    }

    const active = all
      .filter((e) => e.status === 'active')
      .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());

    const avgCurrentUtil =
      active.length > 0
        ? active.reduce((sum, e) => sum + e.currentUtilization, 0) / active.length
        : 0;

    const withFc = active.filter((e) => e.utilizationRate !== undefined);
    const avgPredUtil =
      withFc.length > 0
        ? withFc.reduce((sum, e) => sum + (e.utilizationRate ?? 0), 0) / withFc.length
        : 0;

    const needingAttention = active.filter(
      (e) => e.commercialStatus === 'Wymaga uwagi' || e.commercialStatus === 'Poniżej oczekiwań'
    );

    const completed = all.filter((e) => e.status === 'completed');
    const completedPairs: Array<{ prediction: number; actual: number }> = [];
    for (const comp of completed) {
      if (comp.currentForecast !== undefined && comp.outcome) {
        completedPairs.push({
          prediction: comp.currentForecast,
          actual: comp.outcome.actualFinalSales
        });
      }
    }

    const mape = calculateMAPE(completedPairs);
    const modelAccuracyScore =
      completedPairs.length > 0 ? Number(Math.max(0, 100 - mape).toFixed(1)) : 0;

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

  async getModelPerformance(filter?: { club?: string; dateRange?: string }): Promise<ModelPerformanceData> {
    await this.ensureLoaded();
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
        evaluatedPairs.push({
          prediction: fc.predictedFinalSales,
          actual: outcome.actualFinalSales,
          daysToEvent: daysToEvent(fc.timestamp, ev.eventDate)
        });
      }
    }

    const overallPairs = evaluatedPairs.map((p) => ({ prediction: p.prediction, actual: p.actual }));
    const mae = calculateMAE(overallPairs);
    const medianError = calculateMedianError(overallPairs);
    const mape = calculateMAPE(overallPairs);
    const bias = calculateBias(overallPairs);

    const within5 = evaluatedPairs.filter((p) => {
      const pErr = percentageError(p.prediction, p.actual);
      return pErr !== null && pErr <= 5.0;
    }).length;

    const within10 = evaluatedPairs.filter((p) => {
      const pErr = percentageError(p.prediction, p.actual);
      return pErr !== null && pErr <= 10.0;
    }).length;

    const accuracyWithin5Pct =
      evaluatedPairs.length > 0 ? Number(((within5 / evaluatedPairs.length) * 100).toFixed(1)) : 0;
    const accuracyWithin10Pct =
      evaluatedPairs.length > 0 ? Number(((within10 / evaluatedPairs.length) * 100).toFixed(1)) : 0;

    const bucketNames: Array<'30+ dni' | '15–29 dni' | '8–14 dni' | '4–7 dni' | '1–3 dni' | 'dzień eventu'> = [
      '30+ dni',
      '15–29 dni',
      '8–14 dni',
      '4–7 dni',
      '1–3 dni',
      'dzień eventu'
    ];

    const horizonMetrics: HorizonMetric[] = bucketNames.map((bucket) => {
      const pairsInBucket = evaluatedPairs.filter((p) => getHorizonBucket(p.daysToEvent) === bucket);
      const purePairs = pairsInBucket.map((p) => ({ prediction: p.prediction, actual: p.actual }));

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
      { daysBefore: 30, label: '30+ dni', mape: horizonMetrics[0]?.mape || 0, mae: horizonMetrics[0]?.mae || 0 },
      { daysBefore: 20, label: '15–29 dni', mape: horizonMetrics[1]?.mape || 0, mae: horizonMetrics[1]?.mae || 0 },
      { daysBefore: 10, label: '8–14 dni', mape: horizonMetrics[2]?.mape || 0, mae: horizonMetrics[2]?.mae || 0 },
      { daysBefore: 5, label: '4–7 dni', mape: horizonMetrics[3]?.mape || 0, mae: horizonMetrics[3]?.mae || 0 },
      { daysBefore: 2, label: '1–3 dni', mape: horizonMetrics[4]?.mape || 0, mae: horizonMetrics[4]?.mae || 0 },
      { daysBefore: 0, label: 'Dzień meczu', mape: horizonMetrics[5]?.mape || 0, mae: horizonMetrics[5]?.mae || 0 }
    ];

    return {
      businessKpis: {
        mae,
        medianError,
        mape,
        bias,
        accuracyWithin5Pct,
        accuracyWithin10Pct,
        evaluatedMatchesCount: filteredEvents.filter((ev) =>
          this.outcomes.some((o) => o.eventId === ev.id) && this.forecasts.some((f) => f.eventId === ev.id)
        ).length,
        totalEvaluatedForecasts: evaluatedPairs.length
      },
      horizonMetrics,
      trendByTime
    };
  }

  async getDataIssues(filter?: { severity?: string }): Promise<DataIssueEnriched[]> {
    await this.ensureLoaded();
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

  async getClubsList(): Promise<string[]> {
    await this.ensureLoaded();
    const clubsSet = new Set(this.events.map((e) => e.club));
    return Array.from(clubsSet).sort((a, b) => a.localeCompare(b, 'pl'));
  }
}

export const eventsService = new EventsService();
