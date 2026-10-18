// scripts/send-grade-email.mjs
//
// One-off grade-segmented email to Vantage students, sent through Resend.
// Run from the repo root in PowerShell. Keys are read from .env.local
// (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY) —
// add RESEND_API_KEY=... there once and never paste keys again.
//
//   node scripts/send-grade-email.mjs --template seniors --dry-run   # list recipients, send nothing
//   node scripts/send-grade-email.mjs --template seniors             # actually send
//
// Recipients are chosen by grade: user_stats.class_of (seniors = 2027,
// juniors = 2028, sophomores = 2029), falling back to the legacy
// user_stats.grade column for rows that predate class_of. Students with
// neither are skipped. Addresses in
// EXCLUDE are always skipped. --to someone@example.com sends ONLY to that
// address (for a test send to yourself). --also a@x.com,b@y.com adds those
// accounts to the recipient list regardless of their grade.

import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { readFileSync } from "node:fs";

// Read keys from .env.local in the repo root (never committed) so nothing
// has to be pasted into PowerShell. Values already in the environment win.
try {
  for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m || line.trim().startsWith("#")) continue;
    const val = m[2].replace(/^["']|["']$/g, "");
    if (!process.env[m[1]]) process.env[m[1]] = val;
  }
} catch {
  // no .env.local — fall back to whatever is in the environment
}

const EXCLUDE = new Set([
  "acrawford@alger.com", // test student
  "ankur.crawford@gmail.com",
]);

const TEMPLATES = {
  seniors: {
    classOf: [2027],
    grades: [12],
    subject: "Applying ED? Use the Round Table before you submit",
    text: (first) => `Hi ${first},

If you're applying Early Decision, your application goes in around November 1 and the decision is binding. You get one shot at that school. So before you hit submit, use the Round Table in Vantage.

WHERE TO FIND IT: click "Round Table" in the top menu of Vantage. It lists each of your schools and shows which ones are ready. Click a school to go straight to its Round Table. (It is also on each school's page under the essay prompts.)

Here's what it does. An admissions committee won't read your Common App essay, your supplements, your activities and your profile as separate pieces. They read all of it together, in a few minutes, and form one impression. The Round Table is that reading, done for you, before it counts. It takes everything you've written for that one school and judges it in that school's terms.

It catches the things you can't see from inside a single essay: two essays telling the same story, a thread you set up in one piece and dropped in the next, a supplement that could have been written by anyone. Then it gives you the committee's honest verdict: what carries the application, what's missing, and the one change to make.

It unlocks once every supplement for that school is near full length (at least 80% of the word limit) and saved. Run it at least a week before the deadline so you have time to act on what it says. Fix what it flags, then run it again.

https://www.my-vantage.app/round-table

My Vantage. Your advantage.
https://www.my-vantage.app`,
    html: (first) => `<div style="font-family:Georgia,serif;font-size:16px;line-height:1.6;color:#1a1a1a;max-width:600px">
<p>Hi ${first},</p>
<p>If you're applying Early Decision, your application goes in around November 1 and the decision is binding. You get one shot at that school. So before you hit submit, use the <strong>Round Table</strong> in Vantage.</p>
<p><strong>Where to find it: click "Round Table" in the top menu of Vantage.</strong> It lists each of your schools and shows which ones are ready. Click a school to go straight to its Round Table. (It is also on each school's page, under the essay prompts.)</p>
<p>Here's what it does. An admissions committee won't read your Common App essay, your supplements, your activities and your profile as separate pieces. They read all of it together, in a few minutes, and form one impression. The Round Table is that reading, done for you, before it counts. It takes everything you've written for that one school and judges it in that school's terms.</p>
<p>It catches the things you can't see from inside a single essay: two essays telling the same story, a thread you set up in one piece and dropped in the next, a supplement that could have been written by anyone. Then it gives you the committee's honest verdict: what carries the application, what's missing, and the one change to make.</p>
<p>It unlocks once every supplement for that school is near full length (at least 80% of the word limit) and saved. Run it at least a week before the deadline so you have time to act on what it says. Fix what it flags, then run it again.</p>
<p><a href="https://www.my-vantage.app/round-table" style="color:#8a6d3b"><strong>Open the Round Table &rarr;</strong></a></p>
<p style="margin-top:28px;color:#555"><em>My Vantage. Your advantage.</em><br><a href="https://www.my-vantage.app" style="color:#8a6d3b">my-vantage.app</a></p>
</div>`,
  },
  seniors2: {
    classOf: [2027],
    grades: [12],
    subject: "2 weeks to ED: the Round Table is your adVANTAGE",
    text: (first) => `Hi ${first},

Two weeks to November 1. A check-in for everyone applying early.

One ask: log in to Vantage this weekend and paste in whatever you have for your Common App essay, even if it's rough.

Then run the ROUND TABLE. Here's what it is: a simulated admissions committee that reads your whole application for one school at once - your Common App essay, every supplement, your activities - the way the real committee will. It tells you what's carrying the application, what's missing, and the one change to make. It's in the top menu of Vantage, and it unlocks for a school once that school's essays are near full length.

If you're not applying early, or you've already submitted, just reply and say so. And if you're stuck on anything - a prompt, a school choice, the essay itself - reply to this email and a real person will help.

My Vantage. Your advantage.
https://www.my-vantage.app`,
    html: (first) => `<div style="font-family:Georgia,serif;font-size:16px;line-height:1.6;color:#1a1a1a;max-width:600px">
<p>Hi ${first},</p>
<p>Two weeks to November 1. A check-in for everyone applying early.</p>
<p>One ask: log in to Vantage this weekend and paste in whatever you have for your Common App essay, even if it's rough.</p>
<p>Then run the <strong>Round Table</strong>. Here's what it is: a simulated admissions committee that reads your whole application for one school at once &mdash; your Common App essay, every supplement, your activities &mdash; the way the real committee will. It tells you <strong>what's carrying the application, what's missing, and the one change to make.</strong> It's in the top menu of Vantage, and it unlocks for a school once that school's essays are near full length.</p>
<p><a href="https://www.my-vantage.app/round-table" style="color:#8a6d3b"><strong>Open the Round Table &rarr;</strong></a></p>
<p>If you're not applying early, or you've already submitted, just reply and say so. And if you're stuck on anything &mdash; a prompt, a school choice, the essay itself &mdash; reply to this email and a real person will help.</p>
<p style="margin-top:28px;color:#555"><em>My Vantage. Your advantage.</em><br><a href="https://www.my-vantage.app" style="color:#8a6d3b">my-vantage.app</a></p>
</div>`,
  },
  nograde: {
    classOf: [],
    grades: [],
    noGrade: true, // students with no class_of and no legacy grade
    subject: "One quick thing so Vantage fits your year",
    text: (first) => `Hi ${first},

Vantage works differently depending on where you are in high school: sophomores and juniors get Foundations (your counselor, Spark, your roadmap), and seniors get the application side (essays, strategy, the Round Table). Right now your account doesn't have a grade on it, so you'll get a generic version of everything.

It takes ten seconds to fix. Log in and set your grade, and we can really make Vantage your advantage.

Set my grade: https://www.my-vantage.app/gateway

If anything's unclear or you've forgotten your login, reply to this email and I'll sort it out.

My Vantage. Your advantage.
https://www.my-vantage.app`,
    html: (first) => `<div style="font-family:Georgia,serif;font-size:16px;line-height:1.6;color:#1a1a1a;max-width:600px">
<p>Hi ${first},</p>
<p>Vantage works differently depending on where you are in high school: sophomores and juniors get Foundations (your counselor, Spark, your roadmap), and seniors get the application side (essays, strategy, the Round Table). Right now your account doesn't have a grade on it, so you'll get a generic version of everything.</p>
<p>It takes ten seconds to fix. <strong>Log in and set your grade</strong>, and we can really make Vantage your advantage.</p>
<p><a href="https://www.my-vantage.app/gateway" style="color:#8a6d3b"><strong>Set my grade &rarr;</strong></a></p>
<p>If anything's unclear or you've forgotten your login, reply to this email and I'll sort it out.</p>
<p style="margin-top:28px;color:#555"><em>My Vantage. Your advantage.</em><br><a href="https://www.my-vantage.app" style="color:#8a6d3b">my-vantage.app</a></p>
</div>`,
  },
  underclassmen: {
    classOf: [2028, 2029],
    grades: [10, 11],
    subject: "Five honest minutes this month",
    text: (first) => `Hi ${first},

A lot happens in a month that nobody writes down. The conversation you didn't want to have. The thing you figured out the hard way. The small win nobody else noticed. Those moments are the real record of who you're becoming, and they fade fast unless you catch them. Spark is where you catch them: one question a month, five minutes, in your own words.

Your October Spark is waiting, and this month's question is a good one: What's the hardest conversation you had recently?

Nobody grades it. Nobody reads it but you. It doesn't need a point or a lesson. It just needs to be true.

And here's the quiet payoff down the road: when you're a senior and someone asks you to write about yourself, you won't be staring at a blank box trying to remember your own life. You'll have a vault of real moments, in your own voice, that no prompt can scare.

Start now and you'll have 20-plus by the time it counts.

Open your Spark: https://www.my-vantage.app/foundations/spark
(In Vantage: Foundations, then Spark.)

And while you're there: check in with your counselor and tell it how things are going, and log your activities as they happen. Everything you put in now is what your story is built from later.

My Vantage. Your advantage.
https://www.my-vantage.app`,
    html: (first) => `<div style="font-family:Georgia,serif;font-size:16px;line-height:1.6;color:#1a1a1a;max-width:600px">
<p>Hi ${first},</p>
<p>A lot happens in a month that nobody writes down. The conversation you didn't want to have. The thing you figured out the hard way. The small win nobody else noticed. Those moments are the real record of who you're becoming, and they fade fast unless you catch them. Spark is where you catch them: one question a month, five minutes, in your own words.</p>
<p>Your October Spark is waiting, and this month's question is a good one: <strong>What's the hardest conversation you had recently?</strong></p>
<p>Nobody grades it. Nobody reads it but you. It doesn't need a point or a lesson. It just needs to be true.</p>
<p>And here's the quiet payoff down the road: when you're a senior and someone asks you to write about yourself, you won't be staring at a blank box trying to remember your own life. You'll have a vault of real moments, in your own voice, that no prompt can scare.</p>
<p>Start now and you'll have 20-plus by the time it counts.</p>
<p><a href="https://www.my-vantage.app/foundations/spark" style="color:#8a6d3b"><strong>Open your Spark &rarr;</strong></a><br><span style="color:#555;font-size:14px">In Vantage: Foundations &rarr; Spark.</span></p>
<p>And while you're there: <strong>check in with your counselor</strong> and tell it how things are going, and <strong>log your activities</strong> as they happen. Everything you put in now is what your story is built from later.</p>
<p style="margin-top:28px;color:#555"><em>My Vantage. Your advantage.</em><br><a href="https://www.my-vantage.app" style="color:#8a6d3b">my-vantage.app</a></p>
</div>`,
  },
};

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
};
const templateName = flag("--template");
const dryRun = args.includes("--dry-run");
const onlyTo = flag("--to");
const also = (flag("--also") || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);

const template = TEMPLATES[templateName];
if (!template) {
  console.error(`--template must be one of: ${Object.keys(TEMPLATES).join(", ")}`);
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendKey = process.env.RESEND_API_KEY;
if (!url || !serviceKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment.");
  process.exit(1);
}
if (!dryRun && !resendKey) {
  console.error("Add RESEND_API_KEY=... to .env.local (or use --dry-run).");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

// All auth users (paginated) joined to user_stats.class_of.
const users = [];
for (let page = 1; ; page++) {
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
  if (error) throw error;
  users.push(...data.users);
  if (data.users.length < 200) break;
}
const { data: stats, error: statsErr } = await supabase.from("user_stats").select("user_id, class_of, grade");
if (statsErr) throw statsErr;
const statsById = new Map(stats.map((s) => [s.user_id, s]));
// Same rule as lib/grade.ts: class_of wins; legacy grade is the fallback.
const matches = (u) => {
  const s = statsById.get(u.id);
  if (template.noGrade) return !s || (s.class_of == null && s.grade == null);
  if (!s) return false;
  if (s.class_of != null) return template.classOf.includes(s.class_of);
  return template.grades.includes(s.grade);
};
const label = (u) => {
  const s = statsById.get(u.id);
  if (!s || (s.class_of == null && s.grade == null)) return "no grade";
  return s.class_of != null ? `class of ${s.class_of}` : `grade ${s.grade} (legacy)`;
};

const firstName = (u) => {
  const full = (u.user_metadata?.full_name || "").trim();
  return full ? full.split(/\s+/)[0] : "there";
};

let recipients = users
  .filter((u) => u.email && !EXCLUDE.has(u.email.toLowerCase()))
  .filter((u) => matches(u) || also.includes(u.email.toLowerCase()))
  .map((u) => ({ email: u.email, first: firstName(u), classOf: label(u) }));

if (onlyTo) recipients = [{ email: onlyTo, first: "there", classOf: "test" }];

console.log(`Template: ${templateName} — "${template.subject}"`);
console.log(`${recipients.length} recipient(s):`);
for (const r of recipients) console.log(`  ${String(r.classOf).padEnd(18)} ${r.first.padEnd(12)} ${r.email}`);

if (dryRun) {
  console.log("\nDry run — nothing sent. Re-run without --dry-run to send.");
  process.exit(0);
}

const resend = new Resend(resendKey);
let sent = 0;
for (const r of recipients) {
  const { error } = await resend.emails.send({
    from: `${template.fromName || "Vantage"} <noreply@my-vantage.app>`,
    to: r.email,
    replyTo: "ankur.crawford@gmail.com",
    subject: template.subject,
    text: template.text(r.first),
    ...(template.html ? { html: template.html(r.first) } : {}),
  });
  if (error) console.error(`  FAILED ${r.email}: ${error.message || JSON.stringify(error)}`);
  else { sent++; console.log(`  sent -> ${r.email}`); }
  await new Promise((res) => setTimeout(res, 600)); // stay under Resend's rate limit
}
console.log(`\nDone: ${sent}/${recipients.length} sent.`);
