-- Fix: hook_legacy_college_ids was created as uuid[] but colleges.id is text.
-- Drops and recreates as text[]. Safe because the column was just added and
-- no valid data has been written (uuid type rejected the text IDs).
alter table public.user_stats
  drop column if exists hook_legacy_college_ids;

alter table public.user_stats
  add column hook_legacy_college_ids text[] default array[]::text[];
