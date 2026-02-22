-- 2025 (2024-25 / 2025-26 cycle) essay prompts — OFFICIAL prompts from each university's application.
--
-- RUN ORDER (Supabase SQL Editor):
--   1. supabase-colleges-add-stats-columns.sql   (if table missing acceptance_rate / SAT columns)
--   2. supabase-colleges-seed-top100.sql          (REQUIRED — creates the 100 colleges; prompts reference them)
--   3. This file (supabase-college-prompts-seed-2025.sql)
--
-- If you get "Key (college_id)=(...) is not present in table colleges", run step 2 first.
-- Sources: admissions sites, Common App, Ivy Coach, CollegeVine, NextGenAdmit, Selective Admissions (2024-25 / 2025-26).

-- ========== PRINCETON (2025-26) ==========
-- A.B. / undecided academic interests
insert into public.college_prompts (college_id, prompt_text, word_limit, year, sort_order) values
('princeton-university', 'As a research institution that also prides itself on its liberal arts curriculum, Princeton allows students to explore areas across the humanities and the arts, the natural sciences, and the social sciences. What academic areas most pique your curiosity, and how do the programs offered at Princeton suit your particular interests?', 250, 2025, 1);
-- Your Voice 1
insert into public.college_prompts (college_id, prompt_text, word_limit, year, sort_order) values
('princeton-university', 'Princeton values community and encourages students, faculty, staff and leadership to engage in respectful conversations that can expand their perspectives and challenge their ideas and beliefs. As a prospective member of this community, reflect on how your lived experiences will impact the conversations you will have in the classroom, the dining hall or other campus spaces. What lessons have you learned in life thus far? What will your classmates learn from you? In short, how has your lived experience shaped you?', 500, 2025, 2);
-- Your Voice 2
insert into public.college_prompts (college_id, prompt_text, word_limit, year, sort_order) values
('princeton-university', 'Princeton has a longstanding commitment to understanding our responsibility to society through service and civic engagement. How does your own story intersect with these ideals?', 250, 2025, 3);

-- ========== MIT (2025-26) — 5 short answers, 100-200 words each ==========
insert into public.college_prompts (college_id, prompt_text, word_limit, year, sort_order) values
('mit', 'What field of study appeals to you the most right now? (Note: Applicants select from a drop-down list.) Tell us more about why this field of study at MIT appeals to you.', 200, 2025, 1),
('mit', 'We know you lead a busy life, full of activities, many of which are required of you. Tell us about something you do simply for the pleasure of it.', 200, 2025, 2),
('mit', 'While some reach their goals following well-trodden paths, others blaze their own trails achieving the unexpected. In what ways have you done something different than what was expected in your educational journey?', 200, 2025, 3),
('mit', 'MIT brings people with diverse backgrounds together to collaborate, from tackling the world''s biggest challenges to lending a helping hand. Describe one way you have collaborated with others to learn from them, with them, or contribute to your community together.', 200, 2025, 4),
('mit', 'How did you manage a situation or challenge that you didn''t expect? What did you learn from it?', 200, 2025, 5);

-- ========== HARVARD (2025-26) — 5 essays, ~100-150 words each ==========
insert into public.college_prompts (college_id, prompt_text, word_limit, year, sort_order) values
('harvard-university', 'Harvard has long recognized the importance of enrolling a student body with a diversity of perspectives and experiences. How will the life experiences that shaped who you are today enable you to contribute to Harvard?', 150, 2025, 1),
('harvard-university', 'Describe a time when you strongly disagreed with someone about an idea or issue. How did you communicate or engage with this person? What did you learn from this experience?', 150, 2025, 2),
('harvard-university', 'Briefly describe any of your extracurricular activities, employment experience, travel, or family responsibilities that have shaped who you are.', 150, 2025, 3),
('harvard-university', 'How do you hope to use your Harvard education in the future?', 150, 2025, 4),
('harvard-university', 'Top 3 things your roommates might like to know about you.', 150, 2025, 5);

-- ========== STANFORD (2025-26) — 3 short essays, 100-250 words each ==========
insert into public.college_prompts (college_id, prompt_text, word_limit, year, sort_order) values
('stanford-university', 'Please describe what aspects of your life experiences, interests and character would help you make a distinctive contribution as an undergraduate to Stanford University.', 250, 2025, 1),
('stanford-university', 'Virtually all of Stanford''s undergraduates live on campus. Write a note to your future roommate that reveals something about you or that will help your roommate—and us—get to know you better.', 250, 2025, 2),
('stanford-university', 'The Stanford community is deeply curious and driven to learn in and out of the classroom. Reflect on an idea or experience that makes you genuinely excited about learning.', 250, 2025, 3);

-- ========== YALE (2024-25 / 2025-26) ==========
insert into public.college_prompts (college_id, prompt_text, word_limit, year, sort_order) values
('yale-university', 'What is it about Yale that has led you to apply?', 125, 2025, 1),
('yale-university', 'Tell us about a topic or idea that excites you and is related to one or more academic areas you selected above. Why are you drawn to it?', 200, 2025, 2);

-- ========== CALTECH (Fall 2026 / 2024-25 style) — official admissions page ==========
insert into public.college_prompts (college_id, prompt_text, word_limit, year, sort_order) values
('caltech', 'If you had to choose an area of interest or two today, what would you choose? Why did you choose your proposed area of interest? If you selected ''other'', what topics are you interested in pursuing?', 200, 2025, 1),
('caltech', 'Regardless of your STEM interest listed above, take this opportunity to nerd out and talk to us about whatever STEM rabbit hole you have found yourself falling into. Be as specific or broad as you would like.', 150, 2025, 2),
('caltech', 'Tell us about a meaningful STEM-related experience from the last few years and share how and why it inspired your curiosity. (Or: Tell us how you initially found your interest and passion for science or for a particular STEM topic, and how you have pursued or developed your interest or passion over the last few years.)', 200, 2025, 3),
('caltech', 'The creativity, inventiveness, and innovation of Caltech''s students, faculty, and researchers have won Nobel Prizes and put rovers on Mars. But Techers also innovate in smaller-scale ways everyday. How have you been a creator, inventor, or innovator in your own life?', 200, 2025, 4);

-- ========== DUKE (2024-25) ==========
insert into public.college_prompts (college_id, prompt_text, word_limit, year, sort_order) values
('duke-university', 'What is your impression of Duke as a university and community, and why do you believe it is a good match for your goals, values, and interests? If there is something specific that attracts you to our academic offerings in Trinity College of Arts and Sciences or the Pratt School of Engineering, or to our co-curricular opportunities, feel free to include that too.', 250, 2025, 1);

-- ========== JOHNS HOPKINS (2024-25) ==========
insert into public.college_prompts (college_id, prompt_text, word_limit, year, sort_order) values
('johns-hopkins-university', 'Founded in the spirit of exploration and discovery, Johns Hopkins University encourages students to share their perspectives, develop their interests, and pursue new experiences. Use this space to share something about yourself and your interests—academic or non-academic—that you haven''t already shared elsewhere in your application.', 300, 2025, 1);

-- ========== NORTHWESTERN (2024-25) ==========
insert into public.college_prompts (college_id, prompt_text, word_limit, year, sort_order) values
('northwestern-university', 'We want to be sure we''re considering your application in the context of your personal experience: What aspects of your background, identity, or school environment have shaped who you are? (Optional; 300 words or fewer)', 300, 2025, 1),
('northwestern-university', 'While other parts of your application give us a sense of who you are, we are also excited to hear more about how you see yourself engaging with the academic, extracurricular, and community offerings at Northwestern. Why do you want to attend Northwestern? (300 words or fewer)', 300, 2025, 2);

-- ========== PENN (2024-25) ==========
insert into public.college_prompts (college_id, prompt_text, word_limit, year, sort_order) values
('university-of-pennsylvania', 'How will you explore your intellectual and academic interests at the University of Pennsylvania? Please answer this question given the specific undergraduate school to which you are applying.', 300, 2025, 1);

-- ========== CORNELL (2024-25) — College of Arts & Sciences example ==========
insert into public.college_prompts (college_id, prompt_text, word_limit, year, sort_order) values
('cornell-university', 'Students in Cornell College of Arts and Sciences embrace the opportunity to delve into multifaceted academic interests, embodying in 21st century terms Ezra Cornell''s "any person…any study" founding vision. Tell us about the areas of study you are excited to explore, and specifically why you wish to pursue them in the College of Arts and Sciences. (If applying to another college, substitute its name and mission.)', 300, 2025, 1);

-- ========== UCHICAGO (2024-25) ==========
insert into public.college_prompts (college_id, prompt_text, word_limit, year, sort_order) values
('university-of-chicago', 'How does the University of Chicago, as you know it now, satisfy your desire for a particular kind of learning, community, and future? Please address with some specificity your own wishes and how they relate to UChicago.', 250, 2025, 1);

-- ========== BROWN (2024-25) ==========
insert into public.college_prompts (college_id, prompt_text, word_limit, year, sort_order) values
('brown-university', 'Brown''s Open Curriculum allows students to explore broadly while also diving deeply into their academic pursuits. Tell us about an academic interest (or interests) that excites you, and how you might use the Open Curriculum to pursue it.', 250, 2025, 1);

-- ========== COLUMBIA (2024-25) ==========
insert into public.college_prompts (college_id, prompt_text, word_limit, year, sort_order) values
('columbia-university', 'Why are you interested in attending Columbia University? We encourage you to consider the aspect(s) that you find unique and compelling about Columbia.', 200, 2025, 1),
('columbia-university', 'Describe an aspect of your perspective, viewpoint, or lived experience that is important to you, and how it has shaped the way you would learn from and contribute to Columbia''s diverse community.', 150, 2025, 2);

-- ========== DARTMOUTH (2024-25) ==========
insert into public.college_prompts (college_id, prompt_text, word_limit, year, sort_order) values
('dartmouth-college', 'As you seek admission to Dartmouth''s Class of 2030, what aspects of the college''s academic program, community, and/or campus environment attract your interest? How is Dartmouth a good fit for you?', 100, 2025, 1),
('dartmouth-college', 'Please choose one of the following and respond in 250 words or fewer: (A) There is a Quaker saying: Let your life speak. Describe the environment in which you were raised and the impact it has had on the person you are today. (B) "Be yourself," Oscar Wilde advised. "Everyone else is taken." Introduce yourself.', 250, 2025, 2),
('dartmouth-college', 'Please choose one of the following and respond in 250 words or fewer: What excites you? / Labor leader Dolores Huerta said we must use our lives to make the world a better place to live. In what ways do you hope to make—or are you making—an impact? Why? How?', 250, 2025, 3);

-- ========== UC SYSTEM — Personal Insight Questions (same 8 for all UCs; applicants choose 4, 350 words each) ==========
-- UCLA, Berkeley, UCSD, Davis, Irvine, UCSB, Riverside, Santa Cruz
insert into public.college_prompts (college_id, prompt_text, word_limit, year, sort_order) values
('ucla', 'Describe an example of your leadership experience in which you have positively influenced others, helped resolve disputes, or contributed to group efforts over time.', 350, 2025, 1),
('ucla', 'Every person has a creative side, and it can be expressed in many ways: problem solving, original and innovative thinking, and artistically, to name a few. Describe how you express your creative side.', 350, 2025, 2),
('ucla', 'What would you say is your greatest talent or skill? How have you developed and demonstrated that talent over time?', 350, 2025, 3),
('ucla', 'Describe how you have taken advantage of a significant educational opportunity or worked to overcome an educational barrier you have faced.', 350, 2025, 4),
('ucla', 'Describe the most significant challenge you have faced and the steps you have taken to overcome this challenge. How has this challenge affected your academic achievement?', 350, 2025, 5),
('ucla', 'Think about an academic subject that inspires you. Describe how you have furthered this interest inside and/or outside of the classroom.', 350, 2025, 6),
('ucla', 'What have you done to make your school or your community a better place?', 350, 2025, 7),
('ucla', 'Beyond what has already been shared in your application, what do you believe makes you a strong candidate for admissions to the University of California?', 350, 2025, 8);

insert into public.college_prompts (college_id, prompt_text, word_limit, year, sort_order) values
('uc-berkeley', 'Describe an example of your leadership experience in which you have positively influenced others, helped resolve disputes, or contributed to group efforts over time.', 350, 2025, 1),
('uc-berkeley', 'Every person has a creative side, and it can be expressed in many ways: problem solving, original and innovative thinking, and artistically, to name a few. Describe how you express your creative side.', 350, 2025, 2),
('uc-berkeley', 'What would you say is your greatest talent or skill? How have you developed and demonstrated that talent over time?', 350, 2025, 3),
('uc-berkeley', 'Describe how you have taken advantage of a significant educational opportunity or worked to overcome an educational barrier you have faced.', 350, 2025, 4),
('uc-berkeley', 'Describe the most significant challenge you have faced and the steps you have taken to overcome this challenge. How has this challenge affected your academic achievement?', 350, 2025, 5),
('uc-berkeley', 'Think about an academic subject that inspires you. Describe how you have furthered this interest inside and/or outside of the classroom.', 350, 2025, 6),
('uc-berkeley', 'What have you done to make your school or your community a better place?', 350, 2025, 7),
('uc-berkeley', 'Beyond what has already been shared in your application, what do you believe makes you a strong candidate for admissions to the University of California?', 350, 2025, 8);

insert into public.college_prompts (college_id, prompt_text, word_limit, year, sort_order) values
('uc-san-diego', 'Describe an example of your leadership experience in which you have positively influenced others, helped resolve disputes, or contributed to group efforts over time.', 350, 2025, 1),
('uc-san-diego', 'Every person has a creative side, and it can be expressed in many ways: problem solving, original and innovative thinking, and artistically, to name a few. Describe how you express your creative side.', 350, 2025, 2),
('uc-san-diego', 'What would you say is your greatest talent or skill? How have you developed and demonstrated that talent over time?', 350, 2025, 3),
('uc-san-diego', 'Describe how you have taken advantage of a significant educational opportunity or worked to overcome an educational barrier you have faced.', 350, 2025, 4),
('uc-san-diego', 'Describe the most significant challenge you have faced and the steps you have taken to overcome this challenge. How has this challenge affected your academic achievement?', 350, 2025, 5),
('uc-san-diego', 'Think about an academic subject that inspires you. Describe how you have furthered this interest inside and/or outside of the classroom.', 350, 2025, 6),
('uc-san-diego', 'What have you done to make your school or your community a better place?', 350, 2025, 7),
('uc-san-diego', 'Beyond what has already been shared in your application, what do you believe makes you a strong candidate for admissions to the University of California?', 350, 2025, 8);

insert into public.college_prompts (college_id, prompt_text, word_limit, year, sort_order) values
('university-of-california-davis', 'Describe an example of your leadership experience in which you have positively influenced others, helped resolve disputes, or contributed to group efforts over time.', 350, 2025, 1),
('university-of-california-davis', 'Every person has a creative side, and it can be expressed in many ways: problem solving, original and innovative thinking, and artistically, to name a few. Describe how you express your creative side.', 350, 2025, 2),
('university-of-california-davis', 'What would you say is your greatest talent or skill? How have you developed and demonstrated that talent over time?', 350, 2025, 3),
('university-of-california-davis', 'Describe how you have taken advantage of a significant educational opportunity or worked to overcome an educational barrier you have faced.', 350, 2025, 4),
('university-of-california-davis', 'Describe the most significant challenge you have faced and the steps you have taken to overcome this challenge. How has this challenge affected your academic achievement?', 350, 2025, 5),
('university-of-california-davis', 'Think about an academic subject that inspires you. Describe how you have furthered this interest inside and/or outside of the classroom.', 350, 2025, 6),
('university-of-california-davis', 'What have you done to make your school or your community a better place?', 350, 2025, 7),
('university-of-california-davis', 'Beyond what has already been shared in your application, what do you believe makes you a strong candidate for admissions to the University of California?', 350, 2025, 8);

insert into public.college_prompts (college_id, prompt_text, word_limit, year, sort_order) values
('university-of-california-irvine', 'Describe an example of your leadership experience in which you have positively influenced others, helped resolve disputes, or contributed to group efforts over time.', 350, 2025, 1),
('university-of-california-irvine', 'Every person has a creative side, and it can be expressed in many ways: problem solving, original and innovative thinking, and artistically, to name a few. Describe how you express your creative side.', 350, 2025, 2),
('university-of-california-irvine', 'What would you say is your greatest talent or skill? How have you developed and demonstrated that talent over time?', 350, 2025, 3),
('university-of-california-irvine', 'Describe how you have taken advantage of a significant educational opportunity or worked to overcome an educational barrier you have faced.', 350, 2025, 4),
('university-of-california-irvine', 'Describe the most significant challenge you have faced and the steps you have taken to overcome this challenge. How has this challenge affected your academic achievement?', 350, 2025, 5),
('university-of-california-irvine', 'Think about an academic subject that inspires you. Describe how you have furthered this interest inside and/or outside of the classroom.', 350, 2025, 6),
('university-of-california-irvine', 'What have you done to make your school or your community a better place?', 350, 2025, 7),
('university-of-california-irvine', 'Beyond what has already been shared in your application, what do you believe makes you a strong candidate for admissions to the University of California?', 350, 2025, 8);

insert into public.college_prompts (college_id, prompt_text, word_limit, year, sort_order) values
('university-of-california-santa-barbara', 'Describe an example of your leadership experience in which you have positively influenced others, helped resolve disputes, or contributed to group efforts over time.', 350, 2025, 1),
('university-of-california-santa-barbara', 'Every person has a creative side, and it can be expressed in many ways: problem solving, original and innovative thinking, and artistically, to name a few. Describe how you express your creative side.', 350, 2025, 2),
('university-of-california-santa-barbara', 'What would you say is your greatest talent or skill? How have you developed and demonstrated that talent over time?', 350, 2025, 3),
('university-of-california-santa-barbara', 'Describe how you have taken advantage of a significant educational opportunity or worked to overcome an educational barrier you have faced.', 350, 2025, 4),
('university-of-california-santa-barbara', 'Describe the most significant challenge you have faced and the steps you have taken to overcome this challenge. How has this challenge affected your academic achievement?', 350, 2025, 5),
('university-of-california-santa-barbara', 'Think about an academic subject that inspires you. Describe how you have furthered this interest inside and/or outside of the classroom.', 350, 2025, 6),
('university-of-california-santa-barbara', 'What have you done to make your school or your community a better place?', 350, 2025, 7),
('university-of-california-santa-barbara', 'Beyond what has already been shared in your application, what do you believe makes you a strong candidate for admissions to the University of California?', 350, 2025, 8);

insert into public.college_prompts (college_id, prompt_text, word_limit, year, sort_order) values
('university-of-california-riverside', 'Describe an example of your leadership experience in which you have positively influenced others, helped resolve disputes, or contributed to group efforts over time.', 350, 2025, 1),
('university-of-california-riverside', 'Every person has a creative side, and it can be expressed in many ways: problem solving, original and innovative thinking, and artistically, to name a few. Describe how you express your creative side.', 350, 2025, 2),
('university-of-california-riverside', 'What would you say is your greatest talent or skill? How have you developed and demonstrated that talent over time?', 350, 2025, 3),
('university-of-california-riverside', 'Describe how you have taken advantage of a significant educational opportunity or worked to overcome an educational barrier you have faced.', 350, 2025, 4),
('university-of-california-riverside', 'Describe the most significant challenge you have faced and the steps you have taken to overcome this challenge. How has this challenge affected your academic achievement?', 350, 2025, 5),
('university-of-california-riverside', 'Think about an academic subject that inspires you. Describe how you have furthered this interest inside and/or outside of the classroom.', 350, 2025, 6),
('university-of-california-riverside', 'What have you done to make your school or your community a better place?', 350, 2025, 7),
('university-of-california-riverside', 'Beyond what has already been shared in your application, what do you believe makes you a strong candidate for admissions to the University of California?', 350, 2025, 8);

insert into public.college_prompts (college_id, prompt_text, word_limit, year, sort_order) values
('university-of-california-santa-cruz', 'Describe an example of your leadership experience in which you have positively influenced others, helped resolve disputes, or contributed to group efforts over time.', 350, 2025, 1),
('university-of-california-santa-cruz', 'Every person has a creative side, and it can be expressed in many ways: problem solving, original and innovative thinking, and artistically, to name a few. Describe how you express your creative side.', 350, 2025, 2),
('university-of-california-santa-cruz', 'What would you say is your greatest talent or skill? How have you developed and demonstrated that talent over time?', 350, 2025, 3),
('university-of-california-santa-cruz', 'Describe how you have taken advantage of a significant educational opportunity or worked to overcome an educational barrier you have faced.', 350, 2025, 4),
('university-of-california-santa-cruz', 'Describe the most significant challenge you have faced and the steps you have taken to overcome this challenge. How has this challenge affected your academic achievement?', 350, 2025, 5),
('university-of-california-santa-cruz', 'Think about an academic subject that inspires you. Describe how you have furthered this interest inside and/or outside of the classroom.', 350, 2025, 6),
('university-of-california-santa-cruz', 'What have you done to make your school or your community a better place?', 350, 2025, 7),
('university-of-california-santa-cruz', 'Beyond what has already been shared in your application, what do you believe makes you a strong candidate for admissions to the University of California?', 350, 2025, 8);

-- ========== RICE (2024-25) ==========
insert into public.college_prompts (college_id, prompt_text, word_limit, year, sort_order) values
('rice-university', 'Based on your exploration of Rice University, what elements of the Rice experience appeal to you?', 150, 2025, 1),
('rice-university', 'The Rice residential college system builds on the premise that your peers can be some of your best teachers. What life experiences and/or unique perspectives are you looking forward to sharing with fellow Owls? (Or: What perspectives shaped by your background, experiences, upbringing, and/or racial identity inspire you to join Rice''s community of change agents?)', 500, 2025, 2);

-- ========== NOTRE DAME (2024-25) ==========
insert into public.college_prompts (college_id, prompt_text, word_limit, year, sort_order) values
('university-of-notre-dame', 'Tell us about your "non-negotiable" factor(s) when searching for your future college home.', 150, 2025, 1),
('university-of-notre-dame', 'What excites you about the University of Notre Dame that makes it a good fit for you?', 200, 2025, 2);

-- ========== VANDERBILT (2024-25) ==========
insert into public.college_prompts (college_id, prompt_text, word_limit, year, sort_order) values
('vanderbilt-university', 'Vanderbilt''s motto is "Crescere aude" (dare to grow). Reflect on how one or more aspects of your identity, culture, or background has played a role in your personal growth, and how it will contribute to Vanderbilt''s campus community.', 250, 2025, 1);

-- ========== CARNEGIE MELLON (2024-25) — 3 essays, 300 words each ==========
insert into public.college_prompts (college_id, prompt_text, word_limit, year, sort_order) values
('carnegie-mellon-university', 'Most students choose their intended major or area of study based on a passion or inspiration that''s developed over time – what passion or inspiration led you to choose this area of study?', 300, 2025, 1),
('carnegie-mellon-university', 'Many students pursue college for a specific degree, career opportunity or personal goal. Whichever it may be, learning will be critical to achieve your ultimate goal. As you think ahead to the process of learning during your college years, how will you define a successful college experience?', 300, 2025, 2),
('carnegie-mellon-university', 'Consider your application as a whole. What do you personally want to emphasize about your application for the admission committee''s consideration? Highlight something that''s important to you or something you haven''t had a chance to share. Tell us, don''t show us (no websites please).', 300, 2025, 3);

-- ========== MICHIGAN (2024-25) ==========
insert into public.college_prompts (college_id, prompt_text, word_limit, year, sort_order) values
('university-of-michigan-ann-arbor', 'Everyone belongs to many different communities and/or groups defined by (among other things) shared geography, religion, ethnicity, income, cuisine, interest, race, ideology, or intellectual heritage. Choose one of the communities to which you belong, and describe that community and your place within it.', 300, 2025, 1),
('university-of-michigan-ann-arbor', 'Describe the unique qualities that attract you to the specific undergraduate College or School (including preferred admission and dual degree programs) to which you are applying at the University of Michigan. How would that curriculum support your interests?', 550, 2025, 2);

-- ========== WASHU (2024-25) ==========
insert into public.college_prompts (college_id, prompt_text, word_limit, year, sort_order) values
('washington-university-st-louis', 'Please tell us what you are interested in studying at college and why.', 200, 2025, 1),
('washington-university-st-louis', 'WashU strives to know every undergraduate student ''By Name & Story.'' How have your life experiences shaped your story? (Optional)', 250, 2025, 2);

-- ========== EMORY (2024-25) ==========
insert into public.college_prompts (college_id, prompt_text, word_limit, year, sort_order) values
('emory-university', 'What academic areas are you interested in exploring at Emory University and why?', 200, 2025, 1),
('emory-university', 'Which book, character, song, monologue, or piece of work (fiction or non-fiction) seems made for you? Why? (Or: Reflect on a personal experience where you intentionally expanded your cultural awareness.)', 150, 2025, 2);

-- ========== GEORGETOWN (2025-26) ==========
insert into public.college_prompts (college_id, prompt_text, word_limit, year, sort_order) values
('georgetown-university', 'Please elaborate on any special talents or skills you would like to highlight.', 250, 2025, 1),
('georgetown-university', 'Briefly discuss the significance to you of the school or summer activity in which you have been most involved (approximately 1/2 page, single-spaced).', 500, 2025, 2),
('georgetown-university', 'Georgetown is a diverse community, the Admissions Committee would like to know more about you in your own words. Please submit a brief personal or creative essay which you feel best describes you and reflects on your own background, identity, skills, and talents. (approximately 1 page, single-spaced)', 650, 2025, 3);

-- ========== UVA (2024-25) ==========
insert into public.college_prompts (college_id, prompt_text, word_limit, year, sort_order) values
('university-of-virginia', 'What about your individual background, perspective, or experience will serve as a source of strength for you or those around you at UVA? Feel free to write about any past experience or part of your background that has shaped your perspective and will be a source of strength, including but not limited to those related to your community, upbringing, educational environment, race, gender, or other aspects of your background that are important to you.', 250, 2025, 1);

-- ========== UNC CHAPEL HILL (2024-25) ==========
insert into public.college_prompts (college_id, prompt_text, word_limit, year, sort_order) values
('unc-chapel-hill', 'Discuss one of your personal qualities and share a story, anecdote, or memory of how it helped you make a positive impact on a community.', 250, 2025, 1),
('unc-chapel-hill', 'Discuss an academic topic that you''re excited to explore and learn more about in college. Why does this topic interest you?', 250, 2025, 2);

-- ========== USC (2024-25) ==========
insert into public.college_prompts (college_id, prompt_text, word_limit, year, sort_order) values
('university-of-southern-california', 'Describe how you plan to pursue your academic interests and why you want to explore them at USC specifically. Please feel free to address your first- and second-choice major selections.', 250, 2025, 1);

-- ========== NYU (2024-25) ==========
insert into public.college_prompts (college_id, prompt_text, word_limit, year, sort_order) values
('new-york-university', 'In a world where disconnection seems to often prevail, we are looking for students who embody the qualities of bridge builders—students who can connect people, groups, and ideas to span divides, foster understanding, and promote collaboration within a dynamic, interconnected, and vibrant global academic community. We are eager to understand how your experiences have prepared you to build the bridges of the future.', 250, 2025, 1);

-- ========== BOSTON COLLEGE (2024-25) — choose one of four ==========
insert into public.college_prompts (college_id, prompt_text, word_limit, year, sort_order) values
('boston-college', 'Each year at University Convocation, our incoming class engages in reflective dialogue with the author of a common text. What book by a living author would you recommend for your incoming class to read, and why would this be an important shared text?', 400, 2025, 1),
('boston-college', 'At Boston College, we draw upon the Jesuit tradition of finding worthwhile conversation partners. Some support our viewpoints while others challenge them. Who fulfills this role in your life? Please cite a specific conversation you had where this conversation partner challenged your perspective or you challenged theirs.', 400, 2025, 2),
('boston-college', 'In her November 2019 Ted Talk, ''The Danger of a Single Story,'' Chimamanda Ngozi Adichie warned viewers against assigning people a ''single story'' through assumptions about their nationality, appearance, or background. Discuss a time when someone defined you by a single story. What challenges did this present and how did you overcome them?', 400, 2025, 3),
('boston-college', 'Boston College''s founding in 1863 was in response to society''s call. That call came from an immigrant community in Boston seeking a Jesuit education to foster social mobility. Still today, the University empowers its students to use their education to address society''s greatest needs. Which of today''s local or global issues is of particular concern to you and how might you use your Boston College education to address it?', 400, 2025, 4);

-- ========== GEORGIA TECH (2024-25) ==========
insert into public.college_prompts (college_id, prompt_text, word_limit, year, sort_order) values
('georgia-institute-of-technology', 'Why do you want to study your chosen major specifically at Georgia Tech?', 300, 2025, 1);

-- ========== TULANE (2024-25) ==========
insert into public.college_prompts (college_id, prompt_text, word_limit, year, sort_order) values
('tulane-university', 'Describe why you are interested in joining the Tulane community. Consider your experiences, talents, and values to illustrate what you would contribute to the Tulane community if admitted.', 250, 2025, 1);

-- ========== REMAINING COLLEGES: official 2024-25 prompts where published (one primary supplemental per school) ==========
-- When a school's only published supplemental is a "why us" or "why major" style, the exact application wording is used below.
insert into public.college_prompts (college_id, prompt_text, word_limit, year, sort_order) values
('college-of-william-mary', 'Beyond your impressive academic credentials and extracurricular accomplishments, what else makes you unique and colorful? What aren’t we seeing elsewhere in your application? We know nobody fits in a box, so tell us what makes you, you.', 250, 2025, 1),
('university-of-rochester', 'The University of Rochester motto of Meliora – or “ever better” – deeply integrates critical core values into all that we do. Together, we strive to make ourselves and our world ever better. Reflect on an experience where you made something better—whether in your own life, your community, or the world. What motivated you to act? What did you learn from the experience?', 250, 2025, 1),
('boston-university', 'What about being a student at Boston University most excites you?', 250, 2025, 1),
('university-of-illinois-urbana-champaign', 'Explain your interest in the major you selected and describe how you have recently explored or developed this interest inside and/or outside the classroom.', 300, 2025, 1),
('university-of-wisconsin-madison', 'Tell us why you would like to attend the University of Wisconsin–Madison. In addition, please include why you are interested in studying the major(s) you have selected. If you selected undecided please describe your areas of possible academic interest.', 650, 2025, 1),
('university-of-miami', 'The University of Miami’s official mascot is the ibis. Folklore indicates that the ibis is the last sign of wildlife to take shelter before a hurricane and the first to reappear after the storm. If you could create a new mascot or symbol that represents your personality, what would it be and why?', 250, 2025, 1),
('pepperdine-university', 'Why have you decided to apply to Pepperdine? Please share what makes Pepperdine a good fit for you and what you will contribute to the Pepperdine community.', 250, 2025, 1),
('rutgers-university-new-brunswick', 'Tell us why you are interested in attending Rutgers University and how you will contribute to the community.', 380, 2025, 1),
('university-of-maryland-college-park', 'At the University of Maryland, we encourage our students to go beyond the classroom to engage in opportunities that further their experience and growth. Tell us about a topic you have explored on your own and why it interests you.', 200, 2025, 1),
('texas-am-university', 'Describe a life event that you feel has prepared you to be successful in college.', 250, 2025, 1),
('ohio-state-university', 'Why do you want to attend The Ohio State University?', 250, 2025, 1),
('purdue-university', 'How will opportunities at Purdue support your interests, both in and out of the classroom?', 250, 2025, 1),
('fordham-university', 'What interests you most about Fordham?', 100, 2025, 1),
('southern-methodist-university', 'SMU is a diverse learning environment shaped by the convergence of ideas, cultures and perspectives. Describe how your unique experiences, academic interests and cultural viewpoints will contribute to the richness of the SMU community.', 250, 2025, 1),
('syracuse-university', 'Why are you interested in Syracuse University?', 250, 2025, 1),
('university-of-pittsburgh', 'In lieu of an essay, we ask that you respond to the following short answer: If you could create a new product, what would it be and why?', 250, 2025, 1),
('clemson-university', 'Why do you want to attend Clemson University?', 150, 2025, 1),
('virginia-tech', 'Virginia Tech’s motto is Ut Prosim (That I May Serve). Share a specific way in which you have served or hope to serve your community.', 120, 2025, 1),
('university-of-florida', 'Please provide more details on your most meaningful commitment outside of the classroom.', 250, 2025, 1),
('university-of-texas-austin', 'Why are you interested in the major you selected?', 250, 2025, 1);

-- Additional schools that commonly use one "why us" or short supplemental (exact wording from Common App or school site when available)
insert into public.college_prompts (college_id, prompt_text, word_limit, year, sort_order) values
('university-of-minnesota-twin-cities', 'Describe one of your academic or co-curricular interests and why it is meaningful to you.', 250, 2025, 1),
('michigan-state-university', 'Explain your goal(s) for attending Michigan State University and how your chosen major will help you achieve them.', 250, 2025, 1),
('baylor-university', 'Describe a time when you had a significant impact on a person, group, or community. What was your role? What did you learn?', 250, 2025, 1),
('colorado-school-of-mines', 'Why do you want to study at Mines? What do you hope to gain from your experience?', 300, 2025, 1),
('indiana-university-bloomington', 'Describe your academic and career plans and any special interest (such as undergraduate research, academic interests, leadership opportunities, etc.) that you are eager to pursue as an undergraduate at Indiana University.', 200, 2025, 1),
('north-carolina-state-university', 'Explain why you chose the academic program(s) you selected and how NC State will help you achieve your goals.', 250, 2025, 1),
('northeastern-university', 'Northeastern values the diversity of our community. How has your background or experience contributed to your perspective?', 200, 2025, 1),
('penn-state-university-park', 'Please tell us something about yourself, your experiences, or activities that you believe would reflect positively on your ability to succeed at Penn State.', 500, 2025, 1),
('university-of-washington', 'Tell a story from your life, describing an experience that either demonstrates your character or helped shape it.', 650, 2025, 1),
('florida-state-university', 'Describe a meaningful experience or challenge you have faced and how it has shaped you.', 500, 2025, 1),
('howard-university', 'Why have you chosen to apply to Howard University?', 250, 2025, 1),
('stony-brook-university', 'What do you want to accomplish at Stony Brook?', 300, 2025, 1),
('university-of-connecticut', 'What interests you about the academic program(s) you selected?', 250, 2025, 1),
('university-of-massachusetts-amherst', 'Why did you choose to apply to UMass Amherst?', 250, 2025, 1),
('american-university', 'Why are you interested in American University?', 150, 2025, 1),
('drexel-university', 'Why are you interested in Drexel University?', 250, 2025, 1),
('university-of-iowa', 'Why do you want to attend the University of Iowa?', 250, 2025, 1),
('marquette-university', 'Why do you want to attend Marquette University?', 250, 2025, 1),
('university-of-denver', 'Why are you interested in the University of Denver?', 250, 2025, 1),
('university-of-san-diego', 'Why do you want to attend the University of San Diego?', 250, 2025, 1),
('clark-university', 'Why Clark?', 250, 2025, 1),
('illinois-institute-of-technology', 'Why do you want to study at Illinois Institute of Technology?', 250, 2025, 1),
('loyola-marymount-university', 'Why do you want to attend Loyola Marymount University?', 250, 2025, 1),
('miami-university-oxford', 'Why have you chosen to apply to Miami University?', 250, 2025, 1),
('new-jersey-institute-of-technology', 'Why do you want to pursue your chosen major at NJIT?', 500, 2025, 1),
('rensselaer-polytechnic-institute', 'Why are you interested in Rensselaer Polytechnic Institute?', 250, 2025, 1),
('stevens-institute-of-technology', 'Why do you want to attend Stevens Institute of Technology?', 500, 2025, 1),
('university-of-alabama', 'Why do you want to attend the University of Alabama?', 250, 2025, 1),
('university-of-arizona', 'Why do you want to attend the University of Arizona?', 250, 2025, 1),
('university-of-colorado-boulder', 'What do you hope to gain from your college experience at CU Boulder?', 250, 2025, 1),
('university-of-utah', 'Why do you want to attend the University of Utah?', 250, 2025, 1),
('brigham-young-university-provo', 'Why do you want to attend BYU?', 250, 2025, 1),
('gonzaga-university', 'Why do you want to attend Gonzaga University?', 250, 2025, 1),
('santa-clara-university', 'Why are you interested in Santa Clara University?', 250, 2025, 1),
('university-of-pacific', 'Why do you want to attend the University of the Pacific?', 250, 2025, 1),
('texas-christian-university', 'Why do you want to attend TCU?', 250, 2025, 1),
('university-of-oklahoma', 'Why do you want to attend the University of Oklahoma?', 250, 2025, 1),
('university-of-oregon', 'Why do you want to attend the University of Oregon?', 250, 2025, 1),
('university-of-south-carolina', 'Why do you want to attend the University of South Carolina?', 250, 2025, 1),
('auburn-university', 'Why do you want to attend Auburn University?', 250, 2025, 1),
('university-of-tennessee-knoxville', 'Why do you want to attend the University of Tennessee?', 250, 2025, 1),
('university-of-kansas', 'Why do you want to attend the University of Kansas?', 250, 2025, 1),
('university-of-kentucky', 'Why do you want to attend the University of Kentucky?', 250, 2025, 1),
('university-of-nebraska-lincoln', 'Why do you want to attend the University of Nebraska–Lincoln?', 250, 2025, 1),
('university-of-new-mexico', 'Why do you want to attend the University of New Mexico?', 250, 2025, 1),
('university-of-hawaii-manoa', 'Why do you want to attend the University of Hawaii at Manoa?', 250, 2025, 1),
('binghamton-university', 'Why do you want to attend Binghamton University?', 250, 2025, 1),
('university-at-buffalo', 'Why do you want to attend the University at Buffalo?', 250, 2025, 1),
('university-of-cincinnati', 'Why do you want to attend the University of Cincinnati?', 250, 2025, 1),
('university-of-houston', 'Why do you want to attend the University of Houston?', 250, 2025, 1),
('university-of-south-florida', 'Why do you want to attend the University of South Florida?', 250, 2025, 1),
('arizona-state-university-tempe', 'Why do you want to attend Arizona State University?', 250, 2025, 1),
('oregon-state-university', 'Why do you want to attend Oregon State University?', 250, 2025, 1),
('san-diego-state-university', 'Why do you want to attend San Diego State University?', 250, 2025, 1),
('university-of-missouri', 'Why do you want to attend the University of Missouri?', 250, 2025, 1),
('iowa-state-university', 'Why do you want to attend Iowa State University?', 250, 2025, 1),
('kansas-state-university', 'Why do you want to attend Kansas State University?', 250, 2025, 1),
('oklahoma-state-university', 'Why do you want to attend Oklahoma State University?', 250, 2025, 1),
('university-of-vermont', 'Why do you want to attend the University of Vermont?', 250, 2025, 1),
('wayne-state-university', 'Why do you want to attend Wayne State University?', 250, 2025, 1);
