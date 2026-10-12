import { fetchRows } from './supabaseRest';

export type ContextProductionRole =
  | 'active_prior'
  | 'shadow'
  | 'data_quality_modifier'
  | 'reference_only';

export type ContextCollectionStatus =
  | 'active_automated'
  | 'active_manual'
  | 'verified_registry'
  | 'shadow_automated'
  | 'degraded_automation'
  | 'planned'
  | 'blocked_external_access';

export interface ContextMatrixItem {
  matrixVersion: string;
  featureKey: string;
  groupKey: string;
  displayName: string;
  description: string;
  weightPct: number;
  productionRole: ContextProductionRole;
  collectionStatus?: ContextCollectionStatus;
  collectionNote?: string;
  refreshCadence?: string;
  primarySource?: string;
  fallbackSource?: string;
  rationale?: string;
}

interface ContextMatrixRow {
  matrix_version: string;
  feature_key: string;
  group_key: string;
  display_name: string;
  description: string;
  weight_pct: number;
  production_role: ContextProductionRole;
  collection_status: ContextCollectionStatus | null;
  collection_note: string | null;
  refresh_cadence: string | null;
  primary_source: string | null;
  fallback_source: string | null;
  rationale: string | null;
}

class ContextMatrixService {
  async getMatrix(): Promise<ContextMatrixItem[]> {
    const rows = await fetchRows<ContextMatrixRow>('dashboard_context_matrix_v1', {
      select:
        'matrix_version,feature_key,group_key,display_name,description,weight_pct,production_role,collection_status,collection_note,refresh_cadence,primary_source,fallback_source,rationale'
    });

    return rows.map((row) => ({
      matrixVersion: row.matrix_version,
      featureKey: row.feature_key,
      groupKey: row.group_key,
      displayName: row.display_name,
      description: row.description,
      weightPct: Number(row.weight_pct),
      productionRole: row.production_role,
      collectionStatus: row.collection_status ?? undefined,
      collectionNote: row.collection_note ?? undefined,
      refreshCadence: row.refresh_cadence ?? undefined,
      primarySource: row.primary_source ?? undefined,
      fallbackSource: row.fallback_source ?? undefined,
      rationale: row.rationale ?? undefined
    }));
  }
}

export const contextMatrixService = new ContextMatrixService();
