-- ─── Class-of rollover ───────────────────────────────────────────
-- Grade is now DERIVED from user_stats.class_of (graduation year) and
-- today's date (school year rolls Aug 1), via lib/grade.ts. This adds
-- the column and backfills it from the legacy grade column.
--
-- Backfill assumption: each stored grade is treated as the student's
-- CURRENT grade (identical behavior to before this change). Any student
-- whose stored grade was already stale should be fixed by hand once:
--   update user_stats set class_of = <year>, grade = <grade>
--   where user_id = (select id from auth.users where email = '...');
-- After that, their grade rolls automatically every August forever.

alter table user_stats add column if not exists class_of integer;

update user_stats
set class_of = (case when extract(month from now()) >= 8
                     then extract(year from now())::int + 1
                     else extract(year from now())::int end) + (12 - grade)
where class_of is null and grade between 9 and 12;

select
  count(*) filter (where class_of is not null) as rows_with_class_of,
  count(*) as total_rows
from user_stats;
