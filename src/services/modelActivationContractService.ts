import { fetchRows } from './supabaseRest';

export interface ActivationSummary {
  approvedPromotionPackages: number;
  contractCount: number;
  draftCount: number;
  readyCount: number;
  activationApprovedCount: number;
  stoppedCount: number;
  anyExecutionEnabled: boolean;
  anyProductionBinding: boolean;
  latestContractUpdate?: string;
  defaultMaxAbsAdjustmentPct: number;
  defaultMaxInputStalenessMinutes: number;
  defaultMonitorWindowEvents: number;
  defaultMaxMaeRatioToChampion: number;
  defaultMaxConsecutiveWorseOutcomes: number;
  governanceNote: string;
}

export interface ActivationContractRow {
  id: number;
  promotionPackageId: number;
  categoryKey: string;
  candidateKey: string;
  championModelKey: string;
  contractStatus: string;
  activationMode: string;
  allowedHorizons: string[];
  maxAbsAdjustmentPct: number;
  failClosedToChampion: boolean;
  maxInputStalenessMinutes: number;
  killSwitchEnabled: boolean;
  rollbackMode: string;
  minPostActivationOutcomes: number;
  rollingWindowEvents: number;
  maxRollingMaeRatioToChampion: number;
  maxConsecutiveWorseOutcomes: number;
  requireChampionParallelForecast: boolean;
  requireAuditPayload: boolean;
  executionEnabled: boolean;
  writerBindingStatus: string;
  promotionReviewStatus: string;
  promotionIncumbentMae: number;
  promotionChallengerMae: number;
  promotionUplift: number;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  activationApprovedAt?: string;
  activationApprovedBy?: string;
}

interface SummaryApiRow {
  approved_promotion_packages: number;
  contract_count: number;
  draft_count: number;
  ready_count: number;
  activation_approved_count: number;
  stopped_count: number;
  any_execution_enabled: boolean;
  any_production_binding: boolean;
  latest_contract_update: string | null;
  default_max_abs_adjustment_pct: number | string;
  default_max_input_staleness_minutes: number;
  default_monitor_window_events: number;
  default_max_mae_ratio_to_champion: number | string;
  default_max_consecutive_worse_outcomes: number;
  governance_note: string;
}

interface ContractApiRow {
  id: number;
  promotion_package_id: number;
  category_key: string;
  candidate_key: string;
  champion_model_key: string;
  contract_status: string;
  activation_mode: string;
  allowed_horizons: string[];
  max_abs_adjustment_pct: number | string;
  fail_closed_to_champion: boolean;
  max_input_staleness_minutes: number;
  kill_switch_enabled: boolean;
  rollback_mode: string;
  min_post_activation_outcomes: number;
  rolling_window_events: number;
  max_rolling_mae_ratio_to_champion: number | string;
  max_consecutive_worse_outcomes: number;
  require_champion_parallel_forecast: boolean;
  require_audit_payload: boolean;
  execution_enabled: boolean;
  writer_binding_status: string;
  promotion_review_status: string;
  promotion_incumbent_mae: number | string;
  promotion_challenger_mae: number | string;
  promotion_uplift: number | string;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  activation_approved_at: string | null;
  activation_approved_by: string | null;
}

class ModelActivationContractService {
  async getSummary(): Promise<ActivationSummary | null> {
    const rows = await fetchRows<SummaryApiRow>('dashboard_model_activation_summary_v1', {
      select: 'approved_promotion_packages,contract_count,draft_count,ready_count,activation_approved_count,stopped_count,any_execution_enabled,any_production_binding,latest_contract_update,default_max_abs_adjustment_pct,default_max_input_staleness_minutes,default_monitor_window_events,default_max_mae_ratio_to_champion,default_max_consecutive_worse_outcomes,governance_note'
    });
    const row = rows[0];
    if (!row) return null;
    return {
      approvedPromotionPackages: Number(row.approved_promotion_packages),
      contractCount: Number(row.contract_count),
      draftCount: Number(row.draft_count),
      readyCount: Number(row.ready_count),
      activationApprovedCount: Number(row.activation_approved_count),
      stoppedCount: Number(row.stopped_count),
      anyExecutionEnabled: Boolean(row.any_execution_enabled),
      anyProductionBinding: Boolean(row.any_production_binding),
      latestContractUpdate: row.latest_contract_update ?? undefined,
      defaultMaxAbsAdjustmentPct: Number(row.default_max_abs_adjustment_pct),
      defaultMaxInputStalenessMinutes: Number(row.default_max_input_staleness_minutes),
      defaultMonitorWindowEvents: Number(row.default_monitor_window_events),
      defaultMaxMaeRatioToChampion: Number(row.default_max_mae_ratio_to_champion),
      defaultMaxConsecutiveWorseOutcomes: Number(row.default_max_consecutive_worse_outcomes),
      governanceNote: row.governance_note
    };
  }

  async getContracts(): Promise<ActivationContractRow[]> {
    const rows = await fetchRows<ContractApiRow>('dashboard_model_activation_contracts_v1', {
      select: 'id,promotion_package_id,category_key,candidate_key,champion_model_key,contract_status,activation_mode,allowed_horizons,max_abs_adjustment_pct,fail_closed_to_champion,max_input_staleness_minutes,kill_switch_enabled,rollback_mode,min_post_activation_outcomes,rolling_window_events,max_rolling_mae_ratio_to_champion,max_consecutive_worse_outcomes,require_champion_parallel_forecast,require_audit_payload,execution_enabled,writer_binding_status,promotion_review_status,promotion_incumbent_mae,promotion_challenger_mae,promotion_uplift,created_at,reviewed_at,reviewed_by,activation_approved_at,activation_approved_by',
      order: 'created_at.desc'
    });

    return rows.map((row) => ({
      id: Number(row.id),
      promotionPackageId: Number(row.promotion_package_id),
      categoryKey: row.category_key,
      candidateKey: row.candidate_key,
      championModelKey: row.champion_model_key,
      contractStatus: row.contract_status,
      activationMode: row.activation_mode,
      allowedHorizons: row.allowed_horizons ?? [],
      maxAbsAdjustmentPct: Number(row.max_abs_adjustment_pct),
      failClosedToChampion: Boolean(row.fail_closed_to_champion),
      maxInputStalenessMinutes: Number(row.max_input_staleness_minutes),
      killSwitchEnabled: Boolean(row.kill_switch_enabled),
      rollbackMode: row.rollback_mode,
      minPostActivationOutcomes: Number(row.min_post_activation_outcomes),
      rollingWindowEvents: Number(row.rolling_window_events),
      maxRollingMaeRatioToChampion: Number(row.max_rolling_mae_ratio_to_champion),
      maxConsecutiveWorseOutcomes: Number(row.max_consecutive_worse_outcomes),
      requireChampionParallelForecast: Boolean(row.require_champion_parallel_forecast),
      requireAuditPayload: Boolean(row.require_audit_payload),
      executionEnabled: Boolean(row.execution_enabled),
      writerBindingStatus: row.writer_binding_status,
      promotionReviewStatus: row.promotion_review_status,
      promotionIncumbentMae: Number(row.promotion_incumbent_mae),
      promotionChallengerMae: Number(row.promotion_challenger_mae),
      promotionUplift: Number(row.promotion_uplift),
      createdAt: row.created_at,
      reviewedAt: row.reviewed_at ?? undefined,
      reviewedBy: row.reviewed_by ?? undefined,
      activationApprovedAt: row.activation_approved_at ?? undefined,
      activationApprovedBy: row.activation_approved_by ?? undefined
    }));
  }
}

export const modelActivationContractService = new ModelActivationContractService();
