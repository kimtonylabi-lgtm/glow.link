const { Client } = require('pg');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function run() {
    const sql = `
-- 1. is_force_closed 컬럼 추가 (안전하게 추가)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shipping_orders' AND column_name='is_force_closed') THEN
        ALTER TABLE public.shipping_orders ADD COLUMN is_force_closed BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 2. 트리거 함수 최우선 순위로 수정 (DELETE 대응)
CREATE OR REPLACE FUNCTION public.sync_order_shipping_status()
RETURNS TRIGGER AS $$
DECLARE
    v_order_id      UUID;
    v_order_qty     INTEGER;
    v_shipped_qty   INTEGER;
BEGIN
    v_order_id := COALESCE(NEW.order_id, OLD.order_id);

    -- [핵심] 강제 종결 체크가 true면 수량 계산 무시하고 즉시 shipped
    -- NEW는 INSERT/UPDATE 시에만 유효하므로 TG_OP로 체크
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.is_force_closed = true THEN
        UPDATE public.orders SET status = 'shipped' WHERE id = v_order_id;
        RETURN NEW;
    END IF;

    -- 기존 수량 기반 로직 (is_force_closed가 false이거나 DELETE일 때)
    SELECT total_quantity INTO v_order_qty
    FROM public.orders WHERE id = v_order_id;

    SELECT COALESCE(SUM(shipped_quantity), 0) INTO v_shipped_qty
    FROM public.shipping_orders WHERE order_id = v_order_id;

    -- 강제로 종결된 출하 기록이 하나라도 있는지 확인 (방어 로직)
    IF EXISTS (SELECT 1 FROM public.shipping_orders WHERE order_id = v_order_id AND is_force_closed = true) THEN
        UPDATE public.orders SET status = 'shipped' WHERE id = v_order_id AND status != 'shipped';
    ELSIF v_order_qty > 0 AND v_shipped_qty >= v_order_qty THEN
        UPDATE public.orders SET status = 'shipped' WHERE id = v_order_id AND status != 'shipped';
    ELSIF v_shipped_qty > 0 THEN
        UPDATE public.orders SET status = 'partially_shipped' 
        WHERE id = v_order_id 
        AND status NOT IN ('shipped', 'partially_shipped');
    ELSE
        UPDATE public.orders SET status = 'production' 
        WHERE id = v_order_id 
        AND status IN ('partially_shipped', 'shipped');
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
    `;

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log("Connecting to DB...");
        await client.connect();
        console.log("Applying SQL...");
        await client.query(sql);
        console.log("Successfully applied 정공법 SQL.");
    } catch (err) {
        console.error("Error applying SQL:", err);
    } finally {
        await client.end();
    }
}

run();
