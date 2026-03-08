-- Final migration to ensure all required columns exist in sample_requests
ALTER TABLE public.sample_requests 
ADD COLUMN IF NOT EXISTS contact_person TEXT,
ADD COLUMN IF NOT EXISTS special_instructions TEXT,
ADD COLUMN IF NOT EXISTS sample_type TEXT DEFAULT 'random',
ADD COLUMN IF NOT EXISTS cat_no TEXT,
ADD COLUMN IF NOT EXISTS completion_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS design_specs JSONB,
ADD COLUMN IF NOT EXISTS film_color TEXT,
ADD COLUMN IF NOT EXISTS rubber_color TEXT;

-- Ensure boolean toggles exist (Phase 2 additions)
ALTER TABLE public.sample_requests 
ADD COLUMN IF NOT EXISTS has_sample BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS has_film BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS has_laba BOOLEAN DEFAULT FALSE;

-- Relax constraints to prevent 500 errors during transition
ALTER TABLE public.sample_requests 
ALTER COLUMN shipping_address DROP NOT NULL,
ALTER COLUMN contact_person DROP NOT NULL,
ALTER COLUMN special_instructions DROP NOT NULL,
ALTER COLUMN cat_no DROP NOT NULL,
ALTER COLUMN completion_date DROP NOT NULL,
ALTER COLUMN design_specs DROP NOT NULL;

-- Default quantity
ALTER TABLE public.sample_requests 
ALTER COLUMN quantity SET DEFAULT 1;
