import type { SupabaseClient } from '@supabase/supabase-js';

export type UserStatsRow = {
  gpa_weighted: number | null;
  gpa_unweighted: number | null;
  sat_score: number | null;
  act_score: number | null;
};

/**
 * Persists user_stats without relying on PostgREST upsert (avoids duplicate-key
 * errors when merge-duplicates / on_conflict does not apply as expected).
 */
export async function saveUserStats(
  supabase: SupabaseClient,
  userId: string,
  row: UserStatsRow
) {
  const { data: existing, error: selectError } = await supabase
    .from('user_stats')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (selectError) {
    return { error: selectError };
  }

  if (existing) {
    return supabase.from('user_stats').update(row).eq('user_id', userId);
  }

  return supabase.from('user_stats').insert({ user_id: userId, ...row });
}
