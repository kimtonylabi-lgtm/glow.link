-- Consolidated Migration for Quotation System (Manufacturing CRM)

-- 1. Create Master Data Table
CREATE TABLE IF NOT EXISTS public.master_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL, -- 'part', 'material', 'metalizing', 'coating'
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    UNIQUE(category, name)
);

-- 2. Create Quotation Enums
DO $$ BEGIN
    CREATE TYPE public.quotation_status AS ENUM ('draft', 'finalized');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Create Quotations Table
CREATE TABLE IF NOT EXISTS public.quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    sales_person_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    version_no INTEGER DEFAULT 1 NOT NULL,
    parent_id UUID REFERENCES public.quotations(id) ON DELETE SET NULL,
    status public.quotation_status DEFAULT 'draft' NOT NULL,
    supply_price NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    vat_amount NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    total_amount NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    is_vat_included BOOLEAN DEFAULT true NOT NULL,
    memo TEXT,
    is_current BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 4. Create Quotation Items Table
CREATE TABLE IF NOT EXISTS public.quotation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1 NOT NULL,
    unit_price NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    post_processing JSONB DEFAULT '[]'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 5. Enable RLS
ALTER TABLE public.master_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for master_data
CREATE POLICY "Master data viewable by authenticated users" 
    ON public.master_data FOR SELECT TO authenticated USING (true);
CREATE POLICY "Master data manageable by admin and head" 
    ON public.master_data FOR ALL TO authenticated 
    USING (public.get_my_role() IN ('admin', 'head', 'sales'));

-- 7. RLS Policies for quotations
CREATE POLICY "Users can access quotations" 
    ON public.quotations FOR ALL TO authenticated 
    USING (sales_person_id = auth.uid() OR public.get_my_role() IN ('admin', 'head'));

-- 8. RLS Policies for quotation_items
CREATE POLICY "Users can access quotation_items" 
    ON public.quotation_items FOR ALL TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.quotations 
            WHERE quotations.id = quotation_items.quotation_id 
            AND (quotations.sales_person_id = auth.uid() OR public.get_my_role() IN ('admin', 'head'))
        )
    );

-- 9. Seed Sample Master Data
INSERT INTO public.master_data (category, name) VALUES
('part', '캡'), ('part', '용기'), ('part', '어깨'), ('part', '버튼'), ('part', '오버캡'),
('material', 'PP'), ('material', 'ABS'), ('material', 'PETG'), ('material', 'Glass'), ('material', 'AL'),
('metalizing', '유광골드'), ('metalizing', '무광골드'), ('metalizing', '유광실버'), ('metalizing', '무광실버'), ('metalizing', '적색'),
('coating', 'UV 유광'), ('coating', 'UV 무광'), ('coating', '고무코팅'), ('coating', '투명코팅')
ON CONFLICT (category, name) DO NOTHING;

-- 10. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_quotations_sales_person ON public.quotations(sales_person_id);
CREATE INDEX IF NOT EXISTS idx_quotations_client ON public.quotations(client_id);
CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation ON public.quotation_items(quotation_id);
