import { NextRequest, NextResponse } from 'next/server';
import { DISCOVERY_QUESTIONS } from '@/lib/discovery';
import { getAuthedUser, getAdminClient } from '@/lib/auth';

// Round Table uses Gemini Pro and synthesizes multiple essays — can take
// 20-40s on larger applications. Bump the serverless function timeout to 60s
// so responses don't get cut off mid-generation.
export const maxDuration = 60;

// Round Table is the most important feedback moment in the product — holistic
// review of a student's entire application to a specific school. It runs
// infrequently (once per major revision pass), so we use Gemini 2.5 Pro for
// the strongest reasoning and instruction-following even though it costs
// ~4x Flash.
const AI_MODEL = 'gemini-2.5-pro';
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

    // Get Gemini API key
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json({ 
        error: 'GEMINI_API_KEY env var is not set.' 
      }, { status: 500 });
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

    // Build a map of promptId -> current essay content
    const essayMap: Record<string, { content: string; wordCount: number }> = {};
    essays?.forEach((essay: any) => {
      const currentVersion = essay.essay_versions?.find((v: any) => v.is_current);
      if (currentVersion && currentVersion.content && currentVersion.content.trim().length > 0) {
        essayMap[essay.college_prompt_id] = {
          content: currentVersion.content,
          wordCount: currentVersion.word_count || 0
        };
      }
    });

    // ============================================
    // 4. Check if ALL of THIS college's essays are written
    // ============================================
    const collegePromptIds = collegePrompts.map(p => p.id);
    const writtenCollegeEssays = collegePromptIds.filter(id => essayMap[id]).length;
    const totalCollegePrompts = collegePromptIds.length;

    if (writtenCollegeEssays < totalCollegePrompts) {
      const remaining = totalCollegePrompts - writtenCollegeEssays;
      return NextResponse.json({
        gated: true,
        writtenCount: writtenCollegeEssays,
        totalCount: totalCollegePrompts,
        message: `The Round Table needs to see your complete application before it can give you a meaningful review. You've written ${writtenCollegeEssays} of ${totalCollegePrompts} essays for this school — ${remaining} still to go. Finish all of them, and the Round Table will assess how well your full application comes together as a package.`
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

    // Format profile
    const profileContext = [
      userStats ? `Academics: GPA ${userStats.gpa_weighted || 'N/A'} weighted, ${userStats.gpa_unweighted || 'N/A'} unweighted. SAT: ${userStats.sat_score || 'N/A'}. ACT: ${userStats.act_score || 'N/A'}.` : '',
      apClasses?.length ? `AP Classes: ${apClasses.map((c: any) => c.class_name).join(', ')}` : '',
      extracurriculars?.length ? `Activities: ${extracurriculars.map((e: any) => `${e.activity_name}${e.role ? ` (${e.role})` : ''}`).join(', ')}` : '',
      awards?.length ? `Awards: ${awards.map((a: any) => a.award_name).join(', ')}` : '',
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
    const systemMessage = `You are a panel of experienced college admissions officers reviewing a student's complete application to ${collegeName}. You are warm, honest, and deeply invested in this student's success. You review applications the way a real admissions committee would — looking at the whole picture, not individual essays in isolation. Your tone is supportive and candid. You acknowledge what is working in the package where you can point to it specifically, and you are direct about gaps and missed opportunities. The overall energy is a panel of advisors who want this student to put their best foot forward, and who tell them the truth warmly.${FEEDBACK_RULES}`;

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

Your primary job is to answer one critical question: **If an admissions officer at ${collegeName} only had these essays to understand this student, would they get the full picture?**

Start by looking at the student's insight responses, activities, and experiences. These represent who this student truly is — their values, their passions, the moments that shaped them, the things they care most about. Now look at the essays. Which of those most important and impactful experiences actually made it into the application? Which ones are completely absent?

This is the most important part of your review. Be very specific. Name the experiences, activities, or qualities from their profile and insight responses that are missing from the essays entirely. An admissions reader will never know about these things unless they appear in the writing. If a student's most defining experience or deepest passion isn't captured anywhere in these essays, that is a major gap. Tell the student exactly what's missing and suggest which specific essay would be the best place to weave it in.

Next, look for redundancy. Are multiple essays telling the same type of story, showcasing the same quality, or drawing on the same experience? Every essay is precious real estate. If two essays both demonstrate leadership, or both focus on academic curiosity, one of them should pivot to reveal a different dimension of who this student is. Be specific about which essays overlap and what each could show instead.

Then assess how the application reads as a whole. When you finish reading all the essays together, what portrait of the student emerges? Is it multi-dimensional — showing intellectual depth, personal values, community impact, and individual voice? Or does it feel one-note? Would an admissions officer at ${collegeName} specifically feel excited about this student?

End with your honest assessment of the single most impactful change this student could make to strengthen their overall application package.

CRITICAL FORMATTING RULES — YOU MUST FOLLOW THESE EXACTLY:
1. Write ONLY in flowing prose paragraphs. NO bullet points. NO numbered lists. NO markdown headers (no # or ##). NO dashes as list items. NO "Mechanics" section or grammar list.
2. Use **bold** sparingly for key terms or phrases. That is the ONLY markdown allowed.
3. Separate paragraphs with a single blank line.
4. Do NOT use asterisks for emphasis except **double asterisks for bold**.
5. Tone: warm but measured, honest and specific — like a trusted admissions advisor who respects this student enough to tell them the truth about their ${collegeName} application.
6. Keep it focused and substantial but not overwhelming — 5-8 paragraphs.`;

    // Call Gemini
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${AI_MODEL}:generateContent?key=${geminiApiKey}`;
    const geminiBody = JSON.stringify({
      systemInstruction: { parts: [{ text: systemMessage }] },
      contents: [{ parts: [{ text: aiPrompt }] }],
      generationConfig: {
        // Pro had mid-generation truncation at lower temperatures (0.35) on
        // long structured output — same pattern we saw with Flash. Bumping
        // to 0.6 stabilizes it. With the tightened anti-sycophancy rules in
        // FEEDBACK_RULES, moderate temperature doesn't cause drift back to
        // generic praise.
        temperature: 0.6,
        // Round Table synthesizes the full application package plus a
        // Mechanics section — needs more output headroom than per-essay
        // feedback. 4000 tokens ≈ 3000 words.
        maxOutputTokens: 4000,
      },
      // Override default safety thresholds. Gemini's defaults are aggressive
      // enough that feedback on essays touching on identity, mental health,
      // or difficult experiences can trigger silent mid-generation truncation.
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
      ],
    });

    // One automatic retry on transient capacity errors (429 / 503).
    async function callGemini(attempt: number): Promise<Response> {
      const res = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: geminiBody,
      });
      if ((res.status === 429 || res.status === 503) && attempt === 0) {
        await new Promise((r) => setTimeout(r, 2000));
        return callGemini(1);
      }
      return res;
    }

    const response = await callGemini(0);

    if (!response.ok) {
      const errorText = await response.text();
      let errorDetails;
      try { errorDetails = JSON.parse(errorText); } catch { errorDetails = { message: errorText }; }
      console.error('Gemini API error:', response.status, errorDetails);
      if (response.status === 429 || response.status === 503) {
        return NextResponse.json(
          { error: 'The AI is temporarily busy. Please try again in a minute.' },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: 'Unable to generate the review right now. Please try again shortly.' },
        { status: 500 }
      );
    }

    const data = await response.json();
    let aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';

    // Log Gemini response metadata so we can diagnose truncation / safety
    // filter issues from Vercel function logs. Grep for "[round-table]".
    console.log('[round-table] gemini response', JSON.stringify({
      model: AI_MODEL,
      finishReason: data.candidates?.[0]?.finishReason,
      safetyRatings: data.candidates?.[0]?.safetyRatings,
      promptFeedback: data.promptFeedback,
      rawLength: aiResponse.length,
      rawTailPreview: aiResponse.slice(-200),
    }));

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