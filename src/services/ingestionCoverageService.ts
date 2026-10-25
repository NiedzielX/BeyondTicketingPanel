import { fetchRows } from './supabaseRest';

export type IngestionStatus =
  | 'TRACKED'
  | 'TRACKED_NO_SNAPSHOT'
  | 'COMPLETED_TRACKED'
  | 'BUFFERING_AWAITING_KICKOFF'
  | 'BUFFERING_AWAITING_FIXTURE'
  | 'READY_TO_PROMOTE'
  | 'MATCH_DISCOVERED_NO_BUFFER'
  | 'HIDDEN_AVAILABILITY'
  | 'SCHEDULE_GAP'
  | 'NON_MATCH_EXCLUDED'
  | 'NON_FOOTBALL_EXCLUDED'
  | 'NON_LEAGUE_EXCLUDED'
  | 'UNKNOWN_EXCLUDED';

export interface IngestionCoverageRow {
  record_key: string;
  record_type: 'tracked' | 'candidate' | 'schedule_gap';
  club_slug: string | null;
  club_name: string | null;
  external_event_id: string | null;
  label: string | null;
  candidate_kind: string | null;
  ingestion_status: IngestionStatus;
  kickoff_at: string | null;
  ticket_event_id: number | null;
  snapshot_count: number;
  first_snapshot_at: string | null;
  last_snapshot_at: string | null;
  raw_snapshot_count: number;
  first_raw_snapshot_at: string | null;
  last_raw_snapshot_at: string | null;
  source_url: string | null;
  mapping_source: string | null;
  issue_reason: string | null;
  first_seen_at: string | null;
  last_seen_at: string | null;
  refreshed_at: string;
}

const EXCLUDED = new Set<IngestionStatus>([
  'NON_MATCH_EXCLUDED',
  'NON_FOOTBALL_EXCLUDED',
  'NON_LEAGUE_EXCLUDED',
  'UNKNOWN_EXCLUDED'
]);

export function isProtectedBufferStatus(status: IngestionStatus): boolean {
  return status === 'BUFFERING_AWAITING_KICKOFF' || status === 'BUFFERING_AWAITING_FIXTURE';
}

export function isActionableIngestionStatus(status: IngestionStatus): boolean {
  return [
    'SCHEDULE_GAP',
    'TRACKED_NO_SNAPSHOT',
    'READY_TO_PROMOTE',
    'MATCH_DISCOVERED_NO_BUFFER',
    'BUFFERING_AWAITING_KICKOFF',
    'BUFFERING_AWAITING_FIXTURE',
    'HIDDEN_AVAILABILITY'
  ].includes(status);
}

export function ingestionStatusLabel(status: IngestionStatus): string {
  switch (status) {
    case 'TRACKED': return 'Śledzony';
    case 'TRACKED_NO_SNAPSHOT': return 'Śledzony • czeka na inventory';
    case 'COMPLETED_TRACKED': return 'Zakończony — dane zachowane';
    case 'BUFFERING_AWAITING_KICKOFF': return 'Krzywa zabezpieczona • czeka na kickoff';
    case 'BUFFERING_AWAITING_FIXTURE': return 'Krzywa zabezpieczona • czeka na fixture';
    case 'READY_TO_PROMOTE': return 'Gotowy do podpięcia';
    case 'MATCH_DISCOVERED_NO_BUFFER': return 'Wykryty — brak bufora';
    case 'HIDDEN_AVAILABILITY': return 'Źródło ukrywa availability';
    case 'SCHEDULE_GAP': return 'Brak eventu ze źródła';
    case 'NON_MATCH_EXCLUDED': return 'Produkt wykluczony';
    case 'NON_FOOTBALL_EXCLUDED': return 'Poza piłką — wykluczony';
    case 'NON_LEAGUE_EXCLUDED': return 'Poza ligą — wykluczony';
    case 'UNKNOWN_EXCLUDED': return 'Niejednoznaczny — wykluczony';
  }
}

export const ingestionCoverageService = {
  async getRows(): Promise<IngestionCoverageRow[]> {
    return fetchRows<IngestionCoverageRow>('dashboard_ticketing_ingestion_status_v1', {
      select: 'record_key,record_type,club_slug,club_name,external_event_id,label,candidate_kind,ingestion_status,kickoff_at,ticket_event_id,snapshot_count,first_snapshot_at,last_snapshot_at,raw_snapshot_count,first_raw_snapshot_at,last_raw_snapshot_at,source_url,mapping_source,issue_reason,first_seen_at,last_seen_at,refreshed_at',
      order: 'kickoff_at.asc,club_name.asc'
    });
  },

  async getOperationalRows(): Promise<IngestionCoverageRow[]> {
    const rows = await this.getRows();
    return rows.filter((row) => !EXCLUDED.has(row.ingestion_status));
  }
};
