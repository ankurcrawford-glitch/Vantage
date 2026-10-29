import { NextRequest, NextResponse } from 'next/server';
import { DISCOVERY_QUESTIONS } from '@/lib/discovery';
import { getAuthedUser, getAdminClient } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { checkBudget, recordSpend } from '@/lib/budget';
import { buildSchoolLine } from '@/lib/school-context';
import { buildFoundationsBridge } from '@/lib/foundationsBridge';
import {
  evaluatePromptReadiness,
  allReady,
  ROUND_TABLE_WORD_RATIO,
  ROUND_TABLE_MIN_VERSIONS,
} from '@/lib/roundTableGate';

// Round Table uses Gemini Pro and synthesizes multiple essays — can take
// 20-40s on larger applications. Bump the serverless function timeout to 60s
// so responses don't get cut off mid-generation.
export const maxDuration = 60;

// Round Table is the most important feedback moment in the product — holistic
// review of a student's entire application to a specific school. It runs
// infrequently (once per major revision pass), so we use Gemini 2.5 Pro for
// the strongest reasoning and instruction-following even though it costs
// ~4x Flash.
import { CLAUDE_MODEL_PRO, callClaude, aiFailureMessage } from '@/lib/ai';
const AI_MODEL = CLAUDE_MODEL_PRO;
const COMMON_APP_COLLEGE_ID = 'a0000000-0000-0000-0000-000000000000';

// Feedback rules for Round Table (holistic application review). This is
// specifically the place that does cross-artifact analysis — looking at
// the Common App essay + supplemental essays for THIS college together —
// and identifies gaps, redundancy, and range issues across that submitted
// package. Tone is warmer than per-essay feedback because this is the
// student getting the whole-application read, and a panel-of-admissions-
// officers voice should feel encouraging even when the notes are candid.
//
// Mechanics/grammar checking is intentionally NOT part of the model's job —
// Flash-Lite and Pro both hallucinated findings. Grammar/clichés will be
// added back later as a deterministic code pass.
const FEEDBACK_RULES = `

CORE REVIEW PRINCIPLES:

HOLISTIC VIEW — your job is to read the entire set of submitted essays for this college together (Common App + this college's supplementals) and assess the package as a whole. What portrait of the student emerges across these essays? What's missing? Where do essays overlap or do the same work? Your analysis is cross-artifact by design.

BRAINSTORMING NOTES ARE NOT ESSAYS — the context may include a section called "WHAT THE STUDENT HAS SHARED ABOUT THEMSELVES." That material is private scaffolding, never submitted to any college. When a submitted essay uses material that also appears in those notes, that is GOOD — it means the student is drawing on their own raw material. Never treat overlap between an essay and this brainstorming as duplication or a range problem. Only identify redundancy BETWEEN submitted essays (Common App vs. supplementals), never between an essay and the student's private notes.

NO WRITING FOR THE STUDENT — you never write sentences, paragraphs, or opening lines on the student's behalf. Diagnose and guide. If you want them to see what "better" looks like, quote one of their own sentences as a stronger candidate or ask a question.

NO SYCOPHANCY — do not flatter the student as a person. Phrases like "you're an amazing writer," "any college would be lucky to have you," "you've done a great job" are off-limits. Praise only specific choices or passages you can quote, and only when earned.

HONEST ABOUT GAPS — if the package is thin, redundant, or doesn't capture the student as fully as their background suggests it could, say so clearly. Be specific about which essay would be the right place to address a gap. The student is getting this review because they want the truth.

GRAMMAR AND LINE-LEVEL ISSUES — if you notice a specific grammar, apostrophe, or cliché issue in one of the submitted essays, mention it naturally within your prose by quoting the exact phrase from the essay. Do NOT produce a bullet list, "Mechanics" section, or grammar checklist at the end of the response. Only comment on issues you can actually point to in a submitted essay — do not invent errors.

TONE — warm, encouraging, candid. You are a panel of experienced admissions readers who want this student to succeed. Be direct about gaps but keep the register supportive — this is the student's whole application they're seeing, and the energy should feel like advisors on their side, not a drill sergeant. No exaggerated enthusiasm, exclamation points, or emoji, but the overall tone should be warmer than per-essay feedback.`;

// GET: Fetch round table history for a college
export async function GET(request: NextRequest) {
  try {
    // SECURITY: userId from the authenticated session, not the query string.
    const auth = await getAuthedUser(request);
    if (!auth.ok) return auth.response;
    const userId = auth.userId;

    const { searchParams } = new URL(request.url);
    const collegeId = searchParams.get('collegeId');

    if (!collegeId) {
      return NextResponse.json({ error: 'collegeId required' }, { status: 400 });
    }

    let supabase;
    try {
      supabase = getAdminClient();
    } catch {
      return NextResponse.json({ error: 'Supabase config missing' }, { status: 500 });
    }

    const { data: history } = await supabase
      .from('strategic_guidance_history')
      .select('id, guidance_text, mode, created_at')
      .eq('user_id', userId)
      .eq('college_id', collegeId)
      .eq('mode', 'round_table')
      .order('created_at', { ascending: false });

    return NextResponse.json({ history: history || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // SECURITY: userId from the authenticated session, not the request body.
    // Trusting body-supplied userId would let any logged-in user exfiltrate
    // another user's complete application package.
    const auth = await getAuthedUser(request);
    if (!auth.ok) return auth.response;
    const userId = auth.userId;

    // Rate limit (per-user: 2/min, 5/hr, 15/day). Round Table uses Claude
    // Sonnet at ~2-3¢ per call — stricter limits than per-essay feedback.
    const rl = await checkRateLimit(userId, 'round-table', auth.email);
    if (!rl.ok) return rl.response;

    // Budget circuit breaker — per-user cap, global backstop, kill-switch.
    const budget = await checkBudget(userId);
    if (!budget.ok) return budget.response;

    const { collegeId } = await request.json();

    if (!collegeId) {
      return NextResponse.json({ error: 'College ID required' }, { status: 400 });
    }

    let supabase;
    try {
      supabase = getAdminClient();
    } catch {
      return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY env var is not set.' }, { status: 500 });
    }

    // ============================================
    // 1. Get all prompts for THIS college
    // ============================================
    const { data: collegePrompts } = await supabase
      .from('college_prompts')
      .select('id, prompt_text, word_limit, sort_order')
      .eq('college_id', collegeId)
      .order('sort_order');

    if (!collegePrompts || collegePrompts.length === 0) {
      return NextResponse.json({ error: 'No prompts found for this college.' }, { status: 400 });
    }

    // ============================================
    // 2. Get the Common App prompts too
    // ============================================
    const { data: commonAppPrompts } = await supabase
      .from('college_prompts')
      .select('id, prompt_text, word_limit, sort_order')
      .eq('college_id', COMMON_APP_COLLEGE_ID)
      .order('sort_order');

    // ============================================
    // 3. Get all user's essays for THIS college + Common App
    // ============================================
    const allPromptIds = [
      ...collegePrompts.map(p => p.id),
      ...(commonAppPrompts || []).map(p => p.id)
    ];

    const { data: essays } = await supabase
      .from('essays')
      .select(`
        id,
        college_prompt_id,
        essay_versions (
          version_number,
          content,
          word_count,
          is_current
        )
      `)
      .eq('user_id', userId)
      .in('college_prompt_id', allPromptIds);

    // Build a per-prompt summary: current essay content + version count.
    // Used both to feed the AI prompt below and to evaluate the Round
    // Table gate (refinement threshold, not just "started").
    const essayMap: Record<string, { content: string; wordCount: number; versionCount: number }> = {};
    essays?.forEach((essay: any) => {
      const versions = essay.essay_versions ?? [];
      const currentVersion = versions.find((v: any) => v.is_current);
      if (currentVersion && currentVersion.content && currentVersion.content.trim().length > 0) {
        essayMap[essay.college_prompt_id] = {
          content: currentVersion.content,
          wordCount: currentVersion.word_count || 0,
          versionCount: versions.length || 1,
        };
      }
    });

    // ============================================
    // 4. Gate: every supplemental for THIS college must be refined.
    //    Threshold is shared with the UI via lib/roundTableGate so the
    //    in-app lock state can never disagree with what the API enforces.
    // ============================================
    const collegePromptReadiness = collegePrompts.map(p => {
      const entry = essayMap[p.id];
      return evaluatePromptReadiness({
        promptId: p.id,
        promptOrder: p.sort_order,
        wordLimit: p.word_limit,
        wordCount: entry?.wordCount ?? 0,
        versionCount: entry?.versionCount ?? 0,
        hasContent: !!entry,
      });
    });
    const totalCollegePrompts = collegePromptReadiness.length;
    const writtenCollegeEssays = collegePromptReadiness.filter(r => r.ready).length;

    if (!allReady(collegePromptReadiness)) {
      const remaining = totalCollegePrompts - writtenCollegeEssays;
      return NextResponse.json({
        gated: true,
        writtenCount: writtenCollegeEssays,
        totalCount: totalCollegePrompts,
        readiness: collegePromptReadiness,
        threshold: {
          wordRatio: ROUND_TABLE_WORD_RATIO,
          minVersions: ROUND_TABLE_MIN_VERSIONS,
        },
        message: `The Round Table is your final-stage review — for when an essay is almost ready to submit. Each supplemental needs to hit at least ${Math.round(ROUND_TABLE_WORD_RATIO * 100)}% of its word limit and have at least ${ROUND_TABLE_MIN_VERSIONS} saved version${ROUND_TABLE_MIN_VERSIONS === 1 ? '' : 's'}. You're at ${writtenCollegeEssays} of ${totalCollegePrompts} for this school — ${remaining} still to refine.`
      }, { status: 200 });
    }

    // ============================================
    // 5. Get college name
    // ============================================
    const { data: collegeData } = await supabase
      .from('colleges')
      .select('name')
      .eq('id', collegeId)
      .single();
    const collegeName = collegeData?.name || 'this college';

    // ============================================
    // 6. Get student profile + discovery answers
    // ============================================
    const { data: userStats } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    const { data: apClasses } = await supabase
      .from('user_ap_classes')
      .select('*')
      .eq('user_id', userId);

    const { data: extracurriculars } = await supabase
      .from('user_extracurriculars')
      .select('*')
      .eq('user_id', userId);

    const { data: awards } = await supabase
      .from('user_awards')
      .select('*')
      .eq('user_id', userId);

    const { data: discoveryAnswers } = await supabase
      .from('discovery_answers')
      .select('question_id, answer')
      .eq('user_id', userId);

    // Format discovery context. We keep the brainstorming prompts with the
    // answers so the model can cross-reference themes back to essays. We
    // avoid Q/A numbering because that primes the model to treat these as
    // competing submissions.
    let discoveryContext = '';
    if (discoveryAnswers && discoveryAnswers.length > 0) {
      const flattened = discoveryAnswers
        .map((da: any) => {
          const question = DISCOVERY_QUESTIONS.find(q => q.id === da.question_id);
          return question ? `BRAINSTORMING PROMPT: ${question.question}\nSTUDENT'S RAW NOTES: ${da.answer}` : null;
        })
        .filter(Boolean);
      if (flattened.length > 0) {
        discoveryContext = `\n\nWHAT THE STUDENT HAS SHARED ABOUT THEMSELVES (PRIVATE BRAINSTORMING — NEVER submitted to any college, used only for your context in understanding who they are):

These are the student's raw notes from internal brainstorming prompts. They are NOT essays, NOT responses to college application prompts, and NOT part of any submitted application. The intended purpose is for the student to DRAW FROM this material when writing their real essays.

If a submitted essay uses content that also appears here, that is correct and desirable — it means the student is effectively using their own raw material. DO NOT flag this overlap as duplication, redundancy, or a "range" problem. Use this only as background for understanding the student and for connecting themes back to their essays. Only flag duplication BETWEEN actual submitted essays (e.g., Common App vs. supplemental essays for this college).

---

${flattened.join('\n\n---\n\n')}`;
      }
    }

    // Foundations bridge: multi-year background (counselor narrative,
    // activity threads, Spark reflections) flows into the essay
    // intelligence. Same private-scaffolding rules as discovery notes.
    discoveryContext += await buildFoundationsBridge(supabase, userId);

    // Format profile
    const profileContext = [
      userStats ? `Academics: GPA ${userStats.gpa_weighted || 'N/A'} weighted, ${userStats.gpa_unweighted || 'N/A'} unweighted. SAT: ${userStats.sat_score || 'N/A'}. ACT: ${userStats.act_score || 'N/A'}.` : '',
      apClasses?.length ? `AP Classes: ${apClasses.map((c: any) => c.class_name).join(', ')}` : '',
      extracurriculars?.length ? `Activities: ${extracurriculars.map((e: any) => `${e.activity_name}${e.role ? ` (${e.role})` : ''}`).join(', ')}` : '',
      awards?.length ? `Awards: ${awards.map((a: any) => a.award_name).join(', ')}` : '',
      userStats?.narrative_summary ? `Counselor's profile of this student (built over their years in Vantage Foundations — draw on it to understand who they are and surface authentic, specific material): ${userStats.narrative_summary}` : '',
      buildSchoolLine(userStats),
    ].filter(Boolean).join('\n');

    // ============================================
    // 7. Build the essay summaries for the prompt
    // ============================================

    // Common App essay(s)
    let commonAppSection = '';
    if (commonAppPrompts && commonAppPrompts.length > 0) {
      const commonAppEssays = commonAppPrompts.map(p => {
        const essay = essayMap[p.id];
        if (essay) {
          return `COMMON APP PROMPT: "${p.prompt_text}"\nSTUDENT'S RESPONSE (${essay.wordCount} words):\n${essay.content}`;
        }
        return `COMMON APP PROMPT: "${p.prompt_text}"\n(Not yet written)`;
      });
      commonAppSection = commonAppEssays.join('\n\n---\n\n');
    }

    // This college's essays
    const collegeEssays = collegePrompts.map(p => {
      const essay = essayMap[p.id];
      if (essay) {
        return `${collegeName.toUpperCase()} PROMPT ${p.sort_order}: "${p.prompt_text}"${p.word_limit ? ` (${p.word_limit} word limit)` : ''}\nSTUDENT'S RESPONSE (${essay.wordCount} words):\n${essay.content}`;
      }
      return `${collegeName.toUpperCase()} PROMPT ${p.sort_order}: "${p.prompt_text}"${p.word_limit ? ` (${p.word_limit} word limit)` : ''}\n(Not yet written)`;
    });
    const collegeEssaySection = collegeEssays.join('\n\n---\n\n');

    // ============================================
    // 8. Build the Round Table prompt
    // ============================================
    const systemMessage = `You are a panel of experienced college admissions officers reviewing a student's complete application to ${collegeName}. You are honest, specific, and invested in this student's success. You review applications the way a real admissions committee would — the whole picture, not individual essays in isolation. You are economical with words: the student has a deadline, so you lead with the verdict and justify it briefly. You acknowledge what works only where you can point to it, and you are direct about gaps and missed opportunities.${FEEDBACK_RULES}`;

    const aiPrompt = `You are reviewing a student's COMPLETE written application to ${collegeName}. This includes their Common App essay and all of their ${collegeName}-specific supplemental essays. Your job is to look at everything together — as a single, cohesive package — and determine whether an admissions reader at ${collegeName} would walk away with a full, compelling picture of who this student is.

IMPORTANT: ONLY review the essays listed below. Do NOT reference or discuss essays from any other school. This review is exclusively about the ${collegeName} application.

===== THE STUDENT'S PROFILE =====
${profileContext}
${discoveryContext}

===== COMMON APP ESSAY =====
${commonAppSection || '(No Common App essay written yet)'}

===== ${collegeName.toUpperCase()} SUPPLEMENTAL ESSAYS =====
${collegeEssaySection}

===== YOUR HOLISTIC REVIEW =====

The one question you are answering: **If an admissions officer at ${collegeName} only had these essays to understand this student, would they get the full picture?**

Read the profile and insight responses first — that is who this student actually is. Then read the essays and judge what made it onto the page: which defining experiences are present, which are missing entirely, and whether any two essays spend their space on the same story or the same quality. Judge it in ${collegeName}'s terms — what this particular school is looking for.

The student is weeks from a deadline. Lead with the verdict, then justify it briefly. Write exactly in this shape:

**The verdict**
One sentence on the package as a whole: what portrait emerges and whether it is complete. NEVER an admissions decision — do not write "Admit", "Deny", "Waitlist", or predict the outcome in any form; you are judging the essays, not deciding the case.
**What carries it:** one or two sentences naming the strongest material in the package, quoting a phrase if one earns it.
**What's missing:** one or two sentences naming the specific experience, activity, or quality from their profile or insight responses that appears nowhere in these essays, and which essay it belongs in.
**The one change:** one or two sentences stating the single highest-impact edit, concretely enough to act on today.

Then a blank line, then two or three short paragraphs that justify the verdict: where the essays overlap or repeat a story, how the application reads as a whole (one-note or multi-dimensional), and whether a reader at ${collegeName} specifically would be excited. Every claim points at a specific essay or a specific line. No restating the verdict, no summary at the end. Make each point once — if a paragraph repeats something already in the verdict block, delete it.

CRITICAL FORMATTING RULES — YOU MUST FOLLOW THESE EXACTLY:
1. Total length 300-400 words — 400 is a hard ceiling, not a target. Short sentences. Cut every sentence that praises without pointing at something specific.
2. The verdict block uses exactly the four bold labels above, each on its own line. After it, prose paragraphs only — NO bullet points, NO numbered lists, NO markdown headers (no # or ##), NO dashes as list items.
3. **Bold** is the only markdown allowed. Do NOT use single asterisks for emphasis.
4. Separate paragraphs with a single blank line. No horizontal rules, no "---" lines, no dividers of any kind.
5. No greeting, no "thank you for sharing", no closing encouragement. Start with **The verdict** and end on the last analytical sentence.
6. Tone: direct and specific, like a trusted admissions advisor who respects this student enough to tell them the truth about their ${collegeName} application.`;

    // Call Claude (Anthropic). See lib/ai.ts for model choice + fallbacks.
    const ai = await callClaude({
      model: AI_MODEL,
      system: systemMessage,
      prompt: aiPrompt,
      // Verdict-first review is 300-400 words, but Claude 5.5 may reason
      // before answering and that counts against max_tokens. Keep headroom.
      maxTokens: 6000,
      temperature: 0.6,
      label: 'round-table',
    });

    if (!ai.ok) {
      if (ai.transient) {
        return NextResponse.json(
          { error: 'The AI is temporarily busy. Please try again in a minute.' },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: aiFailureMessage(ai.status, 'Unable to generate the review right now. Please try again shortly.'), detail: ai.message },
        { status: 500 }
      );
    }

    let aiResponse = ai.text || 'No response generated';

    if (!aiResponse || aiResponse === 'No response generated') {
      return NextResponse.json({ error: 'No response generated. Please try again.' }, { status: 500 });
    }

    // Clean up formatting. Pure prose only now — mechanics is not part of the
    // model's job. If the model sneaks in a trailing Mechanics / Grammar
    // section despite the prompt, strip it so users don't see hallucinated
    // findings.
    {
      const trailingSectionMatch = aiResponse.match(
        /\n\s*\*\*\s*(?:Mechanics|Grammar|Spelling|Cliché|Cliches?)\s*\*\*/i
      );
      let body = aiResponse;
      if (trailingSectionMatch && typeof trailingSectionMatch.index === 'number') {
        body = aiResponse.slice(0, trailingSectionMatch.index);
      }

      aiResponse = body
        .replace(/^#{1,6}\s+(?:\d+\.?\s*)?/gm, '')
        .replace(/^[\s]*[\*\-]\s+/gm, '')
        .replace(/^[\s]*\d+\.\s+/gm, '')
        .replace(/\*{3,}/g, '**')
        .replace(/(?<!\*)\*(?!\*)/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    }

    // Record spend against per-user + global monthly counters.
    // Fire and forget — never block on analytics.
    recordSpend(userId, 'round-table').catch(() => {});

    // Auto-save to history
    const insertPayload = {
      user_id: userId,
      prompt_id: `round-table-${collegeId}`,
      college_id: collegeId,
      guidance_text: aiResponse,
      mode: 'round_table',
      essay_word_count: 0,
      essay_version_number: null,
    };
    console.log('Round Table save payload:', JSON.stringify({ ...insertPayload, guidance_text: '[truncated]' }));

    const { data: savedEntry, error: saveError } = await supabase
      .from('strategic_guidance_history')
      .insert(insertPayload)
      .select('id, created_at')
      .single();

    if (saveError) {
      console.error('ROUND TABLE SAVE ERROR:', JSON.stringify(saveError));
    } else {
      console.log('Round Table saved successfully:', savedEntry?.id);
    }

    return NextResponse.json({ 
      response: aiResponse,
      collegeName,
      savedId: savedEntry?.id || null,
      savedAt: savedEntry?.created_at || null,
      saveError: saveError ? saveError.message : null,
      essayStats: {
        written: writtenCollegeEssays,
        total: totalCollegePrompts,
        hasCommonApp: !!(commonAppPrompts?.some(p => essayMap[p.id]))
      }
    });
  } catch (error: any) {
    console.error('Error in round table API:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}