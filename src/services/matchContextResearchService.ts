import { fetchRows } from './supabaseRest';

export type OpponentUpliftReadiness =
  | 'insufficient_club_history'
  | 'insufficient_opponent_history'
  | 'ready';

export interface OpponentUpliftItem {
  ticketEventId: number;
  homeTeam: string;
  awayTeam: string;
  kickoffAt: string;
  competitionKey: string;
  clubHistoryCount: number;
  opponentHistoryCount: number;
  clubMedianAttendance?: number;
  opponentMedianAttendance?: number;
  upliftPct?: number;
  readinessStatus: OpponentUpliftReadiness;
  observedAt: string;
}

interface OpponentUpliftRow {
  ticket_event_id: number;
  home_team: string;
  away_team: string;
  kickoff_at: string;
  competition_key: string;
  club_history_count: number;
  opponent_history_count: number;
  club_median_attendance: number | null;
  opponent_median_attendance: number | null;
  uplift_pct: number | null;
  readiness_status: OpponentUpliftReadiness;
  observed_at: string;
}

class MatchContextResearchService {
  async getOpponentUpliftReadiness(): Promise<OpponentUpliftItem[]> {
    const rows = await fetchRows<OpponentUpliftRow>('dashboard_opponent_uplift_readiness_v1', {
      select:
        'ticket_event_id,home_team,away_team,kickoff_at,competition_key,club_history_count,opponent_history_count,club_median_attendance,opponent_median_attendance,uplift_pct,readiness_status,observed_at',
      order: 'kickoff_at.asc'
    });

    return rows.map((row) => ({
      ticketEventId: row.ticket_event_id,
      homeTeam: row.home_team,
      awayTeam: row.away_team,
      kickoffAt: row.kickoff_at,
      competitionKey: row.competition_key,
      clubHistoryCount: Number(row.club_history_count ?? 0),
      opponentHistoryCount: Number(row.opponent_history_count ?? 0),
      clubMedianAttendance:
        row.club_median_attendance === null ? undefined : Number(row.club_median_attendance),
      opponentMedianAttendance:
        row.opponent_median_attendance === null ? undefined : Number(row.opponent_median_attendance),
      upliftPct: row.uplift_pct === null ? undefined : Number(row.uplift_pct),
      readinessStatus: row.readiness_status,
      observedAt: row.observed_at
    }));
  }
}

export const matchContextResearchService = new MatchContextResearchService();
