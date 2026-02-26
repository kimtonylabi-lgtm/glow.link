-- 1. Enable Supabase Realtime for the 'sample_requests' table
-- This allows clients to subscribe to changes on this specific table using supabase.channel()

-- First, check if publication exists (Supabase usually has 'supabase_realtime' built-in)
-- In a standard Supabase instance, all you need to do is add the table to it:
ALTER PUBLICATION supabase_realtime ADD TABLE public.sample_requests;

-- If you also want to listen to old records, you can set REPLICA IDENTITY FULL
-- (Optional, but good for getting the previous state)
ALTER TABLE public.sample_requests REPLICA IDENTITY FULL;
