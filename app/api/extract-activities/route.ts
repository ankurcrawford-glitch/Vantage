import { NextRequest, NextResponse } from 'next/server';
import { DISCOVERY_QUESTIONS } from '@/lib/discovery';
import { getAuthedUser, getAdminClient } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { createHash } from 'crypto';

// Activity extraction reads the student's Story Builder answers and
// surfaces extracurriculars they've described in prose, as candidates
// they can promote into their Profile. Flash, not Pro — this is
// structured extraction, not creative reasoning. Runs on a debounce so
// rapid Story Builder edits don't hammer Gemini.
export const maxDuration = 30;

const AI_MODEL = 'gemini-2.5-flash';

// How often we'll re-run extraction for a given user. Short enough that
// a student adding a paragraph and hopping to Profile sees suggestions;
// long enough that a save-as-you-type pattern wouldn't trigger one call
// per keystroke.
const DEBOUNCE_MS = 60 * 1000;

interface ExtractedActivity {
  name: string;
  role?: string;
  description?: string;
  source_question_id?: string;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthedUser(request);
    if (!auth.ok) return auth.response;
    const userId = auth.userId;

    const rl = await checkRateLimit(userId, 'extract-activities');
    if (!rl.ok) return rl.response;

    let supabase;
    try {
      supabase = getAdminClient();
    } catch {
      return NextResponse.json({ error: 'Supabase config missing' }, { status: 500 });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY env var is not set.' }, { status: 500 });
    }

    // ============================================
    // 1. Load discovery answers
    // ============================================
    const { data: discoveryAnswers } = await supabase
      .from('discovery_answers')
      .select('question_id, answer')
      .eq('user_id', userId);

    if (!discoveryAnswers || discoveryAnswers.length === 0) {
      return NextResponse.json({ status: 'skipped', reason: 'no_answers', added: 0 });
    }

    // ============================================
    // 2. Debounce: skip if we extracted recently AND the answers
    //    haven't changed since.
    // ============================================
    const answerCorpus = discoveryAnswers
      .map((d: any) => `${d.question_id}|${(d.answer ?? '').trim()}`)
      .sort()
      .join('\n');
    const answerHash = createHash('sha256').update(answerCorpus).digest('hex');

    const { data: lastRun } = await supabase
      .from('activity_extraction_runs')
      .select('last_run_at, last_answer_hash')
      .eq('user_id', userId)
      .maybeSingle();

    if (lastRun) {
      const ageMs = Date.now() - new Date(lastRun.last_run_at).getTime();
      const sameContent = lastRun.last_answer_hash === answerHash;
      if (sameContent || ageMs < DEBOUNCE_MS) {
        return NextResponse.json({
          status: 'skipped',
          reason: sameContent ? 'unchanged_content' : 'debounce',
          added: 0,
        });
      }
    }

    // ============================================
    // 3. Load existing extracurriculars to dedupe against. We include
    //    accepted (the user already has it) AND rejected (the user said
    //    no, don't ask again).
    // ============================================
    const { data: existing } = await supabase
      .from('user_extracurriculars')
      .select('activity_name, status')
      .eq('user_id', userId)
      .in('status', ['accepted', 'rejected', 'suggested']);

    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const dedupeKeys = new Set<string>(
      (existing ?? []).map((e: any) => normalize(e.activity_name))
    );

    // ============================================
    // 4. Build the prompt — note we explicitly forbid the model from
    //    inventing activities, and tell it to skip generic mentions
    //    (jobs, hobbies that aren't formal activities, etc.).
    // ============================================
    const formattedAnswers = discoveryAnswers
      .map((da: any) => {
        const q = DISCOVERY_QUESTIONS.find(qq => qq.id === da.question_id);
        return q ? `Q[${q.id}]: ${q.question}\nA: ${(da.answer ?? '').trim()}` : null;
      })
      .filter(Boolean)
      .join('\n\n---\n\n');

    const existingList = (existing ?? [])
      .map((e: any) => `- ${e.activity_name} (${e.status})`)
      .join('\n') || '(none)';

    const aiPrompt = `You are reading a high school student's reflective answers from their Story Builder. Extract every NAMED extracurricular activity, club, team, organization, or sustained project the student describes participating in.

Rules:
1. Only extract activities that have a clear name or identity (e.g., "Bridge Club", "varsity baseball", "Little League coaching in Oakland", "Howard summer leadership program"). Do NOT extract vague hobbies or one-off events without a recurring structure.
2. Do NOT invent activities. If the student didn't describe it, don't list it.
3. Do NOT extract academic classes — those belong elsewhere.
4. For each, return name, optional role, optional one-sentence description, and the source question id where you found it.
5. Skip activities already in the student's existing list below — do not re-extract them.

EXISTING ACTIVITIES (skip anything matching these):
${existingList}

STORY BUILDER ANSWERS:
${formattedAnswers}

Return your output as a strict JSON array of objects with shape:
[{ "name": "...", "role": "...", "description": "...", "source_question_id": "..." }]

If you find nothing new, return an empty array: []
Do not include any prose, markdown, or commentary outside the JSON.`;

    // ============================================
    // 5. Call Gemini
    // ============================================
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${AI_MODEL}:generateContent?key=${geminiApiKey}`;
    const geminiBody = JSON.stringify({
      contents: [{ parts: [{ text: aiPrompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1200,
        responseMimeType: 'application/json',
      },
    });

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: geminiBody,
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Extraction request failed.' }, { status: 502 });
    }

    const data = await response.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]';

    let extracted: ExtractedActivity[] = [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) extracted = parsed;
    } catch (e) {
      console.error('extract-activities: invalid JSON from Gemini', { raw: raw.slice(0, 400) });
      // Still record the run so we don't retry immediately.
    }

    // ============================================
    // 6. Filter to net-new only (model may ignore the skip list).
    // ============================================
    const fresh: ExtractedActivity[] = [];
    for (const item of extracted) {
      if (!item?.name || typeof item.name !== 'string') continue;
      const key = normalize(item.name);
      if (!key || dedupeKeys.has(key)) continue;
      dedupeKeys.add(key);
      fresh.push({
        name: item.name.trim().slice(0, 120),
        role: item.role?.toString().trim().slice(0, 120) || undefined,
        description: item.description?.toString().trim().slice(0, 500) || undefined,
        source_question_id: item.source_question_id?.toString().trim() || undefined,
      });
    }

    let added = 0;
    if (fresh.length > 0) {
      const rows = fresh.map((f) => ({
        user_id: userId,
        activity_name: f.name,
        role: f.role ?? null,
        description: f.description ?? null,
        status: 'suggested',
        source_question_id: f.source_question_id ?? null,
        suggested_at: new Date().toISOString(),
      }));
      const { data: inserted, error: insertError } = await supabase
        .from('user_extracurriculars')
        .insert(rows)
        .select('id');
      if (insertError) {
        console.error('extract-activities insert error', insertError);
        return NextResponse.json({ error: 'Failed to save suggestions.' }, { status: 500 });
      }
      added = inserted?.length ?? 0;
    }

    // ============================================
    // 7. Record run timestamp + content hash so the next call can debounce.
    // ============================================
    await supabase
      .from('activity_extraction_runs')
      .upsert({
        user_id: userId,
        last_run_at: new Date().toISOString(),
        last_answer_hash: answerHash,
      });

    return NextResponse.json({ status: 'ok', added });
  } catch (error: any) {
    console.error('extract-activities error', error);
    return NextResponse.json({ error: error.message ?? 'Unknown error' }, { status: 500 });
  }
}
