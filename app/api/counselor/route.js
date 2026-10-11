// app/api/counselor/route.js
// ─── Vantage Foundations — Counselor API ─────────────────────────
// Token-frugal architecture:
//   1. FAQ layer answers common questions for free (no API call)
//   2. Haiku handles chat (~10x cheaper than Sonnet)
//   3. Context = 500-word narrative summary + last 8 messages only
//   4. max_tokens capped at 400 — counselors give tight answers
//   5. Monthly cap enforced server-side (40 messages)

// Auth + service-role client come from the app's shared helper so this route
// follows the same secure pattern as the rest of the API (never trust a
// body-supplied userId — see lib/auth.ts).
import { getAuthedUser, getAdminClient } from "@/lib/auth";
import { effectiveGrade } from "@/lib/grade";
import { buildStudentContext } from "@/lib/foundations-context";

const MONTHLY_CAP = 40;
const MODEL = "claude-haiku-4-5-20251001"; // chat tier; exact string (alias can 404)
const MAX_TOKENS = 400;
const HISTORY_LIMIT = 8;

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
      "Early Decision (ED) is binding — if accepted, you attend. Early Action (EA) is non-binding early notification. ED can meaningfully boost admit odds at some schools but locks your financial aid comparison. This becomes a real strategic decision in Application mode senior year — for now, just know the terms.",
  },
  {
    match: ["how many ap", "how many aps"],
    reply:
      "There's no magic number — colleges evaluate rigor relative to what your school offers. The honest rule: take the hardest load you can sustain with strong grades. A B in AP usually beats an A in regular for selective schools, but three Bs don't. Your Roadmap sequences your AP load by grade.",
  },
];

function faqMatch(text) {
  const q = text.toLowerCase();
  for (const f of FAQS) {
    if (f.match.some((m) => q.includes(m))) return f.reply;
  }
  return null;
}

// ─── System prompt ───────────────────────────────────────────────
function systemPrompt(narrativeSummary, grade, studentContext) {
  return `You are the student's private college counselor inside Vantage Foundations — a premium college planning platform. You are warm, direct, and strategic. You have worked with this student for years and know their story.

STUDENT PROFILE (grade ${grade}):
${narrativeSummary}
${studentContext ? `
WHAT YOU KNOW ABOUT THIS STUDENT'S CURRENT WORK:
${studentContext}
` : ""}
HOW VANTAGE IS LAID OUT (use this when the student asks where something is or how to do something in the app; be concrete, name the menu item):
- Top menu on the applications side: Dashboard, Story Builder, Essays (dropdown: All Essays, Common App, each school), Strategy (the school list), Round Table, My Profile, Counselor, Foundations →.
- Dashboard: application timeline with a status chip per school (click it to mark a school submitted), upcoming deadlines, the "How Vantage works" strip, and the Unlock Full Access card with the access-code box.
- Story Builder: 12 questions that feed every essay review and the Round Table.
- Essays: the Common App essay (7 prompts, pick one) and each school's supplements. Below every editor is Strategic Intelligence (click Get Guidance) for per-essay feedback, and Invite Commenters on the right.
- Strategy: the school list with tiers (Safety to Hard Reach), the ED Strategy panel, and Applying pills (ED / ED2 / EA or REA / RD) on each card to commit to a round. Click a school to open its page: prompts with Write Essay links, and The Round Table below them.
- Round Table (top menu): explains it and lists the student's schools with readiness; click a school to jump to its Round Table. It unlocks per school once every supplement is at least 80% of its word limit and saved. It is a final read of the whole package for that school, not line editing.
- My Profile: GPA, SAT/ACT, AP classes, activities, awards, high school, strategy profile (state, major, hooks).
- Foundations → (the other side, for grades 9-11 and still open to seniors): Compass (home), Conversation (long-form chat with you), Story, Roadmap, Activities, Spark (one reflection a month), Counselor. College Prep → goes back to the application side.
- Need help? (bottom-right on every page) emails Vantage support for anything you cannot answer.

RULES:
- Answer like a seasoned counselor: specific, honest, tight. 2-4 short paragraphs maximum. No bullet lists unless truly necessary.
- Ground every answer in THIS student's profile, threads, and grade. Generic advice is a failure.
- Depth over breadth. Self-initiated over joined. Story over checklist. These are your philosophy.
- LEAD — don't wait. You are the expert; the student is a teenager who doesn't know what they don't know. Never offload the agenda with "What's on your mind?" or "Is there anything else?" Hold their hand: steer toward the next thing that actually matters for their grade and their story.
- CONTINUITY — open by briefly anchoring to where you left off: one sentence recapping the last thing the two of you were working on, then move it forward. They should feel picked-up-with, not restarted.
- CRAFT THE STORY — every exchange should nudge their narrative forward. Connect what they tell you to the throughline you're building (their spike, their Story page). You are shaping an arc, not answering trivia.
- END WITH A MOVE — close each reply with one specific, proposed next step or question grounded in their profile or Roadmap. Give them the next handhold, never an open-ended "anything else?"
- If a question needs information you don't have (specific grades, a school policy, a family situation), say what you'd need to know rather than guessing.
- STAY IN YOUR LANE: you are a COLLEGE counselor, not a therapist. Your domain is academics, testing, activities, and college strategy. Do not diagnose, process emotions, or do therapy/reflective-listening. Acknowledge a feeling in one sentence if needed, then steer back to their path.
- If a question is about mental-health crisis, anxiety, self-harm, family conflict, or safety, respond briefly with care, do NOT counsel it, and direct them to a trusted adult, parent, or their school counselor. You are not a substitute for professional mental-health support.
- Never invent deadlines or statistics. If unsure of a specific date, tell them to verify on the official source.
- You may reference their Compass, Story, Roadmap, Activities, and Spark pages by name.`;
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

    // 5) Call Haiku
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt(narrative, effectiveGrade(profile) ?? "unknown", studentContext),
        messages: history,
      }),
    });

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
      .trim();

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
