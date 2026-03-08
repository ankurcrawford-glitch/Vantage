import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { DISCOVERY_QUESTIONS } from '@/lib/discovery';

const AI_MODEL = 'gemini-2.5-flash-lite';
const MIN_INSIGHT_ANSWERS = 6;

// Determine guidance mode based on essay maturity
function determineMode(essayContent: string | null, wordCount: number, versionNumber: number): string {
  if (!essayContent || wordCount < 50) return 'pre_writing';
  if (wordCount < 200 || versionNumber <= 1) return 'early_draft';
  return 'revision';
}

// Clean markdown artifacts from AI response
function cleanResponse(text: string): string {
  return text
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
    // Remove trailing/leading whitespace per line and collapse 3+ newlines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
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
1. Write ONLY in flowing prose paragraphs. NO bullet points. NO numbered lists. NO markdown headers (no # or ##). NO dashes as list items.
2. Use **bold** sparingly for key terms or phrases. That is the ONLY markdown allowed.
3. Separate paragraphs with a single blank line.
4. Do NOT use asterisks for emphasis except **double asterisks for bold**.
5. Tone: warm, encouraging, honest — like a trusted mentor talking directly to the student.
6. Keep it concise. 4-6 paragraphs maximum.`;

    const profileBlock = [
      userStats ? `Academics: GPA ${userStats.gpa_weighted || 'N/A'} weighted, ${userStats.gpa_unweighted || 'N/A'} unweighted. SAT: ${userStats.sat_score || 'N/A'}. ACT: ${userStats.act_score || 'N/A'}.` : '',
      profile.apClasses.length > 0 ? `AP Classes: ${profile.apClasses.join(', ')}` : '',
      profile.extracurriculars.length > 0 ? `Activities: ${profile.extracurriculars.map((e: any) => `${e.activity}${e.role ? ` (${e.role})` : ''}`).join(', ')}` : '',
      profile.awards.length > 0 ? `Awards: ${profile.awards.join(', ')}` : '',
    ].filter(Boolean).join('\n');

    let systemMessage = '';
    let aiPrompt = '';

    if (mode === 'pre_writing') {
      systemMessage = `You are an expert college admissions essay coach helping a student think through ONE specific prompt before writing. Be laser-focused on THIS prompt. Specific, practical, personalized.`;

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
      systemMessage = `You are an expert college admissions essay coach giving feedback on an early draft. The student is just getting started — be encouraging about what's working while pointing toward what the essay needs to become. Focused on THIS prompt only.`;

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
      systemMessage = `You are an expert college admissions essay coach giving revision feedback on a developing draft. Be specific about what's working and what needs to change. Focus on what's missing, what could be stronger, and how to elevate the essay. THIS prompt only.`;

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
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${AI_MODEL}:generateContent?key=${geminiApiKey}`;
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemMessage }] },
        contents: [{ parts: [{ text: aiPrompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2000 },
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