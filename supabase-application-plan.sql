-- Vantage: per-school application plan (ED / EA / REA / RD)
-- Students commit to a round for each school; the dashboard collapses
-- that school's deadline rows to the chosen round and can enforce the
-- one-ED rule.

alter table user_colleges add column if not exists application_plan text;

-- Students could already insert/delete their own rows but had no UPDATE
-- policy; the plan picker needs one.
do $$ begin
  create policy "Users update own user_colleges" on user_colleges
    for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

select count(*)::int as user_college_rows from user_colleges;
