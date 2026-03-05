-- Migration to add status_history to orders table
-- Tracks lifecycle events, especially confirm and cancel confirm along with reason and user.

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status_history JSONB DEFAULT '[]'::jsonb;
