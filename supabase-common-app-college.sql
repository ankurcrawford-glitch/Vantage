-- Run this in Supabase SQL Editor once so Common App essays can be saved.
-- college_prompts.college_id references colleges(id); this row is required.
-- If your colleges table has different columns, adjust the insert to match.

insert into public.colleges (id, name, location)
values ('common-app', 'Common App', 'N/A')
on conflict (id) do nothing;
