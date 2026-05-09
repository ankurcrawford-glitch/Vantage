-- Vantage classifier batch 3 — 90 schools (LACs, mid-tier, CSUs, CUNYs)
-- Plus dedupe of 8 duplicate rows.

-- 1. Delete duplicate rows (canonical versions already have data)
delete from public.colleges where name = 'University of California - Berkeley';
delete from public.colleges where name = 'University of California - Los Angeles';
delete from public.colleges where name = 'University of California - San Diego';
delete from public.colleges where name = 'University of North Carolina, Chapel Hill';
delete from public.colleges where name = 'University of Texas, Austin';
delete from public.colleges where name = 'University of Illinois, Urbana-Champaign';
delete from public.colleges where name = 'Texas A&M University, College Station';
delete from public.colleges where name = 'North Carolina State University, Raleigh';

-- 2. Update with researched data (idempotent: only fills NULL fields)
do $$
declare r record;
begin
  for r in (
    select
      v.name::text as name,
      v.admit::numeric as admit,
      v.ed::numeric as ed,
      v.ea::numeric as ea,
      v.gpa_uw::numeric as gpa_uw,
      v.gpa_w::numeric as gpa_w,
      v.sat_lo::int as sat_lo,
      v.sat_hi::int as sat_hi,
      v.is_pub::boolean as is_pub,
      v.st::text as st,
      v.rounds::text[] as rounds
    from (values
      ('Connecticut College', 0.3704, 0.4106, null, null, null, 1160, 1400, false, 'CT', array['RD','ED']),
      ('Bowdoin College', 0.068, null, null, null, null, null, null, false, 'ME', array['RD','ED','ED2']),
      ('Claremont McKenna College', 0.0959, 0.2337, null, null, null, 1490, 1550, false, 'CA', array['RD','ED']),
      ('Brandeis University', 0.4047, 0.4222, null, 3.9, null, 1415, 1510, false, 'MA', array['RD','ED']),
      ('Chapman University', 0.654, 0.514, null, null, null, 1280, 1410, false, 'CA', array['RD','ED','EA']),
      ('Colgate University', 0.1389, 0.1951, null, 3.85, null, 1450, 1530, false, 'NY', array['RD','ED']),
      ('Bryn Mawr College', 0.2943, 0.3662, null, null, null, 1290, 1490, false, 'PA', array['RD','ED']),
      ('Babson College', 0.16, 0.2748, null, null, null, 1410, 1500, false, 'MA', array['RD','ED','ED2','EA']),
      ('College of the Holy Cross', 0.211, 0.672, null, null, null, 1270, 1420, false, 'MA', array['RD','ED','ED2']),
      ('Colorado College', 0.22, 0.35, 0.26, 3.95, null, 1250, 1450, false, 'CO', array['RD','ED','ED2','EA']),
      ('CUNY, The City College of New York', 0.599, null, null, null, null, null, null, true, 'NY', array['RD']),
      ('CUNY, Baruch College', 0.475, null, null, null, null, 550, 690, true, 'NY', array['RD']),
      ('DePauw University', 0.571, null, null, 3.92, null, 1130, 1350, false, 'IN', array['RD']),
      ('California State University, Long Beach', 0.4626, null, null, null, null, null, null, true, 'CA', array['RD']),
      ('Barnard College', 0.1202, 0.2702, null, null, null, 1450, 1520, false, 'NY', array['RD','ED','EA']),
      ('College of New Jersey', 0.621, null, null, null, null, 1150, 1330, true, 'NJ', array['RD','ED','EA']),
      ('Amherst College', 0.0901, 0.2939, null, null, null, 1500, 1560, false, 'MA', array['RD','ED']),
      ('Cooper Union', 0.11, null, null, null, null, null, null, false, 'NY', array['RD','ED']),
      ('Bucknell University', 0.3525, 0.5467, null, null, null, 1170, 1360, false, 'PA', array['RD','ED']),
      ('CUNY, Hunter College', null, null, null, null, null, null, null, true, 'NY', array['RD']),
      ('Grinnell College', 0.1268, 0.4079, null, null, null, 1440, 1530, false, 'IA', array['RD','ED']),
      ('Haverford College', 0.17, 0.294, null, null, null, 1470, 1540, false, 'PA', array['RD','ED']),
      ('California State University, Fullerton', 0.867, null, null, null, null, 880, 1100, true, 'CA', array['RD']),
      ('Dickinson College', 0.421, 0.439, null, null, null, 1288, 1410, false, 'PA', array['RD','ED']),
      ('CUNY, Queens College', null, null, null, null, null, null, null, true, 'NY', array['RD']),
      ('Bates College', 0.13, 0.418, null, null, null, 1370, 1475, false, 'ME', array['RD','ED']),
      ('Hamilton College', 0.2004, 0.2944, null, null, null, 1460, 1530, false, 'NY', array['RD','ED','ED2']),
      ('Florida International University', 0.5466, null, null, null, null, 1070, 1250, true, 'FL', array['RD']),
      ('Louisiana State University', 0.733, null, null, null, null, 1180, 1320, true, 'LA', array['RD']),
      ('Lafayette College', 0.315, 0.424, null, 3.55, null, 1370, 1490, false, 'PA', array['RD','ED']),
      ('Florida Atlantic University', 0.6619, null, null, null, null, 1040, 1210, true, 'FL', array['RD']),
      ('Harvey Mudd College', 0.1302, 0.1612, null, null, null, 1510, 1560, false, 'CA', array['RD','ED','ED2']),
      ('Reed College', 0.2461, 0.1521, 0.4048, null, null, 1310, 1480, false, 'OR', array['RD','ED','EA']),
      ('Colby College', 0.086, null, null, null, null, null, null, false, 'ME', array['RD','ED','ED2']),
      ('Franklin W. Olin College of Engineering', 0.2166, null, null, null, null, 1500, 1560, false, 'MA', array['RD']),
      ('CUNY, Brooklyn College', 0.543, null, null, null, null, null, null, true, 'NY', array['RD']),
      ('Oberlin College', 0.342, 0.387, null, 3.7, null, 1370, 1500, false, 'OH', array['RD','ED']),
      ('Hobart and William Smith Colleges', 0.64, 0.514658, null, null, null, 1180, 1370, false, 'NY', array['RD','ED','EA']),
      ('Kalamazoo College', null, null, null, null, null, 1200, 1370, false, 'MI', array['RD','ED','EA']),
      ('Kenyon College', 0.31, null, null, null, null, 1370, 1473, false, 'OH', array['RD']),
      ('Elon University', 0.634, null, null, 4.13, null, null, null, false, 'NC', array['RD']),
      ('Scripps College', 0.3829, null, null, null, null, 1450, 1520, false, 'CA', array['RD']),
      ('Manhattan College', 0.78996, 0.98649, null, null, null, 1192, 1345, false, 'NY', array['RD','ED','EA']),
      ('Pomona College', 0.071, null, null, null, null, null, null, false, 'CA', array['RD','ED','ED2']),
      ('Smith College', 0.21, 0.382, null, null, null, 1450, 1520, false, 'MA', array['RD','ED','ED2']),
      ('Macalester College', 0.282, 0.463, null, null, null, 1350, 1480, false, 'MN', array['RD','ED','ED2','EA']),
      ('Sonoma State University', 0.922, null, null, 3.22, null, 490, 590, true, 'CA', array['RD']),
      ('University of Nevada-Reno', 0.887, null, null, 3.445, null, 1070, 1270, true, 'NV', array['RD','EA']),
      ('California State University, Fresno', 0.4715, null, null, 3.7, null, null, null, true, 'CA', array['RD']),
      ('Swarthmore College', 0.0747, 0.1802, null, null, null, 1500, 1550, false, 'PA', array['RD','ED','ED2']),
      ('Carleton College', 0.2, null, null, null, null, null, null, false, 'MN', array['RD','ED2']),
      ('Saint Louis University', 0.701, null, null, 3.95, null, null, null, false, 'MO', array['RD','ED','EA']),
      ('Skidmore College', 0.21, 0.413, null, null, null, 1350, 1450, false, 'NY', array['RD','ED','ED2']),
      ('Creighton University', 0.725, null, null, null, null, 1265, 1430, false, 'NE', array['RD','EA']),
      ('St. Lawrence University', 0.558, null, null, null, null, null, null, false, 'NY', array['RD','ED','EA']),
      ('SUNY, Geneseo', 0.634, null, null, null, null, 1205, 1330, true, 'NY', array['RD','EA']),
      ('Bentley University', null, null, null, null, null, null, null, false, 'MA', array['RD','ED','ED2']),
      ('Saint Mary''s College of California', 0.521, null, null, 3.72, null, null, null, false, 'CA', array['RD','EA']),
      ('Virginia Military Institute', 0.817, 0.403, null, 3.6, null, 1090, 1240, true, 'VA', array['RD','ED']),
      ('University of California - Merced', 0.915, null, null, null, null, null, null, true, 'CA', array['RD']),
      ('San Francisco State University', null, null, null, null, null, null, null, true, 'CA', array['RD']),
      ('University of Dayton', 0.613, null, null, 3.75, null, 1180, 1350, false, 'OH', array['RD','EA']),
      ('University of Georgia', 0.379, null, null, null, null, 1220, 1400, true, 'GA', array['RD','EA']),
      ('University of Central Florida', 0.447, null, null, null, null, 1210, 1340, true, 'FL', array['RD','EA']),
      ('Middlebury College', 0.107, 0.305, null, null, null, 1450, 1530, false, 'VT', array['RD','ED','ED2','EA']),
      ('Davidson College', 0.126, 0.316, null, null, null, 695, 750, false, 'NC', array['RD','ED','ED2']),
      ('University of Texas, Dallas', 0.651, null, null, null, null, 1170, 1390, true, 'TX', array['RD']),
      ('University of Richmond', 0.222, 0.338, 0.23, null, null, 1430, 1510, false, 'VA', array['RD','ED','EA']),
      ('University of Wyoming', 0.9688, null, null, null, null, 1040, 1265, true, 'WY', array['RD']),
      ('University of Illinois at Chicago', 0.7846, null, null, 3.5, null, 1070, 1300, true, 'IL', array['RD','EA']),
      ('Vassar College', 0.186, 0.335, null, 3.9, null, 1450, 1530, false, 'NY', array['RD','ED','ED2']),
      ('Wofford College', 0.6019, null, null, 3.67, null, 1230, 1380, false, 'SC', array['RD','ED','ED2','EA']),
      ('University of Delaware', 0.7417, null, null, 3.84, null, 1135, 1340, true, 'DE', array['RD','EA']),
      ('Towson University', 0.819, null, null, 3.78, null, 950, 1230, true, 'MD', array['RD','EA']),
      ('Washington and Lee University', 0.1398, 0.3387, null, null, null, 1430, 1540, false, 'VA', array['RD','ED']),
      ('James Madison University', 0.689, null, null, null, null, 1180, 1330, true, 'VA', array['RD','EA']),
      ('University of San Francisco', 0.712, null, 0.854, 3.65, null, 1230, 1390, false, 'CA', array['RD','EA']),
      ('Washington State University', 0.866, null, null, null, null, 1010, 1280, true, 'WA', array['RD']),
      ('Cal Poly SLO', 0.288, null, null, 4.04, null, null, null, true, 'CA', array['RD']),
      ('Worcester Polytechnic Institute', 0.601, 0.756, 0.689, null, null, null, null, false, 'MA', array['RD','ED','EA']),
      ('Williams College', 0.0999, 0.2704, null, null, null, 1480, 1550, false, 'MA', array['RD','ED']),
      ('Furman University', 0.526, 0.281, 0.692, 3.66, null, 1280, 1410, false, 'SC', array['RD','ED','EA']),
      ('Wellesley College', 0.121, 0.302, null, null, null, 1460, 1540, false, 'MA', array['RD','ED']),
      ('Rhodes College', 0.503, 0.367, null, 3.7, null, 1352, 1478, false, 'TN', array['RD','ED','EA']),
      ('University of Portland', 0.954, null, null, 3.69, null, 1168, 1370, false, 'OR', array['RD','EA']),
      ('Trinity College (CT)', 0.292, 0.55, null, null, null, 1340, 1453, false, 'CT', array['RD','ED','ED2']),
      ('Temple University', 0.809, null, null, null, null, 1130, 1358, true, 'PA', array['RD','EA']),
      ('University of Arkansas', 0.716, null, 0.806, null, null, 1050, 1220, true, 'AR', array['RD','EA']),
      ('Wesleyan University', 0.16, 0.22, null, null, null, 1310, 1505, false, 'CT', array['RD','ED','ED2']),
      ('Trinity University (TX)', 0.25, null, null, 3.74, null, 1370, 1490, false, 'TX', array['RD','ED','ED2','EA'])
    ) as v(name, admit, ed, ea, gpa_uw, gpa_w, sat_lo, sat_hi, is_pub, st, rounds)
  ) loop
    update public.colleges c
       set acceptance_rate  = coalesce(c.acceptance_rate, r.admit),
           ed_admit_rate    = coalesce(c.ed_admit_rate, r.ed),
           ea_admit_rate    = coalesce(c.ea_admit_rate, r.ea),
           gpa_median_uw    = coalesce(c.gpa_median_uw, r.gpa_uw),
           gpa_median_w     = coalesce(c.gpa_median_w, r.gpa_w),
           sat_range_low    = coalesce(c.sat_range_low, r.sat_lo),
           sat_range_high   = coalesce(c.sat_range_high, r.sat_hi),
           is_public        = coalesce(c.is_public, r.is_pub),
           state            = coalesce(c.state, r.st),
           available_rounds = case
             when c.available_rounds is null or c.available_rounds = array['RD']::text[]
             then r.rounds
             else c.available_rounds
           end
     where c.name = r.name;
  end loop;
end$$;
