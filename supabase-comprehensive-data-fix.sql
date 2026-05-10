-- =============================================================================
-- COMPREHENSIVE DATA FIX — Vantage colleges table
-- Fixes: is_public, ed_admit_rate, available_rounds, state, duplicates, names
-- Uses ACTUAL IDs from supabase-add-more-colleges.sql (the authoritative source)
-- Run in Supabase SQL Editor.
-- =============================================================================

-- =============================================================================
-- 1. REMOVE DUPLICATES
--    Keep the canonical ID, delete alternates.
-- =============================================================================

-- Caltech: keep 'caltech', remove any row with name match but different id
delete from public.colleges
 where lower(name) = lower('California Institute of Technology')
   and id != 'caltech';

-- WashU: keep 'washington-university-st-louis', remove alternates
delete from public.colleges
 where lower(name) like '%washington university%st%louis%'
   and id != 'washington-university-st-louis';

-- UNC: keep 'unc-chapel-hill', remove alternates
delete from public.colleges
 where (lower(name) like '%university of north carolina%chapel hill%'
        or lower(name) like '%unc%chapel%hill%')
   and id != 'unc-chapel-hill';

-- MIT: keep 'mit', remove alternates
delete from public.colleges
 where lower(name) like '%massachusetts institute of technology%'
   and id != 'mit';

-- Wisconsin: keep 'university-of-wisconsin-madison', remove alternates
delete from public.colleges
 where lower(name) like '%university of wisconsin%madison%'
   and id != 'university-of-wisconsin-madison';

-- Penn State: keep 'penn-state-university', remove alternates
delete from public.colleges
 where (lower(name) like '%pennsylvania state%' or lower(name) like '%penn state%')
   and id != 'penn-state-university';

-- Indiana: keep 'indiana-university-bloomington', remove alternates
delete from public.colleges
 where lower(name) like '%indiana university%bloomington%'
   and id != 'indiana-university-bloomington';

-- William & Mary: keep 'william-and-mary', remove alternates
delete from public.colleges
 where (lower(name) like '%william%mary%' or lower(name) like '%college of william%')
   and id != 'william-and-mary';

-- =============================================================================
-- 2. STANDARDIZE UC NAMES (consistent "University of California, X" format)
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
-- 3. SET is_public = true FOR ALL PUBLIC UNIVERSITIES
--    Using actual IDs from the database.
-- =============================================================================

update public.colleges set is_public = true where id in (
  -- UCs
  'uc-berkeley',
  'ucla',
  'uc-san-diego',
  'university-of-california-davis',
  'university-of-california-irvine',
  'university-of-california-santa-barbara',
  'university-of-california-santa-cruz',
  'university-of-california-riverside',
  -- Top public flagships
  'university-of-michigan-ann-arbor',
  'university-of-virginia',
  'unc-chapel-hill',
  'georgia-institute-of-technology',
  'university-of-texas-austin',
  'university-of-florida',
  'university-of-illinois-urbana-champaign',
  'university-of-wisconsin-madison',
  'university-of-washington',
  'university-of-maryland-college-park',
  'william-and-mary',
  'purdue-university',
  -- Mid-tier publics
  'ohio-state-university',
  'texas-am-university',
  'rutgers-university-new-brunswick',
  'nc-state-raleigh',
  'clemson-university',
  'virginia-tech',
  'stony-brook-university-suny',
  'university-of-connecticut',
  'university-of-massachusetts-amherst',
  'binghamton-university-suny',
  'florida-state-university',
  'san-diego-state-university',
  'university-of-south-florida',
  -- Large state schools
  'university-of-minnesota-twin-cities',
  'michigan-state-university',
  'indiana-university-bloomington',
  'university-of-pittsburgh',
  'university-of-colorado-boulder',
  'university-of-utah',
  'university-of-south-carolina',
  'auburn-university',
  'university-of-tennessee-knoxville',
  'university-of-alabama',
  'university-of-arizona',
  'university-at-buffalo-suny',
  'arizona-state-university-tempe',
  'oregon-state-university',
  'university-of-oregon',
  'university-of-missouri-columbia',
  'university-of-iowa',
  'iowa-state-university',
  'university-of-oklahoma-norman',
  'oklahoma-state-university',
  'university-of-kansas',
  'kansas-state-university',
  'university-of-kentucky',
  'university-of-nebraska-lincoln',
  'university-of-hawaii-manoa',
  'university-of-houston',
  -- Other publics
  'penn-state-university',
  'university-of-georgia',
  'university-of-delaware',
  'university-of-central-florida',
  'james-madison-university',
  'florida-international-university',
  'louisiana-state-university',
  'washington-state-university',
  'florida-atlantic-university',
  'university-of-wyoming',
  'university-of-arkansas',
  'temple-university',
  'towson-university',
  'new-jersey-institute-of-technology',
  'miami-university-oh',
  'university-of-illinois-chicago',
  'csu-long-beach',
  'csu-fullerton',
  'csu-fresno',
  'san-francisco-state-university',
  'sonoma-state-university',
  'cal-poly-slo',
  'university-of-vermont',
  'cuny-baruch-college',
  'cuny-city-college',
  'cuny-hunter-college',
  'cuny-brooklyn-college',
  'cuny-queens-college',
  'suny-geneseo',
  'university-of-nevada-reno',
  'virginia-military-institute',
  'colorado-college'
);

-- Explicitly set private schools
update public.colleges set is_public = false where id in (
  -- Ivies
  'harvard-university', 'princeton-university', 'yale-university',
  'columbia-university', 'university-of-pennsylvania', 'brown-university',
  'cornell-university', 'dartmouth-college',
  -- Elite privates
  'stanford-university', 'mit', 'caltech', 'university-of-chicago',
  'duke-university', 'johns-hopkins-university', 'northwestern-university',
  'vanderbilt-university', 'rice-university', 'washington-university-st-louis',
  'emory-university', 'university-of-notre-dame', 'carnegie-mellon-university',
  'georgetown-university',
  -- Selective privates
  'tufts-university', 'northeastern-university', 'new-york-university',
  'boston-college', 'boston-university', 'university-of-southern-california',
  'tulane-university', 'university-of-miami', 'pepperdine-university',
  'university-of-rochester', 'wake-forest-university', 'villanova-university',
  'brandeis-university',
  -- Mid-tier privates
  'fordham-university', 'southern-methodist-university', 'syracuse-university',
  'baylor-university', 'marquette-university', 'university-of-denver',
  'university-of-san-diego', 'american-university', 'clark-university',
  'drexel-university', 'howard-university', 'illinois-institute-of-technology',
  'loyola-marymount-university', 'rensselaer-polytechnic-institute',
  'stevens-institute-of-technology', 'gonzaga-university', 'santa-clara-university',
  'texas-christian-university', 'george-washington-university',
  -- LACs
  'williams-college', 'amherst-college', 'pomona-college', 'swarthmore-college',
  'bowdoin-college', 'claremont-mckenna-college', 'wellesley-college',
  'middlebury-college', 'colgate-university', 'hamilton-college',
  'haverford-college', 'davidson-college', 'washington-and-lee-university',
  'barnard-college', 'wesleyan-university', 'colby-college', 'bates-college',
  'grinnell-college', 'vassar-college', 'oberlin-college', 'kenyon-college',
  'lafayette-college', 'bucknell-university', 'lehigh-university',
  'connecticut-college', 'smith-college', 'bryn-mawr-college',
  'harvey-mudd-college', 'reed-college', 'colorado-college',
  'trinity-college-ct', 'trinity-university-tx', 'dickinson-college',
  'skidmore-college', 'furman-university', 'wofford-college',
  'rhodes-college', 'depauw-university',
  -- Others
  'cooper-union', 'babson-college', 'bentley-university',
  'university-of-san-francisco', 'worcester-polytechnic-institute',
  'creighton-university', 'saint-louis-university', 'elon-university',
  'university-of-portland', 'university-of-dayton', 'manhattan-college',
  'kalamazoo-college', 'chapman-university', 'olin-college-of-engineering',
  'brigham-young-university', 'saint-marys-college-of-california',
  'st-lawrence-university', 'college-of-the-holy-cross',
  'university-of-richmond', 'hobart-and-william-smith-colleges',
  'college-of-new-jersey'
);

-- Colorado College is actually private (liberal arts college)
update public.colleges set is_public = false where id = 'colorado-college';

-- =============================================================================
-- 4. SET state CODES FOR ALL SCHOOLS (using actual IDs)
-- =============================================================================

-- Northeast
update public.colleges set state = 'MA' where id in ('harvard-university','mit','tufts-university','northeastern-university','boston-college','boston-university','williams-college','amherst-college','wellesley-college','babson-college','bentley-university','brandeis-university','clark-university','worcester-polytechnic-institute','smith-college','bryn-mawr-college','college-of-the-holy-cross','university-of-massachusetts-amherst','olin-college-of-engineering');
update public.colleges set state = 'CT' where id in ('yale-university','university-of-connecticut','wesleyan-university','connecticut-college','trinity-college-ct');
update public.colleges set state = 'NJ' where id in ('princeton-university','rutgers-university-new-brunswick','stevens-institute-of-technology','new-jersey-institute-of-technology','college-of-new-jersey');
update public.colleges set state = 'NY' where id in ('columbia-university','cornell-university','new-york-university','fordham-university','syracuse-university','university-of-rochester','rensselaer-polytechnic-institute','stony-brook-university-suny','binghamton-university-suny','university-at-buffalo-suny','colgate-university','hamilton-college','barnard-college','vassar-college','skidmore-college','suny-geneseo','cooper-union','manhattan-college','cuny-baruch-college','cuny-city-college','cuny-hunter-college','cuny-brooklyn-college','cuny-queens-college','hobart-and-william-smith-colleges','st-lawrence-university');
update public.colleges set state = 'PA' where id in ('university-of-pennsylvania','carnegie-mellon-university','university-of-pittsburgh','penn-state-university','drexel-university','swarthmore-college','haverford-college','lafayette-college','bucknell-university','lehigh-university','dickinson-college','temple-university');
update public.colleges set state = 'RI' where id = 'brown-university';
update public.colleges set state = 'NH' where id = 'dartmouth-college';
update public.colleges set state = 'VT' where id in ('university-of-vermont','middlebury-college');
update public.colleges set state = 'ME' where id in ('bowdoin-college','bates-college','colby-college');
update public.colleges set state = 'DE' where id = 'university-of-delaware';
update public.colleges set state = 'MD' where id in ('johns-hopkins-university','university-of-maryland-college-park','towson-university');
update public.colleges set state = 'DC' where id in ('georgetown-university','george-washington-university','american-university','howard-university');

-- Southeast
update public.colleges set state = 'VA' where id in ('university-of-virginia','virginia-tech','william-and-mary','washington-and-lee-university','james-madison-university','university-of-richmond','virginia-military-institute');
update public.colleges set state = 'NC' where id in ('duke-university','unc-chapel-hill','nc-state-raleigh','wake-forest-university','davidson-college','elon-university');
update public.colleges set state = 'SC' where id in ('clemson-university','university-of-south-carolina','furman-university','wofford-college');
update public.colleges set state = 'GA' where id in ('georgia-institute-of-technology','emory-university','university-of-georgia');
update public.colleges set state = 'FL' where id in ('university-of-florida','florida-state-university','university-of-miami','university-of-south-florida','university-of-central-florida','florida-international-university','florida-atlantic-university');
update public.colleges set state = 'AL' where id in ('university-of-alabama','auburn-university');
update public.colleges set state = 'TN' where id in ('vanderbilt-university','university-of-tennessee-knoxville','rhodes-college');
update public.colleges set state = 'KY' where id = 'university-of-kentucky';
update public.colleges set state = 'LA' where id in ('tulane-university','louisiana-state-university');
update public.colleges set state = 'AR' where id = 'university-of-arkansas';

-- Midwest
update public.colleges set state = 'IL' where id in ('university-of-chicago','northwestern-university','university-of-illinois-urbana-champaign','university-of-illinois-chicago','illinois-institute-of-technology');
update public.colleges set state = 'MI' where id in ('university-of-michigan-ann-arbor','michigan-state-university','kalamazoo-college');
update public.colleges set state = 'OH' where id in ('ohio-state-university','miami-university-oh','oberlin-college','kenyon-college','university-of-dayton');
update public.colleges set state = 'IN' where id in ('university-of-notre-dame','purdue-university','indiana-university-bloomington','depauw-university');
update public.colleges set state = 'WI' where id in ('university-of-wisconsin-madison','marquette-university');
update public.colleges set state = 'MN' where id = 'university-of-minnesota-twin-cities';
update public.colleges set state = 'MO' where id in ('washington-university-st-louis','university-of-missouri-columbia','saint-louis-university');
update public.colleges set state = 'IA' where id in ('university-of-iowa','iowa-state-university','grinnell-college');
update public.colleges set state = 'KS' where id in ('university-of-kansas','kansas-state-university');
update public.colleges set state = 'NE' where id in ('university-of-nebraska-lincoln','creighton-university');
update public.colleges set state = 'ND' where id = 'university-of-north-dakota' ;
update public.colleges set state = 'OK' where id in ('university-of-oklahoma-norman','oklahoma-state-university');

-- West
update public.colleges set state = 'CA' where id in ('stanford-university','caltech','uc-berkeley','ucla','uc-san-diego','university-of-california-davis','university-of-california-irvine','university-of-california-santa-barbara','university-of-california-santa-cruz','university-of-california-riverside','university-of-southern-california','pepperdine-university','loyola-marymount-university','santa-clara-university','university-of-san-diego','university-of-san-francisco','claremont-mckenna-college','pomona-college','harvey-mudd-college','saint-marys-college-of-california','chapman-university','san-diego-state-university','cal-poly-slo','csu-long-beach','csu-fullerton','csu-fresno','san-francisco-state-university','sonoma-state-university');
update public.colleges set state = 'WA' where id in ('university-of-washington','washington-state-university','gonzaga-university');
update public.colleges set state = 'OR' where id in ('university-of-oregon','oregon-state-university','reed-college','university-of-portland');
update public.colleges set state = 'CO' where id in ('university-of-colorado-boulder','colorado-college');
update public.colleges set state = 'AZ' where id in ('university-of-arizona','arizona-state-university-tempe');
update public.colleges set state = 'UT' where id in ('university-of-utah','brigham-young-university');
update public.colleges set state = 'NV' where id = 'university-of-nevada-reno';
update public.colleges set state = 'HI' where id = 'university-of-hawaii-manoa';
update public.colleges set state = 'WY' where id = 'university-of-wyoming';
update public.colleges set state = 'NM' where id = 'university-of-new-mexico';

-- Texas
update public.colleges set state = 'TX' where id in ('rice-university','university-of-texas-austin','texas-am-university','southern-methodist-university','baylor-university','texas-christian-university','university-of-houston','university-of-texas-dallas','trinity-university-tx');

-- =============================================================================
-- 5. SET available_rounds AND ed_admit_rate/ea_admit_rate
--    UC schools: RD only (no ED/EA)
--    Schools with ED: set ed_admit_rate
--    Schools with EA only: set ea_admit_rate
-- =============================================================================

-- UC system: RD only, no ED/EA
update public.colleges
   set available_rounds = array['RD'],
       ed_admit_rate = null,
       ea_admit_rate = null
 where id in ('uc-berkeley','ucla','uc-san-diego','university-of-california-davis','university-of-california-irvine','university-of-california-santa-barbara','university-of-california-santa-cruz','university-of-california-riverside');

-- CSU system: RD only
update public.colleges
   set available_rounds = array['RD'],
       ed_admit_rate = null,
       ea_admit_rate = null
 where id in ('cal-poly-slo','csu-long-beach','csu-fullerton','csu-fresno','san-francisco-state-university','sonoma-state-university','san-diego-state-university');

-- Ivies: RD + ED (except Harvard/Princeton/Yale which are REA)
update public.colleges set available_rounds = array['RD','REA'], ed_admit_rate = null, ea_admit_rate = 0.075 where id = 'harvard-university';
update public.colleges set available_rounds = array['RD','REA'], ed_admit_rate = null, ea_admit_rate = 0.10 where id = 'princeton-university';
update public.colleges set available_rounds = array['RD','REA'], ed_admit_rate = null, ea_admit_rate = 0.09 where id = 'yale-university';
update public.colleges set available_rounds = array['RD','ED'], ed_admit_rate = 0.10 where id = 'columbia-university';
update public.colleges set available_rounds = array['RD','ED'], ed_admit_rate = 0.15 where id = 'university-of-pennsylvania';
update public.colleges set available_rounds = array['RD','ED'], ed_admit_rate = 0.13 where id = 'brown-university';
update public.colleges set available_rounds = array['RD','ED'], ed_admit_rate = 0.18 where id = 'cornell-university';
update public.colleges set available_rounds = array['RD','ED'], ed_admit_rate = 0.17 where id = 'dartmouth-college';

-- REA schools
update public.colleges set available_rounds = array['RD','REA'], ed_admit_rate = null, ea_admit_rate = 0.08 where id = 'stanford-university';
update public.colleges set available_rounds = array['RD','REA'], ed_admit_rate = null, ea_admit_rate = 0.06 where id = 'caltech';
update public.colleges set available_rounds = array['RD','REA'], ed_admit_rate = null, ea_admit_rate = 0.09 where id = 'university-of-notre-dame';
update public.colleges set available_rounds = array['RD','EA'], ed_admit_rate = null, ea_admit_rate = 0.07 where id = 'mit';
update public.colleges set available_rounds = array['RD','EA'], ed_admit_rate = null, ea_admit_rate = 0.07 where id = 'georgetown-university';

-- Elite privates with ED
update public.colleges set available_rounds = array['RD','ED'], ed_admit_rate = 0.14 where id = 'university-of-chicago';
update public.colleges set available_rounds = array['RD','ED'], ed_admit_rate = 0.18 where id = 'duke-university';
update public.colleges set available_rounds = array['RD','ED'], ed_admit_rate = 0.18 where id = 'johns-hopkins-university';
update public.colleges set available_rounds = array['RD','ED'], ed_admit_rate = 0.20 where id = 'northwestern-university';
update public.colleges set available_rounds = array['RD','ED','ED2'], ed_admit_rate = 0.17 where id = 'vanderbilt-university';
update public.colleges set available_rounds = array['RD','ED'], ed_admit_rate = 0.18 where id = 'rice-university';
update public.colleges set available_rounds = array['RD','ED'], ed_admit_rate = 0.30 where id = 'washington-university-st-louis';
update public.colleges set available_rounds = array['RD','ED','ED2'], ed_admit_rate = 0.24 where id = 'emory-university';
update public.colleges set available_rounds = array['RD','ED','ED2'], ed_admit_rate = 0.28 where id = 'carnegie-mellon-university';

-- Selective privates
update public.colleges set available_rounds = array['RD','ED','ED2'], ed_admit_rate = 0.28 where id = 'tufts-university';
update public.colleges set available_rounds = array['RD','ED','ED2'], ed_admit_rate = 0.20 where id = 'northeastern-university';
update public.colleges set available_rounds = array['RD','ED','ED2'], ed_admit_rate = 0.25 where id = 'new-york-university';
update public.colleges set available_rounds = array['RD','ED','ED2'], ed_admit_rate = 0.38 where id = 'boston-college';
update public.colleges set available_rounds = array['RD','ED','ED2'], ed_admit_rate = 0.28 where id = 'boston-university';
update public.colleges set available_rounds = array['RD','EA'], ed_admit_rate = null, ea_admit_rate = 0.14 where id = 'university-of-southern-california';
update public.colleges set available_rounds = array['RD','ED','ED2','EA'], ed_admit_rate = 0.30, ea_admit_rate = 0.24 where id = 'tulane-university';
update public.colleges set available_rounds = array['RD','ED','ED2','EA'], ed_admit_rate = 0.35, ea_admit_rate = 0.25 where id = 'university-of-miami';
update public.colleges set available_rounds = array['RD','EA'], ed_admit_rate = null, ea_admit_rate = 0.55 where id = 'pepperdine-university';
update public.colleges set available_rounds = array['RD','ED','ED2'], ed_admit_rate = 0.50 where id = 'university-of-rochester';

-- Top public flagships (no ED, but many have EA)
update public.colleges set available_rounds = array['RD','EA'], ea_admit_rate = 0.25 where id = 'university-of-michigan-ann-arbor';
update public.colleges set available_rounds = array['RD','ED','EA'], ed_admit_rate = 0.30, ea_admit_rate = 0.22 where id = 'university-of-virginia';
update public.colleges set available_rounds = array['RD','EA'], ea_admit_rate = 0.22 where id = 'unc-chapel-hill';
update public.colleges set available_rounds = array['RD','EA'], ea_admit_rate = 0.18 where id = 'georgia-institute-of-technology';
update public.colleges set available_rounds = array['RD'], ed_admit_rate = null, ea_admit_rate = null where id = 'university-of-texas-austin';
update public.colleges set available_rounds = array['RD','EA'], ea_admit_rate = 0.28 where id = 'university-of-florida';
update public.colleges set available_rounds = array['RD','EA'], ea_admit_rate = 0.50 where id = 'university-of-illinois-urbana-champaign';
update public.colleges set available_rounds = array['RD','EA'], ea_admit_rate = 0.55 where id = 'university-of-wisconsin-madison';
update public.colleges set available_rounds = array['RD'], ed_admit_rate = null, ea_admit_rate = null where id = 'university-of-washington';
update public.colleges set available_rounds = array['RD','EA'], ea_admit_rate = 0.44 where id = 'university-of-maryland-college-park';
update public.colleges set available_rounds = array['RD','ED','ED2'], ed_admit_rate = 0.55 where id = 'william-and-mary';
update public.colleges set available_rounds = array['RD','EA'], ea_admit_rate = 0.55 where id = 'purdue-university';

-- Mid-tier publics
update public.colleges set available_rounds = array['RD','EA'], ea_admit_rate = 0.53 where id = 'ohio-state-university';
update public.colleges set available_rounds = array['RD'], ed_admit_rate = null, ea_admit_rate = null where id = 'texas-am-university';
update public.colleges set available_rounds = array['RD','EA'], ea_admit_rate = 0.66 where id = 'rutgers-university-new-brunswick';
update public.colleges set available_rounds = array['RD','EA'], ea_admit_rate = 0.47 where id = 'nc-state-raleigh';
update public.colleges set available_rounds = array['RD','EA'], ea_admit_rate = 0.48 where id = 'clemson-university';
update public.colleges set available_rounds = array['RD','EA'], ea_admit_rate = 0.57 where id = 'virginia-tech';
update public.colleges set available_rounds = array['RD'], ed_admit_rate = null, ea_admit_rate = null where id = 'stony-brook-university-suny';
update public.colleges set available_rounds = array['RD','EA'], ea_admit_rate = 0.56 where id = 'university-of-connecticut';
update public.colleges set available_rounds = array['RD','EA'], ea_admit_rate = 0.58 where id = 'university-of-massachusetts-amherst';
update public.colleges set available_rounds = array['RD','EA'], ea_admit_rate = 0.48 where id = 'binghamton-university-suny';
update public.colleges set available_rounds = array['RD','EA'], ea_admit_rate = 0.30 where id = 'florida-state-university';
update public.colleges set available_rounds = array['RD'], ed_admit_rate = null, ea_admit_rate = null where id = 'san-diego-state-university';
update public.colleges set available_rounds = array['RD'], ed_admit_rate = null, ea_admit_rate = null where id = 'university-of-south-florida';

-- Large state schools
update public.colleges set available_rounds = array['RD','EA'], ea_admit_rate = 0.75 where id = 'university-of-minnesota-twin-cities';
update public.colleges set available_rounds = array['RD','EA'], ea_admit_rate = 0.88 where id = 'michigan-state-university';
update public.colleges set available_rounds = array['RD','EA'], ea_admit_rate = 0.80 where id = 'indiana-university-bloomington';
update public.colleges set available_rounds = array['RD','EA'], ea_admit_rate = 0.62 where id = 'university-of-pittsburgh';
update public.colleges set available_rounds = array['RD','EA'], ea_admit_rate = 0.80 where id = 'university-of-colorado-boulder';
update public.colleges set available_rounds = array['RD','EA'], ea_admit_rate = 0.82 where id = 'university-of-utah';
update public.colleges set available_rounds = array['RD','EA'], ea_admit_rate = 0.68 where id = 'university-of-south-carolina';
update public.colleges set available_rounds = array['RD','EA'], ea_admit_rate = 0.73 where id = 'auburn-university';
update public.colleges set available_rounds = array['RD','EA'], ea_admit_rate = 0.72 where id = 'university-of-tennessee-knoxville';
update public.colleges set available_rounds = array['RD'], ed_admit_rate = null, ea_admit_rate = null where id = 'university-of-alabama';
update public.colleges set available_rounds = array['RD','EA'], ea_admit_rate = 0.87 where id = 'university-of-arizona';
update public.colleges set available_rounds = array['RD'], ed_admit_rate = null, ea_admit_rate = null where id = 'university-at-buffalo-suny';
update public.colleges set available_rounds = array['RD'], ed_admit_rate = null, ea_admit_rate = null where id = 'arizona-state-university-tempe';
update public.colleges set available_rounds = array['RD','EA'], ea_admit_rate = 0.85 where id = 'oregon-state-university';
update public.colleges set available_rounds = array['RD','EA'], ea_admit_rate = 0.85 where id = 'university-of-oregon';
update public.colleges set available_rounds = array['RD'], ed_admit_rate = null, ea_admit_rate = null where id = 'university-of-missouri-columbia';
update public.colleges set available_rounds = array['RD'], ed_admit_rate = null, ea_admit_rate = null where id = 'university-of-iowa';
update public.colleges set available_rounds = array['RD'], ed_admit_rate = null, ea_admit_rate = null where id = 'iowa-state-university';
update public.colleges set available_rounds = array['RD','EA'], ea_admit_rate = 0.83 where id = 'university-of-oklahoma-norman';
update public.colleges set available_rounds = array['RD'], ed_admit_rate = null, ea_admit_rate = null where id = 'oklahoma-state-university';
update public.colleges set available_rounds = array['RD'], ed_admit_rate = null, ea_admit_rate = null where id = 'university-of-kansas';
update public.colleges set available_rounds = array['RD'], ed_admit_rate = null, ea_admit_rate = null where id = 'kansas-state-university';
update public.colleges set available_rounds = array['RD','EA'], ea_admit_rate = 0.96 where id = 'university-of-kentucky';
update public.colleges set available_rounds = array['RD'], ed_admit_rate = null, ea_admit_rate = null where id = 'university-of-nebraska-lincoln';
update public.colleges set available_rounds = array['RD'], ed_admit_rate = null, ea_admit_rate = null where id = 'university-of-hawaii-manoa';
update public.colleges set available_rounds = array['RD'], ed_admit_rate = null, ea_admit_rate = null where id = 'university-of-houston';
update public.colleges set available_rounds = array['RD','EA'], ea_admit_rate = 0.55 where id = 'penn-state-university';

-- Mid-tier privates with ED
update public.colleges set available_rounds = array['RD','ED','ED2','EA'], ed_admit_rate = 0.72, ea_admit_rate = 0.60 where id = 'fordham-university';
update public.colleges set available_rounds = array['RD','ED','ED2','EA'], ed_admit_rate = 0.72, ea_admit_rate = 0.58 where id = 'southern-methodist-university';
update public.colleges set available_rounds = array['RD','ED','ED2'], ed_admit_rate = 0.68 where id = 'syracuse-university';
update public.colleges set available_rounds = array['RD','ED','EA'], ed_admit_rate = 0.75, ea_admit_rate = 0.62 where id = 'baylor-university';
update public.colleges set available_rounds = array['RD','EA'], ed_admit_rate = null, ea_admit_rate = 0.85 where id = 'marquette-university';
update public.colleges set available_rounds = array['RD','ED','EA'], ed_admit_rate = 0.80, ea_admit_rate = 0.78 where id = 'university-of-denver';
update public.colleges set available_rounds = array['RD','EA'], ed_admit_rate = null, ea_admit_rate = 0.58 where id = 'university-of-san-diego';
update public.colleges set available_rounds = array['RD','ED','ED2','EA'], ed_admit_rate = 0.72, ea_admit_rate = 0.50 where id = 'american-university';
update public.colleges set available_rounds = array['RD','ED','ED2','EA'], ed_admit_rate = 0.78, ea_admit_rate = 0.70 where id = 'clark-university';
update public.colleges set available_rounds = array['RD','ED','EA'], ed_admit_rate = 0.88, ea_admit_rate = 0.80 where id = 'drexel-university';
update public.colleges set available_rounds = array['RD','ED','EA'], ed_admit_rate = 0.55, ea_admit_rate = 0.45 where id = 'howard-university';
update public.colleges set available_rounds = array['RD','ED','EA'], ed_admit_rate = 0.80, ea_admit_rate = 0.72 where id = 'illinois-institute-of-technology';
update public.colleges set available_rounds = array['RD','ED','ED2','EA'], ed_admit_rate = 0.70, ea_admit_rate = 0.55 where id = 'loyola-marymount-university';
update public.colleges set available_rounds = array['RD','ED','EA'], ed_admit_rate = 0.82, ea_admit_rate = 0.75 where id = 'miami-university-oh';
update public.colleges set available_rounds = array['RD'], ed_admit_rate = null, ea_admit_rate = null where id = 'new-jersey-institute-of-technology';
update public.colleges set available_rounds = array['RD','ED','ED2'], ed_admit_rate = 0.71 where id = 'rensselaer-polytechnic-institute';
update public.colleges set available_rounds = array['RD','ED','ED2','EA'], ed_admit_rate = 0.68, ea_admit_rate = 0.55 where id = 'stevens-institute-of-technology';
update public.colleges set available_rounds = array['RD'], ed_admit_rate = null, ea_admit_rate = null where id = 'brigham-young-university';
update public.colleges set available_rounds = array['RD','EA'], ed_admit_rate = null, ea_admit_rate = 0.75 where id = 'gonzaga-university';
update public.colleges set available_rounds = array['RD','ED','ED2','EA'], ed_admit_rate = 0.72, ea_admit_rate = 0.55 where id = 'santa-clara-university';
update public.colleges set available_rounds = array['RD','EA'], ed_admit_rate = null, ea_admit_rate = 0.54 where id = 'texas-christian-university';

-- LACs with ED
update public.colleges set available_rounds = array['RD','ED'], ed_admit_rate = 0.35 where id = 'williams-college';
update public.colleges set available_rounds = array['RD','ED'], ed_admit_rate = 0.30 where id = 'amherst-college';
update public.colleges set available_rounds = array['RD','ED'], ed_admit_rate = 0.18 where id = 'pomona-college';
update public.colleges set available_rounds = array['RD','ED','ED2'], ed_admit_rate = 0.20 where id = 'swarthmore-college';
update public.colleges set available_rounds = array['RD','ED'], ed_admit_rate = 0.30 where id = 'bowdoin-college';
update public.colleges set available_rounds = array['RD','ED','ED2'], ed_admit_rate = 0.30 where id = 'claremont-mckenna-college';
update public.colleges set available_rounds = array['RD','ED','ED2'], ed_admit_rate = 0.35 where id = 'wellesley-college';
update public.colleges set available_rounds = array['RD','ED','ED2'], ed_admit_rate = 0.40 where id = 'middlebury-college';
update public.colleges set available_rounds = array['RD','ED','ED2'], ed_admit_rate = 0.45 where id = 'colgate-university';
update public.colleges set available_rounds = array['RD','ED'], ed_admit_rate = 0.40 where id = 'hamilton-college';
update public.colleges set available_rounds = array['RD','ED'], ed_admit_rate = 0.30 where id = 'haverford-college';
update public.colleges set available_rounds = array['RD','ED'], ed_admit_rate = 0.40 where id = 'davidson-college';
update public.colleges set available_rounds = array['RD','ED','ED2'], ed_admit_rate = 0.55 where id = 'washington-and-lee-university';
update public.colleges set available_rounds = array['RD','ED'], ed_admit_rate = 0.30 where id = 'barnard-college';
update public.colleges set available_rounds = array['RD','ED','ED2'], ed_admit_rate = 0.40 where id = 'wesleyan-university';
update public.colleges set available_rounds = array['RD','ED','ED2'], ed_admit_rate = 0.40 where id = 'colby-college';
update public.colleges set available_rounds = array['RD','ED','ED2'], ed_admit_rate = 0.45 where id = 'bates-college';
update public.colleges set available_rounds = array['RD','ED','ED2'], ed_admit_rate = 0.45 where id = 'grinnell-college';
update public.colleges set available_rounds = array['RD','ED'], ed_admit_rate = 0.50 where id = 'vassar-college';
update public.colleges set available_rounds = array['RD','ED','ED2'], ed_admit_rate = 0.50 where id = 'oberlin-college';
update public.colleges set available_rounds = array['RD','ED','ED2'], ed_admit_rate = 0.55 where id = 'kenyon-college';
update public.colleges set available_rounds = array['RD','ED','ED2'], ed_admit_rate = 0.55 where id = 'lafayette-college';
update public.colleges set available_rounds = array['RD','ED'], ed_admit_rate = 0.55 where id = 'bucknell-university';
update public.colleges set available_rounds = array['RD','ED','ED2'], ed_admit_rate = 0.55 where id = 'lehigh-university';
update public.colleges set available_rounds = array['RD','ED','ED2'], ed_admit_rate = 0.55 where id = 'connecticut-college';
update public.colleges set available_rounds = array['RD','ED'], ed_admit_rate = 0.45 where id = 'smith-college';
update public.colleges set available_rounds = array['RD','ED'], ed_admit_rate = 0.50 where id = 'bryn-mawr-college';
update public.colleges set available_rounds = array['RD','ED','ED2'], ed_admit_rate = 0.25 where id = 'harvey-mudd-college';
update public.colleges set available_rounds = array['RD','ED'], ed_admit_rate = 0.40 where id = 'reed-college';
update public.colleges set available_rounds = array['RD','ED','ED2'], ed_admit_rate = 0.60 where id = 'trinity-college-ct';
update public.colleges set available_rounds = array['RD','ED','ED2'], ed_admit_rate = 0.55 where id = 'dickinson-college';
update public.colleges set available_rounds = array['RD','ED','ED2'], ed_admit_rate = 0.60 where id = 'skidmore-college';
update public.colleges set available_rounds = array['RD','ED','ED2'], ed_admit_rate = 0.55 where id = 'furman-university';

-- Other privates
update public.colleges set available_rounds = array['RD','ED'], ed_admit_rate = 0.20 where id = 'cooper-union';
update public.colleges set available_rounds = array['RD','ED','ED2'], ed_admit_rate = 0.55 where id = 'babson-college';
update public.colleges set available_rounds = array['RD','ED','ED2'], ed_admit_rate = 0.60 where id = 'george-washington-university';
update public.colleges set available_rounds = array['RD','ED','ED2'], ed_admit_rate = 0.60 where id = 'villanova-university';
update public.colleges set available_rounds = array['RD','ED'], ed_admit_rate = 0.38 where id = 'wake-forest-university';
update public.colleges set available_rounds = array['RD','ED','ED2'], ed_admit_rate = 0.50 where id = 'brandeis-university';
update public.colleges set available_rounds = array['RD','ED','ED2'], ed_admit_rate = 0.60 where id = 'worcester-polytechnic-institute';

-- =============================================================================
-- 6. FIX ACCEPTANCE RATES for schools that are still wrong or null
--    Uses actual IDs.
-- =============================================================================

-- Fix ID mismatches from previous fix script
update public.colleges set acceptance_rate = 0.470 where id = 'nc-state-raleigh';
update public.colleges set acceptance_rate = 0.490 where id = 'stony-brook-university-suny';
update public.colleges set acceptance_rate = 0.410 where id = 'binghamton-university-suny';
update public.colleges set acceptance_rate = 0.730 where id = 'university-at-buffalo-suny';
update public.colleges set acceptance_rate = 0.790 where id = 'university-of-missouri-columbia';
update public.colleges set acceptance_rate = 0.830 where id = 'university-of-oklahoma-norman';
update public.colleges set acceptance_rate = 0.720 where id = 'miami-university-oh';

-- Fill nulls
update public.colleges set acceptance_rate = 0.660 where id = 'san-francisco-state-university' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.550 where id = 'bentley-university' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.350 where id = 'cuny-hunter-college' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.450 where id = 'cuny-queens-college' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.460 where id = 'kalamazoo-college' and acceptance_rate is null;

-- More missing rates
update public.colleges set acceptance_rate = 0.090 where id = 'tufts-university' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.063 where id = 'northeastern-university' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.560 where id = 'virginia-tech' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.430 where id = 'university-of-washington' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.750 where id = 'university-of-minnesota-twin-cities' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.880 where id = 'michigan-state-university' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.800 where id = 'indiana-university-bloomington' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.570 where id = 'university-of-pittsburgh' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.800 where id = 'university-of-colorado-boulder' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.820 where id = 'university-of-utah' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.640 where id = 'university-of-south-carolina' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.710 where id = 'auburn-university' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.720 where id = 'university-of-tennessee-knoxville' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.800 where id = 'university-of-alabama' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.870 where id = 'university-of-arizona' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.900 where id = 'arizona-state-university-tempe' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.820 where id = 'oregon-state-university' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.820 where id = 'university-of-oregon' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.840 where id = 'university-of-iowa' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.910 where id = 'iowa-state-university' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.830 where id = 'university-of-oklahoma-norman' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.740 where id = 'oklahoma-state-university' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.910 where id = 'university-of-kansas' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.940 where id = 'kansas-state-university' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.960 where id = 'university-of-kentucky' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.800 where id = 'university-of-nebraska-lincoln' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.830 where id = 'university-of-hawaii-manoa' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.770 where id = 'university-of-houston' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.720 where id = 'university-of-vermont' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.250 where id = 'florida-state-university' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.380 where id = 'san-diego-state-university' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.440 where id = 'university-of-south-florida' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.550 where id = 'penn-state-university' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.430 where id = 'clemson-university' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.560 where id = 'university-of-connecticut' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.580 where id = 'university-of-massachusetts-amherst' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.670 where id = 'brigham-young-university' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.720 where id = 'gonzaga-university' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.490 where id = 'santa-clara-university' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.480 where id = 'texas-christian-university' and acceptance_rate is null;

-- LAC acceptance rates
update public.colleges set acceptance_rate = 0.09 where id = 'williams-college' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.07 where id = 'amherst-college' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.07 where id = 'pomona-college' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.07 where id = 'swarthmore-college' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.09 where id = 'bowdoin-college' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.09 where id = 'claremont-mckenna-college' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.12 where id = 'wellesley-college' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.13 where id = 'middlebury-college' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.12 where id = 'colgate-university' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.10 where id = 'hamilton-college' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.12 where id = 'haverford-college' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.15 where id = 'davidson-college' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.17 where id = 'washington-and-lee-university' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.07 where id = 'barnard-college' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.14 where id = 'wesleyan-university' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.09 where id = 'colby-college' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.12 where id = 'bates-college' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.08 where id = 'grinnell-college' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.15 where id = 'vassar-college' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.30 where id = 'oberlin-college' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.30 where id = 'kenyon-college' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.30 where id = 'lafayette-college' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.28 where id = 'bucknell-university' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.32 where id = 'lehigh-university' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.35 where id = 'connecticut-college' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.19 where id = 'smith-college' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.28 where id = 'bryn-mawr-college' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.10 where id = 'harvey-mudd-college' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.28 where id = 'reed-college' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.30 where id = 'colorado-college' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.32 where id = 'trinity-college-ct' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.35 where id = 'dickinson-college' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.30 where id = 'skidmore-college' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.50 where id = 'furman-university' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.50 where id = 'wofford-college' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.40 where id = 'rhodes-college' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.55 where id = 'depauw-university' and acceptance_rate is null;

-- Other missing rates
update public.colleges set acceptance_rate = 0.43 where id = 'wake-forest-university' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.23 where id = 'villanova-university' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.30 where id = 'brandeis-university' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.50 where id = 'george-washington-university' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.23 where id = 'university-of-georgia' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.70 where id = 'louisiana-state-university' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.68 where id = 'washington-state-university' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.60 where id = 'university-of-central-florida' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.45 where id = 'james-madison-university' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.56 where id = 'florida-international-university' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.38 where id = 'florida-atlantic-university' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.96 where id = 'university-of-wyoming' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.90 where id = 'university-of-arkansas' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.82 where id = 'university-of-delaware' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.50 where id = 'suny-geneseo' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.86 where id = 'university-of-nevada-reno' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.60 where id = 'temple-university' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.75 where id = 'towson-university' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.55 where id = 'cal-poly-slo' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.68 where id = 'csu-long-beach' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.67 where id = 'csu-fullerton' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.95 where id = 'csu-fresno' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.90 where id = 'sonoma-state-university' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.85 where id = 'university-of-new-mexico' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.20 where id = 'cooper-union' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.22 where id = 'babson-college' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.55 where id = 'university-of-san-francisco' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.45 where id = 'worcester-polytechnic-institute' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.60 where id = 'university-of-dayton' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.68 where id = 'creighton-university' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.47 where id = 'saint-louis-university' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.68 where id = 'elon-university' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.80 where id = 'university-of-portland' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.70 where id = 'manhattan-college' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.80 where id = 'saint-marys-college-of-california' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.65 where id = 'st-lawrence-university' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.70 where id = 'trinity-university-tx' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.75 where id = 'college-of-new-jersey' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.75 where id = 'virginia-military-institute' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.65 where id = 'hobart-and-william-smith-colleges' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.37 where id = 'cuny-baruch-college' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.35 where id = 'cuny-city-college' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.40 where id = 'cuny-brooklyn-college' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.26 where id = 'university-of-texas-dallas' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.55 where id = 'university-of-illinois-chicago' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.54 where id = 'chapman-university' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.25 where id = 'olin-college-of-engineering' and acceptance_rate is null;
update public.colleges set acceptance_rate = 0.78 where id = 'university-of-cincinnati' and acceptance_rate is null;

-- =============================================================================
-- 7. PROGRAM OVERRIDES (re-apply using actual names from DB)
-- =============================================================================

-- Georgia Tech CS
update public.colleges
   set program_admit_rate = 0.08,
       program_override_majors = array['Computer Science']
 where id = 'georgia-institute-of-technology';

-- UC Berkeley EECS
update public.colleges
   set program_admit_rate = 0.04,
       program_override_majors = array['Computer Science', 'Engineering']
 where id = 'uc-berkeley';

-- UW Seattle CS
update public.colleges
   set program_admit_rate = 0.05,
       program_override_majors = array['Computer Science']
 where id = 'university-of-washington';

-- UIUC CS
update public.colleges
   set program_admit_rate = 0.06,
       program_override_majors = array['Computer Science']
 where id = 'university-of-illinois-urbana-champaign';

-- Purdue CS/Engineering
update public.colleges
   set program_admit_rate = 0.20,
       program_override_majors = array['Computer Science', 'Engineering']
 where id = 'purdue-university';

-- =============================================================================
-- 8. VERIFY — shows all schools sorted by selectivity
-- =============================================================================
select id, name, acceptance_rate, ed_admit_rate, ea_admit_rate, is_public, state,
       available_rounds, program_admit_rate
  from public.colleges
 order by acceptance_rate asc nulls last;
