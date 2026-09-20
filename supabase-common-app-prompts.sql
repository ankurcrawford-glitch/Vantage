-- Fix: Common App prompts 3-7 cannot save (2026-09-16)
--
-- Root cause: the essay page looks up college_prompts by
-- (college_id = 'a0000000-0000-0000-0000-000000000000', sort_order = N).
-- Only prompts 1-2 had rows (created lazily from the browser by early users).
-- When RLS was enabled on college_prompts (public SELECT only), the browser
-- could no longer insert the missing rows for prompts 3-7, so saving failed.
-- This seeds all 7 rows once, server-side. Idempotent; no deletes.
--
-- Run in Supabase SQL Editor. Then run the two SELECTs at the bottom.

-- 1. Make sure the Common App "college" exists under the id the app uses.
insert into public.colleges (id, name)
values ('a0000000-0000-0000-0000-000000000000', 'Common Application')
on conflict (id) do nothing;

-- 2. Seed the 7 prompts (only where that sort_order is missing).
with prompts(sort_order, prompt_text) as (
  values
  (1, 'Some students have a background, identity, interest, or talent that is so meaningful they believe their application would be incomplete without it. If this sounds like you, then please share your story.'),
  (2, 'The lessons we take from obstacles we encounter can be fundamental to later success. Recount a time when you faced a challenge, setback, or failure. How did it affect you, and what did you learn from the experience?'),
  (3, 'Reflect on a time when you questioned or challenged a belief or idea. What prompted your thinking? What was the outcome?'),
  (4, 'Reflect on something that someone has done for you that has made you happy or thankful in a surprising way. How has this gratitude affected or motivated you?'),
  (5, 'Discuss an accomplishment, event, or realization that sparked a period of personal growth and a new understanding of yourself or others.'),
  (6, 'Describe a topic, idea, or concept you find so engaging that it makes you lose all track of time. Why does it captivate you? What or who do you turn to when you want to learn more?'),
  (7, 'Share an essay on any topic of your choice. It can be one you''ve already written, one that responds to a different prompt, or one of your own design.')
)
insert into public.college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select 'a0000000-0000-0000-0000-000000000000', p.prompt_text, 650, 2026, p.sort_order, '2026-27', now()
from prompts p
where not exists (
  select 1 from public.college_prompts cp
  where cp.college_id = 'a0000000-0000-0000-0000-000000000000'
    and cp.sort_order = p.sort_order
);

-- 3. Verify: expect exactly 7 rows, one per sort_order 1..7.
select sort_order, count(*) as rows, min(id::text) as id, min(cycle) as cycle
from public.college_prompts
where college_id = 'a0000000-0000-0000-0000-000000000000'
group by sort_order
order by sort_order;

-- 4. Sanity: any Common App essays already attached to these prompts?
select cp.sort_order, count(e.id) as essays
from public.college_prompts cp
left join public.essays e on e.college_prompt_id = cp.id
where cp.college_id = 'a0000000-0000-0000-0000-000000000000'
group by cp.sort_order
order by cp.sort_order;

-- If step 3 shows any sort_order with rows > 1, tell Claude - essays may be
-- split across duplicate rows and need a merge before deleting the extra.
