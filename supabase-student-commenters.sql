-- Run in Supabase SQL Editor. Adds a simple "up to 5 commenters" list per student (no invitation emails).
-- Those people can view/comment when they log in and use the essay link the student shares.

create table if not exists public.student_commenters (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  commenter_email text not null,
  created_at timestamptz not null default now(),
  unique(student_id, commenter_email)
);

create index if not exists idx_student_commenters_student_id on public.student_commenters(student_id);
create index if not exists idx_student_commenters_email on public.student_commenters(commenter_email);

comment on table public.student_commenters is 'Up to 5 people per student who can view/comment on their essays (by email). No invitation email.';

alter table public.student_commenters enable row level security;

-- Student can manage their own list; commenter can read rows where their email matches (for permission check)
drop policy if exists "student_commenters_select_own" on public.student_commenters;
create policy "student_commenters_select_own" on public.student_commenters
  for select to authenticated using (student_id = auth.uid());

drop policy if exists "student_commenters_select_as_commenter" on public.student_commenters;
create policy "student_commenters_select_as_commenter" on public.student_commenters
  for select to authenticated using (
    commenter_email = (auth.jwt() ->> 'email')
  );

drop policy if exists "student_commenters_insert" on public.student_commenters;
create policy "student_commenters_insert" on public.student_commenters
  for insert to authenticated with check (student_id = auth.uid());

drop policy if exists "student_commenters_delete" on public.student_commenters;
create policy "student_commenters_delete" on public.student_commenters
  for delete to authenticated using (student_id = auth.uid());
