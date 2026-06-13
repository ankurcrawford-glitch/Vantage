// app/api/foundations/roadmap/route.js
// ─── Vantage Foundations — Roadmap progress API ──────────────────
// GET  → { grade, done: ["9-summer", ...] }
// POST → { key, done: true|false } toggles an item
// Auth from the session token; writes via service role (RLS select-only).

import { getAuthedUser, getAdminClient } from "@/lib/auth";

export async function GET(req) {
  try {
    const auth = await getAuthedUser(req);
    if (!auth.ok) return auth.response;
    const supabase = getAdminClient();

    const [{ data: stats }, { data: progress, error }] = await Promise.all([
      supabase.from("user_stats").select("grade").eq("user_id", auth.userId).maybeSingle(),
      supabase.from("roadmap_progress").select("item_key").eq("user_id", auth.userId),
    ]);
    if (error) throw error;

    return Response.json({
      grade: typeof stats?.grade === "number" ? stats.grade : null,
      done: (progress || []).map((p) => p.item_key),
    });
  } catch (err) {
    console.error("Roadmap GET error:", err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = await getAuthedUser(req);
    if (!auth.ok) return auth.response;
    const { key, done } = await req.json();
    if (typeof key !== "string" || !key || key.length > 60) {
      return Response.json({ error: "Bad request" }, { status: 400 });
    }
    const supabase = getAdminClient();

    if (done) {
      const { error } = await supabase
        .from("roadmap_progress")
        .upsert({ user_id: auth.userId, item_key: key }, { onConflict: "user_id,item_key" });
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("roadmap_progress")
        .delete()
        .eq("user_id", auth.userId)
        .eq("item_key", key);
      if (error) throw error;
    }
    return Response.json({ ok: true });
  } catch (err) {
    console.error("Roadmap POST error:", err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
