-- Add geographic preference field to user_stats.
-- Values: 'in-state', 'regional', 'no-preference', 'out-of-state'
-- Null is treated as 'no-preference' (no filtering).

alter table public.user_stats
  add column if not exists geo_preference text;

-- Optional: constrain to valid values (skipped to keep migration easy to roll back)
-- alter table public.user_stats
--   add constraint user_stats_geo_preference_check
--   check (geo_preference is null or geo_preference in ('in-state','regional','no-preference','out-of-state'));
