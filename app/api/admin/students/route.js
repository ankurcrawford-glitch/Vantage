// app/api/admin/students/route.js
// ─── Vantage — admin: student activity roll-up ───────────────────
// GET → one row per student: who they are, when they signed up and last
// signed in, and what they've done (essays, Story Builder, Strategic
// Intelligence, Round Table, counselor, Spark, activities). Plus totals.
// Admin-only (SUPPORT_ADMIN_EMAILS). Read-only; service role bypasses RLS.

import { getAuthedUser, getAdminClient } from "@/lib/auth";
import { effectiveGrade } from "@/lib/grade";

const ADMINS = (process.env.SUPPORT_ADMIN_EMAILS || "ankur.crawford@gmail.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const COMMON_APP_COLLEGE_ID = "a0000000-0000-0000-0000-000000000000";

async function requireAdmin(request) {
  const auth = await getAuthedUser(request);
  if (!auth.ok) return { ok: false, response: auth.response };
  const email = String(auth.email || auth.user?.email || "").toLowerCase();
  if (!ADMINS.includes(email)) {
    return { ok: false, response: Response.json({ error: "Not authorized" }, { status: 403 }) };
  }
  return { ok: true };
}

const countBy = (rows, key = "user_id") => {
  const m = new Map();
  for (const r of rows || []) m.set(r[key], (m.get(r[key]) || 0) + 1);
  return m;
};
const latestBy = (rows, key = "user_id", ts = "created_at") => {
  const m = new Map();
  for (const r of rows || []) {
    const cur = m.get(r[key]);
    if (!cur || r[ts] > cur) m.set(r[key], r[ts]);
  }
  return m;
};

export async function GET(request) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.response;
  try {
    const supabase = getAdminClient();

    // All auth users (paginated).
    const users = [];
    for (let page = 1; ; page++) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
      if (error) throw error;
      users.push(...data.users);
      if (data.users.length < 200) break;
    }

    const [
      { data: stats },
      { data: colleges },
      { data: answers },
      { data: essays },
      { data: versions },
      { data: guidance },
      { data: convo },
      { data: counselorMsgs },
      { data: spark },
      { data: acts },
      { data: subs },
    ] = await Promise.all([
      supabase.from("user_stats").select("user_id, grade, class_of, gpa_weighted, sat_score"),
      supabase.from("user_colleges").select("user_id, application_plan, app_status"),
      supabase.from("discovery_answers").select("user_id"),
      supabase.from("essays").select("id, user_id, college_prompt_id, college_prompts(college_id)"),
      supabase.from("essay_versions").select("essay_id, created_at"),
      supabase.from("strategic_guidance_history").select("user_id, mode, created_at"),
      supabase.from("conversation_messages").select("user_id, role, created_at"),
      supabase.from("counselor_messages").select("user_id, role, created_at"),
      supabase.from("foundations_spark_entries").select("user_id, created_at"),
      supabase.from("user_extracurriculars").select("user_id"),
      supabase.from("user_subscriptions").select("user_id, status"),
    ]);

    const statsById = new Map((stats || []).map((s) => [s.user_id, s]));
    const collegesById = new Map();
    for (const c of colleges || []) {
      const cur = collegesById.get(c.user_id) || { count: 0, ed: 0, submitted: 0 };
      cur.count += 1;
      if (c.application_plan && c.application_plan !== "RD") cur.ed += 1;
      if (c.app_status === "submitted" || c.app_status === "decision") cur.submitted += 1;
      collegesById.set(c.user_id, cur);
    }
    const answersById = countBy(answers);
    const essayOwner = new Map((essays || []).map((e) => [e.id, e.user_id]));
    const essaysById = new Map();
    for (const e of essays || []) {
      const cur = essaysById.get(e.user_id) || { total: 0, commonApp: 0 };
      cur.total += 1;
      if (e.college_prompts?.college_id === COMMON_APP_COLLEGE_ID) cur.commonApp += 1;
      essaysById.set(e.user_id, cur);
    }
    const versionsById = new Map();
    const lastSaveById = new Map();
    for (const v of versions || []) {
      const uid = essayOwner.get(v.essay_id);
      if (!uid) continue;
      versionsById.set(uid, (versionsById.get(uid) || 0) + 1);
      if (!lastSaveById.get(uid) || v.created_at > lastSaveById.get(uid)) lastSaveById.set(uid, v.created_at);
    }
    const siById = countBy((guidance || []).filter((g) => g.mode !== "round_table"));
    const rtById = countBy((guidance || []).filter((g) => g.mode === "round_table"));
    const lastRtById = latestBy((guidance || []).filter((g) => g.mode === "round_table"));
    const convoById = countBy((convo || []).filter((m) => m.role === "user"));
    const counselorById = countBy((counselorMsgs || []).filter((m) => m.role === "user"));
    const sparkById = countBy(spark);
    const actsById = countBy(acts);
    const subById = new Map((subs || []).map((s) => [s.user_id, s.status]));

    // "Last active" = the most recent thing we can see them doing.
    const lastActivityById = new Map();
    const bump = (uid, ts) => {
      if (!uid || !ts) return;
      if (!lastActivityById.get(uid) || ts > lastActivityById.get(uid)) lastActivityById.set(uid, ts);
    };
    for (const [uid, ts] of lastSaveById) bump(uid, ts);
    for (const g of guidance || []) bump(g.user_id, g.created_at);
    for (const m of convo || []) if (m.role === "user") bump(m.user_id, m.created_at);
    for (const m of counselorMsgs || []) if (m.role === "user") bump(m.user_id, m.created_at);
    for (const s of spark || []) bump(s.user_id, s.created_at);

    const students = users.map((u) => {
      const s = statsById.get(u.id);
      const grade = effectiveGrade(s);
      const col = collegesById.get(u.id) || { count: 0, ed: 0, submitted: 0 };
      const es = essaysById.get(u.id) || { total: 0, commonApp: 0 };
      const lastActive = [u.last_sign_in_at, lastActivityById.get(u.id)].filter(Boolean).sort().pop() || null;
      return {
        id: u.id,
        name: u.user_metadata?.full_name || null,
        email: u.email,
        grade,
        class_of: s?.class_of ?? null,
        gpa: s?.gpa_weighted ?? null,
        sat: s?.sat_score ?? null,
        subscription: subById.get(u.id) || null,
        signed_up: u.created_at,
        last_sign_in: u.last_sign_in_at || null,
        last_active: lastActive,
        schools: col.count,
        early_plans: col.ed,
        submitted: col.submitted,
        story_answers: answersById.get(u.id) || 0,
        essays: es.total,
        common_app_essays: es.commonApp,
        essay_versions: versionsById.get(u.id) || 0,
        last_essay_save: lastSaveById.get(u.id) || null,
        si_runs: siById.get(u.id) || 0,
        round_tables: rtById.get(u.id) || 0,
        last_round_table: lastRtById.get(u.id) || null,
        conversation_msgs: convoById.get(u.id) || 0,
        counselor_qs: counselorById.get(u.id) || 0,
        spark_entries: sparkById.get(u.id) || 0,
        activities: actsById.get(u.id) || 0,
      };
    });
    students.sort((a, b) => (b.last_active || "").localeCompare(a.last_active || ""));

    const now = Date.now();
    const days = (iso) => (iso ? (now - new Date(iso).getTime()) / 86400000 : Infinity);
    const summary = {
      total: students.length,
      new_7d: students.filter((s) => days(s.signed_up) <= 7).length,
      new_30d: students.filter((s) => days(s.signed_up) <= 30).length,
      active_7d: students.filter((s) => days(s.last_active) <= 7).length,
      active_30d: students.filter((s) => days(s.last_active) <= 30).length,
      by_grade: students.reduce((m, s) => { const k = s.grade ?? "unset"; m[k] = (m[k] || 0) + 1; return m; }, {}),
      round_tables_7d: (guidance || []).filter((g) => g.mode === "round_table" && days(g.created_at) <= 7).length,
      essay_saves_7d: (versions || []).filter((v) => days(v.created_at) <= 7).length,
    };

    return Response.json({ summary, students, generated_at: new Date().toISOString() });
  } catch (err) {
    console.error("admin students error:", err);
    return Response.json({ error: `Couldn't load students: ${err?.message || err}` }, { status: 500 });
  }
}
