-- 활성화: 트리그램 기반 GIN 인덱스를 위한 pg_trgm 모듈 추가
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. 고객사명(company_name) GIN 인덱스 생성 (Search 쿼리 최적화)
CREATE INDEX IF NOT EXISTS idx_clients_company_name_trgm 
ON public.clients USING gin (company_name gin_trgm_ops);

-- 2. 제품명(name) GIN 인덱스 생성 
CREATE INDEX IF NOT EXISTS idx_products_name_trgm 
ON public.products USING gin (name gin_trgm_ops);

-- 3. 발주번호(po_number) GIN 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_orders_po_number_trgm 
ON public.orders USING gin (po_number gin_trgm_ops);

-- [RLS 성능 참고] 
-- 해당 컬럼들은 모두 순수 텍스트 필드이며 기본 조회(Select) 동작 시 
-- Row Level Security의 tenant_id, role 검증 쿼리 계획(plan)과 충돌하지 않도록 설계됩니다.
