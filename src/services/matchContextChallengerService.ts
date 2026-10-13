import { fetchRows } from './supabaseRest';

export interface MatchContextCandidateRow {
  featureKey: string;
  protocol: string;
  eventCount: number;
  clubCount: number;
  baselineTicketingMae: number;
  biasControlMae: number;
  challengerMae: number;
  upliftVsTicketing: number;
  incrementalMatchContextUplift: number;
  candidateStatus: string;
  refreshedAt: string;
}

export interface MatchContextReadinessRow {
  featureKey: string;
  readinessStatus: string;
  reason: string;
  evidence: Record<string, unknown>;
  refreshedAt: string;
}

interface CandidateApiRow {
  feature_key: string;
  protocol: string;
  event_count: number;
  club_count: number;
  baseline_ticketing_mae: number;
  bias_control_mae: number;
  challenger_mae: number;
  uplift_vs_ticketing: number;
  incremental_match_context_uplift: number;
  candidate_status: string;
  refreshed_at: string;
}

interface ReadinessApiRow {
  feature_key: string;
  readiness_status: string;
  reason: string;
  evidence: Record<string, unknown>;
  refreshed_at: string;
}

class MatchContextChallengerService {
  async getCandidates(): Promise<MatchContextCandidateRow[]> {
    const rows = await fetchRows<CandidateApiRow>('dashboard_match_context_challenger_v1', {
      select:
        'feature_key,protocol,event_count,club_count,baseline_ticketing_mae,bias_control_mae,challenger_mae,uplift_vs_ticketing,incremental_match_context_uplift,candidate_status,refreshed_at'
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
      incrementalMatchContextUplift: Number(row.incremental_match_context_uplift),
      candidateStatus: row.candidate_status,
      refreshedAt: row.refreshed_at
    }));
  }

  async getReadiness(): Promise<MatchContextReadinessRow[]> {
    const rows = await fetchRows<ReadinessApiRow>('dashboard_match_context_readiness_v1', {
      select: 'feature_key,readiness_status,reason,evidence,refreshed_at'
    });

    return rows.map((row) => ({
      featureKey: row.feature_key,
      readinessStatus: row.readiness_status,
      reason: row.reason,
      evidence: row.evidence ?? {},
      refreshedAt: row.refreshed_at
    }));
  }
}

export const matchContextChallengerService = new MatchContextChallengerService();
