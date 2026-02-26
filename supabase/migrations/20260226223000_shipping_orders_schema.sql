-- 1. Create enum for shipping status if needed (or just use check constraint)
CREATE TYPE public.shipping_status AS ENUM ('pending', 'shipped');

-- 2. Create the shipping_orders table (1:N with orders)
CREATE TABLE public.shipping_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    shipping_date DATE,
    status public.shipping_status NOT NULL DEFAULT 'pending',
    tracking_number VARCHAR(100),
    handler_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    shipped_quantity INTEGER NOT NULL DEFAULT 0 CHECK (shipped_quantity >= 0),
    shipping_memo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Add an updated_at trigger
CREATE TRIGGER update_shipping_orders_updated_at
BEFORE UPDATE ON public.shipping_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Row Level Security Policies
ALTER TABLE public.shipping_orders ENABLE ROW LEVEL SECURITY;

-- 4.a. Support and Admin can do everything
CREATE POLICY "Support and Admin full access on shipping"
ON public.shipping_orders
FOR ALL
USING ( public.get_my_role() IN ('admin', 'support', 'head') );

-- 4.b. Sales can view shipping orders
CREATE POLICY "Sales can view shipping orders"
ON public.shipping_orders
FOR SELECT
USING ( public.get_my_role() = 'sales' );
