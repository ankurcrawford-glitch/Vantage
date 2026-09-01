// app/api/support/route.js
// ─── Vantage — support requests ──────────────────────────────────
// POST { message, email?, page?, website? } → emails the admin inbox
// via Resend with reply-to set to the student's address, so replying
// in Gmail just works. Open to signed-out users too (the person who
// can't log in is exactly who needs this). Honeypot field ("website")
// + length caps keep drive-by spam out.

import { Resend } from "resend";
import { getAdminClient } from "@/lib/auth";

const ADMIN_EMAIL = process.env.SUPPORT_EMAIL || process.env.DIGEST_ADMIN_EMAIL || "ankur.crawford@gmail.com";

const esc = (s) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Bad request" }, { status: 400 });
    }

    // Honeypot: real users never fill this hidden field.
    if (String(body?.website ?? "").trim() !== "") {
      return Response.json({ ok: true });
    }

    const message = String(body?.message ?? "").trim().slice(0, 4000);
    const email = String(body?.email ?? "").trim().slice(0, 200);
    const page = String(body?.page ?? "").trim().slice(0, 300);

    if (message.length < 5) {
      return Response.json({ error: "Tell us a little more about the problem." }, { status: 400 });
    }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) {
      return Response.json({ error: "Add an email address so we can get back to you." }, { status: 400 });
    }

    // Persist first (best-effort) so /admin/support never misses one
    // even if the email hiccups.
    try {
      const supabase = getAdminClient();
      await supabase.from("support_requests").insert({ email, message, page });
    } catch (e) {
      console.error("support insert failed:", e);
    }

    const resend = new Resend(process.env.RESEND_API_KEY || "placeholder");
    await resend.emails.send({
      from: "Vantage Support <noreply@my-vantage.app>",
      to: ADMIN_EMAIL,
      replyTo: email,
      subject: `Support: ${message.slice(0, 60)}${message.length > 60 ? "…" : ""}`,
      html: `<div style="font-family:Georgia,serif;max-width:640px;color:#1a1a1a">
        <h2 style="margin:0 0 12px">Support request</h2>
        <p style="margin:0 0 4px"><strong>From:</strong> ${esc(email)}</p>
        ${page ? `<p style="margin:0 0 4px"><strong>Page:</strong> ${esc(page)}</p>` : ""}
        <p style="margin:0 0 16px;color:#666">${new Date().toUTCString()}</p>
        <div style="border-left:3px solid #C9A977;padding:8px 16px;white-space:pre-wrap">${esc(message)}</div>
        <p style="margin:16px 0 0;color:#999;font-size:12px">Reply to this email to answer them directly.</p>
      </div>`,
    });

    return Response.json({ ok: true });
  } catch (err) {
    console.error("support route error:", err);
    return Response.json({ error: "Couldn't send that. Please email support directly." }, { status: 500 });
  }
}
