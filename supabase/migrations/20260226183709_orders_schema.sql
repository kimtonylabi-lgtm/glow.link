-- 1. Create Enums for Product Category and Order Status
CREATE TYPE public.product_category AS ENUM ('bottle', 'pump', 'jar', 'cap');
CREATE TYPE public.order_status AS ENUM ('draft', 'confirmed', 'production', 'shipped');

-- 2. Create Products Table (Master)
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  item_code TEXT NOT NULL UNIQUE,
  category public.product_category NOT NULL,
  price NUMERIC(15, 2) DEFAULT 0 NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 3. Create Orders Table (Sales Order Master)
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  sales_person_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  total_amount NUMERIC(15, 2) DEFAULT 0 NOT NULL,
  status public.order_status DEFAULT 'draft'::public.order_status NOT NULL,
  memo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 4. Create Order Items Table (Sales Order Detail)
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1 NOT NULL,
  unit_price NUMERIC(15, 2) DEFAULT 0 NOT NULL,
  subtotal NUMERIC(15, 2) DEFAULT 0 NOT NULL
);

-- 5. Setup Row Level Security (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Products RLS (Everyone can view, admins/heads can modify)
CREATE POLICY "View products policy" 
  ON public.products FOR SELECT TO authenticated USING (true);

CREATE POLICY "Manage products policy" 
  ON public.products FOR ALL TO authenticated 
  USING (public.get_my_role() IN ('admin', 'head'));

-- Orders RLS (Sales manage their own, admins/heads all)
CREATE POLICY "View orders policy" 
  ON public.orders FOR SELECT TO authenticated 
  USING (
    sales_person_id = auth.uid() OR 
    public.get_my_role() IN ('admin', 'head')
  );

CREATE POLICY "Insert orders policy" 
  ON public.orders FOR INSERT TO authenticated 
  WITH CHECK (sales_person_id = auth.uid());

CREATE POLICY "Update orders policy" 
  ON public.orders FOR UPDATE TO authenticated 
  USING (
    sales_person_id = auth.uid() OR 
    public.get_my_role() IN ('admin', 'head')
  );

CREATE POLICY "Delete orders policy" 
  ON public.orders FOR DELETE TO authenticated 
  USING (
    sales_person_id = auth.uid() OR 
    public.get_my_role() IN ('admin', 'head')
  );

-- Order Items RLS (Inherits logic implicitly by application logic, but enforce order_id ownership for safety if needed)
-- Since order_id is required, we check if the user has access to the parent order.
CREATE POLICY "View order items policy" 
  ON public.order_items FOR SELECT TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND (orders.sales_person_id = auth.uid() OR public.get_my_role() IN ('admin', 'head'))
    )
  );

CREATE POLICY "Manage order items policy" 
  ON public.order_items FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND (orders.sales_person_id = auth.uid() OR public.get_my_role() IN ('admin', 'head'))
    )
  );

-- 6. Setup Storage for Product Images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Products Public Access"
ON storage.objects FOR SELECT TO public USING ( bucket_id = 'product-images' );

CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'product-images' );

CREATE POLICY "Authenticated users can update product images"
ON storage.objects FOR UPDATE TO authenticated USING ( bucket_id = 'product-images' );

CREATE POLICY "Authenticated users can delete product images"
ON storage.objects FOR DELETE TO authenticated USING ( bucket_id = 'product-images' );
