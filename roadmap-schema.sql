-- ─── Vantage Foundations — Roadmap progress schema ───────────────
-- Run in Supabase SQL editor. Tracks which roadmap items a student has
-- checked off. Items themselves are a versioned template in the app;
-- each has a stable item_key (e.g. '11-sat-act').

create table if not exists roadmap_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_key text not null,
  done_at timestamptz not null default now(),
  primary key (user_id, item_key)
);

alter table roadmap_progress enable row level security;

create policy "Users can read own roadmap progress"
  on roadmap_progress for select
  using (auth.uid() = user_id);
