-- Vantage classifier migration BATCH 3
-- Corrected & expanded admissions data for ~80 colleges (2024-2025 cycle)
-- Fixes inaccuracies from batch 2 and fills missing fields.
-- Idempotent: OVERWRITES existing values (unlike batches 1-2 which used coalesce).
-- This is intentional — batch 3 is a correction pass with more accurate data.
-- Run after supabase-classifier-migration-batch2.sql

-- =============================================================================
-- PART 1: Corrected data for all schools (overwrites existing values)
-- =============================================================================

do $$
declare
  r record;
begin
  for r in (
    select * from (values
      -- (name, acceptance_rate, ed_admit_rate, ea_admit_rate, gpa_median_uw, gpa_median_w, sat_lo, sat_hi, is_public, state, rounds, program_rate, program_majors)

      -- 1. Caltech — REA school, ~2.5-3% overall, REA ~6%. Class of 2029 data.
      ('California Institute of Technology',
        0.027, null, 0.06, 4.00, null, 1530, 1580, false, 'CA',
        array['RD','REA'], null, null),

      -- 2. Pepperdine — no ED/EA binding, offers EA. ~50% acceptance rate (inclusive of Seaver College).
      ('Pepperdine University',
        0.49, null, 0.55, 3.75, 4.1, 1270, 1430, false, 'CA',
        array['RD','EA'], null, null),

      -- 3. Tulane — ED1, ED2, EA. Very strategic yield management. ~10-13% RD, ~30% ED.
      ('Tulane University',
        0.13, 0.30, 0.24, 3.60, 4.1, 1400, 1510, false, 'LA',
        array['RD','ED','ED2','EA'], null, null),

      -- 4. Rutgers — Large public, rolling EA. ~66% overall.
      ('Rutgers University—New Brunswick',
        0.66, null, 0.66, 3.70, 4.1, 1250, 1450, true, 'NJ',
        array['RD','EA'], null, null),

      -- 5. UMD College Park — EA available, competitive. ~45% overall, EA similar.
      ('University of Maryland, College Park',
        0.44, null, 0.44, 4.25, 4.5, 1360, 1510, true, 'MD',
        array['RD','EA'], null, null),

      -- 6. Texas A&M — Rolling admissions, no ED/EA distinction. ~63% overall.
      ('Texas A&M University',
        0.63, null, null, 3.68, 4.1, 1160, 1380, true, 'TX',
        array['RD'], null, null),

      -- 7. Ohio State — EA available. ~53% overall.
      ('Ohio State University',
        0.53, null, 0.53, 3.80, 4.2, 1290, 1440, true, 'OH',
        array['RD','EA'], null, null),

      -- 8. Fordham — ED1, ED2, EA. ~55% overall.
      ('Fordham University',
        0.55, 0.72, 0.60, 3.70, 4.1, 1330, 1470, false, 'NY',
        array['RD','ED','ED2','EA'], null, null),

      -- 9. SMU — ED1, ED2, EA. ~52% overall.
      ('Southern Methodist University',
        0.52, 0.72, 0.58, 3.70, 4.1, 1330, 1470, false, 'TX',
        array['RD','ED','ED2','EA'], null, null),

      -- 10. Syracuse — ED1, ED2. ~44% overall.
      ('Syracuse University',
        0.44, 0.68, null, 3.60, 4.0, 1230, 1400, false, 'NY',
        array['RD','ED','ED2'], null, null),

      -- 11. Pittsburgh — EA available in rolling. ~57% overall.
      ('University of Pittsburgh',
        0.57, null, 0.62, 3.75, 4.2, 1270, 1440, true, 'PA',
        array['RD','EA'], null, null),

      -- 12. Clemson — EA available. ~43% overall.
      ('Clemson University',
        0.43, null, 0.48, 3.90, 4.3, 1260, 1400, true, 'SC',
        array['RD','EA'], null, null),

      -- 13. Virginia Tech — EA available. ~57% overall.
      ('Virginia Tech',
        0.57, null, 0.57, 4.05, 4.3, 1250, 1420, true, 'VA',
        array['RD','EA'], null, null),

      -- 14. Minnesota Twin Cities — EA available. ~75% overall.
      ('University of Minnesota Twin Cities',
        0.75, null, 0.75, 3.80, 4.1, 1310, 1470, true, 'MN',
        array['RD','EA'], null, null),

      -- 15. Michigan State — EA (rolling). ~88% overall.
      ('Michigan State University',
        0.88, null, 0.88, 3.70, 4.0, 1100, 1310, true, 'MI',
        array['RD','EA'], null, null),

      -- 16. Baylor — ED, EA available. ~55% overall.
      ('Baylor University',
        0.55, 0.75, 0.62, 3.65, 4.1, 1200, 1370, false, 'TX',
        array['RD','ED','EA'], null, null),

      -- 17. Colorado School of Mines — EA available. ~54% overall.
      ('Colorado School of Mines',
        0.54, null, 0.60, 3.85, 4.3, 1310, 1470, true, 'CO',
        array['RD','EA'], null, null),

      -- 18. Marquette — EA available. ~82% overall.
      ('Marquette University',
        0.82, null, 0.85, 3.65, 4.0, 1200, 1350, false, 'WI',
        array['RD','EA'], null, null),

      -- 19. Iowa — No ED/EA distinction in traditional sense. ~84% overall.
      ('University of Iowa',
        0.84, null, null, 3.75, 4.0, 1120, 1330, true, 'IA',
        array['RD'], null, null),

      -- 20. NC State — EA available. ~47% overall.
      ('North Carolina State University',
        0.47, null, 0.47, 4.30, 4.5, 1280, 1430, true, 'NC',
        array['RD','EA'], null, null),

      -- 21. Denver — ED, EA. ~85% (has gotten less selective).
      ('University of Denver',
        0.73, 0.80, 0.78, 3.68, 4.0, 1180, 1370, false, 'CO',
        array['RD','ED','EA'], null, null),

      -- 22. Stony Brook — No traditional ED/EA. ~49% overall.
      ('Stony Brook University',
        0.49, null, null, 3.80, 4.1, 1310, 1460, true, 'NY',
        array['RD'], null, null),

      -- 23. UConn — EA available. ~56% overall.
      ('University of Connecticut',
        0.56, null, 0.56, 3.80, 4.2, 1250, 1410, true, 'CT',
        array['RD','EA'], null, null),

      -- 24. UMass Amherst — EA available. ~58% overall.
      ('University of Massachusetts Amherst',
        0.58, null, 0.58, 3.95, 4.3, 1290, 1440, true, 'MA',
        array['RD','EA'], null, null),

      -- 25. USD (San Diego) — private, no binding ED. ~54% overall.
      ('University of San Diego',
        0.54, null, 0.58, 3.90, 4.2, 1220, 1380, false, 'CA',
        array['RD','EA'], null, null),

      -- 26. American University — ED1, ED2, EA. ~41% overall.
      ('American University',
        0.41, 0.72, 0.50, 3.60, 4.0, 1270, 1410, false, 'DC',
        array['RD','ED','ED2','EA'], null, null),

      -- 27. Clark University — ED1, ED2, EA. ~65% overall.
      ('Clark University',
        0.65, 0.78, 0.70, 3.55, 3.9, 1220, 1380, false, 'MA',
        array['RD','ED','ED2','EA'], null, null),

      -- 28. Drexel — ED, EA. ~78% overall.
      ('Drexel University',
        0.78, 0.88, 0.80, 3.60, 4.0, 1200, 1380, false, 'PA',
        array['RD','ED','EA'], null, null),

      -- 29. Florida State — EA available (priority deadline). ~25% overall (has gotten more selective).
      ('Florida State University',
        0.25, null, 0.30, 4.20, 4.5, 1280, 1400, true, 'FL',
        array['RD','EA'], null, null),

      -- 30. Howard — ED, EA. ~39% overall.
      ('Howard University',
        0.39, 0.55, 0.45, 3.60, 4.0, 1100, 1280, false, 'DC',
        array['RD','ED','EA'], null, null),

      -- 31. Illinois Institute of Technology — ED, EA. ~68% overall.
      ('Illinois Institute of Technology',
        0.68, 0.80, 0.72, 3.80, 4.1, 1220, 1420, false, 'IL',
        array['RD','ED','EA'], null, null),

      -- 32. Loyola Marymount — ED1, ED2, EA. ~47% overall.
      ('Loyola Marymount University',
        0.47, 0.70, 0.55, 3.80, 4.2, 1260, 1400, false, 'CA',
        array['RD','ED','ED2','EA'], null, null),

      -- 33. Miami University Oxford — ED, EA. ~72% overall.
      ('Miami University—Oxford',
        0.72, 0.82, 0.75, 3.70, 4.1, 1210, 1380, true, 'OH',
        array['RD','ED','EA'], null, null),

      -- 34. NJIT — public, no ED. ~68% overall.
      ('New Jersey Institute of Technology',
        0.68, null, null, 3.60, 4.0, 1200, 1400, true, 'NJ',
        array['RD'], null, null),

      -- 35. RPI — ED1, ED2. ~62% overall.
      ('Rensselaer Polytechnic Institute',
        0.62, 0.71, null, 3.80, 4.2, 1370, 1500, false, 'NY',
        array['RD','ED','ED2'], null, null),

      -- 36. Stevens Institute — ED1, ED2, EA. ~50% overall.
      ('Stevens Institute of Technology',
        0.50, 0.68, 0.55, 3.80, 4.2, 1360, 1490, false, 'NJ',
        array['RD','ED','ED2','EA'], null, null),

      -- 37. Alabama — Rolling, no ED/EA. ~80% overall.
      ('University of Alabama',
        0.80, null, null, 3.60, 4.0, 1120, 1350, true, 'AL',
        array['RD'], null, null),

      -- 38. Arizona — Rolling. ~87% overall.
      ('University of Arizona',
        0.87, null, null, 3.45, 3.8, 1120, 1340, true, 'AZ',
        array['RD','EA'], null, null),

      -- 39. UCSB — UC system, no ED/EA. ~26% overall.
      ('University of California, Santa Barbara',
        0.26, null, null, 4.15, 4.4, 1280, 1470, true, 'CA',
        array['RD'], null, null),

      -- 40. CU Boulder — EA available. ~80% overall.
      ('University of Colorado Boulder',
        0.80, null, 0.80, 3.60, 4.0, 1180, 1380, true, 'CO',
        array['RD','EA'], null, null),

      -- 41. Utah — Rolling. ~82% overall.
      ('University of Utah',
        0.82, null, null, 3.60, 3.9, 1140, 1360, true, 'UT',
        array['RD','EA'], null, null),

      -- 42. UW (Washington) — No ED/EA. ~43% overall (highly selective for CS/Engineering).
      ('University of Washington',
        0.43, null, null, 3.80, 4.0, 1280, 1470, true, 'WA',
        array['RD'], null, null),

      -- 43. BYU — No ED/EA. ~67% overall.
      ('Brigham Young University—Provo',
        0.67, null, null, 3.85, 4.1, 1270, 1440, false, 'UT',
        array['RD'], null, null),

      -- 44. Gonzaga — EA available. ~72% overall.
      ('Gonzaga University',
        0.72, null, 0.75, 3.72, 4.0, 1200, 1380, false, 'WA',
        array['RD','EA'], null, null),

      -- 45. Santa Clara — ED1, ED2, EA. ~49% overall.
      ('Santa Clara University',
        0.49, 0.72, 0.55, 3.70, 4.1, 1330, 1470, false, 'CA',
        array['RD','ED','ED2','EA'], null, null),

      -- 46. Pacific — EA. ~75% overall.
      ('University of the Pacific',
        0.75, null, 0.78, 3.55, 3.9, 1150, 1350, false, 'CA',
        array['RD','EA'], null, null),

      -- 47. TCU — EA. ~48% overall.
      ('Texas Christian University',
        0.48, null, 0.54, 3.65, 4.1, 1210, 1380, false, 'TX',
        array['RD','EA'], null, null),

      -- 48. Oklahoma — Rolling. ~83% overall.
      ('University of Oklahoma',
        0.83, null, 0.83, 3.55, 3.9, 1130, 1310, true, 'OK',
        array['RD','EA'], null, null),

      -- 49. Oregon — EA. ~82% overall.
      ('University of Oregon',
        0.82, null, 0.85, 3.55, 3.8, 1130, 1320, true, 'OR',
        array['RD','EA'], null, null),

      -- 50. South Carolina — EA. ~64% overall.
      ('University of South Carolina',
        0.64, null, 0.68, 3.70, 4.1, 1190, 1360, true, 'SC',
        array['RD','EA'], null, null),

      -- 51. Auburn — EA. ~71% overall.
      ('Auburn University',
        0.71, null, 0.73, 3.80, 4.1, 1200, 1360, true, 'AL',
        array['RD','EA'], null, null),

      -- 52. Tennessee — EA. ~72% overall.
      ('University of Tennessee, Knoxville',
        0.72, null, 0.72, 3.90, 4.2, 1200, 1370, true, 'TN',
        array['RD','EA'], null, null),

      -- 53. Kansas — Rolling. ~91% overall.
      ('University of Kansas',
        0.91, null, null, 3.55, 3.8, 1080, 1280, true, 'KS',
        array['RD'], null, null),

      -- 54. Kentucky — EA. ~96% overall.
      ('University of Kentucky',
        0.96, null, 0.96, 3.55, 3.8, 1070, 1280, true, 'KY',
        array['RD','EA'], null, null),

      -- 55. Nebraska — Rolling. ~80% overall.
      ('University of Nebraska—Lincoln',
        0.80, null, null, 3.55, 3.8, 1100, 1310, true, 'NE',
        array['RD'], null, null),

      -- 56. New Mexico — Rolling. ~96% overall.
      ('University of New Mexico',
        0.96, null, null, 3.30, 3.6, 960, 1200, true, 'NM',
        array['RD'], null, null),

      -- 57. Hawaii — Rolling. ~83% overall.
      ('University of Hawaii at Manoa',
        0.83, null, null, 3.50, 3.8, 1080, 1280, true, 'HI',
        array['RD'], null, null),

      -- 58. Binghamton — EA. ~41% overall.
      ('Binghamton University',
        0.41, null, 0.48, 3.80, 4.2, 1350, 1480, true, 'NY',
        array['RD','EA'], null, null),

      -- 59. Buffalo — Rolling. ~73% overall.
      ('University at Buffalo',
        0.73, null, null, 3.60, 3.9, 1180, 1350, true, 'NY',
        array['RD'], null, null),

      -- 60. Cincinnati — EA. ~78% overall.
      ('University of Cincinnati',
        0.78, null, 0.80, 3.60, 3.9, 1140, 1330, true, 'OH',
        array['RD','EA'], null, null),

      -- 61. Houston — No ED/EA. ~77% overall.
      ('University of Houston',
        0.77, null, null, 3.50, 3.8, 1120, 1310, true, 'TX',
        array['RD'], null, null),

      -- 62. South Florida — No traditional ED/EA. ~48% overall.
      ('University of South Florida',
        0.48, null, null, 4.10, 4.3, 1230, 1370, true, 'FL',
        array['RD'], null, null),

      -- 63. ASU — Rolling. ~90% overall.
      ('Arizona State University—Tempe',
        0.90, null, null, 3.50, 3.8, 1110, 1330, true, 'AZ',
        array['RD'], null, null),

      -- 64. Oregon State — EA. ~82% overall.
      ('Oregon State University',
        0.82, null, 0.85, 3.55, 3.8, 1120, 1320, true, 'OR',
        array['RD','EA'], null, null),

      -- 65. SDSU — impacted, no ED/EA. ~38% overall.
      ('San Diego State University',
        0.38, null, null, 3.85, 4.1, 1170, 1350, true, 'CA',
        array['RD'], null, null),

      -- 66. UC Riverside — UC system. ~66% overall.
      ('University of California, Riverside',
        0.66, null, null, 3.70, 4.0, 1100, 1310, true, 'CA',
        array['RD'], null, null),

      -- 67. UC Santa Cruz — UC system. ~47% overall.
      ('University of California, Santa Cruz',
        0.47, null, null, 3.80, 4.1, 1170, 1380, true, 'CA',
        array['RD'], null, null),

      -- 68. Missouri — Rolling. ~82% overall.
      ('University of Missouri',
        0.82, null, null, 3.55, 3.8, 1100, 1310, true, 'MO',
        array['RD'], null, null),

      -- 69. Iowa State — Rolling. ~91% overall.
      ('Iowa State University',
        0.91, null, null, 3.55, 3.8, 1100, 1320, true, 'IA',
        array['RD'], null, null),

      -- 70. Kansas State — Rolling. ~94% overall.
      ('Kansas State University',
        0.94, null, null, 3.45, 3.7, 1030, 1250, true, 'KS',
        array['RD'], null, null),

      -- 71. Oklahoma State — Rolling. ~74% overall.
      ('Oklahoma State University',
        0.74, null, null, 3.55, 3.8, 1070, 1270, true, 'OK',
        array['RD'], null, null),

      -- 72. Vermont — ED, EA. ~72% overall.
      ('University of Vermont',
        0.72, 0.85, 0.75, 3.55, 3.9, 1210, 1370, true, 'VT',
        array['RD','ED','EA'], null, null),

      -- 73. Wayne State — Rolling. ~78% overall.
      ('Wayne State University',
        0.78, null, null, 3.35, 3.6, 1020, 1250, true, 'MI',
        array['RD'], null, null),

      -- 74. William & Mary — ED. ~34% overall.
      ('College of William & Mary',
        0.34, 0.55, null, 4.10, 4.5, 1370, 1510, true, 'VA',
        array['RD','ED','ED2'], null, null),

      -- 75. UC Davis — UC system. ~37% overall.
      ('University of California, Davis',
        0.37, null, null, 4.00, 4.3, 1200, 1420, true, 'CA',
        array['RD'], null, null),

      -- 76. UC Irvine — UC system. ~21% overall (has gotten very selective).
      ('University of California, Irvine',
        0.21, null, null, 4.05, 4.3, 1250, 1450, true, 'CA',
        array['RD'], null, null),

      -- 77. UC San Diego — UC system. ~24% overall.
      ('University of California, San Diego',
        0.24, null, null, 4.10, 4.4, 1330, 1500, true, 'CA',
        array['RD'], null, null),

      -- 78. University of Rochester — ED1, ED2. ~40% overall.
      ('University of Rochester',
        0.40, 0.50, null, 3.75, 4.1, 1370, 1510, false, 'NY',
        array['RD','ED','ED2'], null, null),

      -- 79. William & Mary duplicate handling (alternate name)
      ('William & Mary',
        0.34, 0.55, null, 4.10, 4.5, 1370, 1510, true, 'VA',
        array['RD','ED','ED2'], null, null),

      -- 80. University of Miami (FL) — ED1, ED2, EA. ~19% overall.
      ('University of Miami',
        0.19, 0.35, 0.25, 3.75, 4.2, 1340, 1470, false, 'FL',
        array['RD','ED','ED2','EA'], null, null)

    ) as t(name, admit, ed, ea, gpa_uw, gpa_w, sat_lo, sat_hi, is_pub, st, rounds, prog_rate, prog_majors)
  ) loop
    update public.colleges c
       set acceptance_rate         = r.admit,
           ed_admit_rate           = r.ed,
           ea_admit_rate           = r.ea,
           gpa_median_uw           = r.gpa_uw,
           gpa_median_w            = r.gpa_w,
           sat_range_low           = r.sat_lo,
           sat_range_high          = r.sat_hi,
           is_public               = r.is_pub,
           state                   = r.st,
           available_rounds        = r.rounds,
           program_admit_rate      = r.prog_rate::numeric,
           program_override_majors = r.prog_majors::text[]
     where lower(c.name) = lower(r.name);
  end loop;
end$$;

-- =============================================================================
-- PART 2: Program-specific admit rates for competitive programs
-- These update EXISTING rows from batch 1 with program-level data.
-- =============================================================================

-- Georgia Tech: CS admit rate ~8% vs ~16% overall
update public.colleges
   set program_admit_rate = 0.08,
       program_override_majors = array['Computer Science']
 where lower(name) = lower('Georgia Institute of Technology');

-- UC Berkeley: EECS direct admit ~4% vs ~11.5% overall L&S
update public.colleges
   set program_admit_rate = 0.04,
       program_override_majors = array['Computer Science', 'Engineering']
 where lower(name) = lower('University of California, Berkeley');

-- Cornell: A&S ~5%, Engineering ~9%, overall ~7.5%. CS students can apply to either college.
-- The overall rate (7.5%) is already a reasonable middle ground; no override needed since
-- Engineering is LESS selective than overall and A&S is more selective but doesn't map
-- cleanly to a single major. Skipping program override for Cornell.

-- Northwestern: McCormick Engineering ~7% vs overall ~7%. These are similar.
-- Medill ~10% (less selective than overall). No meaningful program override needed.
-- We'll skip NW program override since rates are similar to overall.

-- Rice: Engineering slightly more competitive. Overall 7.7%, engineering ~7%.
-- Very close to overall, so no meaningful override needed.

-- UW (Washington): CS is extremely selective ~5% vs 43% overall
update public.colleges
   set program_admit_rate = 0.05,
       program_override_majors = array['Computer Science']
 where lower(name) = lower('University of Washington');

-- UIUC: CS rate about 5-6% vs 45% overall (already in batch 1 at 15% - correcting)
update public.colleges
   set program_admit_rate = 0.06,
       program_override_majors = array['Computer Science']
 where lower(name) = lower('University of Illinois Urbana-Champaign');

-- Purdue: CS/Engineering direct admit ~20% vs 50% overall
update public.colleges
   set program_admit_rate = 0.20,
       program_override_majors = array['Computer Science', 'Engineering']
 where lower(name) = lower('Purdue University');

-- Georgia Tech additional name variant
update public.colleges
   set program_admit_rate = 0.08,
       program_override_majors = array['Computer Science']
 where lower(name) like '%georgia%tech%'
   and program_admit_rate is null;

-- =============================================================================
-- PART 3: Fix batch 2 SAT data errors
-- University of Missouri had SAT scores of 580-670 (those are ACT composite-ish)
-- Correcting to proper SAT range
-- =============================================================================

update public.colleges
   set sat_range_low = 1100,
       sat_range_high = 1310
 where lower(name) = lower('University of Missouri')
   and sat_range_low < 800;
