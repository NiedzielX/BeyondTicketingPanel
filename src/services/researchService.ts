import { fetchRows } from './supabaseRest';

export interface ResearchReadiness {
  crossClubStudyEvents: number;
  crossClubStudyClubs: number;
  strictStudyRows: number;
  crossClubGateMet: boolean;
  crossClubEventTarget: number;
  crossClubClubTarget: number;
  independentOutcomeEventsTotal: number;
  outcomeClubsTotal: number;
  learnedCorrectionGateMet: boolean;
  learnedCorrectionEventTarget: number;
  generatedAt: string;
}

export interface WeatherResearchStatus {
  historicalStudyVersion: string;
  historicalSampleSize: number;
  historicalSeasons: number;
  baselineMae: number;
  loocvWeatherMae: number;
  loocvUplift: number;
  losoWeatherMae: number;
  losoUplift: number;
  historicalSignalStatus: string;
  prospectiveWeatherEvents: number;
  prospectiveWeatherRows: number;
  prospectiveT24OutcomePairs: number;
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
  crossclub_study_events: number;
  crossclub_study_clubs: number;
  strict_study_rows: number;
  crossclub_gate_met: boolean;
  crossclub_event_target: number;
  crossclub_club_target: number;
  independent_outcome_events_total: number;
  outcome_clubs_total: number;
  learned_correction_gate_met: boolean;
  learned_correction_event_target: number;
  generated_at: string;
}

interface WeatherResearchRow {
  historical_study_version: string;
  historical_sample_size: number;
  historical_seasons: number;
  baseline_mae: number;
  loocv_weather_mae: number;
  loocv_uplift: number;
  loso_weather_mae: number;
  loso_uplift: number;
  historical_signal_status: string;
  prospective_weather_events: number;
  prospective_weather_rows: number;
  prospective_t24_outcome_pairs: number;
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
    const rows = await fetchRows<ReadinessRow>('dashboard_research_readiness_v2', {
      select:
        'crossclub_study_events,crossclub_study_clubs,strict_study_rows,crossclub_gate_met,crossclub_event_target,crossclub_club_target,independent_outcome_events_total,outcome_clubs_total,learned_correction_gate_met,learned_correction_event_target,generated_at'
    });
    const row = rows[0];
    if (!row) return null;
    return {
      crossClubStudyEvents: Number(row.crossclub_study_events),
      crossClubStudyClubs: Number(row.crossclub_study_clubs),
      strictStudyRows: Number(row.strict_study_rows),
      crossClubGateMet: row.crossclub_gate_met,
      crossClubEventTarget: Number(row.crossclub_event_target),
      crossClubClubTarget: Number(row.crossclub_club_target),
      independentOutcomeEventsTotal: Number(row.independent_outcome_events_total),
      outcomeClubsTotal: Number(row.outcome_clubs_total),
      learnedCorrectionGateMet: row.learned_correction_gate_met,
      learnedCorrectionEventTarget: Number(row.learned_correction_event_target),
      generatedAt: row.generated_at
    };
  }

  async getWeatherResearchStatus(): Promise<WeatherResearchStatus | null> {
    const rows = await fetchRows<WeatherResearchRow>('dashboard_weather_research_v1', {
      select:
        'historical_study_version,historical_sample_size,historical_seasons,baseline_mae,loocv_weather_mae,loocv_uplift,loso_weather_mae,loso_uplift,historical_signal_status,prospective_weather_events,prospective_weather_rows,prospective_t24_outcome_pairs,generated_at'
    });
    const row = rows[0];
    if (!row) return null;
    return {
      historicalStudyVersion: row.historical_study_version,
      historicalSampleSize: Number(row.historical_sample_size),
      historicalSeasons: Number(row.historical_seasons),
      baselineMae: Number(row.baseline_mae),
      loocvWeatherMae: Number(row.loocv_weather_mae),
      loocvUplift: Number(row.loocv_uplift),
      losoWeatherMae: Number(row.loso_weather_mae),
      losoUplift: Number(row.loso_uplift),
      historicalSignalStatus: row.historical_signal_status,
      prospectiveWeatherEvents: Number(row.prospective_weather_events),
      prospectiveWeatherRows: Number(row.prospective_weather_rows),
      prospectiveT24OutcomePairs: Number(row.prospective_t24_outcome_pairs),
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
