-- [NUCLEAR FIX] 1. Completely drop old triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Create the most secure handle_new_user function
-- This function EXPLICITLY ignores any incoming role meta-data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- We FORCE 'pending' role regardless of what came from raw_user_meta_data
  -- COALESCE is used for full_name and department for safety
  INSERT INTO public.profiles (id, email, full_name, department, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '익명'),
    COALESCE(NEW.raw_user_meta_data->>'department', '미지정'),
    'pending'::public.user_role -- HARDCODED CONSTANT
  );
  
  RETURN NEW;
END;
$$;

-- 3. Re-create trigger with clean state
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Re-affirm table defaults
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'pending'::public.user_role;

-- 5. Force cleanup of any existing accidental 'sales' roles
-- Preserving ONLY the main admin
UPDATE public.profiles 
SET role = 'pending'::public.user_role 
WHERE email != 'admin@glow.link' AND role != 'pending';
