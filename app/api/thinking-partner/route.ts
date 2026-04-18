import { NextRequest, NextResponse } from 'next/server';
import { DISCOVERY_QUESTIONS } from '@/lib/discovery';
import { getAuthedUser, getAdminClient } from '@/lib/auth';

// Feedback generation with Flash can take 10-20s. Bump the serverless
// function timeout to 60s so responses don't get cut off mid-generation.
export const maxDuration = 60;

// Model selection by mode. Currently both use flash-lite:
// - Flash (gemini-2.5-flash) had mid-generation truncation with non-empty
//   essay content at low temperatures; flash-lite is stable under the same
//   conditions.
// - With the tightened FEEDBACK_RULES / temperature 0.3, flash-lite follows
//   the anti-sycophancy rules well enough to pass the acceptance bar, so
//   the extra cost of Flash is not justified right now.
// If quality regresses or we need stronger reasoning, revisit:
// - 'gemini-2.5-flash' at higher temperature (0.5+)
// - 'gemini-2.0-flash' (different version, more stable at low temp)
// - 'gemini-2.5-pro' (expensive but highest quality)
const MODEL_BRAINSTORM = 'gemini-2.5-flash-lite';
const MODEL_FEEDBACK = 'gemini-2.5-flash-lite';
const MIN_INSIGHT_ANSWERS = 6;

// Shared feedback rules for per-essay (standalone) review. These are injected
// into every mode's systemMessage. The rules here intentionally scope the
// review to THIS essay against THIS prompt — cross-artifact analysis (range
// across essays, redundancy across the application) belongs in the Round
// Table route, not here.
const FEEDBACK_RULES = `

CORE FEEDBACK PRINCIPLES:

STANDALONE REVIEW — this is a review of THIS single essay draft against THIS single prompt. Do not compare the draft against other essays the student may be writing elsewhere. Do not compare the draft against the student's private brainstorming notes. Never tell the student their essay "overlaps with" another response or suggest they need a "different story" for range. That analysis is done separately. Your job here is: does this draft, on its own, answer this prompt well?

NO WRITING FOR THE STUDENT — you never write sentences, paragraphs, or opening lines on the student's behalf. Your job is to guide and diagnose. Ask questions, point at what they already wrote, suggest directions. If you want them to see what "better" looks like, call out one of their own sentences as a stronger candidate or ask a Socratic question.

NO SYCOPHANCY — do not flatter the student or praise them as a person. Phrases like "you're an amazing writer," "any college would be lucky to have you," "this is a strong foundation," "great job," "nice work" are off-limits. Praise only specific sentences or choices in the draft, and only when the praise is earned. If you cannot quote a short phrase from the draft to support a positive comment, do not make the positive comment.

HONEST ABOUT WEAKNESSES — if a draft is off-prompt, generic, cliché-heavy, or telling instead of showing, say so clearly and explain why. Be constructive but be honest.

USING THE STUDENT'S BRAINSTORMING NOTES — the context may include a section called "WHAT THE STUDENT HAS SHARED ABOUT THEMSELVES." That material is private scaffolding, not submitted content. Use it to understand who the student is and to suggest specific experiences or details they could weave into this essay. Never treat it as content to compare against for overlap or redundancy. Never refer to it as "Q1," "Q4," "your Insight Question response," etc.

REQUIRED MECHANICS PASS — the essay draft is wrapped between the exact markers \`<<<ESSAY_DRAFT_BEGIN>>>\` and \`<<<ESSAY_DRAFT_END>>>\`. Mechanics findings may ONLY quote text that appears literally between those two markers. Text outside those markers is CONTEXT (the student's brainstorming notes, profile, prompt, previous guidance) — it is NOT submitted writing and MUST NOT be scanned, quoted, or flagged in the Mechanics section. If a cliché or apostrophe error appears only in the brainstorming notes (e.g., "im pacing myself," "dont talk about it"), do not flag it — it is not part of the essay.

Before writing each Mechanics bullet, verify the quoted phrase appears character-for-character between the two markers. If it does not, drop the bullet. Never invent errors and never pull from context. Scan for:
1. Missing apostrophes (e.g. "todays" → "today's", "its" where "it's" is meant, "everyones", "im", "dont"). Flag ONLY if the exact misspelling appears in the draft.
2. Cliché phrases if they appear ("in today's world," "at the end of the day," "the glue that holds," "memories I will carry forever," "the person I am today," "staying connected to my roots," "spending quality time," "the people who matter most," "taught me the value of," "taught me the importance of," "I learned that," "in conclusion," "to conclude," "all in all"). Quote the exact phrase.
3. "In conclusion" / "To conclude" / "In summary" endings — flag only if actually used.
4. Passive voice that obscures meaning — flag only specific instances you can quote.
List each distinct issue at most ONCE. Never repeat the same finding.

MECHANICS OUTPUT FORMAT — put the mechanics findings in a clearly separated section at the very end of your response:
- Begin with a bold header on its own line: **Mechanics**
- Then list each finding on its own line, prefixed with a hyphen and a space. One finding per line. This is the only place in your response where list formatting is allowed.
- If you find no mechanics or cliché issues, write: "- No mechanics or cliché issues found."
Do not merge the mechanics list into the prose body.

TONE — warm, honest, specific. Like a trusted mentor who respects the student enough to tell them the truth about this draft. No exaggerated enthusiasm. No exclamation points. No emoji.`;

// Determine guidance mode based on essay maturity
function determineMode(essayContent: string | null, wordCount: number, versionNumber: number): string {
  if (!essayContent || wordCount < 50) return 'pre_writing';
  if (wordCount < 200 || versionNumber <= 1) return 'early_draft';
  return 'revision';
}

// Clean markdown artifacts from AI response.
// The prose body is forced into plain paragraphs. The Mechanics section at
// the end (marked by a **Mechanics** header) keeps its list format intact.
function cleanResponse(text: string): string {
  // Split off the Mechanics section if present so its list survives cleaning.
  const mechanicsMatch = text.match(/\n\s*\*\*Mechanics\*\*\s*\n/i);

  let body = text;
  let mechanics = '';

  if (mechanicsMatch && typeof mechanicsMatch.index === 'number') {
    body = text.slice(0, mechanicsMatch.index);
    mechanics = text.slice(mechanicsMatch.index);
  }

  const cleanedBody = body
    // Remove markdown headers (### 1. PROMPT FIT, ## Strengths, etc.)
    .replace(/^#{1,6}\s+(?:\d+\.?\s*)?/gm, '')
    // Remove bullet points (* item, - item)
    .replace(/^[\s]*[\*\-]\s+/gm, '')
    // Remove numbered lists (1. item, 2. item)
    .replace(/^[\s]*\d+\.\s+/gm, '')
    // Collapse triple+ asterisks down to bold
    .replace(/\*{3,}/g, '**')
    // Remove single asterisks (italic) but keep ** (bold)
    .replace(/(?<!\*)\*(?!\*)/g, '')
    // Collapse 3+ newlines
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Light cleanup on the mechanics section — strip stray triple asterisks
  // but keep the header and hyphen-prefixed list intact.
  const cleanedMechanics = mechanics
    .replace(/\*{3,}/g, '**')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return cleanedMechanics
    ? `${cleanedBody}\n\n${cleanedMechanics}`
    : cleanedBody;
}

// ============================================
// GET: Fetch guidance history for a prompt
// ============================================
export async function GET(request: NextRequest) {
  try {
    // SECURITY: userId comes from the authenticated session, not the query
    // string. Query-string userId is accepted only as a legacy no-op and is
    // ignored. Never trust user-supplied identifiers for scoping reads.
    const auth = await getAuthedUser(request);
    if (!auth.ok) return auth.response;
    const userId = auth.userId;

    const { searchParams } = new URL(request.url);
    const promptId = searchParams.get('promptId');

    if (!promptId) {
      return NextResponse.json({ error: 'promptId required' }, { status: 400 });
    }

    let supabase;
    try {
      supabase = getAdminClient();
    } catch {
      return NextResponse.json({ error: 'Supabase config missing' }, { status: 500 });
    }

    const { data: history, error } = await supabase
      .from('strategic_guidance_history')
      .select('id, guidance_text, mode, essay_word_count, essay_version_number, created_at')
      .eq('user_id', userId)
      .eq('prompt_id', promptId)
      .neq('mode', 'round_table')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching guidance history:', error);
      return NextResponse.json({ error: 'Failed to load guidance history' }, { status: 500 });
    }

    return NextResponse.json({ history: history || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================
// POST: Generate new guidance + auto-save
// ============================================
export async function POST(request: NextRequest) {
  try {
    // SECURITY: userId is derived from the authenticated session cookie, not
    // the request body. Any userId the client puts in the body is ignored —
    // trusting it would let any logged-in user read or write another user's
    // essays, insight answers, and guidance history.
    const auth = await getAuthedUser(request);
    if (!auth.ok) return auth.response;
    const userId = auth.userId;

    const { essayContent, promptId, collegeId } = await request.json();

    if (!promptId) {
      return NextResponse.json({ error: 'Prompt ID required' }, { status: 400 });
    }

    let supabase;
    try {
      supabase = getAdminClient();
    } catch {
      return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY env var is not set.' }, { status: 500 });
    }

    // ============================================
    // Gate: Check insight question completion
    // ============================================
    const { data: discoveryAnswers } = await supabase
      .from('discovery_answers')
      .select('question_id, answer')
      .eq('user_id', userId);

    const answeredCount = discoveryAnswers?.length || 0;

    if (answeredCount < MIN_INSIGHT_ANSWERS) {
      return NextResponse.json({
        gated: true,
        answeredCount,
        requiredCount: MIN_INSIGHT_ANSWERS,
        message: `Strategic Intelligence works best when it truly understands who you are — your experiences, your values, the moments that shaped you. Right now, you've answered ${answeredCount} of 12 Insight Questions. To unlock this feature, take a few minutes to complete at least ${MIN_INSIGHT_ANSWERS}. The more you share, the more personalized and powerful your guidance becomes.`
      });
    }

    // ============================================
    // Get current essay version info
    // ============================================
    let currentVersionNumber = 0;
    const { data: essayData } = await supabase
      .from('essays')
      .select('id, essay_versions(version_number, is_current)')
      .eq('user_id', userId)
      .eq('college_prompt_id', promptId)
      .single();

    if (essayData?.essay_versions) {
      const current = (essayData.essay_versions as any[]).find((v: any) => v.is_current);
      currentVersionNumber = current?.version_number || 0;
    }

    // ============================================
    // Determine mode based on essay maturity
    // ============================================
    const wordCount = essayContent ? essayContent.trim().split(/\s+/).filter((w: string) => w.length > 0).length : 0;
    const mode = determineMode(essayContent, wordCount, currentVersionNumber);

    // ============================================
    // Pull context
    // ============================================
    const { data: currentPrompt } = await supabase
      .from('college_prompts')
      .select('*')
      .eq('id', promptId)
      .single();

    const { data: userStats } = await supabase.from('user_stats').select('*').eq('user_id', userId).single();
    const { data: apClasses } = await supabase.from('user_ap_classes').select('*').eq('user_id', userId);
    const { data: extracurriculars } = await supabase.from('user_extracurriculars').select('*').eq('user_id', userId);
    const { data: awards } = await supabase.from('user_awards').select('*').eq('user_id', userId);

    let collegeName = null;
    if (collegeId) {
      const { data: collegeData } = await supabase.from('colleges').select('name').eq('id', collegeId).single();
      collegeName = collegeData?.name || null;
    }

    const profile = {
      apClasses: apClasses?.map((c: any) => c.class_name) || [],
      extracurriculars: extracurriculars?.map((e: any) => ({
        activity: e.activity_name, role: e.role, description: e.description
      })) || [],
      awards: awards?.map((a: any) => a.award_name) || []
    };

    // Format discovery context.
    //
    // We keep the brainstorming prompts alongside the answers so the model
    // has enough context to cross-reference themes. But we deliberately
    // avoid Q/A formatting and numbering — presenting them as "Q1, Q2..."
    // primes the model to treat them as distinct submitted responses that
    // could compete with a real essay. Instead, we frame each one as a
    // brainstorming prompt + raw notes, and state explicitly that these
    // are private scaffolding.
    let discoveryContext = '';
    if (discoveryAnswers && discoveryAnswers.length > 0) {
      const flattened = discoveryAnswers
        .map((da: any) => {
          const q = DISCOVERY_QUESTIONS.find(dq => dq.id === da.question_id);
          return q ? `BRAINSTORMING PROMPT: ${q.question}\nSTUDENT'S RAW NOTES: ${da.answer}` : null;
        })
        .filter(Boolean);
      if (flattened.length > 0) {
        discoveryContext = `\n\nWHAT THE STUDENT HAS SHARED ABOUT THEMSELVES (PRIVATE BRAINSTORMING — NEVER submitted to any college, used only for your context in understanding who they are):

These are the student's raw notes from internal brainstorming prompts. They are NOT essays, NOT responses to college application prompts, and NOT part of any submitted application. The intended purpose is for the student to DRAW FROM this material when writing their real essays.

If a submitted essay uses content that also appears in these brainstorming notes, that is correct and desirable — it means the student is effectively using their own raw material. DO NOT flag this overlap as duplication, redundancy, or a "range" problem. DO NOT refer to this material as "Q1," "Q4," "your Insight Question response," or similar. Use this only as background for understanding the student and for connecting themes to their essays.

---

${flattened.join('\n\n---\n\n')}`;
      }
    }

    // Get previous guidance for this prompt (so AI can build on it)
    const { data: prevGuidance } = await supabase
      .from('strategic_guidance_history')
      .select('guidance_text, mode, essay_word_count, created_at')
      .eq('user_id', userId)
      .eq('prompt_id', promptId)
      .neq('mode', 'round_table')
      .order('created_at', { ascending: false })
      .limit(1);

    const previousContext = prevGuidance && prevGuidance.length > 0
      ? `\n\nPREVIOUS GUIDANCE YOU GAVE THIS STUDENT (for context — do not repeat it, build on it):\n"${prevGuidance[0].guidance_text.substring(0, 800)}${prevGuidance[0].guidance_text.length > 800 ? '...' : ''}"\nThat was when the essay was ${prevGuidance[0].essay_word_count} words in "${prevGuidance[0].mode}" mode.`
      : '';

    // ============================================
    // Build prompt based on mode
    // ============================================
    const formatRules = `\n\nCRITICAL FORMATTING RULES — YOU MUST FOLLOW THESE EXACTLY:
1. Write the main body of the response in flowing prose paragraphs. NO bullet points in the prose body. NO numbered lists in the prose body. NO markdown headers (no # or ##) in the prose body. NO dashes as list items in the prose body.
2. EXCEPTION: the final "Mechanics" section at the end of the response must use a bold header (**Mechanics**) on its own line, followed by a hyphen-prefixed list — one finding per line. This is the only place lists are allowed.
3. Use **bold** sparingly in prose for key terms or phrases. That is the ONLY markdown allowed in the prose body.
4. Separate paragraphs with a single blank line.
5. Do NOT use asterisks for emphasis except **double asterisks for bold**.
6. Tone: warm but measured, honest, specific. Like a trusted mentor who respects the student enough to tell them the truth.
7. Keep the prose body concise — 4-6 paragraphs maximum. The Mechanics section comes after that.`;

    const profileBlock = [
      userStats ? `Academics: GPA ${userStats.gpa_weighted || 'N/A'} weighted, ${userStats.gpa_unweighted || 'N/A'} unweighted. SAT: ${userStats.sat_score || 'N/A'}. ACT: ${userStats.act_score || 'N/A'}.` : '',
      profile.apClasses.length > 0 ? `AP Classes: ${profile.apClasses.join(', ')}` : '',
      profile.extracurriculars.length > 0 ? `Activities: ${profile.extracurriculars.map((e: any) => `${e.activity}${e.role ? ` (${e.role})` : ''}`).join(', ')}` : '',
      profile.awards.length > 0 ? `Awards: ${profile.awards.join(', ')}` : '',
    ].filter(Boolean).join('\n');

    let systemMessage = '';
    let aiPrompt = '';

    if (mode === 'pre_writing') {
      systemMessage = `You are an expert college admissions essay coach helping a student think through ONE specific prompt before writing. Be laser-focused on THIS prompt. Specific, practical, personalized.${FEEDBACK_RULES}`;

      aiPrompt = `FOCUS: Help this student approach THIS specific prompt. Not general advice.

THIS ESSAY'S PROMPT:
"${currentPrompt?.prompt_text || 'No prompt found'}"
${currentPrompt?.word_limit ? `Word Limit: ${currentPrompt.word_limit} words` : ''}
${collegeName ? `For: ${collegeName}` : ''}

STUDENT BACKGROUND:
${profileBlock}
${discoveryContext}
${previousContext}

YOUR TASK — Pre-writing guidance for THIS prompt:

Break down what this prompt is really asking. What does the admissions reader want to learn?

Based on the student's insight responses and activities, identify 2-3 specific experiences or stories from THEIR life that would be strong material for THIS prompt. Be concrete — reference their actual answers.

Suggest 1-2 tailored angles or narrative structures for this student and this question.

End with 2-3 common pitfalls for this type of prompt.

Do NOT write the essay or give sample paragraphs.${formatRules}`;

    } else if (mode === 'early_draft') {
      systemMessage = `You are an expert college admissions essay coach giving feedback on an early draft for THIS specific prompt. The student is just getting started — acknowledge what's genuinely on the page (quote specific lines when they work), then give honest, specific guidance on what the essay needs to become. Focused on this one draft, not on other essays the student is writing.${FEEDBACK_RULES}`;

      aiPrompt = `FOCUS: Feedback on this early draft for this specific prompt.

THIS ESSAY'S PROMPT:
"${currentPrompt?.prompt_text || 'No prompt found'}"
${currentPrompt?.word_limit ? `Word Limit: ${currentPrompt.word_limit} words` : ''}
${collegeName ? `For: ${collegeName}` : ''}

STUDENT'S DRAFT (${wordCount} words, version ${currentVersionNumber}):
<<<ESSAY_DRAFT_BEGIN>>>
${essayContent}
<<<ESSAY_DRAFT_END>>>

STUDENT BACKGROUND:
${profileBlock}
${discoveryContext}
${previousContext}

YOUR TASK — Early draft feedback:

Start with what's promising in this draft — what seeds are there to build on? Quote specific lines that work.

Then explain how well this draft is starting to answer what the prompt is really asking. Is the student headed in the right direction?

Suggest 2-3 specific things to develop next. Where should they go deeper? What concrete experiences from their insight responses could strengthen this?

End with 1-2 questions to help them think about their next revision.

Do NOT rewrite their essay.${formatRules}`;

    } else {
      // revision mode
      systemMessage = `You are an expert college admissions essay coach giving revision feedback on a developing draft for THIS specific prompt. The student has been iterating, so focus your energy on what will make the biggest difference in the next revision — specific changes to specific places, evidence-tied, honest. Acknowledge what's genuinely working where you can quote it, but don't pad the response with praise. Focused on this one draft, not on other essays the student is writing.${FEEDBACK_RULES}`;

      aiPrompt = `FOCUS: Revision feedback on this draft for this specific prompt.

THIS ESSAY'S PROMPT:
"${currentPrompt?.prompt_text || 'No prompt found'}"
${currentPrompt?.word_limit ? `Word Limit: ${currentPrompt.word_limit} words` : ''}
${collegeName ? `For: ${collegeName}` : ''}

STUDENT'S DRAFT (${wordCount} words, version ${currentVersionNumber}):
<<<ESSAY_DRAFT_BEGIN>>>
${essayContent}
<<<ESSAY_DRAFT_END>>>

STUDENT BACKGROUND:
${profileBlock}
${discoveryContext}
${previousContext}

YOUR TASK — Revision feedback:

Assess how effectively this draft answers what the prompt is really asking. Be honest — does it deliver?

Identify what's working well. Quote specific moments that are strong.

Then focus on what's **missing** or underdeveloped. Based on their insight responses and profile, are there dimensions of who they are that this essay doesn't capture but should? Are there stories or experiences that could make a specific section more vivid or personal?

Give 2-3 concrete, actionable suggestions for the next revision — not vague advice, but specific changes. "In the paragraph about X, consider adding Y because Z."

If the essay is approaching the word limit, note where they could tighten language or cut redundancy.

Do NOT rewrite their essay.${formatRules}`;
    }

    // ============================================
    // Call Gemini
    // ============================================
    // Lower temperature for feedback modes (less sycophantic, less generic praise,
    // stronger instruction-following).
    // Keep higher temperature for pre-writing brainstorming where variety helps.
    const modeTemperature = mode === 'pre_writing' ? 0.7 : 0.3;
    const modelForMode = mode === 'pre_writing' ? MODEL_BRAINSTORM : MODEL_FEEDBACK;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelForMode}:generateContent?key=${geminiApiKey}`;
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemMessage }] },
        contents: [{ parts: [{ text: aiPrompt }] }],
        generationConfig: { temperature: modeTemperature, maxOutputTokens: 1200 },
        // Override default safety thresholds. Gemini's defaults are aggressive
        // enough that feedback essays touching on identity, mental health, or
        // difficult experiences can trigger silent mid-generation truncation.
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorDetails;
      try { errorDetails = JSON.parse(errorText); } catch { errorDetails = { message: errorText }; }
      console.error('Gemini API error:', errorDetails);
      const errorMessage = errorDetails.error?.message || errorDetails.message || 'Unknown Gemini API error';
      return NextResponse.json({ error: `Gemini API Error: ${errorMessage}` }, { status: 500 });
    }

    const data = await response.json();
    const rawResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Log Gemini response metadata so we can diagnose truncation / safety
    // filter issues from Vercel function logs. Grep for "[thinking-partner]".
    console.log('[thinking-partner] gemini response', JSON.stringify({
      mode,
      model: modelForMode,
      finishReason: data.candidates?.[0]?.finishReason,
      safetyRatings: data.candidates?.[0]?.safetyRatings,
      promptFeedback: data.promptFeedback,
      rawLength: rawResponse.length,
      rawTailPreview: rawResponse.slice(-200),
    }));

    if (!rawResponse) {
      return NextResponse.json({ error: 'No response generated. Please try again.' }, { status: 500 });
    }

    const guidanceText = cleanResponse(rawResponse);

    // ============================================
    // Auto-save to history
    // ============================================
    const { data: savedEntry, error: saveError } = await supabase
      .from('strategic_guidance_history')
      .insert({
        user_id: userId,
        prompt_id: promptId,
        college_id: collegeId || null,
        guidance_text: guidanceText,
        mode,
        essay_word_count: wordCount,
        essay_version_number: currentVersionNumber || null,
      })
      .select('id, created_at')
      .single();

    if (saveError) {
      console.error('Error saving guidance history:', saveError);
      // Don't fail the request — still return the guidance
    }

    return NextResponse.json({
      response: guidanceText,
      mode,
      savedId: savedEntry?.id || null,
      savedAt: savedEntry?.created_at || null,
      essayWordCount: wordCount,
      versionNumber: currentVersionNumber,
    });
  } catch (error: any) {
    console.error('Error in thinking partner API:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}