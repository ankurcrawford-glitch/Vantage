-- School context: name + city collected from the student, then classified
-- via LLM lookup into type / tier / opportunity context. Feeds the
-- Safety/Target/Reach classifier and the essay tools.
--
-- Idempotent: safe to run repeatedly.

alter table public.user_stats
  add column if not exists school_name text,
  add column if not exists school_city text,
  add column if not exists school_type text
    check (school_type in ('public','private','charter','magnet','parochial','homeschool','other')),
  add column if not exists school_tier text
    check (school_tier in ('top_feeder','strong','standard')),
  add column if not exists school_opportunity text
    check (school_opportunity in ('under_resourced','standard','well_resourced')),
  add column if not exists school_context text,          -- short "how colleges read your school" summary
  add column if not exists school_context_data jsonb,    -- raw lookup payload for audit/debug
  add column if not exists school_looked_up_at timestamptz;

comment on column public.user_stats.school_tier is
  'Private-school tier only. top_feeder = nationally known feeder with counselor placement pull; strong = regionally respected; standard = everything else. NULL for public schools.';
comment on column public.user_stats.school_opportunity is
  'Opportunity context, mostly meaningful for public schools. under_resourced = limited AP/IB offerings, high FRL rate, or similar — admissions reads achievement in context of opportunity.';
