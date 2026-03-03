-- 1. Create Enums
DO $$ BEGIN
    CREATE TYPE public.quotation_status AS ENUM ('draft', 'finalized');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Quotations Table
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

-- 3. Create Quotation Items Table
CREATE TABLE IF NOT EXISTS public.quotation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1 NOT NULL,
    unit_price NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    post_processing JSONB DEFAULT '[]'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 4. Update Orders Table (link to quotation)
DO $$ BEGIN
    ALTER TABLE public.orders ADD COLUMN quotation_id UUID REFERENCES public.quotations(id);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- 5. Enable RLS
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for Quotations
CREATE POLICY "Users can view their own quotations" 
    ON public.quotations FOR SELECT 
    USING (sales_person_id = auth.uid() OR public.get_my_role() IN ('admin', 'head'));

CREATE POLICY "Users can insert their own quotations" 
    ON public.quotations FOR INSERT 
    WITH CHECK (sales_person_id = auth.uid());

CREATE POLICY "Users can update their own quotations" 
    ON public.quotations FOR UPDATE 
    USING (sales_person_id = auth.uid() OR public.get_my_role() IN ('admin', 'head'));

CREATE POLICY "Users can delete their own quotations" 
    ON public.quotations FOR DELETE 
    USING (sales_person_id = auth.uid() OR public.get_my_role() IN ('admin', 'head'));

-- 7. RLS Policies for Quotation Items
CREATE POLICY "Quotation items access control" 
    ON public.quotation_items FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.quotations 
            WHERE quotations.id = quotation_items.quotation_id 
            AND (quotations.sales_person_id = auth.uid() OR public.get_my_role() IN ('admin', 'head'))
        )
    );

-- 8. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_quotations_sales_person ON public.quotations(sales_person_id);
CREATE INDEX IF NOT EXISTS idx_quotations_client ON public.quotations(client_id);
CREATE INDEX IF NOT EXISTS idx_quotations_parent ON public.quotations(parent_id);
CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation ON public.quotation_items(quotation_id);
