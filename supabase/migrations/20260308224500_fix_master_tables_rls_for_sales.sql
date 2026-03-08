-- 1. products 테이블에 대한 관리를 'sales' 역할도 포함하도록 수정
DROP POLICY IF EXISTS "Manage products policy" ON public.products;

CREATE POLICY "Manage products policy" 
  ON public.products FOR ALL TO authenticated 
  USING (public.get_my_role() IN ('admin', 'head', 'sales'));

-- 2. master_data 테이블에 대한 관리를 'sales' 역할도 포함하도록 수정
DROP POLICY IF EXISTS "Master data manageable by admin and head" ON public.master_data;

CREATE POLICY "Master data manageable by admin, head, and sales" 
  ON public.master_data FOR ALL TO authenticated 
  USING (public.get_my_role() IN ('admin', 'head', 'sales'));
