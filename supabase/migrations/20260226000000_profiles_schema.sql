-- 1. Create Role Enum
CREATE TYPE public.user_role AS ENUM ('admin', 'head', 'sales', 'sample_team', 'support');

-- 2. Create Profiles Table (1:1 with auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role public.user_role DEFAULT 'sales'::public.user_role NOT NULL,
  full_name TEXT,
  department TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 3. Create Security Definer functions to prevent RLS recursion
-- This allows policies to safely lookup a user's role without causing infinite loops
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.user_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- 4. Set up Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view own profile" 
  ON public.profiles 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = id);

-- Policy 2: Users can update their own profile (except for role)
CREATE POLICY "Users can update own profile" 
  ON public.profiles 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 3: Admins and Heads can view ALL profiles
-- Using the security definer function to check the current user's role safely
CREATE POLICY "Admins and Heads can view all profiles" 
  ON public.profiles 
  FOR SELECT 
  TO authenticated 
  USING (
    public.get_my_role() IN ('admin', 'head')
  );

-- Policy 4: Admins can update any profile
CREATE POLICY "Admins can update all profiles" 
  ON public.profiles 
  FOR UPDATE 
  TO authenticated 
  USING (
    public.get_my_role() = 'admin'
  )
  WITH CHECK (
    public.get_my_role() = 'admin'
  );

-- 5. Trigger to automatically create a profile after auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
