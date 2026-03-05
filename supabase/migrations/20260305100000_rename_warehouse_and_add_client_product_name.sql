-- Rename warehouse to receiving_destination for consistency and safety
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'warehouse'
    ) THEN
        ALTER TABLE public.orders RENAME COLUMN warehouse TO receiving_destination;
    END IF;
END $$;

-- Ensure receiving_destination exists even if warehouse didn't (safety)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'receiving_destination'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN receiving_destination TEXT;
    END IF;
END $$;

-- Ensure client_product_name exists in order_items for 2-line display
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' AND column_name = 'client_product_name'
    ) THEN
        ALTER TABLE public.order_items ADD COLUMN client_product_name TEXT;
    END IF;
END $$;
