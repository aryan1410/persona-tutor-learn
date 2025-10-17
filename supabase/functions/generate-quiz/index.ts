import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationId, userId } = await req.json();
    
    console.log('Generating quiz for conversation:', conversationId);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get conversation messages
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at');

    if (messagesError) throw messagesError;

    if (!messages || messages.length === 0) {
      throw new Error('No messages found in conversation');
    }

    // Get conversation details for title
    const { data: conversation } = await supabase
      .from('conversations')
      .select('subject_id, subjects(name)')
      .eq('id', conversationId)
      .single();

    const subject = (conversation?.subjects as any)?.name || 'Topic';

    // Build conversation summary for AI
    const conversationText = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');

    console.log('Calling AI to generate quiz questions');

    // Call Lovable AI to generate quiz questions
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: `You are a quiz generator. Based on the conversation provided, generate 5 multiple-choice questions that test understanding of the key concepts discussed. Each question should have 4 options (A, B, C, D) with exactly one correct answer.

Return ONLY a valid JSON array with this exact structure:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": "A"
  }
]

Make sure:
- Questions are clear and based on content from the conversation
- Options are plausible but only one is correct
- correct_answer is one of: "A", "B", "C", or "D"
- Return ONLY the JSON array, no other text` 
          },
          { 
            role: 'user', 
            content: `Generate 5 quiz questions based on this conversation about ${subject}:\n\n${conversationText}` 
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI error:', response.status, errorText);
      throw new Error(`AI generation failed: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    console.log('AI response received:', aiResponse);

    // Parse the JSON response
    let questions;
    try {
      // Remove markdown code blocks if present
      const cleanedResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      questions = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      throw new Error('Failed to parse quiz questions from AI');
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('Invalid quiz format from AI');
    }

    // Create quiz record
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .insert({
        conversation_id: conversationId,
        title: `${subject} Quiz`,
        total_questions: questions.length,
      })
      .select()
      .single();

    if (quizError) throw quizError;

    console.log('Quiz created:', quiz.id);

    // Insert quiz questions
    const questionsToInsert = questions.map((q: any, index: number) => ({
      quiz_id: quiz.id,
      question: q.question,
      options: q.options,
      correct_answer: q.correct_answer,
    }));

    const { error: questionsError } = await supabase
      .from('quiz_questions')
      .insert(questionsToInsert);

    if (questionsError) throw questionsError;

    console.log('Quiz questions inserted');

    return new Response(
      JSON.stringify({ 
        quizId: quiz.id,
        totalQuestions: questions.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Quiz generation error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
