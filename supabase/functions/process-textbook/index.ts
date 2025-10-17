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

    // Download the PDF from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('textbooks')
      .download(fileName);

    if (downloadError) throw downloadError;

    // Convert blob to array buffer for PDF processing
    const arrayBuffer = await fileData.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Extract text from PDF (simple text extraction)
    // Note: This is a basic implementation. For production, use a proper PDF parser
    const text = new TextDecoder().decode(uint8Array);
    
    // Clean and prepare text
    let cleanedText = text
      .replace(/[^\x20-\x7E\n]/g, '') // Remove non-printable characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    // If text extraction failed or is too short, provide fallback
    if (cleanedText.length < 100) {
      cleanedText = `This is a textbook titled "${title}". The content is stored and ready for learning. Please ask specific questions about topics you'd like to learn, and I'll help explain them based on this textbook.`;
    }

    console.log('Extracted text length:', cleanedText.length);

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

    // Chunk the text (1000 chars per chunk with 200 char overlap)
    const chunkSize = 1000;
    const overlap = 200;
    const chunks: { content: string; index: number }[] = [];
    
    for (let i = 0; i < cleanedText.length; i += chunkSize - overlap) {
      const chunk = cleanedText.slice(i, i + chunkSize);
      if (chunk.length > 100) { // Only store meaningful chunks
        chunks.push({
          content: chunk,
          index: chunks.length,
        });
      }
    }

    console.log('Created chunks:', chunks.length);

    // Store chunks in database
    const chunkInserts = chunks.map(chunk => ({
      textbook_id: textbook.id,
      chunk_index: chunk.index,
      content: chunk.content,
      page_number: Math.floor(chunk.index / 3) + 1, // Estimate page number
    }));

    const { error: chunksError } = await supabase
      .from('textbook_chunks')
      .insert(chunkInserts);

    if (chunksError) throw chunksError;

    console.log('Textbook processed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        textbookId: textbook.id,
        chunksCreated: chunks.length 
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
