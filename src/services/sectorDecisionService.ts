import { fetchRows } from './supabaseRest';

export type SectorStatus =
  | 'UNDERPERFORMING'
  | 'ON_TRACK'
  | 'OUTPERFORMING'
  | 'INSUFFICIENT_SIGNAL';

export type SectorTrend = 'IMPROVING' | 'WEAKENING' | 'STABLE' | 'FLAT' | 'UNKNOWN';

export interface SectorDecisionRow {
  ticket_event_id: number;
  home_team: string;
  away_team: string;
  competition: string | null;
  kickoff_at: string;
  sector: string;
  as_of_at: string;
  hours_to_kickoff: number;
  current_public_availability: number;
  reference_public_availability: number;
  sector_gap_available: number | null;
  sector_gap_ratio: number | null;
  sector_status: SectorStatus;
  status_reason_code: string;
  trend_state: SectorTrend;
  projected_public_availability_at_kickoff: number | null;
  projected_public_sell_through_proxy: number | null;
  projection_confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT';
  projection_reason_code: string;
  price_data_status: 'PRICE_DATA_MISSING' | string;
  current_price: number | null;
  currency: string | null;
  pricing_recommendation_status: 'PENDING_PRICE_DATA' | string;
  data_quality_status: string;
  decision_version: string;
  status_policy_version: string;
  projection_policy_version: string;
  refreshed_at: string;
}

export interface SectorSummaryRow {
  ticket_event_id: number;
  home_team: string;
  away_team: string;
  competition: string | null;
  kickoff_at: string;
  as_of_at: string;
  hours_to_kickoff: number;
  sector_count: number;
  underperforming_count: number;
  on_track_count: number;
  outperforming_count: number;
  insufficient_signal_count: number;
  projected_sector_count: number;
  projection_coverage_ratio: number | null;
  projected_known_public_availability_at_kickoff: number | null;
  top_underperforming_sector: string | null;
  top_underperforming_gap_available: number | null;
  top_underperforming_projected_available: number | null;
  price_data_status: 'PRICE_DATA_MISSING' | string;
  pricing_recommendation_status: 'PENDING_PRICE_DATA' | string;
  decision_version: string;
  refreshed_at: string;
}

const STATUS_ORDER: Record<SectorStatus, number> = {
  UNDERPERFORMING: 0,
  INSUFFICIENT_SIGNAL: 1,
  ON_TRACK: 2,
  OUTPERFORMING: 3
};

class SectorDecisionService {
  async getEventSectorDecision(eventId: string): Promise<{
    summary: SectorSummaryRow | null;
    sectors: SectorDecisionRow[];
  }> {
    const numericId = Number(eventId);
    if (!Number.isFinite(numericId)) {
      return { summary: null, sectors: [] };
    }

    const [summaries, sectors] = await Promise.all([
      fetchRows<SectorSummaryRow>('dashboard_sector_summary_current_v1', {
        select: '*',
        filters: { ticket_event_id: `eq.${numericId}` }
      }),
      fetchRows<SectorDecisionRow>('dashboard_sector_decision_current_v1', {
        select: '*',
        filters: { ticket_event_id: `eq.${numericId}` }
      })
    ]);

    sectors.sort((a, b) => {
      const statusDelta = STATUS_ORDER[a.sector_status] - STATUS_ORDER[b.sector_status];
      if (statusDelta !== 0) return statusDelta;

      const gapA = a.sector_gap_available ?? Number.NEGATIVE_INFINITY;
      const gapB = b.sector_gap_available ?? Number.NEGATIVE_INFINITY;
      if (gapA !== gapB) return gapB - gapA;

      return a.sector.localeCompare(b.sector, 'pl', { numeric: true });
    });

    return {
      summary: summaries[0] ?? null,
      sectors
    };
  }
}

export const sectorDecisionService = new SectorDecisionService();
