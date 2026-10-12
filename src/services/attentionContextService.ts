import { fetchRows } from './supabaseRest';

export type AttentionContextFeature = 'hype.media_attention' | 'hype.mention_acceleration';

export interface AttentionContextItem {
  ticketEventId: number;
  featureKey: AttentionContextFeature;
  observedAt: string;
  numericValue?: number;
  textValue?: string;
  confidence?: number;
}

interface AttentionContextRow {
  ticket_event_id: number;
  feature_key: AttentionContextFeature;
  observed_at: string;
  numeric_value: number | null;
  text_value: string | null;
  confidence: number | null;
}

class AttentionContextService {
  async getEventContext(eventId: string): Promise<AttentionContextItem[]> {
    const rows = await fetchRows<AttentionContextRow>('dashboard_event_context_v1', {
      select: 'ticket_event_id,feature_key,observed_at,numeric_value,text_value,confidence'
    });

    return rows
      .filter(
        (row) =>
          String(row.ticket_event_id) === eventId &&
          (row.feature_key === 'hype.media_attention' || row.feature_key === 'hype.mention_acceleration')
      )
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

export const attentionContextService = new AttentionContextService();
