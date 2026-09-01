// Vantage — early application plan rules
// ----------------------------------------------------------------------
// Pure data + helpers, no DB or React. Used by the dashboard deadline
// module to label restrictive early plans honestly and to explain the
// rules of the early game.
//
// Two facts every senior needs but few are told plainly:
//   1. ED is binding and you may only apply ED to ONE school.
//   2. REA / SCEA ("restrictive early action") is non-binding but
//      exclusive: applying REA generally bars you from applying ED or
//      EA at other private colleges (public-university EA is usually
//      still allowed).
//
// Schools whose "EA" round is actually restrictive (REA/SCEA) for the
// 2026-27 cycle. Matched by normalized name so DB naming variations
// ("University of Notre Dame" vs "Notre Dame") still hit.

const RESTRICTIVE_EA_NAMES = [
  'harvard university',
  'harvard college',
  'princeton university',
  'stanford university',
  'yale university',
  'georgetown university',
  'university of notre dame',
  'notre dame',
  'california institute of technology',
  'caltech',
];

function normalize(name: string): string {
  return name.toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();
}

/** True if this school's early-action round is restrictive (REA/SCEA). */
export function isRestrictiveEA(collegeName: string): boolean {
  const n = normalize(collegeName);
  return RESTRICTIVE_EA_NAMES.some((r) => n === r || n.includes(r));
}

/** Display label for a school's early-action round. */
export function eaLabel(collegeName: string): 'EA' | 'REA' {
  return isRestrictiveEA(collegeName) ? 'REA' : 'EA';
}

export const PLAN_EXPLAINERS: Record<string, string> = {
  ED: 'Early Decision — binding. If admitted, you attend. You may apply ED to only ONE school.',
  REA: 'Restrictive Early Action — non-binding, but you generally cannot apply early (ED or private EA) anywhere else.',
  EA: 'Early Action — non-binding, hear back early. Usually combinable with other EA schools.',
  RD: 'Regular Decision — the standard deadline.',
};
