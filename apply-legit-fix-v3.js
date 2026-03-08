const { Client } = require('pg');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function run() {
    let connectionString = process.env.DATABASE_URL;
    // 포트가 5432라면 6543으로 교체 시도
    if (connectionString.includes(':5432/')) {
        connectionString = connectionString.replace(':5432/', ':6543/');
        console.log("Using port 6543 (Transaction Pooler)...");
    }

    const sql = `
-- 1. is_force_closed 컬럼 추가
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shipping_orders' AND column_name='is_force_closed') THEN
        ALTER TABLE public.shipping_orders ADD COLUMN is_force_closed BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 2. 트리거 함수 최우선 순위로 수정
CREATE OR REPLACE FUNCTION public.sync_order_shipping_status()
RETURNS TRIGGER AS $$
DECLARE
    v_order_id      UUID;
    v_order_qty     INTEGER;
    v_shipped_qty   INTEGER;
BEGIN
    v_order_id := COALESCE(NEW.order_id, OLD.order_id);

    -- [최우선] 강제 종결 플래그 확인
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.is_force_closed = true THEN
        UPDATE public.orders SET status = 'shipped' WHERE id = v_order_id;
        RETURN NEW;
    END IF;

    -- [보강] 강제로 종결된 내역이 하나라도 있으면 상태 유지
    IF EXISTS (SELECT 1 FROM public.shipping_orders WHERE order_id = v_order_id AND is_force_closed = true) THEN
        UPDATE public.orders SET status = 'shipped' WHERE id = v_order_id;
        RETURN COALESCE(NEW, OLD);
    END IF;

    -- 기존 잔량 계산 로직
    SELECT total_quantity INTO v_order_qty
    FROM public.orders WHERE id = v_order_id;

    SELECT COALESCE(SUM(shipped_quantity), 0) INTO v_shipped_qty
    FROM public.shipping_orders WHERE order_id = v_order_id;

    IF v_order_qty > 0 AND v_shipped_qty >= v_order_qty THEN
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
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log("Connecting to DB environment...");
        await client.connect();
        console.log("Executing Migration...");
        await client.query(sql);
        console.log("Success: force_closed logic applied to DB.");
    } catch (err) {
        console.error("Migration Error:", err);
    } finally {
        await client.end();
    }
}

run();
