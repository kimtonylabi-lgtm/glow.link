-- Add quotation_id column to orders table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'quotation_id') THEN
        ALTER TABLE public.orders ADD COLUMN quotation_id UUID REFERENCES public.quotations(id);
    END IF;
END $$;
