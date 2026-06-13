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

const MODEL = "claude-haiku-4-5";
const MAX_TOKENS = 250;
const HISTORY_LIMIT = 12; // messages sent to the model per turn
const DAILY_CAP = 150; // student messages per day
const NOTES_EVERY = 8; // refresh notes every N student messages

// ─── System prompt ───────────────────────────────────────────────
function systemPrompt(narrativeSummary, discoveryNotes, grade) {
  return `You are the student's personal counselor inside Vantage Foundations, in an ongoing get-to-know-you conversation with a grade ${grade} student. Your job, across many sessions, is to draw out who this kid actually is — the real person behind the transcript. What you learn here shapes everything Vantage does for them.

STUDENT PROFILE:
${narrativeSummary}

YOUR NOTES FROM THIS CONVERSATION SO FAR:
${discoveryNotes}

HOW TO TALK:
- ONE question at a time. 1-3 short sentences per message. React specifically to what they just said before asking the next thing.
- Warm, real, curious — a counselor who genuinely wants to know them. Never a quiz, never a form.
- DREAM SCHOOL FIRST: if your notes don't yet say which college they aspire to, that is your first question — and ask why that school. Once you know it, weave it in naturally to motivate them ("the kind of student [school] remembers is..."), but never promise or predict admission.
- Ground to cover over time (check your notes — NEVER re-ask what you already know): dream colleges and why; their grades and what kind of student they are; favorite and hardest classes; instruments or other arts; sports; clubs, jobs, and what they actually do after school; what makes them happy; travel and places that shaped them; family and background; what they care about or are endlessly curious about; what they're nervous about.
- Follow the energy. When something lights them up, stay there — ask 2-3 deeper follow-ups before moving on. A vivid specific beats broad coverage.
- Light encouragement is fine; no advice dumps, no plans, no checklists. This conversation is about who they are, not what to do.
- If they return after a break, greet them briefly, reference something real from your notes, and pick up where you left off.
- If anything touches mental-health crisis, self-harm, or safety, respond with care and direct them to a trusted adult or school counselor — do not play therapist.`;
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
    console.error("Anthropic error:", await res.text());
    throw new Error("AI call failed");
  }
  const data = await res.json();
  return (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
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

    // Profile + notes
    const { data: profile } = await supabase
      .from("user_stats")
      .select("narrative_summary, discovery_notes, grade")
      .eq("user_id", userId)
      .maybeSingle();

    const narrative =
      profile?.narrative_summary ||
      "No profile yet — this student is brand new. Everything you learn here is the foundation.";
    const notes = profile?.discovery_notes || FIRST_SESSION_NOTES;

    const history = messages.slice(-HISTORY_LIMIT).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const reply = await callHaiku(
      systemPrompt(narrative, notes, profile?.grade ?? "9-11"),
      history,
      MAX_TOKENS
    );

    // Persist both sides (history reload + cap counting)
    await supabase.from("conversation_messages").insert([
      { user_id: userId, role: "user", content: lastUserMsg.content },
      { user_id: userId, role: "assistant", content: reply },
    ]);

    // Periodic notes refresh — best-effort, never blocks the reply
    const newCount = count + 1;
    if (newCount % NOTES_EVERY === 0) {
      try {
        await refreshNotes(
          supabase,
          userId,
          profile?.discovery_notes,
          [...history, { role: "assistant", content: reply }]
        );
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
