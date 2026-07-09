// app/api/foundations/conversation/route.js
// ─── Vantage Foundations — Conversation (discovery) API ──────────
// An ongoing get-to-know-you interview for 9th-11th graders. Unlike the
// counselor (Q&A, monthly cap) or onboarding (one-time, 6 turns), this
// conversation can run for an hour and resumes across sessions.
//
// Token-frugal architecture:
//   1. Haiku for chat; short interviewer turns (max 250 tokens)
//   2. Context = narrative summary + running discovery notes + last 12 messages
//   3. Every 8 student messages, notes + narrative_summary are refreshed
//      (best-effort, non-fatal) so the rest of the platform — Counselor,
//      Roadmap, Compass — gets smarter as the kid talks
//   4. Generous daily cap (150 student messages/day) as cost protection
//
// GET  → full history (resume support) + today's usage
// POST → { messages } → { reply, used, cap }

import { getAuthedUser, getAdminClient } from "@/lib/auth";
import { buildStudentContext } from "@/lib/foundations-context";

const MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 250;
const HISTORY_LIMIT = 12; // messages sent to the model per turn
const DAILY_CAP = 150; // student messages per day
const NOTES_EVERY = 8; // refresh full notes/summary every N student messages
const ACTIVITIES_EVERY = 2; // scan for new activities every N student messages

// ─── System prompt ───────────────────────────────────────────────
function systemPrompt(narrativeSummary, discoveryNotes, grade, studentContext) {
  return `You are the student's personal counselor inside Vantage Foundations, in an ongoing get-to-know-you conversation with a grade ${grade} student. Your job, across many sessions, is to draw out who this kid actually is — the real person behind the transcript. What you learn here shapes everything Vantage does for them.

STUDENT PROFILE:
${narrativeSummary}

YOUR NOTES FROM THIS CONVERSATION SO FAR:
${discoveryNotes}
${studentContext ? `
WHAT YOU KNOW ABOUT THIS STUDENT'S CURRENT WORK:
${studentContext}
` : ""}
HOW TO TALK:
- ONE question at a time. 1-3 short sentences per message. React specifically to what they just said before asking the next thing.
- Warm, real, curious — a counselor who genuinely wants to know them. Never a quiz, never a form.
- DREAM SCHOOL FIRST: if your notes don't yet say which college they aspire to, that is your first question — and ask why that school. Once you know it, weave it in naturally to motivate them ("the kind of student [school] remembers is..."), but never promise or predict admission.
- Ground to cover over time (check your notes — NEVER re-ask what you already know): dream colleges and why; their grades and what kind of student they are; favorite and hardest classes; instruments or other arts; sports; clubs, jobs, and what they actually do after school; what makes them happy; travel and places that shaped them; family and background; what they care about or are endlessly curious about; what they're nervous about.
- Follow the energy. When something lights them up, stay there — ask 2-3 deeper follow-ups before moving on. A vivid specific beats broad coverage.
- Light encouragement is fine; no advice dumps, no plans, no checklists. This conversation is about who they are, not what to do.
- If they return after a break, greet them briefly, reference something real from your notes, and pick up where you left off.

STAY IN YOUR LANE — you are a COLLEGE counselor, not a therapist:
- Your domain is academics, activities, interests, college aspirations, and growth. Keep the conversation there.
- Do NOT do therapy: no diagnosing, no probing feelings about family/mental health, no "how does that make you feel," no processing trauma, no emotional-coaching or reflective-listening loops. Acknowledge an emotion in a sentence, then steer back to their path.
- If a student raises stress, anxiety, sadness, family conflict, self-harm, or any safety/mental-health issue: respond briefly with warmth, do NOT explore or counsel it, and direct them to a trusted adult, parent, or their school counselor. Then gently return to college-related ground. You are not a substitute for professional mental-health support.`;
}

const FIRST_SESSION_NOTES =
  "(none yet — this is the first session. Open warmly: you're here to get to know them, no wrong answers. Then ask the dream-school question.)";

// ─── Anthropic helper ────────────────────────────────────────────
async function callHaiku(system, messages, maxTokens) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages }),
  });
  if (!res.ok) {
    const errBody = await res.text();
    console.error("Anthropic error:", errBody);
    throw new Error(`AI call failed [${res.status}]`);
  }
  const data = await res.json();
  return (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
}

// ─── Activity extraction (best-effort) ───────────────────────────
// Pulls concrete activities the student mentioned (sports, instruments,
// clubs, jobs, self-started projects) into foundations_activities as
// unconfirmed suggestions. The student confirms/edits them on the
// Activities page. Never invents; never duplicates existing rows.
async function extractActivities(supabase, userId, notes, messages) {
  const { data: existing } = await supabase
    .from("foundations_activities")
    .select("name")
    .eq("user_id", userId);
  const existingNames = (existing || []).map((a) => a.name.toLowerCase().trim());

  // Build a readable transcript from the message array (NOT a raw array —
  // string-interpolating objects yields "[object Object]" and breaks extraction).
  const transcript = (Array.isArray(messages) ? messages : [])
    .map((m) => (m.role === "user" ? "Student" : "Counselor") + ": " + m.content)
    .join("\n");

  const raw = await callHaiku(
    "You extract structured data. Reply with ONLY a valid JSON array — no prose, no code fences.",
    [{ role: "user", content:
      `From the counselor notes and conversation below, list the student's concrete activities: sports, instruments, clubs, volunteering, jobs, self-started projects, serious hobbies. Already tracked (do NOT repeat): ${existingNames.join("; ") || "(none)"}.

Reply with a JSON array (empty array if nothing new). Each item:
{"name": "short title", "role": "their role, e.g. Member / Goalie / First chair", "since": "when they started if stated, else \\"\\"", "hours": "weekly hours if stated, else \\"\\"", "depth": 1-5 (1 tried it, 2 committed, 3 deep, 4 leading, 5 defining), "thread": "2-4 word theme", "trajectory": "one sentence on a natural next step"}

Only include activities the student explicitly mentioned doing — never infer or invent.

NOTES:
${notes}

CONVERSATION:
${transcript}` }],
    800
  );

  let list;
  try {
    list = JSON.parse(raw.replace(/```json|```/gi, "").trim());
  } catch {
    return; // model didn't return clean JSON — skip silently
  }
  if (!Array.isArray(list)) return;

  const rows = list
    .filter((a) => a && a.name && !existingNames.includes(String(a.name).toLowerCase().trim()))
    .slice(0, 8)
    .map((a) => ({
      user_id: userId,
      name: String(a.name).slice(0, 80),
      role: String(a.role || "").slice(0, 80),
      since: String(a.since || "").slice(0, 40),
      hours: String(a.hours || "").slice(0, 20),
      depth: Math.min(5, Math.max(1, parseInt(a.depth, 10) || 1)),
      thread: String(a.thread || "").slice(0, 60),
      trajectory: String(a.trajectory || "").slice(0, 400),
      source: "conversation",
      confirmed: false,
    }));

  if (rows.length) await supabase.from("foundations_activities").insert(rows);
}

// ─── Course extraction (best-effort) ─────────────────────────────
// Catches explicit course mentions ("I'm taking AP Bio") into
// foundations_courses so rigor tracking builds itself as the kid talks.
// Never invents; never duplicates existing rows (case-insensitive name).
const COURSE_LEVELS = ["regular", "honors", "ap", "ib", "college"];

async function extractCourses(supabase, userId, messages) {
  const { data: existing } = await supabase
    .from("foundations_courses")
    .select("name")
    .eq("user_id", userId);
  const existingNames = (existing || []).map((c) => c.name.toLowerCase().trim());

  const transcript = (Array.isArray(messages) ? messages : [])
    .map((m) => (m.role === "user" ? "Student" : "Counselor") + ": " + m.content)
    .join("\n");

  const raw = await callHaiku(
    "You extract structured data. Reply with ONLY a valid JSON array — no prose, no code fences.",
    [{ role: "user", content:
      `From the conversation below, list school courses the student EXPLICITLY says they are taking, have taken, or are signed up to take (e.g. "I'm taking AP Bio"). Already tracked (do NOT repeat): ${existingNames.join("; ") || "(none)"}.

Reply with a JSON array (empty array if none). Each item:
{"name": "course name, e.g. AP Biology", "level": "regular"|"honors"|"ap"|"ib"|"college", "grade_year": 9-12 if stated or clear from context, else null}

Only include courses the student explicitly mentioned taking — never infer or invent.

CONVERSATION:
${transcript}` }],
    400
  );

  let list;
  try {
    list = JSON.parse(raw.replace(/```json|```/gi, "").trim());
  } catch {
    return; // model didn't return clean JSON — skip silently
  }
  if (!Array.isArray(list)) return;

  const seen = new Set(existingNames);
  const rows = [];
  for (const c of list) {
    if (!c || !c.name) continue;
    const name = String(c.name).slice(0, 80).trim();
    const key = name.toLowerCase();
    if (!name || seen.has(key)) continue;
    seen.add(key);
    const gy = parseInt(c.grade_year, 10);
    rows.push({
      user_id: userId,
      name,
      level: COURSE_LEVELS.includes(String(c.level || "").toLowerCase())
        ? String(c.level).toLowerCase()
        : "regular",
      grade_year: gy >= 9 && gy <= 12 ? gy : null,
    });
    if (rows.length >= 8) break;
  }

  if (rows.length) await supabase.from("foundations_courses").insert(rows);
}

// ─── Notes refresh (best-effort) ─────────────────────────────────
// Distills the conversation into structured counselor notes and refreshes
// narrative_summary so Counselor/Roadmap/Compass benefit immediately.
async function refreshNotes(supabase, userId, oldNotes, recentMessages) {
  const transcript = recentMessages
    .map((m) => (m.role === "user" ? "Student" : "Counselor") + ": " + m.content)
    .join("\n");

  const notes = await callHaiku(
    "You write concise, factual counselor notes.",
    [{ role: "user", content:
      `Update these counselor discovery notes with what's new in the conversation below. Keep them 250-400 words, organized under these headings (only include headings you have material for): Dream schools & why · Academics & student type · Arts/Music · Sports · After school & jobs · What makes them happy · Travel & places · Family & background · Themes & threads · Still to explore. Be specific and factual to what the student shared — never invent. Preserve anything in the existing notes that the new conversation doesn't contradict.\n\nEXISTING NOTES:\n${oldNotes || "(none)"}\n\nNEW CONVERSATION:\n${transcript}` }],
    700
  );

  const summary = await callHaiku(
    "You write concise, factual counselor notes.",
    [{ role: "user", content:
      `From these counselor notes, write a 150-250 word narrative summary in third person describing this student: who they are, their dream school and why, interests, activities, strengths, and emerging themes. Specific and factual only.\n\nNOTES:\n${notes}` }],
    450
  );

  const { data: existing } = await supabase
    .from("user_stats").select("user_id").eq("user_id", userId).maybeSingle();
  if (existing) {
    await supabase.from("user_stats")
      .update({ discovery_notes: notes, narrative_summary: summary })
      .eq("user_id", userId);
  } else {
    await supabase.from("user_stats")
      .insert({ user_id: userId, discovery_notes: notes, narrative_summary: summary });
  }
}

// ─── GET: resume — full history + usage ──────────────────────────
export async function GET(req) {
  try {
    const auth = await getAuthedUser(req);
    if (!auth.ok) return auth.response;
    const supabase = getAdminClient();

    const { data: history, error } = await supabase
      .from("conversation_messages")
      .select("role, content, created_at")
      .eq("user_id", auth.userId)
      .order("created_at", { ascending: true })
      .limit(500);
    if (error) throw error;

    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const { count } = await supabase
      .from("conversation_messages")
      .select("id", { count: "exact", head: true })
      .eq("user_id", auth.userId)
      .eq("role", "user")
      .gte("created_at", dayStart.toISOString());

    // Catch-up scan: if the student left mid-session, pull any activities
    // we hadn't extracted yet from the tail of the conversation. Best-effort.
    if ((history || []).length >= 2) {
      try {
        const { data: prof } = await supabase
          .from("user_stats").select("discovery_notes").eq("user_id", auth.userId).maybeSingle();
        await extractActivities(
          supabase,
          auth.userId,
          prof?.discovery_notes || "",
          (history || []).slice(-12).map((m) => ({ role: m.role, content: m.content }))
        );
      } catch (e) {
        console.error("resume extraction failed:", e);
      }
    }

    return Response.json({ messages: history || [], used: count || 0, cap: DAILY_CAP });
  } catch (err) {
    console.error("Conversation GET error:", err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// ─── POST: one turn ──────────────────────────────────────────────
export async function POST(req) {
  try {
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

    // Daily cap (cost protection — generous enough for an hour-long session)
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const { count, error: countErr } = await supabase
      .from("conversation_messages")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("role", "user")
      .gte("created_at", dayStart.toISOString());
    if (countErr) throw countErr;
    if (count >= DAILY_CAP) {
      return Response.json(
        { error: "That's a lot of great conversation for one day — let's pick this up tomorrow." },
        { status: 429 }
      );
    }

    // Profile + notes, plus the student-context block (activities, roadmap
    // progress, latest Spark, courses) — the latter is best-effort ('' on
    // any failure) so it can never block the reply.
    const [{ data: profile }, studentContext] = await Promise.all([
      supabase
        .from("user_stats")
        .select("narrative_summary, discovery_notes, grade")
        .eq("user_id", userId)
        .maybeSingle(),
      buildStudentContext(supabase, userId),
    ]);

    const narrative =
      profile?.narrative_summary ||
      "No profile yet — this student is brand new. Everything you learn here is the foundation.";
    const notes = profile?.discovery_notes || FIRST_SESSION_NOTES;

    const history = messages.slice(-HISTORY_LIMIT).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const reply = await callHaiku(
      systemPrompt(narrative, notes, profile?.grade ?? "9-11", studentContext),
      history,
      MAX_TOKENS
    );

    // Persist both sides (history reload + cap counting)
    await supabase.from("conversation_messages").insert([
      { user_id: userId, role: "user", content: lastUserMsg.content },
      { user_id: userId, role: "assistant", content: reply },
    ]);

    const newCount = count + 1;
    const recent = [...history, { role: "assistant", content: reply }];

    // Pull newly mentioned activities onto the Activities page often, so they
    // show up while the kid is still talking (not only on a notes refresh).
    if (newCount >= ACTIVITIES_EVERY && newCount % ACTIVITIES_EVERY === 0) {
      try {
        await extractActivities(supabase, userId, profile?.discovery_notes || "", recent);
      } catch (e) {
        console.error("activity extraction failed:", e);
      }
      // Parallel lightweight pass for course mentions ("I'm taking AP Bio") —
      // same cadence, same fire-and-forget contract as activities.
      try {
        await extractCourses(supabase, userId, recent);
      } catch (e) {
        console.error("course extraction failed:", e);
      }
    }

    // Periodic full notes/summary refresh — best-effort, never blocks the reply
    if (newCount % NOTES_EVERY === 0) {
      try {
        await refreshNotes(supabase, userId, profile?.discovery_notes, recent);
      } catch (e) {
        console.error("Conversation notes refresh failed:", e);
      }
    }

    return Response.json({ reply, used: newCount, cap: DAILY_CAP });
  } catch (err) {
    console.error("Conversation POST error:", err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
