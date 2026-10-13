import { fetchRows } from './supabaseRest';

export interface TicketingChallengerSummary {
  protocol: string;
  eventCount: number;
  clubCount: number;
  baselineMae: number;
  biasControlMae: number;
  challengerMae: number;
  upliftVsBaseline: number;
  incrementalTicketingUplift: number;
  challengerBias: number;
  candidateModel: string;
  protocolStatus: string;
  refreshedAt: string;
}

export interface TicketingChallengerModel {
  modelVersion: string;
  trainedAt: string;
  horizon: string;
  featureKey: string;
  ridgeAlpha: number;
  trainingEventCount: number;
  trainingClubCount: number;
  status: string;
  calibrationPct: number;
  featureBeta: number;
}

interface SummaryRow {
  protocol: string;
  event_count: number;
  club_count: number;
  baseline_mae: number;
  bias_control_mae: number;
  challenger_mae: number;
  uplift_vs_baseline: number;
  incremental_ticketing_uplift: number;
  challenger_bias: number;
  candidate_model: string;
  protocol_status: string;
  refreshed_at: string;
}

interface ModelRow {
  model_version: string;
  trained_at: string;
  horizon: string;
  feature_key: string;
  ridge_alpha: number;
  training_event_count: number;
  training_club_count: number;
  status: string;
  calibration_pct: number;
  feature_beta: number;
}

class TicketingChallengerService {
  async getSummary(): Promise<TicketingChallengerSummary[]> {
    const rows = await fetchRows<SummaryRow>('dashboard_ticketing_challenger_v1', {
      select: 'protocol,event_count,club_count,baseline_mae,bias_control_mae,challenger_mae,uplift_vs_baseline,incremental_ticketing_uplift,challenger_bias,candidate_model,protocol_status,refreshed_at'
    });
    return rows.map((row) => ({
      protocol: row.protocol,
      eventCount: Number(row.event_count),
      clubCount: Number(row.club_count),
      baselineMae: Number(row.baseline_mae),
      biasControlMae: Number(row.bias_control_mae),
      challengerMae: Number(row.challenger_mae),
      upliftVsBaseline: Number(row.uplift_vs_baseline),
      incrementalTicketingUplift: Number(row.incremental_ticketing_uplift),
      challengerBias: Number(row.challenger_bias),
      candidateModel: row.candidate_model,
      protocolStatus: row.protocol_status,
      refreshedAt: row.refreshed_at
    }));
  }

  async getModel(): Promise<TicketingChallengerModel | null> {
    const rows = await fetchRows<ModelRow>('dashboard_ticketing_challenger_model_v1', {
      select: 'model_version,trained_at,horizon,feature_key,ridge_alpha,training_event_count,training_club_count,status,calibration_pct,feature_beta'
    });
    const row = rows[0];
    if (!row) return null;
    return {
      modelVersion: row.model_version,
      trainedAt: row.trained_at,
      horizon: row.horizon,
      featureKey: row.feature_key,
      ridgeAlpha: Number(row.ridge_alpha),
      trainingEventCount: Number(row.training_event_count),
      trainingClubCount: Number(row.training_club_count),
      status: row.status,
      calibrationPct: Number(row.calibration_pct),
      featureBeta: Number(row.feature_beta)
    };
  }
}

export const ticketingChallengerService = new TicketingChallengerService();
