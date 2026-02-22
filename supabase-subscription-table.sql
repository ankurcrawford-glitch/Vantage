-- Run this in Supabase SQL Editor to enable the Insight Questions paywall.
-- After a user pays (Stripe), insert or update a row here so they can access /discovery.

create table if not exists public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active',
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

alter table public.user_subscriptions enable row level security;

create policy "Users can read own subscription"
  on public.user_subscriptions for select
  using (auth.uid() = user_id);

-- Insert/update from Stripe webhook using the service role key (bypasses RLS).
