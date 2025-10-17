import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationId, message, persona, subject, userAge, userLocation } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get conversation history
    const { data: messages } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    // Build persona-specific system prompt
    let systemPrompt = "";
    
    if (persona === "genz") {
      systemPrompt = `You are a Gen-Z tutor teaching ${subject}. Make learning fun and relatable:
- Use casual language, like texting a friend
- Make history feel like gossip about the past
- Use metaphors, humor, and references students understand
- Keep it accurate but make it engaging
- React with emojis occasionally 🔥✨`;
    } else if (persona === "personal") {
      systemPrompt = `You are a personalized tutor teaching ${subject} to a ${userAge}-year-old student from ${userLocation}.
- Customize examples to feel familiar to their location and age
- Use cultural references they'd understand
- Adjust complexity based on their age
- Make connections to their local context
- Keep explanations clear and relatable`;
    } else {
      systemPrompt = `You are a professional ${subject} tutor providing traditional education:
- Clear, structured explanations
- Academic but accessible language
- Focus on facts and concepts
- Provide thorough, well-organized information
- Maintain a professional teaching tone`;
    }

    systemPrompt += `\n\nWhen teaching ${subject}, be engaging and accurate. Answer questions thoroughly and encourage curiosity.`;

    // Call Lovable AI
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...(messages || []),
          { role: "user", content: message }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please contact support." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Save messages to database
    await supabase.from("messages").insert([
      {
        conversation_id: conversationId,
        role: "user",
        content: message,
        persona: persona,
      },
      {
        conversation_id: conversationId,
        role: "assistant",
        content: aiResponse,
        persona: persona,
      },
    ]);

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
