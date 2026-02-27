-- [FINAL FORCE FIX] 
-- 1. 기존 트리거 및 함수 완전 삭제
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. 신규 사용자 처리 함수 정의 (보안 정의자 권한)
-- 이 함수는 외부 입력을 무시하고 무조건 'pending' 역할을 부여합니다.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 신규 유저의 메타데이터에서 이름과 부서를 가져오되, 역할은 무조건 'pending'으로 고정
  INSERT INTO public.profiles (id, email, full_name, department, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '익명'),
    COALESCE(NEW.raw_user_meta_data->>'department', '미지정'),
    'pending'::public.user_role -- 'sales' 등 다른 값 전달 시에도 무조건 pending 강제
  );
  
  RETURN NEW;
END;
$$;

-- 3. 트리거 재설정
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. 테이블 기본값 재확인
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'pending'::public.user_role;

-- 5. 기존에 잘못 들어간(admin 제외) 모든 'sales' 등 비정상 역할을 'pending'으로 일괄 초기화
UPDATE public.profiles 
SET role = 'pending'::public.user_role 
WHERE email != 'admin@glow.link' 
  AND role != 'pending';
