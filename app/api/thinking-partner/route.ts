import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { DISCOVERY_QUESTIONS } from '@/lib/discovery';

const AI_MODEL = 'gemini-2.5-flash-lite'; // Cost-effective, great for essay coaching

export async function POST(request: NextRequest) {
  try {
    const { essayContent, promptId, collegeId, userId } = await request.json();

    if (!userId || !promptId) {
      return NextResponse.json({ error: 'User ID and Prompt ID required' }, { status: 400 });
    }

    // Initialize Supabase client with service role for full access
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ 
        error: `Supabase configuration missing. URL: ${supabaseUrl ? 'SET' : 'MISSING'}, Service Key: ${supabaseServiceKey ? 'SET' : 'MISSING'}` 
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Gemini API key
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json({ 
        error: 'GEMINI_API_KEY env var is not set. Please add it in Vercel Environment Variables and redeploy.' 
      }, { status: 500 });
    }

    // ============================================
    // Pull comprehensive context from entire application
    // ============================================

    // 1. Get current prompt
    const { data: currentPrompt, error: promptError } = await supabase
      .from('college_prompts')
      .select('*')
      .eq('id', promptId)
      .single();

    if (promptError) {
      console.error('Error loading prompt:', promptError);
    }

    // 2. Get all other prompts across all colleges (to see patterns)
    const { data: allPrompts } = await supabase
      .from('college_prompts')
      .select('id, prompt_text, word_limit, sort_order, colleges:college_id (name)')
      .order('sort_order');

    // 3. Get all user's essays and their prompts
    const { data: allEssays } = await supabase
      .from('essays')
      .select(`
        id,
        college_prompt_id,
        college_prompts:college_prompt_id (
          prompt_text,
          word_limit,
          colleges:college_id (name)
        ),
        essay_versions (
          version_number,
          content,
          word_count,
          is_current
        )
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    // 4. Get user profile data
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
      
          // 6. Get discovery answers (the 12 onboarding questions)
    const { data: discoveryAnswers } = await supabase
    .from('discovery_answers')
    .select('question_id, answer')
    .eq('user_id', userId);

    // 5. Get college name for current prompt
    let collegeName = null;
    if (collegeId) {
      const { data: collegeData } = await supabase
        .from('colleges')
        .select('name')
        .eq('id', collegeId)
        .single();
      collegeName = collegeData?.name || null;
    }

    // Build comprehensive context
    const hasEssayContent = essayContent && essayContent.trim().length > 0;
    
    const context = {
      currentPrompt: currentPrompt ? {
        text: currentPrompt.prompt_text,
        wordLimit: currentPrompt.word_limit,
        college: collegeName
      } : null,
      allPrompts: allPrompts || [],
      existingEssays: allEssays?.map((essay: any) => ({
        prompt: essay.college_prompts?.prompt_text,
        college: essay.college_prompts?.colleges?.name,
        wordCount: essay.essay_versions?.find((v: any) => v.is_current)?.word_count || 0,
        hasContent: (essay.essay_versions?.find((v: any) => v.is_current)?.content?.length || 0) > 0,
        content: essay.essay_versions?.find((v: any) => v.is_current)?.content || ''
      })) || [],
      profile: {
        stats: userStats || {},
        apClasses: apClasses?.map((c: any) => c.class_name) || [],
        extracurriculars: extracurriculars?.map((e: any) => ({
          activity: e.activity_name,
          role: e.role,
          description: e.description
        })) || [],
        awards: awards?.map((a: any) => a.award_name) || []
      }
    };

    // Format discovery/insight answers
    let discoveryContext = '';
    if (discoveryAnswers && discoveryAnswers.length > 0) {
      const answeredQuestions = discoveryAnswers
        .map((da: any) => {
          const question = DISCOVERY_QUESTIONS.find(q => q.id === da.question_id);
          return question ? `Q: ${question.question}\nA: ${da.answer}` : null;
        })
        .filter(Boolean);
      if (answeredQuestions.length > 0) {
        discoveryContext = `\n\nSTUDENT'S PERSONAL INSIGHT RESPONSES (these reveal their authentic voice, values, and experiences):\n${answeredQuestions.join('\n\n')}`;
      }
    }

    // Build the AI prompt based on whether content exists
    let aiPrompt = '';
    let systemMessage = '';

    if (hasEssayContent) {
      // Mode: Focused feedback on written content for THIS specific prompt
      systemMessage = `You are an expert college admissions essay coach. Your job is to give focused, actionable feedback on the student's draft for ONE specific essay prompt. Stay laser-focused on THIS prompt — do not give general admissions advice or address other essays unless directly relevant. Be encouraging but specific and honest.`;

      aiPrompt = `FOCUS: Give feedback ONLY on this specific essay draft for this specific prompt. Do not address other prompts or give general admissions advice.

THIS ESSAY'S PROMPT:
"${currentPrompt?.prompt_text || 'No prompt found'}"
${currentPrompt?.word_limit ? `Word Limit: ${currentPrompt.word_limit} words` : ''}
${collegeName ? `For: ${collegeName}` : ''}

STUDENT'S DRAFT:
${essayContent}

BACKGROUND ON THIS STUDENT (use to personalize your feedback):
${userStats ? `Academics: GPA ${userStats.gpa_weighted || 'N/A'} weighted, ${userStats.gpa_unweighted || 'N/A'} unweighted. SAT: ${userStats.sat_score || 'N/A'}. ACT: ${userStats.act_score || 'N/A'}.` : ''}
${context.profile.extracurriculars.length > 0 ? `Activities: ${context.profile.extracurriculars.map((e: any) => `${e.activity}${e.role ? ` (${e.role})` : ''}`).join(', ')}` : ''}
${context.profile.awards.length > 0 ? `Awards: ${context.profile.awards.join(', ')}` : ''}
${discoveryContext}

YOUR TASK — Focused feedback on THIS draft for THIS prompt:

1. PROMPT FIT: How well does this draft answer what "${currentPrompt?.prompt_text?.substring(0, 80) || 'this prompt'}" is really asking? Be specific about what the prompt wants and whether the draft delivers it.

2. STRENGTHS: What's working well in this draft? (be specific — quote lines)

3. WHAT TO IMPROVE: What are the 2-3 most impactful changes they could make to better answer THIS prompt? Reference their insight responses or activities to suggest concrete material they could draw from.

4. QUESTIONS TO CONSIDER: 2-3 targeted questions to help them deepen THIS specific essay.

Keep your response focused and concise. Do NOT rewrite their essay. Do NOT discuss their other essays or other prompts.`;
    } else {
      // Mode: Strategic guidance for THIS specific prompt (no content yet)
      systemMessage = `You are an expert college admissions essay coach. Your job is to help a student think through ONE specific essay prompt before they start writing. Stay laser-focused on THIS prompt — do not give general admissions advice or try to address their whole application. Be specific, practical, and personalized.`;

      aiPrompt = `FOCUS: Help the student approach THIS specific prompt. All your guidance should be about how to answer THIS question, not general essay advice.

THIS ESSAY'S PROMPT:
"${currentPrompt?.prompt_text || 'No prompt found'}"
${currentPrompt?.word_limit ? `Word Limit: ${currentPrompt.word_limit} words` : ''}
${collegeName ? `For: ${collegeName}` : ''}

BACKGROUND ON THIS STUDENT (use to personalize your suggestions):
${userStats ? `Academics: GPA ${userStats.gpa_weighted || 'N/A'} weighted, ${userStats.gpa_unweighted || 'N/A'} unweighted. SAT: ${userStats.sat_score || 'N/A'}. ACT: ${userStats.act_score || 'N/A'}.` : ''}
${context.profile.apClasses.length > 0 ? `AP Classes: ${context.profile.apClasses.join(', ')}` : ''}
${context.profile.extracurriculars.length > 0 ? `Activities: ${context.profile.extracurriculars.map((e: any) => `${e.activity}${e.role ? ` (${e.role})` : ''}`).join(', ')}` : ''}
${context.profile.awards.length > 0 ? `Awards: ${context.profile.awards.join(', ')}` : ''}
${discoveryContext}

YOUR TASK — Strategic guidance for THIS specific prompt:

1. WHAT THIS PROMPT IS REALLY ASKING: Break down what "${currentPrompt?.prompt_text?.substring(0, 80) || 'this prompt'}" is really getting at. What does the admissions reader want to learn about the student from this specific question?

2. YOUR BEST MATERIAL FOR THIS PROMPT: Based on the student's insight responses and activities above, identify 2-3 specific experiences, stories, or values from THEIR life that would be strong material for answering THIS particular prompt. Be concrete — reference their actual answers.

3. APPROACH: Suggest 1-2 specific angles or narrative structures for THIS prompt. Not generic frameworks — tailored to this student and this question.

4. PITFALLS FOR THIS PROMPT: What are 2-3 common mistakes students make when answering THIS specific type of prompt?

Keep your response focused and concise. Do NOT write the essay or provide sample paragraphs. Do NOT discuss their other essays or other prompts unless briefly noting something to avoid repeating.`;
    }

    // Call Google Gemini
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${AI_MODEL}:generateContent?key=${geminiApiKey}`;
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemMessage }]
        },
        contents: [{
          parts: [{ text: aiPrompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorDetails;
      try {
        errorDetails = JSON.parse(errorText);
      } catch {
        errorDetails = { message: errorText };
      }
      
      console.error('Gemini API error:', errorDetails);
      
      const errorMessage = errorDetails.error?.message || errorDetails.message || 'Unknown Gemini API error';
      return NextResponse.json({ 
        error: `Gemini API Error: ${errorMessage}`,
        details: errorDetails 
      }, { status: 500 });
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';

    if (!aiResponse || aiResponse === 'No response generated') {
      return NextResponse.json({ 
        error: 'No response generated from AI. Please try again.' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      response: aiResponse,
      mode: hasEssayContent ? 'feedback' : 'strategic_guidance',
      context: {
        totalEssays: context.existingEssays.length,
        totalPrompts: allPrompts?.length || 0
      }
    });
  } catch (error: any) {
    console.error('Error in thinking partner API:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}