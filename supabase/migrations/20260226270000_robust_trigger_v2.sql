-- Resilient Hotfix v2 for Employee Approval System

-- 1. Ensure 'pending' exists in public.user_role
-- We do this as a direct ALTER if possible, or inside a safe block
DO $$
BEGIN
    ALTER TYPE public.user_role ADD VALUE 'pending';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TYPE public.user_role ADD VALUE 'inactive';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 2. Ensure profiles table default
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'pending'::public.user_role;

-- 3. Robust Trigger Function with ON CONFLICT
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, department, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'department', ''),
    'pending'::public.user_role
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    department = EXCLUDED.department,
    role = EXCLUDED.role;
  RETURN NEW;
END;
$$;

-- 4. Ensure trigger is bound
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
