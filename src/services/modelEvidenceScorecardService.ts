import { fetchRows } from './supabaseRest';

export type EvidenceDecisionStatus = 'promotable' | 'collecting' | 'rejected' | 'blocked';
export type EvidenceSignal = 'positive' | 'negative' | 'mixed' | 'unproven';

export interface ModelEvidenceRow {
  categoryKey: string;
  sortOrder: number;
  displayName: string;
  researchPriorWeightPct: number;
  decisionStatus: EvidenceDecisionStatus;
  evidenceSignal: EvidenceSignal;
  primaryProtocol?: string;
  candidateKey?: string;
  validationEventCount?: number;
  validationClubCount?: number;
  promotionEvidenceCount: number;
  promotionEventTarget: number;
  promotionClubTarget?: number;
  promotionProgressPct: number;
  incumbentMae?: number;
  biasControlMae?: number;
  challengerMae?: number;
  upliftVsIncumbent?: number;
  incrementalUpliftVsBias?: number;
  prospectiveEventCount?: number;
  decisionReason: string;
  nextAction: string;
  productionImpact: string;
  sourceRefreshedAt?: string;
  refreshedAt: string;
}

export interface ModelEvidenceSummary {
  categoryCount: number;
  promotableCount: number;
  collectingCount: number;
  rejectedCount: number;
  blockedCount: number;
  positiveSignalCount: number;
  currentEvidenceBackedChain: string;
  governanceNote: string;
  refreshedAt?: string;
}

interface EvidenceApiRow {
  category_key: string;
  sort_order: number;
  display_name: string;
  research_prior_weight_pct: number | string;
  decision_status: EvidenceDecisionStatus;
  evidence_signal: EvidenceSignal;
  primary_protocol: string | null;
  candidate_key: string | null;
  validation_event_count: number | null;
  validation_club_count: number | null;
  promotion_evidence_count: number;
  promotion_event_target: number;
  promotion_club_target: number | null;
  promotion_progress_pct: number | string;
  incumbent_mae: number | string | null;
  bias_control_mae: number | string | null;
  challenger_mae: number | string | null;
  uplift_vs_incumbent: number | string | null;
  incremental_uplift_vs_bias: number | string | null;
  prospective_event_count: number | null;
  decision_reason: string;
  next_action: string;
  production_impact: string;
  source_refreshed_at: string | null;
  refreshed_at: string;
}

interface SummaryApiRow {
  category_count: number;
  promotable_count: number;
  collecting_count: number;
  rejected_count: number;
  blocked_count: number;
  positive_signal_count: number;
  current_evidence_backed_chain: string;
  governance_note: string;
  refreshed_at: string | null;
}

const optionalNumber = (value: number | string | null): number | undefined =>
  value === null ? undefined : Number(value);

class ModelEvidenceScorecardService {
  async getRows(): Promise<ModelEvidenceRow[]> {
    const rows = await fetchRows<EvidenceApiRow>('dashboard_model_evidence_scorecard_v1', {
      select: 'category_key,sort_order,display_name,research_prior_weight_pct,decision_status,evidence_signal,primary_protocol,candidate_key,validation_event_count,validation_club_count,promotion_evidence_count,promotion_event_target,promotion_club_target,promotion_progress_pct,incumbent_mae,bias_control_mae,challenger_mae,uplift_vs_incumbent,incremental_uplift_vs_bias,prospective_event_count,decision_reason,next_action,production_impact,source_refreshed_at,refreshed_at',
      order: 'sort_order.asc'
    });

    return rows.map((row) => ({
      categoryKey: row.category_key,
      sortOrder: Number(row.sort_order),
      displayName: row.display_name,
      researchPriorWeightPct: Number(row.research_prior_weight_pct),
      decisionStatus: row.decision_status,
      evidenceSignal: row.evidence_signal,
      primaryProtocol: row.primary_protocol ?? undefined,
      candidateKey: row.candidate_key ?? undefined,
      validationEventCount: row.validation_event_count ?? undefined,
      validationClubCount: row.validation_club_count ?? undefined,
      promotionEvidenceCount: Number(row.promotion_evidence_count),
      promotionEventTarget: Number(row.promotion_event_target),
      promotionClubTarget: row.promotion_club_target ?? undefined,
      promotionProgressPct: Number(row.promotion_progress_pct),
      incumbentMae: optionalNumber(row.incumbent_mae),
      biasControlMae: optionalNumber(row.bias_control_mae),
      challengerMae: optionalNumber(row.challenger_mae),
      upliftVsIncumbent: optionalNumber(row.uplift_vs_incumbent),
      incrementalUpliftVsBias: optionalNumber(row.incremental_uplift_vs_bias),
      prospectiveEventCount: row.prospective_event_count ?? undefined,
      decisionReason: row.decision_reason,
      nextAction: row.next_action,
      productionImpact: row.production_impact,
      sourceRefreshedAt: row.source_refreshed_at ?? undefined,
      refreshedAt: row.refreshed_at
    }));
  }

  async getSummary(): Promise<ModelEvidenceSummary | null> {
    const rows = await fetchRows<SummaryApiRow>('dashboard_model_evidence_summary_v1', {
      select: 'category_count,promotable_count,collecting_count,rejected_count,blocked_count,positive_signal_count,current_evidence_backed_chain,governance_note,refreshed_at'
    });
    const row = rows[0];
    if (!row) return null;
    return {
      categoryCount: Number(row.category_count),
      promotableCount: Number(row.promotable_count),
      collectingCount: Number(row.collecting_count),
      rejectedCount: Number(row.rejected_count),
      blockedCount: Number(row.blocked_count),
      positiveSignalCount: Number(row.positive_signal_count),
      currentEvidenceBackedChain: row.current_evidence_backed_chain,
      governanceNote: row.governance_note,
      refreshedAt: row.refreshed_at ?? undefined
    };
  }
}

export const modelEvidenceScorecardService = new ModelEvidenceScorecardService();
