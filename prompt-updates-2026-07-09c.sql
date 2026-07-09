-- Split combined multi-part prompts into one row per writing task
-- Cornell Engineering only: 2 essays + 4 short answers, one row each. (Yale left as-is per Ankur.)

update college_prompts set sort_order=12 where college_id=(select id from colleges where name='Cornell University') and cycle='2026-27' and sort_order=7;
update college_prompts set sort_order=13 where college_id=(select id from colleges where name='Cornell University') and cycle='2026-27' and sort_order=8;
delete from college_prompts where college_id=(select id from colleges where name='Cornell University') and cycle='2026-27' and sort_order=6 and not exists (select 1 from essays e where e.college_prompt_id=college_prompts.id);
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Cornell — College of Engineering, Essay 1 of 2: Fundamentally, engineering is the application of math, science, and technology to solve complex problems. Why do you want to study engineering?', 200, 2026, 6, '2026-27', now() from colleges where name='Cornell University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=6 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Cornell — College of Engineering, Essay 2 of 2: Why do you think you would love to study at Cornell Engineering?', 200, 2026, 7, '2026-27', now() from colleges where name='Cornell University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=7 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Cornell — College of Engineering, Short answer 1 of 4: What brings you joy?', 100, 2026, 8, '2026-27', now() from colleges where name='Cornell University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=8 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Cornell — College of Engineering, Short answer 2 of 4: What do you believe you will contribute to the Cornell Engineering community beyond what you''ve already detailed in your application? What unique voice will you bring?', 100, 2026, 9, '2026-27', now() from colleges where name='Cornell University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=9 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Cornell — College of Engineering, Short answer 3 of 4: What is one activity, club, team, organization, work/volunteer experience or family responsibility that is especially meaningful to you? Please briefly tell us about its significance for you.', 100, 2026, 10, '2026-27', now() from colleges where name='Cornell University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=10 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Cornell — College of Engineering, Short answer 4 of 4: What is one award you have received or achievement you have attained that has meant the most to you? Please briefly describe its importance to you.', 100, 2026, 11, '2026-27', now() from colleges where name='Cornell University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=11 and p.cycle='2026-27');

select (select count(*) from college_prompts where college_id=(select id from colleges where name='Cornell University') and cycle='2026-27') as cornell_prompts;
