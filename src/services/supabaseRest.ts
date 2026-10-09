const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://adchzwqboeekhokapxqi.supabase.co';

const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_e2sNL6YAjIYtl5XYEcPOcg_IlluFyeS';

const PAGE_SIZE = 1000;

interface FetchRowsOptions {
  select: string;
  order?: string;
}

/**
 * Minimal PostgREST client for the public, read-only dashboard projection.
 * The publishable key is intentionally low-privilege; Supabase RLS + column grants
 * define the actual data surface available to the browser.
 */
export async function fetchRows<T>(
  table: string,
  { select, order }: FetchRowsOptions
): Promise<T[]> {
  const rows: T[] = [];
  let offset = 0;

  while (true) {
    const params = new URLSearchParams({ select });
    if (order) params.set('order', order);

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`,
      {
        headers: {
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Accept: 'application/json',
          Range: `${offset}-${offset + PAGE_SIZE - 1}`,
          'Range-Unit': 'items'
        }
      }
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Supabase ${table} read failed (${response.status}): ${body}`);
    }

    const page = (await response.json()) as T[];
    rows.push(...page);

    if (page.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return rows;
}
