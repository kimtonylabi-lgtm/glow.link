import { createClient } from '@/lib/supabase/server'

export async function emergencyFixTrigger() {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('exec_sql', {
        sql: `
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
                    UPDATE public.orders SET status = 'shipped' WHERE id = v_order_id AND status != 'shipped';
                ELSIF v_shipped_qty > 0 THEN
                    UPDATE public.orders SET status = 'partially_shipped' WHERE id = v_order_id AND status NOT IN ('shipped', 'partially_shipped');
                ELSE
                    UPDATE public.orders SET status = 'production' WHERE id = v_order_id AND status IN ('partially_shipped');
                END IF;
                RETURN COALESCE(NEW, OLD);
            END;
            $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
        `
    })
    return { data, error }
}
