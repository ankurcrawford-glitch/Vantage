-- Batch 2: additional motto + website URLs sourced from SloganList, matched
-- to the college IDs still missing a motto after running batch 1.
-- Safe to run multiple times.
--
-- NOTE (data quality issue to address later): your colleges table contains
-- duplicate rows for some schools with slightly different IDs, e.g. both
-- `mit` and `massachusetts-institute-of-technology`, `ucla` and
-- `university-of-california-los-angeles`, etc. This file seeds BOTH versions
-- so the UI works regardless of which one is referenced. The long-term fix
-- is a dedup migration that consolidates duplicates and updates foreign
-- keys (essays.college_prompt_id -> college_prompts.college_id).

-- =============================================================================
-- Duplicate rows (same motto as the original, just different id)
-- =============================================================================

update public.colleges set motto = 'Mens et Manus', motto_translation = 'Mind and Hand', website_url = 'https://www.mit.edu' where id = 'massachusetts-institute-of-technology';
update public.colleges set motto = 'The truth shall make you free', motto_translation = null, website_url = 'https://www.caltech.edu' where id = 'california-institute-of-technology';
update public.colleges set motto = 'Fiat Lux', motto_translation = 'Let there be light', website_url = 'https://www.ucla.edu' where id = 'university-of-california-los-angeles';
update public.colleges set motto = 'Fiat Lux', motto_translation = 'Let there be light', website_url = 'https://www.berkeley.edu' where id = 'university-of-california-berkeley';
update public.colleges set motto = 'Fiat Lux', motto_translation = 'Let there be light', website_url = 'https://ucsd.edu' where id = 'university-of-california-san-diego';
update public.colleges set motto = 'Lux et Veritas', motto_translation = 'Light and Truth', website_url = 'https://www.yale.edu' where id = 'a0000000-0000-0000-0000-000000000003';
update public.colleges set motto = 'Leges sine moribus vanae', motto_translation = 'Laws without morals are useless', website_url = 'https://www.upenn.edu' where id = 'a0000000-0000-0000-0000-000000000009';
update public.colleges set motto = 'Palmam qui meruit ferat', motto_translation = 'Let him who deserves it bear away the palm', website_url = 'https://www.usc.edu' where id = 'a0000000-0000-0000-0000-000000000014';
update public.colleges set motto = 'Artes, Scientia, Veritas', motto_translation = 'Art, Science, Truth', website_url = 'https://umich.edu' where id = 'a0000000-0000-0000-0000-000000000015';
update public.colleges set motto = 'Artes, Scientia, Veritas', motto_translation = 'Art, Science, Truth', website_url = 'https://umich.edu' where id = 'university-of-michigan-fxgbiq';
update public.colleges set motto = 'Per veritatem vis', motto_translation = 'Strength through truth', website_url = 'https://wustl.edu' where id = 'washington-university-in-st-louis';
update public.colleges set motto = 'Lux Libertas', motto_translation = 'Light and Liberty', website_url = 'https://www.unc.edu' where id = 'university-of-north-carolina-at-chapel-hill';
update public.colleges set motto = 'Disciplina praesidium civitatis', motto_translation = 'Education, the Guardian of Society', website_url = 'https://www.utexas.edu' where id = 'university-of-texas-at-austin';
update public.colleges set motto = 'Learning and Labor', motto_translation = null, website_url = 'https://illinois.edu' where id = 'university-of-illinois-urbanachampaign';

-- =============================================================================
-- UC system (others that share Fiat Lux)
-- =============================================================================

update public.colleges set motto = 'Fiat Lux', motto_translation = 'Let there be light', website_url = 'https://www.ucmerced.edu' where id = 'university-of-california-merced';
update public.colleges set motto = 'Fiat Lux', motto_translation = 'Let there be light', website_url = 'https://www.ucsb.edu' where id = 'university-of-california-santa-barbara';

-- =============================================================================
-- Liberal arts colleges
-- =============================================================================

update public.colleges set motto = 'Terras Irradient', motto_translation = 'Let them give light to the world', website_url = 'https://www.amherst.edu' where id = 'amherst-college';
update public.colleges set motto = 'Hac itur ad astra', motto_translation = 'As an eagle towards the sky', website_url = 'https://www.bowdoin.edu' where id = 'bowdoin-college';
update public.colleges set motto = 'Lux mentis scientia', motto_translation = 'Knowledge is the Light of the Mind', website_url = 'https://www.colby.edu' where id = 'colby-college';
update public.colleges set motto = 'Deo ac Veritati', motto_translation = 'For God and for Truth', website_url = 'https://www.colgate.edu' where id = 'colgate-university';
update public.colleges set motto = 'Scientia cum virtute et sapientia colendas', motto_translation = 'Knowledge and Training', website_url = 'https://www.coloradocollege.edu' where id = 'colorado-college';
update public.colleges set motto = 'Alenda lux ubi orta libertas', motto_translation = 'Let Learning Be Cherished Where Liberty Has Arisen', website_url = 'https://www.davidson.edu' where id = 'davidson-college';
update public.colleges set motto = 'Veritas et Humanitas', motto_translation = 'Truth and Humanity', website_url = 'https://www.grinnell.edu' where id = 'grinnell-college';
update public.colleges set motto = 'Know Thyself', motto_translation = null, website_url = 'https://www.hamilton.edu' where id = 'hamilton-college';
update public.colleges set motto = 'Knowledge and Virtue', motto_translation = null, website_url = 'https://www.middlebury.edu' where id = 'middlebury-college';
update public.colleges set motto = 'In virtute et scientia', motto_translation = 'In virtue, knowledge', website_url = 'https://www.smith.edu' where id = 'smith-college';
update public.colleges set motto = 'Non Ministrari sed Ministrare', motto_translation = 'Not to be ministered unto, but to minister', website_url = 'https://www.wellesley.edu' where id = 'wellesley-college';
update public.colleges set motto = 'E Liberalitate E. Williams, Armigeri', motto_translation = 'Through the Generosity of E. Williams, Esquire', website_url = 'https://www.williams.edu' where id = 'williams-college';
update public.colleges set motto = 'Naturae et Revelationis duae sorores caelestes', motto_translation = 'Nature and Revelation are twin sisters of heaven', website_url = 'https://www.macalester.edu' where id = 'macalester-college';
update public.colleges set motto = 'Hypereides', motto_translation = 'Following the Way of Reason', website_url = 'https://barnard.edu' where id = 'barnard-college';

-- =============================================================================
-- More privates
-- =============================================================================

update public.colleges set motto = 'Pro Deo et Patria', motto_translation = 'For God and Country', website_url = 'https://www.american.edu' where id = 'american-university';
update public.colleges set motto = 'Pro ecclesia, pro Texana', motto_translation = 'For Church, For Texas', website_url = 'https://www.baylor.edu' where id = 'baylor-university';
update public.colleges set motto = 'Truth, even unto its innermost parts', motto_translation = null, website_url = 'https://www.brandeis.edu' where id = 'brandeis-university';
update public.colleges set motto = 'Enter to learn; go forth to serve', motto_translation = null, website_url = 'https://www.byu.edu' where id = 'brigham-young-university';
update public.colleges set motto = 'Crescit cum commercio civitas', motto_translation = 'Civilization prospers with commerce', website_url = 'https://www.cmc.edu' where id = 'claremont-mckenna-college';
update public.colleges set motto = 'Who shall separate us now?', motto_translation = null, website_url = 'https://www.clemson.edu' where id = 'clemson-university';
update public.colleges set motto = 'Science, Industry, Art', motto_translation = null, website_url = 'https://drexel.edu' where id = 'drexel-university';
update public.colleges set motto = 'Vires Artes Mores', motto_translation = 'Strength, Skill, Character', website_url = 'https://www.fsu.edu' where id = 'florida-state-university';
update public.colleges set motto = 'In God Our Trust', motto_translation = null, website_url = 'https://www.gwu.edu' where id = 'george-washington-university';
update public.colleges set motto = 'Lux et Veritas et Virtus', motto_translation = 'Light and Truth', website_url = 'https://www.indiana.edu' where id = 'indiana-university-bloomington';
update public.colleges set motto = 'Homo minister et interpres naturae', motto_translation = 'Man, the servant and interpreter of nature', website_url = 'https://www.lehigh.edu' where id = 'lehigh-university';
update public.colleges set motto = 'Ad Maiorem Dei Gloriam', motto_translation = 'For the greater glory of God', website_url = 'https://www.lmu.edu' where id = 'loyola-marymount-university';
update public.colleges set motto = 'Lux, Veritas, Virtus', motto_translation = 'Light, Truth, Courage', website_url = 'https://www.northeastern.edu' where id = 'northeastern-university';
update public.colleges set motto = 'Making life better', motto_translation = null, website_url = 'https://www.psu.edu' where id = 'penn-state-university';
update public.colleges set motto = 'Knowledge and Thoroughness', motto_translation = null, website_url = 'https://www.rpi.edu' where id = 'rensselaer-polytechnic-institute';
update public.colleges set motto = 'Per Aspera Ad Astra', motto_translation = 'Through adversity to the stars', website_url = 'https://www.stevens.edu' where id = 'stevens-institute-of-technology';
update public.colleges set motto = 'Perseverantia Vincit', motto_translation = 'Perseverance Conquers', website_url = 'https://www.temple.edu' where id = 'temple-university';
update public.colleges set motto = 'Pax et Lux', motto_translation = 'Peace and Light', website_url = 'https://www.tufts.edu' where id = 'tufts-university';
update public.colleges set motto = 'Veritas, Unitas, Caritas', motto_translation = 'Truth, Unity, Love', website_url = 'https://www.villanova.edu' where id = 'villanova-university';
update public.colleges set motto = 'Ut Prosim', motto_translation = 'That I may serve', website_url = 'https://www.vt.edu' where id = 'virginia-tech';
update public.colleges set motto = 'Pro Humanitate', motto_translation = 'For Humanity', website_url = 'https://www.wfu.edu' where id = 'wake-forest-university';
update public.colleges set motto = 'Non Incautus Futuri', motto_translation = 'Not Unmindful of the Future', website_url = 'https://www.wlu.edu' where id = 'washington-and-lee-university';
update public.colleges set motto = 'Lehr und Kunst', motto_translation = 'Theory and Practice', website_url = 'https://www.wpi.edu' where id = 'worcester-polytechnic-institute';

-- =============================================================================
-- Public flagships / state schools
-- =============================================================================

update public.colleges set motto = 'Mens agitat molem', motto_translation = 'A mind moves the mass', website_url = 'https://www.auburn.edu' where id = 'auburn-university';
update public.colleges set motto = 'Let your light shine', motto_translation = null, website_url = 'https://www.colorado.edu' where id = 'university-of-colorado-boulder';
update public.colleges set motto = 'Pro Scientia et Religione', motto_translation = 'For Knowledge and Religion', website_url = 'https://www.du.edu' where id = 'university-of-denver';
update public.colleges set motto = 'To teach, to serve, and to inquire into the nature of things', motto_translation = null, website_url = 'https://www.uga.edu' where id = 'university-of-georgia';
update public.colleges set motto = 'Ense petit placidam sub libertate quietem', motto_translation = 'By the sword we seek peace, but peace only under liberty', website_url = 'https://www.umass.edu' where id = 'university-of-massachusetts-amherst';
update public.colleges set motto = 'A Common Bond for All the Arts', motto_translation = null, website_url = 'https://twin-cities.umn.edu' where id = 'university-of-minnesota-twin-cities';
update public.colleges set motto = 'Mens Agitat Molem', motto_translation = 'Minds Move Mountains', website_url = 'https://www.uoregon.edu' where id = 'university-of-oregon';
update public.colleges set motto = 'Veritas et Virtus', motto_translation = 'Truth and Virtue', website_url = 'https://www.pitt.edu' where id = 'university-of-pittsburgh';
update public.colleges set motto = 'Emollit mores nec sinit esse feros', motto_translation = 'Learning humanizes character and does not permit it to be cruel', website_url = 'https://sc.edu' where id = 'university-of-south-carolina';
update public.colleges set motto = 'Studiis et Rebus Honestis', motto_translation = 'Through Studies and Upright Affairs', website_url = 'https://www.uvm.edu' where id = 'university-of-vermont';
update public.colleges set motto = 'Ever to grow in virtue and knowledge', motto_translation = null, website_url = 'https://www.virginia.edu' where id = 'university-of-virginia';
update public.colleges set motto = 'Lux Sit', motto_translation = 'Let there be light', website_url = 'https://www.washington.edu' where id = 'university-of-washington';
update public.colleges set motto = 'Mens sana in corpore sano', motto_translation = 'Sound mind in a sound body', website_url = 'https://www.buffalo.edu' where id = 'university-at-buffalo-suny';

-- =============================================================================
-- Common Application pseudo-college (no motto, but URL is nice to have)
-- =============================================================================

update public.colleges set motto = null, motto_translation = null, website_url = 'https://www.commonapp.org' where id = 'a0000000-0000-0000-0000-000000000000';

-- =============================================================================
-- Sanity check
-- =============================================================================

select
  count(*) filter (where motto is not null) as seeded,
  count(*) filter (where motto is null) as remaining
from public.colleges;
