// app/api/foundations/spark/route.js
// ─── Vantage Foundations — Spark API ─────────────────────────────
// Monthly reflection ritual. GET returns this month's prompt plus the
// student's vault (archive). POST banks a reflection for the current
// month. Auth from the session token; writes via service role
// (RLS on foundations_spark_entries is select-only).

import { getAuthedUser, getAdminClient } from "@/lib/auth";

// One prompt per calendar month. Deliberately personal, never "college-y" —
// raw material that becomes essay gold in senior year.
const PROMPTS = [
  { prompt: "What did you do this month that you'd do even if nobody ever knew?", hint: "Not for the resume. For you. Five minutes, no editing." },
  { prompt: "Describe a moment this month when you changed your mind about something.", hint: "Small counts. What did it feel like right before you flipped?" },
  { prompt: "What's something you're secretly proud of that would sound weird to brag about?", hint: "The weirder the better. Write what's true." },
  { prompt: "Who did you help this month — and who helped you?", hint: "Two short stories. Don't clean them up." },
  { prompt: "What frustrated you most this month? What did you do about it?", hint: "It's fine if the answer is 'nothing yet.' Write that down too." },
  { prompt: "Describe a moment this year when you felt most like yourself.", hint: "Don't write what sounds good. Write what's true. Five minutes, no editing." },
  { prompt: "What's something you believed at the start of the school year that you don't believe now?", hint: "One belief. What changed it?" },
  { prompt: "What did you make, build, fix, or start this month?", hint: "A playlist counts. A group chat counts. What did it take?" },
  { prompt: "Write about a five-minute moment from this month you never want to forget.", hint: "Slow it down. What did you see, hear, think?" },
  { prompt: "What's the hardest conversation you had recently?", hint: "You don't have to share it with anyone. Just get it on the page." },
  { prompt: "What are you better at than you were a year ago? How do you know?", hint: "Evidence over adjectives." },
  { prompt: "If this year had a chapter title, what would it be — and why?", hint: "Write the first paragraph of that chapter." },
];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function currentMonth() {
  const now = new Date();
  const m = now.getMonth();
  return {
    key: `${now.getFullYear()}-${String(m + 1).padStart(2, "0")}`,
    label: `${MONTH_NAMES[m]} ${now.getFullYear()}`,
    ...PROMPTS[m],
  };
}

function labelFromKey(key) {
  const [y, m] = key.split("-").map((n) => parseInt(n, 10));
  if (!y || !m) return key;
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

export async function GET(request) {
  try {
    const auth = await getAuthedUser(request);
    if (!auth.ok) return auth.response;

    const supabase = getAdminClient();
    const { data: rows, error } = await supabase
      .from("foundations_spark_entries")
      .select("id, month_key, prompt, content, created_at")
      .eq("user_id", auth.userId)
      .order("created_at", { ascending: false });
    if (error) throw error;

    const month = currentMonth();
    const entries = rows || [];
    const banked = entries.some((r) => r.month_key === month.key);
    const archive = entries.map((r) => ({
      month: labelFromKey(r.month_key),
      prompt: r.prompt,
      excerpt: r.content.length > 180 ? r.content.slice(0, 180).trimEnd() + "…" : r.content,
      threads: [],
    }));

    return Response.json({
      month: month.label,
      prompt: month.prompt,
      hint: month.hint,
      banked,
      bankCount: entries.length,
      archive,
    });
  } catch (err) {
    console.error("Spark GET error:", err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await getAuthedUser(request);
    if (!auth.ok) return auth.response;

    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Bad request" }, { status: 400 });
    }
    const content = String(body?.content ?? "").trim().slice(0, 8000);
    if (!content) return Response.json({ error: "Nothing to save" }, { status: 400 });

    const month = currentMonth();
    const supabase = getAdminClient();
    const { error } = await supabase.from("foundations_spark_entries").insert({
      user_id: auth.userId,
      month_key: month.key,
      prompt: month.prompt,
      content,
    });
    if (error) throw error;

    return Response.json({ ok: true });
  } catch (err) {
    console.error("Spark POST error:", err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
