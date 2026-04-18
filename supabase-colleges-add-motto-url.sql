-- Add motto and website_url columns to the colleges table and seed them for
-- all US national universities in the top-100 list, using motto text from
-- SloganList. Safe to run multiple times.
--
-- To add more schools not covered below:
--   1. Find the college's id in `colleges` (kebab-case).
--   2. Add an `update public.colleges set ...` block.
--   3. Re-run.
--
-- Verification query (run after applying):
--   select id, name, motto, website_url
--   from public.colleges
--   where motto is null
--   order by name;

-- 1. Add columns (no-op if already exist)
alter table public.colleges add column if not exists motto text;
alter table public.colleges add column if not exists motto_translation text;
alter table public.colleges add column if not exists website_url text;

-- 2. Seed. motto_translation only for non-English mottos.

-- Ivy League + MIT/Stanford/UChicago/Caltech
update public.colleges set motto = 'Dei Sub Numine Viget', motto_translation = 'Under God''s power she flourishes', website_url = 'https://www.princeton.edu' where id = 'princeton-university';
update public.colleges set motto = 'Mens et Manus', motto_translation = 'Mind and Hand', website_url = 'https://www.mit.edu' where id = 'mit';
update public.colleges set motto = 'Veritas', motto_translation = 'Truth', website_url = 'https://www.harvard.edu' where id = 'harvard-university';
update public.colleges set motto = 'Die Luft der Freiheit weht', motto_translation = 'The wind of freedom blows', website_url = 'https://www.stanford.edu' where id = 'stanford-university';
update public.colleges set motto = 'Lux et Veritas', motto_translation = 'Light and Truth', website_url = 'https://www.yale.edu' where id = 'yale-university';
update public.colleges set motto = 'The truth shall make you free', motto_translation = null, website_url = 'https://www.caltech.edu' where id = 'caltech';
update public.colleges set motto = 'Veritas vos liberabit', motto_translation = 'The truth shall make you free', website_url = 'https://www.jhu.edu' where id = 'johns-hopkins-university';
update public.colleges set motto = 'Eruditio et Religio', motto_translation = 'Erudition and Religion', website_url = 'https://www.duke.edu' where id = 'duke-university';
update public.colleges set motto = 'Quaecumque sunt vera', motto_translation = 'Whatsoever things are true', website_url = 'https://www.northwestern.edu' where id = 'northwestern-university';
update public.colleges set motto = 'Leges sine moribus vanae', motto_translation = 'Laws without morals are useless', website_url = 'https://www.upenn.edu' where id = 'university-of-pennsylvania';
update public.colleges set motto = 'I would found an institution where any person can find instruction in any study', motto_translation = null, website_url = 'https://www.cornell.edu' where id = 'cornell-university';
update public.colleges set motto = 'Crescat scientia; vita excolatur', motto_translation = 'Let knowledge grow from more to more; and so be human life enriched', website_url = 'https://www.uchicago.edu' where id = 'university-of-chicago';
update public.colleges set motto = 'In Deo Speramus', motto_translation = 'In God we hope', website_url = 'https://www.brown.edu' where id = 'brown-university';
update public.colleges set motto = 'In lumine Tuo videbimus lumen', motto_translation = 'In Thy light shall we see light', website_url = 'https://www.columbia.edu' where id = 'columbia-university';
update public.colleges set motto = 'Vox clamantis in deserto', motto_translation = 'The voice of one crying in the wilderness', website_url = 'https://www.dartmouth.edu' where id = 'dartmouth-college';

-- Other top privates
update public.colleges set motto = 'Letters, Science, Art', motto_translation = null, website_url = 'https://www.rice.edu' where id = 'rice-university';
update public.colleges set motto = 'Vita, Dulcedo, Spes', motto_translation = 'Our life, our sweetness, our hope', website_url = 'https://www.nd.edu' where id = 'university-of-notre-dame';
update public.colleges set motto = 'Crescere aude', motto_translation = 'Dare to grow', website_url = 'https://www.vanderbilt.edu' where id = 'vanderbilt-university';
update public.colleges set motto = 'My heart is in the work', motto_translation = null, website_url = 'https://www.cmu.edu' where id = 'carnegie-mellon-university';
update public.colleges set motto = 'Per veritatem vis', motto_translation = 'Strength through truth', website_url = 'https://wustl.edu' where id = 'washington-university-st-louis';
update public.colleges set motto = 'Cor prudentis possidebit scientiam', motto_translation = 'The wise heart will possess knowledge', website_url = 'https://www.emory.edu' where id = 'emory-university';
update public.colleges set motto = 'Utraque Unum', motto_translation = 'Both into One', website_url = 'https://www.georgetown.edu' where id = 'georgetown-university';
update public.colleges set motto = 'Ever to Excel', motto_translation = null, website_url = 'https://www.bc.edu' where id = 'boston-college';
update public.colleges set motto = 'Learning, Virtue, Piety', motto_translation = null, website_url = 'https://www.bu.edu' where id = 'boston-university';
update public.colleges set motto = 'Palmam qui meruit ferat', motto_translation = 'Let him who deserves it bear away the palm', website_url = 'https://www.usc.edu' where id = 'university-of-southern-california';
update public.colleges set motto = 'Perstare et praestare', motto_translation = 'To persevere and to excel', website_url = 'https://www.nyu.edu' where id = 'new-york-university';
update public.colleges set motto = 'Non sibi, sed suis', motto_translation = 'Not for one''s self, but for one''s own', website_url = 'https://tulane.edu' where id = 'tulane-university';
update public.colleges set motto = 'Ever better', motto_translation = null, website_url = 'https://www.rochester.edu' where id = 'university-of-rochester';
update public.colleges set motto = 'Sapientia et Doctrina', motto_translation = 'Wisdom and Learning', website_url = 'https://www.fordham.edu' where id = 'fordham-university';
update public.colleges set motto = 'Sapientia et Doctrina', motto_translation = 'Wisdom and Learning', website_url = 'https://www.miami.edu' where id = 'university-of-miami';
update public.colleges set motto = 'Freely you have received, freely give', motto_translation = null, website_url = 'https://www.pepperdine.edu' where id = 'pepperdine-university';
update public.colleges set motto = 'The truth will make you free', motto_translation = null, website_url = 'https://www.smu.edu' where id = 'southern-methodist-university';
update public.colleges set motto = 'Suos cultores scientia coronat', motto_translation = 'Knowledge crowns those who seek her', website_url = 'https://www.syracuse.edu' where id = 'syracuse-university';

-- UC system (all share Fiat Lux)
update public.colleges set motto = 'Fiat Lux', motto_translation = 'Let there be light', website_url = 'https://www.ucla.edu' where id = 'ucla';
update public.colleges set motto = 'Fiat Lux', motto_translation = 'Let there be light', website_url = 'https://www.berkeley.edu' where id = 'uc-berkeley';
update public.colleges set motto = 'Fiat Lux', motto_translation = 'Let there be light', website_url = 'https://ucsd.edu' where id = 'uc-san-diego';
update public.colleges set motto = 'Fiat Lux', motto_translation = 'Let there be light', website_url = 'https://www.ucdavis.edu' where id = 'university-of-california-davis';
update public.colleges set motto = 'Fiat Lux', motto_translation = 'Let there be light', website_url = 'https://uci.edu' where id = 'university-of-california-irvine';

-- Other public flagships
update public.colleges set motto = 'Lux Libertas', motto_translation = 'Light and Liberty', website_url = 'https://www.unc.edu' where id = 'unc-chapel-hill';
update public.colleges set motto = 'Artes, Scientia, Veritas', motto_translation = 'Art, Science, Truth', website_url = 'https://umich.edu' where id = 'university-of-michigan-ann-arbor';
update public.colleges set motto = 'Civium in moribus rei publicae salus', motto_translation = 'The welfare of the state depends upon the morals of its citizens', website_url = 'https://www.ufl.edu' where id = 'university-of-florida';
update public.colleges set motto = 'Numen Lumen', motto_translation = 'God, our light', website_url = 'https://www.wisc.edu' where id = 'university-of-wisconsin-madison';
update public.colleges set motto = 'Progress and Service', motto_translation = null, website_url = 'https://www.gatech.edu' where id = 'georgia-institute-of-technology';
update public.colleges set motto = 'Disciplina praesidium civitatis', motto_translation = 'Education, the Guardian of Society', website_url = 'https://www.utexas.edu' where id = 'university-of-texas-austin';
update public.colleges set motto = 'Education for Citizenship', motto_translation = null, website_url = 'https://www.osu.edu' where id = 'ohio-state-university';
update public.colleges set motto = 'Education, Research, Service', motto_translation = null, website_url = 'https://www.purdue.edu' where id = 'purdue-university';
update public.colleges set motto = 'Learning and Labor', motto_translation = null, website_url = 'https://illinois.edu' where id = 'university-of-illinois-urbana-champaign';
update public.colleges set motto = 'Sol iustitiae et occidentem illustra', motto_translation = 'Sun of righteousness, shine also upon the West', website_url = 'https://www.rutgers.edu' where id = 'rutgers-university-new-brunswick';

-- 3. Sanity check
select
  count(*) filter (where motto is not null) as seeded,
  count(*) filter (where motto is null) as remaining
from public.colleges;
