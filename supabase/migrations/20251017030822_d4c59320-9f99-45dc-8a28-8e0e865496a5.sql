-- Create storage bucket for textbooks
INSERT INTO storage.buckets (id, name, public)
VALUES ('textbooks', 'textbooks', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for textbooks
CREATE POLICY "Users can upload own textbooks"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'textbooks' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own textbooks"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'textbooks' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own textbooks"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'textbooks' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create textbook_chunks table for RAG
CREATE TABLE IF NOT EXISTS public.textbook_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  textbook_id UUID NOT NULL REFERENCES public.textbooks(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  page_number INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_textbook_chunks_textbook_id ON public.textbook_chunks(textbook_id);
CREATE INDEX idx_textbook_chunks_chunk_index ON public.textbook_chunks(textbook_id, chunk_index);

ALTER TABLE public.textbook_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view chunks from own textbooks"
ON public.textbook_chunks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.textbooks
    WHERE textbooks.id = textbook_chunks.textbook_id
    AND textbooks.user_id = auth.uid()
  )
);