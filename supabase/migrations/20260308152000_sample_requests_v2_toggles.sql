-- Add toggles and relax constraints for Sample Request UI Overhaul Phase 2

-- 1. Add new boolean columns for Design Sample toggles
ALTER TABLE public.sample_requests 
ADD COLUMN IF NOT EXISTS has_sample BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS has_film BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS has_laba BOOLEAN DEFAULT FALSE;

-- 2. Ensure all fields used in the form are Nullable to prevent 500 errors
-- Even if some were previously defined as NOT NULL, we explicitly relax them.
ALTER TABLE public.sample_requests 
ALTER COLUMN shipping_address DROP NOT NULL,
ALTER COLUMN contact_person DROP NOT NULL,
ALTER COLUMN special_instructions DROP NOT NULL,
ALTER COLUMN cat_no DROP NOT NULL,
ALTER COLUMN completion_date DROP NOT NULL,
ALTER COLUMN film_color DROP NOT NULL,
ALTER COLUMN rubber_color DROP NOT NULL,
ALTER COLUMN design_specs DROP NOT NULL;

-- 3. Ensure quantity has a sensible default
ALTER TABLE public.sample_requests 
ALTER COLUMN quantity SET DEFAULT 1;

-- 4. Create an index on client_id and sales_person_id for performance (best practice)
CREATE INDEX IF NOT EXISTS idx_sample_requests_client_id ON public.sample_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_sample_requests_sales_person_id ON public.sample_requests(sales_person_id);
