-- Seed: colleges previously missing from the catalog (UNC-CH, HBCUs,
-- women's/liberal-arts gaps, service academies, geo-advantage state flagships).
-- Acceptance rates are FRACTIONS (0-1, matching numeric(5,4) column) and approximate;
-- refine via the College Scorecard sync when built. Idempotent: skips
-- any college whose name already exists.

insert into colleges (id, name, location, state, is_public, acceptance_rate, sat_range_low, sat_range_high)
select 'unc-chapel-hill', 'University of North Carolina at Chapel Hill', 'Chapel Hill, NC', 'NC', true, 0.1540, 1350, 1530
where not exists (select 1 from colleges where id = 'unc-chapel-hill' or name = 'University of North Carolina at Chapel Hill');
insert into colleges (id, name, location, state, is_public, acceptance_rate, sat_range_low, sat_range_high)
select 'howard-university', 'Howard University', 'Washington, DC', 'DC', false, 0.3200, 1130, 1290
where not exists (select 1 from colleges where id = 'howard-university' or name = 'Howard University');
insert into colleges (id, name, location, state, is_public, acceptance_rate, sat_range_low, sat_range_high)
select 'spelman-college', 'Spelman College', 'Atlanta, GA', 'GA', false, 0.2500, 1080, 1230
where not exists (select 1 from colleges where id = 'spelman-college' or name = 'Spelman College');
insert into colleges (id, name, location, state, is_public, acceptance_rate, sat_range_low, sat_range_high)
select 'morehouse-college', 'Morehouse College', 'Atlanta, GA', 'GA', false, 0.5500, 1050, 1220
where not exists (select 1 from colleges where id = 'morehouse-college' or name = 'Morehouse College');
insert into colleges (id, name, location, state, is_public, acceptance_rate, sat_range_low, sat_range_high)
select 'mount-holyoke-college', 'Mount Holyoke College', 'South Hadley, MA', 'MA', false, 0.3800, 1330, 1500
where not exists (select 1 from colleges where id = 'mount-holyoke-college' or name = 'Mount Holyoke College');
insert into colleges (id, name, location, state, is_public, acceptance_rate, sat_range_low, sat_range_high)
select 'pitzer-college', 'Pitzer College', 'Claremont, CA', 'CA', false, 0.1700, 1350, 1480
where not exists (select 1 from colleges where id = 'pitzer-college' or name = 'Pitzer College');
insert into colleges (id, name, location, state, is_public, acceptance_rate, sat_range_low, sat_range_high)
select 'occidental-college', 'Occidental College', 'Los Angeles, CA', 'CA', false, 0.3500, 1310, 1470
where not exists (select 1 from colleges where id = 'occidental-college' or name = 'Occidental College');
insert into colleges (id, name, location, state, is_public, acceptance_rate, sat_range_low, sat_range_high)
select 'texas-christian-university', 'Texas Christian University', 'Fort Worth, TX', 'TX', false, 0.4300, 1150, 1350
where not exists (select 1 from colleges where id = 'texas-christian-university' or name = 'Texas Christian University');
insert into colleges (id, name, location, state, is_public, acceptance_rate, sat_range_low, sat_range_high)
select 'us-military-academy', 'United States Military Academy (West Point)', 'West Point, NY', 'NY', true, 0.1100, 1240, 1450
where not exists (select 1 from colleges where id = 'us-military-academy' or name = 'United States Military Academy (West Point)');
insert into colleges (id, name, location, state, is_public, acceptance_rate, sat_range_low, sat_range_high)
select 'us-naval-academy', 'United States Naval Academy', 'Annapolis, MD', 'MD', true, 0.0900, 1240, 1470
where not exists (select 1 from colleges where id = 'us-naval-academy' or name = 'United States Naval Academy');
insert into colleges (id, name, location, state, is_public, acceptance_rate, sat_range_low, sat_range_high)
select 'us-air-force-academy', 'United States Air Force Academy', 'Colorado Springs, CO', 'CO', true, 0.1300, 1230, 1440
where not exists (select 1 from colleges where id = 'us-air-force-academy' or name = 'United States Air Force Academy');
insert into colleges (id, name, location, state, is_public, acceptance_rate, sat_range_low, sat_range_high)
select 'university-of-mississippi', 'University of Mississippi', 'Oxford, MS', 'MS', true, 0.9700, 1060, 1290
where not exists (select 1 from colleges where id = 'university-of-mississippi' or name = 'University of Mississippi');
insert into colleges (id, name, location, state, is_public, acceptance_rate, sat_range_low, sat_range_high)
select 'mississippi-state-university', 'Mississippi State University', 'Starkville, MS', 'MS', true, 0.7800, 1050, 1280
where not exists (select 1 from colleges where id = 'mississippi-state-university' or name = 'Mississippi State University');
insert into colleges (id, name, location, state, is_public, acceptance_rate, sat_range_low, sat_range_high)
select 'west-virginia-university', 'West Virginia University', 'Morgantown, WV', 'WV', true, 0.9300, 1030, 1240
where not exists (select 1 from colleges where id = 'west-virginia-university' or name = 'West Virginia University');
insert into colleges (id, name, location, state, is_public, acceptance_rate, sat_range_low, sat_range_high)
select 'university-of-new-mexico', 'University of New Mexico', 'Albuquerque, NM', 'NM', true, 0.9600, 1010, 1240
where not exists (select 1 from colleges where id = 'university-of-new-mexico' or name = 'University of New Mexico');
insert into colleges (id, name, location, state, is_public, acceptance_rate, sat_range_low, sat_range_high)
select 'university-of-montana', 'University of Montana', 'Missoula, MT', 'MT', true, 0.9500, 1040, 1270
where not exists (select 1 from colleges where id = 'university-of-montana' or name = 'University of Montana');
insert into colleges (id, name, location, state, is_public, acceptance_rate, sat_range_low, sat_range_high)
select 'university-of-idaho', 'University of Idaho', 'Moscow, ID', 'ID', true, 0.7400, 1010, 1240
where not exists (select 1 from colleges where id = 'university-of-idaho' or name = 'University of Idaho');
insert into colleges (id, name, location, state, is_public, acceptance_rate, sat_range_low, sat_range_high)
select 'university-of-north-dakota', 'University of North Dakota', 'Grand Forks, ND', 'ND', true, 0.8900, 1010, 1250
where not exists (select 1 from colleges where id = 'university-of-north-dakota' or name = 'University of North Dakota');
insert into colleges (id, name, location, state, is_public, acceptance_rate, sat_range_low, sat_range_high)
select 'university-of-south-dakota', 'University of South Dakota', 'Vermillion, SD', 'SD', true, 0.8600, 1010, 1240
where not exists (select 1 from colleges where id = 'university-of-south-dakota' or name = 'University of South Dakota');
insert into colleges (id, name, location, state, is_public, acceptance_rate, sat_range_low, sat_range_high)
select 'university-of-alaska-fairbanks', 'University of Alaska Fairbanks', 'Fairbanks, AK', 'AK', true, 0.6700, 1000, 1240
where not exists (select 1 from colleges where id = 'university-of-alaska-fairbanks' or name = 'University of Alaska Fairbanks');
insert into colleges (id, name, location, state, is_public, acceptance_rate, sat_range_low, sat_range_high)
select 'university-of-maine', 'University of Maine', 'Orono, ME', 'ME', true, 0.9200, 1030, 1260
where not exists (select 1 from colleges where id = 'university-of-maine' or name = 'University of Maine');
insert into colleges (id, name, location, state, is_public, acceptance_rate, sat_range_low, sat_range_high)
select 'university-of-new-hampshire', 'University of New Hampshire', 'Durham, NH', 'NH', true, 0.8700, 1030, 1260
where not exists (select 1 from colleges where id = 'university-of-new-hampshire' or name = 'University of New Hampshire');
insert into colleges (id, name, location, state, is_public, acceptance_rate, sat_range_low, sat_range_high)
select 'university-of-rhode-island', 'University of Rhode Island', 'Kingston, RI', 'RI', true, 0.7600, 1080, 1280
where not exists (select 1 from colleges where id = 'university-of-rhode-island' or name = 'University of Rhode Island');

select count(*) as total_colleges from colleges;
