-- 2026-27 comprehensive prompt load - generated 2026-08-13 by Claude for Ankur
-- Sources: official admissions pages, ICC in-the-essay tracker (2026-27),
-- gradgpt.com (verified vs Common App Aug 2026), collegeessayadvisors.com, ivycoach.com,
-- collegetransitions.com no-supplement list. Idempotent: inserts guarded by not-exists;
-- updates safe to re-run. NO deletes. Inserts no-op if a college name is missing.

-- ============ RELEASED 2026-27 PROMPTS ============
-- Harvard University
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'How will the life experiences that shaped who you are today enable you to contribute to Harvard?', 150, 2026, 1, '2026-27', now() from colleges where name='Harvard University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Describe a time when you strongly disagreed with someone about an idea or issue. How did you communicate or engage with this person? What did you learn from this experience?', 150, 2026, 2, '2026-27', now() from colleges where name='Harvard University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=2 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Briefly describe any of your extracurricular activities, employment experience, travel, or family responsibilities that have shaped who you are.', 150, 2026, 3, '2026-27', now() from colleges where name='Harvard University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=3 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'How do you hope to use your Harvard education in the future?', 150, 2026, 4, '2026-27', now() from colleges where name='Harvard University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=4 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Top 3 things your roommates might like to know about you.', 150, 2026, 5, '2026-27', now() from colleges where name='Harvard University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=5 and p.cycle='2026-27');

-- Princeton University
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Choose one: (1) (A.B. or Undecided applicants) As a research institution that also prides itself on its liberal arts curriculum, Princeton allows students to explore areas across the humanities and the arts, the natural sciences, and the social sciences. What academic areas most pique your curiosity, and how do the programs offered at Princeton suit your particular interests? (2) (B.S.E. applicants) Please describe why you are interested in studying engineering at Princeton. Include any of your experiences in, or exposure to engineering, and how you think the programs offered at the University suit your particular interests.', 250, 2026, 1, '2026-27', now() from colleges where name='Princeton University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Princeton values community and encourages students, faculty, staff and leadership to engage in respectful conversations that can expand their perspectives and challenge their ideas and beliefs. As a prospective member of this community, reflect on how your lived experiences will impact the conversations you will have in the classroom, the dining hall or other campus spaces. What lessons have you learned in life thus far? What will your classmates learn from you? In short, how has your lived experience shaped you?', 500, 2026, 2, '2026-27', now() from colleges where name='Princeton University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=2 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Princeton has a longstanding commitment to understanding our responsibility to society through service and civic engagement. How does your own story intersect with these ideals?', 250, 2026, 3, '2026-27', now() from colleges where name='Princeton University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=3 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'More About You: What is a new skill you would like to learn in college?', 50, 2026, 4, '2026-27', now() from colleges where name='Princeton University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=4 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'More About You: What brings you joy?', 50, 2026, 5, '2026-27', now() from colleges where name='Princeton University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=5 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'More About You: What song represents the soundtrack of your life at this moment?', 50, 2026, 6, '2026-27', now() from colleges where name='Princeton University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=6 and p.cycle='2026-27');

-- Brown University
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Brown''s Open Curriculum allows students to explore broadly while also diving deeply into their academic pursuits. How will you use these characteristics or others to shape your approach to the Open Curriculum?', 250, 2026, 1, '2026-27', now() from colleges where name='Brown University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Share how an aspect of your growing up has inspired or challenged you, and what unique contributions this might allow you to make to the Brown community.', 250, 2026, 2, '2026-27', now() from colleges where name='Brown University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=2 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Tell us about something that brings you joy.', 150, 2026, 3, '2026-27', now() from colleges where name='Brown University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=3 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'If you could teach a class on any one thing, whether academic or otherwise, what would it be?', 150, 2026, 4, '2026-27', now() from colleges where name='Brown University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=4 and p.cycle='2026-27');

-- University of Pennsylvania
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Write a short thank-you note to someone you have not yet thanked and would like to acknowledge. (We encourage you to share this note with that person, if possible, and reflect on the experience!)', 200, 2026, 1, '2026-27', now() from colleges where name='University of Pennsylvania'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'How will you explore community at Penn? Consider how Penn will help shape your perspective, and how your experiences and perspective will help shape Penn.', 200, 2026, 2, '2026-27', now() from colleges where name='University of Pennsylvania'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=2 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'School-specific essay: describe your interest in your chosen Penn undergraduate school or coordinated dual-degree program - see the Penn application for your school''s exact wording and word limit.', 650, 2026, 3, '2026-27', now() from colleges where name='University of Pennsylvania'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=3 and p.cycle='2026-27');

-- Johns Hopkins University
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Drawing on your own experiences, what have you learned about engaging across differences and how has it shaped the way you think about building bridges, enhancing community, and working with others?', 350, 2026, 1, '2026-27', now() from colleges where name='Johns Hopkins University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');

-- California Institute of Technology
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Why did you choose your proposed area of interest? If you selected ''other'', what topics are you interested in pursuing?', 250, 2026, 1, '2026-27', now() from colleges where name='California Institute of Technology'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Scholarly Character - choose one: (1) Collaboration: Tell us about a time your learning in STEM was shaped by another person or group - either because you needed help, offered help, changed your thinking through collaboration, or contributed to someone else''s understanding. What did that experience teach you about learning and working with others? (2) Process: Tell us about a time your approach to a STEM problem, concept, or project mattered as much as the outcome. How did you work through uncertainty or persist creatively in tackling the problem? What would you still defend about your process, regardless of the outcome?', 200, 2026, 2, '2026-27', now() from colleges where name='California Institute of Technology'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=2 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Scientific Drive - answer two of three (200 words each): (1) Learning: Take this opportunity to nerd out and talk to us about whatever STEM rabbit hole you have found yourself falling into. Be as specific or broad as you would like. (2) Pursuing: Tell us about a STEM question, problem, idea, or project that has held your attention over time. What drew you to it, how have you pursued it, and what do you still want to understand? (3) Making: Tell us about something you created, tested, repaired, modeled, coded, built, or redesigned. What problem were you trying to solve and what did the process reveal to you?', 200, 2026, 3, '2026-27', now() from colleges where name='California Institute of Technology'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=3 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Just for Fun: What is something you would be excited to do, share, teach, make, start, or contribute as part of the Caltech community?', 200, 2026, 4, '2026-27', now() from colleges where name='California Institute of Technology'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=4 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Optional: Additional context - open space for anything else you want the admissions committee to know.', 200, 2026, 5, '2026-27', now() from colleges where name='California Institute of Technology'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=5 and p.cycle='2026-27');

-- Carnegie Mellon University
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Most students choose their intended major or area of study based on a passion or inspiration that''s developed over time - what passion or inspiration led you to choose this area of study?', 300, 2026, 1, '2026-27', now() from colleges where name='Carnegie Mellon University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Many students pursue college for a specific degree, career opportunity or personal goal. Whichever it may be, learning will be critical to achieve your ultimate goal. As you think ahead to the process of learning during your college years, how will you define a successful college experience?', 300, 2026, 2, '2026-27', now() from colleges where name='Carnegie Mellon University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=2 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Consider your application as a whole. What do you personally want to emphasize about your application for the admission committee''s consideration?', 300, 2026, 3, '2026-27', now() from colleges where name='Carnegie Mellon University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=3 and p.cycle='2026-27');

-- New York University
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Optional - choose one: We are looking for students who want to be bridge builders - students who can connect people, groups, and ideas to span divides, foster understanding, and promote collaboration within a dynamic, interconnected, and vibrant global academic community. (1) Tell us about a time you encountered a perspective different from your own. What did you learn - about yourself, the other person, or the world? (2) Tell us about an experience you''ve had working with others who have different perspectives. What role did you play in helping people to work together, and what did you learn from your efforts?', 250, 2026, 1, '2026-27', now() from colleges where name='New York University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');

-- University of Southern California
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Describe how you plan to pursue your academic interests and why you want to explore them at USC specifically.', 250, 2026, 1, '2026-27', now() from colleges where name='University of Southern California'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Optional: The USC Student Commitment charges Trojans to ''value honest, open communication and robust debate,'' and to ''champion ideological diversity and embrace freedom of expression.'' Describe a time when you disagreed with someone you know about something important to you. Did you change your mind or reach common ground?', 250, 2026, 2, '2026-27', now() from colleges where name='University of Southern California'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=2 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Short takes (100 characters each): Describe yourself in three words; What is your favorite snack?; Best movie of all time; Dream job; If your life had a theme song, what would it be?; Dream trip; What TV show will you binge-watch next?; Which well-known person or fictional character would be your ideal roommate?; Favorite book; If you could teach a class on any topic, what would it be?', 25, 2026, 3, '2026-27', now() from colleges where name='University of Southern California'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=3 and p.cycle='2026-27');

-- University of Notre Dame
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Everyone has different priorities when considering their higher education options and building their college or university list. Tell us about your ''non-negotiable'' factor(s) when searching for your future college home.', 150, 2026, 1, '2026-27', now() from colleges where name='University of Notre Dame'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Choose two of four (50-100 words each): (1) How does faith influence the decisions you make? (2) What is distinctive about your personal experiences and development (e.g., family support, culture, disability, personal background, community)? Why are these experiences important to you and how will you enrich the Notre Dame community? (3) Notre Dame''s undergraduate experience is characterized by a collective sense of care for every person. How do you foster service to others in your community? (4) What would you fight for?', 100, 2026, 2, '2026-27', now() from colleges where name='University of Notre Dame'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=2 and p.cycle='2026-27');

-- Vanderbilt University
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Reflect on how one or more aspects of your identity, culture, or background has played a role in your personal growth, and how it will contribute to our campus community as you dare to grow at Vanderbilt.', 250, 2026, 1, '2026-27', now() from colleges where name='Vanderbilt University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');

-- Emory University
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'What academic areas are you interested in exploring at Emory University and why?', 200, 2026, 1, '2026-27', now() from colleges where name='Emory University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Choose one: (1) Emory University has a strong commitment to building community. Tell us about a community you have been part of where your participation helped to change or shape the community for the better. (2) Reflect on a personal experience where you intentionally expanded your cultural awareness. (3) Emory University''s core mission calls for service to humanity. Share how you might personally contribute to this mission. (4) In a scholarly community, differing ideas often collide before they converge. How do you personally navigate disagreement in a way that promotes progress and deepens meaningful dialogue?', 200, 2026, 2, '2026-27', now() from colleges where name='Emory University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=2 and p.cycle='2026-27');

-- Boston University
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'What about being a student at BU most excites you? How do you hope to contribute to our campus community?', 300, 2026, 1, '2026-27', now() from colleges where name='Boston University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');

-- Amherst College
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Choose one option. Option A - respond to one of the following quotations: (1) ''Hope and curiosity - these are qualities that are the foundation of what Amherst College means, of everything that we do here.'' - Michael A. Elliott, 20th President of Amherst College. What does curiosity mean to you? How do you experience curiosity in your own life? (2) ''We seek an Amherst made stronger because it includes those whose experiences can enhance our understanding of our nation and our world.'' - Trustee Statement on Diversity and Community. In what ways could your unique experiences enhance our understanding of our nation and our world? (3) ''We are working together to build a community that makes room for both true disagreement and true connection.'' - Presidential Priorities: Serving the Greater Good. Tell us about a time that you engaged with a viewpoint different from your own. How did you enter that engagement, and what did you learn about yourself from it? Option B - submit a graded paper from your junior or senior year that best demonstrates your writing skills and analytical abilities (no lab reports, journal entries, creative writing, or in-class essays).', 350, 2026, 1, '2026-27', now() from colleges where name='Amherst College'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');

-- Swarthmore College
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'What aspects of your self-identity or personal background are most significant to you? Reflecting on the elements of your home, school, or other communities that have shaped your life, explain how you have grown in your ability to navigate differences when engaging with others, or demonstrated your ability to collaborate in communities other than your own. (150-250 words)', 250, 2026, 1, '2026-27', now() from colleges where name='Swarthmore College'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Tell us about a topic that has fascinated you recently - either inside or outside of the classroom. What made you curious about this? Has this topic connected across other areas of your interests? How has this experience shaped you and what encourages you to keep exploring? (150-250 words)', 250, 2026, 2, '2026-27', now() from colleges where name='Swarthmore College'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=2 and p.cycle='2026-27');

-- Pomona College
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Choose one: (1) Reflecting on a community that you are a part of, what values or perspectives from that community would you bring to Pomona? (2) Describe an experience you had outside the classroom that changed the way you think or how you engage with your peers. What was that experience and what did you learn from it? (3) Choose any person or group of people in your life and share how they would describe you.', 250, 2026, 1, '2026-27', now() from colleges where name='Pomona College'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');

-- Barnard College
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'At Barnard, inquiry starts with asking bold questions about the world. What is one bold question on your mind and what about it piques your curiosity?', 50, 2026, 1, '2026-27', now() from colleges where name='Barnard College'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Think of a woman - historical, fictional, contemporary, or personally significant - whose views or approach to problem-solving differ from your own, but who excels at bringing people together. What lesson from her approach would shape how you show up at Barnard both inside and outside of the classroom?', 250, 2026, 2, '2026-27', now() from colleges where name='Barnard College'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=2 and p.cycle='2026-27');

-- Wellesley College
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Tell us about an experience working with and alongside people of different backgrounds and/or perspectives from your own. Why was this important to you, and what lessons from this will you bring with you to Wellesley? (250-400 words)', 400, 2026, 1, '2026-27', now() from colleges where name='Wellesley College'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');

-- Bowdoin College
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Optional: Which line from The Offer of the College resonates most with you? Choose one: (1) To be at home in all lands and all ages; (2) To count Nature a familiar acquaintance, and Art an intimate friend; (3) To gain a standard for the appreciation of others'' work and the criticism of your own; (4) To carry the keys of the world''s library in your pocket, and feel its resources behind you in whatever task you undertake; (5) To make hosts of friends... who are to be leaders in all walks of life; (6) To lose yourself in generous enthusiasms and cooperate with others for common ends. The Offer represents Bowdoin''s values. Please reflect on the line you selected and how it has meaning to you.', 250, 2026, 1, '2026-27', now() from colleges where name='Bowdoin College'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Optional: If you wish, you may share anything about the unique experiences and perspectives that you would bring with you to the Bowdoin campus and community or an experience you have had that required you to navigate across or through difference.', 250, 2026, 2, '2026-27', now() from colleges where name='Bowdoin College'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=2 and p.cycle='2026-27');

-- Colgate University
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Optional: On Colgate''s campus, students engage with individuals from a variety of socioeconomic backgrounds, races, ethnicities, religions, and perspectives. Please share the benefits you see in engaging with a diverse body of students, faculty, and staff as part of your Colgate experience.', 250, 2026, 1, '2026-27', now() from colleges where name='Colgate University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Optional: Colgate students immerse themselves in social and intellectual pursuits that inspire them. Tell us in 250 words or less what inspires you and why you want to pursue that at Colgate.', 250, 2026, 2, '2026-27', now() from colleges where name='Colgate University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=2 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Optional: Complete a series of sentence stems in 13 words or fewer each (e.g., ''I am fascinated by...'', ''I am drawn to Colgate University because...'').', 13, 2026, 3, '2026-27', now() from colleges where name='Colgate University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=3 and p.cycle='2026-27');

-- Hamilton College
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Optional: At Hamilton, we each bring different backgrounds and perspectives, and we teach one another about the world through our individual and shared experiences. In the spirit of Hamilton''s motto, Know Thyself, please reflect on your unique perspective and how Hamilton might shape it, as well as how your perspective will shape Hamilton.', 350, 2026, 1, '2026-27', now() from colleges where name='Hamilton College'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');

-- Haverford College
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Tell us about a topic or issue that sparks your curiosity and gets you intellectually excited. How do you hope to engage with this topic or issue at Haverford? (150-200 words)', 200, 2026, 1, '2026-27', now() from colleges where name='Haverford College'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'What are some of the values you seek in your next community? How do Haverford''s values, as demonstrated through our Honor Code, resonate with you? You may draw from how you have been influenced by other communities you have been a part of, experiences you may have had within your communities, or opportunities you have had to shape or even change your communities. (150-200 words)', 200, 2026, 2, '2026-27', now() from colleges where name='Haverford College'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=2 and p.cycle='2026-27');

-- Carleton College
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Think about someone you connect with who''s different from you. What do you find most meaningful about your interactions with them?', 300, 2026, 1, '2026-27', now() from colleges where name='Carleton College'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Optional: Anything missing? Do you want to share more with us? If so, use this space to fill any gaps you think would assist us in reviewing your application.', 250, 2026, 2, '2026-27', now() from colleges where name='Carleton College'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=2 and p.cycle='2026-27');

-- Vassar College
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Choose one: (1) Tell us a little bit about an important part of your identity and how it has shaped your life and/or interactions with others. (2) Tell us about the community (or communities) you come from and how it has shaped your lived experiences and identity.', 300, 2026, 1, '2026-27', now() from colleges where name='Vassar College'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Optional - Your Space: share something that reflects who you are in a medium of your choice (poetry, artwork, photography, video, code, or other media); no word limit.', 650, 2026, 2, '2026-27', now() from colleges where name='Vassar College'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=2 and p.cycle='2026-27');

-- Harvey Mudd College
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Share how an experience you''ve had or community you belong to has shaped the kinds of problems you want to solve and the impact you want to make.', 500, 2026, 1, '2026-27', now() from colleges where name='Harvey Mudd College'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Describe a time when asking for help made a difference in your work or wellbeing. What led you to reach out, and what did you take away from the experience?', 250, 2026, 2, '2026-27', now() from colleges where name='Harvey Mudd College'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=2 and p.cycle='2026-27');

-- Claremont McKenna College
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'CMC''s mission is to prepare students for thoughtful and productive lives and responsible leadership in business, government, and the professions. With this mission in mind, please explain why you want to attend Claremont McKenna College. (150-250 words)', 250, 2026, 1, '2026-27', now() from colleges where name='Claremont McKenna College'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'A critical part of fulfilling our mission is living out the commitments of CMC''s Open Academy: Freedom of Expression, Viewpoint Diversity, and Constructive Dialogue. Describe a time when engaging with someone about a specific topic resulted in you changing your attitude, belief, or behavior, or you changed the belief or behavior of someone else. What was the change that occurred for you, and what facilitated that change? What did you learn from that experience, and how has it informed how you engage with others? (150-250 words)', 250, 2026, 2, '2026-27', now() from colleges where name='Claremont McKenna College'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=2 and p.cycle='2026-27');

-- Smith College
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'What personal experiences, background or abilities would you bring to this residential environment to share with your neighbors and what would you hope your neighbors would share with you?', 250, 2026, 1, '2026-27', now() from colleges where name='Smith College'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');

-- Bucknell University
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Please explain your interest in your first-choice major/undecided status and your second-choice major (should you opt to list one) and why you would choose Bucknell University to pursue your interest(s).', 250, 2026, 1, '2026-27', now() from colleges where name='Bucknell University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');

-- Lehigh University
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'How did you first learn about Lehigh University and what motivated you to apply?', 200, 2026, 1, '2026-27', now() from colleges where name='Lehigh University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'At Lehigh, we believe in pausing to celebrate the good - meaningful moments that bring joy, pride or motivation. What''s something great happening in your life right now?', 200, 2026, 2, '2026-27', now() from colleges where name='Lehigh University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=2 and p.cycle='2026-27');

-- University of Rochester
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'The University of Rochester is a place where curiosity and creativity meet. How will you combine our academic flexibility and co-curricular opportunities to create an experience that reflects your interests and ambitions?', 250, 2026, 1, '2026-27', now() from colleges where name='University of Rochester'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');

-- Rensselaer Polytechnic Institute
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Why are you interested in Rensselaer Polytechnic Institute?', 250, 2026, 1, '2026-27', now() from colleges where name='Rensselaer Polytechnic Institute'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');

-- Cooper Union
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Engineering applicants: The Cooper Union is a small, highly specialized, and academically challenging school in New York City. Beyond these traits, what specific aspects of our community and resources excite you? In what ways are you inspired to contribute to and benefit from our learning community?', 350, 2026, 1, '2026-27', now() from colleges where name='Cooper Union'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Engineering applicants: What drives your interest in pursuing your chosen major? How do you envision engaging with Cooper''s labs, research opportunities, and faculty?', 350, 2026, 2, '2026-27', now() from colleges where name='Cooper Union'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=2 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Engineering applicants: Identify a challenge facing a community you identify with or care about. Explain how your experiences and perspective influence the way you would approach a solution.', 250, 2026, 3, '2026-27', now() from colleges where name='Cooper Union'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=3 and p.cycle='2026-27');

-- University of Illinois Urbana-Champaign
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Explain, in detail, an experience you''ve had in the past 3 to 4 years related to your first-choice major. (If undeclared: What are your future career or academic goals?)', 150, 2026, 1, '2026-27', now() from colleges where name='University of Illinois Urbana-Champaign'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Describe your personal and/or career goals after graduating from Illinois and how your selected first-choice major will help you achieve them. (If undeclared: What are your academic interests? Please include 2-3 majors you''re considering at Illinois and why.)', 150, 2026, 2, '2026-27', now() from colleges where name='University of Illinois Urbana-Champaign'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=2 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Optional (only if selecting a second-choice major): Please explain your interest in your second-choice major or your overall academic or career goals.', 150, 2026, 3, '2026-27', now() from colleges where name='University of Illinois Urbana-Champaign'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=3 and p.cycle='2026-27');

-- University of Wisconsin - Madison
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Tell us why you would like to attend the University of Wisconsin-Madison. In addition, please include why you are interested in studying the major(s) you have selected. If you selected undecided, please describe your areas of possible academic interest. (650 max; 300-500 recommended)', 650, 2026, 1, '2026-27', now() from colleges where name='University of Wisconsin - Madison'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');

-- University of Maryland - College Park
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Complete each of six short statements (650 characters each): (1) If I could travel anywhere, I would go to... (2) The most interesting fact I ever learned from research was... (3) In addition to my major, my academic interests include... (4) My favorite thing about last Tuesday was... (5) Something you might not know about me is... (6) Because we know that diversity benefits the educational experience of all students, the University of Maryland values diversity in all of its many forms...', 100, 2026, 1, '2026-27', now() from colleges where name='University of Maryland - College Park'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');

-- University of Florida
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Please provide more details on your most meaningful commitment outside of the classroom while in high school and explain why it was meaningful. This could be related to an extracurricular activity, work, volunteering, an academic activity, family responsibility, or any other non-classroom activity.', 250, 2026, 1, '2026-27', now() from colleges where name='University of Florida'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');

-- Virginia Tech
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Ut Prosim Profile 1 of 4: Virginia Tech''s motto is ''Ut Prosim'' which means ''That I May Serve''. Share how you contribute to a community that is important to you. How long have you been involved? What have you learned and how would you like to share that with others at Virginia Tech?', 120, 2026, 1, '2026-27', now() from colleges where name='Virginia Tech'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Ut Prosim Profile 2 of 4: Have you had an experience when you or someone you know were not being included? Did you reach out to anyone for assistance, direction, or resources? Were you able to affect change and/or influence others? Did this experience change your perspective and if so, how?', 120, 2026, 2, '2026-27', now() from colleges where name='Virginia Tech'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=2 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Ut Prosim Profile 3 of 4: Share a time when you were most proud of yourself either as a role model or when you displayed your leadership. What specific skills did you contribute to the experience? How did others rely on you for guidance? What did you learn about yourself during this time?', 120, 2026, 3, '2026-27', now() from colleges where name='Virginia Tech'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=3 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Ut Prosim Profile 4 of 4: Describe a goal that you have set and the steps you will take to achieve it. What made you set this goal for yourself? What is your timeline to achieve this goal? Who do you seek encouragement or guidance from and how do they support your progress as you work on this goal?', 120, 2026, 4, '2026-27', now() from colleges where name='Virginia Tech'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=4 and p.cycle='2026-27');

-- University of Massachusetts - Amherst
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Please tell us why you want to attend UMass Amherst?', 100, 2026, 1, '2026-27', now() from colleges where name='University of Massachusetts - Amherst'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Please tell us why you chose the Major(s) you did?', 100, 2026, 2, '2026-27', now() from colleges where name='University of Massachusetts - Amherst'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=2 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'At UMass Amherst, no two students are alike. Our communities and groups often define us and shape our individual worlds. Community can refer to various aspects, including shared geography, religion, race/ethnicity, income, ideology, and more. Please choose one of your communities or groups and describe its significance. Explain how, as a product of this community or group, you would enrich our campus.', 100, 2026, 3, '2026-27', now() from colleges where name='University of Massachusetts - Amherst'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=3 and p.cycle='2026-27');

-- University of Colorado Boulder
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'What do you hope to study, and why, at CU Boulder? Or if you don''t know quite yet, think about your studies so far, extracurricular/after-school activities, jobs, volunteering, future goals or anything else that has shaped your interests.', 250, 2026, 1, '2026-27', now() from colleges where name='University of Colorado Boulder'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');

-- University of Arizona
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Optional (strongly encouraged) - choose one: (1) Why is the University of Arizona the right fit for you and how will your chosen academic area of study align with your interests, goals, and values? (2) Is there anything else you''d like to share that you have not already included?', 500, 2026, 1, '2026-27', now() from colleges where name='University of Arizona'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');

-- North Carolina State University
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Explain why you selected the first choice academic program above and why you are interested in studying this at NC State. (10-250 words)', 250, 2026, 1, '2026-27', now() from colleges where name='North Carolina State University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');

-- Southern Methodist University
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'SMU appeals to students for a variety of reasons. Briefly describe why you are interested in attending SMU and what specific factors have led you to apply.', 250, 2026, 1, '2026-27', now() from colleges where name='Southern Methodist University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'SMU is a diverse and welcoming learning environment shaped by the convergence of ideas and cultures. How will your unique experiences enhance the University, and how will you benefit from this community?', 250, 2026, 2, '2026-27', now() from colleges where name='Southern Methodist University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=2 and p.cycle='2026-27');

-- Santa Clara University
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Why are you interested in pursuing the Division or Major selected above?', 50, 2026, 1, '2026-27', now() from colleges where name='Santa Clara University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');

-- Babson College
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Tell us about your interest in this area of study and in Babson specifically. (written 500 words max, or a one-minute video alternative)', 500, 2026, 1, '2026-27', now() from colleges where name='Babson College'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Please share something about your background, lived experiences, or viewpoint(s) that speaks to: (1) your commitment to promoting access, connection, or understanding across differences; and/or (2) how you will contribute to and learn from Babson''s collaborative community.', 250, 2026, 2, '2026-27', now() from colleges where name='Babson College'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=2 and p.cycle='2026-27');

-- Bentley University
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Optional (submit one, two, or three): Bentley''s core values are Caring, Collaboration, Diversity, Honesty, Impact, Learning, and Respect. Select one or two of these core values and share how you currently embody them in your life. How will you continue to develop these values at Bentley?', 250, 2026, 1, '2026-27', now() from colleges where name='Bentley University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Optional: Our students bring to campus a variety of experiences, cultures, and intersecting identities - aspects that are important to a rich educational experience and your success in college and beyond. You may use this section to discuss how race and ethnicity affected your life, be it through discrimination, inspiration or otherwise.', 250, 2026, 2, '2026-27', now() from colleges where name='Bentley University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=2 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Optional: You wake up tomorrow morning and it''s the first day of high school. What would you do differently over the next few years?', 250, 2026, 3, '2026-27', now() from colleges where name='Bentley University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=3 and p.cycle='2026-27');

-- Baylor University
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'What are you looking for in a university, why do you want to attend Baylor, and how do you see yourself contributing to the Baylor community?', 450, 2026, 1, '2026-27', now() from colleges where name='Baylor University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');

-- Chapman University
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Out of the thousands of universities and colleges, what excites you about attending Chapman University specifically?', 200, 2026, 1, '2026-27', now() from colleges where name='Chapman University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Please tell us about your interest in the major you selected.', 200, 2026, 2, '2026-27', now() from colleges where name='Chapman University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=2 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Optional: If you would like to be considered for a different major should Chapman be unable to offer you admission to your first-choice major, please tell us about your interest in this alternative major.', 200, 2026, 3, '2026-27', now() from colleges where name='Chapman University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=3 and p.cycle='2026-27');

-- Elon University
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'What at Elon has caught your eye - programs, opportunities, or experiences you can''t wait to try?', 150, 2026, 1, '2026-27', now() from colleges where name='Elon University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'What aspect of your identity do you find most meaningful, and why?', 200, 2026, 2, '2026-27', now() from colleges where name='Elon University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=2 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Tell us your top 5. Take this opportunity to let Elon Admissions know more about you. Be creative! You may choose any theme for your top 5.', 150, 2026, 3, '2026-27', now() from colleges where name='Elon University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=3 and p.cycle='2026-27');

-- Gonzaga University
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Grounded in its Jesuit, Catholic, and humanistic mission, Gonzaga seeks students who demonstrate its values through their experiences, commitments, and aspirations. Please share additional information about your experience in one or more of the value areas that you selected in the application (5-7 sentences).', 300, 2026, 1, '2026-27', now() from colleges where name='Gonzaga University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');

-- Howard University
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Optional: Diversity of all kinds is important to enriching the educational experience at Howard University. Please share with us anything in your background or lived experience that has shaped your perspectives and how that would contribute to the classroom and community at Howard.', 500, 2026, 1, '2026-27', now() from colleges where name='Howard University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Optional: Please describe the major you intend to study and how you hope to use your Howard education to support you in achieving your passions and goals. Please address your first-choice and second-choice major selections.', 500, 2026, 2, '2026-27', now() from colleges where name='Howard University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=2 and p.cycle='2026-27');

-- Loyola Marymount University
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Optional: Share with us why you are interested in LMU and/or why you chose your specific area of study or major.', 500, 2026, 1, '2026-27', now() from colleges where name='Loyola Marymount University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');

-- Pepperdine University
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Pepperdine is a Christian university where all are welcomed and encouraged to challenge each other in the pursuit of truth. Considering that Pepperdine is a Christian university, why are you interested in attending and how would you contribute to conversations of faith on campus? (300-500 words)', 500, 2026, 1, '2026-27', now() from colleges where name='Pepperdine University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');

-- Spelman College
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'The Spelman College tagline is ''A Choice to Change the World''. If you could create meaningful change around one issue in your school, community or globally, what would it be and how would you approach making this change? (150-300 words)', 300, 2026, 1, '2026-27', now() from colleges where name='Spelman College'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');

-- Syracuse University
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Why is Syracuse University a good match for your interests and goals?', 250, 2026, 1, '2026-27', now() from colleges where name='Syracuse University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');

-- University of Central Florida
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Optional: Why did you choose to apply to UCF?', 250, 2026, 1, '2026-27', now() from colleges where name='University of Central Florida'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Optional: What qualities or unique characteristics do you possess that will allow you to contribute to the UCF community?', 250, 2026, 2, '2026-27', now() from colleges where name='University of Central Florida'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=2 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Optional: Please briefly elaborate on one of your extracurricular activities or work experiences.', 250, 2026, 3, '2026-27', now() from colleges where name='University of Central Florida'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=3 and p.cycle='2026-27');

-- University of Minnesota - Twin Cities
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'The U of M has 8 freshman-admitting colleges and more than 150 majors. Please share a few words about what you''d like to study in college, career paths that interest you, or your favorite subjects in school. (max 1,000 characters)', 150, 2026, 1, '2026-27', now() from colleges where name='University of Minnesota - Twin Cities'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');

-- University of Oregon
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Optional - choose one: (1) What have you learned from a social justice issue that inspires you, and how will you apply those lessons to drive change? (2) The University of Oregon values difference, and we take pride in our diverse community. Please explain how you will share your experiences, values and interests with our community. In what ways can you imagine offering your support to others?', 500, 2026, 1, '2026-27', now() from colleges where name='University of Oregon'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');

-- University of Texas at Austin
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Why are you interested in the major you indicated as your first-choice major? (250-300 words)', 300, 2026, 1, '2026-27', now() from colleges where name='University of Texas at Austin'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Think of all the activities - both in and outside of school - that you have been involved with during high school. Which one are you most proud of and why? (250-300 words)', 300, 2026, 2, '2026-27', now() from colleges where name='University of Texas at Austin'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=2 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Optional: Please share background on events or special circumstances that you feel may have impacted your high school academic performance. (250-300 words)', 300, 2026, 3, '2026-27', now() from colleges where name='University of Texas at Austin'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=3 and p.cycle='2026-27');

-- William & Mary
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Optional - answer up to TWO of six (about 300 words each): (1) Are there any particular communities that are important to you, and how do you see yourself being a part of our community? (2) Share more about a personal academic interest or career goal. (3) How has your family, culture and/or background shaped your lived experience? (4) What led to your interest in William & Mary? (5) Tell us about a challenge or adversity you''ve experienced and how that has impacted you as an individual. (6) If we visited your town, what would you want to show us?', 300, 2026, 1, '2026-27', now() from colleges where name='William & Mary'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');

-- Connecticut College
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Optional: Developing a strong, equitable, and inclusive community is important to us at Connecticut College. After all, camels live and work together in herds. In 150 words or less, please tell us who you are and what you will bring to the Conn community to help us grow into the best version of ourselves. Any format is acceptable - a few sentences, one run-on sentence, a short poem, or even a bullet-point list.', 150, 2026, 1, '2026-27', now() from colleges where name='Connecticut College'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');

-- Dickinson College
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Optional: What topic or idea could you write or converse about endlessly?', 50, 2026, 1, '2026-27', now() from colleges where name='Dickinson College'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Optional: What is something new that you''d like to experience, learn or try that might surprise your friends and family?', 50, 2026, 2, '2026-27', now() from colleges where name='Dickinson College'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=2 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Optional: What are the qualities that make you proud to be you?', 50, 2026, 3, '2026-27', now() from colleges where name='Dickinson College'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=3 and p.cycle='2026-27');

-- Trinity College (CT)
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Optional: The identities you claim, the challenges you face, and the successes you enjoy shape the background for your college experience to come. What is an aspect of your background that you are excited to share and/or explore as a member of the Trinity community and why?', 300, 2026, 1, '2026-27', now() from colleges where name='Trinity College (CT)'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');

-- Washington and Lee University
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Optional (via the W&L Applicant Portal): There are over 8,200 accredited colleges and universities in the U.S. alone. You have chosen to apply to Washington and Lee University. Please describe how you have familiarized yourself with W&L and what aspects of its community are most exciting to you.', 250, 2026, 1, '2026-27', now() from colleges where name='Washington and Lee University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Optional - choose one (250 words or a max 2-minute video): (1) Please describe an aspect of your life outside of school that is important to you, such as an extracurricular activity, a job, or a family responsibility. How has your involvement shaped your personal qualities and growth, and how has it impacted those around you? (2) Engaging with faculty, staff, and classmates with diverse identities, experiences, and perspectives is an essential component of a W&L education. What diverse aspect would you bring to W&L? (3) Reveal to us how your curious mind works by sharing something you spend considerable time thinking or learning about. (4) On a residential college campus with a Speaking Tradition that encourages connections between individuals, using each other''s names matters. Please share the story of any name you go by and what significance it holds for you.', 250, 2026, 2, '2026-27', now() from colleges where name='Washington and Lee University'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=2 and p.cycle='2026-27');

-- Virginia Military Institute
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Optional (strongly encouraged): VMI applicants are strongly encouraged to submit a statement indicating why you are interested in VMI and how our educational system can help you achieve your personal and educational goals.', 500, 2026, 1, '2026-27', now() from colleges where name='Virginia Military Institute'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');

-- Colorado School of Mines
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Optional (strongly recommended): What element on the periodic table best represents you and why?', 250, 2026, 1, '2026-27', now() from colleges where name='Colorado School of Mines'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Optional (strongly recommended): Why do you want to be an Oredigger? You can share what you want to study, your future involvement and activities, or anything else about the Mines experience that excites you.', 250, 2026, 2, '2026-27', now() from colleges where name='Colorado School of Mines'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=2 and p.cycle='2026-27');

-- United States Air Force Academy
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Describe a leadership experience that has meaning for you. A leadership role can mean more than just a title. It can mean being a mentor to others, acting as the person in charge of a specific task, or taking the lead role in organizing an event or project. Think about what you accomplished and what you learned from the experience. What were your responsibilities?', 500, 2026, 1, '2026-27', now() from colleges where name='United States Air Force Academy'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Describe a setback or ethical dilemma that you have faced. How did you resolve it? How did the outcome affect you? Most importantly, what did you learn about yourself and how would you handle a similar situation in the future?', 500, 2026, 2, '2026-27', now() from colleges where name='United States Air Force Academy'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=2 and p.cycle='2026-27');

-- United States Military Academy (West Point)
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Candidate statement: Explain why you want to attend the United States Military Academy and serve on active duty as an Army officer. (about 2,500 characters; verify current prompts in the Candidate Portal)', 500, 2026, 1, '2026-27', now() from colleges where name='United States Military Academy (West Point)'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Candidate statement: What are the most important qualities in becoming a successful USMA cadet and a successful Army officer? (about 2,500 characters; verify current prompts in the Candidate Portal)', 500, 2026, 2, '2026-27', now() from colleges where name='United States Military Academy (West Point)'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=2 and p.cycle='2026-27');

-- United States Naval Academy
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Personal statement (4,000 characters): In a well-organized essay, please discuss both of the following: (1) Describe what led to your initial interest in the naval service and how the Naval Academy will help you achieve your long range goals, and (2) Describe a personal experience you have had which you feel has contributed to your own character development and integrity.', 650, 2026, 1, '2026-27', now() from colleges where name='United States Naval Academy'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');

-- ============ CARRIED FORWARD FROM 2025-26 (supplement confirmed; verify wording) ============
-- Pitzer College (carried-forward wording)
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Choose one: (1) Describe what you are looking for from your college experience and why Pitzer would be a good fit for you. (2) Reflecting on your involvement throughout high school or within the community, how have you engaged with one of Pitzer''s core values? (300-650 words)', 650, 2026, 1, '2026-27', now() from colleges where name='Pitzer College'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Optional: As a mission-driven institution, we value and celebrate the synergy created by our differences and similarities. We welcome you to write about distinctive aspects of your background, identity, or personal interests that you would bring to Pitzer, and how you plan to engage in our community.', 250, 2026, 2, '2026-27', now() from colleges where name='Pitzer College'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=2 and p.cycle='2026-27');

-- Scripps College (carried-forward wording)
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Why have you chosen to apply to Scripps College? (100-200 words)', 200, 2026, 1, '2026-27', now() from colleges where name='Scripps College'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Choose one: (1) If you could trade lives with someone (fictional or real) for a day, who would it be and why? (2) You''ve invented a time machine! When and where is your first destination, and why? (3) You have just been invited to host your own podcast. What will you talk about, and why did you select that topic? (150-300 words)', 300, 2026, 2, '2026-27', now() from colleges where name='Scripps College'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=2 and p.cycle='2026-27');

-- Mount Holyoke College (carried-forward wording)
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Optional - choose one: (1) What unique characteristic about Mount Holyoke makes you interested in attending? (2) Every day, our students cultivate the competence, confidence and courage to make an impact - whether on a personal, community or global level. Tell us about the context in which you have grown up, what forms your aspirations and how your community has shaped your outlook. (3) What do you find fascinating? Choose a person, place, concept, idea, or theory and tell us why! (250-400 words)', 400, 2026, 1, '2026-27', now() from colleges where name='Mount Holyoke College'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');

-- Stevens Institute of Technology (carried-forward wording)
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Stevens Institute of Technology''s motto is ''Inspired by humanity, powered by technology.'' Now it''s your turn to let us know what inspires and powers you. Fill in each blank (max 24 characters each): Inspired by: ___ Powered by: ___. Then, explain how your choices reflect who you are today. (100-250 words)', 250, 2026, 1, '2026-27', now() from colleges where name='Stevens Institute of Technology'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');

-- Franklin W. Olin College of Engineering (carried-forward wording)
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Olin is a community striving to change the world and positively impact people''s lives through engineering education. How does Olin''s mission align with your own values? How do you hope to use your engineering education to change the world? (250-500 words)', 500, 2026, 1, '2026-27', now() from colleges where name='Franklin W. Olin College of Engineering'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=1 and p.cycle='2026-27');
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select id, 'Optional: Think about all the things we will learn about you throughout your application to Olin. Is there anything missing? If there is, you may share a specific story that tells us something about you that we don''t yet know.', 250, 2026, 2, '2026-27', now() from colleges where name='Franklin W. Olin College of Engineering'
and not exists (select 1 from college_prompts p where p.college_id=colleges.id and p.sort_order=2 and p.cycle='2026-27');

-- ============ UC CAMPUSES: copy shared Personal Insight Questions from UC Davis ============
insert into college_prompts (college_id, prompt_text, word_limit, year, sort_order, cycle, released_at)
select tgt.id, p.prompt_text, p.word_limit, 2026, p.sort_order, '2026-27', now()
from college_prompts p
join colleges src on src.id = p.college_id and src.name='University of California, Davis'
cross join colleges tgt
where p.cycle='2026-27'
and tgt.name in ('University of California, Berkeley', 'University of California, Los Angeles', 'University of California, San Diego', 'University of California, Riverside', 'University of California, Santa Cruz')
and not exists (select 1 from college_prompts q where q.college_id=tgt.id and q.sort_order=p.sort_order and q.cycle='2026-27');

-- ============ NO SUPPLEMENT (confirmed) ============
update colleges set no_supplement=true where name in ('Kenyon College', 'Bates College', 'Brandeis University', 'Case Western Reserve University', 'Worcester Polytechnic Institute', 'Middlebury College', 'Colby College', 'Wesleyan University', 'Northeastern University', 'Ohio State University', 'Penn State University', 'Rutgers University - New Brunswick', 'Indiana University - Bloomington', 'Michigan State University', 'University of Pittsburgh', 'University of Connecticut', 'University of Delaware', 'University of Texas, Dallas', 'Arizona State University, Tempe', 'Clemson University', 'Florida State University', 'Auburn University', 'University of Alabama', 'University of Tennessee, Knoxville', 'University of South Carolina', 'University of Oklahoma, Norman', 'Louisiana State University', 'Drexel University', 'Furman University', 'Marquette University', 'Rhodes College', 'Saint Louis University', 'Temple University', 'University of Dayton', 'University of Denver', 'University of San Francisco', 'College of the Holy Cross', 'Hobart and William Smith Colleges', 'Skidmore College', 'St. Lawrence University', 'Trinity University (TX)', 'Wofford College', 'Miami University (OH)', 'Binghamton University, SUNY', 'University at Buffalo (SUNY)', 'Stony Brook University (SUNY)', 'SUNY, Geneseo', 'CUNY, Baruch College', 'CUNY, Brooklyn College', 'CUNY, Hunter College', 'CUNY, Queens College', 'CUNY, The City College of New York', 'College of New Jersey', 'New Jersey Institute of Technology', 'Manhattan College', 'Cal Poly SLO', 'California State University, Fresno', 'California State University, Fullerton', 'California State University, Long Beach', 'San Diego State University', 'San Francisco State University', 'Sonoma State University', 'Saint Mary''s College of California', 'Towson University', 'James Madison University', 'Iowa State University', 'Kansas State University', 'Oklahoma State University', 'Oregon State University', 'Mississippi State University', 'Florida Atlantic University', 'Florida International University', 'University of South Florida', 'University of Arkansas', 'University of Iowa', 'University of Kansas', 'University of Kentucky', 'University of Missouri, Columbia', 'University of Nebraska, Lincoln', 'University of Mississippi', 'University of Houston', 'University of Illinois at Chicago', 'Washington State University', 'West Virginia University', 'University of Utah');
update college_prompts set cycle='2025-26' where college_id in (select id from colleges where name in ('Kenyon College', 'Bates College', 'Brandeis University', 'Case Western Reserve University', 'Worcester Polytechnic Institute', 'Middlebury College', 'Colby College', 'Wesleyan University', 'Northeastern University', 'Ohio State University', 'Penn State University', 'Rutgers University - New Brunswick', 'Indiana University - Bloomington', 'Michigan State University', 'University of Pittsburgh', 'University of Connecticut', 'University of Delaware', 'University of Texas, Dallas', 'Arizona State University, Tempe', 'Clemson University', 'Florida State University', 'Auburn University', 'University of Alabama', 'University of Tennessee, Knoxville', 'University of South Carolina', 'University of Oklahoma, Norman', 'Louisiana State University', 'Drexel University', 'Furman University', 'Marquette University', 'Rhodes College', 'Saint Louis University', 'Temple University', 'University of Dayton', 'University of Denver', 'University of San Francisco', 'College of the Holy Cross', 'Hobart and William Smith Colleges', 'Skidmore College', 'St. Lawrence University', 'Trinity University (TX)', 'Wofford College', 'Miami University (OH)', 'Binghamton University, SUNY', 'University at Buffalo (SUNY)', 'Stony Brook University (SUNY)', 'SUNY, Geneseo', 'CUNY, Baruch College', 'CUNY, Brooklyn College', 'CUNY, Hunter College', 'CUNY, Queens College', 'CUNY, The City College of New York', 'College of New Jersey', 'New Jersey Institute of Technology', 'Manhattan College', 'Cal Poly SLO', 'California State University, Fresno', 'California State University, Fullerton', 'California State University, Long Beach', 'San Diego State University', 'San Francisco State University', 'Sonoma State University', 'Saint Mary''s College of California', 'Towson University', 'James Madison University', 'Iowa State University', 'Kansas State University', 'Oklahoma State University', 'Oregon State University', 'Mississippi State University', 'Florida Atlantic University', 'Florida International University', 'University of South Florida', 'University of Arkansas', 'University of Iowa', 'University of Kansas', 'University of Kentucky', 'University of Missouri, Columbia', 'University of Nebraska, Lincoln', 'University of Mississippi', 'University of Houston', 'University of Illinois at Chicago', 'Washington State University', 'West Virginia University', 'University of Utah')) and cycle is distinct from '2025-26' and cycle is distinct from '2026-27';

-- ============ NO SUPPLEMENT (inferred - small flagships never on any supplement tracker) ============
update colleges set no_supplement=true where name in ('University of Alaska Fairbanks', 'University of Montana', 'University of North Dakota', 'University of South Dakota', 'University of Idaho', 'University of Maine', 'University of New Hampshire', 'University of Nevada-Reno', 'University of New Mexico', 'University of Rhode Island', 'University of Wyoming', 'University of Hawaii, Manoa');

-- ============ VERIFY ============
select count(*) filter (where cycle='2026-27') as current_prompts,
       count(distinct college_id) filter (where cycle='2026-27') as colleges_released,
       (select count(*) from colleges where no_supplement) as no_supplement_colleges,
       count(*) as total
from college_prompts;