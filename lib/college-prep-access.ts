/** Juniors peek at college prep from January; seniors have full access. */
export function canAccessCollegePrep(grade: number | null | undefined): boolean {
  if (typeof grade !== "number") return false;
  if (grade === 12) return true;
  if (grade === 11) return new Date().getMonth() >= 0; // January onward
  return false;
}

export function collegePrepLockedMessage(grade: number): string {
  if (grade === 11) {
    return "College prep opens in January of junior year. Until then, keep building your story in Foundations.";
  }
  return "College prep unlocks in 11th grade. For now, stay in Foundations.";
}
