// app/api/foundations/courses/route.js
// ─── Vantage Foundations — Courses API ───────────────────────────
// CRUD for the student's course load (rigor tracking). The Conversation
// route inserts rows it hears about ("I'm taking AP Bio"); students can
// also add and remove courses directly on the Activities page.
// Auth from the session token; writes via service role (RLS is select-only).

import { getAuthedUser, getAdminClient } from "@/lib/auth";

const LEVELS = ["regular", "honors", "ap", "ib", "college"];

function sanitize(body) {
  const name = String(body.name ?? "").slice(0, 80).trim();
  const level = LEVELS.includes(String(body.level ?? "").toLowerCase())
    ? String(body.level).toLowerCase()
    : "regular";
  const gy = parseInt(body.grade_year, 10);
  const grade_year = gy >= 9 && gy <= 12 ? gy : null;
  return { name, level, grade_year };
}

export async function GET(req) {
  try {
    const auth = await getAuthedUser(req);
    if (!auth.ok) return auth.response;
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("foundations_courses")
      .select("*")
      .eq("user_id", auth.userId)
      .order("grade_year", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true });
    if (error) throw error;
    return Response.json({ courses: data || [] });
  } catch (err) {
    console.error("Courses GET error:", err);
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
      .from("foundations_courses")
      .insert({ ...fields, user_id: auth.userId })
      .select()
      .single();
    if (error) throw error;
    return Response.json({ course: data });
  } catch (err) {
    console.error("Courses POST error:", err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const auth = await getAuthedUser(req);
    if (!auth.ok) return auth.response;
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return Response.json({ error: "id required" }, { status: 400 });
    const supabase = getAdminClient();

    // Verify the row belongs to this user before deleting — the admin
    // client bypasses RLS, so ownership must be checked explicitly.
    const { data: row, error: findErr } = await supabase
      .from("foundations_courses")
      .select("id, user_id")
      .eq("id", id)
      .maybeSingle();
    if (findErr) throw findErr;
    if (!row || row.user_id !== auth.userId) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const { error } = await supabase
      .from("foundations_courses")
      .delete()
      .eq("id", id)
      .eq("user_id", auth.userId);
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (err) {
    console.error("Courses DELETE error:", err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
