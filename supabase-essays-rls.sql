-- Run this in Supabase SQL Editor if saving essays fails with a "policy" or "RLS" error.
-- It allows authenticated users to INSERT/SELECT/UPDATE their own rows in essays and essay_versions.

-- Essays: users can do everything on their own rows (user_id = auth.uid())
alter table if exists public.essays enable row level security;

drop policy if exists "Users can read own essays" on public.essays;
create policy "Users can read own essays"
  on public.essays for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own essays" on public.essays;
create policy "Users can insert own essays"
  on public.essays for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own essays" on public.essays;
create policy "Users can update own essays"
  on public.essays for update
  using (auth.uid() = user_id);

-- Essay versions: users can do everything on versions that belong to their essays
alter table if exists public.essay_versions enable row level security;

drop policy if exists "Users can read versions of own essays" on public.essay_versions;
create policy "Users can read versions of own essays"
  on public.essay_versions for select
  using (
    exists (
      select 1 from public.essays e
      where e.id = essay_versions.essay_id and e.user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert versions for own essays" on public.essay_versions;
create policy "Users can insert versions for own essays"
  on public.essay_versions for insert
  with check (
    exists (
      select 1 from public.essays e
      where e.id = essay_versions.essay_id and e.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update versions of own essays" on public.essay_versions;
create policy "Users can update versions of own essays"
  on public.essay_versions for update
  using (
    exists (
      select 1 from public.essays e
      where e.id = essay_versions.essay_id and e.user_id = auth.uid()
    )
  );
