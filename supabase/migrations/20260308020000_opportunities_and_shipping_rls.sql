-- ============================================================
-- opportunities 테이블 (수주 기회 파이프라인) 신규 생성
-- 기존 SalesKanban UI의 PipelineStatus와 동일한 ENUM 값 사용
-- ============================================================

-- 1. ENUM: 기존 SalesKanban COLUMNS와 동일한 값으로 정의
DO $$ BEGIN
    CREATE TYPE public.opportunity_stage AS ENUM (
        'lead',             -- 잠재고객 (Lead)
        'sample_sent',      -- 샘플 발송
        'quote_submitted',  -- 견적 제출
        'negotiating',      -- 단가 네고
        'confirmed',        -- 수주 확정
        'dropped'           -- 드랍 (Dropped)
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. opportunities 테이블 생성
CREATE TABLE IF NOT EXISTS public.opportunities (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id           UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    sales_person_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title               TEXT NOT NULL,                           -- 영업건 제목 (e.g. "ABC사 2026 신제품 패키지")
    stage               public.opportunity_stage NOT NULL DEFAULT 'lead',
    expected_amount     NUMERIC(15, 2) NOT NULL DEFAULT 0,       -- 예상 수주액 (₩)
    probability         INTEGER NOT NULL DEFAULT 50              -- 수주 확률 (%)
                            CHECK (probability BETWEEN 0 AND 100),
    expected_close_date DATE,                                    -- 예상 수주 마감일
    memo                TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. RLS 활성화
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책: sales는 본인 건만, admin/head는 전체
CREATE POLICY "Opportunities SELECT policy"
    ON public.opportunities FOR SELECT TO authenticated
    USING (
        sales_person_id = auth.uid()
        OR public.get_my_role() IN ('admin', 'head')
    );

CREATE POLICY "Opportunities INSERT policy"
    ON public.opportunities FOR INSERT TO authenticated
    WITH CHECK (sales_person_id = auth.uid());

CREATE POLICY "Opportunities UPDATE policy"
    ON public.opportunities FOR UPDATE TO authenticated
    USING (
        sales_person_id = auth.uid()
        OR public.get_my_role() IN ('admin', 'head')
    )
    WITH CHECK (
        sales_person_id = auth.uid()
        OR public.get_my_role() IN ('admin', 'head')
    );

CREATE POLICY "Opportunities DELETE policy"
    ON public.opportunities FOR DELETE TO authenticated
    USING (
        sales_person_id = auth.uid()
        OR public.get_my_role() IN ('admin', 'head')
    );

-- 5. 성능 인덱스
CREATE INDEX IF NOT EXISTS idx_opportunities_sales_person ON public.opportunities(sales_person_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_client      ON public.opportunities(client_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_stage       ON public.opportunities(stage);

-- ============================================================
-- shipping_orders RLS 보완
-- 문제: shipping_orders에 sales_person_id가 없어서
--       영업사원이 홈 화면에서 출하 대기 목록을 못 볼 수 있음
-- 해결: 부모 orders.sales_person_id JOIN으로 접근 허용
-- ============================================================

-- 기존 shipping_orders 읽기 정책이 있을 경우 덮어씀
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.shipping_orders;

-- 보완된 SELECT 정책: 부모 orders의 담당자이거나, admin/head이면 조회 가능
CREATE POLICY "shipping_orders SELECT policy"
    ON public.shipping_orders FOR SELECT TO authenticated
    USING (
        -- admin/head는 전체 조회
        public.get_my_role() IN ('admin', 'head', 'support')
        OR
        -- 영업사원: 본인 담당 수주의 출하 내역만 조회 (부모 orders JOIN)
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = shipping_orders.order_id
            AND orders.sales_person_id = auth.uid()
        )
    );
