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


export const INGESTION_REFRESH_INTERVAL_MS = 60_000;
export const INGESTION_PROJECTION_STALE_MS = 20 * 60_000;

function timestamp(value: string | null): number | null {
  if (!value || !/[T ].*(Z|[+-]\d{2}:\d{2})$/.test(value)) return null;
  const result = Date.parse(value);
  return Number.isFinite(result) ? result : null;
}

/** An elapsed scheduled time does not establish that a match actually took place. */
export function partitionIngestionRows(rows: IngestionCoverageRow[], now: number) {
  const current: IngestionCoverageRow[] = [];
  const pastUnresolved: IngestionCoverageRow[] = [];
  for (const row of rows) {
    if (row.ingestion_status === 'COMPLETED_TRACKED' || row.ingestion_status.endsWith('_EXCLUDED')) continue;
    const kickoff = timestamp(row.kickoff_at);
    if (kickoff !== null && kickoff <= now) pastUnresolved.push(row);
    else current.push(row);
  }
  return { current, pastUnresolved };
}

/** Use the oldest projection row, rather than claiming the whole read is as new as its first row. */
export function ingestionProjectionTime(rows: IngestionCoverageRow[]): string | null {
  if (!rows.length || rows.some((row) => timestamp(row.refreshed_at) === null)) return null;
  return rows.reduce((oldest, row) => Date.parse(row.refreshed_at) < Date.parse(oldest) ? row.refreshed_at : oldest,
    rows[0].refreshed_at);
}

export function isIngestionProjectionStale(rows: IngestionCoverageRow[], now: number): boolean {
  const value = ingestionProjectionTime(rows);
  if (!rows.length) return false;
  return value === null || now - Date.parse(value) > INGESTION_PROJECTION_STALE_MS;
}

export function ingestionObservation(row: IngestionCoverageRow): { label: string; at: string | null } {
  if (row.snapshot_count > 0 && timestamp(row.last_snapshot_at) !== null) {
    return { label: 'Inventory', at: row.last_snapshot_at };
  }
  if (row.raw_snapshot_count > 0 && timestamp(row.last_raw_snapshot_at) !== null) {
    return { label: 'Surowe inventory', at: row.last_raw_snapshot_at };
  }
  return { label: 'Źródło widziano; brak obserwacji inventory',
    at: timestamp(row.last_seen_at) === null ? null : row.last_seen_at };
}
