// app/api/foundations/sync-activities/route.js
// Continuity bridge: copy a student's confirmed Foundations activities into
// the senior college-app activity list (user_extracurriculars) so years of
// captured involvement arrive pre-filled when they reach Vantage.
//
// Idempotent: skips any activity whose name already exists in
// user_extracurriculars (case-insensitive), so it's safe to call repeatedly
// and won't duplicate or overwrite student-edited senior entries.
// Auth from the session token; service-role client for the cross-table write.

import { getAuthedUser, getAdminClient } from "@/lib/auth";

const depthLabels = ["", "Tried it", "Committed", "Deep", "Leading", "Defining"];

function buildDescription(a) {
  // Fold the Foundations detail that user_extracurriculars has no column for
  // into a single readable description.
  const parts = [];
  if (a.since) parts.push(`Since ${a.since}`);
  if (a.hours) parts.push(`${a.hours} hrs/wk`);
  if (typeof a.depth === "number" && depthLabels[a.depth]) parts.push(depthLabels[a.depth]);
  if (a.thread) parts.push(`Thread: ${a.thread}`);
  if (a.trajectory) parts.push(a.trajectory);
  return parts.join(" · ") || null;
}

export async function POST(req) {
  try {
    const auth = await getAuthedUser(req);
    if (!auth.ok) return auth.response;
    const userId = auth.userId;

    const supabase = getAdminClient();

    // Only confirmed Foundations activities carry over (not unconfirmed
    // conversation suggestions the student hasn't accepted).
    const { data: fActs, error: fErr } = await supabase
      .from("foundations_activities")
      .select("id, name, role, since, hours, depth, thread, trajectory")
      .eq("user_id", userId)
      .eq("confirmed", true);
    if (fErr) throw fErr;

    if (!fActs || fActs.length === 0) {
      return Response.json({ ok: true, imported: 0, skipped: 0 });
    }

    // Existing senior activities — dedupe by both name (case-insensitive)
    // and source_foundation_id so we don't re-mirror activities the
    // confirm path already snapshotted.
    const { data: existing, error: eErr } = await supabase
      .from("user_extracurriculars")
      .select("activity_name, source_foundation_id")
      .eq("user_id", userId);
    if (eErr) throw eErr;

    const haveNames = new Set(
      (existing || []).map((e) => (e.activity_name || "").trim().toLowerCase())
    );
    const haveSourceIds = new Set(
      (existing || []).map((e) => e.source_foundation_id).filter(Boolean)
    );

    const toInsert = [];
    for (const a of fActs) {
      if (haveSourceIds.has(a.id)) continue;
      const key = (a.name || "").trim().toLowerCase();
      if (!key || haveNames.has(key)) continue;
      haveNames.add(key); // guard against dupes within the Foundations set too
      toInsert.push({
        user_id: userId,
        activity_name: a.name.trim(),
        role: a.role ? a.role.trim() : null,
        description: buildDescription(a),
        status: "accepted",
        source_foundation_id: a.id,
        depth: a.depth ?? null,
        thread: a.thread || null,
        trajectory: a.trajectory || null,
        hours: a.hours || null,
        since: a.since || null,
      });
    }

    if (toInsert.length === 0) {
      return Response.json({ ok: true, imported: 0, skipped: fActs.length });
    }

    const { error: insErr } = await supabase.from("user_extracurriculars").insert(toInsert);
    if (insErr) throw insErr;

    return Response.json({
      ok: true,
      imported: toInsert.length,
      skipped: fActs.length - toInsert.length,
    });
  } catch (err) {
    console.error("sync-activities error:", err);
    return Response.json({ error: "Could not sync activities." }, { status: 500 });
  }
}
