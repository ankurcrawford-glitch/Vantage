-- ─── Vantage Foundations — Activities schema ─────────────────────
-- Run in Supabase SQL editor. The Conversation auto-suggests activities
-- (source='conversation', confirmed=false) which the student confirms,
-- edits, or removes on the Activities page. Student-added rows are
-- confirmed from the start.

create table if not exists foundations_activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  role text not null default '',
  since text not null default '',
  hours text not null default '',
  depth int not null default 1 check (depth between 1 and 5),
  thread text not null default '',
  trajectory text not null default '',
  source text not null default 'student' check (source in ('student', 'conversation')),
  confirmed boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists foundations_activities_user_idx
  on foundations_activities (user_id, created_at);

-- RLS: users read their own; writes go through the API route (service role).
alter table foundations_activities enable row level security;

create policy "Users can read own activities"
  on foundations_activities for select
  using (auth.uid() = user_id);
