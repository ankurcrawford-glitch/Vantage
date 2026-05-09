// ED Strategy recommender. Reads classifications + profile and produces a
// prescriptive recommendation: where to spend the one binding ED card, plus
// alternatives, don'ts, and hook-aware notes.

import {
  classify,
  type SchoolClassification,
  type StudentProfile,
  type Tier,
} from './classifier';

export interface EdDont {
  school: SchoolClassification;
  reason: string;
}

export interface EdRecommendation {
  recommended: SchoolClassification | null;
  recommendedShiftedBucket?: Tier;
  recommendedRatio?: number;
  alternatives: SchoolClassification[];
  donts: EdDont[];
  hookNotes: string[];
  noEdSchools: SchoolClassification[];
  scored: { c: SchoolClassification; leverage: number; ratio: number }[];
}

interface ScoredEdCandidate {
  c: SchoolClassification;
  leverage: number;
  ratio: number;
  shiftedBucket: Tier;
}

function scoreLeverage(
  c: SchoolClassification,
  profile: StudentProfile
): ScoredEdCandidate | null {
  const college = c.college;
  const rounds = college.available_rounds ?? ['RD'];
  if (!rounds.includes('ED') || !college.ed_admit_rate || !college.acceptance_rate) {
    return null;
  }

  const ratio = college.ed_admit_rate / Math.max(0.001, college.acceptance_rate);
  if (ratio < 1.15) return null;
  let bonus = 0;

  // What would this school become under ED?
  const edClass = classify(college, profile, 'ED');
  const shifted = edClass.bucket;

  if (c.bucket === 'Reach') bonus += 2.0;
  else if (c.bucket === 'Hard Reach' && shifted === 'Reach') bonus += 0.5;

  let penalty = 0;
  if (c.bucket === 'Target' || c.bucket === 'Likely' || c.bucket === 'Safety') {
    penalty = 3.0;
  }

  return { c, leverage: ratio + bonus - penalty, ratio, shiftedBucket: shifted };
}

export function computeEdStrategy(
  classifications: SchoolClassification[],
  profile: StudentProfile
): EdRecommendation {
  const scored: ScoredEdCandidate[] = classifications
    .map((c) => scoreLeverage(c, profile))
    .filter((x): x is ScoredEdCandidate => x !== null)
    .sort((a, b) => b.leverage - a.leverage);

  // Pick recommended: Reach, OR Hard Reach with strong ED rate ≥ 18%
  let recommended: ScoredEdCandidate | null = null;
  for (const cand of scored) {
    if (cand.c.bucket === 'Reach') {
      recommended = cand;
      break;
    }
    if (
      cand.c.bucket === 'Hard Reach' &&
      cand.c.college.ed_admit_rate &&
      cand.c.college.ed_admit_rate >= 0.18
    ) {
      recommended = cand;
      break;
    }
  }

  const alternatives: SchoolClassification[] = scored
    .filter((s) => s !== recommended && s.leverage > 1.5)
    .slice(0, 2)
    .map((s) => s.c);

  /* ----- don'ts ----- */
  const donts: EdDont[] = [];

  // 1. Hard Reach with no ED (REA-only / EA-only ultra-selectives)
  for (const c of classifications) {
    if (c.bucket !== 'Hard Reach') continue;
    const rounds = c.college.available_rounds ?? ['RD'];
    if (rounds.includes('ED')) continue;
    const isRea = rounds.includes('REA');
    const isEaOnly = rounds.includes('EA') && !rounds.includes('ED');
    if (isRea) {
      donts.push({
        school: c,
        reason:
          'Restrictive Early Action only — you cannot bind here, and the boost vs RD is minimal.',
      });
    } else if (isEaOnly) {
      donts.push({
        school: c,
        reason: "EA only — no binding option exists, so ED leverage isn't available here.",
      });
    }
    if (donts.length >= 3) break;
  }

  // 2. Safeties / Likelies that look tempting to lock in
  if (donts.length < 3) {
    for (const c of classifications) {
      if (c.bucket !== 'Safety' && c.bucket !== 'Likely') continue;
      const rounds = c.college.available_rounds ?? ['RD'];
      if (!rounds.includes('ED')) continue;
      donts.push({
        school: c,
        reason:
          "You're already likely to be admitted RD — binding here means giving up flexibility for nothing.",
      });
      if (donts.length >= 3) break;
    }
  }

  const dontIds = new Set(donts.map((d) => d.school.college.id));
  const noEdSchools = classifications.filter(
    (c) =>
      !((c.college.available_rounds ?? ['RD']).includes('ED')) &&
      !dontIds.has(c.college.id)
  );

  /* ----- hook notes ----- */
  const hookNotes: string[] = [];
  if (profile.hooks.recruitedAthlete) {
    hookNotes.push(
      "As a recruited athlete, your ED choice is typically determined by your coach's offer — talk to them before committing your ED card here."
    );
  }
  if (profile.hooks.legacy.active && profile.hooks.legacy.collegeIds.length > 0) {
    for (const sid of profile.hooks.legacy.collegeIds) {
      const c = classifications.find((cc) => cc.college.id === sid);
      if (!c) continue;
      const rounds = c.college.available_rounds ?? ['RD'];
      if (!rounds.includes('ED')) continue;
      hookNotes.push(
        `You're a legacy at ${c.college.name}. Legacy ED admit rates often run 25–35% — this materially increases your odds beyond the standard ED bump.`
      );
    }
  }
  const anyEdEligibleSelective = scored.some(
    (s) => (s.c.college.acceptance_rate ?? 1) < 0.4
  );
  if (profile.hooks.firstGen && anyEdEligibleSelective) {
    hookNotes.push(
      'Many holistic schools weight first-generation status especially heavily in ED rounds — apply ED to your top first-gen-friendly school.'
    );
  }
  if (profile.hooks.urm && anyEdEligibleSelective) {
    hookNotes.push(
      'Holistic admissions offices often weight underrepresented backgrounds especially heavily in the ED round — your ED card carries extra signal here.'
    );
  }

  return {
    recommended: recommended ? recommended.c : null,
    recommendedShiftedBucket: recommended ? recommended.shiftedBucket : undefined,
    recommendedRatio: recommended ? recommended.ratio : undefined,
    alternatives,
    donts,
    hookNotes,
    noEdSchools,
    scored: scored.map((s) => ({ c: s.c, leverage: s.leverage, ratio: s.ratio })),
  };
}
