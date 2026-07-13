import { NextRequest, NextResponse } from 'next/server';
import { getAuthedUser, getAdminClient } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';

// School lookup + classification.
//
// The student gives us their high school's name and city. We ask Claude to
// classify it into type (public/private/...), tier (private feeder strength),
// and opportunity context (how resourced the school is) — because admissions
// offices read every applicant IN CONTEXT of their school's profile:
//   - Top-tier private feeders have counselor relationships and placement
//     track records that materially help their students.
//   - An excellent student from an under-resourced public school reads as
//     MORE impressive, not less — achievement relative to opportunity.
//
// Design constraints:
//   - Conservative by instruction: if the model doesn't recognize the school,
//     it says so and we store nothing beyond the name. Per product decision,
//     "no data on a standard public school" is a fine outcome — the student's
//     stats stand on their own.
//   - No invented statistics. The summary is qualitative framing only.
//   - Every enum is re-validated server-side; a hallucinated value degrades
//     to null rather than poisoning the classifier.

export const maxDuration = 30;

const MODEL = 'claude-haiku-4-5-20251001'; // same chat tier as counselor route

const VALID_TYPES = ['public', 'private', 'charter', 'magnet', 'parochial', 'homeschool', 'other'] as const;
const VALID_TIERS = ['top_feeder', 'strong', 'standard'] as const;
const VALID_OPPORTUNITY = ['under_resourced', 'standard', 'well_resourced'] as const;

const SYSTEM_PROMPT = `You are a college-admissions data assistant. Given a US high school's name and location, classify it the way an admissions office would read the school's profile.

Respond with ONLY a JSON object — no prose, no code fences:
{
  "recognized": boolean,        // true only if you are confident you know THIS specific school
  "type": "public" | "private" | "charter" | "magnet" | "parochial" | "homeschool" | "other" | null,
  "tier": "top_feeder" | "strong" | "standard" | null,   // private/parochial schools only; null for public
  "opportunity": "under_resourced" | "standard" | "well_resourced" | null,
  "summary": string | null,     // 2-3 sentences: how admissions officers read this school's context. No invented statistics.
  "confidence": "high" | "medium" | "low"
}

Rules — be conservative:
- "top_feeder" is reserved for nationally known private feeders (e.g. Phillips Exeter, Phillips Andover, Harvard-Westlake, Trinity School NYC, Lakeside, Choate). These schools have college-counseling relationships and placement track records that materially advocate for their students. If in doubt, use "strong" or "standard".
- "strong" = regionally respected private school with real placement history. "standard" = everything else.
- "opportunity" reflects resources: "under_resourced" = limited AP/IB offerings, high free/reduced-lunch population, under-funded district (common for inner-city schools). "well_resourced" = wealthy district or elite private with extensive offerings. Use "standard" or null when you don't know.
- Famous public magnets (Stuyvesant, Thomas Jefferson HS for Science & Tech, Boston Latin) are type "magnet", opportunity "well_resourced", tier null.
- If you do not recognize the school, set recognized=false, all classification fields null, confidence "low". NEVER guess a tier or opportunity for a school you don't know. Never invent enrollment numbers, rankings, or statistics.
- The summary must be honest framing ("how colleges will read you"), never a promise of admissions advantage.`;

function pick<T extends readonly string[]>(valid: T, v: unknown): T[number] | null {
  return typeof v === 'string' && (valid as readonly string[]).includes(v) ? (v as T[number]) : null;
}

export async function POST(request: NextRequest) {
  const auth = await getAuthedUser(request);
  if (!auth.ok) return auth.response;
  const userId = auth.userId;

  const limit = await checkRateLimit(userId, 'school-lookup');
  if (!limit.ok) return limit.response;

  let body: { schoolName?: string; city?: string; state?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const schoolName = (body.schoolName ?? '').trim().slice(0, 120);
  const city = (body.city ?? '').trim().slice(0, 80);
  const state = (body.state ?? '').trim().toUpperCase().slice(0, 2);

  if (schoolName.length < 2) {
    return NextResponse.json({ error: 'School name is required' }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'Lookup unavailable' }, { status: 503 });
  }

  const location = [city, state].filter(Boolean).join(', ');
  const userMsg = `High school: "${schoolName}"${location ? ` in ${location}` : ''}. Classify it.`;

  let parsed: Record<string, unknown> = {};
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 500,
        temperature: 0,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMsg }],
      }),
    });
    if (!res.ok) {
      console.error('school-lookup: Anthropic error', await res.text());
      return NextResponse.json({ error: 'Lookup failed, try again' }, { status: 502 });
    }
    const data = await res.json();
    const text = (data.content || [])
      .filter((b: { type: string }) => b.type === 'text')
      .map((b: { text: string }) => b.text)
      .join('\n')
      .trim()
      .replace(/^```(?:json)?/i, '')
      .replace(/```$/, '')
      .trim();
    parsed = JSON.parse(text);
  } catch (e) {
    console.error('school-lookup: parse failure', e);
    return NextResponse.json({ error: 'Lookup failed, try again' }, { status: 502 });
  }

  const recognized = parsed.recognized === true;
  const type = recognized ? pick(VALID_TYPES, parsed.type) : null;
  // Tier only makes sense for private-side schools.
  const tier =
    recognized && (type === 'private' || type === 'parochial')
      ? pick(VALID_TIERS, parsed.tier)
      : null;
  const opportunity = recognized ? pick(VALID_OPPORTUNITY, parsed.opportunity) : null;
  const summary =
    recognized && typeof parsed.summary === 'string' ? parsed.summary.slice(0, 1000) : null;

  const fields = {
    school_name: schoolName,
    school_city: city || null,
    school_type: type,
    school_tier: tier,
    school_opportunity: opportunity,
    school_context: summary,
    school_context_data: { ...parsed, looked_up: { schoolName, city, state } },
    school_looked_up_at: new Date().toISOString(),
  };

  // Same insert-or-update pattern as lib/save-user-stats (PostgREST upsert
  // has bitten this codebase before).
  const admin = getAdminClient();
  const { data: existing, error: selErr } = await admin
    .from('user_stats')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (selErr) {
    console.error('school-lookup: select failed', selErr);
    return NextResponse.json({ error: 'Could not save result' }, { status: 500 });
  }
  const { error: saveErr } = existing
    ? await admin.from('user_stats').update(fields).eq('user_id', userId)
    : await admin.from('user_stats').insert({ user_id: userId, ...fields });
  if (saveErr) {
    console.error('school-lookup: save failed', saveErr);
    return NextResponse.json({ error: 'Could not save result' }, { status: 500 });
  }

  return NextResponse.json({
    recognized,
    type,
    tier,
    opportunity,
    summary,
    confidence: typeof parsed.confidence === 'string' ? parsed.confidence : 'low',
  });
}
