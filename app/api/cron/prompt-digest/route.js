// app/api/cron/prompt-digest/route.js
// ─── Weekly senior digest: which colleges' prompts are out ───────
// Vercel Cron hits this every Friday evening. Emails every grade-12
// student (unless opted out) a summary of colleges whose 2026-27
// supplemental prompts were released in the last 7 days, plus the
// running list of everything already out.
//
// Setup: set CRON_SECRET in Vercel env; vercel.json schedules the call.
// Vercel sends "Authorization: Bearer <CRON_SECRET>" automatically.

import crypto from "crypto";
import { Resend } from "resend";
import { getAdminClient, escapeHtml } from "@/lib/auth";

const CYCLE = "2026-27";
const MAX_RECIPIENTS = 500;

function unsubscribeSig(userId) {
  return crypto
    .createHmac("sha256", process.env.CRON_SECRET || "")
    .update(String(userId))
    .digest("hex");
}

export async function GET(request) {
  // Only Vercel Cron (or someone with the secret) may trigger sends.
  const auth = request.headers.get("authorization") || "";
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getAdminClient();

    // 1) Released prompts for the current cycle, grouped by college.
    const { data: prompts, error: pErr } = await supabase
      .from("college_prompts")
      .select("college_id, released_at, colleges(name)")
      .eq("cycle", CYCLE)
      .not("released_at", "is", null);
    if (pErr) throw pErr;

    const byCollege = new Map();
    for (const p of prompts || []) {
      const name = p.colleges?.name || "Unknown";
      const cur = byCollege.get(name) || { count: 0, released_at: p.released_at };
      cur.count += 1;
      if (p.released_at > cur.released_at) cur.released_at = p.released_at;
      byCollege.set(name, cur);
    }

    const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const fresh = [];
    const alreadyOut = [];
    for (const [name, info] of [...byCollege.entries()].sort()) {
      (info.released_at >= weekAgo ? fresh : alreadyOut).push({ name, count: info.count });
    }

    // Nothing new this week → no email. (Quiet weeks stay quiet.)
    if (fresh.length === 0) {
      return Response.json({ ok: true, sent: 0, reason: "no new prompts this week" });
    }

    // 2) Recipients: grade-12 students who haven't opted out.
    const { data: seniors, error: sErr } = await supabase
      .from("user_stats")
      .select("user_id")
      .eq("grade", 12)
      .or("digest_opt_out.is.null,digest_opt_out.eq.false")
      .limit(MAX_RECIPIENTS);
    if (sErr) throw sErr;

    const resend = new Resend(process.env.RESEND_API_KEY || "placeholder");
    const site = "https://my-vantage.app";

    const freshHtml = fresh
      .map((c) => `<li><strong>${escapeHtml(c.name)}</strong> — ${c.count} prompt${c.count === 1 ? "" : "s"}</li>`)
      .join("");
    const outHtml = alreadyOut.length
      ? `<p style="margin:18px 0 6px;color:#555">Already out: ${alreadyOut
          .map((c) => escapeHtml(c.name))
          .join(", ")}.</p>`
      : "";

    let sent = 0;
    for (const row of seniors || []) {
      const { data: u } = await supabase.auth.admin.getUserById(row.user_id);
      const email = u?.user?.email;
      if (!email) continue;

      const unsub = `${site}/api/digest-unsubscribe?uid=${row.user_id}&sig=${unsubscribeSig(row.user_id)}`;
      await resend.emails.send({
        from: "Vantage <noreply@my-vantage.app>",
        to: email,
        subject: `New essay prompts out this week: ${fresh.map((c) => c.name).slice(0, 3).join(", ")}${fresh.length > 3 ? "…" : ""}`,
        html: `
          <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#1a1a1a">
            <p style="letter-spacing:2px;font-size:12px;color:#8a744d">VANTAGE · WEEKLY PROMPT WATCH</p>
            <p>These colleges released their ${CYCLE} supplemental essay prompts this week:</p>
            <ul>${freshHtml}</ul>
            ${outHtml}
            <p><a href="${site}/colleges" style="color:#8a744d">Open Vantage</a> to see the prompts and start drafting — early drafts beat deadline drafts.</p>
            <p style="font-size:12px;color:#888;margin-top:28px">
              You're getting this because you're a senior on Vantage.
              <a href="${unsub}" style="color:#888">Unsubscribe from the weekly prompt watch</a>.
            </p>
          </div>`,
      });
      sent += 1;
    }

    return Response.json({ ok: true, sent, fresh: fresh.length, alreadyOut: alreadyOut.length });
  } catch (err) {
    console.error("Prompt digest error:", err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
