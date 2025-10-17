-- Create feedback table for chat conversations
CREATE TABLE public.conversation_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('persona', 'accuracy')),
  feedback_value TEXT NOT NULL,
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversation_feedback ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view feedback for own conversations"
  ON public.conversation_feedback
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = conversation_feedback.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert feedback for own conversations"
  ON public.conversation_feedback
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = conversation_feedback.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

-- Create index for faster feedback lookups
CREATE INDEX idx_conversation_feedback_conversation_id ON public.conversation_feedback(conversation_id);
CREATE INDEX idx_conversation_feedback_user_id ON public.conversation_feedback(user_id);