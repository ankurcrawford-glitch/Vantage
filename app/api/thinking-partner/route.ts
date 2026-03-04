import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const AI_MODEL = 'gemini-2.0-flash'; // Cost-effective, great for essay coaching

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
        error: 'Supabase configuration missing' 
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Gemini API key
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json({ 
        error: 'Gemini API key not configured. Add GEMINI_API_KEY to environment variables.' 
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

    // Build the AI prompt based on whether content exists
    let aiPrompt = '';
    let systemMessage = '';

    if (hasEssayContent) {
      // Mode: Strategic guidance + feedback on written content
      systemMessage = `You are an expert college admissions strategist and writing coach. You help students think strategically about their essays AND provide feedback on their writing. You analyze their entire application holistically to provide personalized guidance. Be encouraging, specific, and constructive.`;

      aiPrompt = `You are helping a student with their college application essay. Provide BOTH strategic guidance AND feedback on their current draft.

CURRENT PROMPT:
${currentPrompt?.prompt_text || 'No prompt found'}
${currentPrompt?.word_limit ? `Word Limit: ${currentPrompt.word_limit} words` : 'No word limit specified'}
${collegeName ? `College: ${collegeName}` : ''}

STUDENT'S CURRENT ESSAY DRAFT:
${essayContent}

STUDENT'S COMPREHENSIVE PROFILE:
Academic Stats: ${userStats ? `GPA: ${userStats.gpa_weighted || 'N/A'} weighted, ${userStats.gpa_unweighted || 'N/A'} unweighted. SAT: ${userStats.sat_score || 'N/A'}. ACT: ${userStats.act_score || 'N/A'}.` : 'Not provided'}
AP Classes: ${context.profile.apClasses.join(', ') || 'None listed'}
Extracurriculars: ${context.profile.extracurriculars.map((e: any) => `${e.activity}${e.role ? ` (${e.role})` : ''}`).join(', ') || 'None listed'}
Awards: ${context.profile.awards.join(', ') || 'None listed'}

OTHER ESSAYS THE STUDENT IS WRITING:
${context.existingEssays.length > 0 ? context.existingEssays.filter((e: any) => e.prompt !== currentPrompt?.prompt_text).map((e: any, i: number) => `${i + 1}. For ${e.college}: "${e.prompt?.substring(0, 100)}..." ${e.hasContent ? '(has content)' : '(not started)'}`).join('\n') : 'No other essays yet'}

YOUR TASK - Provide TWO types of guidance:

1. STRATEGIC GUIDANCE (How to approach this prompt):
   - What this prompt is REALLY asking (the deeper question)
   - How this prompt relates to or differs from their other prompts (avoid repetition)
   - What aspects of their profile/experiences would be most relevant
   - Strategic angles or themes to consider
   - Questions they should ask themselves
   - Common pitfalls to avoid
   - How to make this essay complement (not repeat) their other essays

2. FEEDBACK ON CURRENT DRAFT:
   - Strengths in their current writing
   - Areas for improvement (structure, clarity, voice, storytelling)
   - Specific suggestions to strengthen their essay
   - Questions to help them think deeper about their topic
   - How well they're addressing the prompt

IMPORTANT: Do NOT rewrite their essay. Provide guidance, frameworks, questions, and feedback - but let them write in their own voice.`;
    } else {
      // Mode: Strategic guidance only (no content yet)
      systemMessage = `You are an expert college admissions strategist. You help students think strategically about their essays by providing frameworks, questions, and approaches - never by writing for them. You analyze their entire application holistically to provide personalized guidance.`;

      aiPrompt = `You are helping a student approach their essay prompt BEFORE they start writing. Provide strategic guidance on HOW to think about and approach answering the prompt.

CURRENT PROMPT TO ADDRESS:
${currentPrompt?.prompt_text || 'No prompt found'}
${currentPrompt?.word_limit ? `Word Limit: ${currentPrompt.word_limit} words` : 'No word limit specified'}
${collegeName ? `College: ${collegeName}` : ''}

STUDENT'S COMPREHENSIVE PROFILE:
Academic Stats: ${userStats ? `GPA: ${userStats.gpa_weighted || 'N/A'} weighted, ${userStats.gpa_unweighted || 'N/A'} unweighted. SAT: ${userStats.sat_score || 'N/A'}. ACT: ${userStats.act_score || 'N/A'}.` : 'Not provided'}
AP Classes: ${context.profile.apClasses.join(', ') || 'None listed'}
Extracurriculars: ${context.profile.extracurriculars.map((e: any) => `${e.activity}${e.role ? ` (${e.role})` : ''}`).join(', ') || 'None listed'}
Awards: ${context.profile.awards.join(', ') || 'None listed'}

OTHER ESSAYS THE STUDENT IS WRITING:
${context.existingEssays.length > 0 ? context.existingEssays.map((e: any, i: number) => `${i + 1}. For ${e.college}: "${e.prompt?.substring(0, 100)}..." ${e.hasContent ? '(has content)' : '(not started)'}`).join('\n') : 'No other essays yet'}

ALL PROMPTS ACROSS APPLICATION:
${allPrompts?.slice(0, 10).map((p: any, i: number) => `${i + 1}. ${p.colleges?.name || 'Unknown'}: "${p.prompt_text.substring(0, 80)}..."`).join('\n') || 'None'}

YOUR TASK - Provide strategic guidance on HOW to approach this prompt:
1. What this prompt is REALLY asking (the deeper question behind it)
2. How this prompt relates to or differs from their other prompts (avoid repetition)
3. What aspects of their profile/experiences would be most relevant to highlight
4. Strategic angles or themes to consider (without writing the essay)
5. Questions they should ask themselves before writing
6. Common pitfalls to avoid for this type of prompt
7. How to make this essay complement (not repeat) their other essays

IMPORTANT: Do NOT write the essay. Do NOT provide sample paragraphs. Only provide strategic guidance, frameworks, questions, and approaches.`;
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