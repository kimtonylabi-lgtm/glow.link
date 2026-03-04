-- Add po_number column to orders table with UNIQUE constraint
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'po_number') THEN
        ALTER TABLE public.orders ADD COLUMN po_number VARCHAR(100) UNIQUE;
    END IF;
END $$;
