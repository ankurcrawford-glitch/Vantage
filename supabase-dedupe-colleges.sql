-- Consolidate duplicate college rows (defensive version).
--
-- Each dedup is wrapped in a DO block that verifies both the canonical and
-- the duplicate actually exist before doing anything. If either side is
-- missing, the block logs a NOTICE and skips — no error, no rollback.
-- This makes the script safe even when my assumptions about which id is
-- "canonical" turn out to be wrong (as happened for washu, where only
-- the -in-st-louis version exists).
--
-- Safe to run multiple times.

-- Helper: merge source into target.
--   1. Delete source's user_colleges row for users who already have target.
--   2. Repoint remaining user_colleges from source -> target.
--   3. Repoint college_prompts from source -> target.
--   4. Delete the source college row.

do $$
declare
  pairs text[][] := array[
    -- [target, source]. Target is the id to KEEP. Source gets merged in and deleted.
    array['yale-university', 'a0000000-0000-0000-0000-000000000003'],
    array['university-of-pennsylvania', 'a0000000-0000-0000-0000-000000000009'],
    array['university-of-southern-california', 'a0000000-0000-0000-0000-000000000014'],
    array['university-of-michigan-ann-arbor', 'a0000000-0000-0000-0000-000000000015'],
    array['university-of-michigan-ann-arbor', 'university-of-michigan-fxgbiq'],
    array['washington-university-in-st-louis', 'washington-university-st-louis'],
    array['unc-chapel-hill', 'university-of-north-carolina-at-chapel-hill'],
    array['university-of-texas-austin', 'university-of-texas-at-austin'],
    array['university-of-illinois-urbana-champaign', 'university-of-illinois-urbanachampaign']
  ];
  pair text[];
  target_id text;
  source_id text;
  target_exists boolean;
  source_exists boolean;
begin
  foreach pair slice 1 in array pairs loop
    target_id := pair[1];
    source_id := pair[2];

    select exists(select 1 from public.colleges where id = target_id) into target_exists;
    select exists(select 1 from public.colleges where id = source_id) into source_exists;

    if not target_exists and not source_exists then
      raise notice 'Skipped % -> %: neither exists', source_id, target_id;
      continue;
    end if;

    if not source_exists then
      raise notice 'Skipped % -> %: source already gone', source_id, target_id;
      continue;
    end if;

    if not target_exists then
      -- Target is the one I picked as canonical, but it doesn't exist.
      -- Flip direction: rename source into target by inserting target from
      -- source then proceeding. But safer: just skip and flag for human.
      raise notice 'Skipped % -> %: target does not exist (canonical missing; fix manually)', source_id, target_id;
      continue;
    end if;

    -- Both exist. Merge.
    delete from public.user_colleges dup
      using public.user_colleges canon
      where dup.college_id = source_id
        and canon.college_id = target_id
        and dup.user_id = canon.user_id;

    update public.user_colleges set college_id = target_id where college_id = source_id;
    update public.college_prompts set college_id = target_id where college_id = source_id;
    delete from public.colleges where id = source_id;

    raise notice 'Merged % into %', source_id, target_id;
  end loop;
end $$;

-- After running, the Messages panel in Supabase SQL Editor will show one
-- NOTICE per pair ("Merged X into Y" or "Skipped X -> Y: reason").

-- Verify: should return zero rows once everything that can be merged has been.
select id, name
from public.colleges
where id in (
  'a0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000009',
  'a0000000-0000-0000-0000-000000000014',
  'a0000000-0000-0000-0000-000000000015',
  'university-of-michigan-fxgbiq',
  'washington-university-st-louis',
  'university-of-north-carolina-at-chapel-hill',
  'university-of-texas-at-austin',
  'university-of-illinois-urbanachampaign'
);

select count(*) as total_colleges from public.colleges;
