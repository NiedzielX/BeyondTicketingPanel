import { fetchRows } from './supabaseRest';

export interface P9MaeStatus {
  generatedAt: string;
  historicalT168Events: number;
  historicalT168Clubs: number;
  designPrecommitted: boolean;
  fullWindowGateOpen: boolean;
  historicalStatus: string;
  historicalReason?: string;
  historicalT24ComparatorTargets: number;
  historicalT24SupportReadyTargets: number;
  historicalT48ComparatorTargets: number;
  historicalT48SupportReadyTargets: number;
  historicalResultProduced: boolean;
  historicalAttendanceValuesOpened: boolean;
  prospectiveEvidenceStatus: string;
  prospectivePredictionEvents: number;
  prospectivePredictionRows: number;
  prospectiveScoredEvents: number;
  prospectiveAttemptEvents: number;
  prospectiveAttemptRows: number;
  prospectivePredictionReadyAttempts: number;
  prospectiveSupportInsufficientAttempts: number;
  prospectiveNoTargetIncumbentAttempts: number;
  prospectiveLastAttemptedAt?: string;
  incumbentEventBalancedMae?: number;
  challengerEventBalancedMae?: number;
  deltaEventBalancedMae?: number;
  eventImprovementRate?: number;
  worstEventDegradation?: number;
  productionActivationAllowed: boolean;
  liveAdjustment: number;
  productionChange: boolean;
}

interface P9MaeStatusRow {
  generated_at: string;
  historical_t168_events: number;
  historical_t168_clubs: number;
  design_precommitted: boolean;
  full_window_gate_open: boolean;
  historical_status: string;
  historical_reason: string | null;
  historical_t24_comparator_targets: number;
  historical_t24_support_ready_targets: number;
  historical_t48_comparator_targets: number;
  historical_t48_support_ready_targets: number;
  historical_result_produced: boolean;
  historical_attendance_values_opened: boolean;
  prospective_evidence_status: string;
  prospective_prediction_events: number;
  prospective_prediction_rows: number;
  prospective_scored_events: number;
  prospective_attempt_events: number;
  prospective_attempt_rows: number;
  prospective_prediction_ready_attempts: number;
  prospective_support_insufficient_attempts: number;
  prospective_no_target_incumbent_attempts: number;
  prospective_last_attempted_at: string | null;
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

class P9MaeStatusService {
  async getStatus(): Promise<P9MaeStatus | null> {
    const rows = await fetchRows<P9MaeStatusRow>('dashboard_p9_mae_status_v1', {
      select: '*'
    });
    const row = rows[0];
    if (!row) return null;

    return {
      generatedAt: row.generated_at,
      historicalT168Events: Number(row.historical_t168_events),
      historicalT168Clubs: Number(row.historical_t168_clubs),
      designPrecommitted: row.design_precommitted,
      fullWindowGateOpen: row.full_window_gate_open,
      historicalStatus: row.historical_status,
      historicalReason: row.historical_reason ?? undefined,
      historicalT24ComparatorTargets: Number(row.historical_t24_comparator_targets),
      historicalT24SupportReadyTargets: Number(row.historical_t24_support_ready_targets),
      historicalT48ComparatorTargets: Number(row.historical_t48_comparator_targets),
      historicalT48SupportReadyTargets: Number(row.historical_t48_support_ready_targets),
      historicalResultProduced: row.historical_result_produced,
      historicalAttendanceValuesOpened: row.historical_attendance_values_opened,
      prospectiveEvidenceStatus: row.prospective_evidence_status,
      prospectivePredictionEvents: Number(row.prospective_prediction_events),
      prospectivePredictionRows: Number(row.prospective_prediction_rows),
      prospectiveScoredEvents: Number(row.prospective_scored_events),
      prospectiveAttemptEvents: Number(row.prospective_attempt_events),
      prospectiveAttemptRows: Number(row.prospective_attempt_rows),
      prospectivePredictionReadyAttempts: Number(row.prospective_prediction_ready_attempts),
      prospectiveSupportInsufficientAttempts: Number(row.prospective_support_insufficient_attempts),
      prospectiveNoTargetIncumbentAttempts: Number(row.prospective_no_target_incumbent_attempts),
      prospectiveLastAttemptedAt: row.prospective_last_attempted_at ?? undefined,
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

export const p9MaeStatusService = new P9MaeStatusService();
