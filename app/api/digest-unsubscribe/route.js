// app/api/digest-unsubscribe/route.js
// One-click unsubscribe for the weekly prompt digest. The link carries
// an HMAC signature (keyed by CRON_SECRET) so only real recipients can
// flip their own flag — no auth session required from an email client.

import crypto from "crypto";
import { getAdminClient } from "@/lib/auth";

export async function GET(request) {
  const url = new URL(request.url);
  const uid = url.searchParams.get("uid") || "";
  const sig = url.searchParams.get("sig") || "";

  const expected = crypto
    .createHmac("sha256", process.env.CRON_SECRET || "")
    .update(uid)
    .digest("hex");

  const valid =
    uid &&
    sig.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));

  if (!valid) {
    return new Response("Invalid unsubscribe link.", { status: 400 });
  }

  try {
    const supabase = getAdminClient();
    await supabase.from("user_stats").update({ digest_opt_out: true }).eq("user_id", uid);
  } catch (err) {
    console.error("Unsubscribe error:", err);
    return new Response("Something went wrong — try again later.", { status: 500 });
  }

  return new Response(
    `<html><body style="font-family:Georgia,serif;background:#0B1320;color:#E8DDC9;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
      <div style="text-align:center"><h2>You're unsubscribed.</h2>
      <p style="color:#8B93A7">No more weekly prompt emails. You can keep checking prompts any time in Vantage.</p></div>
     </body></html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}
