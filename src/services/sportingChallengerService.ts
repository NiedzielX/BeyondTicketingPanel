import { fetchRows } from './supabaseRest';

export interface SportingChallengerSummary {
  protocol: string;
  eventCount: number;
  clubCount: number;
  baselineTicketingMae: number;
  biasControlMae: number;
  challengerMae: number;
  upliftVsTicketing: number;
  incrementalSportingUplift: number;
  challengerBias: number;
  candidateModel: string;
  protocolStatus: string;
  refreshedAt: string;
}

interface SportingChallengerApiRow {
  protocol: string;
  event_count: number;
  club_count: number;
  baseline_ticketing_mae: number;
  bias_control_mae: number;
  challenger_mae: number;
  uplift_vs_ticketing: number;
  incremental_sporting_uplift: number;
  challenger_bias: number;
  candidate_model: string;
  protocol_status: string;
  refreshed_at: string;
}

class SportingChallengerService {
  async getSummary(): Promise<SportingChallengerSummary[]> {
    const rows = await fetchRows<SportingChallengerApiRow>('dashboard_sporting_challenger_v1', {
      select:
        'protocol,event_count,club_count,baseline_ticketing_mae,bias_control_mae,challenger_mae,uplift_vs_ticketing,incremental_sporting_uplift,challenger_bias,candidate_model,protocol_status,refreshed_at'
    });

    return rows.map((row) => ({
      protocol: row.protocol,
      eventCount: Number(row.event_count),
      clubCount: Number(row.club_count),
      baselineTicketingMae: Number(row.baseline_ticketing_mae),
      biasControlMae: Number(row.bias_control_mae),
      challengerMae: Number(row.challenger_mae),
      upliftVsTicketing: Number(row.uplift_vs_ticketing),
      incrementalSportingUplift: Number(row.incremental_sporting_uplift),
      challengerBias: Number(row.challenger_bias),
      candidateModel: row.candidate_model,
      protocolStatus: row.protocol_status,
      refreshedAt: row.refreshed_at
    }));
  }
}

export const sportingChallengerService = new SportingChallengerService();
