// app/api/foundations/roadmap-moves/route.js
// ─── Vantage Foundations — personalized roadmap moves ────────────
// GET → { moves: [{ title, why, season }, ...3] }
// The static roadmap is the spine; this layer is the counselor's take:
// three specific, seasonal next moves generated from the student's
// profile, activities, and courses. Cached in user_stats for 30 days
// (roadmap_moves / roadmap_moves_at) so it costs one Haiku call a month.
// On any generation/parse failure returns { moves: [] } and caches
// nothing — the Roadmap page simply hides the block.

import { getAuthedUser, getAdminClient } from "@/lib/auth";

const MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 350;
const CACHE_DAYS = 30;
const SEASONS = ["now", "this month", "this season"];

function sanitizeMoves(list) {
  if (!Array.isArray(list) || list.length !== 3) return null;
  const moves = [];
  for (const m of list) {
    if (!m || typeof m.title !== "string" || typeof m.why !== "string") return null;
    const title = m.title.trim().slice(0, 80);
    const why = m.why.trim().slice(0, 200);
    if (!title || !why) return null;
    moves.push({
      title,
      why,
      season: SEASONS.includes(m.season) ? m.season : "now",
    });
  }
  return moves;
}

export async function GET(req) {
  try {
    const auth = await getAuthedUser(req);
    if (!auth.ok) return auth.response;
    const userId = auth.userId;
    const supabase = getAdminClient();

    const { data: stats } = await supabase
      .from("user_stats")
      .select("narrative_summary, grade, roadmap_moves, roadmap_moves_at")
      .eq("user_id", userId)
      .maybeSingle();

    // Fresh cache → serve it, no model call.
    if (stats?.roadmap_moves_at && Array.isArray(stats.roadmap_moves)) {
      const ageMs = Date.now() - new Date(stats.roadmap_moves_at).getTime();
      if (ageMs >= 0 && ageMs < CACHE_DAYS * 24 * 60 * 60 * 1000) {
        const cached = sanitizeMoves(stats.roadmap_moves);
        if (cached) return Response.json({ moves: cached });
      }
    }

    // Gather what we know about the student.
    const [{ data: acts }, { data: courses }] = await Promise.all([
      supabase
        .from("foundations_activities")
        .select("name, role, depth, thread")
        .eq("user_id", userId)
        .eq("confirmed", true)
        .order("depth", { ascending: false })
        .limit(12),
      supabase
        .from("foundations_courses")
        .select("name, level, grade_year")
        .eq("user_id", userId)
        .limit(16),
    ]);

    const activityLines = (acts || [])
      .map((a) => `- ${a.name}${a.role ? ` (${a.role})` : ""}${a.thread ? ` — thread: ${a.thread}` : ""}, depth ${a.depth}/5`)
      .join("\n");
    const courseLines = (courses || [])
      .map((c) => `- ${c.name} (${c.level}${c.grade_year ? `, grade ${c.grade_year}` : ""})`)
      .join("\n");

    const now = new Date();
    const monthName = now.toLocaleString("en-US", { month: "long", year: "numeric" });
    const grade = typeof stats?.grade === "number" ? stats.grade : "unknown";
    const narrative = stats?.narrative_summary || "(no summary yet — student is early in profile building)";

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
        system: "You are a strategic college counselor. Reply with ONLY a valid JSON array — no prose, no code fences.",
        messages: [{ role: "user", content:
          `It is ${monthName}. Generate exactly 3 personalized next moves for this grade ${grade} student.

STUDENT SUMMARY:
${narrative}

CONFIRMED ACTIVITIES:
${activityLines || "(none tracked yet)"}

COURSES:
${courseLines || "(none tracked yet)"}

Reply with a JSON array of exactly 3 objects:
{"title": "the move, 8 words max", "why": "why it matters for THIS student, 25 words max", "season": "now"|"this month"|"this season"}

Rules: each move must be specific to this student's activities, courses, threads, and grade — generic advice is a failure. Be seasonal: match the calendar (e.g. selective summer program applications open in winter; PSAT is October; AP exams are May). Concrete actions only. Never invent facts about the student.` }],
      }),
    });

    if (!anthropicRes.ok) {
      console.error("Anthropic API error (roadmap-moves):", await anthropicRes.text());
      return Response.json({ moves: [] });
    }

    const data = await anthropicRes.json();
    const raw = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(raw.replace(/```json|```/gi, "").trim());
    } catch {
      return Response.json({ moves: [] }); // don't cache a failed parse
    }
    const moves = sanitizeMoves(parsed);
    if (!moves) return Response.json({ moves: [] });

    // Cache for 30 days (best-effort — a failed write just means a
    // regeneration next visit).
    try {
      const patch = { roadmap_moves: moves, roadmap_moves_at: now.toISOString() };
      if (stats) {
        await supabase.from("user_stats").update(patch).eq("user_id", userId);
      } else {
        await supabase.from("user_stats").insert({ user_id: userId, ...patch });
      }
    } catch (e) {
      console.error("roadmap-moves cache write failed:", e);
    }

    return Response.json({ moves });
  } catch (err) {
    console.error("Roadmap-moves GET error:", err);
    return Response.json({ moves: [] });
  }
}
