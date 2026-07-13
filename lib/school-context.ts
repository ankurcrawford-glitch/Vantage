// Formats the student's high-school context (from user_stats school_*
// columns, populated by /api/school-lookup) as one prompt line for the
// essay tools. Returns '' when no school is on file.

const TIER_LABEL: Record<string, string> = {
  top_feeder: 'a top-tier private feeder school',
  strong: 'a well-regarded private school',
  standard: 'a private school',
};

const OPPORTUNITY_LABEL: Record<string, string> = {
  under_resourced: 'an under-resourced school — achievement here reflects initiative beyond what the environment provides',
  well_resourced: 'a well-resourced school',
};

export function buildSchoolLine(userStats: {
  school_name?: string | null;
  school_city?: string | null;
  school_type?: string | null;
  school_tier?: string | null;
  school_opportunity?: string | null;
  school_context?: string | null;
} | null | undefined): string {
  if (!userStats?.school_name) return '';
  const parts: string[] = [];
  const where = userStats.school_city ? `${userStats.school_name} in ${userStats.school_city}` : userStats.school_name;
  parts.push(`High school: ${where}.`);

  const descriptors: string[] = [];
  if (userStats.school_tier && TIER_LABEL[userStats.school_tier]) {
    descriptors.push(TIER_LABEL[userStats.school_tier]);
  } else if (userStats.school_type) {
    descriptors.push(`a ${userStats.school_type} school`);
  }
  if (userStats.school_opportunity && OPPORTUNITY_LABEL[userStats.school_opportunity]) {
    descriptors.push(OPPORTUNITY_LABEL[userStats.school_opportunity]);
  }
  if (descriptors.length) parts.push(`This is ${descriptors.join(', and ')}.`);
  if (userStats.school_context) parts.push(userStats.school_context);
  parts.push(
    'Use this only to understand the student\'s environment and what their achievements meant in context — never suggest they name-drop their school or frame it as an advantage/disadvantage in an essay.'
  );
  return `School context: ${parts.join(' ')}`;
}
