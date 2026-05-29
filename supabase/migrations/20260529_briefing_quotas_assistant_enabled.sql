-- Admin-controlled gate for the AI assistant.
-- Applied to project vnjbtflgemwvjrcrvuse on 2026-05-29 via Supabase MCP.
--
-- Defaults to true so existing users (everyone who already had access to
-- the assistant in M3 v1/v2/v3) keeps it. Admin can toggle off per-user
-- from the admin dashboard.
--
-- Server-side enforcement is the source of truth — /api/assistant/chat
-- rejects when this is false. The UI hides the entry points (sidebar
-- link, FAB on briefing details) for UX, but a client that calls the
-- endpoint anyway still gets a 403.

ALTER TABLE public.briefing_quotas
  ADD COLUMN IF NOT EXISTS assistant_enabled boolean NOT NULL DEFAULT true;
