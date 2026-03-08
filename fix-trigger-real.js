const { Client } = require('pg');

async function fix() {
    const client = new Client({
        connectionString: 'postgresql://postgres:ehCA6MGio5hENzlo@db.mheihxhztkrpyjxoyndk.supabase.co:5432/postgres'
    });
    try {
        await client.connect();
        console.log('Connected to DB');

        // 1. orders 테이블에 updated_at 컬럼 추가 (트리거 오류 방지)
        await client.query('ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();');
        await client.query('ALTER TABLE public.shipping_orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();');

        // 2. 누락된 컬럼들 추가 (carrier_name, carrier_contact 등)
        await client.query('ALTER TABLE public.shipping_orders ADD COLUMN IF NOT EXISTS carrier_name TEXT;');
        await client.query('ALTER TABLE public.shipping_orders ADD COLUMN IF NOT EXISTS carrier_contact TEXT;');
        await client.query('ALTER TABLE public.shipping_orders ADD COLUMN IF NOT EXISTS shipping_method TEXT;');

        console.log('Schema update success');

        // 3. 트리거 함수 재정의 (안전하게 updated_at 포함하도록 유지하거나 방어적 대처)
        await client.query(`
            CREATE OR REPLACE FUNCTION public.sync_order_shipping_status()
            RETURNS TRIGGER AS $$
            DECLARE
                v_order_id      UUID;
                v_order_qty     INTEGER;
                v_shipped_qty   INTEGER;
            BEGIN
                v_order_id := COALESCE(NEW.order_id, OLD.order_id);
                SELECT total_quantity INTO v_order_qty FROM public.orders WHERE id = v_order_id;
                SELECT COALESCE(SUM(shipped_quantity), 0) INTO v_shipped_qty FROM public.shipping_orders WHERE order_id = v_order_id;
                
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
        `);
        console.log('Trigger fix success');
        console.log('ALL FIXES COMPLETED');
    } catch (e) {
        console.error('ERROR:', e.message);
    } finally {
        await client.end();
    }
}
fix();
