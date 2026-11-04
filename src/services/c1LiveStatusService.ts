import { fetchRows } from './supabaseRest';
import { parseC1LiveStatus } from './c1LiveStatusContract';

export async function fetchC1LiveStatus() {
  return parseC1LiveStatus(await fetchRows<unknown>('dashboard_c1_shadow_v8_status_v1', { select: '*' }));
}
