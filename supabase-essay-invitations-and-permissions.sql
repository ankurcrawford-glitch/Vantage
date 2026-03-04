-- Run this in Supabase SQL Editor to create the tables needed for commenter invitations.
-- Run once. Safe to run again (creates only if not exist).

-- 1. essay_invitations: one row per invite; token is used in the link /invitations/{token}
create table if not exists public.essay_invitations (
  id uuid primary key default gen_random_uuid(),
  essay_id uuid not null references public.essays(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  invitee_email text not null,
  invitee_name text,
  role text not null default 'parent',
  token text not null default gen_random_uuid()::text unique,
  created_at timestamptz not null default now()
);

create index if not exists idx_essay_invitations_essay_id on public.essay_invitations(essay_id);
create index if not exists idx_essay_invitations_token on public.essay_invitations(token);

comment on table public.essay_invitations is 'Invitation links for counselors/commenters; token used in URL /invitations/{token}';

-- 2. essay_permissions: who can view/comment on an essay (besides the owner)
create table if not exists public.essay_permissions (
  id uuid primary key default gen_random_uuid(),
  essay_id uuid not null references public.essays(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(essay_id, user_id)
);

create index if not exists idx_essay_permissions_essay_id on public.essay_permissions(essay_id);
create index if not exists idx_essay_permissions_user_id on public.essay_permissions(user_id);

comment on table public.essay_permissions is 'Who can view/comment on an essay (e.g. invited counselors)';

-- 3. RLS
alter table public.essay_invitations enable row level security;
alter table public.essay_permissions enable row level security;

-- essay_invitations: essay owner can insert; authenticated can read (owner lists invites, invitee loads by token on accept page)
drop policy if exists "essay_invitations_select" on public.essay_invitations;
create policy "essay_invitations_select" on public.essay_invitations
  for select to authenticated using (true);

drop policy if exists "essay_invitations_insert_owner" on public.essay_invitations;
create policy "essay_invitations_insert_owner" on public.essay_invitations
  for insert to authenticated with check (
    student_id = auth.uid() and exists (select 1 from public.essays e where e.id = essay_id and e.user_id = auth.uid())
  );

-- essay_permissions: invitee can insert when accepting (we need to allow insert for the user accepting); owner can read
drop policy if exists "essay_permissions_select" on public.essay_permissions;
create policy "essay_permissions_select" on public.essay_permissions
  for select to authenticated using (true);

drop policy if exists "essay_permissions_insert" on public.essay_permissions;
create policy "essay_permissions_insert" on public.essay_permissions
  for insert to authenticated with check (user_id = auth.uid());
