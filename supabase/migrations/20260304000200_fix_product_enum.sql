-- Update Product Category Enum and Constraints

-- 1. Add 'finished' to product_category enum
-- PostgreSQL doesn't support IF NOT EXISTS for adding enum values directly, so we use a safe block
DO $$ BEGIN
    ALTER TYPE public.product_category ADD VALUE 'finished';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Ensure item_code uniqueness handles empty/null correctly
-- If the item_code is empty, we might want to generate a temporary one or keep it null if allowed.
-- Based on previous migration, item_code is already UNIQUE and NULLABLE.
-- However, we can add a check to ensure we don't insert empty strings that collide.

-- 3. Update Quotation Table Schema (Fixing potential missing parent_id if needed, but it's already there)
-- This script primarily focuses on the product category fix.
