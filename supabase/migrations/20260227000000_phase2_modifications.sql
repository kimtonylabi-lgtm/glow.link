-- Phase 2 Modifications: Database Schema & RLS Refining

-- 1. Create Sample Type Enum (if not exists)
DO $$ BEGIN
    CREATE TYPE public.sample_type AS ENUM ('random', 'ct', 'design');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Expand sample_requests table
-- Adding columns with DEFAULT values to prevent migration failure with existing rows
ALTER TABLE public.sample_requests 
ADD COLUMN IF NOT EXISTS contact_person TEXT DEFAULT '' NOT NULL,
ADD COLUMN IF NOT EXISTS special_instructions TEXT DEFAULT '' NOT NULL,
ADD COLUMN IF NOT EXISTS sample_type public.sample_type DEFAULT 'random'::public.sample_type NOT NULL;

-- 3. Refine RLS Policies for Products
-- Ensure support, admin, and head can manage products

-- Drop old policies to replace them
DROP POLICY IF EXISTS "Support can update products" ON public.products;
DROP POLICY IF EXISTS "Support can delete products" ON public.products;

CREATE POLICY "Admin/Head/Support can update products"
ON public.products
FOR UPDATE
TO authenticated
USING (public.get_my_role() IN ('admin', 'head', 'support'))
WITH CHECK (public.get_my_role() IN ('admin', 'head', 'support'));

CREATE POLICY "Admin/Head/Support can delete products"
ON public.products
FOR DELETE
TO authenticated
USING (public.get_my_role() IN ('admin', 'head', 'support'));


-- 4. Refine RLS Policies for Orders & Order Items
-- Ensure support, admin, and head can manage orders

DROP POLICY IF EXISTS "Support can update orders" ON public.orders;
DROP POLICY IF EXISTS "Support can delete orders" ON public.orders;

CREATE POLICY "Admin/Head/Support can update orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (public.get_my_role() IN ('admin', 'head', 'support'))
WITH CHECK (public.get_my_role() IN ('admin', 'head', 'support'));

CREATE POLICY "Admin/Head/Support can delete orders"
ON public.orders
FOR DELETE
TO authenticated
USING (public.get_my_role() IN ('admin', 'head', 'support'));


-- Order Items (usually follows master order, but for explicit safety)
DROP POLICY IF EXISTS "Support can update order_items" ON public.order_items;
DROP POLICY IF EXISTS "Support can delete order_items" ON public.order_items;

CREATE POLICY "Admin/Head/Support can update order_items"
ON public.order_items
FOR UPDATE
TO authenticated
USING (public.get_my_role() IN ('admin', 'head', 'support'))
WITH CHECK (public.get_my_role() IN ('admin', 'head', 'support'));

CREATE POLICY "Admin/Head/Support can delete order_items"
ON public.order_items
FOR DELETE
TO authenticated
USING (public.get_my_role() IN ('admin', 'head', 'support'));

-- 5. Enable Real-time for refined tables (if not already set)
-- (Already handled by previous migrations, but safe to re-affirm)
ALTER PUBLICATION supabase_realtime ADD TABLE public.sample_requests;
EXCEPTION WHEN others THEN NULL;
