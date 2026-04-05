-- Create briefing_profiles table
CREATE TABLE IF NOT EXISTS public.briefing_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  company_name text,
  logo_url text,
  brand_color text,
  brand_accent text,
  tagline text,
  website text,
  is_admin boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for profiles
ALTER TABLE public.briefing_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.briefing_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.briefing_profiles FOR UPDATE USING (auth.uid() = id);

-- Create briefing_quotas table
CREATE TABLE IF NOT EXISTS public.briefing_quotas (
  user_id uuid PRIMARY KEY REFERENCES public.briefing_profiles(id) ON DELETE CASCADE,
  max_briefings integer DEFAULT 3,
  used_briefings integer DEFAULT 0,
  is_blocked boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for quotas
ALTER TABLE public.briefing_quotas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own quota" ON public.briefing_quotas FOR SELECT USING (auth.uid() = user_id);

-- Create briefing_templates table
CREATE TABLE IF NOT EXISTS public.briefing_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.briefing_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text,
  objectives jsonb DEFAULT '[]'::jsonb,
  core_fields jsonb DEFAULT '[]'::jsonb,
  basal_fields text[] DEFAULT '{}'::text[],
  suggested_questions jsonb DEFAULT '[]'::jsonb,
  sections jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for templates
ALTER TABLE public.briefing_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own templates" ON public.briefing_templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own templates" ON public.briefing_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own templates" ON public.briefing_templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own templates" ON public.briefing_templates FOR DELETE USING (auth.uid() = user_id);

-- Create briefing_category_packages table
CREATE TABLE IF NOT EXISTS public.briefing_category_packages (
  slug text PRIMARY KEY,
  name text NOT NULL,
  description text,
  icon text,
  system_prompt_fragment text,
  max_questions integer DEFAULT 10,
  is_default_enabled boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  department text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for packages (public read)
ALTER TABLE public.briefing_category_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read packages" ON public.briefing_category_packages FOR SELECT USING (true);


-- Trigger to automatically create profile and quota upon user registration
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.briefing_profiles (id, display_name, company_name)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'display_name', 
    new.raw_user_meta_data->>'company_name'
  );
  
  INSERT INTO public.briefing_quotas (user_id, max_briefings, used_briefings)
  VALUES (new.id, 3, 0);

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it already exists to avoid errors
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- For existing users who registered and missed the trigger:
INSERT INTO public.briefing_profiles (id, display_name, company_name)
SELECT 
  id, 
  raw_user_meta_data->>'display_name', 
  raw_user_meta_data->>'company_name'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.briefing_quotas (user_id, max_briefings, used_briefings)
SELECT id, 3, 0 FROM public.briefing_profiles
ON CONFLICT (user_id) DO NOTHING;

