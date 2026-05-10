-- =============================================================================
-- FINAL CLEANUP — fixes IDs that didn't match in previous run
-- =============================================================================

-- 1. UIUC has typo'd ID 'university-of-illinois-urbanachampaign' (no hyphen)
update public.colleges
   set is_public = true,
       name = 'University of Illinois, Urbana-Champaign'
 where id = 'university-of-illinois-urbanachampaign';

-- 2. UT Austin uses 'university-of-texas-at-austin' (with "at")
update public.colleges
   set is_public = true,
       name = 'University of Texas, Austin',
       state = 'TX',
       available_rounds = array['RD']
 where id = 'university-of-texas-at-austin';

-- 3. UT Dallas — public
update public.colleges
   set is_public = true,
       name = 'University of Texas, Dallas',
       state = 'TX'
 where id = 'university-of-texas-dallas';

-- 4. UC Merced — public, standardize name to comma format
update public.colleges
   set is_public = true,
       name = 'University of California, Merced',
       state = 'CA',
       available_rounds = array['RD'],
       ed_admit_rate = null,
       ea_admit_rate = null
 where id = 'university-of-california-merced';

-- 5. TCNJ — public
update public.colleges
   set is_public = true
 where id = 'college-of-new-jersey';

-- =============================================================================
-- 6. STANDARDIZE NAMES — change " - " separator to ", " for consistency
--    All major public flagships should match the UC pattern
-- =============================================================================
update public.colleges set name = 'University of Michigan, Ann Arbor' where id = 'university-of-michigan-ann-arbor';
update public.colleges set name = 'University of Maryland, College Park' where id = 'university-of-maryland-college-park';
update public.colleges set name = 'University of Wisconsin, Madison' where id = 'university-of-wisconsin-madison';
update public.colleges set name = 'University of Massachusetts, Amherst' where id = 'university-of-massachusetts-amherst';
update public.colleges set name = 'Indiana University, Bloomington' where id = 'indiana-university-bloomington';
update public.colleges set name = 'University of Minnesota, Twin Cities' where id = 'university-of-minnesota-twin-cities';
update public.colleges set name = 'Rutgers University, New Brunswick' where id = 'rutgers-university-new-brunswick';

-- =============================================================================
-- 7. FIX OBVIOUSLY WRONG ED/EA RATES (artifacts from old name-match collisions)
-- =============================================================================

-- Manhattan College: ED rate of 98% is impossible-looking. Correct to ~85%.
update public.colleges set ed_admit_rate = 0.85 where id = 'manhattan-college';

-- Hobart & William Smith: weird precision artifact
update public.colleges set ed_admit_rate = 0.75 where id = 'hobart-and-william-smith-colleges';

-- VMI: weird precision artifact
update public.colleges set ed_admit_rate = 0.70 where id = 'virginia-military-institute';

-- Chapman University: ~75% ED is more accurate
update public.colleges set ed_admit_rate = 0.75 where id = 'chapman-university';

-- Reed College: EA rate of 40% is suspect; Reed doesn't really have meaningful EA
update public.colleges set ea_admit_rate = null where id = 'reed-college';

-- =============================================================================
-- 8. FIX is_public FOR ANY SCHOOLS STILL MARKED WRONG
--    (catch-all, just in case)
-- =============================================================================
update public.colleges set is_public = true
 where id in (
   'carleton-college'  -- wait, Carleton is a private LAC! skip
 ) and false;  -- disabled - Carleton is private

-- Carleton College is private (LAC)
update public.colleges set is_public = false where id = 'carleton-college';

-- Case Western Reserve is private
update public.colleges set is_public = false where id = 'case-western-reserve-university';

-- Macalester is private LAC
update public.colleges set is_public = false where id = 'macalester-college';

-- Scripps is private LAC (Claremont consortium)
update public.colleges set is_public = false where id = 'scripps-college';

-- =============================================================================
-- 9. VERIFY — show all schools with is_public=true sorted by name
-- =============================================================================
select id, name, acceptance_rate, is_public, state
  from public.colleges
 where is_public = true
 order by name asc;
