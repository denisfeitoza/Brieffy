-- M3 v2: every assistant conversation must be anchored to a briefing.
-- v1 chat had no briefing context; we delete the one throw-away "oi" row
-- before tightening the schema so the NOT NULL add doesn't fail.
-- Applied to project vnjbtflgemwvjrcrvuse on 2026-05-29 via Supabase MCP.

DELETE FROM public.assistant_conversations;

ALTER TABLE public.assistant_conversations
  ADD COLUMN briefing_session_id uuid NOT NULL
  REFERENCES public.briefing_sessions(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_assistant_conversations_briefing
  ON public.assistant_conversations(briefing_session_id, updated_at DESC);

-- Defense-in-depth: keep RLS check by user_id, AND also require the linked
-- briefing belongs to the same user. Prevents a misbehaving client from
-- attaching its conversation to someone else's briefing.
DROP POLICY IF EXISTS "assistant_conversations_owner_only" ON public.assistant_conversations;

CREATE POLICY "assistant_conversations_owner_only"
  ON public.assistant_conversations
  FOR ALL
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.briefing_sessions bs
      WHERE bs.id = briefing_session_id AND bs.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.briefing_sessions bs
      WHERE bs.id = briefing_session_id AND bs.user_id = auth.uid()
    )
  );
