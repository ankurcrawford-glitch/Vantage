-- ─── Vantage Foundations — Conversation (discovery) schema ───────
-- Run in Supabase SQL editor. Mirrors counselor_messages pattern (RLS on).

-- Persistent discovery conversation: full history is reloaded on every
-- visit so the student can leave and come back any time.
create table if not exists conversation_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists conversation_messages_user_idx
  on conversation_messages (user_id, created_at);

alter table conversation_messages enable row level security;

create policy "Users can read own conversation messages"
  on conversation_messages for select
  using (auth.uid() = user_id);

-- Running counselor notes distilled from the conversation. This is the
-- token-saving asset: hour-long chats send notes + recent messages only,
-- never the whole transcript.
alter table user_stats
  add column if not exists discovery_notes text;
