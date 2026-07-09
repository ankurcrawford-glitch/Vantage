-- 2026-27 prompt release updates — checked 2026-07-09 (preempting Friday run)
-- Source: internationalcollegecounselors.com/in-the-essay (updated 2026-07-08)
-- Pattern: unchanged prompts -> mark released; changed -> update text in place;
-- colleges with no rows -> insert; no-supplement colleges -> retire (cycle 2025-26).

update college_prompts set cycle='2026-27', released_at=now(), year=2026 where college_id=(select id from colleges where name='Common Application');
update college_prompts set cycle='2026-27', released_at=now(), year=2026 where college_id=(select id from colleges where name='University of California - Merced');
update college_prompts set cycle='2026-27', released_at=now(), year=2026 where college_id=(select id from colleges where name='University of California, Davis');
update college_prompts set cycle='2026-27', released_at=now(), year=2026 where college_id=(select id from colleges where name='University of California, Irvine');
update college_prompts set cycle='2026-27', released_at=now(), year=2026 where college_id=(select id from colleges where name='University of California, Santa Barbara');
update college_prompts set cycle='2026-27', released_at=now(), year=2026 where college_id=(select id from colleges where name='Boston College');
update college_prompts set cycle='2026-27', released_at=now(), year=2026 where college_id=(select id from colleges where name='Northwestern University');
-- Georgia Institute of Technology: replace text in place
update college_prompts set prompt_text='Why do you want to study your chosen major, and why do you want to study that major at Georgia Tech?', word_limit=300, cycle='2026-27', released_at=now(), year=2026
where id=(select id from college_prompts where college_id=(select id from colleges where name='Georgia Institute of Technology') order by sort_order, created_at offset 0 limit 1);
-- University of Michigan - Ann Arbor: replace text in place
update college_prompts set prompt_text='At the University of Michigan, we are focused on developing leaders and citizens who will challenge the present and enrich the future. In your essay, share with us how you are prepared to contribute to these goals. This could include the people, places, experiences, or aspirations that have shaped your journey and future plans.', word_limit=300, cycle='2026-27', released_at=now(), year=2026
where id=(select id from college_prompts where college_id=(select id from colleges where name='University of Michigan - Ann Arbor') order by sort_order, created_at offset 0 limit 1);
update college_prompts set prompt_text='Describe the unique qualities that attract you to the specific undergraduate college or school (including preferred admission and dual degree programs) to which you are applying at the University of Michigan. How would that curriculum support your interests?', word_limit=550, cycle='2026-27', released_at=now(), year=2026
where id=(select id from college_prompts where college_id=(select id from colleges where name='University of Michigan - Ann Arbor') order by sort_order, created_at offset 1 limit 1);
-- Tufts University: replace text in place
update college_prompts set prompt_text='Please describe how you have learned about and engaged with Tufts during your college search process.', word_limit=150, cycle='2026-27', released_at=now(), year=2026
where id=(select id from college_prompts where college_id=(select id from colleges where name='Tufts University') order by sort_order, created_at offset 0 limit 1);
update college_prompts set prompt_text='Tell us about one of your favorite school assignments in the past two years. What was the assignment and why did you enjoy it? (Arts & Sciences applicants; Engineering and BFA applicants answer their program''s variant in the application.)', word_limit=200, cycle='2026-27', released_at=now(), year=2026
where id=(select id from college_prompts where college_id=(select id from colleges where name='Tufts University') order by sort_order, created_at offset 1 limit 1);
-- University of Chicago: replace text in place
update college_prompts set prompt_text='How does the University of Chicago, as you know it now, satisfy your desire for a particular kind of learning, community, and future? Please address with some specificity your own wishes and how they relate to UChicago.', word_limit=650, cycle='2026-27', released_at=now(), year=2026
where id=(select id from college_prompts where college_id=(select id from colleges where name='University of Chicago') order by sort_order, created_at offset 0 limit 1);
update college_prompts set prompt_text='Extended Essay - choose one: (1) Food for thought: How do thoughts eat? (2) The James Webb Space Telescope used origami-inspired techniques to compactly store and deploy its sunshield. Choose an artistic practice and use its principles to propose an elegant solution to a problem. (3) Make up your own mixed metaphor (like ''we''''ll burn that bridge when we get there''). Explain how it could make sense, be understood, or even applied. (4) Imagine a new Olympic event built around an everyday activity like speed dishwashing or competitive grocery bagging. How is it scored, officiated, and judged? Why is it a worthy addition? (5) Share a potentially confounding, comedic, or captivating example of MIA (Mistaken Identity of Acronym) and tell us its backstory. (6) Choose one of UChicago''''s past prompts or create a question of your own - be original, creative, thought provoking, take a little risk, and have fun!', word_limit=650, cycle='2026-27', released_at=now(), year=2026
where id=(select id from college_prompts where college_id=(select id from colleges where name='University of Chicago') order by sort_order, created_at offset 1 limit 1);
-- Georgetown University: replace text in place
update college_prompts set prompt_text='Briefly discuss the significance to you of the school or summer activity in which you have been most involved.', word_limit=250, cycle='2026-27', released_at=now(), year=2026
where id=(select id from college_prompts where college_id=(select id from colleges where name='Georgetown University') order by sort_order, created_at offset 0 limit 1);
update college_prompts set prompt_text='In all our lives, we interact with people who hold different viewpoints than our own. Describe such an event you experienced. What did you learn from the experience?', word_limit=250, cycle='2026-27', released_at=now(), year=2026
where id=(select id from college_prompts where college_id=(select id from colleges where name='Georgetown University') order by sort_order, created_at offset 1 limit 1);
update college_prompts set prompt_text='As Georgetown is a diverse community, the Admissions Committee would like to know more about you in your own words. Please submit a brief personal or creative essay which you feel best describes you and reflects on your personal background and individual experiences, skills, and talents.', word_limit=650, cycle='2026-27', released_at=now(), year=2026
where id=(select id from college_prompts where college_id=(select id from colleges where name='Georgetown University') order by sort_order, created_at offset 2 limit 1);
update college_prompts set prompt_text='School-specific essay: describe your interest in studying at your chosen Georgetown school (College of Arts & Sciences, Nursing, Health, Foreign Service, Business, or Public Policy) - see the Georgetown application for your school''''s exact wording.', word_limit=500, cycle='2026-27', released_at=now(), year=2026
where id=(select id from college_prompts where college_id=(select id from colleges where name='Georgetown University') order by sort_order, created_at offset 3 limit 1);
-- George Washington University: new prompts (no prior rows)
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Optional - choose one: (1) At the George Washington University, our students frequently interact with policymakers and world leaders. If you had the power to change the course of history in your community or the world, what would you do and why? (2) Civil discourse is a key characteristic of our community. Describe a time when you engaged others in meaningful dialogue around an issue that was important to you. Did this exchange create change, new perspectives, or deeper relationships?', 500, 2026, 1, '2026-27', now() from colleges where name='George Washington University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');
-- Villanova University: new prompts (no prior rows)
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Choose one of five: (1) As Pope Leo XIV (Villanova Class of 1977) has said, ''no one can single-handedly bear the weight of the challenges the world is facing, just as no one is so weak that they cannot play their part.'' What have you done to play your part in advancing equity and justice in your community? (2) What is a lesson in life that you have learned that you would want to share with others at Villanova? (3) ''Villanova'' means ''new home.'' Why do you want to call Villanova your new home? (4) Villanova embraces AI with a commitment to thoughtful, ethical use rooted in our Augustinian mission and values. How do you see technology helping you to lead, serve, and contribute to the common good? (5) At Villanova, we often say ''each of us strengthens all of us.'' Please detail a time when someone has borrowed some of your strength in their time of need.', 250, 2026, 1, '2026-27', now() from colleges where name='Villanova University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');
-- Purdue University: new prompts (no prior rows)
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'How will opportunities at Purdue support your interests, both in and out of the classroom?', 250, 2026, 1, '2026-27', now() from colleges where name='Purdue University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Briefly discuss your reasons for pursuing the major you have selected.', 250, 2026, 2, '2026-27', now() from colleges where name='Purdue University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=2 and p.cycle='2026-27');
-- Texas A&M University: new prompts (no prior rows)
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Tell us your story. What unique opportunities or challenges have you experienced throughout your high school career that have shaped who you are today?', 750, 2026, 1, '2026-27', now() from colleges where name='Texas A&M University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Describe a life event which you feel has prepared you to be successful in college.', 250, 2026, 2, '2026-27', now() from colleges where name='Texas A&M University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=2 and p.cycle='2026-27');
-- University of Richmond: new prompts (no prior rows)
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Choose one of three: (1) Richmond is a community that strives to be relentlessly welcoming. Tell us about a time you made a space better for other people by helping them feel welcome, heard, included, or supported. (2) Richmond students turn ideas into actions. Tell us about a time you learned by doing, making, building, testing, helping, or leading and what that experience taught you about yourself, the world, or the kind of impact you want to have. (3) Richmond''s mascot is the Spider. Tell us about the communities, experiences, or ambitions that have shaped you into the unique person you are and how you will make your mark as part of a Spider community.', 650, 2026, 1, '2026-27', now() from colleges where name='University of Richmond'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');
-- University of San Diego: new prompts (no prior rows)
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'How did you first learn about the University of San Diego, and what inspired you to apply?', 350, 2026, 1, '2026-27', now() from colleges where name='University of San Diego'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Choose one: (1) What does community mean to you and how have you helped create a welcoming environment for others? (2) As a Changemaker Campus, USD challenges students to pursue a more just, sustainable and equitable world. What is a challenge facing humanity today and why does it matter to you? (3) Share an experience that highlights the ways faith or spirituality - either your own or someone else''s - have influenced your life.', 350, 2026, 2, '2026-27', now() from colleges where name='University of San Diego'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=2 and p.cycle='2026-27');
-- Colorado College: new prompts (no prior rows)
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'One of the benefits of Colorado College''s Block Plan is the opportunity to immerse yourself fully in a single subject for 3.5 weeks. We see this as the luxury of focus - the joy and value of directing your full attention to one thing. Tell us about a time when you experienced this kind of deep focus in an academic or extracurricular setting. What were you doing and how did it turn out?', 300, 2026, 1, '2026-27', now() from colleges where name='Colorado College'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');
-- Macalester College: new prompts (no prior rows)
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Macalester is one of few highly selective liberal arts colleges located in the middle of a metropolitan area. Identify one way that Macalester''s urban location would enhance your academic, social, and/or community experiences.', 300, 2026, 1, '2026-27', now() from colleges where name='Macalester College'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Four values permeate Macalester''s mission and purpose: academic distinction, internationalism, multiculturalism, and service to society. In what ways do your lived experiences, perspectives, or hopes for your college education connect with Macalester''s mission and community?', 300, 2026, 2, '2026-27', now() from colleges where name='Macalester College'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=2 and p.cycle='2026-27');
-- Lafayette College: new prompts (no prior rows)
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Why Lafayette? Students identify Lafayette as an excellent fit for countless reasons. In your response, be deliberate and specific about your motivation for applying to Lafayette. Why do you see yourself at Lafayette?', 200, 2026, 1, '2026-27', now() from colleges where name='Lafayette College'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');
-- Tulane dropped supplemental essays for 2026-27: retire old rows (not marked released)
update college_prompts set cycle='2025-26' where college_id=(select id from colleges where name='Tulane University');

select count(*) filter (where cycle='2026-27') as released_2026_27, count(*) as total from college_prompts;
