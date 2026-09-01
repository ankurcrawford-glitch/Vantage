-- Vantage: ED II round + support request storage

-- 1. ED II deadlines. available_rounds already says which schools offer
--    ED2; approximate the date with the RD deadline (ED II deadlines are
--    almost always the same early-January date) until trued up per school.
alter table colleges add column if not exists deadline_ed2 date;
update colleges
  set deadline_ed2 = deadline_rd
  where deadline_ed2 is null
    and available_rounds is not null
    and 'ED2' = any(available_rounds)
    and deadline_rd is not null;

-- 2. Support requests — written by the server only (service role);
--    no client policies on purpose.
create table if not exists support_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  message text not null,
  page text,
  user_id uuid,
  status text not null default 'open',
  created_at timestamptz not null default now()
);
alter table support_requests enable row level security;

select
  (select count(*)::int from colleges where deadline_ed2 is not null) as ed2_schools,
  (select count(*)::int from support_requests) as support_rows;
