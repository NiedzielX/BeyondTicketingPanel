import { fetchRows } from './supabaseRest';

export interface GrowthExperimentMeasurement {
  experimentId: number;
  experimentKey: string;
  ticketEventId: number;
  play: string;
  status: string;
  hypothesis: string;
  actionDescription: string;
  primaryMetric: string;
  assignmentMethod: string;
  currency: string;
  minExposedPerArm: number;
  homeTeam: string;
  awayTeam: string;
  kickoffAt: string;
  treatmentSharePct?: number;
  holdoutSharePct?: number;
  treatmentExposed?: number;
  holdoutExposed?: number;
  treatmentPurchasers?: number;
  holdoutPurchasers?: number;
  treatmentTickets?: number;
  holdoutTickets?: number;
  treatmentGrossRevenue?: number;
  holdoutGrossRevenue?: number;
  treatmentConversionRate?: number;
  holdoutConversionRate?: number;
  incrementalTickets?: number;
  incrementalGrossRevenue?: number;
  incrementalNetRevenue?: number;
  incrementalCampaignCost?: number;
  incrementalContribution?: number;
  roi?: number;
  measurementStatus: string;
  evidenceDesign: string;
  interpretationNote: string;
}

interface ApiRow {
  experiment_id: number;
  experiment_key: string;
  ticket_event_id: number;
  play: string;
  status: string;
  hypothesis: string;
  action_description: string;
  primary_metric: string;
  assignment_method: string;
  currency: string;
  min_exposed_per_arm: number;
  home_team: string;
  away_team: string;
  kickoff_at: string;
  treatment_share_pct: number | string | null;
  holdout_share_pct: number | string | null;
  treatment_exposed: number | null;
  holdout_exposed: number | null;
  treatment_purchasers: number | null;
  holdout_purchasers: number | null;
  treatment_tickets: number | null;
  holdout_tickets: number | null;
  treatment_gross_revenue: number | string | null;
  holdout_gross_revenue: number | string | null;
  treatment_conversion_rate: number | string | null;
  holdout_conversion_rate: number | string | null;
  incremental_tickets_treatment_population: number | string | null;
  incremental_gross_revenue: number | string | null;
  incremental_net_revenue: number | string | null;
  incremental_campaign_cost: number | string | null;
  incremental_contribution: number | string | null;
  roi_on_incremental_campaign_cost: number | string | null;
  measurement_status: string;
  evidence_design: string;
  interpretation_note: string;
}

const SELECT = 'experiment_id,experiment_key,ticket_event_id,play,status,hypothesis,action_description,primary_metric,assignment_method,currency,min_exposed_per_arm,home_team,away_team,kickoff_at,treatment_share_pct,holdout_share_pct,treatment_exposed,holdout_exposed,treatment_purchasers,holdout_purchasers,treatment_tickets,holdout_tickets,treatment_gross_revenue,holdout_gross_revenue,treatment_conversion_rate,holdout_conversion_rate,incremental_tickets_treatment_population,incremental_gross_revenue,incremental_net_revenue,incremental_campaign_cost,incremental_contribution,roi_on_incremental_campaign_cost,measurement_status,evidence_design,interpretation_note';

const optionalNumber = (value: number | string | null): number | undefined =>
  value === null ? undefined : Number(value);

const mapRow = (row: ApiRow): GrowthExperimentMeasurement => ({
  experimentId: Number(row.experiment_id),
  experimentKey: row.experiment_key,
  ticketEventId: Number(row.ticket_event_id),
  play: row.play,
  status: row.status,
  hypothesis: row.hypothesis,
  actionDescription: row.action_description,
  primaryMetric: row.primary_metric,
  assignmentMethod: row.assignment_method,
  currency: row.currency,
  minExposedPerArm: Number(row.min_exposed_per_arm),
  homeTeam: row.home_team,
  awayTeam: row.away_team,
  kickoffAt: row.kickoff_at,
  treatmentSharePct: optionalNumber(row.treatment_share_pct),
  holdoutSharePct: optionalNumber(row.holdout_share_pct),
  treatmentExposed: row.treatment_exposed ?? undefined,
  holdoutExposed: row.holdout_exposed ?? undefined,
  treatmentPurchasers: row.treatment_purchasers ?? undefined,
  holdoutPurchasers: row.holdout_purchasers ?? undefined,
  treatmentTickets: row.treatment_tickets ?? undefined,
  holdoutTickets: row.holdout_tickets ?? undefined,
  treatmentGrossRevenue: optionalNumber(row.treatment_gross_revenue),
  holdoutGrossRevenue: optionalNumber(row.holdout_gross_revenue),
  treatmentConversionRate: optionalNumber(row.treatment_conversion_rate),
  holdoutConversionRate: optionalNumber(row.holdout_conversion_rate),
  incrementalTickets: optionalNumber(row.incremental_tickets_treatment_population),
  incrementalGrossRevenue: optionalNumber(row.incremental_gross_revenue),
  incrementalNetRevenue: optionalNumber(row.incremental_net_revenue),
  incrementalCampaignCost: optionalNumber(row.incremental_campaign_cost),
  incrementalContribution: optionalNumber(row.incremental_contribution),
  roi: optionalNumber(row.roi_on_incremental_campaign_cost),
  measurementStatus: row.measurement_status,
  evidenceDesign: row.evidence_design,
  interpretationNote: row.interpretation_note
});

class GrowthExperimentService {
  async getForEvent(eventId: string): Promise<GrowthExperimentMeasurement[]> {
    const rows = await fetchRows<ApiRow>('dashboard_growth_experiment_measurement_v1', {
      select: SELECT,
      filters: { ticket_event_id: `eq.${eventId}` },
      order: 'experiment_id.desc'
    });
    return rows.map(mapRow);
  }

  async getAll(): Promise<GrowthExperimentMeasurement[]> {
    const rows = await fetchRows<ApiRow>('dashboard_growth_experiment_measurement_v1', {
      select: SELECT,
      order: 'experiment_id.desc'
    });
    return rows.map(mapRow);
  }
}

export const growthExperimentService = new GrowthExperimentService();
