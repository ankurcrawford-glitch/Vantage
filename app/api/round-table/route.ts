import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { DISCOVERY_QUESTIONS } from '@/lib/discovery';

const AI_MODEL = 'gemini-2.5-flash-lite';
const COMMON_APP_COLLEGE_ID = 'a0000000-0000-0000-0000-000000000000';

// Shared anti-sycophancy / honesty rules injected into the Round Table systemMessage.
// These are hard constraints, not preferences.
const FEEDBACK_RULES = `

CORE FEEDBACK PRINCIPLES (non-negotiable):

OPENING CONSTRAINT — your first paragraph must name the single biggest problem with the application package. Do NOT open with a summary of what is working. Do NOT open with phrases like "this application provides," "you've successfully," "you've captured," "strong portfolio," "solid foundation," "nice work," or any variant. If the first sentence of your response contains praise or a summary of strengths, you have failed the rules.

- You never write sentences, paragraphs, or opening lines on the student's behalf. Your job is to guide and diagnose, not to produce prose for them.
- No sycophancy. Do not flatter the student or praise them as a person. Phrases like "you're an amazing writer," "any college would be lucky to have you," "you've done a great job," or "this is a strong foundation" are off-limits. Praise only specific sentences, essays, or choices, and only when the praise is genuinely earned.
- Evidence-tied praise. If you cannot quote a short phrase or name a specific essay to support a positive comment, do not make the positive comment.
- Disagree when it's useful. If the application package is thin, redundant, generic, or off-strategy for this college, say so plainly and explain why.
- Gaps and weaknesses come first and take most of the response. "What's working" — if it appears at all — is at most one or two sentences near the end, and only if earned.
- If the application is weak, spend most of the response on what to change, not on reassurance.
- Assume a skeptical admissions reader at this specific college. Address what they might doubt, find generic, or skim past.

REQUIRED MECHANICS / CLICHÉ PASS — before concluding, scan the essays for common clichés and flag each instance by quoting it: "in today's world," "at the end of the day," "the glue that holds," "memories I will carry forever," "the heartbeat of every community," "the person I am today," "staying connected to my roots," "spending quality time," "taught me the value of," "taught me the importance of," "shaped me into who I am," "I learned that," "in conclusion," "to conclude," "all in all." Also check for missing apostrophes in common words (todays, its, everyones, dont, im).

- Tone is warm but measured. No exaggerated enthusiasm. No exclamation points. No emoji.`;

// GET: Fetch round table history for a college
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const collegeId = searchParams.get('collegeId');

    if (!userId || !collegeId) {
      return NextResponse.json({ error: 'userId and collegeId required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase config missing' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    const { collegeId, userId } = await request.json();

    if (!userId || !collegeId) {
      return NextResponse.json({ error: 'User ID and College ID required' }, { status: 400 });
    }

    // Initialize Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    // Format discovery context
    let discoveryContext = '';
    if (discoveryAnswers && discoveryAnswers.length > 0) {
      const answeredQuestions = discoveryAnswers
        .map((da: any) => {
          const question = DISCOVERY_QUESTIONS.find(q => q.id === da.question_id);
          return question ? `Q: ${question.question}\nA: ${da.answer}` : null;
        })
        .filter(Boolean);
      if (answeredQuestions.length > 0) {
        discoveryContext = `\n\nWHO THIS STUDENT IS (their personal insight responses):\n${answeredQuestions.join('\n\n')}`;
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
    const systemMessage = `You are a panel of experienced college admissions officers reviewing a student's complete application to ${collegeName}. You are warm, honest, and deeply invested in this student's success. You review applications the way a real admissions committee would — looking at the whole picture, not individual essays in isolation. Your tone is candid and measured — encouraging only where encouragement is earned by specific evidence in the writing. You want this student to put their best foot forward, which means telling them the truth.${FEEDBACK_RULES}`;

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
1. Write ONLY in flowing prose paragraphs. NO bullet points. NO numbered lists. NO markdown headers (no # or ##). NO dashes as list items.
2. Use **bold** sparingly for key terms or phrases. That is the ONLY markdown allowed.
3. Separate paragraphs with a single blank line.
4. Do NOT use asterisks for emphasis except **double asterisks for bold**.
5. Tone: warm but measured, honest and specific — like a trusted admissions advisor who respects this student enough to tell them the truth about their ${collegeName} application.
6. Keep it focused and substantial but not overwhelming — 5-8 paragraphs.`;

    // Call Gemini
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${AI_MODEL}:generateContent?key=${geminiApiKey}`;
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemMessage }] },
        contents: [{ parts: [{ text: aiPrompt }] }],
        generationConfig: {
          // Lower temperature for holistic feedback — less generic praise,
          // stronger instruction-following on the gaps-first rule.
          temperature: 0.35,
          maxOutputTokens: 3000,
        },
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
    let aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';

    if (!aiResponse || aiResponse === 'No response generated') {
      return NextResponse.json({ error: 'No response generated. Please try again.' }, { status: 500 });
    }

    // Clean up formatting
    aiResponse = aiResponse
      .replace(/^#{1,6}\s+(?:\d+\.?\s*)?/gm, '')
      .replace(/^[\s]*[\*\-]\s+/gm, '')
      .replace(/^[\s]*\d+\.\s+/gm, '')
      .replace(/\*{3,}/g, '**')
      .replace(/(?<!\*)\*(?!\*)/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

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