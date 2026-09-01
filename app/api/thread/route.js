// app/api/thread/route.js
// ─── Vantage — the thread finder ─────────────────────────────────
// Seniors without four banked Foundations years still need a
// through-line. This reads everything the student has given us —
// discovery answers, activities, awards, and any Foundations history
// via the bridge — and names 2-3 candidate THREADS: the through-lines
// a whole application can hang on. Cached in user_stats.senior_threads;
// regeneration allowed once an hour.
//
// GET  → cached threads (or none)
// POST → generate (respects 1-hour cooldown unless nothing cached)

import { getAuthedUser, getAdminClient } from "@/lib/auth";
import { DISCOVERY_QUESTIONS } from "@/lib/discovery";
import { buildFoundationsBridge } from "@/lib/foundationsBridge";

const MODEL = "claude-haiku-4-5-20251001";
const COOLDOWN_MS = 60 * 60 * 1000;

const SYSTEM = `You are an elite college admissions strategist. From a student's raw material, identify their strongest THREADS — the 2-3 through-lines that a whole application can hang on. A thread is not an activity; it is the deeper pattern connecting activities, viewpoints, and how they express themselves (e.g. "translating between worlds", "fixing things nobody else notices", "making rigorous things playful").

Rules: ground every thread in THEIR actual material — quote or reference specifics. Never invent. If the material is thin, say so honestly in the note and name at most one tentative thread.

Reply with ONLY valid JSON, no prose, no code fences:
{"threads":[{"name":"3-6 word thread name","why":"2-3 sentences of evidence from their material, referencing specifics","use":"one sentence: where this thread works hardest (Common App? which supplement types?)"}],"note":"one sentence of overall advice, or empty string"}`;

async function callClaude(system, userContent, maxTokens) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages: [{ role: "user", content: userContent }] }),
  });
  if (!res.ok) throw new Error(`AI call failed [${res.status}]`);
  const data = await res.json();
  return (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
}

export async function GET(request) {
  const auth = await getAuthedUser(request);
  if (!auth.ok) return auth.response;
  try {
    const supabase = getAdminClient();
    const { data } = await supabase
      .from("user_stats")
      .select("senior_threads")
      .eq("user_id", auth.userId)
      .maybeSingle();
    return Response.json({ threads: data?.senior_threads ?? null });
  } catch (err) {
    console.error("thread GET error:", err);
    return Response.json({ threads: null });
  }
}

export async function POST(request) {
  const auth = await getAuthedUser(request);
  if (!auth.ok) return auth.response;
  try {
    const supabase = getAdminClient();
    const userId = auth.userId;

    const { data: stats } = await supabase
      .from("user_stats")
      .select("senior_threads, narrative_summary, intended_major")
      .eq("user_id", userId)
      .maybeSingle();

    const cached = stats?.senior_threads;
    if (cached?.generated_at && Date.now() - new Date(cached.generated_at).getTime() < COOLDOWN_MS) {
      return Response.json({ threads: cached, cooldown: true });
    }

    const [{ data: discovery }, { data: extras }, { data: awards }] = await Promise.all([
      supabase.from("discovery_answers").select("question_id, answer").eq("user_id", userId),
      supabase.from("user_extracurriculars").select("activity_name, role, description").eq("user_id", userId).limit(15),
      supabase.from("user_awards").select("award_name").eq("user_id", userId).limit(10),
    ]);

    const parts = [];
    if (stats?.intended_major) parts.push(`Intended major: ${stats.intended_major}`);
    if (stats?.narrative_summary) parts.push(`Counselor narrative: ${String(stats.narrative_summary).slice(0, 1200)}`);
    const answers = (discovery || [])
      .map((d) => {
        const q = DISCOVERY_QUESTIONS.find((dq) => dq.id === d.question_id);
        return q ? `Q: ${q.question}\nA: ${String(d.answer).slice(0, 600)}` : null;
      })
      .filter(Boolean);
    if (answers.length) parts.push("Brainstorming answers:\n" + answers.join("\n\n"));
    if (extras?.length) {
      parts.push(
        "Activities:\n" +
          extras.map((e) => `- ${e.activity_name}${e.role ? ` (${e.role})` : ""}${e.description ? `: ${String(e.description).slice(0, 150)}` : ""}`).join("\n")
      );
    }
    if (awards?.length) parts.push("Awards: " + awards.map((a) => a.award_name).join(", "));

    // Foundations history (empty string for pure seniors — that's fine).
    const bridge = await buildFoundationsBridge(supabase, userId);
    if (bridge) parts.push(bridge);

    if (parts.length === 0 || (answers.length === 0 && !stats?.narrative_summary && !bridge)) {
      return Response.json({
        error: "Not enough material yet. Answer a few Story Builder questions first — the thread finder works from what you've shared.",
      }, { status: 400 });
    }

    const raw = await callClaude(SYSTEM, parts.join("\n\n"), 900);
    let parsed;
    try {
      parsed = JSON.parse(raw.replace(/```json|```/gi, "").trim());
    } catch {
      return Response.json({ error: "Couldn't read the analysis. Try again." }, { status: 500 });
    }

    const result = {
      threads: Array.isArray(parsed.threads) ? parsed.threads.slice(0, 3) : [],
      note: String(parsed.note || ""),
      generated_at: new Date().toISOString(),
    };

    await supabase.from("user_stats").update({ senior_threads: result }).eq("user_id", userId);

    return Response.json({ threads: result });
  } catch (err) {
    console.error("thread POST error:", err);
    return Response.json({ error: "Something went wrong. Try again in a minute." }, { status: 500 });
  }
}
