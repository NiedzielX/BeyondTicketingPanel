import { fetchRows } from './supabaseRest';

export interface HypeChallengerSummary {
  collectorVersion: string;
  collectorLatestSampleAt?: string;
  collectorSampleRows: number;
  collectorEventCount: number;
  collectorNonzeroEventCount: number;
  prospectiveT24Count: number;
  prospectiveT24ClubCount: number;
  completedMediaEligibleCount: number;
  completedMediaClubCount: number;
  promotionGateEventTarget: number;
  promotionGateClubTarget: number;
  overallStatus: string;
  historicalBackfillAllowed: boolean;
  refreshedAt: string;
}

export interface HypeReadinessRow {
  featureKey: string;
  readinessStatus: string;
  reason: string;
  prospectiveT24Count: number;
  completedEligibleCount: number;
  completedClubCount: number;
  distinctValueCount: number;
  refreshedAt: string;
}

export interface HypeCvRow {
  featureKey: string;
  protocol: string;
  eventCount: number;
  clubCount: number;
  baselineTicketingMae: number;
  biasControlMae: number;
  challengerMae: number;
  upliftVsTicketing: number;
  incrementalHypeUplift: number;
  candidateStatus: string;
}

interface SummaryApiRow {
  collector_version: string;
  collector_latest_sample_at: string | null;
  collector_sample_rows: number;
  collector_event_count: number;
  collector_nonzero_event_count: number;
  prospective_t24_count: number;
  prospective_t24_club_count: number;
  completed_media_eligible_count: number;
  completed_media_club_count: number;
  promotion_gate_event_target: number;
  promotion_gate_club_target: number;
  overall_status: string;
  historical_backfill_allowed: boolean;
  refreshed_at: string;
}

interface ReadinessApiRow {
  feature_key: string;
  readiness_status: string;
  reason: string;
  prospective_t24_count: number;
  completed_eligible_count: number;
  completed_club_count: number;
  distinct_value_count: number;
  refreshed_at: string;
}

interface CvApiRow {
  feature_key: string;
  protocol: string;
  event_count: number;
  club_count: number;
  baseline_ticketing_mae: number;
  bias_control_mae: number;
  challenger_mae: number;
  uplift_vs_ticketing: number;
  incremental_hype_uplift: number;
  candidate_status: string;
}

class HypeChallengerService {
  async getSummary(): Promise<HypeChallengerSummary | null> {
    const rows = await fetchRows<SummaryApiRow>('dashboard_hype_challenger_summary_v1', {
      select: 'collector_version,collector_latest_sample_at,collector_sample_rows,collector_event_count,collector_nonzero_event_count,prospective_t24_count,prospective_t24_club_count,completed_media_eligible_count,completed_media_club_count,promotion_gate_event_target,promotion_gate_club_target,overall_status,historical_backfill_allowed,refreshed_at'
    });
    const row = rows[0];
    if (!row) return null;
    return {
      collectorVersion: row.collector_version,
      collectorLatestSampleAt: row.collector_latest_sample_at ?? undefined,
      collectorSampleRows: Number(row.collector_sample_rows),
      collectorEventCount: Number(row.collector_event_count),
      collectorNonzeroEventCount: Number(row.collector_nonzero_event_count),
      prospectiveT24Count: Number(row.prospective_t24_count),
      prospectiveT24ClubCount: Number(row.prospective_t24_club_count),
      completedMediaEligibleCount: Number(row.completed_media_eligible_count),
      completedMediaClubCount: Number(row.completed_media_club_count),
      promotionGateEventTarget: Number(row.promotion_gate_event_target),
      promotionGateClubTarget: Number(row.promotion_gate_club_target),
      overallStatus: row.overall_status,
      historicalBackfillAllowed: Boolean(row.historical_backfill_allowed),
      refreshedAt: row.refreshed_at
    };
  }

  async getReadiness(): Promise<HypeReadinessRow[]> {
    const rows = await fetchRows<ReadinessApiRow>('dashboard_hype_challenger_readiness_v1', {
      select: 'feature_key,readiness_status,reason,prospective_t24_count,completed_eligible_count,completed_club_count,distinct_value_count,refreshed_at'
    });
    return rows.map((row) => ({
      featureKey: row.feature_key,
      readinessStatus: row.readiness_status,
      reason: row.reason,
      prospectiveT24Count: Number(row.prospective_t24_count),
      completedEligibleCount: Number(row.completed_eligible_count),
      completedClubCount: Number(row.completed_club_count),
      distinctValueCount: Number(row.distinct_value_count),
      refreshedAt: row.refreshed_at
    }));
  }

  async getCv(): Promise<HypeCvRow[]> {
    const rows = await fetchRows<CvApiRow>('dashboard_hype_challenger_cv_v1', {
      select: 'feature_key,protocol,event_count,club_count,baseline_ticketing_mae,bias_control_mae,challenger_mae,uplift_vs_ticketing,incremental_hype_uplift,candidate_status'
    });
    return rows.map((row) => ({
      featureKey: row.feature_key,
      protocol: row.protocol,
      eventCount: Number(row.event_count),
      clubCount: Number(row.club_count),
      baselineTicketingMae: Number(row.baseline_ticketing_mae),
      biasControlMae: Number(row.bias_control_mae),
      challengerMae: Number(row.challenger_mae),
      upliftVsTicketing: Number(row.uplift_vs_ticketing),
      incrementalHypeUplift: Number(row.incremental_hype_uplift),
      candidateStatus: row.candidate_status
    }));
  }
}

export const hypeChallengerService = new HypeChallengerService();
