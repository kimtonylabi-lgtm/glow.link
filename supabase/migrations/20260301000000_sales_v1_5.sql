-- 1. Add pipeline_status to activities table
CREATE TYPE public.pipeline_status AS ENUM ('lead', 'sample_sent', 'quote_submitted', 'negotiating', 'confirmed', 'dropped');
ALTER TABLE public.activities ADD COLUMN pipeline_status public.pipeline_status;

-- Update existing activities to 'lead' by default if they are relevant to sales
UPDATE public.activities SET pipeline_status = 'lead' WHERE pipeline_status IS NULL;

-- 2. Create View for Sales Analysis
-- This view calculates average order interval and conversion rate
CREATE OR REPLACE VIEW public.v_sales_analysis AS
WITH order_intervals AS (
    SELECT 
        client_id,
        order_date,
        LAG(order_date) OVER (PARTITION BY client_id ORDER BY order_date) as prev_order_date
    FROM public.orders
    WHERE status = 'confirmed'
),
avg_intervals AS (
    SELECT 
        client_id,
        AVG(order_date - prev_order_date) as avg_interval
    FROM order_intervals
    WHERE prev_order_date IS NOT NULL
    GROUP BY client_id
),
conversion_stats AS (
    SELECT 
        c.id as client_id,
        COUNT(DISTINCT s.id) as sample_count,
        COUNT(DISTINCT o.id) as confirmed_order_count,
        COALESCE(SUM(o.total_amount), 0) as total_revenue
    FROM public.clients c
    LEFT JOIN public.sample_requests s ON s.client_id = c.id
    LEFT JOIN public.orders o ON o.client_id = c.id AND o.status = 'confirmed'
    GROUP BY c.id
)
SELECT 
    c.*,
    COALESCE(ai.avg_interval, INTERVAL '90 days') as predicted_interval,
    (SELECT MAX(order_date) FROM public.orders WHERE client_id = c.id AND status = 'confirmed') as last_order_date,
    cs.sample_count,
    cs.confirmed_order_count,
    CASE 
        WHEN cs.sample_count > 0 THEN ROUND((cs.confirmed_order_count::float / cs.sample_count::float) * 100)::int
        ELSE 0 
    END as conversion_rate,
    cs.total_revenue
FROM public.clients c
LEFT JOIN avg_intervals ai ON ai.client_id = c.id
LEFT JOIN conversion_stats cs ON cs.client_id = c.id;

-- 3. Auto-Tiering Function and Trigger
CREATE OR REPLACE FUNCTION public.fn_calculate_client_tier()
RETURNS TRIGGER AS $$
DECLARE
    v_revenue NUMERIC;
    v_conv_rate FLOAT;
    v_new_tier public.client_tier;
BEGIN
    -- Get current stats for the client
    SELECT total_revenue, conversion_rate 
    INTO v_revenue, v_conv_rate
    FROM public.v_sales_analysis
    WHERE client_id = NEW.client_id;

    -- Tiering Logic
    IF v_revenue >= 100000000 OR (v_revenue >= 50000000 AND v_conv_rate >= 50) THEN
        v_new_tier := 'S';
    ELSIF v_revenue >= 50000000 OR (v_revenue >= 20000000 AND v_conv_rate >= 30) THEN
        v_new_tier := 'A';
    ELSIF v_revenue >= 10000000 THEN
        v_new_tier := 'B';
    ELSE
        v_new_tier := 'C';
    END IF;

    -- Update client tier
    UPDATE public.clients 
    SET tier = v_new_tier
    WHERE id = NEW.client_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on Orders (when confirmed)
DROP TRIGGER IF EXISTS tr_update_tier_on_order ON public.orders;
CREATE TRIGGER tr_update_tier_on_order
AFTER INSERT OR UPDATE OF status ON public.orders
FOR EACH ROW
WHEN (NEW.status = 'confirmed')
EXECUTE FUNCTION public.fn_calculate_client_tier();

-- Trigger on Sample Requests
DROP TRIGGER IF EXISTS tr_update_tier_on_sample ON public.sample_requests;
CREATE TRIGGER tr_update_tier_on_sample
AFTER INSERT OR DELETE ON public.sample_requests
FOR EACH ROW
EXECUTE FUNCTION public.fn_calculate_client_tier();
