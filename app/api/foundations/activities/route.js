// app/api/foundations/activities/route.js
// ─── Vantage Foundations — Activities API ────────────────────────
// CRUD for the student's activity tracker. The Conversation route inserts
// suggested rows (source='conversation', confirmed=false); the student
// confirms/edits/removes them here, or adds their own.
// Auth from the session token; writes via service role (RLS is select-only).

import { getAuthedUser, getAdminClient } from "@/lib/auth";

const clean = (v, max) => String(v ?? "").slice(0, max);
const cleanDepth = (d) => Math.min(5, Math.max(1, parseInt(d, 10) || 1));

function sanitize(body) {
  return {
    name: clean(body.name, 80).trim(),
    role: clean(body.role, 80),
    since: clean(body.since, 40),
    hours: clean(body.hours, 20),
    depth: cleanDepth(body.depth),
    thread: clean(body.thread, 60),
    trajectory: clean(body.trajectory, 400),
  };
}

// Snapshot a confirmed Foundations activity into the canonical
// user_extracurriculars table so the senior product (Profile, Essays,
// Strategic Intelligence, Round Table) sees it like any other accepted
// activity. Snapshot model — subsequent edits in Foundations do not
// re-sync. Skips if a mirror already exists (source_foundation_id
// match) or if the same user already has an activity with the same
// name (case-insensitive dedupe).
async function mirrorToExtracurriculars(supabase, row) {
  if (!row || !row.id || !row.user_id || row.confirmed !== true) return;
  try {
    const { data: existingMirror } = await supabase
      .from("user_extracurriculars")
      .select("id")
      .eq("source_foundation_id", row.id)
      .maybeSingle();
    if (existingMirror) return;

    const name = (row.name ?? "").trim();
    if (!name) return;

    const { data: nameClash } = await supabase
      .from("user_extracurriculars")
      .select("id")
      .eq("user_id", row.user_id)
      .ilike("activity_name", name)
      .maybeSingle();
    if (nameClash) return;

    await supabase.from("user_extracurriculars").insert({
      user_id: row.user_id,
      activity_name: name,
      role: row.role || null,
      description: null,
      status: "accepted",
      source_foundation_id: row.id,
      depth: row.depth ?? null,
      thread: row.thread || null,
      trajectory: row.trajectory || null,
      hours: row.hours || null,
      since: row.since || null,
    });
  } catch (err) {
    // Mirror is best-effort — don't block the Foundations write.
    console.error("mirrorToExtracurriculars error:", err);
  }
}

export async function GET(req) {
  try {
    const auth = await getAuthedUser(req);
    if (!auth.ok) return auth.response;
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("foundations_activities")
      .select("*")
      .eq("user_id", auth.userId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return Response.json({ activities: data || [] });
  } catch (err) {
    console.error("Activities GET error:", err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = await getAuthedUser(req);
    if (!auth.ok) return auth.response;
    const body = await req.json();
    const fields = sanitize(body);
    if (!fields.name) {
      return Response.json({ error: "Name is required" }, { status: 400 });
    }
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("foundations_activities")
      .insert({ ...fields, user_id: auth.userId, source: "student", confirmed: true })
      .select()
      .single();
    if (error) throw error;
    // Student-added rows are confirmed from the start — mirror immediately.
    await mirrorToExtracurriculars(supabase, data);
    return Response.json({ activity: data });
  } catch (err) {
    console.error("Activities POST error:", err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const auth = await getAuthedUser(req);
    if (!auth.ok) return auth.response;
    const body = await req.json();
    if (!body.id) return Response.json({ error: "id required" }, { status: 400 });

    // Confirm-only fast path (kid taps "Looks right")
    const update = body.confirmOnly
      ? { confirmed: true }
      : { ...sanitize(body), confirmed: true };
    update.updated_at = new Date().toISOString();

    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("foundations_activities")
      .update(update)
      .eq("id", body.id)
      .eq("user_id", auth.userId) // never update across users
      .select()
      .single();
    if (error) throw error;
    // First-time confirm (or any update that lands on confirmed=true)
    // creates a snapshot in user_extracurriculars. Subsequent edits
    // don't re-sync — mirror() no-ops when the row already exists.
    await mirrorToExtracurriculars(supabase, data);
    return Response.json({ activity: data });
  } catch (err) {
    console.error("Activities PATCH error:", err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const auth = await getAuthedUser(req);
    if (!auth.ok) return auth.response;
    const body = await req.json();
    if (!body.id) return Response.json({ error: "id required" }, { status: 400 });
    const supabase = getAdminClient();
    // Delete the mirrored row first (best-effort, scoped by user_id so
    // we can never delete across users). Then delete the source row.
    // If the mirror delete fails for some reason, we still let the
    // source delete proceed — orphans can be cleaned up later.
    const mirrorDelete = await supabase
      .from("user_extracurriculars")
      .delete()
      .eq("source_foundation_id", body.id)
      .eq("user_id", auth.userId);
    if (mirrorDelete.error) {
      console.error("Mirror delete failed (continuing):", mirrorDelete.error);
    }
    const { error } = await supabase
      .from("foundations_activities")
      .delete()
      .eq("id", body.id)
      .eq("user_id", auth.userId);
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (err) {
    console.error("Activities DELETE error:", err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
