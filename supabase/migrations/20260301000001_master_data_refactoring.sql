-- 1. Clean Slate: TRUNCATE existing tables to start fresh
-- TRUNCATE activities CASCADE will also clear related tables if needed, but we list them explicitly for clarity.
TRUNCATE public.activities, public.orders, public.order_items, public.sample_requests, public.products, public.clients CASCADE;

-- 2. Update Clients table
-- Add UNIQUE constraint to company_name
ALTER TABLE public.clients ADD CONSTRAINT clients_company_name_key UNIQUE (company_name);

-- 3. Update Products table
-- Add UNIQUE constraint to name
ALTER TABLE public.products ADD CONSTRAINT products_name_key UNIQUE (name);
-- Item code is no longer strictly required at first entry
ALTER TABLE public.products ALTER COLUMN item_code DROP NOT NULL;

-- 4. Create Client Products (고객사 제품명) table
CREATE TABLE IF NOT EXISTS public.client_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Enable RLS for client_products
ALTER TABLE public.client_products ENABLE ROW LEVEL SECURITY;

-- Policies for client_products
CREATE POLICY "View client_products policy" 
    ON public.client_products FOR SELECT TO authenticated USING (true);

CREATE POLICY "Manage client_products policy" 
    ON public.client_products FOR ALL TO authenticated 
    USING (public.get_my_role() IN ('admin', 'head', 'sales'));

-- 5. Update Activities table to include product and client_product references
ALTER TABLE public.activities ADD COLUMN product_id UUID REFERENCES public.products(id) ON DELETE SET NULL;
ALTER TABLE public.activities ADD COLUMN client_product_id UUID REFERENCES public.client_products(id) ON DELETE SET NULL;

-- 6. Update Order Items table to include client_product reference
ALTER TABLE public.order_items ADD COLUMN client_product_id UUID REFERENCES public.client_products(id) ON DELETE SET NULL;
