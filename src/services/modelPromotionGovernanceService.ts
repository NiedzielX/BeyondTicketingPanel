import { fetchRows } from './supabaseRest';

export type PromotionReviewStatus = 'ready_for_review' | 'approved_for_promotion' | 'rejected' | 'superseded';

export interface PromotionGovernanceSummary {
  totalPackages: number;
  readyForReviewCount: number;
  approvedCount: number;
  rejectedCount: number;
  supersededCount: number;
  latestFrozenAt?: string;
  nearestCategoryKey?: string;
  nearestDisplayName?: string;
  nearestProgressPct?: number;
  nearestEvidenceCount?: number;
  nearestEventTarget?: number;
  nearestEvidenceSignal?: string;
  governanceNote: string;
}

export interface PromotionPackageRow {
  id: number;
  packageKey: string;
  categoryKey: string;
  displayName: string;
  candidateKey: string;
  reviewStatus: PromotionReviewStatus;
  primaryProtocol: string;
  researchPriorWeightPct: number;
  validationEventCount: number;
  validationClubCount?: number;
  promotionEvidenceCount: number;
  promotionEventTarget: number;
  promotionClubTarget?: number;
  incumbentMae: number;
  biasControlMae?: number;
  challengerMae: number;
  upliftVsIncumbent: number;
  incrementalUpliftVsBias?: number;
  sourceScorecardRefreshedAt: string;
  sourceEvidenceRefreshedAt?: string;
  frozenAt: string;
  decisionReason: string;
  nextAction: string;
  autoActivationAllowed: boolean;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNote?: string;
  supersededAt?: string;
  supersededByPackageId?: number;
}

interface SummaryApiRow {
  total_packages: number;
  ready_for_review_count: number;
  approved_count: number;
  rejected_count: number;
  superseded_count: number;
  latest_frozen_at: string | null;
  nearest_category_key: string | null;
  nearest_display_name: string | null;
  nearest_progress_pct: number | string | null;
  nearest_evidence_count: number | null;
  nearest_event_target: number | null;
  nearest_evidence_signal: string | null;
  governance_note: string;
}

interface PackageApiRow {
  id: number;
  package_key: string;
  category_key: string;
  display_name: string;
  candidate_key: string;
  review_status: PromotionReviewStatus;
  primary_protocol: string;
  research_prior_weight_pct: number | string;
  validation_event_count: number;
  validation_club_count: number | null;
  promotion_evidence_count: number;
  promotion_event_target: number;
  promotion_club_target: number | null;
  incumbent_mae: number | string;
  bias_control_mae: number | string | null;
  challenger_mae: number | string;
  uplift_vs_incumbent: number | string;
  incremental_uplift_vs_bias: number | string | null;
  source_scorecard_refreshed_at: string;
  source_evidence_refreshed_at: string | null;
  frozen_at: string;
  decision_reason: string;
  next_action: string;
  auto_activation_allowed: boolean;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_note: string | null;
  superseded_at: string | null;
  superseded_by_package_id: number | null;
}

const n = (value: number | string | null): number | undefined => value === null ? undefined : Number(value);

class ModelPromotionGovernanceService {
  async getSummary(): Promise<PromotionGovernanceSummary | null> {
    const rows = await fetchRows<SummaryApiRow>('dashboard_model_promotion_governance_summary_v1', {
      select: 'total_packages,ready_for_review_count,approved_count,rejected_count,superseded_count,latest_frozen_at,nearest_category_key,nearest_display_name,nearest_progress_pct,nearest_evidence_count,nearest_event_target,nearest_evidence_signal,governance_note'
    });
    const row = rows[0];
    if (!row) return null;
    return {
      totalPackages: Number(row.total_packages),
      readyForReviewCount: Number(row.ready_for_review_count),
      approvedCount: Number(row.approved_count),
      rejectedCount: Number(row.rejected_count),
      supersededCount: Number(row.superseded_count),
      latestFrozenAt: row.latest_frozen_at ?? undefined,
      nearestCategoryKey: row.nearest_category_key ?? undefined,
      nearestDisplayName: row.nearest_display_name ?? undefined,
      nearestProgressPct: n(row.nearest_progress_pct),
      nearestEvidenceCount: row.nearest_evidence_count ?? undefined,
      nearestEventTarget: row.nearest_event_target ?? undefined,
      nearestEvidenceSignal: row.nearest_evidence_signal ?? undefined,
      governanceNote: row.governance_note
    };
  }

  async getPackages(): Promise<PromotionPackageRow[]> {
    const rows = await fetchRows<PackageApiRow>('dashboard_model_promotion_queue_v1', {
      select: 'id,package_key,category_key,display_name,candidate_key,review_status,primary_protocol,research_prior_weight_pct,validation_event_count,validation_club_count,promotion_evidence_count,promotion_event_target,promotion_club_target,incumbent_mae,bias_control_mae,challenger_mae,uplift_vs_incumbent,incremental_uplift_vs_bias,source_scorecard_refreshed_at,source_evidence_refreshed_at,frozen_at,decision_reason,next_action,auto_activation_allowed,reviewed_at,reviewed_by,review_note,superseded_at,superseded_by_package_id',
      order: 'frozen_at.desc'
    });

    return rows.map((row) => ({
      id: Number(row.id),
      packageKey: row.package_key,
      categoryKey: row.category_key,
      displayName: row.display_name,
      candidateKey: row.candidate_key,
      reviewStatus: row.review_status,
      primaryProtocol: row.primary_protocol,
      researchPriorWeightPct: Number(row.research_prior_weight_pct),
      validationEventCount: Number(row.validation_event_count),
      validationClubCount: row.validation_club_count ?? undefined,
      promotionEvidenceCount: Number(row.promotion_evidence_count),
      promotionEventTarget: Number(row.promotion_event_target),
      promotionClubTarget: row.promotion_club_target ?? undefined,
      incumbentMae: Number(row.incumbent_mae),
      biasControlMae: n(row.bias_control_mae),
      challengerMae: Number(row.challenger_mae),
      upliftVsIncumbent: Number(row.uplift_vs_incumbent),
      incrementalUpliftVsBias: n(row.incremental_uplift_vs_bias),
      sourceScorecardRefreshedAt: row.source_scorecard_refreshed_at,
      sourceEvidenceRefreshedAt: row.source_evidence_refreshed_at ?? undefined,
      frozenAt: row.frozen_at,
      decisionReason: row.decision_reason,
      nextAction: row.next_action,
      autoActivationAllowed: Boolean(row.auto_activation_allowed),
      reviewedAt: row.reviewed_at ?? undefined,
      reviewedBy: row.reviewed_by ?? undefined,
      reviewNote: row.review_note ?? undefined,
      supersededAt: row.superseded_at ?? undefined,
      supersededByPackageId: row.superseded_by_package_id ?? undefined
    }));
  }
}

export const modelPromotionGovernanceService = new ModelPromotionGovernanceService();
