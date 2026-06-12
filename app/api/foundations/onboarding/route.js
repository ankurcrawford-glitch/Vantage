// app/api/foundations/onboarding/route.js
// First conversation for a new Foundations student. Warm, AI-guided (Haiku),
// ~6 exchanges. On wrap-up it generates a narrative_summary and saves it to
// user_stats (the same field the counselor route reads). Auth from the session
// token; never trusts a body userId.

import { getAuthedUser, getAdminClient } from "@/lib/auth";

const MODEL = "claude-haiku-4-5";
const TARGET_TURNS = 6; // wrap up after ~6 student answers (medium length)
const MAX_TOKENS = 300;

const ONBOARDING_SYSTEM = `You are a warm, encouraging college counselor welcoming a 9th-11th grade student to Vantage Foundations for the very first time. This is their first conversation and your only job right now is to get to know them as a person.

How to talk:
- Warm and genuine, like a real counselor - never a form or a quiz.
- ONE question at a time. Keep each message to 1-3 short sentences.
- React to what they just said before asking the next thing; be specific to their answers.
- Explore naturally: their name, what they are into (in and out of school), any activities/clubs/sports/jobs, what they are curious about or care about, and anything they are excited or nervous about.
- No advice, no plans, no lists. Just curiosity and warmth.
- Age-appropriate and supportive. Never judgmental.`;

const WRAP_INSTRUCTION = `The student has shared enough for a first conversation. Warmly wrap up in 2-3 sentences: thank them, reflect back one specific thing you noticed about them, and let them know their counselor and pages are ready whenever they are. Do NOT ask another question.`;

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

export async function POST(req) {
  try {
    const auth = await getAuthedUser(req);
    if (!auth.ok) return auth.response;
    const userId = auth.userId;

    const { messages } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "Bad request" }, { status: 400 });
    }

    const history = messages.slice(-16).map((m) => ({ role: m.role, content: m.content }));
    const userTurns = history.filter((m) => m.role === "user").length;
    const wrap = userTurns >= TARGET_TURNS;

    const system = wrap ? ONBOARDING_SYSTEM + "\n\n" + WRAP_INSTRUCTION : ONBOARDING_SYSTEM;
    const reply = await callHaiku(system, history, MAX_TOKENS);

    if (wrap) {
      // Best-effort: summarize the conversation and save it. Non-fatal on error.
      try {
        const transcript = history
          .map((m) => (m.role === "user" ? "Student" : "Counselor") + ": " + m.content)
          .join("\n");
        const summary = await callHaiku(
          "You write concise, factual counselor notes.",
          [{ role: "user", content:
            "From this onboarding conversation, write a 120-200 word narrative summary in third person describing this student: their name (if given), interests, current activities, what they care about, and any emerging themes. Be specific and factual to what they shared - do not invent. Write it as counselor notes that will ground future guidance.\n\nConversation:\n" + transcript }],
          400
        );
        const supabase = getAdminClient();
        const { data: existing } = await supabase
          .from("user_stats").select("user_id").eq("user_id", userId).maybeSingle();
        if (existing) {
          await supabase.from("user_stats").update({ narrative_summary: summary }).eq("user_id", userId);
        } else {
          await supabase.from("user_stats").insert({ user_id: userId, narrative_summary: summary });
        }
      } catch (e) {
        console.error("onboarding summary save failed:", e);
      }
      return Response.json({ reply, done: true });
    }

    return Response.json({ reply, done: false });
  } catch (err) {
    console.error("onboarding route error:", err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
