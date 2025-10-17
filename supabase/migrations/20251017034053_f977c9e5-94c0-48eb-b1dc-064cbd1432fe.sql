-- Friends system
CREATE TABLE public.friend_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(sender_id, receiver_id)
);

CREATE TABLE public.friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_1 uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id_2 uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (user_id_1 < user_id_2),
  UNIQUE(user_id_1, user_id_2)
);

-- Activity tracking for content covered and engagement
CREATE TABLE public.user_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  activity_type text NOT NULL, -- 'message', 'quiz', 'content_covered'
  content_data jsonb, -- store topics, chapter names, etc
  points integer DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- Friend requests policies
CREATE POLICY "Users can view their own friend requests"
  ON public.friend_requests FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send friend requests"
  ON public.friend_requests FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update received friend requests"
  ON public.friend_requests FOR UPDATE
  USING (auth.uid() = receiver_id);

-- Friendships policies
CREATE POLICY "Users can view their friendships"
  ON public.friendships FOR SELECT
  USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

CREATE POLICY "Users can create friendships"
  ON public.friendships FOR INSERT
  WITH CHECK (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

CREATE POLICY "Users can delete their friendships"
  ON public.friendships FOR DELETE
  USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

-- Activity policies
CREATE POLICY "Users can view own activity"
  ON public.user_activity FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view friends' activity"
  ON public.user_activity FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.friendships
      WHERE (user_id_1 = auth.uid() AND user_id_2 = user_activity.user_id)
         OR (user_id_2 = auth.uid() AND user_id_1 = user_activity.user_id)
    )
  );

CREATE POLICY "Users can insert own activity"
  ON public.user_activity FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trigger to update user_progress when activity is added
CREATE OR REPLACE FUNCTION update_user_progress_from_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Update or insert user_progress with topics tracking
  INSERT INTO public.user_progress (
    user_id, 
    subject_id, 
    total_messages, 
    last_activity,
    topics_covered
  )
  VALUES (
    NEW.user_id, 
    NEW.subject_id, 
    CASE WHEN NEW.activity_type = 'message' THEN 1 ELSE 0 END,
    NEW.created_at,
    CASE 
      WHEN NEW.content_data IS NOT NULL THEN jsonb_build_array(NEW.content_data)
      ELSE '[]'::jsonb
    END
  )
  ON CONFLICT (user_id, subject_id)
  DO UPDATE SET
    total_messages = user_progress.total_messages + CASE WHEN NEW.activity_type = 'message' THEN 1 ELSE 0 END,
    last_activity = NEW.created_at,
    topics_covered = CASE
      WHEN NEW.content_data IS NOT NULL THEN 
        user_progress.topics_covered || NEW.content_data
      ELSE user_progress.topics_covered
    END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_activity_added
  AFTER INSERT ON public.user_activity
  FOR EACH ROW
  EXECUTE FUNCTION update_user_progress_from_activity();