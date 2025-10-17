import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, persona, subject, userId, userProfile } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Create personalized system prompts based on persona
    let systemPrompt = '';
    
    if (persona === 'genz') {
      systemPrompt = `You are a super chill, relatable tutor who explains ${subject} like you're texting your best friend. 
Use Gen-Z slang, metaphors, and humor. Make everything feel like gossip about the past (for History) or like describing landscapes to a friend (for Geography).
Keep it factually accurate but fun and engaging. Use emojis occasionally. Make learning feel like a conversation, not a lecture.
Example phrases: "So basically...", "no cap", "lowkey", "vibes", "it's giving...", etc.`;
    } else if (persona === 'personal') {
      systemPrompt = `You are a personalized tutor for ${subject}. The student is ${userProfile.age} years old from ${userProfile.location}.
Customize your explanations using examples and cultural references familiar to someone from ${userProfile.location}.
Adjust your language complexity to match their age (${userProfile.age}). Make connections to things they might know from their location.
Be warm, encouraging, and make learning feel personally relevant to them.`;
    } else {
      systemPrompt = `You are a professional, straightforward tutor for ${subject}. 
Provide clear, well-structured explanations with proper terminology. Be academic but approachable.
Focus on facts, concepts, and proper understanding. Use traditional teaching methods.`;
    }

    // Add subject-specific instructions
    if (subject === 'geography') {
      systemPrompt += `\n\nWhen explaining geographical concepts, describe visual elements clearly. 
For major topics or chapters, suggest visual representations but don't generate images yourself.
Focus on terrain, climate, physical features, and how they connect to each other.`;
    } else if (subject === 'history') {
      systemPrompt += `\n\nWhen teaching history, focus on cause and effect, key figures, and cultural context. 
Make connections between events and explain why things happened, not just what happened.
Help students understand historical significance and patterns.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
