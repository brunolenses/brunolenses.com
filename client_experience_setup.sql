-- ==============================================================================
-- LENSES O.S. - STAGE 3: CLIENT EXPERIENCE SUPABASE SETUP
-- ==============================================================================

-- 1. Create Profiles Table
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users NOT NULL PRIMARY KEY,
  full_name text,
  role text DEFAULT 'client' CHECK (role IN ('admin', 'client')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profile Policies
CREATE POLICY "Public profiles are viewable by everyone." 
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." 
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile." 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger for New User Signup (auto-creates profile)
-- Supabase executes this as security definer to bypass RLS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'client');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists just in case
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==============================================================================
-- 2. Create Client Schedules Table
CREATE TABLE public.client_schedules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  order_index integer DEFAULT 0,
  block_type text NOT NULL, -- e.g., 'timeline', 'matrix', 'agenda', 'highlight_card'
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for client_schedules
ALTER TABLE public.client_schedules ENABLE ROW LEVEL SECURITY;

-- Client Schedules Policies
CREATE POLICY "Clients can view their own schedules." 
  ON public.client_schedules FOR SELECT USING (auth.uid() = client_id);

-- Check if user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
DECLARE
  is_adm boolean;
BEGIN
  SELECT (role = 'admin') INTO is_adm FROM public.profiles WHERE id = auth.uid();
  RETURN COALESCE(is_adm, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Admins can manage all schedules." 
  ON public.client_schedules FOR ALL USING (public.is_admin());

-- To create the first admin, run this after signing up with an email:
-- UPDATE public.profiles SET role = 'admin' WHERE id = (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL@HERE');
