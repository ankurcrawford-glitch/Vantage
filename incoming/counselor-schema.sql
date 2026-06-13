-- ─── Vantage Foundations — Counselor Chat schema ─────────────────
-- Run in Supabase SQL editor. Includes RLS (closing one of your
-- open security items for this table from day one).

-- Chat messages: used for history display, monthly cap counting,
-- and as raw material for thread analysis later.
create table if not exists counselor_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists counselor_messages_user_month_idx
  on counselor_messages (user_id, created_at desc);

-- RLS: users read only their own messages. Writes go through the
-- API route (service role), so no insert policy for users needed.
alter table counselor_messages enable row level security;

create policy "Users can read own counselor messages"
  on counselor_messages for select
  using (auth.uid() = user_id);

-- Ensure profiles has the narrative summary + grade the route reads.
-- (Skip if these columns already exist.)
alter table profiles
  add column if not exists narrative_summary text,
  add column if not exists grade int check (grade between 9 and 12);
