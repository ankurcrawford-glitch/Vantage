// Vantage classifier — Safety / Likely / Target / Reach / Hard Reach
// ----------------------------------------------------------------------
// Pure logic — no DB or React. Consumed by the colleges page and ED panel.
//
// Schema notes (tables this expects to exist after running
// supabase-classifier-migration.sql):
//   - colleges: acceptance_rate, ed_admit_rate, ea_admit_rate, gpa_median_uw,
//               gpa_median_w, sat_range_low, sat_range_high, is_public,
//               state, available_rounds[], program_admit_rate,
//               program_override_majors[]
//   - user_stats: gpa_unweighted, gpa_weighted, sat_score, act_score, state,
//                 intended_major, ap_count, test_optional, hook_*
//
// If a college row is missing classifier fields (ed_admit_rate / gpa_median_uw)
// the classifier degrades gracefully — falls back on acceptance_rate-only logic.

export type Tier = 'Safety' | 'Likely' | 'Target' | 'Reach' | 'Hard Reach';
export type ApplicationRound = 'RD' | 'EA' | 'ED' | 'ED2' | 'REA';

export const TIERS: Tier[] = ['Safety', 'Likely', 'Target', 'Reach', 'Hard Reach'];

const TIER_INDEX: Record<Tier, number> = {
  Safety: 0,
  Likely: 1,
  Target: 2,
  Reach: 3,
  'Hard Reach': 4,
};

export const MAJORS = [
  'Computer Science',
  'Engineering',
  'Business',
  'Liberal Arts',
  'Pre-Med',
  'Undecided',
] as const;
export type Major = (typeof MAJORS)[number];

/**
 * Shape that mirrors the colleges row in Supabase. All classifier-relevant
 * fields are optional so a partially-seeded row still works.
 */
export interface College {
  id: string;
  name: string;
  location: string;
  state?: string | null;
  is_public?: boolean | null;
  acceptance_rate?: number | null; // 0..1
  ed_admit_rate?: number | null; // 0..1, null = no ED program
  ea_admit_rate?: number | null;
  sat_range_low?: number | null;
  sat_range_high?: number | null;
  gpa_median_uw?: number | null;
  gpa_median_w?: number | null;
  test_optional?: boolean | null;
  available_rounds?: string[] | null; // e.g. ['RD','ED']
  program_admit_rate?: number | null;
  program_override_majors?: string[] | null;
}

/**
 * Profile shape used by the classifier. Built from user_stats in the
 * colleges page; not stored as a separate table.
 */
export type GeoPreference = 'in-state' | 'regional' | 'no-preference' | 'out-of-state';

export interface StudentProfile {
  unweightedGpa: number;
  weightedGpa?: number;
  sat?: number;
  act?: number;
  testOptional: boolean;
  apCount: number;
  state: string;
  major: Major;
  geoPreference?: GeoPreference;
  hooks: {
    legacy: { active: boolean; collegeIds: string[] };
    recruitedAthlete: boolean;
    firstGen: boolean;
    urm: boolean;
    lowIncome: boolean;
  };
}

export interface SchoolClassification {
  college: College;
  bucket: Tier;
  rawBucket: Tier;
  ceiling: Tier;
  score: number;
  componentScores: { gpa: number; test: number; rigor: number };
  effectiveAdmitRate: number;
  appliedAdjustments: string[];
  probabilityRange: string;
  whyThisBucket: string;
  whatWouldMoveIt: string[];
  programOverrideTriggered: boolean;
}

/* ------------------------------ helpers ------------------------------ */

const ACT_TO_SAT: Record<number, number> = {
  36: 1580, 35: 1550, 34: 1510, 33: 1470, 32: 1440, 31: 1410, 30: 1370,
  29: 1340, 28: 1310, 27: 1280, 26: 1240, 25: 1210, 24: 1180, 23: 1140,
  22: 1110, 21: 1080,
};

function actToSat(act: number): number {
  const r = Math.round(act);
  if (ACT_TO_SAT[r] != null) return ACT_TO_SAT[r];
  if (r > 36) return 1580;
  return Math.max(900, 760 + r * 23);
}

function effectiveSat(p: StudentProfile): number | undefined {
  if (p.sat && p.sat > 0) return p.sat;
  if (p.act && p.act > 0) return actToSat(p.act);
  return undefined;
}

function expectedRigor(admitRate: number): number {
  if (admitRate < 0.1) return 8;
  if (admitRate < 0.25) return 6;
  if (admitRate < 0.5) return 4;
  return 3;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}
function lerp(x: number, x0: number, x1: number, y0: number, y1: number) {
  if (x1 === x0) return y0;
  return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
}

function gpaPoints(gpa: number, gpa50: number): number {
  if (gpa >= gpa50 + 0.05) return 50;
  if (gpa >= gpa50) return clamp(lerp(gpa, gpa50, gpa50 + 0.05, 42, 50), 42, 50);
  if (gpa >= gpa50 - 0.4) return clamp(lerp(gpa, gpa50 - 0.4, gpa50, 10, 30), 10, 30);
  if (gpa >= gpa50 - 0.6) return clamp(lerp(gpa, gpa50 - 0.6, gpa50 - 0.4, 0, 10), 0, 10);
  return 0;
}

function testPoints(sat: number, sat25: number, sat75: number): number {
  const mid = (sat25 + sat75) / 2;
  if (sat >= sat75) return 30;
  if (sat >= mid) return clamp(lerp(sat, mid, sat75, 18, 30), 18, 30);
  if (sat >= sat25) return clamp(lerp(sat, sat25, mid, 6, 18), 6, 18);
  if (sat >= sat25 - 100) return clamp(lerp(sat, sat25 - 100, sat25, 0, 6), 0, 6);
  return 0;
}

function rigorPoints(apCount: number, expected: number): number {
  if (apCount >= expected) return 20;
  return clamp((apCount / expected) * 20, 0, 20);
}

function bumpUp(t: Tier, levels = 1, cap?: Tier): Tier {
  let idx = Math.max(0, TIER_INDEX[t] - levels);
  if (cap) idx = Math.max(idx, TIER_INDEX[cap]);
  return TIERS[idx];
}
function bumpDown(t: Tier, levels = 1): Tier {
  return TIERS[Math.min(TIERS.length - 1, TIER_INDEX[t] + levels)];
}
function moreSelective(a: Tier, b: Tier): Tier {
  return TIER_INDEX[a] >= TIER_INDEX[b] ? a : b;
}

function probabilityRange(t: Tier): string {
  switch (t) {
    case 'Safety': return '75–90%';
    case 'Likely': return '55–75%';
    case 'Target': return '30–50%';
    case 'Reach': return '10–25%';
    case 'Hard Reach': return '3–10%';
  }
}

function scoreToBucket(score: number): Tier {
  if (score >= 85) return 'Safety';
  if (score >= 70) return 'Likely';
  if (score >= 55) return 'Target';
  if (score >= 35) return 'Reach';
  return 'Hard Reach';
}

function ceilingFromAdmitRate(admit: number, score: number): Tier {
  if (admit < 0.08) return 'Hard Reach';
  if (admit < 0.2) return 'Reach';
  if (admit < 0.4) return score < 50 ? 'Reach' : 'Target';
  if (admit < 0.65) return score >= 80 ? 'Safety' : 'Target';
  return score < 70 ? 'Likely' : 'Safety';
}

/* ------------------------------ reasoning text ------------------------------ */

function shortName(name: string): string {
  return name.split(' — ')[0].split(' - ')[0];
}

function buildWhyText(args: {
  college: College;
  effectiveAdmit: number;
  bucket: Tier;
  studentSat?: number;
  studentGpa: number;
  testOptional: boolean;
  programOverrideTriggered: boolean;
  appliedAdjustments: string[];
  sat25?: number;
  sat75?: number;
  gpa50?: number;
}): string {
  const { college, effectiveAdmit, bucket, studentSat, studentGpa,
          testOptional, programOverrideTriggered, appliedAdjustments,
          sat25, sat75, gpa50 } = args;
  const parts: string[] = [];
  const admitPct = (effectiveAdmit * 100).toFixed(0);
  const sName = shortName(college.name);

  if (!testOptional && studentSat && sat25 && sat75) {
    if (studentSat >= sat75) {
      parts.push(`Your ${studentSat} SAT sits at or above ${sName}'s 75th percentile (${sat75}).`);
    } else if (studentSat >= (sat25 + sat75) / 2) {
      parts.push(`Your ${studentSat} SAT lands near ${sName}'s 50th percentile (${sat25}–${sat75}) — competitive but not differentiating.`);
    } else if (studentSat >= sat25) {
      parts.push(`Your ${studentSat} SAT is in the bottom half of ${sName}'s admitted range (${sat25}–${sat75}).`);
    } else {
      parts.push(`Your ${studentSat} SAT is below ${sName}'s 25th percentile (${sat25}).`);
    }
  } else if (testOptional) {
    parts.push(`Without test scores, your application leans entirely on GPA, rigor, and qualitative materials.`);
  }

  if (gpa50 != null) {
    if (studentGpa >= gpa50) {
      parts.push(`Your ${studentGpa.toFixed(2)} GPA is at or above their typical admit (${gpa50}).`);
    } else if (studentGpa >= gpa50 - 0.2) {
      parts.push(`Your ${studentGpa.toFixed(2)} GPA is just below the ${gpa50} typical admit.`);
    } else {
      parts.push(`Your ${studentGpa.toFixed(2)} GPA is well below the ${gpa50} typical admit — a meaningful gap.`);
    }
  }

  if (effectiveAdmit < 0.08) {
    parts.push(`But more importantly, a ${admitPct}% admit rate means even perfect-stat applicants face a ${(100 - effectiveAdmit * 100).toFixed(0)}%+ rejection rate. This is a Hard Reach for everyone.`);
  } else if (effectiveAdmit < 0.2) {
    parts.push(`With a ${admitPct}% admit rate, the math is stacked against any applicant — strong stats are necessary but not sufficient.`);
  } else if (effectiveAdmit < 0.4) {
    parts.push(`A ${admitPct}% admit rate leaves room for strong applicants, but selectivity still drives outcomes.`);
  } else if (effectiveAdmit < 0.65) {
    parts.push(`A ${admitPct}% admit rate gives strong applicants reasonable odds.`);
  } else {
    parts.push(`A ${admitPct}% admit rate makes this an accessible target for your profile.`);
  }

  if (programOverrideTriggered) {
    parts.push(`Your intended program is a separate, more selective admit pool here — the headline university rate isn't the right number.`);
  }
  if (appliedAdjustments.length > 0) {
    parts.push(`Net classification after adjustments: ${bucket}.`);
  }
  return parts.join(' ');
}

function buildWhatWouldMoveIt(args: {
  college: College;
  studentSat?: number;
  testOptional: boolean;
  studentGpa: number;
  appliedHooksLength: number;
  programOverrideTriggered: boolean;
  hasEdAvailable: boolean;
  isInState: boolean;
  isPublic: boolean;
  sat25?: number;
  sat75?: number;
  gpa50?: number;
}): string[] {
  const tips: string[] = [];
  const c = args.college;
  if (!args.testOptional && args.studentSat && args.sat75 && args.studentSat < args.sat75) {
    tips.push(`A ${args.sat75}+ SAT would put you at the 75th percentile and lift your testing component to maximum.`);
  }
  if (args.gpa50 != null && args.studentGpa < args.gpa50) {
    tips.push(`Lifting your unweighted GPA closer to ${args.gpa50.toFixed(2)} (the 50th percentile admit) would close the academic gap.`);
  }
  if (args.hasEdAvailable && c.ed_admit_rate && c.acceptance_rate) {
    tips.push(`Applying ED here roughly ${(c.ed_admit_rate / c.acceptance_rate).toFixed(1)}× your odds (${(c.ed_admit_rate * 100).toFixed(0)}% ED vs ${(c.acceptance_rate * 100).toFixed(0)}% RD).`);
  }
  if (args.appliedHooksLength === 0 && (c.acceptance_rate ?? 1) < 0.2) {
    tips.push(`A meaningful institutional hook (recruited athlete, legacy, development) would shift this materially.`);
  }
  if (args.isPublic && !args.isInState && (c.acceptance_rate ?? 1) < 0.5) {
    tips.push(`In-state residency (or a strong tie to the state) would meaningfully improve odds at this public flagship.`);
  }
  if (args.programOverrideTriggered) {
    tips.push(`Applying to a less competitive major and switching internally is a known back-door strategy — but not guaranteed at every school.`);
  }
  if (tips.length === 0) {
    tips.push('Continue strengthening qualitative materials: essays, recommendations, and a coherent narrative around your major.');
  }
  return tips;
}

function activeHookList(p: StudentProfile, collegeId?: string): string[] {
  const out: string[] = [];
  const legacyAppliesHere =
    p.hooks.legacy.active &&
    !!collegeId &&
    p.hooks.legacy.collegeIds.includes(collegeId);
  if (legacyAppliesHere) out.push('legacy');
  if (p.hooks.recruitedAthlete) out.push('recruited athlete');
  if (p.hooks.firstGen) out.push('first-gen');
  if (p.hooks.urm) out.push('URM');
  if (p.hooks.lowIncome) out.push('Pell-eligible');
  return out;
}

/* ------------------------------ main classify ------------------------------ */

export function classify(
  college: College,
  profile: StudentProfile,
  applicationRound: ApplicationRound = 'RD'
): SchoolClassification {
  const adjustments: string[] = [];

  // Effective admit rate (program override first if applicable)
  let effectiveAdmit = college.acceptance_rate ?? 0.5;
  let programOverrideTriggered = false;
  if (
    college.program_admit_rate &&
    college.program_override_majors &&
    college.program_override_majors.includes(profile.major)
  ) {
    effectiveAdmit = college.program_admit_rate;
    programOverrideTriggered = true;
    adjustments.push(`${profile.major} program-specific admit rate ${(effectiveAdmit * 100).toFixed(0)}% applied`);
  }

  // 1. Academic match
  const sat = effectiveSat(profile);
  const expRigor = expectedRigor(effectiveAdmit);
  const rigor = rigorPoints(profile.apCount, expRigor);

  const gpa50 = college.gpa_median_uw ?? 3.6;
  const sat25 = college.sat_range_low ?? 1200;
  const sat75 = college.sat_range_high ?? 1500;

  const gpa = gpaPoints(profile.unweightedGpa, gpa50);
  let test = 0;
  let score = 0;

  if (profile.testOptional || !sat) {
    const gpaScaled = (gpa / 50) * 70;
    const rigorScaled = (rigor / 20) * 30;
    score = gpaScaled + rigorScaled;
    if (profile.testOptional) adjustments.push('Test-optional weighting (GPA 70%, rigor 30%)');
  } else {
    test = testPoints(sat, sat25, sat75);
    score = gpa + test + rigor;
  }

  // First-gen / URM holistic bump (small score boost in highly selective contexts)
  if ((profile.hooks.firstGen || profile.hooks.urm) && effectiveAdmit < 0.4) {
    score += 5;
    const tag = [profile.hooks.firstGen && 'first-gen', profile.hooks.urm && 'URM']
      .filter(Boolean).join('/');
    adjustments.push(`+5 holistic score (${tag} at selective school)`);
  }

  score = clamp(score, 0, 100);

  // 2. Map score → bucket; apply ceiling
  const rawBucket = scoreToBucket(score);
  const ceiling = ceilingFromAdmitRate(effectiveAdmit, score);
  let bucket: Tier = moreSelective(rawBucket, ceiling);

  // 3. Hook adjustments
  const rounds = college.available_rounds ?? ['RD'];

  if (profile.hooks.recruitedAthlete && effectiveAdmit >= 0.05) {
    bucket = 'Likely';
    adjustments.push('Recruited athlete sets bucket to Likely');
  }
  const legacyAppliesHere =
    profile.hooks.legacy.active &&
    profile.hooks.legacy.collegeIds.includes(college.id) &&
    (college.acceptance_rate ?? 0) > 0.15;
  if (legacyAppliesHere) {
    bucket = bumpUp(bucket, 1);
    adjustments.push('Legacy: +1 tier');
  }
  if (
    applicationRound === 'ED' &&
    rounds.includes('ED') &&
    college.ed_admit_rate &&
    college.ed_admit_rate >= (college.acceptance_rate ?? 0) * 1.15
  ) {
    bucket = bumpUp(bucket, 1, 'Likely');
    adjustments.push('Early Decision: +1 tier (capped at Likely)');
  }

  if (programOverrideTriggered) {
    bucket = bumpDown(bucket, 1);
    adjustments.push(`${profile.major} program selectivity: −1 tier`);
  }

  const isInState = !!profile.state && !!college.state &&
    profile.state.toUpperCase() === college.state.toUpperCase();
  const isPublic = !!college.is_public;
  if (isInState && isPublic) {
    bucket = bumpUp(bucket, 1);
    adjustments.push('In-state public flagship: +1 tier');
  }

  const hooksHere = activeHookList(profile, college.id);

  const whyThisBucket = buildWhyText({
    college, effectiveAdmit, bucket,
    studentSat: sat,
    studentGpa: profile.unweightedGpa,
    testOptional: profile.testOptional,
    programOverrideTriggered,
    appliedAdjustments: adjustments,
    sat25, sat75, gpa50,
  });

  const whatWouldMoveIt = buildWhatWouldMoveIt({
    college,
    studentSat: sat,
    testOptional: profile.testOptional,
    studentGpa: profile.unweightedGpa,
    appliedHooksLength: hooksHere.length,
    programOverrideTriggered,
    hasEdAvailable: rounds.includes('ED'),
    isInState,
    isPublic,
    sat25, sat75, gpa50,
  });

  return {
    college,
    bucket,
    rawBucket,
    ceiling,
    score: Math.round(score),
    componentScores: { gpa, test, rigor },
    effectiveAdmitRate: effectiveAdmit,
    appliedAdjustments: adjustments,
    probabilityRange: probabilityRange(bucket),
    whyThisBucket,
    whatWouldMoveIt,
    programOverrideTriggered,
  };
}

/* ------------------------------ list balance ------------------------------ */

export interface BalanceReport {
  isBalanced: boolean;
  counts: Record<Tier, number>;
  warnings: string[];
  headline?: string;
  totalSchools: number;
}

export function evaluateBalance(classifications: SchoolClassification[]): BalanceReport {
  const counts: Record<Tier, number> = {
    Safety: 0, Likely: 0, Target: 0, Reach: 0, 'Hard Reach': 0,
  };
  for (const c of classifications) counts[c.bucket]++;

  const warnings: string[] = [];
  let headline: string | undefined;

  if (counts.Safety === 0) {
    warnings.push("You don't have any safeties. Every list needs 2–3.");
    headline = "You don't have enough safeties";
  } else if (counts.Safety === 1) {
    warnings.push('Only 1 safety. Consider adding a second so a single denial doesn\'t leave you stranded.');
  }
  if (counts['Hard Reach'] > 3) {
    warnings.push("Too many hard reaches. The math doesn't favor you — replace one with a target.");
    if (!headline) headline = 'Your list is reach-heavy';
  }
  if (counts.Reach + counts['Hard Reach'] > counts.Target + counts.Likely + counts.Safety) {
    if (!headline) headline = 'Your list is reach-heavy';
    warnings.push('Reaches and hard reaches outnumber the rest of your list combined.');
  }
  if (counts.Target < 3) {
    warnings.push('Fewer than 3 targets. Targets are where most admits happen — aim for 3–4.');
  }
  if (counts.Safety > 0) {
    warnings.push('Verify at least one safety is also a financial safety — affordable without need-based aid.');
  }

  const isBalanced =
    counts.Safety >= 2 &&
    counts.Safety <= 4 &&
    counts.Target >= 3 &&
    counts['Hard Reach'] <= 3 &&
    counts.Reach + counts['Hard Reach'] <= counts.Target + counts.Likely + counts.Safety + 1;

  if (isBalanced) headline = undefined;

  return { isBalanced, counts, warnings, headline, totalSchools: classifications.length };
}

/* ------------------------------ profile builder ------------------------------ */

const MAJOR_MAP: Record<string, Major> = {
  cs: 'Computer Science',
  'computer science': 'Computer Science',
  computerscience: 'Computer Science',
  engineering: 'Engineering',
  business: 'Business',
  'liberal arts': 'Liberal Arts',
  liberalarts: 'Liberal Arts',
  premed: 'Pre-Med',
  'pre-med': 'Pre-Med',
  undecided: 'Undecided',
};

export function normalizeMajor(input?: string | null): Major {
  if (!input) return 'Undecided';
  const k = input.trim().toLowerCase();
  return MAJOR_MAP[k] ?? 'Undecided';
}

export function normalizeGeoPreference(input?: string | null): GeoPreference | undefined {
  if (!input) return undefined;
  const k = input.trim().toLowerCase();
  if (k === 'in-state' || k === 'regional' || k === 'no-preference' || k === 'out-of-state') {
    return k;
  }
  return undefined;
}

/**
 * Convert a user_stats row + hook fields into a StudentProfile.
 * Tolerant of nulls — fills sensible defaults so classify() can still run.
 */
export function profileFromUserStats(stats: {
  gpa_unweighted: number | null;
  gpa_weighted: number | null;
  sat_score: number | null;
  act_score: number | null;
  state: string | null;
  intended_major: string | null;
  ap_count: number | null;
  test_optional: boolean | null;
  hook_recruited_athlete: boolean | null;
  hook_first_gen: boolean | null;
  hook_urm: boolean | null;
  hook_low_income: boolean | null;
  hook_legacy_active: boolean | null;
  hook_legacy_college_ids: string[] | null;
  geo_preference?: string | null;
}): StudentProfile {
  return {
    unweightedGpa: stats.gpa_unweighted ?? 3.5,
    weightedGpa: stats.gpa_weighted ?? undefined,
    sat: stats.sat_score ?? undefined,
    act: stats.act_score ?? undefined,
    testOptional: !!stats.test_optional,
    apCount: stats.ap_count ?? 0,
    state: (stats.state ?? '').toUpperCase(),
    major: normalizeMajor(stats.intended_major),
    geoPreference: normalizeGeoPreference(stats.geo_preference),
    hooks: {
      legacy: {
        active: !!stats.hook_legacy_active,
        collegeIds: stats.hook_legacy_college_ids ?? [],
      },
      recruitedAthlete: !!stats.hook_recruited_athlete,
      firstGen: !!stats.hook_first_gen,
      urm: !!stats.hook_urm,
      lowIncome: !!stats.hook_low_income,
    },
  };
}
