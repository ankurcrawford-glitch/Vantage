// lib/grade.ts
// ─── Grade rollover via graduation year ─────────────────────────
// The durable source of truth for a student's grade is user_stats.class_of
// (the year they graduate). Grade is DERIVED from it and today's date, so
// students automatically roll up a grade every August 1 — no cron, no
// mass updates. The legacy user_stats.grade column is kept as a fallback
// for rows that predate class_of, and is still written on save so old
// code paths keep working.
//
// School-year convention: Aug 1 – Jul 31. In the school year that starts
// August 2026, seniors (grade 12) are the Class of 2027.

/** The calendar year in which the CURRENT school year's seniors graduate. */
export function schoolYearEnd(d: Date = new Date()): number {
  // getMonth() is 0-based: August = 7.
  return d.getMonth() >= 7 ? d.getFullYear() + 1 : d.getFullYear();
}

/**
 * Derive today's grade from a graduation year. Clamped to the 9–12 range
 * the app supports: not-yet-freshmen read as 9, already-graduated as 12.
 * Returns null when classOf is missing/invalid.
 */
export function gradeFromClassOf(classOf: unknown, d: Date = new Date()): number | null {
  if (typeof classOf !== "number" || !Number.isInteger(classOf)) return null;
  const g = 12 - (classOf - schoolYearEnd(d));
  if (g < 9) return 9;
  if (g > 12) return 12;
  return g;
}

/** Inverse: the graduation year implied by being in `grade` TODAY. */
export function classOfFromGrade(grade: unknown, d: Date = new Date()): number | null {
  if (typeof grade !== "number" || !Number.isInteger(grade) || grade < 9 || grade > 12) return null;
  return schoolYearEnd(d) + (12 - grade);
}

/**
 * The grade to use everywhere: prefer the class_of derivation (auto-rolls
 * each August), fall back to the stored grade for legacy rows.
 * Accepts a user_stats row (or any object with grade / class_of).
 */
export function effectiveGrade(
  row: { grade?: unknown; class_of?: unknown } | null | undefined,
  d: Date = new Date()
): number | null {
  if (!row) return null;
  const derived = gradeFromClassOf((row as { class_of?: unknown }).class_of, d);
  if (derived !== null) return derived;
  const g = (row as { grade?: unknown }).grade;
  return typeof g === "number" && Number.isInteger(g) ? g : null;
}
