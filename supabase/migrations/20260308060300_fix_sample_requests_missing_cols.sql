-- Add missing columns to sample_requests table
ALTER TABLE public.sample_requests 
ADD COLUMN IF NOT EXISTS contact_person TEXT,
ADD COLUMN IF NOT EXISTS special_instructions TEXT,
ADD COLUMN IF NOT EXISTS sample_type TEXT;

-- Migration to make shipping_address optional (already is, but ensuring no constraints)
ALTER TABLE public.sample_requests ALTER COLUMN shipping_address DROP NOT NULL;
ALTER TABLE public.sample_requests ALTER COLUMN quantity SET DEFAULT 1;
