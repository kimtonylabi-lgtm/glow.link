-- 1. Add new roles to user_role enum
-- We add them individually. Check if they exist first to prevent errors.
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'pending';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'inactive';

-- 2. Update profiles table role default to 'pending'
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'pending'::public.user_role;

-- 3. Update handle_new_user function to ensure new signups are 'pending'
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
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'department',
    'pending'::public.user_role
  );
  RETURN NEW;
END;
$$;
