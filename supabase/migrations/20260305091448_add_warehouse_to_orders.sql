-- Add warehouse column to orders
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS warehouse text;
