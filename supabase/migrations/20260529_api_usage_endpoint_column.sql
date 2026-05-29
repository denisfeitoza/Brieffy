-- api_usage needs to differentiate cost by feature (briefing motor vs
-- assistant chat vs document translate vs dossier generation). The logger
-- was already passing `endpoint` in the insert payload, but the column
-- didn't exist and PostgREST swallowed it silently — every row landed
-- without attribution.
--
-- Applied to project vnjbtflgemwvjrcrvuse on 2026-05-29 via Supabase MCP.

ALTER TABLE public.api_usage
  ADD COLUMN IF NOT EXISTS endpoint text;

-- Backfill: every legacy row predates the assistant + translate + dossier
-- features, so they all came from the briefing motor.
UPDATE public.api_usage
   SET endpoint = 'briefing'
 WHERE endpoint IS NULL;

CREATE INDEX IF NOT EXISTS idx_api_usage_endpoint
  ON public.api_usage(endpoint, created_at DESC);
