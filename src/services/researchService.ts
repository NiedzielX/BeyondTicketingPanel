import { fetchRows } from './supabaseRest';

export interface ResearchReadiness {
  independentOutcomeEvents: number;
  clubsWithOutcome: number;
  strictStudyRows: number;
  modelsWithStrictRows: number;
  crossClubGateMet: boolean;
  learnedCorrectionGateMet: boolean;
  status: string;
  crossClubEventTarget: number;
  crossClubClubTarget: number;
  learnedCorrectionEventTarget: number;
  generatedAt: string;
}

export interface EventLiveState {
  ticketEventId: number;
  snapshotCapturedAt?: string;
  availableTotal?: number;
  firstAvailableTotal?: number;
  availableIndex?: number;
  netRemovedSinceFirst?: number;
  netRemoved6h?: number;
  velocity6h?: number;
  netRemoved24h?: number;
  velocity24h?: number;
  acceleration6hVs24h?: number;
  matchedSectorCount?: number;
  enteredSectorCount?: number;
  leftSectorCount?: number;
  coverageInventoryEffect?: number;
  sectorCoverageChangeFlag?: boolean;
  releaseActivityFlag?: boolean;
  rawSnapshotCount?: number;
  publicSeatMapSize?: number;
  availablePctOfPublicSeatMap?: number;
  featureQuality?: string;
}

export interface EventWeatherState {
  ticketEventId: number;
  capturedAt: string;
  forecastForAt: string;
  hoursToKickoff?: number;
  temperatureC?: number;
  apparentTemperatureC?: number;
  precipitationProbabilityPct?: number;
  precipitationMm?: number;
  windSpeedKmh?: number;
  windGustsKmh?: number;
  cloudCoverPct?: number;
  weatherCode?: number;
  locationQuality?: string;
  provider?: string;
  sourceModel?: string;
}

interface ReadinessRow {
  independent_outcome_events: number;
  clubs_with_outcome: number;
  strict_study_rows: number;
  models_with_strict_rows: number;
  cross_club_gate_met: boolean;
  learned_correction_gate_met: boolean;
  status: string;
  cross_club_event_target: number;
  cross_club_club_target: number;
  learned_correction_event_target: number;
  generated_at: string;
}

interface LiveStateRow {
  ticket_event_id: number;
  snapshot_captured_at: string | null;
  available_total: number | null;
  first_available_total: number | null;
  available_index: number | null;
  net_removed_since_first: number | null;
  net_removed_6h: number | null;
  velocity_6h: number | null;
  net_removed_24h: number | null;
  velocity_24h: number | null;
  acceleration_6h_vs_24h: number | null;
  matched_sector_count: number | null;
  entered_sector_count: number | null;
  left_sector_count: number | null;
  coverage_inventory_effect: number | null;
  sector_coverage_change_flag: boolean | null;
  release_activity_flag: boolean | null;
  raw_snapshot_count: number | null;
  public_seat_map_size: number | null;
  available_pct_of_public_seat_map: number | null;
  feature_quality: string | null;
}

interface WeatherRow {
  ticket_event_id: number;
  captured_at: string;
  forecast_for_at: string;
  hours_to_kickoff: number | null;
  temperature_c: number | null;
  apparent_temperature_c: number | null;
  precipitation_probability_pct: number | null;
  precipitation_mm: number | null;
  wind_speed_kmh: number | null;
  wind_gusts_kmh: number | null;
  cloud_cover_pct: number | null;
  weather_code: number | null;
  location_quality: string | null;
  provider: string | null;
  source_model: string | null;
}

const num = (value: number | null | undefined): number | undefined =>
  value === null || value === undefined ? undefined : Number(value);

class ResearchService {
  async getReadiness(): Promise<ResearchReadiness | null> {
    const rows = await fetchRows<ReadinessRow>('dashboard_ml_readiness_v1', {
      select:
        'independent_outcome_events,clubs_with_outcome,strict_study_rows,models_with_strict_rows,cross_club_gate_met,learned_correction_gate_met,status,cross_club_event_target,cross_club_club_target,learned_correction_event_target,generated_at'
    });
    const row = rows[0];
    if (!row) return null;
    return {
      independentOutcomeEvents: Number(row.independent_outcome_events),
      clubsWithOutcome: Number(row.clubs_with_outcome),
      strictStudyRows: Number(row.strict_study_rows),
      modelsWithStrictRows: Number(row.models_with_strict_rows),
      crossClubGateMet: row.cross_club_gate_met,
      learnedCorrectionGateMet: row.learned_correction_gate_met,
      status: row.status,
      crossClubEventTarget: Number(row.cross_club_event_target),
      crossClubClubTarget: Number(row.cross_club_club_target),
      learnedCorrectionEventTarget: Number(row.learned_correction_event_target),
      generatedAt: row.generated_at
    };
  }

  async getEventLiveState(eventId: string): Promise<EventLiveState | null> {
    const rows = await fetchRows<LiveStateRow>('dashboard_event_live_state_v1', {
      select:
        'ticket_event_id,snapshot_captured_at,available_total,first_available_total,available_index,net_removed_since_first,net_removed_6h,velocity_6h,net_removed_24h,velocity_24h,acceleration_6h_vs_24h,matched_sector_count,entered_sector_count,left_sector_count,coverage_inventory_effect,sector_coverage_change_flag,release_activity_flag,raw_snapshot_count,public_seat_map_size,available_pct_of_public_seat_map,feature_quality'
    });
    const row = rows.find((item) => String(item.ticket_event_id) === eventId);
    if (!row) return null;
    return {
      ticketEventId: row.ticket_event_id,
      snapshotCapturedAt: row.snapshot_captured_at ?? undefined,
      availableTotal: num(row.available_total),
      firstAvailableTotal: num(row.first_available_total),
      availableIndex: num(row.available_index),
      netRemovedSinceFirst: num(row.net_removed_since_first),
      netRemoved6h: num(row.net_removed_6h),
      velocity6h: num(row.velocity_6h),
      netRemoved24h: num(row.net_removed_24h),
      velocity24h: num(row.velocity_24h),
      acceleration6hVs24h: num(row.acceleration_6h_vs_24h),
      matchedSectorCount: num(row.matched_sector_count),
      enteredSectorCount: num(row.entered_sector_count),
      leftSectorCount: num(row.left_sector_count),
      coverageInventoryEffect: num(row.coverage_inventory_effect),
      sectorCoverageChangeFlag: row.sector_coverage_change_flag ?? undefined,
      releaseActivityFlag: row.release_activity_flag ?? undefined,
      rawSnapshotCount: num(row.raw_snapshot_count),
      publicSeatMapSize: num(row.public_seat_map_size),
      availablePctOfPublicSeatMap: num(row.available_pct_of_public_seat_map),
      featureQuality: row.feature_quality ?? undefined
    };
  }

  async getEventWeather(eventId: string): Promise<EventWeatherState | null> {
    const rows = await fetchRows<WeatherRow>('dashboard_weather_latest_v1', {
      select:
        'ticket_event_id,captured_at,forecast_for_at,hours_to_kickoff,temperature_c,apparent_temperature_c,precipitation_probability_pct,precipitation_mm,wind_speed_kmh,wind_gusts_kmh,cloud_cover_pct,weather_code,location_quality,provider,source_model'
    });
    const row = rows.find((item) => String(item.ticket_event_id) === eventId);
    if (!row) return null;
    return {
      ticketEventId: row.ticket_event_id,
      capturedAt: row.captured_at,
      forecastForAt: row.forecast_for_at,
      hoursToKickoff: num(row.hours_to_kickoff),
      temperatureC: num(row.temperature_c),
      apparentTemperatureC: num(row.apparent_temperature_c),
      precipitationProbabilityPct: num(row.precipitation_probability_pct),
      precipitationMm: num(row.precipitation_mm),
      windSpeedKmh: num(row.wind_speed_kmh),
      windGustsKmh: num(row.wind_gusts_kmh),
      cloudCoverPct: num(row.cloud_cover_pct),
      weatherCode: num(row.weather_code),
      locationQuality: row.location_quality ?? undefined,
      provider: row.provider ?? undefined,
      sourceModel: row.source_model ?? undefined
    };
  }
}

export const researchService = new ResearchService();
