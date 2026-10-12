import { fetchRows } from './supabaseRest';

export type SportingShadowValidationStatus =
  | 'matched_reference'
  | 'different_from_reference'
  | 'no_reference';

export interface SportingShadowSummary {
  totalEvents: number;
  matchedReference: number;
  differentReference: number;
  noReference: number;
  meanAbsDelta?: number;
  latestObservedAt?: string;
}

export interface SportingShadowEvent {
  ticketEventId: number;
  homeTeam: string;
  awayTeam: string;
  kickoffAt: string;
  numericValue?: number;
  manualReferenceNumeric?: number;
  deltaNumeric?: number;
  validationStatus: SportingShadowValidationStatus;
  observedAt: string;
}

interface SummaryRow {
  total_events: number;
  matched_reference: number;
  different_reference: number;
  no_reference: number;
  mean_abs_delta: number | null;
  latest_observed_at: string | null;
}

interface EventRow {
  ticket_event_id: number;
  home_team: string;
  away_team: string;
  kickoff_at: string;
  numeric_value: number | null;
  manual_reference_numeric: number | null;
  delta_numeric: number | null;
  validation_status: SportingShadowValidationStatus;
  observed_at: string;
}

class SportingShadowService {
  async getSummary(): Promise<SportingShadowSummary | null> {
    const rows = await fetchRows<SummaryRow>('dashboard_sporting_shadow_summary_v1', {
      select:
        'total_events,matched_reference,different_reference,no_reference,mean_abs_delta,latest_observed_at'
    });
    const row = rows[0];
    if (!row) return null;
    return {
      totalEvents: Number(row.total_events ?? 0),
      matchedReference: Number(row.matched_reference ?? 0),
      differentReference: Number(row.different_reference ?? 0),
      noReference: Number(row.no_reference ?? 0),
      meanAbsDelta: row.mean_abs_delta === null ? undefined : Number(row.mean_abs_delta),
      latestObservedAt: row.latest_observed_at ?? undefined
    };
  }

  async getLatestEvents(): Promise<SportingShadowEvent[]> {
    const rows = await fetchRows<EventRow>('dashboard_sporting_shadow_v1', {
      select:
        'ticket_event_id,home_team,away_team,kickoff_at,numeric_value,manual_reference_numeric,delta_numeric,validation_status,observed_at'
    });
    return rows.map((row) => ({
      ticketEventId: row.ticket_event_id,
      homeTeam: row.home_team,
      awayTeam: row.away_team,
      kickoffAt: row.kickoff_at,
      numericValue: row.numeric_value === null ? undefined : Number(row.numeric_value),
      manualReferenceNumeric:
        row.manual_reference_numeric === null ? undefined : Number(row.manual_reference_numeric),
      deltaNumeric: row.delta_numeric === null ? undefined : Number(row.delta_numeric),
      validationStatus: row.validation_status,
      observedAt: row.observed_at
    }));
  }
}

export const sportingShadowService = new SportingShadowService();
