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
    const { messages, persona, subject, userId, conversationId } = await req.json();
    
    console.log('Chat request:', { persona, subject, userId, messagesCount: messages.length });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Get user profile for personalization
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: profile } = await supabase
      .from('profiles')
      .select('name, age, location')
      .eq('id', userId)
      .single();

    console.log('User profile loaded:', profile);

    // Build system prompt based on persona
    let systemPrompt = '';
    
    if (persona === 'genz') {
      systemPrompt = `You are a fun, relatable Gen-Z tutor teaching ${subject}. Use casual language, metaphors, and make learning feel like chatting with a friend. Keep it factual but engaging. Use expressions like "no cap", "lowkey", "vibes", but don't overdo it.`;
    } else if (persona === 'personal') {
      systemPrompt = `You are a personalized tutor teaching ${subject} to ${profile?.name}, a ${profile?.age}-year-old student from ${profile?.location}. Use examples and references that relate to their age and location. Make the content feel familiar and culturally relevant.`;
    } else {
      systemPrompt = `You are a professional, traditional tutor teaching ${subject}. Provide clear, structured explanations with proper terminology. Be thorough and academic in your approach.`;
    }

    systemPrompt += `\n\nFor Geography topics, you can describe visual elements but do not generate images yourself. Focus on clear explanations.`;

    console.log('System prompt ready');

    // Call Lovable AI
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiMessage = data.choices[0]?.message?.content;

    console.log('AI response received');

    // Save conversation if provided
    if (conversationId) {
      console.log('Saving messages to conversation:', conversationId);
      
      // Save user message
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        role: 'user',
        content: messages[messages.length - 1].content,
      });

      // Save assistant message
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: aiMessage,
        persona: persona,
      });

      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);
    }

    return new Response(
      JSON.stringify({ message: aiMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Chat error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
