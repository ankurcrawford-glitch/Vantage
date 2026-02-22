-- Run in Supabase SQL Editor to remove duplicate colleges (same name, different id).
-- Keeps one row per name: prefers canonical ids (Yale, Vanderbilt, Notre Dame, UChicago, Berkeley);
-- otherwise keeps the row with the smallest id. Updates college_prompts and user_colleges to point
-- to the kept college, then deletes the duplicate row. (Essays link via college_prompt_id; no change needed.)
-- Run once if you see colleges listed twice.

-- 1. Temp: which id to keep per duplicate name
CREATE TEMP TABLE name_keep AS
SELECT
  c.name,
  COALESCE(
    CASE c.name
      WHEN 'Yale University' THEN 'yale-university'
      WHEN 'Vanderbilt University' THEN 'vanderbilt-university'
      WHEN 'University of Notre Dame' THEN 'university-of-notre-dame'
      WHEN 'University of Chicago' THEN 'university-of-chicago'
      WHEN 'University of California, Berkeley' THEN 'uc-berkeley'
      ELSE NULL
    END,
    (SELECT min(c2.id) FROM public.colleges c2 WHERE c2.name = c.name)
  ) AS keep_id
FROM public.colleges c
GROUP BY c.name
HAVING count(*) > 1;

-- 2. Temp: map each duplicate id to its keep_id
CREATE TEMP TABLE id_to_keep_id AS
SELECT c.id AS duplicate_id, nk.keep_id
FROM public.colleges c
JOIN name_keep nk ON nk.name = c.name AND nk.keep_id <> c.id;

-- 3. Point college_prompts to the kept college (subquery style – no FROM-clause reference issue)
UPDATE public.college_prompts
SET college_id = (SELECT m.keep_id FROM id_to_keep_id m WHERE m.duplicate_id = college_prompts.college_id)
WHERE college_id IN (SELECT duplicate_id FROM id_to_keep_id);

-- 4. Point user_colleges to the kept college
UPDATE public.user_colleges
SET college_id = (SELECT m.keep_id FROM id_to_keep_id m WHERE m.duplicate_id = user_colleges.college_id)
WHERE college_id IN (SELECT duplicate_id FROM id_to_keep_id);

-- 5. Remove duplicate (user_id, college_id) rows in user_colleges (keep one)
DELETE FROM public.user_colleges a
USING public.user_colleges b
WHERE a.user_id = b.user_id AND a.college_id = b.college_id AND a.ctid < b.ctid;

-- 6. Delete duplicate college rows (essays link via college_prompt_id to college_prompts; we already updated college_prompts.college_id)
DELETE FROM public.colleges
WHERE id IN (SELECT duplicate_id FROM id_to_keep_id);
