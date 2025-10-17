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

    // Get user's textbooks for this subject to provide context
    const { data: subjectData } = await supabase
      .from('subjects')
      .select('id')
      .eq('name', subject)
      .single();

    let textbookContext = '';
    if (subjectData) {
      const { data: textbooks } = await supabase
        .from('textbooks')
        .select('id, title')
        .eq('user_id', userId)
        .eq('subject_id', subjectData.id);

      if (textbooks && textbooks.length > 0) {
        // Get relevant chunks based on last user message
        const lastMessage = messages[messages.length - 1].content.toLowerCase();
        
        // Simple keyword search across all textbook chunks
        const { data: relevantChunks } = await supabase
          .from('textbook_chunks')
          .select('content, textbooks!inner(title)')
          .in('textbook_id', textbooks.map(t => t.id))
          .limit(5);

        if (relevantChunks && relevantChunks.length > 0) {
          textbookContext = '\n\n--- Reference Material from Uploaded Textbooks ---\n';
          relevantChunks.forEach((chunk: any) => {
            textbookContext += `\nFrom "${chunk.textbooks.title}":\n${chunk.content}\n`;
          });
          console.log('Added textbook context, chunks:', relevantChunks.length);
        }
      }
    }

    // Build system prompt based on persona
    let systemPrompt = '';
    
    if (persona === 'genz') {
      systemPrompt = `You are a fun, relatable Gen-Z tutor teaching ${subject}. Use casual language, metaphors, and make learning feel like chatting with a friend. Keep it factual but engaging. Use expressions like "no cap", "lowkey", "vibes", but don't overdo it.

When teaching a chapter or broad topic:
- Break it down into clear subtopics
- Cover each subtopic in detail before moving to the next
- Use examples and analogies that Gen-Z can relate to
- Structure your response with clear headings for each subtopic

When teaching a specific subtopic:
- Go deep into just that subtopic
- Provide comprehensive explanations with relatable examples

Always use proper markdown formatting:
- Use ## for main headings
- Use ### for subheadings
- Use **bold** for emphasis
- Use bullet points for lists
- Use numbered lists for steps`;
    } else if (persona === 'personal') {
      systemPrompt = `You are a personalized tutor teaching ${subject} to ${profile?.name}, a ${profile?.age}-year-old student from ${profile?.location}. Use examples and references that relate to their age and location. Make the content feel familiar and culturally relevant.

When teaching a chapter or broad topic:
- Break it down into clear subtopics relevant to ${profile?.name}'s background
- Cover each subtopic thoroughly with culturally relevant examples
- Structure your response with clear headings for each subtopic

When teaching a specific subtopic:
- Provide detailed explanations with examples from ${profile?.location}
- Reference things familiar to a ${profile?.age}-year-old

Always use proper markdown formatting:
- Use ## for main headings
- Use ### for subheadings
- Use **bold** for emphasis
- Use bullet points for lists
- Use numbered lists for steps`;
    } else {
      systemPrompt = `You are a professional, traditional tutor teaching ${subject}. Provide clear, structured explanations with proper terminology. Be thorough and academic in your approach.

When teaching a chapter or broad topic:
- Break it down into clear subtopics
- Cover each subtopic systematically and thoroughly
- Use academic language and proper terminology
- Structure your response with clear headings for each subtopic

When teaching a specific subtopic:
- Provide comprehensive, detailed explanations
- Use academic examples and proper citations

Always use proper markdown formatting:
- Use ## for main headings
- Use ### for subheadings
- Use **bold** for key terms
- Use bullet points for lists
- Use numbered lists for sequential steps`;
    }

    // Add textbook context if available
    if (textbookContext) {
      systemPrompt += textbookContext;
      systemPrompt += '\n\nUse this reference material to provide accurate, detailed answers based on the student\'s uploaded textbooks. Cite the textbook when using this information.';
    }

    console.log('System prompt ready');

    // For geography, determine if user is asking for a chapter or subtopic
    let generatedImages: string[] = [];
    
    if (subject === 'geography') {
      const lastUserMessage = messages[messages.length - 1]?.content || '';
      
      // Use AI to analyze if it's a chapter or subtopic request
      const analysisResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
              content: 'Analyze if the user is asking about a full chapter/broad topic or a specific subtopic. Respond with exactly "CHAPTER" if it\'s a broad topic covering multiple subtopics, or "SUBTOPIC" if it\'s a specific focused concept. Examples: "teach me about climate" = CHAPTER, "explain monsoons" = SUBTOPIC, "tell me about Asia" = CHAPTER, "what are tectonic plates" = SUBTOPIC'
            },
            {
              role: 'user',
              content: lastUserMessage
            }
          ],
        }),
      });

      let numImages = 1;
      if (analysisResponse.ok) {
        const analysisData = await analysisResponse.json();
        const analysis = analysisData.choices?.[0]?.message?.content?.trim().toUpperCase();
        numImages = analysis === 'CHAPTER' ? 2 : 1;
        console.log('Topic analysis:', analysis, '- generating', numImages, 'images');
      }

      // Generate images based on the topic
      const imagePromises = [];
      for (let i = 0; i < numImages; i++) {
        const imagePrompt = numImages === 2 
          ? `Create a clear, educational geography diagram or map related to aspect ${i + 1} of: ${lastUserMessage}. Make it detailed and informative.`
          : `Create a clear, educational geography diagram or map for: ${lastUserMessage}. Make it detailed and informative.`;
        
        imagePromises.push(
          fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash-image-preview',
              messages: [{ role: 'user', content: imagePrompt }],
              modalities: ['image', 'text']
            }),
          })
        );
      }

      const imageResponses = await Promise.all(imagePromises);
      for (const imageResponse of imageResponses) {
        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
          if (imageUrl) {
            generatedImages.push(imageUrl);
          }
        } else {
          console.error('Image generation failed:', imageResponse.status);
        }
      }
      
      console.log('Generated', generatedImages.length, 'images for geography');
    }

    // Call Lovable AI for text response
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

      // Save assistant message with optional images
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: aiMessage,
        persona: persona,
        images: generatedImages.length > 0 ? generatedImages : null,
      });

      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      // Track user activity for leaderboard
      const { data: conversation } = await supabase
        .from('conversations')
        .select('subject_id')
        .eq('id', conversationId)
        .single();

      if (conversation) {
        await supabase.from('user_activity').insert({
          user_id: userId,
          subject_id: conversation.subject_id,
          activity_type: 'message',
          points: 1,
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        message: aiMessage,
        images: generatedImages.length > 0 ? generatedImages : null
      }),
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
