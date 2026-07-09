-- School-specific prompts (Yale, Cornell), old-prompt cleanup, deadline seed
-- Applied 2026-07-09. Deadlines are the historically stable dates for the
-- 2026-27 cycle (ED/EA/REA Nov 1 2026 pattern); weekly Friday check verifies.

update college_prompts set cycle='2025-26' where college_id=(select id from colleges where name='Cornell University') and (cycle is null or cycle <> '2026-27');
update college_prompts set cycle='2025-26' where college_id=(select id from colleges where name='Yale University') and (cycle is null or cycle <> '2026-27');
update college_prompts set cycle='2025-26' where college_id=(select id from colleges where name='University of Virginia') and (cycle is null or cycle <> '2026-27');
-- Cornell University: 2026-27 school-specific prompts
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Cornell — College of Agriculture and Life Sciences (CALS): Why are you drawn to studying the major you have selected and specifically, why do you want to pursue this major at Cornell CALS? Share how your current interests, related experiences, and/or goals influenced your choice.', 500, 2026, 1, '2026-27', now() from colleges where name='Cornell University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Cornell — Architecture, Art, and Planning (AAP): How do your interests directly connect with your intended major at AAP? Why architecture (B.Arch), art (BFA), or urban and regional studies (URS)?', 650, 2026, 2, '2026-27', now() from colleges where name='Cornell University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=2 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Cornell — College of Arts & Sciences: At the College of Arts and Sciences, curiosity will be your guide. Discuss how your passion for learning is shaping your academic journey, and what areas of study or majors excite you and why.', 650, 2026, 3, '2026-27', now() from colleges where name='Cornell University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=3 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Cornell — Brooks School of Public Policy: Why are you interested in studying policy, and why do you want to pursue this major at Cornell''s Jeb E. Brooks School of Public Policy? Share how your current interests, related experiences, and/or goals influenced your choice.', 650, 2026, 4, '2026-27', now() from colleges where name='Cornell University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=4 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Cornell — SC Johnson College of Business: What kind of a business student are you? Using your personal, academic, or volunteer/work experiences, describe the topics or issues that you care about and why they are important to you.', 650, 2026, 5, '2026-27', now() from colleges where name='Cornell University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=5 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Cornell — College of Engineering: Two essays (200 words each): (1) Why do you want to study engineering? (2) Why would you love to study at Cornell Engineering? Plus four short answers (100 words each): what brings you joy; what you will contribute to the community; one especially meaningful activity; one award or achievement that means the most to you.', 200, 2026, 6, '2026-27', now() from colleges where name='Cornell University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=6 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Cornell — College of Human Ecology: Identify a challenge in your greater community or in the career/industry in which you are interested. Share how the CHE education and your CHE major of choice will help you address that challenge.', 600, 2026, 7, '2026-27', now() from colleges where name='Cornell University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=7 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Cornell — School of Industrial and Labor Relations (ILR): Using your personal, academic, or volunteer/work experiences, describe the topics or issues that you care about and why they are important to you. Show that your interests align with the ILR School.', 650, 2026, 8, '2026-27', now() from colleges where name='Cornell University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=8 and p.cycle='2026-27');
-- Yale University: 2026-27 school-specific prompts
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Yale — Academic Interests: Tell us about a topic or idea that excites you and is related to one or more academic areas you selected. Why are you drawn to it?', 200, 2026, 1, '2026-27', now() from colleges where name='Yale University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Yale — Short Takes (about 35 words each): (1) If you could teach any college course, write a book, or create an original piece of art of any kind, what would it be? (2) What is one aspect of yourself that you hope to grow or develop during college? (3) What is something about you that is not included anywhere else in your application?', 35, 2026, 2, '2026-27', now() from colleges where name='Yale University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=2 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Yale — Essay, choose one: (A) Reflect on a time you discussed an issue important to you with someone holding an opposing view. Why did you find the experience meaningful? (B) Reflect on your membership in a community to which you feel connected. Why is this community meaningful to you? You may define community however you like. (C) Reflect on an element of your personal experience that you feel will enrich your college. How has it shaped you?', 400, 2026, 3, '2026-27', now() from colleges where name='Yale University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=3 and p.cycle='2026-27');
-- PURGE all prior-cycle prompts. Rows referenced by student essays cannot be
-- deleted (FK) - they are retired (cycle 2025-26) and hidden by the app filter.
delete from college_prompts
where (cycle is distinct from '2026-27')
and not exists (select 1 from essays e where e.college_prompt_id = college_prompts.id);
update college_prompts set cycle='2025-26' where cycle is distinct from '2026-27' and cycle is distinct from '2025-26';

-- Schools that dropped supplemental essays for 2026-27 (only Common App needed)
alter table colleges add column if not exists no_supplement boolean not null default false;
update colleges set no_supplement=true where name in ('Tulane University','University of Georgia','University of Miami (FL)','University of North Carolina at Chapel Hill','University of Virginia','Texas Christian University');
-- Deadline seed (verify in weekly check as schools confirm)
update colleges set deadline_ea='2026-11-01', deadline_rd='2027-01-01' where name='Harvard University';
update colleges set deadline_ea='2026-11-01', deadline_rd='2027-01-02' where name='Yale University';
update colleges set deadline_ea='2026-11-01', deadline_rd='2027-01-01' where name='Princeton University';
update colleges set deadline_ed='2026-11-01', deadline_rd='2027-01-01' where name='Columbia University';
update colleges set deadline_ed='2026-11-01', deadline_rd='2027-01-05' where name='University of Pennsylvania';
update colleges set deadline_ed='2026-11-01', deadline_rd='2027-01-03' where name='Brown University';
update colleges set deadline_ed='2026-11-01', deadline_rd='2027-01-02' where name='Dartmouth College';
update colleges set deadline_ed='2026-11-01', deadline_rd='2027-01-02' where name='Cornell University';
update colleges set deadline_ea='2026-11-01', deadline_rd='2027-01-04' where name='Massachusetts Institute of Technology';
update colleges set deadline_ea='2026-11-01', deadline_rd='2027-01-05' where name='Stanford University';
update colleges set deadline_ed='2026-11-02', deadline_rd='2027-01-02' where name='Duke University';
update colleges set deadline_ed='2026-11-01', deadline_ea='2026-11-01', deadline_rd='2027-01-06' where name='University of Chicago';
update colleges set deadline_ed='2026-11-01', deadline_rd='2027-01-06' where name='Northwestern University';
update colleges set deadline_ed='2026-11-01', deadline_rd='2027-01-02' where name='Johns Hopkins University';
update colleges set deadline_ea='2026-11-01', deadline_rd='2027-01-10' where name='Georgetown University';
update colleges set deadline_ea='2026-11-01', deadline_rd='2027-02-01' where name='University of Michigan - Ann Arbor';
update colleges set deadline_ed='2026-11-01', deadline_ea='2026-11-01', deadline_rd='2027-01-05' where name='University of Virginia';
update colleges set deadline_ea='2026-10-15', deadline_rd='2027-01-15' where name='University of North Carolina at Chapel Hill';
update colleges set deadline_ea='2026-11-02', deadline_rd='2027-01-05' where name='Georgia Institute of Technology';
update colleges set deadline_ea='2026-11-01', deadline_rd='2027-01-15' where name='University of Southern California';
update colleges set deadline_ed='2026-11-01', deadline_rd='2027-01-05' where name='New York University';
update colleges set deadline_ed='2026-11-01', deadline_rd='2027-01-02' where name='Boston College';
update colleges set deadline_ed='2026-11-01', deadline_rd='2027-01-06' where name='Tufts University';
update colleges set deadline_ed='2026-11-01', deadline_rd='2027-01-01' where name='Emory University';
update colleges set deadline_ed='2026-11-01', deadline_rd='2027-01-01' where name='Vanderbilt University';
update colleges set deadline_ed='2026-11-01', deadline_rd='2027-01-04' where name='Rice University';
update colleges set deadline_ed='2026-11-01', deadline_rd='2027-01-02' where name='Washington University in St. Louis';
update colleges set deadline_ea='2026-11-01', deadline_rd='2027-01-02' where name='University of Notre Dame';
update colleges set deadline_rd='2026-11-30' where name='University of California, Los Angeles';
update colleges set deadline_rd='2026-11-30' where name='University of California, Berkeley';
update colleges set deadline_rd='2026-11-30' where name='University of California, San Diego';
update colleges set deadline_rd='2026-11-30' where name='University of California, Irvine';
update colleges set deadline_rd='2026-11-30' where name='University of California, Davis';
update colleges set deadline_rd='2026-11-30' where name='University of California, Santa Barbara';
update colleges set deadline_rd='2026-12-01' where name='University of Texas at Austin';
update colleges set deadline_ed='2026-11-01', deadline_rd='2027-01-03' where name='Amherst College';
update colleges set deadline_ed='2026-11-15', deadline_rd='2027-01-08' where name='Williams College';
update colleges set deadline_ed='2026-11-15', deadline_rd='2027-01-04' where name='Swarthmore College';
update colleges set deadline_ed='2026-11-15', deadline_rd='2027-01-08' where name='Pomona College';

select count(*) filter (where cycle='2026-27') as current_prompts, count(*) filter (where cycle='2025-26') as retired_left, count(*) as total from college_prompts;
