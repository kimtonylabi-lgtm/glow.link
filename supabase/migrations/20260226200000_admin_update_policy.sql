-- 1. Drop existing self-update policy to strictly enforce admin-only updates
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- 2. Re-assert Admin update policy just to be perfectly clear
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
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
