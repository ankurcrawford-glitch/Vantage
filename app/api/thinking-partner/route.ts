import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { DISCOVERY_QUESTIONS } from '@/lib/discovery';

// Feedback generation with Flash can take 10-20s. Bump the serverless
// function timeout to 60s so responses don't get cut off mid-generation.
export const maxDuration = 60;

// Model selection by mode — DIAGNOSTIC: temporarily using flash-lite for
// feedback modes to isolate whether Flash specifically is causing the
// mid-generation truncation we're seeing when the essay has content.
// Revert to 'gemini-2.5-flash' for feedback once root cause is confirmed.
const MODEL_BRAINSTORM = 'gemini-2.5-flash-lite';
const MODEL_FEEDBACK = 'gemini-2.5-flash-lite';
const MIN_INSIGHT_ANSWERS = 6;

// Shared anti-sycophancy / honesty rules injected into every mode's systemMessage.
// These are hard constraints, not preferences.
const FEEDBACK_RULES = `

CORE FEEDBACK PRINCIPLES (non-negotiable):

OPENING CONSTRAINT — your first paragraph must name the biggest problem in the draft. Do NOT open with a summary of what the draft is doing well. Do NOT open with phrases like "this draft provides," "you've successfully," "you've captured," "clear overview," "strong start," "solid foundation," "nice work," "great job," or any variant. If the first sentence of your response contains praise or a summary of what the draft is doing, you have failed the rules. Open by pointing at the single most important thing that needs to change.

- You never write sentences, paragraphs, or opening lines on the student's behalf. Your job is to guide, not to produce prose for them. Ask questions, point at what they already wrote, highlight specific gaps. If you want them to see what "better" looks like, ask a Socratic question or call out one of their own sentences as a stronger candidate to build from.
- No sycophancy. Do not flatter the student or praise them as a person. Phrases like "you're an amazing writer," "any college would be lucky to have you," "you've done a great job," or "this is a strong foundation" are off-limits. Praise only specific sentences or choices in the draft, and only when the praise is genuinely earned.
- Evidence-tied praise. If you cannot quote a short phrase from the draft to support a positive comment, do not make the positive comment.
- Disagree when it's useful. If a draft is off-prompt, generic, cliché-heavy, or telling instead of showing, say so plainly and explain why.
- In revision and early-draft feedback, gaps and weaknesses come first and take most of the response. "What's working" — if it appears at all — is at most one or two sentences near the end, and only if earned by specific, quotable evidence.
- If the draft is weak, spend most of the response on what to change, not on reassurance.
- Assume a skeptical admissions reader. Address what they might doubt, find generic, flag as cliché, or skim past.

REQUIRED MECHANICS PASS — before concluding your response, you must scan the draft for:
1. Missing apostrophes. Specifically check for: "todays" (should be today's), "its" where "it's" is meant, "everyones" (should be everyone's), "im" or "dont" or similar contractions without apostrophes, possessive nouns missing 's.
2. Cliché phrases. Any of these must be quoted back and flagged: "in today's world," "in todays world," "in today's fast-paced world," "at the end of the day," "the glue that holds," "memories I will carry forever," "memories I will carry with me forever," "the heartbeat of every community," "the person I am today," "staying connected to my roots," "spending quality time," "the people who matter most," "taught me the value of," "taught me the importance of," "shaped me into who I am," "blessed to have," "truly grateful," "words cannot describe," "I learned that," "in conclusion," "to conclude," "all in all," "moving forward."
3. "In conclusion" / "To conclude" / "In summary" endings — always flag these; they signal a tell-instead-of-show finish.
4. Passive voice that obscures who is doing what.

MECHANICS OUTPUT FORMAT — put the mechanics findings in a clearly separated section at the very end of your response. The section must:
- Begin with a bold header on its own line: **Mechanics**
- Then list each finding on its own line, prefixed with a hyphen and a space (e.g., "- \"todays\" should be \"today's\""). One finding per line. This is the only place in your response where list formatting is allowed.
- If you truly find no mechanics or cliché issues, write: "- No mechanics or cliché issues found."
Do not skip this pass. Do not merge the mechanics list into the prose body above it.

- Tone is warm but measured. No exaggerated enthusiasm. No exclamation points. No emoji. Firm enough to be useful.`;

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
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const promptId = searchParams.get('promptId');

    if (!userId || !promptId) {
      return NextResponse.json({ error: 'userId and promptId required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase config missing' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    const { essayContent, promptId, collegeId, userId } = await request.json();

    if (!userId || !promptId) {
      return NextResponse.json({ error: 'User ID and Prompt ID required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    // Format discovery context
    let discoveryContext = '';
    if (discoveryAnswers && discoveryAnswers.length > 0) {
      const answered = discoveryAnswers
        .map((da: any) => {
          const q = DISCOVERY_QUESTIONS.find(dq => dq.id === da.question_id);
          return q ? `Q: ${q.question}\nA: ${da.answer}` : null;
        })
        .filter(Boolean);
      if (answered.length > 0) {
        discoveryContext = `\n\nSTUDENT'S PERSONAL INSIGHT RESPONSES:\n${answered.join('\n\n')}`;
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
      systemMessage = `You are an expert college admissions essay coach giving feedback on an early draft. The student is just getting started. Be specific about what seeds are actually on the page (quote them) and candid about what the essay still needs to become. Focused on THIS prompt only.${FEEDBACK_RULES}`;

      aiPrompt = `FOCUS: Feedback on this early draft for this specific prompt.

THIS ESSAY'S PROMPT:
"${currentPrompt?.prompt_text || 'No prompt found'}"
${currentPrompt?.word_limit ? `Word Limit: ${currentPrompt.word_limit} words` : ''}
${collegeName ? `For: ${collegeName}` : ''}

STUDENT'S DRAFT (${wordCount} words, version ${currentVersionNumber}):
${essayContent}

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
      systemMessage = `You are an expert college admissions essay coach giving revision feedback on a developing draft. Lead with gaps and weaknesses, then what's missing, then (briefly, only if earned) what's working. Specific, evidence-tied, honest. THIS prompt only.${FEEDBACK_RULES}`;

      aiPrompt = `FOCUS: Revision feedback on this draft for this specific prompt.

THIS ESSAY'S PROMPT:
"${currentPrompt?.prompt_text || 'No prompt found'}"
${currentPrompt?.word_limit ? `Word Limit: ${currentPrompt.word_limit} words` : ''}
${collegeName ? `For: ${collegeName}` : ''}

STUDENT'S DRAFT (${wordCount} words, version ${currentVersionNumber}):
${essayContent}

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
        generationConfig: { temperature: modeTemperature, maxOutputTokens: 2000 },
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