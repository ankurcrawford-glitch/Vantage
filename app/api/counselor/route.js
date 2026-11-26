// app/api/counselor/route.js
// ─── Vantage Foundations — Counselor API ─────────────────────────
// Token-frugal architecture:
//   1. FAQ layer answers common questions for free (no API call)
//   2. Sonnet handles chat so it reads like Claude (COUNSELOR_MODEL overrides)
//   3. Context = narrative summary + last 12 messages only
//   4. max_tokens 2000 — length is steered by the prompt, not truncation
//   5. Monthly cap enforced server-side (40 messages)

// Auth + service-role client come from the app's shared helper so this route
// follows the same secure pattern as the rest of the API (never trust a
// body-supplied userId — see lib/auth.ts).
import { getAuthedUser, getAdminClient } from "@/lib/auth";
import { effectiveGrade, isGapYear, applicantStatusLine } from "@/lib/grade";
import { buildStudentContext } from "@/lib/foundations-context";
import { CLAUDE_MODEL_PRO, postClaude } from "@/lib/ai";

const MONTHLY_CAP = 40;
// Sonnet, so the counselor reads like talking to Claude directly. Roughly
// 1¢ per message; the 40-message monthly cap keeps it under ~50¢ per
// student. Override with COUNSELOR_MODEL (e.g. CLAUDE_MODEL_FAST) to save.
const MODEL = process.env.COUNSELOR_MODEL || CLAUDE_MODEL_PRO;
// Room for a full answer (5.5 models may reason first, which counts here).
// Length is steered by the prompt, not by cutting replies off.
const MAX_TOKENS = 2000;
const HISTORY_LIMIT = 12;

// ─── FAQ layer — zero-cost answers ───────────────────────────────
// Keyword-matched. Personalized questions fall through to Claude.
const FAQS = [
  // ── Where-is-it questions: answered instantly, no API call ──
  {
    match: ["where is the round table", "where's the round table", "find the round table", "round table access", "how do i get to the round table", "where do i find round table", "access the round table", "how do i use the round table", "open the round table"],
    reply:
      "The Round Table lives on each school's page. Two ways in: click Round Table in the top menu — it lists your schools and shows which ones are ready, click a school to jump straight to it. Or go to Strategy, click a school, and scroll to \"The Round Table\" below its essay prompts. It unlocks once every supplement for that school is at least 80% of its word limit and saved; until then it shows which essays still need work.",
  },
  {
    match: ["where is story builder", "where's story builder", "find story builder", "where are the 12 questions", "where are the twelve questions"],
    reply:
      "Story Builder is in the top menu on the applications side. Twelve questions; answer them once and every essay review, the Round Table, and I all draw on them.",
  },
  {
    match: ["where are my essays", "where do i write my essay", "where is the common app essay", "where do i write the common app", "where are the supplements", "where are the supplemental"],
    reply:
      "Click Essays in the top menu. The dropdown lists All Essays, the Common App essay, and each of your schools. For a specific school's supplements you can also go to Strategy, click the school, and use the Write Essay links under its prompts.",
  },
  {
    match: ["where is strategic intelligence", "how do i get feedback on my essay", "where is get guidance", "essay feedback", "how do i get essay feedback"],
    reply:
      "Open any essay and look below the editor for Strategic Intelligence — click Get Guidance. It knows your Story Builder answers, so its notes are about your story, not generic editing. Use it per essay; use the Round Table when a whole school's application is drafted.",
  },
  {
    match: ["where do i pick ed", "how do i choose early decision", "where do i set my early round", "how do i commit to ed", "where do i mark ed", "how do i mark a school submitted", "where do i change application status"],
    reply:
      "Go to Strategy (your school list). Each school card has Applying pills — ED, ED2, EA or REA, RD — click one to commit. Once you choose ED, the other schools' early dates drop off your deadline list. To mark a school submitted, click its status chip on the Dashboard timeline.",
  },
  {
    match: ["where is my roadmap", "where is the roadmap", "where is spark", "where is my spark", "where is the compass", "where is foundations"],
    reply:
      "Those are on the Foundations side: click Foundations → in the top menu. Compass is the home page there, and Roadmap, Activities, Spark, Story, and Conversation are in its menu. Seniors can come back to the application side with College Prep →.",
  },
  {
    match: ["where do i add a school", "how do i add a college", "add a school to my list", "where is my school list", "where is my college list"],
    reply:
      "Click Strategy in the top menu — that's your school list. Add schools there; each one gets a tier (Safety through Hard Reach) based on your profile, and the ED Strategy panel shows where applying early pays most.",
  },
  {
    match: ["where do i enter my gpa", "where do i add activities", "where is my profile", "where do i add my sat", "where do i put my test scores", "where do i add awards"],
    reply:
      "Click My Profile in the top menu: GPA, test scores, AP classes, activities, awards, and your high school all live there. Your Strategy tiers recalculate from what you enter.",
  },
  {
    match: ["where do i enter my access code", "where is the access code", "how do i redeem a code", "where do i put the code"],
    reply:
      "On the Dashboard, scroll to the Unlock Full Access card — there's a \"Have an access code?\" box under it. Story Builder has the same box.",
  },
  {
    match: ["how do i invite", "where do i invite a commenter", "how do i share my essay", "how do i add a reviewer", "invite my counselor", "invite a teacher"],
    reply:
      "Open the essay and use Invite Commenters on the right. They get an email link, can read that essay, and leave comments; you stay the only one who can edit it.",
  },
  {
    match: ["sat dates", "when is the sat", "sat registration", "register for sat"],
    reply:
      "SAT registration opens about 5 weeks before each test date — College Board runs sittings in March, May, June, August, October, November, and December. The strategic answer for you lives in your Roadmap: we've sequenced PSAT and SAT timing around your grade. Check the Testing items there.",
  },
  {
    match: ["what is psat", "psat vs sat"],
    reply:
      "The PSAT is the practice SAT taken in October, mostly in 10th and 11th grade. The 11th-grade sitting doubles as the National Merit qualifier. It doesn't go to colleges — it's a calibration tool. Your Roadmap has your PSAT timing mapped.",
  },
  {
    match: ["what is early decision", "ed vs ea", "early action vs early decision"],
    reply:
      "Early Decision (ED) is binding — if accepted, you attend. Early Action (EA) is non-binding early notification. ED can meaningfully boost admit odds at some schools but locks your financial aid comparison. If you're a senior, the ED Strategy panel on your Strategy page shows where applying early pays most for you; if you're younger, just know the terms for now.",
  },
  {
    match: ["how many ap classes", "how many ap courses", "how many aps", "how many ap should"],
    reply:
      "There's no magic number — colleges evaluate rigor relative to what your school offers. The honest rule: take the hardest load you can sustain with strong grades. A B in AP usually beats an A in regular for selective schools, but three Bs don't. Your Roadmap sequences your AP load by grade.",
  },
];

// Only short, navigational questions go to the FAQ. A longer message that
// happens to contain a phrase ("my teacher's essay feedback says…") is a real
// question and must reach the counselor.
const FAQ_MAX_WORDS = 12;

function faqMatch(text) {
  const q = String(text || "").toLowerCase();
  if (q.trim().split(/\s+/).length > FAQ_MAX_WORDS) return null;
  for (const f of FAQS) {
    if (f.match.some((m) => q.includes(m))) return f.reply;
  }
  return null;
}

// ─── System prompt ───────────────────────────────────────────────
// Written to sound like talking to Claude directly: answer what was asked,
// plainly and warmly, at the length the question needs. Students (Sahana
// among them) preferred plain Claude to the old scripted counselor voice.
function systemPrompt(narrativeSummary, grade, studentContext, statusLine = "") {
  return `You're a college counselor inside Vantage, a college-planning app, talking with a student (grade ${grade}). Be the kind of thoughtful, knowledgeable person they'd want to ask: friendly, honest, genuinely helpful, and easy to talk to.

WHAT YOU KNOW ABOUT THEM:
${narrativeSummary}${statusLine ? `\n${statusLine}` : ""}
${studentContext ? `
THEIR CURRENT WORK IN VANTAGE:
${studentContext}
` : ""}
HOW VANTAGE IS LAID OUT (use this when the student asks where something is or how to do something in the app; be concrete, name the menu item):
- Top menu on the applications side, in the order students work through it: Dashboard, My Profile, Story Builder, Strategy (the school list), Essays (dropdown: All Essays, Common App, each school), Round Table, Counselor, Foundations →.
- Dashboard: application timeline with a status chip per school (click it to mark a school submitted), upcoming deadlines, the "How Vantage works" strip, and the Unlock Full Access card with the access-code box.
- Story Builder: 12 questions that feed every essay review and the Round Table.
- Essays: the Common App essay (7 prompts, pick one) and each school's supplements. Below every editor is Strategic Intelligence (click Get Guidance) for per-essay feedback, and Invite Commenters on the right.
- Strategy: the school list with tiers (Safety to Hard Reach), the ED Strategy panel, and Applying pills (ED / ED2 / EA or REA / RD) on each card to commit to a round. Click a school to open its page: prompts with Write Essay links, and The Round Table below them.
- Round Table (top menu): explains it and lists the student's schools with readiness; click a school to jump to its Round Table. It unlocks per school once every supplement is at least 80% of its word limit and saved. It is a final read of the whole package for that school, not line editing.
- My Profile: GPA, SAT/ACT, AP classes, activities, awards, high school, strategy profile (state, major, hooks).
- Foundations → (the other side, for grades 9-11 and still open to seniors): Compass (home), Conversation (long-form chat with you), Story, Roadmap, Activities, Spark (one reflection a month), Counselor. College Prep → goes back to the application side.
- Need help? (bottom-right on every page) emails Vantage support for anything you cannot answer.
HOW TO RESPOND:
- Answer the question they actually asked, directly, in the first sentence or two. Then add whatever context helps.
- Match the length to the question. A quick question gets a short answer; a big decision gets a fuller one. Don't pad, and don't cut a useful answer short.
- Write the way you'd talk: plain words, natural sentences, no admissions jargon unless you explain it. Use a short list or a few steps when that genuinely makes things clearer; otherwise just write normally. The chat shows plain text, so no markdown: no **bold**, no # headings — a simple dash or number at the start of a line is fine for a list.
- Use what you know about them when it's relevant, so the answer is about their situation, not generic. Don't force it in when it isn't.
- It's fine to ask a clarifying question if you need one, or to suggest a next step when there's an obvious one. You don't have to do either every time, and you don't need to recap past conversations unless it helps.
- Be honest, including about uncertainty. Never invent deadlines, statistics, or school policies; if you're not sure, say so and point them to the official source.
- Encouraging is good; flattery isn't. Don't write their essays for them — help them think and improve their own writing.
- If something is personal or stressful, respond like a kind person would. For anything involving their safety, self-harm, a mental-health crisis, or serious family trouble, respond with care and encourage them to talk to a parent, trusted adult, or their school counselor (or a crisis line if it's urgent) — you're not a substitute for that support.`;
}

// ─── GET: resume — full history + this month's usage ─────────────
// Lets the counselor pick up where the student left off instead of
// resetting to a cold greeting on every visit.
export async function GET(req) {
  try {
    const auth = await getAuthedUser(req);
    if (!auth.ok) return auth.response;
    const supabase = getAdminClient();

    const { data: history, error } = await supabase
      .from("counselor_messages")
      .select("role, content, created_at")
      .eq("user_id", auth.userId)
      .order("created_at", { ascending: true })
      .limit(500);
    if (error) throw error;

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const { count } = await supabase
      .from("counselor_messages")
      .select("id", { count: "exact", head: true })
      .eq("user_id", auth.userId)
      .eq("role", "user")
      .gte("created_at", monthStart.toISOString());

    return Response.json({ messages: history || [], used: count || 0, cap: MONTHLY_CAP });
  } catch (err) {
    console.error("Counselor GET error:", err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// ─── Route handler ───────────────────────────────────────────────
export async function POST(req) {
  try {
    // Derive the user from the session token — never from the request body.
    const auth = await getAuthedUser(req);
    if (!auth.ok) return auth.response;
    const userId = auth.userId;

    const supabase = getAdminClient();

    const { messages } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "Bad request" }, { status: 400 });
    }

    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUserMsg) {
      return Response.json({ error: "No user message" }, { status: 400 });
    }

    // 1) FAQ layer — free, doesn't count against cap
    const faqReply = faqMatch(lastUserMsg.content);
    if (faqReply) {
      return Response.json({ reply: faqReply, cached: true });
    }

    // 2) Enforce monthly cap (counts only real API calls)
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const { count, error: countErr } = await supabase
      .from("counselor_messages")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("role", "user")
      .gte("created_at", monthStart.toISOString());

    if (countErr) throw countErr;
    if (count >= MONTHLY_CAP) {
      return Response.json(
        { error: "Monthly counselor sessions used. Resets on the 1st." },
        { status: 429 }
      );
    }

    // 3) Load the narrative summary (token-saving asset). maybeSingle() so a
    // student with no user_stats row yet doesn't crash the request.
    // The student-context block (activities, roadmap progress, latest Spark,
    // courses) loads in parallel — best-effort, '' on any failure.
    const [{ data: profile, error: profErr }, studentContext] = await Promise.all([
      supabase
        .from("user_stats")
        .select("narrative_summary, grade, class_of")
        .eq("user_id", userId)
        .maybeSingle(),
      buildStudentContext(supabase, userId),
    ]);

    if (profErr) throw profErr;

    const narrative =
      profile?.narrative_summary ||
      "No narrative summary yet — student is early in profile building. Give thoughtful general guidance and encourage them to fill in Activities and Spark reflections.";

    // 4) Truncate history hard — last N messages only
    const history = messages.slice(-HISTORY_LIMIT).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // 5) Call Claude (see MODEL above)
    const anthropicRes = await postClaude({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt(
          narrative,
          isGapYear(profile) ? `gap year — graduated ${profile.class_of}` : effectiveGrade(profile) ?? "unknown",
          studentContext,
          applicantStatusLine(profile)
        ),
        messages: history,
      }, "counselor");

    if (!anthropicRes.ok) {
      const errBody = await anthropicRes.text();
      console.error("Anthropic API error:", errBody);
      throw new Error("AI call failed");
    }

    const data = await anthropicRes.json();
    const reply = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .replace(/\*\*(.+?)\*\*/g, "$1") // the chat shows plain text
      .trim();
    if (!reply) {
      console.error("[counselor] empty reply", data.stop_reason, data.usage);
      throw new Error("Empty AI reply");
    }

    // 6) Persist both sides (for cap counting + future thread analysis)
    await supabase.from("counselor_messages").insert([
      { user_id: userId, role: "user", content: lastUserMsg.content },
      { user_id: userId, role: "assistant", content: reply },
    ]);

    return Response.json({ reply, used: count + 1, cap: MONTHLY_CAP });
  } catch (err) {
    console.error("Counselor route error:", err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
