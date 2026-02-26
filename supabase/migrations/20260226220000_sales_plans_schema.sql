-- 1. Create the sales_plans table
CREATE TABLE public.sales_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sales_person_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_month VARCHAR(7) NOT NULL, -- Format: 'YYYY-MM'
    target_amount NUMERIC NOT NULL DEFAULT 0 CHECK (target_amount >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Ensure a sales person only has one plan per month
    UNIQUE(sales_person_id, target_month)
);

-- 2. Add an updated_at trigger
CREATE TRIGGER update_sales_plans_updated_at
BEFORE UPDATE ON public.sales_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Row Level Security Policies
ALTER TABLE public.sales_plans ENABLE ROW LEVEL SECURITY;

-- 3.a. Admins and Heads can view ALL sales plans
CREATE POLICY "Admins and Heads can view all plans"
ON public.sales_plans
FOR SELECT
USING ( public.get_my_role() IN ('admin', 'head') );

-- 3.b. Sales person can view ONLY their own sales plan
CREATE POLICY "Sales can view their own plans"
ON public.sales_plans
FOR SELECT
USING ( sales_person_id = auth.uid() );

-- 3.c. Admins and Heads can insert/update any plan (optional administration oversight)
CREATE POLICY "Admins and Heads can modify all plans"
ON public.sales_plans
FOR ALL
USING ( public.get_my_role() IN ('admin', 'head') );

-- 3.d. Sales person can insert/update their OWN plan
CREATE POLICY "Sales can insert their own plans"
ON public.sales_plans
FOR INSERT
WITH CHECK ( sales_person_id = auth.uid() );

CREATE POLICY "Sales can update their own plans"
ON public.sales_plans
FOR UPDATE
USING ( sales_person_id = auth.uid() )
WITH CHECK ( sales_person_id = auth.uid() );
