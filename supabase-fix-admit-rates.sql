-- Complete data fix for ALL colleges in the database.
-- Removes duplicates, standardizes names, forces correct acceptance rates.
-- Run in Supabase SQL Editor.

-- =============================================================================
-- 1. Remove duplicate rows
-- =============================================================================
delete from public.colleges
 where lower(name) = lower('Massachusetts Institute of Technology')
   and id != 'mit';

delete from public.colleges
 where lower(name) like '%university of wisconsin%madison%'
   and id != 'university-of-wisconsin-madison';

delete from public.colleges
 where lower(name) like '%pennsylvania state%university park%'
   and id != 'penn-state-university-park';

delete from public.colleges
 where lower(name) like '%indiana university%bloomington%'
   and id != 'indiana-university-bloomington';

-- =============================================================================
-- 2. Standardize UC names
-- =============================================================================
update public.colleges set name = 'University of California, Berkeley' where id = 'uc-berkeley';
update public.colleges set name = 'University of California, Los Angeles' where id = 'ucla';
update public.colleges set name = 'University of California, San Diego' where id = 'uc-san-diego';
update public.colleges set name = 'University of California, Davis' where id = 'university-of-california-davis';
update public.colleges set name = 'University of California, Irvine' where id = 'university-of-california-irvine';
update public.colleges set name = 'University of California, Santa Barbara' where id = 'university-of-california-santa-barbara';
update public.colleges set name = 'University of California, Santa Cruz' where id = 'university-of-california-santa-cruz';
update public.colleges set name = 'University of California, Riverside' where id = 'university-of-california-riverside';

-- =============================================================================
-- 3. Force correct acceptance rates for EVERY school
--    Using ID where possible, name match as fallback.
-- =============================================================================

-- Ivies
update public.colleges set acceptance_rate = 0.034 where id = 'harvard-university';
update public.colleges set acceptance_rate = 0.046 where id = 'princeton-university';
update public.colleges set acceptance_rate = 0.038 where id = 'yale-university';
update public.colleges set acceptance_rate = 0.039 where id = 'columbia-university';
update public.colleges set acceptance_rate = 0.058 where id = 'university-of-pennsylvania';
update public.colleges set acceptance_rate = 0.052 where id = 'brown-university';
update public.colleges set acceptance_rate = 0.075 where id = 'cornell-university';
update public.colleges set acceptance_rate = 0.060 where id = 'dartmouth-college';

-- Elite privates
update public.colleges set acceptance_rate = 0.036 where id = 'stanford-university';
update public.colleges set acceptance_rate = 0.045 where id = 'mit';
update public.colleges set acceptance_rate = 0.027 where id = 'caltech';
update public.colleges set acceptance_rate = 0.054 where id = 'university-of-chicago';
update public.colleges set acceptance_rate = 0.063 where id = 'duke-university';
update public.colleges set acceptance_rate = 0.071 where id = 'johns-hopkins-university';
update public.colleges set acceptance_rate = 0.071 where id = 'northwestern-university';
update public.colleges set acceptance_rate = 0.057 where id = 'vanderbilt-university';
update public.colleges set acceptance_rate = 0.077 where id = 'rice-university';
update public.colleges set acceptance_rate = 0.118 where id = 'washington-university-st-louis';
update public.colleges set acceptance_rate = 0.110 where id = 'emory-university';
update public.colleges set acceptance_rate = 0.090 where id = 'university-of-notre-dame';
update public.colleges set acceptance_rate = 0.110 where id = 'carnegie-mellon-university';
update public.colleges set acceptance_rate = 0.116 where id = 'georgetown-university';

-- Selective privates
update public.colleges set acceptance_rate = 0.090 where lower(name) = lower('Tufts University');
update public.colleges set acceptance_rate = 0.063 where lower(name) = lower('Northeastern University');
update public.colleges set acceptance_rate = 0.080 where id = 'new-york-university';
update public.colleges set acceptance_rate = 0.155 where id = 'boston-college';
update public.colleges set acceptance_rate = 0.108 where id = 'boston-university';
update public.colleges set acceptance_rate = 0.103 where id = 'university-of-southern-california';
update public.colleges set acceptance_rate = 0.130 where id = 'tulane-university';
update public.colleges set acceptance_rate = 0.185 where id = 'university-of-miami';
update public.colleges set acceptance_rate = 0.490 where id = 'pepperdine-university';
update public.colleges set acceptance_rate = 0.400 where id = 'university-of-rochester';

-- UC system
update public.colleges set acceptance_rate = 0.115 where id = 'uc-berkeley';
update public.colleges set acceptance_rate = 0.090 where id = 'ucla';
update public.colleges set acceptance_rate = 0.240 where id = 'uc-san-diego';
update public.colleges set acceptance_rate = 0.260 where id = 'university-of-california-santa-barbara';
update public.colleges set acceptance_rate = 0.210 where id = 'university-of-california-irvine';
update public.colleges set acceptance_rate = 0.370 where id = 'university-of-california-davis';
update public.colleges set acceptance_rate = 0.470 where id = 'university-of-california-santa-cruz';
update public.colleges set acceptance_rate = 0.660 where id = 'university-of-california-riverside';

-- Top public flagships
update public.colleges set acceptance_rate = 0.179 where id = 'university-of-michigan-ann-arbor';
update public.colleges set acceptance_rate = 0.190 where lower(name) = lower('University of Virginia');
update public.colleges set acceptance_rate = 0.180 where id = 'unc-chapel-hill';
update public.colleges set acceptance_rate = 0.160 where id = 'georgia-institute-of-technology';
update public.colleges set acceptance_rate = 0.305 where id = 'university-of-texas-austin';
update public.colleges set acceptance_rate = 0.230 where id = 'university-of-florida';
update public.colleges set acceptance_rate = 0.450 where id = 'university-of-illinois-urbana-champaign';
update public.colleges set acceptance_rate = 0.490 where id = 'university-of-wisconsin-madison';
update public.colleges set acceptance_rate = 0.430 where id = 'university-of-washington';
update public.colleges set acceptance_rate = 0.440 where id = 'university-of-maryland-college-park';
update public.colleges set acceptance_rate = 0.370 where id = 'college-of-william-mary';
update public.colleges set acceptance_rate = 0.500 where id = 'purdue-university';

-- Mid-tier publics
update public.colleges set acceptance_rate = 0.530 where id = 'ohio-state-university';
update public.colleges set acceptance_rate = 0.630 where id = 'texas-am-university';
update public.colleges set acceptance_rate = 0.660 where id = 'rutgers-university-new-brunswick';
update public.colleges set acceptance_rate = 0.470 where id = 'north-carolina-state-university';
update public.colleges set acceptance_rate = 0.430 where id = 'clemson-university';
update public.colleges set acceptance_rate = 0.560 where id = 'virginia-tech';
update public.colleges set acceptance_rate = 0.490 where id = 'stony-brook-university';
update public.colleges set acceptance_rate = 0.560 where id = 'university-of-connecticut';
update public.colleges set acceptance_rate = 0.580 where id = 'university-of-massachusetts-amherst';
update public.colleges set acceptance_rate = 0.410 where id = 'binghamton-university';
update public.colleges set acceptance_rate = 0.250 where id = 'florida-state-university';
update public.colleges set acceptance_rate = 0.380 where id = 'san-diego-state-university';
update public.colleges set acceptance_rate = 0.440 where id = 'university-of-south-florida';
update public.colleges set acceptance_rate = 0.540 where id = 'colorado-school-of-mines';

-- Large state schools
update public.colleges set acceptance_rate = 0.750 where id = 'university-of-minnesota-twin-cities';
update public.colleges set acceptance_rate = 0.880 where id = 'michigan-state-university';
update public.colleges set acceptance_rate = 0.800 where id = 'indiana-university-bloomington';
update public.colleges set acceptance_rate = 0.570 where id = 'university-of-pittsburgh';
update public.colleges set acceptance_rate = 0.800 where id = 'university-of-colorado-boulder';
update public.colleges set acceptance_rate = 0.820 where id = 'university-of-utah';
update public.colleges set acceptance_rate = 0.640 where id = 'university-of-south-carolina';
update public.colleges set acceptance_rate = 0.710 where id = 'auburn-university';
update public.colleges set acceptance_rate = 0.720 where id = 'university-of-tennessee-knoxville';
update public.colleges set acceptance_rate = 0.800 where id = 'university-of-alabama';
update public.colleges set acceptance_rate = 0.870 where id = 'university-of-arizona';
update public.colleges set acceptance_rate = 0.730 where id = 'university-at-buffalo';
update public.colleges set acceptance_rate = 0.780 where id = 'university-of-cincinnati';
update public.colleges set acceptance_rate = 0.770 where id = 'university-of-houston';
update public.colleges set acceptance_rate = 0.900 where id = 'arizona-state-university-tempe';
update public.colleges set acceptance_rate = 0.820 where id = 'oregon-state-university';
update public.colleges set acceptance_rate = 0.820 where id = 'university-of-oregon';
update public.colleges set acceptance_rate = 0.790 where id = 'university-of-missouri';
update public.colleges set acceptance_rate = 0.840 where id = 'university-of-iowa';
update public.colleges set acceptance_rate = 0.910 where id = 'iowa-state-university';
update public.colleges set acceptance_rate = 0.830 where id = 'university-of-oklahoma';
update public.colleges set acceptance_rate = 0.740 where id = 'oklahoma-state-university';
update public.colleges set acceptance_rate = 0.910 where id = 'university-of-kansas';
update public.colleges set acceptance_rate = 0.940 where id = 'kansas-state-university';
update public.colleges set acceptance_rate = 0.960 where id = 'university-of-kentucky';
update public.colleges set acceptance_rate = 0.800 where id = 'university-of-nebraska-lincoln';
update public.colleges set acceptance_rate = 0.960 where id = 'university-of-new-mexico';
update public.colleges set acceptance_rate = 0.830 where id = 'university-of-hawaii-manoa';
update public.colleges set acceptance_rate = 0.780 where id = 'wayne-state-university';
update public.colleges set acceptance_rate = 0.720 where id = 'university-of-vermont';

-- Mid-tier privates
update public.colleges set acceptance_rate = 0.550 where id = 'fordham-university';
update public.colleges set acceptance_rate = 0.520 where id = 'southern-methodist-university';
update public.colleges set acceptance_rate = 0.440 where id = 'syracuse-university';
update public.colleges set acceptance_rate = 0.550 where id = 'baylor-university';
update public.colleges set acceptance_rate = 0.820 where id = 'marquette-university';
update public.colleges set acceptance_rate = 0.730 where id = 'university-of-denver';
update public.colleges set acceptance_rate = 0.540 where id = 'university-of-san-diego';
update public.colleges set acceptance_rate = 0.410 where id = 'american-university';
update public.colleges set acceptance_rate = 0.650 where id = 'clark-university';
update public.colleges set acceptance_rate = 0.780 where id = 'drexel-university';
update public.colleges set acceptance_rate = 0.390 where id = 'howard-university';
update public.colleges set acceptance_rate = 0.680 where id = 'illinois-institute-of-technology';
update public.colleges set acceptance_rate = 0.470 where id = 'loyola-marymount-university';
update public.colleges set acceptance_rate = 0.720 where id = 'miami-university-oxford';
update public.colleges set acceptance_rate = 0.680 where id = 'new-jersey-institute-of-technology';
update public.colleges set acceptance_rate = 0.620 where id = 'rensselaer-polytechnic-institute';
update public.colleges set acceptance_rate = 0.500 where id = 'stevens-institute-of-technology';
update public.colleges set acceptance_rate = 0.670 where id = 'brigham-young-university-provo';
update public.colleges set acceptance_rate = 0.720 where id = 'gonzaga-university';
update public.colleges set acceptance_rate = 0.490 where id = 'santa-clara-university';
update public.colleges set acceptance_rate = 0.750 where id = 'university-of-pacific';
update public.colleges set acceptance_rate = 0.480 where id = 'texas-christian-university';
update public.colleges set acceptance_rate = 0.550 where id = 'penn-state-university-park';

-- =============================================================================
-- 4. Verify — shows all schools sorted by selectivity
-- =============================================================================
select id, name, acceptance_rate, ed_admit_rate, is_public, state
  from public.colleges
 where id != 'a0000000-0000-0000-0000-000000000000'
 order by acceptance_rate asc;
