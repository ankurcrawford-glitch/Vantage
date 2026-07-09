// app/api/cron/prompt-digest/route.js
// ─── Weekly senior email: prompt watch + tip of the week ─────────
// Vercel Cron hits this every Friday evening. Every grade-12 student
// (unless opted out) gets one email: a seasonal tip that's always
// useful, plus which colleges released 2026-27 supplemental prompts
// this week and the running list of everything already out.
// Ankur (admin) gets a copy of every send.
//
// Setup: set CRON_SECRET in Vercel env; vercel.json schedules the call.
// Vercel sends "Authorization: Bearer <CRON_SECRET>" automatically.

import crypto from "crypto";
import { Resend } from "resend";
import { getAdminClient, escapeHtml } from "@/lib/auth";

const CYCLE = "2026-27";
const MAX_RECIPIENTS = 500;
const ADMIN_EMAIL = process.env.DIGEST_ADMIN_EMAIL || "ankur.crawford@gmail.com";

// Seasonal guidance for seniors — one per month, rotating weekly within
// the month so four Fridays don't repeat. Written for the class of 2027.
const TIPS = {
  6: [ // July
    "Lock your college list to 8\u201312 schools this month. Every school you add after August costs you essay time you won't have.",
    "Draft your Common App personal statement NOW, while there's no homework. A rough 650 words in July beats a rushed draft in October.",
    "Make a spreadsheet (or use your Vantage list) of every application plan you're considering \u2014 ED, EA, rolling \u2014 and their deadlines.",
    "Ask two teachers for recommendation letters before school starts. Teachers get flooded in September; July asks get better letters.",
  ],
  7: [ // August
    "The Common App refreshed August 1 \u2014 create your account, fill the boring sections (activities, demographics) this week.",
    "Supplemental prompts are dropping weekly now. Start with your ED/EA school's essays \u2014 those deadlines come first.",
    "Write your activities list with verbs and numbers: 'Organized 12-person fundraiser, raised $3,400' beats 'member of club.'",
    "If you're applying ED anywhere, tell your counselor and recommenders now \u2014 their materials are due when yours are.",
  ],
  8: [ // September
    "November 1 is closer than it feels. Work backwards: final essay drafts by mid-October means first drafts THIS month.",
    "Request official test score sends now if your schools need them \u2014 processing takes weeks in the fall crunch.",
    "Every supplemental 'Why us?' essay needs one specific professor, program, or tradition. Generic praise is a rejection letter.",
    "Check your application portals weekly \u2014 missing-document emails land in spam constantly.",
  ],
  9: [ // October
    "ED/EA deadlines are November 1. Submit 48 hours early \u2014 portals crash on deadline night every single year.",
    "Have one adult read your personal statement for typos only. Don't let anyone sand off your voice this late.",
    "Finish your FAFSA and CSS Profile now if your schools need them for early plans.",
    "Breathe. A calm, complete application beats a frantic, gilded one.",
  ],
};

function tipForNow(d = new Date()) {
  const monthTips = TIPS[d.getMonth()] ||
    ["Keep momentum: 30 minutes on your applications today beats 3 hours of panic later."];
  const week = Math.min(3, Math.floor((d.getDate() - 1) / 7));
  return monthTips[week % monthTips.length];
}

function unsubscribeSig(userId) {
  return crypto
    .createHmac("sha256", process.env.CRON_SECRET || "")
    .update(String(userId))
    .digest("hex");
}

// Approval flow: the Friday cron does NOT email students directly. It sends
// Ankur a preview with an approval link; clicking that link (valid for the
// current week) triggers the actual send to seniors.
function weekToken() {
  const d = new Date();
  const onejan = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d - onejan) / 86400000 + onejan.getDay() + 1) / 7);
  return crypto
    .createHmac("sha256", process.env.CRON_SECRET || "")
    .update(`digest-${d.getFullYear()}-W${week}`)
    .digest("hex");
}

export async function GET(request) {
  const auth = request.headers.get("authorization") || "";
  const confirm = new URL(request.url).searchParams.get("confirm") || "";
  const expected = weekToken();
  const isApproval =
    confirm.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(confirm), Buffer.from(expected));
  const isCron = auth === `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || (!isCron && !isApproval)) {
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
    const tip = tipForNow();

    const tipHtml = `
      <p style="letter-spacing:2px;font-size:11px;color:#8a744d;margin:22px 0 6px">THIS WEEK'S MOVE</p>
      <p style="font-size:16px;line-height:1.6;margin:0">${escapeHtml(tip)}</p>`;

    const freshHtml = fresh.length
      ? `<p style="letter-spacing:2px;font-size:11px;color:#8a744d;margin:26px 0 6px">NEW PROMPTS THIS WEEK</p>
         <ul style="margin:6px 0">${fresh
           .map((c) => `<li><strong>${escapeHtml(c.name)}</strong> \u2014 ${c.count} prompt${c.count === 1 ? "" : "s"}</li>`)
           .join("")}</ul>`
      : "";
    const outHtml = alreadyOut.length
      ? `<p style="margin:14px 0 0;font-size:13px;color:#555">Already out for ${CYCLE}: ${alreadyOut
          .map((c) => escapeHtml(c.name))
          .join(", ")}.</p>`
      : "";

    const subject = fresh.length
      ? `New essay prompts out: ${fresh.map((c) => c.name).slice(0, 3).join(", ")}${fresh.length > 3 ? "\u2026" : ""}`
      : "Your week in college apps \u2014 one move that matters";

    const bodyFor = (unsubLink) => `
      <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#1a1a1a">
        <p style="letter-spacing:2px;font-size:12px;color:#8a744d">VANTAGE \u00b7 FRIDAY BRIEF</p>
        ${tipHtml}
        ${freshHtml}
        ${outHtml}
        <p style="margin-top:22px"><a href="${site}/applications" style="color:#8a744d">Open Vantage</a> and put 30 minutes on it this weekend.</p>
        <p style="font-size:12px;color:#888;margin-top:28px">
          You're getting this because you're a senior on Vantage.
          ${unsubLink ? `<a href="${unsubLink}" style="color:#888">Unsubscribe</a>.` : ""}
        </p>
      </div>`;

    // Preview mode (cron run, not yet approved): email Ankur only.
    if (!isApproval) {
      const approveUrl = `${site}/api/cron/prompt-digest?confirm=${expected}`;
      await resend.emails.send({
        from: "Vantage <noreply@my-vantage.app>",
        to: ADMIN_EMAIL,
        subject: `[APPROVE to send · ${(seniors || []).length} seniors] ${subject}`,
        html: `
          <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto">
            <p style="background:#fff7e6;border:1px solid #e0c98f;padding:12px 16px;border-radius:6px">
              <strong>Preview — nothing sent to students yet.</strong><br/>
              This is what ${(seniors || []).length} senior${(seniors || []).length === 1 ? "" : "s"} will receive.
              <a href="${approveUrl}" style="color:#8a744d;font-weight:bold">Approve &amp; send now</a>
              (link valid through Sunday). To skip this week, simply do nothing.
            </p>
          </div>
          ${bodyFor(null)}`,
      });
      return Response.json({ ok: true, mode: "preview", awaitingApproval: true, recipients: (seniors || []).length });
    }

    let sent = 0;
    for (const row of seniors || []) {
      const { data: u } = await supabase.auth.admin.getUserById(row.user_id);
      const email = u?.user?.email;
      if (!email) continue;
      const unsub = `${site}/api/digest-unsubscribe?uid=${row.user_id}&sig=${unsubscribeSig(row.user_id)}`;
      await resend.emails.send({
        from: "Vantage <noreply@my-vantage.app>",
        to: email,
        subject,
        html: bodyFor(unsub),
      });
      sent += 1;
    }

    // Admin copy — always, so Ankur sees exactly what students got.
    await resend.emails.send({
      from: "Vantage <noreply@my-vantage.app>",
      to: ADMIN_EMAIL,
      subject: `[Admin copy \u00b7 sent to ${sent}] ${subject}`,
      html: bodyFor(null),
    });

    // Approval clicks come from a browser — show a human-readable result.
    return new Response(
      `<html><body style="font-family:Georgia,serif;background:#0B1320;color:#E8DDC9;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
        <div style="text-align:center"><h2>Sent.</h2>
        <p style="color:#8B93A7">The Friday brief went out to ${sent} senior${sent === 1 ? "" : "s"}. A copy is in your inbox.</p></div>
       </body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  } catch (err) {
    console.error("Prompt digest error:", err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
