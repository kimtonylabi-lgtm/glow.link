-- Consolidated Hotfix Migration for Employee Approval System

-- 1. Ensure the user_role type has all necessary values
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('admin', 'head', 'sales', 'sample_team', 'support', 'pending', 'inactive');
    ELSE
        -- Add missing values if type already exists
        BEGIN
            ALTER TYPE public.user_role ADD VALUE 'pending';
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
        BEGIN
            ALTER TYPE public.user_role ADD VALUE 'inactive';
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
    END IF;
END $$;

-- 2. Ensure profiles table role default is 'pending'
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'pending'::public.user_role;

-- 3. Force recreate handle_new_user to ensure strict pending role assignment
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
  );
  RETURN NEW;
END;
$$;

-- 4. Re-bind trigger (to ensure it is fresh)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Fix any existing users who might have defaulted to something else (Optional safety)
-- UPDATE public.profiles SET role = 'pending' WHERE role IS NULL;
