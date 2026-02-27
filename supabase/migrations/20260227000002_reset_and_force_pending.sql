-- 1. Force update existing users to 'pending' (except admin)
-- Avoid deleting to maintain data integrity
UPDATE public.profiles 
SET role = 'pending'::public.user_role 
WHERE email != 'admin@glow.link';

-- 2. Force 'pending' role in handle_new_user trigger
-- Completely ignore metadata values for 'role' to prevent bypassing via client-side data
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
    COALESCE(NEW.raw_user_meta_data->>'full_name', '익명'),
    COALESCE(NEW.raw_user_meta_data->>'department', '미지정'),
    'pending'::public.user_role -- Hardcoded to 'pending'
  );
  RETURN NEW;
END;
$$;

-- 3. Confirm profile table default value
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'pending'::public.user_role;
