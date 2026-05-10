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

export interface EarlyNonBindingOption {
  school: SchoolClassification;
  /**
   *  REA       — Restrictive Early Action (only one early app allowed)
   *  EA        — Early Action only, no ED option
   *  EA-with-ED — School offers BOTH ED and EA; EA is the non-binding choice
   */
  kind: 'REA' | 'EA' | 'EA-with-ED';
  /** EA-rate ÷ RD-rate when both are present, otherwise undefined. */
  ratio?: number;
  note: string;
}

export interface LegacyEdOption {
  school: SchoolClassification;
  /** ED-rate ÷ RD-rate when both are present. */
  ratio: number;
}

export interface EdRecommendation {
  recommended: SchoolClassification | null;
  recommendedShiftedBucket?: Tier;
  recommendedRatio?: number;
  recommendedIsLegacy?: boolean;
  alternatives: SchoolClassification[];
  /** Legacy-eligible ED schools other than the recommended pick. */
  legacyEdAlternatives: LegacyEdOption[];
  donts: EdDont[];
  /** REA / non-binding-EA schools — legitimate early plays that are not bindable. */
  earlyNonBinding: EarlyNonBindingOption[];
  hookNotes: string[];
  noEdSchools: SchoolClassification[];
  scored: { c: SchoolClassification; leverage: number; ratio: number }[];
}

interface ScoredEdCandidate {
  c: SchoolClassification;
  leverage: number;
  ratio: number;
  shiftedBucket: Tier;
  isLegacy: boolean;
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

  // Legacy stacks on top of ED — historical legacy ED admit rates run
  // ~2× the standard ED rate. Push these to the top of the recommendation list.
  const isLegacy =
    profile.hooks.legacy.active && profile.hooks.legacy.collegeIds.includes(college.id);
  if (isLegacy) bonus += 3.0;

  let penalty = 0;
  if (c.bucket === 'Target' || c.bucket === 'Likely' || c.bucket === 'Safety') {
    penalty = 3.0;
  }

  return { c, leverage: ratio + bonus - penalty, ratio, shiftedBucket: shifted, isLegacy };
}

export function computeEdStrategy(
  classifications: SchoolClassification[],
  profile: StudentProfile
): EdRecommendation {
  const scored: ScoredEdCandidate[] = classifications
    .map((c) => scoreLeverage(c, profile))
    .filter((x): x is ScoredEdCandidate => x !== null)
    .sort((a, b) => b.leverage - a.leverage);

  // Pick recommended: Reach, OR Hard Reach with strong ED rate ≥ 18%,
  // OR a legacy school where ED is available (legacy ED runs ~2× standard ED).
  let recommended: ScoredEdCandidate | null = null;
  for (const cand of scored) {
    if (cand.c.bucket === 'Reach') {
      recommended = cand;
      break;
    }
    if (cand.isLegacy && cand.c.bucket === 'Hard Reach') {
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

  // All other legacy ED schools — surfaced separately with legacy framing,
  // so the user sees every legacy stack-bet they could play.
  const legacyEdAlternatives: LegacyEdOption[] = scored
    .filter((s) => s !== recommended && s.isLegacy)
    .map((s) => ({ school: s.c, ratio: s.ratio }));

  const legacyAltIds = new Set(legacyEdAlternatives.map((l) => l.school.college.id));

  const alternatives: SchoolClassification[] = scored
    .filter((s) => s !== recommended && s.leverage > 1.5 && !legacyAltIds.has(s.c.college.id))
    .slice(0, 2)
    .map((s) => s.c);

  /* ----- early non-binding options (REA + EA-only + EA-at-ED-schools) ----- */
  // Three kinds:
  //  REA       — Restrictive EA (e.g. Stanford, Harvard)
  //  EA        — EA-only (e.g. MIT, Georgetown)
  //  EA-with-ED — School offers BOTH; EA is the non-binding alternative
  // These are NOT don'ts — they're legitimate early plays that aren't bindable.
  const earlyNonBinding: EarlyNonBindingOption[] = [];
  for (const c of classifications) {
    const rounds = c.college.available_rounds ?? ['RD'];
    const hasEd = rounds.includes('ED');
    const hasRea = rounds.includes('REA');
    const hasEa = rounds.includes('EA');

    let kind: EarlyNonBindingOption['kind'] | null = null;
    if (hasRea) kind = 'REA';
    else if (hasEa && !hasEd) kind = 'EA';
    else if (hasEa && hasEd) kind = 'EA-with-ED';
    if (!kind) continue;

    const eaRate = c.college.ea_admit_rate ?? null;
    const rdRate = c.college.acceptance_rate ?? null;
    const ratio = eaRate && rdRate ? eaRate / Math.max(0.001, rdRate) : undefined;
    const ratioText = ratio
      ? ` Early admit ~${(eaRate! * 100).toFixed(0)}% vs ~${(rdRate! * 100).toFixed(0)}% RD (${ratio.toFixed(1)}× lift).`
      : '';

    let note: string;
    if (kind === 'REA') {
      note = `Restrictive Early Action — non-binding, but it's your one early signal and a real lift over RD.${ratioText} Use it on the REA school you'd attend without seeing other offers.`;
    } else if (kind === 'EA') {
      note = `Early Action — non-binding, no ED option here.${ratioText} Apply early; there's nothing to commit to.`;
    } else {
      note = `EA available — apply early without committing.${ratioText} Use this if you ED somewhere else but still want an early read here.`;
    }

    earlyNonBinding.push({ school: c, kind, ratio, note });
  }
  // Sort: REA → EA-only → EA-with-ED, then by selectivity (most-selective first).
  const KIND_ORDER: Record<EarlyNonBindingOption['kind'], number> = {
    REA: 0, EA: 1, 'EA-with-ED': 2,
  };
  earlyNonBinding.sort((a, b) => {
    if (a.kind !== b.kind) return KIND_ORDER[a.kind] - KIND_ORDER[b.kind];
    return (a.school.college.acceptance_rate ?? 1) - (b.school.college.acceptance_rate ?? 1);
  });

  /* ----- don'ts (real ones only) ----- */
  const donts: EdDont[] = [];

  // Safeties / Likelies that look tempting to lock in via ED.
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

  const handledIds = new Set([
    ...donts.map((d) => d.school.college.id),
    ...earlyNonBinding.map((e) => e.school.college.id),
  ]);
  const noEdSchools = classifications.filter(
    (c) =>
      !((c.college.available_rounds ?? ['RD']).includes('ED')) &&
      !handledIds.has(c.college.id)
  );

  /* ----- hook notes ----- */
  const hookNotes: string[] = [];
  if (profile.hooks.recruitedAthlete) {
    hookNotes.push(
      "As a recruited athlete, your ED choice is typically determined by your coach's offer — talk to them before committing your ED card here."
    );
  }
  // Legacy ED schools are surfaced in their own panel section (recommended +
  // legacyEdAlternatives), so we don't duplicate them here as hook notes.
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
    recommendedIsLegacy: recommended ? recommended.isLegacy : undefined,
    alternatives,
    legacyEdAlternatives,
    donts,
    earlyNonBinding,
    hookNotes,
    noEdSchools,
    scored: scored.map((s) => ({ c: s.c, leverage: s.leverage, ratio: s.ratio })),
  };
}
