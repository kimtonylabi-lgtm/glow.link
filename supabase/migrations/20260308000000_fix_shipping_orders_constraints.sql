-- ============================================================
-- 🚨 3차 핫픽스: 출하 등록 500 에러 및 누락 데이터 방어
-- ============================================================

-- 1. shipping_orders 테이블의 모든 불필요 필드 NULL 가능하도록 변경 (에러 방지)
ALTER TABLE public.shipping_orders 
  ALTER COLUMN tracking_number DROP NOT NULL,
  ALTER COLUMN shipping_date DROP NOT NULL;

-- 2. 혹시나 있을지 모르는 carrier 관련 필드 방어 (삭제된 필드로 간주)
DO $$
BEGIN
    BEGIN
        ALTER TABLE public.shipping_orders ALTER COLUMN carrier_name DROP NOT NULL;
    EXCEPTION WHEN undefined_column THEN 
        RAISE NOTICE 'carrier_name column does not exist, skipping.';
    END;

    BEGIN
        ALTER TABLE public.shipping_orders ALTER COLUMN carrier_contact DROP NOT NULL;
    EXCEPTION WHEN undefined_column THEN 
        RAISE NOTICE 'carrier_contact column does not exist, skipping.';
    END;
END $$;

-- 3. shipping_method 컬럼이 확실히 존재하는지 확인 (이미 추가되었을 수 있음)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shipping_orders' AND column_name='shipping_method') THEN
        ALTER TABLE public.shipping_orders ADD COLUMN shipping_method VARCHAR(50);
    END IF;
END $$;
