-- 20260308024733_sample_requests_ui.sql
ALTER TABLE public.sample_requests 
ADD COLUMN IF NOT EXISTS design_specs JSONB,
ADD COLUMN IF NOT EXISTS completion_date DATE,
ADD COLUMN IF NOT EXISTS cat_no TEXT,
ADD COLUMN IF NOT EXISTS film_color TEXT,
ADD COLUMN IF NOT EXISTS rubber_color TEXT;
