-- Fix handle_new_user trigger: signup was 100% broken in production.
-- Applied to project vnjbtflgemwvjrcrvuse on 2026-06-08 via Supabase MCP.
--
-- Two bugs lived in one function:
--   1. CRITICAL — the INSERT referenced briefing_profiles.email, a column
--      that no longer exists (email lives in auth.users; it was dropped from
--      the profile in an earlier refactor but the trigger was never updated).
--      Every signup failed with Postgres 42703 ("column \"email\" of relation
--      \"briefing_profiles\" does not exist"), which GoTrue surfaces to the
--      client as "500: Database error saving new user".
--   2. The function read raw_user_meta_data->>'full_name', but the register
--      form (src/app/dashboard/register/page.tsx) sends 'display_name' and
--      'company_name'. The name the user typed was discarded (fell back to the
--      email prefix) and company_name was never persisted at signup.
--
-- Fix: remove the email column from the INSERT, read display_name (with
-- full_name + email-prefix fallbacks), persist company_name, and make both
-- inserts idempotent (ON CONFLICT DO NOTHING) so an email-confirmation retry
-- or a re-fire of the trigger can't break signup. SECURITY DEFINER and the
-- pinned search_path are preserved from the original definition.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Profile row — keyed on auth.users.id.
  INSERT INTO public.briefing_profiles (id, display_name, company_name, is_admin)
  VALUES (
    new.id,
    COALESCE(
      NULLIF(new.raw_user_meta_data->>'display_name', ''),
      NULLIF(new.raw_user_meta_data->>'full_name', ''),
      split_part(new.email, '@', 1)
    ),
    NULLIF(new.raw_user_meta_data->>'company_name', ''),
    false
  )
  ON CONFLICT (id) DO NOTHING;

  -- Default quota (3 briefings).
  INSERT INTO public.briefing_quotas (user_id, max_briefings, used_briefings)
  VALUES (new.id, 3, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$function$;
