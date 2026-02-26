-- 1. Create enum for closing status
CREATE TYPE public.closing_status AS ENUM ('open', 'closed');

-- 2. Create the monthly_closings table
CREATE TABLE public.monthly_closings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    closing_month VARCHAR(7) UNIQUE NOT NULL, -- Format: 'YYYY-MM'
    total_revenue NUMERIC NOT NULL DEFAULT 0,
    status public.closing_status NOT NULL DEFAULT 'closed',
    closed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    closed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Trigger for updated_at
CREATE TRIGGER update_monthly_closings_updated_at
BEFORE UPDATE ON public.monthly_closings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 4. RLS for monthly_closings
ALTER TABLE public.monthly_closings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins, Heads, Support can manage closings"
ON public.monthly_closings
FOR ALL
USING ( public.get_my_role() IN ('admin', 'head', 'support') );

CREATE POLICY "Sales can view closings"
ON public.monthly_closings
FOR SELECT
USING ( public.get_my_role() = 'sales' );


-- 5. Data Lock Logic (Triggers)
-- Deny UPDATE/DELETE on shipping_orders if the month is closed
CREATE OR REPLACE FUNCTION public.check_shipping_closed_month()
RETURNS TRIGGER AS $$
DECLARE
    is_closed BOOLEAN;
    ship_month VARCHAR(7);
BEGIN
    -- Determine the month to check based on shipping_date
    IF TG_OP = 'DELETE' THEN
        IF OLD.shipping_date IS NULL THEN RETURN OLD; END IF;
        ship_month := to_char(OLD.shipping_date, 'YYYY-MM');
    ELSE
        IF NEW.shipping_date IS NULL THEN RETURN NEW; END IF;
        ship_month := to_char(NEW.shipping_date, 'YYYY-MM');
    END IF;

    -- Check status
    SELECT status = 'closed' INTO is_closed
    FROM public.monthly_closings
    WHERE closing_month = ship_month;

    IF is_closed THEN
        RAISE EXCEPTION '해당 월(%)은 이미 마감되어 데이터를 수정하거나 삭제할 수 없습니다.', ship_month;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lock_closed_month_shipping
BEFORE UPDATE OR DELETE ON public.shipping_orders
FOR EACH ROW
EXECUTE FUNCTION public.check_shipping_closed_month();

-- Deny UPDATE/DELETE on orders if related shipping_orders have closed months
CREATE OR REPLACE FUNCTION public.check_order_closed_month()
RETURNS TRIGGER AS $$
DECLARE
    closed_count INTEGER;
BEGIN
    -- Check if this order has any shipping forms in a closed month
    SELECT COUNT(*) INTO closed_count
    FROM public.shipping_orders s
    JOIN public.monthly_closings m ON to_char(s.shipping_date, 'YYYY-MM') = m.closing_month
    WHERE s.order_id = COALESCE(NEW.id, OLD.id) AND m.status = 'closed';

    IF closed_count > 0 THEN
        RAISE EXCEPTION '이 수주에 포함된 출하건 중 이미 마감된 달이 있어 수정/삭제할 수 없습니다.';
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lock_closed_month_orders
BEFORE UPDATE OR DELETE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.check_order_closed_month();

-- Activities also locked based on activity_date
CREATE OR REPLACE FUNCTION public.check_activity_closed_month()
RETURNS TRIGGER AS $$
DECLARE
    is_closed BOOLEAN;
    act_month VARCHAR(7);
BEGIN
    IF TG_OP = 'DELETE' THEN
        act_month := to_char(OLD.activity_date, 'YYYY-MM');
    ELSE
        act_month := to_char(NEW.activity_date, 'YYYY-MM');
    END IF;

    SELECT status = 'closed' INTO is_closed
    FROM public.monthly_closings
    WHERE closing_month = act_month;

    IF is_closed THEN
        RAISE EXCEPTION '영업활동일(%)이 속한 달은 이미 마감되어 수정/삭제할 수 없습니다.', act_month;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lock_closed_month_activities
BEFORE UPDATE OR DELETE ON public.activities
FOR EACH ROW
EXECUTE FUNCTION public.check_activity_closed_month();
