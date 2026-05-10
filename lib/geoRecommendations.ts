// Suggests specific schools to balance a portfolio, filtered by geographic preference.
// Pure logic — no DB or React. Called from app/colleges/page.tsx.

import {
  classify,
  type College,
  type SchoolClassification,
  type StudentProfile,
  type Tier,
} from './classifier';

const REGION_BY_STATE: Record<string, 'Northeast' | 'South' | 'Midwest' | 'West'> = {
  CT: 'Northeast', ME: 'Northeast', MA: 'Northeast', NH: 'Northeast',
  NJ: 'Northeast', NY: 'Northeast', PA: 'Northeast', RI: 'Northeast', VT: 'Northeast',
  AL: 'South', AR: 'South', DE: 'South', DC: 'South', FL: 'South', GA: 'South',
  KY: 'South', LA: 'South', MD: 'South', MS: 'South', NC: 'South', OK: 'South',
  SC: 'South', TN: 'South', TX: 'South', VA: 'South', WV: 'South',
  IA: 'Midwest', IL: 'Midwest', IN: 'Midwest', KS: 'Midwest', MI: 'Midwest',
  MN: 'Midwest', MO: 'Midwest', ND: 'Midwest', NE: 'Midwest', OH: 'Midwest',
  SD: 'Midwest', WI: 'Midwest',
  AK: 'West', AZ: 'West', CA: 'West', CO: 'West', HI: 'West', ID: 'West',
  MT: 'West', NM: 'West', NV: 'West', OR: 'West', UT: 'West', WA: 'West', WY: 'West',
};

// Recommended counts per tier — used to detect deficits.
const TARGET_MIN: Record<Tier, number> = {
  Safety: 2,
  Likely: 1,
  Target: 3,
  Reach: 2,
  'Hard Reach': 0,
};

const TIER_PRIORITY: Tier[] = ['Safety', 'Target', 'Likely', 'Reach', 'Hard Reach'];

export interface SchoolSuggestion {
  classification: SchoolClassification;
  reason: string;
}

export function regionFor(state?: string | null): string | undefined {
  if (!state) return undefined;
  return REGION_BY_STATE[state.toUpperCase()];
}

function passesGeoFilter(college: College, profile: StudentProfile): boolean {
  const pref = profile.geoPreference;
  if (!pref || pref === 'no-preference') return true;
  if (!college.state) return false;
  const collegeState = college.state.toUpperCase();
  const userState = profile.state.toUpperCase();
  if (!userState) return true; // can't filter without knowing user's state
  if (pref === 'in-state') return collegeState === userState;
  if (pref === 'out-of-state') return collegeState !== userState;
  if (pref === 'regional') {
    const userRegion = regionFor(userState);
    const collegeRegion = regionFor(collegeState);
    return !!userRegion && userRegion === collegeRegion;
  }
  return true;
}

function pickNeededTier(counts: Record<Tier, number>): Tier | null {
  let bestTier: Tier | null = null;
  let bestDeficit = 0;
  for (const tier of TIER_PRIORITY) {
    const deficit = TARGET_MIN[tier] - counts[tier];
    if (deficit > bestDeficit) {
      bestDeficit = deficit;
      bestTier = tier;
    }
  }
  return bestTier;
}

function geoLabel(college: College, profile: StudentProfile): string {
  if (!college.state) return '';
  const userState = profile.state.toUpperCase();
  if (userState && college.state.toUpperCase() === userState) return 'In-state';
  const region = regionFor(college.state);
  if (region) return region;
  return college.state;
}

function buildReason(
  classification: SchoolClassification,
  profile: StudentProfile,
  neededTier: Tier
): string {
  const geo = geoLabel(classification.college, profile);
  const tierLabel = neededTier.toLowerCase();
  if (geo) {
    return `${geo} ${tierLabel} that fits your stats — adds balance to your list.`;
  }
  return `Strong ${tierLabel} fit — adds balance to your list.`;
}

/**
 * Suggest specific schools to balance the portfolio. Returns up to `max`
 * suggestions in the tier with the largest deficit, filtered by the user's
 * geographic preference. Returns [] when the list is balanced or there are
 * no good candidates available.
 */
export function buildSchoolSuggestions(args: {
  profile: StudentProfile;
  classifications: SchoolClassification[];
  allColleges: College[];
  userCollegeIds: string[];
  counts: Record<Tier, number>;
  max?: number;
}): { neededTier: Tier | null; suggestions: SchoolSuggestion[] } {
  const { profile, allColleges, userCollegeIds, counts } = args;
  const max = args.max ?? 3;

  const neededTier = pickNeededTier(counts);
  if (!neededTier) return { neededTier: null, suggestions: [] };

  const owned = new Set(userCollegeIds);
  const candidates = allColleges.filter(
    (c) => !owned.has(c.id) && c.acceptance_rate != null && passesGeoFilter(c, profile)
  );

  const matching: SchoolSuggestion[] = [];
  for (const college of candidates) {
    const cls = classify(college, profile, 'RD');
    if (cls.bucket !== neededTier) continue;
    matching.push({
      classification: cls,
      reason: buildReason(cls, profile, neededTier),
    });
  }

  matching.sort((a, b) => b.classification.score - a.classification.score);

  // Fallback: if geo filter knocked out all candidates, retry without filter.
  if (matching.length === 0 && profile.geoPreference && profile.geoPreference !== 'no-preference') {
    const widened = allColleges.filter(
      (c) => !owned.has(c.id) && c.acceptance_rate != null
    );
    for (const college of widened) {
      const cls = classify(college, profile, 'RD');
      if (cls.bucket !== neededTier) continue;
      matching.push({
        classification: cls,
        reason: buildReason(cls, profile, neededTier),
      });
    }
    matching.sort((a, b) => b.classification.score - a.classification.score);
  }

  return { neededTier, suggestions: matching.slice(0, max) };
}

export interface TierSuggestion {
  tier: Tier;
  deficit: number;
  suggestions: SchoolSuggestion[];
}

/**
 * Like {@link buildSchoolSuggestions}, but returns suggestions for EVERY
 * under-filled tier — Safety, Likely, Target, Reach. Each block has up to
 * `perTier` schools sorted by fit. Used to fill out the rest of the list,
 * not just the most-deficient tier.
 */
export function buildAllTierSuggestions(args: {
  profile: StudentProfile;
  allColleges: College[];
  userCollegeIds: string[];
  counts: Record<Tier, number>;
  perTier?: number;
}): TierSuggestion[] {
  const { profile, allColleges, userCollegeIds, counts } = args;
  const perTier = args.perTier ?? 3;

  const owned = new Set(userCollegeIds);
  const baseCandidates = allColleges.filter(
    (c) => !owned.has(c.id) && c.acceptance_rate != null && passesGeoFilter(c, profile)
  );
  const widenedCandidates =
    profile.geoPreference && profile.geoPreference !== 'no-preference'
      ? allColleges.filter((c) => !owned.has(c.id) && c.acceptance_rate != null)
      : null;

  // Classify each candidate ONCE per pass.
  const baseClassified = baseCandidates.map((c) => classify(c, profile, 'RD'));
  const widenedClassified = widenedCandidates
    ? widenedCandidates.map((c) => classify(c, profile, 'RD'))
    : null;

  const results: TierSuggestion[] = [];
  for (const tier of TIER_PRIORITY) {
    const deficit = TARGET_MIN[tier] - counts[tier];
    if (deficit <= 0) continue;

    let matching = baseClassified
      .filter((cls) => cls.bucket === tier)
      .sort((a, b) => b.score - a.score);

    if (matching.length === 0 && widenedClassified) {
      matching = widenedClassified
        .filter((cls) => cls.bucket === tier)
        .sort((a, b) => b.score - a.score);
    }
    if (matching.length === 0) continue;

    results.push({
      tier,
      deficit,
      suggestions: matching.slice(0, perTier).map((cls) => ({
        classification: cls,
        reason: buildReason(cls, profile, tier),
      })),
    });
  }

  return results;
}
