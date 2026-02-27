-- 1. Add 'pending' to user_role enum (using DO block to avoid error if already exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'user_role' AND e.enumlabel = 'pending') THEN
        ALTER TYPE public.user_role ADD VALUE 'pending';
    END IF;
END
$$;

-- 2. Update default value of role column in profiles table
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'pending'::public.user_role;

-- 3. Update existing users who might have been created with 'sales' but should be 'pending'
-- 주의: 이미 실사용 중인 'admin' 등을 건드리지 않기 위해 신중하게 적용하거나, 
-- 사용자가 명시적으로 모든 신규 가입자가 pending이어야 한다고 했으므로 최근 가입자 중 sales인 경우를 전환할 수 있습니다.
-- 여기서는 안전하게 스키마 변경만 우선순위로 둡니다.

-- 4. Ensure handle_new_user trigger doesn't hardcode role
-- (이미 확인 결과 handle_new_user에서는 role을 명시하지 않아 default가 적용됨)
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
    'pending'::public.user_role
  );
  RETURN NEW;
END;
$$;
