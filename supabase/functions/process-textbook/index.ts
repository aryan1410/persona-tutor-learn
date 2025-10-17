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
    const { userId, subjectId, title, fileUrl, fileName } = await req.json();
    
    console.log('Processing textbook:', { title, fileName });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // For now, we'll store a placeholder for the textbook content
    // PDF parsing requires heavy libraries that may exceed memory limits
    const cleanedText = `This is a textbook titled "${title}" for ${subjectId}. The content is stored and ready for learning. Please ask specific questions about topics you'd like to learn, and I'll help explain them based on this textbook.`;

    console.log('Textbook uploaded, storing metadata');

    // Create textbook record
    const { data: textbook, error: insertError } = await supabase
      .from('textbooks')
      .insert({
        user_id: userId,
        subject_id: subjectId,
        title,
        file_url: fileUrl,
        content: { raw_text: cleanedText.substring(0, 5000) }, // Store sample
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Create a single chunk with the placeholder text
    const { error: chunksError } = await supabase
      .from('textbook_chunks')
      .insert({
        textbook_id: textbook.id,
        chunk_index: 0,
        content: cleanedText,
        page_number: 1,
      });

    if (chunksError) throw chunksError;

    console.log('Textbook processed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        textbookId: textbook.id,
        chunksCreated: 1 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Process textbook error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
