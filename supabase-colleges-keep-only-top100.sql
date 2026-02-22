-- Run in Supabase SQL Editor to remove the old 20-college list (and any other colleges)
-- not in the top 100 seed. Keeps only: the 100 from supabase-colleges-seed-top100.sql + common-app.
-- Run this BEFORE re-running the top 100 seed if you want a clean slate.

-- Allowed college ids (top 100 + common-app)
-- 1. Delete essay_versions for essays that belong to colleges we're removing
delete from public.essay_versions
where essay_id in (
  select id from public.essays
  where college_id not in (
    'princeton-university', 'mit', 'harvard-university', 'stanford-university', 'yale-university',
    'caltech', 'duke-university', 'johns-hopkins-university', 'northwestern-university', 'university-of-pennsylvania',
    'cornell-university', 'university-of-chicago', 'brown-university', 'columbia-university', 'dartmouth-college',
    'ucla', 'uc-berkeley', 'rice-university', 'university-of-notre-dame', 'vanderbilt-university',
    'carnegie-mellon-university', 'university-of-michigan-ann-arbor', 'washington-university-st-louis', 'emory-university',
    'georgetown-university', 'university-of-virginia', 'unc-chapel-hill', 'university-of-southern-california', 'uc-san-diego',
    'new-york-university', 'university-of-florida', 'university-of-texas-austin', 'boston-college', 'college-of-william-mary',
    'university-of-california-davis', 'university-of-california-irvine', 'university-of-rochester', 'boston-university',
    'georgia-institute-of-technology', 'university-of-illinois-urbana-champaign', 'university-of-wisconsin-madison', 'university-of-miami',
    'pepperdine-university', 'tulane-university', 'rutgers-university-new-brunswick', 'university-of-maryland-college-park',
    'texas-am-university', 'ohio-state-university', 'purdue-university', 'fordham-university', 'southern-methodist-university',
    'syracuse-university', 'university-of-pittsburgh', 'clemson-university', 'virginia-tech', 'university-of-minnesota-twin-cities',
    'michigan-state-university', 'baylor-university', 'colorado-school-of-mines', 'indiana-university-bloomington', 'marquette-university',
    'university-of-iowa', 'north-carolina-state-university', 'university-of-denver', 'stony-brook-university', 'university-of-connecticut',
    'university-of-massachusetts-amherst', 'university-of-san-diego', 'american-university', 'clark-university', 'drexel-university',
    'florida-state-university', 'howard-university', 'illinois-institute-of-technology', 'loyola-marymount-university', 'miami-university-oxford',
    'new-jersey-institute-of-technology', 'northeastern-university', 'penn-state-university-park', 'rensselaer-polytechnic-institute',
    'stevens-institute-of-technology', 'university-of-alabama', 'university-of-arizona', 'university-of-california-santa-barbara',
    'university-of-colorado-boulder', 'university-of-utah', 'university-of-washington', 'brigham-young-university-provo', 'gonzaga-university',
    'santa-clara-university', 'university-of-pacific', 'texas-christian-university', 'university-of-oklahoma', 'university-of-oregon',
    'university-of-south-carolina', 'auburn-university', 'university-of-tennessee-knoxville', 'university-of-kansas', 'university-of-kentucky',
    'university-of-nebraska-lincoln', 'university-of-new-mexico', 'university-of-hawaii-manoa', 'binghamton-university', 'university-at-buffalo',
    'university-of-cincinnati', 'university-of-houston', 'university-of-south-florida', 'arizona-state-university-tempe', 'oregon-state-university',
    'san-diego-state-university', 'university-of-california-riverside', 'university-of-california-santa-cruz', 'university-of-missouri',
    'iowa-state-university', 'kansas-state-university', 'oklahoma-state-university', 'university-of-vermont', 'wayne-state-university',
    'common-app'
  )
);

-- 2. Delete essays for colleges we're removing
delete from public.essays
where college_id not in (
  'princeton-university', 'mit', 'harvard-university', 'stanford-university', 'yale-university',
  'caltech', 'duke-university', 'johns-hopkins-university', 'northwestern-university', 'university-of-pennsylvania',
  'cornell-university', 'university-of-chicago', 'brown-university', 'columbia-university', 'dartmouth-college',
  'ucla', 'uc-berkeley', 'rice-university', 'university-of-notre-dame', 'vanderbilt-university',
  'carnegie-mellon-university', 'university-of-michigan-ann-arbor', 'washington-university-st-louis', 'emory-university',
  'georgetown-university', 'university-of-virginia', 'unc-chapel-hill', 'university-of-southern-california', 'uc-san-diego',
  'new-york-university', 'university-of-florida', 'university-of-texas-austin', 'boston-college', 'college-of-william-mary',
  'university-of-california-davis', 'university-of-california-irvine', 'university-of-rochester', 'boston-university',
  'georgia-institute-of-technology', 'university-of-illinois-urbana-champaign', 'university-of-wisconsin-madison', 'university-of-miami',
  'pepperdine-university', 'tulane-university', 'rutgers-university-new-brunswick', 'university-of-maryland-college-park',
  'texas-am-university', 'ohio-state-university', 'purdue-university', 'fordham-university', 'southern-methodist-university',
  'syracuse-university', 'university-of-pittsburgh', 'clemson-university', 'virginia-tech', 'university-of-minnesota-twin-cities',
  'michigan-state-university', 'baylor-university', 'colorado-school-of-mines', 'indiana-university-bloomington', 'marquette-university',
  'university-of-iowa', 'north-carolina-state-university', 'university-of-denver', 'stony-brook-university', 'university-of-connecticut',
  'university-of-massachusetts-amherst', 'university-of-san-diego', 'american-university', 'clark-university', 'drexel-university',
  'florida-state-university', 'howard-university', 'illinois-institute-of-technology', 'loyola-marymount-university', 'miami-university-oxford',
  'new-jersey-institute-of-technology', 'northeastern-university', 'penn-state-university-park', 'rensselaer-polytechnic-institute',
  'stevens-institute-of-technology', 'university-of-alabama', 'university-of-arizona', 'university-of-california-santa-barbara',
  'university-of-colorado-boulder', 'university-of-utah', 'university-of-washington', 'brigham-young-university-provo', 'gonzaga-university',
  'santa-clara-university', 'university-of-pacific', 'texas-christian-university', 'university-of-oklahoma', 'university-of-oregon',
  'university-of-south-carolina', 'auburn-university', 'university-of-tennessee-knoxville', 'university-of-kansas', 'university-of-kentucky',
  'university-of-nebraska-lincoln', 'university-of-new-mexico', 'university-of-hawaii-manoa', 'binghamton-university', 'university-at-buffalo',
  'university-of-cincinnati', 'university-of-houston', 'university-of-south-florida', 'arizona-state-university-tempe', 'oregon-state-university',
  'san-diego-state-university', 'university-of-california-riverside', 'university-of-california-santa-cruz', 'university-of-missouri',
  'iowa-state-university', 'kansas-state-university', 'oklahoma-state-university', 'university-of-vermont', 'wayne-state-university',
  'common-app'
);

-- 3. Remove user_colleges links to colleges we're about to delete (avoids FK errors)
delete from public.user_colleges
where college_id not in (
  'princeton-university', 'mit', 'harvard-university', 'stanford-university', 'yale-university',
  'caltech', 'duke-university', 'johns-hopkins-university', 'northwestern-university', 'university-of-pennsylvania',
  'cornell-university', 'university-of-chicago', 'brown-university', 'columbia-university', 'dartmouth-college',
  'ucla', 'uc-berkeley', 'rice-university', 'university-of-notre-dame', 'vanderbilt-university',
  'carnegie-mellon-university', 'university-of-michigan-ann-arbor', 'washington-university-st-louis', 'emory-university',
  'georgetown-university', 'university-of-virginia', 'unc-chapel-hill', 'university-of-southern-california', 'uc-san-diego',
  'new-york-university', 'university-of-florida', 'university-of-texas-austin', 'boston-college', 'college-of-william-mary',
  'university-of-california-davis', 'university-of-california-irvine', 'university-of-rochester', 'boston-university',
  'georgia-institute-of-technology', 'university-of-illinois-urbana-champaign', 'university-of-wisconsin-madison', 'university-of-miami',
  'pepperdine-university', 'tulane-university', 'rutgers-university-new-brunswick', 'university-of-maryland-college-park',
  'texas-am-university', 'ohio-state-university', 'purdue-university', 'fordham-university', 'southern-methodist-university',
  'syracuse-university', 'university-of-pittsburgh', 'clemson-university', 'virginia-tech', 'university-of-minnesota-twin-cities',
  'michigan-state-university', 'baylor-university', 'colorado-school-of-mines', 'indiana-university-bloomington', 'marquette-university',
  'university-of-iowa', 'north-carolina-state-university', 'university-of-denver', 'stony-brook-university', 'university-of-connecticut',
  'university-of-massachusetts-amherst', 'university-of-san-diego', 'american-university', 'clark-university', 'drexel-university',
  'florida-state-university', 'howard-university', 'illinois-institute-of-technology', 'loyola-marymount-university', 'miami-university-oxford',
  'new-jersey-institute-of-technology', 'northeastern-university', 'penn-state-university-park', 'rensselaer-polytechnic-institute',
  'stevens-institute-of-technology', 'university-of-alabama', 'university-of-arizona', 'university-of-california-santa-barbara',
  'university-of-colorado-boulder', 'university-of-utah', 'university-of-washington', 'brigham-young-university-provo', 'gonzaga-university',
  'santa-clara-university', 'university-of-pacific', 'texas-christian-university', 'university-of-oklahoma', 'university-of-oregon',
  'university-of-south-carolina', 'auburn-university', 'university-of-tennessee-knoxville', 'university-of-kansas', 'university-of-kentucky',
  'university-of-nebraska-lincoln', 'university-of-new-mexico', 'university-of-hawaii-manoa', 'binghamton-university', 'university-at-buffalo',
  'university-of-cincinnati', 'university-of-houston', 'university-of-south-florida', 'arizona-state-university-tempe', 'oregon-state-university',
  'san-diego-state-university', 'university-of-california-riverside', 'university-of-california-santa-cruz', 'university-of-missouri',
  'iowa-state-university', 'kansas-state-university', 'oklahoma-state-university', 'university-of-vermont', 'wayne-state-university',
  'common-app'
);

-- 4. Remove college_prompts for colleges we're about to delete
delete from public.college_prompts
where college_id not in (
  'princeton-university', 'mit', 'harvard-university', 'stanford-university', 'yale-university',
  'caltech', 'duke-university', 'johns-hopkins-university', 'northwestern-university', 'university-of-pennsylvania',
  'cornell-university', 'university-of-chicago', 'brown-university', 'columbia-university', 'dartmouth-college',
  'ucla', 'uc-berkeley', 'rice-university', 'university-of-notre-dame', 'vanderbilt-university',
  'carnegie-mellon-university', 'university-of-michigan-ann-arbor', 'washington-university-st-louis', 'emory-university',
  'georgetown-university', 'university-of-virginia', 'unc-chapel-hill', 'university-of-southern-california', 'uc-san-diego',
  'new-york-university', 'university-of-florida', 'university-of-texas-austin', 'boston-college', 'college-of-william-mary',
  'university-of-california-davis', 'university-of-california-irvine', 'university-of-rochester', 'boston-university',
  'georgia-institute-of-technology', 'university-of-illinois-urbana-champaign', 'university-of-wisconsin-madison', 'university-of-miami',
  'pepperdine-university', 'tulane-university', 'rutgers-university-new-brunswick', 'university-of-maryland-college-park',
  'texas-am-university', 'ohio-state-university', 'purdue-university', 'fordham-university', 'southern-methodist-university',
  'syracuse-university', 'university-of-pittsburgh', 'clemson-university', 'virginia-tech', 'university-of-minnesota-twin-cities',
  'michigan-state-university', 'baylor-university', 'colorado-school-of-mines', 'indiana-university-bloomington', 'marquette-university',
  'university-of-iowa', 'north-carolina-state-university', 'university-of-denver', 'stony-brook-university', 'university-of-connecticut',
  'university-of-massachusetts-amherst', 'university-of-san-diego', 'american-university', 'clark-university', 'drexel-university',
  'florida-state-university', 'howard-university', 'illinois-institute-of-technology', 'loyola-marymount-university', 'miami-university-oxford',
  'new-jersey-institute-of-technology', 'northeastern-university', 'penn-state-university-park', 'rensselaer-polytechnic-institute',
  'stevens-institute-of-technology', 'university-of-alabama', 'university-of-arizona', 'university-of-california-santa-barbara',
  'university-of-colorado-boulder', 'university-of-utah', 'university-of-washington', 'brigham-young-university-provo', 'gonzaga-university',
  'santa-clara-university', 'university-of-pacific', 'texas-christian-university', 'university-of-oklahoma', 'university-of-oregon',
  'university-of-south-carolina', 'auburn-university', 'university-of-tennessee-knoxville', 'university-of-kansas', 'university-of-kentucky',
  'university-of-nebraska-lincoln', 'university-of-new-mexico', 'university-of-hawaii-manoa', 'binghamton-university', 'university-at-buffalo',
  'university-of-cincinnati', 'university-of-houston', 'university-of-south-florida', 'arizona-state-university-tempe', 'oregon-state-university',
  'san-diego-state-university', 'university-of-california-riverside', 'university-of-california-santa-cruz', 'university-of-missouri',
  'iowa-state-university', 'kansas-state-university', 'oklahoma-state-university', 'university-of-vermont', 'wayne-state-university',
  'common-app'
);

-- 5. Delete colleges not in the top 100 + common-app
delete from public.colleges
where id not in (
  'princeton-university', 'mit', 'harvard-university', 'stanford-university', 'yale-university',
  'caltech', 'duke-university', 'johns-hopkins-university', 'northwestern-university', 'university-of-pennsylvania',
  'cornell-university', 'university-of-chicago', 'brown-university', 'columbia-university', 'dartmouth-college',
  'ucla', 'uc-berkeley', 'rice-university', 'university-of-notre-dame', 'vanderbilt-university',
  'carnegie-mellon-university', 'university-of-michigan-ann-arbor', 'washington-university-st-louis', 'emory-university',
  'georgetown-university', 'university-of-virginia', 'unc-chapel-hill', 'university-of-southern-california', 'uc-san-diego',
  'new-york-university', 'university-of-florida', 'university-of-texas-austin', 'boston-college', 'college-of-william-mary',
  'university-of-california-davis', 'university-of-california-irvine', 'university-of-rochester', 'boston-university',
  'georgia-institute-of-technology', 'university-of-illinois-urbana-champaign', 'university-of-wisconsin-madison', 'university-of-miami',
  'pepperdine-university', 'tulane-university', 'rutgers-university-new-brunswick', 'university-of-maryland-college-park',
  'texas-am-university', 'ohio-state-university', 'purdue-university', 'fordham-university', 'southern-methodist-university',
  'syracuse-university', 'university-of-pittsburgh', 'clemson-university', 'virginia-tech', 'university-of-minnesota-twin-cities',
  'michigan-state-university', 'baylor-university', 'colorado-school-of-mines', 'indiana-university-bloomington', 'marquette-university',
  'university-of-iowa', 'north-carolina-state-university', 'university-of-denver', 'stony-brook-university', 'university-of-connecticut',
  'university-of-massachusetts-amherst', 'university-of-san-diego', 'american-university', 'clark-university', 'drexel-university',
  'florida-state-university', 'howard-university', 'illinois-institute-of-technology', 'loyola-marymount-university', 'miami-university-oxford',
  'new-jersey-institute-of-technology', 'northeastern-university', 'penn-state-university-park', 'rensselaer-polytechnic-institute',
  'stevens-institute-of-technology', 'university-of-alabama', 'university-of-arizona', 'university-of-california-santa-barbara',
  'university-of-colorado-boulder', 'university-of-utah', 'university-of-washington', 'brigham-young-university-provo', 'gonzaga-university',
  'santa-clara-university', 'university-of-pacific', 'texas-christian-university', 'university-of-oklahoma', 'university-of-oregon',
  'university-of-south-carolina', 'auburn-university', 'university-of-tennessee-knoxville', 'university-of-kansas', 'university-of-kentucky',
  'university-of-nebraska-lincoln', 'university-of-new-mexico', 'university-of-hawaii-manoa', 'binghamton-university', 'university-at-buffalo',
  'university-of-cincinnati', 'university-of-houston', 'university-of-south-florida', 'arizona-state-university-tempe', 'oregon-state-university',
  'san-diego-state-university', 'university-of-california-riverside', 'university-of-california-santa-cruz', 'university-of-missouri',
  'iowa-state-university', 'kansas-state-university', 'oklahoma-state-university', 'university-of-vermont', 'wayne-state-university',
  'common-app'
);
