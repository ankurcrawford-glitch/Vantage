-- Corrections to college mottos from user review.
-- Each fix documents the reason for the change so we can audit later.
-- Safe to run multiple times.

-- Bowdoin College
-- Correct Latin per Wikipedia is 'Ut Aquila Versus Coelum'.
update public.colleges set
  motto = 'Ut Aquila Versus Coelum',
  motto_translation = 'As an eagle towards the sky'
where id = 'bowdoin-college';

-- University of Miami
-- SloganList listing is 'Magna est Veritas' = "Great is the Truth".
-- Previously I wrote 'Sapientia et Doctrina' which was copied from Fordham.
update public.colleges set
  motto = 'Magna est Veritas',
  motto_translation = 'Great is the Truth'
where id = 'university-of-miami';

-- Barnard College
-- Earlier seed used 'Hypereides' which is not a motto — it's the name of a
-- Greek orator. Barnard's actual motto in common use is the English
-- 'Following the Way of Reason'. There is no standard Latin or Greek form.
update public.colleges set
  motto = 'Following the Way of Reason',
  motto_translation = null
where id = 'barnard-college';

-- Verify
select id, name, motto, motto_translation
from public.colleges
where id in ('bowdoin-college', 'university-of-miami', 'barnard-college')
order by name;
