import type { SupabaseClient } from '@supabase/supabase-js';

export type UserStatsRow = {
  gpa_weighted: number | null;
  gpa_unweighted: number | null;
  sat_score: number | null;
  act_score: number | null;
};

/** Classifier / Strategy Profile fields on `user_stats`. */
export type UserStatsStrategyRow = {
  state: string | null;
  intended_major: string | null;
  ap_count: number;
  test_optional: boolean;
  hook_recruited_athlete: boolean;
  hook_first_gen: boolean;
  hook_urm: boolean;
  hook_low_income: boolean;
  hook_legacy_active: boolean;
  hook_legacy_college_ids: string[];
};

async function persistUserStatsFields(
  supabase: SupabaseClient,
  userId: string,
  fields: Record<string, unknown>
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
    return supabase.from('user_stats').update(fields).eq('user_id', userId);
  }

  return supabase.from('user_stats').insert({ user_id: userId, ...fields });
}

/**
 * Persists GPA / test scores without PostgREST upsert (avoids duplicate-key
 * errors when merge-duplicates / on_conflict does not apply as expected).
 */
export async function saveUserStats(
  supabase: SupabaseClient,
  userId: string,
  row: UserStatsRow
) {
  return persistUserStatsFields(supabase, userId, row as Record<string, unknown>);
}

/** Strategy profile (classifier) fields — same persistence pattern as {@link saveUserStats}. */
export async function saveUserStatsStrategy(
  supabase: SupabaseClient,
  userId: string,
  row: UserStatsStrategyRow
) {
  return persistUserStatsFields(supabase, userId, row as Record<string, unknown>);
}
