import { fetchRows } from './supabaseRest';

export interface ContextSnapshotReadiness {
  checkpointCode: string;
  sortOrder: number;
  dueEventCount: number;
  capturedCount: number;
  prospectiveCount: number;
  baselineReadyCount: number;
  outcomePairedCount: number;
  avgContextCoveragePct?: number;
}

export interface ContextAblationRow {
  checkpointCode: string;
  checkpointSortOrder: number;
  variantKey: string;
  variantSortOrder: number;
  displayName: string;
  description: string;
  eventCount: number;
  clubCount: number;
  variantMae?: number;
  baselineMaeSameEvents?: number;
  maeUplift?: number;
  variantBias?: number;
  baselineBiasSameEvents?: number;
  evaluationStatus: 'evaluated' | 'no_predictions';
}

interface SnapshotReadinessRow {
  checkpoint_code: string;
  sort_order: number;
  due_event_count: number;
  captured_count: number;
  prospective_count: number;
  baseline_ready_count: number;
  outcome_paired_count: number;
  avg_context_coverage_pct: number | null;
}

interface AblationRow {
  checkpoint_code: string;
  checkpoint_sort_order: number;
  variant_key: string;
  variant_sort_order: number;
  display_name: string;
  description: string;
  event_count: number;
  club_count: number;
  variant_mae: number | null;
  baseline_mae_same_events: number | null;
  mae_uplift: number | null;
  variant_bias: number | null;
  baseline_bias_same_events: number | null;
  evaluation_status: 'evaluated' | 'no_predictions';
}

class ContextEvaluationService {
  async getSnapshotReadiness(): Promise<ContextSnapshotReadiness[]> {
    const rows = await fetchRows<SnapshotReadinessRow>('dashboard_context_snapshot_readiness_v1', {
      select: 'checkpoint_code,sort_order,due_event_count,captured_count,prospective_count,baseline_ready_count,outcome_paired_count,avg_context_coverage_pct'
    });

    return rows
      .map((row) => ({
        checkpointCode: row.checkpoint_code,
        sortOrder: Number(row.sort_order),
        dueEventCount: Number(row.due_event_count),
        capturedCount: Number(row.captured_count),
        prospectiveCount: Number(row.prospective_count),
        baselineReadyCount: Number(row.baseline_ready_count),
        outcomePairedCount: Number(row.outcome_paired_count),
        avgContextCoveragePct:
          row.avg_context_coverage_pct === null ? undefined : Number(row.avg_context_coverage_pct)
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async getAblationMatrix(): Promise<ContextAblationRow[]> {
    const rows = await fetchRows<AblationRow>('dashboard_context_ablation_matrix_v1', {
      select: 'checkpoint_code,checkpoint_sort_order,variant_key,variant_sort_order,display_name,description,event_count,club_count,variant_mae,baseline_mae_same_events,mae_uplift,variant_bias,baseline_bias_same_events,evaluation_status'
    });

    return rows
      .map((row) => ({
        checkpointCode: row.checkpoint_code,
        checkpointSortOrder: Number(row.checkpoint_sort_order),
        variantKey: row.variant_key,
        variantSortOrder: Number(row.variant_sort_order),
        displayName: row.display_name,
        description: row.description,
        eventCount: Number(row.event_count),
        clubCount: Number(row.club_count),
        variantMae: row.variant_mae === null ? undefined : Number(row.variant_mae),
        baselineMaeSameEvents:
          row.baseline_mae_same_events === null ? undefined : Number(row.baseline_mae_same_events),
        maeUplift: row.mae_uplift === null ? undefined : Number(row.mae_uplift),
        variantBias: row.variant_bias === null ? undefined : Number(row.variant_bias),
        baselineBiasSameEvents:
          row.baseline_bias_same_events === null ? undefined : Number(row.baseline_bias_same_events),
        evaluationStatus: row.evaluation_status
      }))
      .sort((a, b) =>
        a.checkpointSortOrder === b.checkpointSortOrder
          ? a.variantSortOrder - b.variantSortOrder
          : a.checkpointSortOrder - b.checkpointSortOrder
      );
  }
}

export const contextEvaluationService = new ContextEvaluationService();
