-- Free-form AI assistant: per-user conversations and message log.
-- Applied to project vnjbtflgemwvjrcrvuse on 2026-05-28 via Supabase MCP.
-- Decisions captured autonomously (see .planning/M3/AI-SPEC.md):
--   * Chat-only (no native tools yet).
--   * RLS by user_id, defense-in-depth via auth.getUser() in the route too.
--   * No agency-level / cross-org scope (orgs don't exist yet).
--   * Soft retention: rows live until the user deletes their conversation.

CREATE TABLE IF NOT EXISTS public.assistant_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Nova conversa',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.assistant_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assistant_conversations_owner_only"
  ON public.assistant_conversations
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_assistant_conversations_user
  ON public.assistant_conversations(user_id, updated_at DESC);


CREATE TABLE IF NOT EXISTS public.assistant_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.assistant_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL CHECK (length(content) > 0 AND length(content) <= 16000),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.assistant_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assistant_messages_via_conversation"
  ON public.assistant_messages
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.assistant_conversations c
      WHERE c.id = conversation_id AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.assistant_conversations c
      WHERE c.id = conversation_id AND c.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_assistant_messages_conv
  ON public.assistant_messages(conversation_id, created_at);


-- Keep assistant_conversations.updated_at fresh when a message lands —
-- the sidebar sorts conversations by recency.
CREATE OR REPLACE FUNCTION public.touch_assistant_conversation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.assistant_conversations
     SET updated_at = now()
   WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_assistant_conv ON public.assistant_messages;
CREATE TRIGGER trg_touch_assistant_conv
  AFTER INSERT ON public.assistant_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_assistant_conversation();
