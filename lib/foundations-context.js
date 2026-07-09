// lib/foundations-context.js
// ─── Vantage Foundations — shared student-context builder ────────
// Compact (~300 token) plain-text snapshot of what the platform already
// knows about a student: confirmed activities, roadmap progress, the
// latest Spark reflection, and their course load. Injected into the
// Counselor and Conversation system prompts so the AI can reference the
// student's actual work ("your robotics thread", "you checked off PSAT
// prep") instead of answering generically.
//
// Best-effort by design: returns '' on any error — callers never guard.

const LEVEL_LABEL = { regular: "Regular", honors: "Honors", ap: "AP", ib: "IB", college: "College" };

export async function buildStudentContext(supabase, userId) {
  try {
    const [actsRes, roadmapRes, sparkRes, coursesRes] = await Promise.all([
      supabase
        .from("foundations_activities")
        .select("name, role, depth, thread")
        .eq("user_id", userId)
        .eq("confirmed", true)
        .order("depth", { ascending: false })
        .limit(12),
      supabase
        .from("roadmap_progress")
        .select("item_key")
        .eq("user_id", userId)
        .limit(40),
      supabase
        .from("foundations_spark_entries")
        .select("month_key, content")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1),
      supabase
        .from("foundations_courses")
        .select("name, level, grade_year")
        .eq("user_id", userId)
        .order("grade_year", { ascending: true })
        .limit(16),
    ]);

    const parts = [];

    const acts = actsRes.data || [];
    if (acts.length) {
      const lines = acts.map((a) => {
        const bits = [
          String(a.name || "").slice(0, 60),
          a.role ? String(a.role).slice(0, 40) : "",
          a.depth ? `depth ${a.depth}/5` : "",
          a.thread ? `thread: ${String(a.thread).slice(0, 40)}` : "",
        ].filter(Boolean);
        return "- " + bits.join(" · ");
      });
      parts.push("Confirmed activities:\n" + lines.join("\n"));
    }

    const keys = (roadmapRes.data || []).map((p) => p.item_key).filter(Boolean);
    if (keys.length) {
      parts.push(
        `Roadmap items completed: ${keys.length} of their grade's items: ${keys.join(", ")}`
      );
    }

    const spark = (sparkRes.data || [])[0];
    if (spark && spark.content) {
      parts.push(
        `Latest Spark reflection (${spark.month_key}): "${String(spark.content).slice(0, 200)}"`
      );
    }

    const courses = coursesRes.data || [];
    if (courses.length) {
      const lines = courses.map(
        (c) =>
          `${String(c.name || "").slice(0, 60)} (${LEVEL_LABEL[c.level] || c.level}${
            c.grade_year ? `, grade ${c.grade_year}` : ""
          })`
      );
      parts.push("Courses: " + lines.join("; "));
    }

    return parts.join("\n\n");
  } catch (err) {
    console.error("buildStudentContext error:", err);
    return "";
  }
}
