-- ============================================================
-- 출하 지시 워크플로우 전면 개편 마이그레이션 (통합본)
-- (shipping_orders 테이블 없는 경우 신규 생성 포함)
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- STEP 1: orders 테이블에 total_quantity 컬럼 추가
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS total_quantity INTEGER NOT NULL DEFAULT 0 CHECK (total_quantity >= 0);

UPDATE public.orders o
SET total_quantity = COALESCE(
    (SELECT SUM(oi.quantity) FROM public.order_items oi WHERE oi.order_id = o.id),
    0
)
WHERE o.status IN ('production', 'shipped', 'confirmed')
  AND o.total_quantity = 0;

-- ─────────────────────────────────────────────────────────────
-- STEP 2: order_status enum에 'partially_shipped' 추가
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'partially_shipped'
          AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'order_status')
    ) THEN
        ALTER TYPE public.order_status ADD VALUE 'partially_shipped' AFTER 'production';
    END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- STEP 3: shipping_orders 테이블 신규 생성 (없을 경우)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shipping_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    shipping_date DATE NOT NULL,
    shipped_quantity INTEGER NOT NULL CHECK (shipped_quantity > 0),
    delivery_address TEXT,
    tracking_number VARCHAR(100),
    shipping_memo TEXT,
    handler_id UUID REFERENCES auth.users(id),
    status VARCHAR(50) DEFAULT 'shipped',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 활성화
ALTER TABLE public.shipping_orders ENABLE ROW LEVEL SECURITY;

-- 정책: 인증된 사용자만 CRUD 가능
CREATE POLICY "Enable read access for authenticated users" 
ON public.shipping_orders FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" 
ON public.shipping_orders FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" 
ON public.shipping_orders FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Enable delete for authenticated users" 
ON public.shipping_orders FOR DELETE TO authenticated USING (true);


-- ─────────────────────────────────────────────────────────────
-- STEP 4: 잔량 자동계산 + order.status 자동전환 트리거
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.sync_order_shipping_status()
RETURNS TRIGGER AS $$
DECLARE
    v_order_id      UUID;
    v_order_qty     INTEGER;
    v_shipped_qty   INTEGER;
BEGIN
    v_order_id := COALESCE(NEW.order_id, OLD.order_id);

    SELECT total_quantity INTO v_order_qty
    FROM public.orders WHERE id = v_order_id;

    SELECT COALESCE(SUM(shipped_quantity), 0) INTO v_shipped_qty
    FROM public.shipping_orders WHERE order_id = v_order_id;

    IF v_order_qty > 0 AND v_shipped_qty > v_order_qty * 1.1 THEN
        RAISE WARNING '[GlowLink] 과도한 초과 출하 감지: order_id=%, 발주수량=%, 누적출하수량=%', v_order_id, v_order_qty, v_shipped_qty;
    END IF;

    IF v_order_qty > 0 AND v_shipped_qty >= v_order_qty THEN
        UPDATE public.orders SET status = 'shipped', updated_at = now() WHERE id = v_order_id AND status != 'shipped';
    ELSIF v_shipped_qty > 0 THEN
        UPDATE public.orders SET status = 'partially_shipped', updated_at = now() WHERE id = v_order_id AND status NOT IN ('shipped', 'partially_shipped');
    ELSE
        UPDATE public.orders SET status = 'production', updated_at = now() WHERE id = v_order_id AND status IN ('partially_shipped');
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_sync_order_shipping_status ON public.shipping_orders;

CREATE TRIGGER trg_sync_order_shipping_status
AFTER INSERT OR UPDATE OF shipped_quantity OR DELETE
ON public.shipping_orders
FOR EACH ROW EXECUTE FUNCTION public.sync_order_shipping_status();

-- ─────────────────────────────────────────────────────────────
-- STEP 5: 인덱스 추가
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_shipping_orders_order_id ON public.shipping_orders(order_id);
