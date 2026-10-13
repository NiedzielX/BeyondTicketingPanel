import { fetchRows } from './supabaseRest';

export type CrossClubBaselineStatus = 'ready' | 'insufficient_history' | 'unsupported_competition';
export type CrossClubBaselineSource =
  | 'incumbent_engine_baseline'
  | 'crossclub_fallback'
  | 'no_baseline_prediction';
export type CrossClubEvidenceMode =
  | 'retrospective_historical_fact_reconstruction'
  | 'prospective_system_point_in_time';

export interface CrossClubBaselineRow {
  snapshotId: number;
  ticketEventId: number;
  homeTeam: string;
  awayTeam: string;
  kickoffAt: string;
  checkpointCode: string;
  checkpointAt: string;
  clubSlug: string;
  historyCount: number;
  historyFirstAt?: string;
  historyLastAt?: string;
  baselineP50?: number;
  baselineStatus: CrossClubBaselineStatus;
  baselineModel: string;
  evaluationMode: 'prospective' | 'retrospective_point_in_time';
  selectedBaselineSource: CrossClubBaselineSource;
  selectedBaselineP50?: number;
  hasOutcome: boolean;
  evidenceMode: CrossClubEvidenceMode;
}

export interface CrossClubBaselineComparison {
  checkpointCode: string;
  eventCount: number;
  incumbentMae: number;
  challengerMae: number;
  challengerMaeUplift: number;
  incumbentBias: number;
  challengerBias: number;
  decisionStatus: string;
}

interface CrossClubBaselineApiRow {
  snapshot_id: number;
  ticket_event_id: number;
  home_team: string;
  away_team: string;
  kickoff_at: string;
  checkpoint_code: string;
  checkpoint_at: string;
  club_slug: string;
  history_count: number;
  history_first_at: string | null;
  history_last_at: string | null;
  baseline_p50: number | null;
  baseline_status: CrossClubBaselineStatus;
  baseline_model: string;
  evaluation_mode: 'prospective' | 'retrospective_point_in_time';
  selected_baseline_source: CrossClubBaselineSource;
  selected_baseline_p50: number | null;
  has_outcome: boolean;
  evidence_mode: CrossClubEvidenceMode;
}

interface ComparisonApiRow {
  checkpoint_code: string;
  event_count: number;
  incumbent_mae: number;
  challenger_mae: number;
  challenger_mae_uplift: number;
  incumbent_bias: number;
  challenger_bias: number;
  decision_status: string;
}

class CrossClubBaselineService {
  async getRows(): Promise<CrossClubBaselineRow[]> {
    const rows = await fetchRows<CrossClubBaselineApiRow>('dashboard_crossclub_baseline_v3', {
      select:
        'snapshot_id,ticket_event_id,home_team,away_team,kickoff_at,checkpoint_code,checkpoint_at,club_slug,history_count,history_first_at,history_last_at,baseline_p50,baseline_status,baseline_model,evaluation_mode,selected_baseline_source,selected_baseline_p50,has_outcome,evidence_mode'
    });

    return rows.map((row) => ({
      snapshotId: Number(row.snapshot_id),
      ticketEventId: Number(row.ticket_event_id),
      homeTeam: row.home_team,
      awayTeam: row.away_team,
      kickoffAt: row.kickoff_at,
      checkpointCode: row.checkpoint_code,
      checkpointAt: row.checkpoint_at,
      clubSlug: row.club_slug,
      historyCount: Number(row.history_count),
      historyFirstAt: row.history_first_at ?? undefined,
      historyLastAt: row.history_last_at ?? undefined,
      baselineP50: row.baseline_p50 === null ? undefined : Number(row.baseline_p50),
      baselineStatus: row.baseline_status,
      baselineModel: row.baseline_model,
      evaluationMode: row.evaluation_mode,
      selectedBaselineSource: row.selected_baseline_source,
      selectedBaselineP50:
        row.selected_baseline_p50 === null ? undefined : Number(row.selected_baseline_p50),
      hasOutcome: Boolean(row.has_outcome),
      evidenceMode: row.evidence_mode
    }));
  }

  async getSameEventComparison(): Promise<CrossClubBaselineComparison[]> {
    const rows = await fetchRows<ComparisonApiRow>('dashboard_crossclub_baseline_comparison_v3', {
      select:
        'checkpoint_code,event_count,incumbent_mae,challenger_mae,challenger_mae_uplift,incumbent_bias,challenger_bias,decision_status'
    });

    return rows.map((row) => ({
      checkpointCode: row.checkpoint_code,
      eventCount: Number(row.event_count),
      incumbentMae: Number(row.incumbent_mae),
      challengerMae: Number(row.challenger_mae),
      challengerMaeUplift: Number(row.challenger_mae_uplift),
      incumbentBias: Number(row.incumbent_bias),
      challengerBias: Number(row.challenger_bias),
      decisionStatus: row.decision_status
    }));
  }
}

export const crossClubBaselineService = new CrossClubBaselineService();
