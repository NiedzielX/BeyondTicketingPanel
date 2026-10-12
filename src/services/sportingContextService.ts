import { fetchRows } from './supabaseRest';

export type SportingContextFeature =
  | 'sport.form5'
  | 'sport.match_stakes'
  | 'sport.absence_impact'
  | 'sport.rivalry_opponent';

export interface SportingContextItem {
  ticketEventId: number;
  featureKey: SportingContextFeature;
  observedAt: string;
  numericValue?: number;
  textValue?: string;
  confidence?: number;
}

interface SportingContextRow {
  ticket_event_id: number;
  feature_key: SportingContextFeature;
  observed_at: string;
  numeric_value: number | null;
  text_value: string | null;
  confidence: number | null;
}

class SportingContextService {
  async getEventContext(eventId: string): Promise<SportingContextItem[]> {
    const rows = await fetchRows<SportingContextRow>('dashboard_event_context_v1', {
      select: 'ticket_event_id,feature_key,observed_at,numeric_value,text_value,confidence'
    });

    return rows
      .filter((row) => String(row.ticket_event_id) === eventId)
      .map((row) => ({
        ticketEventId: row.ticket_event_id,
        featureKey: row.feature_key,
        observedAt: row.observed_at,
        numericValue: row.numeric_value === null ? undefined : Number(row.numeric_value),
        textValue: row.text_value ?? undefined,
        confidence: row.confidence === null ? undefined : Number(row.confidence)
      }));
  }
}

export const sportingContextService = new SportingContextService();
