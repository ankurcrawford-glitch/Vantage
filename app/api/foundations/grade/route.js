// app/api/foundations/grade/route.js
// Saves the student's grade to user_stats. Auth is derived from the session
// token (never the body), matching the rest of the API. Service-role client
// upserts the single grade field.

import { getAuthedUser, getAdminClient } from "@/lib/auth";
import { classOfFromGrade, schoolYearEnd } from "@/lib/grade";

export async function POST(req) {
  try {
    const auth = await getAuthedUser(req);
    if (!auth.ok) return auth.response;
    const userId = auth.userId;

    const { grade } = await req.json();
    const g = Number(grade);
    if (!Number.isInteger(g) || g < 9 || g > 12) {
      return Response.json({ error: "Grade must be 9, 10, 11, or 12." }, { status: 400 });
    }

    const supabase = getAdminClient();

    // Update if the row exists, otherwise insert (mirrors lib/save-user-stats).
    const { data: existing, error: selErr } = await supabase
      .from("user_stats")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();
    if (selErr) throw selErr;

    // class_of is the durable value (auto-rolls every August); grade is
    // kept in sync for legacy readers.
    const class_of = classOfFromGrade(g);
    // Saving a grade IS confirming it for the current school year.
    const grade_confirmed_for = schoolYearEnd();
    const result = existing
      ? await supabase.from("user_stats").update({ grade: g, class_of, grade_confirmed_for }).eq("user_id", userId)
      : await supabase.from("user_stats").insert({ user_id: userId, grade: g, class_of, grade_confirmed_for });
    if (result.error) throw result.error;

    return Response.json({ ok: true, grade: g });
  } catch (err) {
    console.error("set-grade error:", err);
    return Response.json({ error: "Could not save grade." }, { status: 500 });
  }
}
