-- Create monthly_sales_goals table
CREATE TABLE IF NOT EXISTS public.monthly_sales_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_person_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    target_amount NUMERIC(20, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(sales_person_id, year, month)
);

-- Enable RLS
ALTER TABLE public.monthly_sales_goals ENABLE ROW LEVEL SECURITY;

-- Policies (Ensure users can only manage their own data)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'monthly_sales_goals' AND policyname = 'Users can view their own goals') THEN
        CREATE POLICY "Users can view their own goals" ON public.monthly_sales_goals FOR SELECT USING (auth.uid() = sales_person_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'monthly_sales_goals' AND policyname = 'Users can insert their own goals') THEN
        CREATE POLICY "Users can insert their own goals" ON public.monthly_sales_goals FOR INSERT WITH CHECK (auth.uid() = sales_person_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'monthly_sales_goals' AND policyname = 'Users can update their own goals') THEN
        CREATE POLICY "Users can update their own goals" ON public.monthly_sales_goals FOR UPDATE USING (auth.uid() = sales_person_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'monthly_sales_goals' AND policyname = 'Users can delete their own goals') THEN
        CREATE POLICY "Users can delete their own goals" ON public.monthly_sales_goals FOR DELETE USING (auth.uid() = sales_person_id);
    END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_monthly_goals_user_id ON public.monthly_sales_goals(sales_person_id);
CREATE INDEX IF NOT EXISTS idx_monthly_goals_year_month ON public.monthly_sales_goals(year, month);
