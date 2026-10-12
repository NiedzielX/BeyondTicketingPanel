import { fetchRows } from './supabaseRest';

export type AttentionStatus =
  | 'collecting_baseline'
  | 'collecting_comparison'
  | 'no_signal'
  | 'rising'
  | 'falling'
  | 'stable';

export interface AttentionContext {
  ticketEventId: number;
  latestSampleAt: string;
  samples24h: number;
  mentions24h: number;
  samplesPrevious24h: number;
  mentionsPrevious24h: number;
  accelerationRatio?: number;
  attentionStatus: AttentionStatus;
}

export interface AttentionCollectorHealth {
  latestSampleAt?: string;
  ageMinutes?: number;
  expectedIntervalMinutes: number;
  degradedAfterMinutes: number;
  healthStatus: 'healthy' | 'degraded' | 'no_samples';
}

interface AttentionContextRow {
  ticket_event_id: number;
  latest_sample_at: string;
  samples_24h: number;
  mentions_24h: number;
  samples_previous_24h: number;
  mentions_previous_24h: number;
  acceleration_ratio: number | null;
  attention_status: AttentionStatus;
}

interface AttentionCollectorHealthRow {
  latest_sample_at: string | null;
  age_minutes: number | null;
  expected_interval_minutes: number;
  degraded_after_minutes: number;
  health_status: AttentionCollectorHealth['healthStatus'];
}

class AttentionContextService {
  async getEventContext(eventId: string): Promise<AttentionContext | null> {
    const rows = await fetchRows<AttentionContextRow>('dashboard_attention_context_v1', {
      select: 'ticket_event_id,latest_sample_at,samples_24h,mentions_24h,samples_previous_24h,mentions_previous_24h,acceleration_ratio,attention_status'
    });

    const row = rows.find((item) => String(item.ticket_event_id) === eventId);
    if (!row) return null;

    return {
      ticketEventId: row.ticket_event_id,
      latestSampleAt: row.latest_sample_at,
      samples24h: Number(row.samples_24h ?? 0),
      mentions24h: Number(row.mentions_24h ?? 0),
      samplesPrevious24h: Number(row.samples_previous_24h ?? 0),
      mentionsPrevious24h: Number(row.mentions_previous_24h ?? 0),
      accelerationRatio: row.acceleration_ratio === null ? undefined : Number(row.acceleration_ratio),
      attentionStatus: row.attention_status
    };
  }

  async getCollectorHealth(): Promise<AttentionCollectorHealth | null> {
    const rows = await fetchRows<AttentionCollectorHealthRow>('dashboard_attention_collector_health_v1', {
      select: 'latest_sample_at,age_minutes,expected_interval_minutes,degraded_after_minutes,health_status'
    });
    const row = rows[0];
    if (!row) return null;
    return {
      latestSampleAt: row.latest_sample_at ?? undefined,
      ageMinutes: row.age_minutes === null ? undefined : Number(row.age_minutes),
      expectedIntervalMinutes: Number(row.expected_interval_minutes),
      degradedAfterMinutes: Number(row.degraded_after_minutes),
      healthStatus: row.health_status
    };
  }
}

export const attentionContextService = new AttentionContextService();
