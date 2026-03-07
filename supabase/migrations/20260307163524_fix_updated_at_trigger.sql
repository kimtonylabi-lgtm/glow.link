-- Fix missing columns in orders and shipping_orders to resolve trigger errors
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.shipping_orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.shipping_orders ADD COLUMN IF NOT EXISTS carrier_name TEXT;
ALTER TABLE public.shipping_orders ADD COLUMN IF NOT EXISTS carrier_contact TEXT;
ALTER TABLE public.shipping_orders ADD COLUMN IF NOT EXISTS shipping_method TEXT;
