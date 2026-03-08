const { Client } = require('pg');

async function run() {
    // 과거 성공했던 5432 포트 직접 연결 정보 사용
    const client = new Client({
        connectionString: 'postgresql://postgres:ehCA6MGio5hENzlo@db.mheihxhztkrpyjxoyndk.supabase.co:5432/postgres',
    });

    const sql = `
-- 1. 컬럼 추가
ALTER TABLE public.shipping_orders ADD COLUMN IF NOT EXISTS is_force_closed BOOLEAN DEFAULT false;

-- 2. 트리거 함수 최우선 순위로 수정
CREATE OR REPLACE FUNCTION public.sync_order_shipping_status()
RETURNS TRIGGER AS $$
DECLARE
    v_order_id      UUID;
    v_order_qty     INTEGER;
    v_shipped_qty   INTEGER;
BEGIN
    v_order_id := COALESCE(NEW.order_id, OLD.order_id);

    -- [최우선] 강제 종결 플래그 확인 (INSERT/UPDATE 시)
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.is_force_closed = true THEN
        UPDATE public.orders SET status = 'shipped', updated_at = now() WHERE id = v_order_id;
        RETURN NEW;
    END IF;

    -- 수량 기반 자동 상태 전환 로직
    SELECT total_quantity INTO v_order_qty FROM public.orders WHERE id = v_order_id;
    SELECT COALESCE(SUM(shipped_quantity), 0) INTO v_shipped_qty FROM public.shipping_orders WHERE order_id = v_order_id;

    -- [보강] 강제로 종결된 내역이 하나라도 있으면 'shipped' 상태 유지
    IF EXISTS (SELECT 1 FROM public.shipping_orders WHERE order_id = v_order_id AND is_force_closed = true) THEN
        UPDATE public.orders SET status = 'shipped', updated_at = now() WHERE id = v_order_id;
    ELSIF v_order_qty > 0 AND v_shipped_qty >= v_order_qty THEN
        UPDATE public.orders SET status = 'shipped', updated_at = now() WHERE id = v_order_id AND status != 'shipped';
    ELSIF v_shipped_qty > 0 THEN
        UPDATE public.orders SET status = 'partially_shipped', updated_at = now() WHERE id = v_order_id AND status NOT IN ('shipped', 'partially_shipped');
    ELSE
        UPDATE public.orders SET status = 'production', updated_at = now() WHERE id = v_order_id AND status IN ('partially_shipped', 'shipped');
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
    `;

    try {
        console.log("Connecting to DB (Direct 5432)...");
        await client.connect();
        console.log("Connected. Applying 정공법 SQL...");
        await client.query(sql);
        console.log("SUCCESS! DB Schema and Trigger Updated.");
    } catch (err) {
        console.error("PG ERROR:", err.message);
    } finally {
        await client.end();
    }
}

run();
