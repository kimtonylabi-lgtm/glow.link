-- 1. sales_person_id 컬럼의 NOT NULL 제약 조건 제거
ALTER TABLE public.monthly_sales_goals ALTER COLUMN sales_person_id DROP NOT NULL;

-- 2. 기존 UNIQUE 제약 조건 삭제 및 새로운 복합 UNIQUE 제약 조건 추가
-- 기존 제약 조건 이름을 확인해야 함 (보통 monthly_sales_goals_sales_person_id_year_month_key 또는 유사함)
ALTER TABLE public.monthly_sales_goals DROP CONSTRAINT IF EXISTS monthly_sales_goals_sales_person_id_year_month_key;
ALTER TABLE public.monthly_sales_goals DROP CONSTRAINT IF EXISTS monthly_sales_goals_sales_person_id_target_year_target_month_key;

-- PostgreSQL에서 NULL이 포함된 UNIQUE 인덱스는 NULL을 서로 다른 값으로 취급하므로, 
-- NULL(전사 목표)과 특정 ID(개인 목표)를 구분하기 위해 인덱스 수정이 필요할 수 있음.
-- 하지만 여기서는 sales_person_id가 NULL인 경우(전사)와 특정 값인 경우(개인)를 공존시키기 위해 아래와 같이 추가
ALTER TABLE public.monthly_sales_goals ADD CONSTRAINT monthly_sales_goals_dual_track_key UNIQUE (target_year, target_month, sales_person_id);

-- 3. RLS 정책 업데이트
-- 전사 목표(sales_person_id IS NULL)는 누구나 조회 가능해야 함
DROP POLICY IF EXISTS "Users can view their own goals" ON public.monthly_sales_goals;
CREATE POLICY "Users can view goals" ON public.monthly_sales_goals FOR SELECT 
USING (auth.uid() = sales_person_id OR sales_person_id IS NULL);

-- 저장/수정 권한 업데이트
DROP POLICY IF EXISTS "Users can insert their own goals" ON public.monthly_sales_goals;
CREATE POLICY "Users can insert goals" ON public.monthly_sales_goals FOR INSERT 
WITH CHECK (auth.uid() = sales_person_id OR sales_person_id IS NULL);

DROP POLICY IF EXISTS "Users can update their own goals" ON public.monthly_sales_goals;
CREATE POLICY "Users can update goals" ON public.monthly_sales_goals FOR UPDATE 
USING (auth.uid() = sales_person_id OR sales_person_id IS NULL);

DROP POLICY IF EXISTS "Users can delete their own goals" ON public.monthly_sales_goals;
CREATE POLICY "Users can delete goals" ON public.monthly_sales_goals FOR DELETE 
USING (auth.uid() = sales_person_id OR sales_person_id IS NULL);
