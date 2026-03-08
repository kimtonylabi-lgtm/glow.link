const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function run() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    const sql = `
-- 1. is_force_closed 컬럼 추가
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

    -- [핵심] 사장님 지시 사항: 강제 종결 체크가 true면 수량 계산 무시하고 즉시 shipped
    IF NEW.is_force_closed = true THEN
        UPDATE public.orders SET status = 'shipped' WHERE id = v_order_id;
        RETURN NEW;
    END IF;

    -- 기존 수량 기반 로직 (is_force_closed가 false일 때만 작동)
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

    console.log("Applying Schema Change and Trigger Update...");
    const { error } = await supabase.rpc('exec_sql', { sql: sql });

    if (error) {
        console.log("RPC failed, trying direct pg connection...");
        const { Client } = require('pg');
        const client = new Client({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });
        await client.connect();
        await client.query(sql);
        await client.end();
        console.log("Direct SQL execution success.");
    } else {
        console.log("RPC execution success.");
    }
}

run();
