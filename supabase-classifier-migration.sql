-- Vantage Classifier V1: extend schema for Safety/Target/Reach + ED Strategy
-- Run AFTER existing colleges/user_stats tables exist.
-- Idempotent — safe to run multiple times.

-- =============================================================================
-- COLLEGES — add classifier-relevant columns
-- =============================================================================
alter table public.colleges
  add column if not exists ed_admit_rate decimal,                -- 0..1, null if no ED program
  add column if not exists ea_admit_rate decimal,                -- 0..1, optional
  add column if not exists gpa_median_uw decimal,                -- unweighted GPA 50th pctile
  add column if not exists gpa_median_w decimal,                 -- weighted GPA 50th pctile
  add column if not exists test_optional boolean default false,  -- accepts test-optional applications
  add column if not exists is_public boolean default false,      -- public flagship?
  add column if not exists state text,                           -- 2-letter state code, for in-state bump
  add column if not exists available_rounds text[]               -- e.g. {RD, ED, EA} or {RD, REA}
    default array['RD']::text[],
  add column if not exists program_admit_rate decimal,           -- e.g. CMU SCS sub-rate
  add column if not exists program_override_majors text[];       -- which majors trigger program rate

-- =============================================================================
-- USER_STATS — add fields needed by classifier
-- =============================================================================
alter table public.user_stats
  add column if not exists state text,                           -- 2-letter state, for in-state bump
  add column if not exists intended_major text,                  -- maps to Major enum
  add column if not exists ap_count int default 0,               -- count of AP courses
  add column if not exists test_optional boolean default false,  -- applying test-optional?
  add column if not exists hook_recruited_athlete boolean default false,
  add column if not exists hook_first_gen boolean default false,
  add column if not exists hook_urm boolean default false,
  add column if not exists hook_low_income boolean default false,
  add column if not exists hook_legacy_active boolean default false,
  add column if not exists hook_legacy_college_ids uuid[] default array[]::uuid[];

-- =============================================================================
-- Seed classifier data for the Top 100 (only updates rows where columns are null,
-- so existing data is preserved). Limited to schools we have confident numbers
-- for as of 2025 cycle. Names below match the supabase-colleges-seed-top100.sql.
-- =============================================================================

-- Helper: only update if the field is currently null. We match on lower(name)
-- to be resilient to capitalization drift.
do $$
declare r record;
begin
  for r in (
    select * from (values
      -- name,                             admit, ed,    ea,    gpa_uw, gpa_w, sat_lo, sat_hi, public, state, rounds,                program_rate, program_majors
      ('Harvard University',               0.034, null,  0.087, 4.18,  4.7,   1500,  1580,   false,  'MA',  array['RD','REA'],     null,  null),
      ('Stanford University',              0.036, null,  0.072, 3.96,  4.5,   1500,  1580,   false,  'CA',  array['RD','REA'],     null,  null),
      ('Massachusetts Institute of Technology', 0.045, null, 0.052, 3.95, 4.6, 1530, 1580,    false,  'MA',  array['RD','EA'],      null,  null),
      ('Yale University',                  0.038, null,  0.085, 4.14,  4.6,   1490,  1580,   false,  'CT',  array['RD','REA'],     null,  null),
      ('Princeton University',             0.046, null,  null,  3.95,  4.6,   1500,  1580,   false,  'NJ',  array['RD'],           null,  null),
      ('University of Pennsylvania',       0.058, 0.150, null,  3.92,  4.5,   1500,  1570,   false,  'PA',  array['RD','ED'],      null,  null),
      ('Columbia University',              0.039, 0.108, null,  3.91,  4.5,   1490,  1570,   false,  'NY',  array['RD','ED'],      null,  null),
      ('Brown University',                 0.052, 0.127, null,  3.94,  4.5,   1500,  1570,   false,  'RI',  array['RD','ED'],      null,  null),
      ('Cornell University',               0.075, 0.222, null,  3.90,  4.4,   1480,  1560,   false,  'NY',  array['RD','ED'],      null,  null),
      ('Dartmouth College',                0.060, 0.190, null,  3.90,  4.4,   1450,  1560,   false,  'NH',  array['RD','ED'],      null,  null),
      ('Duke University',                  0.063, 0.169, null,  3.94,  4.5,   1490,  1560,   false,  'NC',  array['RD','ED'],      null,  null),
      ('Northwestern University',          0.071, 0.207, null,  3.90,  4.4,   1490,  1560,   false,  'IL',  array['RD','ED'],      null,  null),
      ('Johns Hopkins University',         0.071, 0.275, null,  3.93,  4.4,   1500,  1570,   false,  'MD',  array['RD','ED','ED2'],null,  null),
      ('Vanderbilt University',            0.057, 0.157, null,  3.83,  4.4,   1480,  1560,   false,  'TN',  array['RD','ED','ED2'],null,  null),
      ('Rice University',                  0.077, 0.155, null,  3.91,  4.4,   1490,  1560,   false,  'TX',  array['RD','ED'],      null,  null),
      ('Washington University in St. Louis', 0.118, 0.310, null, 3.91, 4.4,   1500,  1560,   false,  'MO',  array['RD','ED','ED2'],null,  null),
      ('Emory University',                 0.110, 0.310, null,  3.81,  4.2,   1450,  1540,   false,  'GA',  array['RD','ED','ED2'],null,  null),
      ('Notre Dame',                       0.123, 0.245, null,  4.05,  4.5,   1450,  1540,   false,  'IN',  array['RD','REA'],     null,  null),
      ('University of Chicago',            0.054, 0.131, 0.090, 4.07,  4.5,   1510,  1580,   false,  'IL',  array['RD','EA','ED','ED2'], null, null),
      ('Carnegie Mellon University',       0.110, 0.170, null,  3.81,  4.2,   1500,  1560,   false,  'PA',  array['RD','ED'],      0.060, array['Computer Science']),
      ('Georgetown University',            0.116, null,  0.110, 3.85,  4.3,   1410,  1530,   false,  'DC',  array['RD','REA'],     null,  null),
      ('Tufts University',                 0.090, 0.330, null,  3.81,  4.3,   1450,  1530,   false,  'MA',  array['RD','ED','ED2'],null,  null),
      ('Northeastern University',          0.063, 0.200, 0.150, 4.10,  4.4,   1450,  1530,   false,  'MA',  array['RD','ED','EA'], 0.030, array['Computer Science']),
      ('New York University',              0.080, 0.280, null,  3.71,  4.0,   1450,  1550,   false,  'NY',  array['RD','ED','ED2'],null,  null),
      ('Boston College',                   0.155, 0.380, null,  3.74,  4.2,   1420,  1510,   false,  'MA',  array['RD','EA','ED'], null,  null),
      ('Boston University',                0.108, 0.295, null,  3.73,  4.1,   1430,  1510,   false,  'MA',  array['RD','ED','ED2'],null,  null),
      ('University of Southern California', 0.103, null, null,  3.79,  4.2,   1440,  1530,   false,  'CA',  array['RD'],           null,  null),
      ('University of California, Berkeley', 0.115, null, null, 3.89,  4.3,   1340,  1530,   true,   'CA',  array['RD'],           null,  null),
      ('University of California, Los Angeles', 0.090, null, null, 3.90, 4.3, 1300, 1520,    true,   'CA',  array['RD'],           null,  null),
      ('University of Michigan',           0.179, null,  0.220, 3.87,  4.3,   1340,  1530,   true,   'MI',  array['RD','EA'],      null,  null),
      ('University of Virginia',           0.190, 0.320, 0.200, 4.13,  4.4,   1410,  1520,   true,   'VA',  array['RD','ED','EA'], null,  null),
      ('University of North Carolina at Chapel Hill', 0.180, null, 0.180, 4.39, 4.7, 1370, 1510, true, 'NC', array['RD','EA'],     null,  null),
      ('Georgia Institute of Technology',  0.160, null,  0.190, 4.07,  4.3,   1370,  1530,   true,   'GA',  array['RD','EA'],      null,  null),
      ('University of Texas at Austin',    0.305, null,  null,  3.85,  4.2,   1300,  1490,   true,   'TX',  array['RD'],           null,  null),
      ('University of Florida',            0.230, null,  null,  4.40,  4.6,   1320,  1450,   true,   'FL',  array['RD'],           null,  null),
      ('University of Illinois Urbana-Champaign', 0.450, null, null, 3.85, 4.3, 1300, 1500,  true,   'IL',  array['RD'],           0.150, array['Computer Science']),
      ('University of Wisconsin–Madison',  0.490, null,  null,  3.85,  4.2,   1330,  1480,   true,   'WI',  array['RD','EA'],      null,  null),
      ('University of Wisconsin-Madison',  0.490, null,  null,  3.85,  4.2,   1330,  1480,   true,   'WI',  array['RD','EA'],      null,  null),
      ('Purdue University',                0.500, null,  0.530, 3.74,  3.9,   1190,  1430,   true,   'IN',  array['RD','EA'],      null,  null),
      ('Indiana University Bloomington',   0.800, null,  null,  3.85,  4.0,   1180,  1390,   true,   'IN',  array['RD'],           null,  null),
      ('Indiana University Bloomington (IUB)', 0.800, null, null, 3.85, 4.0,  1180,  1390,   true,   'IN',  array['RD'],           null,  null)
    ) as t(name, admit, ed, ea, gpa_uw, gpa_w, sat_lo, sat_hi, is_pub, st, rounds, prog_rate, prog_majors)
  ) loop
    update public.colleges c
       set ed_admit_rate          = coalesce(c.ed_admit_rate, r.ed),
           ea_admit_rate          = coalesce(c.ea_admit_rate, r.ea),
           gpa_median_uw          = coalesce(c.gpa_median_uw, r.gpa_uw),
           gpa_median_w           = coalesce(c.gpa_median_w,  r.gpa_w),
           is_public              = coalesce(c.is_public,     r.is_pub),
           state                  = coalesce(c.state,         r.st),
           available_rounds       = case when c.available_rounds is null or array_length(c.available_rounds,1) is null
                                          then r.rounds
                                          else c.available_rounds end,
           program_admit_rate     = coalesce(c.program_admit_rate,     r.prog_rate),
           program_override_majors = case when c.program_override_majors is null or array_length(c.program_override_majors,1) is null
                                          then r.prog_majors
                                          else c.program_override_majors end
     where lower(c.name) = lower(r.name);
  end loop;
end$$;

-- Backfill defaults for any rows still missing rounds — every school has RD.
update public.colleges
   set available_rounds = array['RD']::text[]
 where available_rounds is null
    or array_length(available_rounds, 1) is null;

-- Sane SAT defaults for state; if a row was seeded with no state, leave it.
-- (No-op fallback)
