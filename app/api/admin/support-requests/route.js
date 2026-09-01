// app/api/admin/support-requests/route.js
// ─── Vantage — admin: support request list ───────────────────────
// GET  → all support requests, open first.
// PATCH { id, status } → mark open/closed.
// Admin-only: the signed-in user's email must be in SUPPORT_ADMIN_EMAILS
// (comma-separated; defaults to the owner's address).

import { getAuthedUser, getAdminClient } from "@/lib/auth";

const ADMINS = (process.env.SUPPORT_ADMIN_EMAILS || "ankur.crawford@gmail.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

async function requireAdmin(request) {
  const auth = await getAuthedUser(request);
  if (!auth.ok) return { ok: false, response: auth.response };
  const email = String(auth.email || auth.user?.email || "").toLowerCase();
  if (!ADMINS.includes(email)) {
    return { ok: false, response: Response.json({ error: "Not authorized" }, { status: 403 }) };
  }
  return { ok: true };
}

export async function GET(request) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.response;
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("support_requests")
      .select("id, email, message, page, status, created_at")
      .order("status", { ascending: false }) // 'open' after 'closed' alphabetically — fix in JS below
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    const rows = (data || []).sort((a, b) =>
      a.status === b.status ? 0 : a.status === "open" ? -1 : 1
    );
    return Response.json({ requests: rows });
  } catch (err) {
    console.error("admin support list error:", err);
    return Response.json({ error: "Couldn't load requests" }, { status: 500 });
  }
}

export async function PATCH(request) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.response;
  try {
    const body = await request.json();
    const id = String(body?.id ?? "");
    const status = body?.status === "closed" ? "closed" : "open";
    if (!id) return Response.json({ error: "Missing id" }, { status: 400 });
    const supabase = getAdminClient();
    const { error } = await supabase.from("support_requests").update({ status }).eq("id", id);
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (err) {
    console.error("admin support patch error:", err);
    return Response.json({ error: "Couldn't update" }, { status: 500 });
  }
}
