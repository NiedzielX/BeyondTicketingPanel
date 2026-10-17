import { fetchRows } from './supabaseRest';

export type SectorStatus =
  | 'UNDERPERFORMING'
  | 'ON_TRACK'
  | 'OUTPERFORMING'
  | 'INSUFFICIENT_SIGNAL';

export type SectorTrend = 'IMPROVING' | 'WEAKENING' | 'STABLE' | 'FLAT' | 'UNKNOWN';
export type PricingAction = 'DECREASE' | 'HOLD' | 'INCREASE' | 'MONITOR';

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
  price_data_status: string;
  current_price: number | null;
  currency: string | null;
  pricing_recommendation_status: string;
  recommended_price_change_pct: number | null;
  recommended_price: number | null;
  pricing_recommendation_action: PricingAction | null;
  pricing_scenario_confidence: 'HIGH' | 'MEDIUM' | 'LOW' | null;
  pricing_recommendation_reason_code: string | null;
  pricing_maturity_label: string | null;
  pricing_commercial_guardrails_status: string | null;
  pricing_projected_public_availability_at_kickoff: number | null;
  pricing_additional_absorption_delta_vs_hold: number | null;
  pricing_revenue_proxy_delta_vs_hold: number | null;
  pricing_requires_human_review: boolean | null;
  auto_price_change_allowed: boolean | null;
  pricing_recommendation_version: string | null;
  pricing_assumption_set_version: string | null;
  data_quality_status: string;
  decision_version: string;
  status_policy_version: string;
  projection_policy_version: string;
  refreshed_at: string;
}

export interface PriceAreaPricingRow {
  ticket_event_id: number;
  sector: string;
  sector_name: string | null;
  sector_status: SectorStatus;
  trend_state: SectorTrend;
  hours_to_kickoff: number;
  sector_gap_ratio: number | null;
  projection_confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT';
  price_area_id: number;
  price_area_name: string | null;
  price_type_name: string | null;
  current_price: number | null;
  currency: string | null;
  current_public_availability: number;
  availability_share_of_sector: number | null;
  baseline_projected_public_availability_at_kickoff: number | null;
  baseline_additional_absorption_proxy: number | null;
  minimum_actionable_absorption: number | null;
  recommended_action: PricingAction;
  recommended_price_change_pct: number | null;
  recommended_price: number | null;
  recommended_projected_public_availability_at_kickoff: number | null;
  recommended_projected_additional_absorption: number | null;
  additional_absorption_delta_vs_hold: number | null;
  scenario_confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  recommendation_reason_code: string;
  price_data_status: string;
  requires_human_review: boolean;
  auto_price_change_allowed: boolean;
  maturity_label: string;
  price_area_recommendation_version: string;
  recommendation_policy_version: string;
  assumption_set_version: string;
  price_area_observed_at: string | null;
  price_observed_at: string | null;
  point_in_time_validated: boolean;
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
  price_data_status: string;
  pricing_recommendation_status: string;
  priced_sector_count: number | null;
  pricing_actionable_count: number | null;
  pricing_decrease_count: number | null;
  pricing_hold_count: number | null;
  pricing_increase_count: number | null;
  pricing_monitor_count: number | null;
  top_pricing_sector: string | null;
  top_pricing_action: PricingAction | null;
  top_pricing_current_price: number | null;
  top_pricing_recommended_price: number | null;
  top_pricing_change_pct: number | null;
  pricing_maturity_label: string | null;
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
    priceAreas: PriceAreaPricingRow[];
  }> {
    const numericId = Number(eventId);
    if (!Number.isFinite(numericId)) {
      return { summary: null, sectors: [], priceAreas: [] };
    }

    const [summaries, sectors, priceAreas] = await Promise.all([
      fetchRows<SectorSummaryRow>('dashboard_sector_summary_current_v1', {
        select: '*',
        filters: { ticket_event_id: `eq.${numericId}` }
      }),
      fetchRows<SectorDecisionRow>('dashboard_sector_decision_current_v1', {
        select: '*',
        filters: { ticket_event_id: `eq.${numericId}` }
      }),
      fetchRows<PriceAreaPricingRow>('dashboard_price_area_pricing_current_v1', {
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

    priceAreas.sort((a, b) => {
      const sectorDelta = a.sector.localeCompare(b.sector, 'pl', { numeric: true });
      if (sectorDelta !== 0) return sectorDelta;
      return a.price_area_id - b.price_area_id;
    });

    return {
      summary: summaries[0] ?? null,
      sectors,
      priceAreas
    };
  }
}

export const sectorDecisionService = new SectorDecisionService();
