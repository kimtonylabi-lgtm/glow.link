-- 1. Drop existing trigger and function to start clean
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Create refined handle_new_user function with forced role
-- This function will OVERRIDE any role provided in metadata or anywhere else
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- We explicitly set role to 'pending' from the user_role enum
  -- We ignore any 'role' field that might come from raw_user_meta_data
  INSERT INTO public.profiles (id, email, full_name, department, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '익명'),
    COALESCE(NEW.raw_user_meta_data->>'department', '미지정'),
    'pending'::public.user_role -- FORCED OVERRIDE
  );
  
  RETURN NEW;
END;
$$;

-- 3. Re-create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Final confirmation of table defaults
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'pending'::public.user_role;

-- 5. Force update any existing profiles that might have slipped through back to pending
-- (Except the admin)
UPDATE public.profiles 
SET role = 'pending'::public.user_role 
WHERE email != 'admin@glow.link' AND role != 'pending';
