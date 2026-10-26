import { fetchRows } from './supabaseRest';

export interface P9MaeLifecycle {
  version: string;
  generatedAt: string;
  historicalStatus: string;
  historicalComparatorTargetsT24: number;
  historicalSupportReadyTargetsT24: number;
  historicalComparatorTargetsT48: number;
  historicalSupportReadyTargetsT48: number;
  historicalAttendanceValuesOpened: boolean;
  historicalLearnerResultProduced: boolean;
  prospectivePredictionEvents: number;
  prospectivePredictionRows: number;
  prospectiveScoredEvents: number;
  prospectiveEvidenceStatus: string;
  incumbentEventBalancedMae?: number;
  challengerEventBalancedMae?: number;
  deltaEventBalancedMae?: number;
  eventImprovementRate?: number;
  worstEventDegradation?: number;
  productionActivationAllowed: boolean;
  liveAdjustment: number;
  productionChange: boolean;
}

interface P9MaeLifecycleRow {
  version: string;
  generated_at: string;
  historical_status: string;
  historical_comparator_targets_t24: number;
  historical_support_ready_targets_t24: number;
  historical_comparator_targets_t48: number;
  historical_support_ready_targets_t48: number;
  historical_attendance_values_opened: boolean;
  historical_learner_result_produced: boolean;
  prospective_prediction_events: number;
  prospective_prediction_rows: number;
  prospective_scored_events: number;
  prospective_evidence_status: string;
  incumbent_event_balanced_mae: number | null;
  challenger_event_balanced_mae: number | null;
  delta_event_balanced_mae: number | null;
  event_improvement_rate: number | null;
  worst_event_degradation: number | null;
  production_activation_allowed: boolean;
  live_adjustment: number;
  production_change: boolean;
}

const optionalNumber = (value: number | null): number | undefined =>
  value === null ? undefined : Number(value);

class P9MaeLifecycleService {
  async getStatus(): Promise<P9MaeLifecycle | null> {
    const rows = await fetchRows<P9MaeLifecycleRow>('dashboard_p9_mae_lifecycle_v1', {
      select:
        'version,generated_at,historical_status,historical_comparator_targets_t24,historical_support_ready_targets_t24,historical_comparator_targets_t48,historical_support_ready_targets_t48,historical_attendance_values_opened,historical_learner_result_produced,prospective_prediction_events,prospective_prediction_rows,prospective_scored_events,prospective_evidence_status,incumbent_event_balanced_mae,challenger_event_balanced_mae,delta_event_balanced_mae,event_improvement_rate,worst_event_degradation,production_activation_allowed,live_adjustment,production_change'
    });

    const row = rows[0];
    if (!row) return null;

    return {
      version: row.version,
      generatedAt: row.generated_at,
      historicalStatus: row.historical_status,
      historicalComparatorTargetsT24: Number(row.historical_comparator_targets_t24),
      historicalSupportReadyTargetsT24: Number(row.historical_support_ready_targets_t24),
      historicalComparatorTargetsT48: Number(row.historical_comparator_targets_t48),
      historicalSupportReadyTargetsT48: Number(row.historical_support_ready_targets_t48),
      historicalAttendanceValuesOpened: row.historical_attendance_values_opened,
      historicalLearnerResultProduced: row.historical_learner_result_produced,
      prospectivePredictionEvents: Number(row.prospective_prediction_events),
      prospectivePredictionRows: Number(row.prospective_prediction_rows),
      prospectiveScoredEvents: Number(row.prospective_scored_events),
      prospectiveEvidenceStatus: row.prospective_evidence_status,
      incumbentEventBalancedMae: optionalNumber(row.incumbent_event_balanced_mae),
      challengerEventBalancedMae: optionalNumber(row.challenger_event_balanced_mae),
      deltaEventBalancedMae: optionalNumber(row.delta_event_balanced_mae),
      eventImprovementRate: optionalNumber(row.event_improvement_rate),
      worstEventDegradation: optionalNumber(row.worst_event_degradation),
      productionActivationAllowed: row.production_activation_allowed,
      liveAdjustment: Number(row.live_adjustment),
      productionChange: row.production_change
    };
  }
}

export const p9MaeLifecycleService = new P9MaeLifecycleService();
