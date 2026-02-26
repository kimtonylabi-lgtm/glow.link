-- 1. Create Enum for Sample Status
CREATE TYPE public.sample_status AS ENUM ('pending', 'processing', 'shipped');

-- 2. Create Sample Requests Table
CREATE TABLE public.sample_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  sales_person_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1 NOT NULL,
  status public.sample_status DEFAULT 'pending'::public.sample_status NOT NULL,
  shipping_address TEXT,
  completion_image_url TEXT,
  request_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 3. Set up Row Level Security (RLS)
ALTER TABLE public.sample_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Select (Read)
-- Sales read their own requests. Admins, Heads, Sample Team read all.
CREATE POLICY "View samples policy" 
  ON public.sample_requests 
  FOR SELECT 
  TO authenticated 
  USING (
    sales_person_id = auth.uid() OR 
    public.get_my_role() IN ('admin', 'head', 'sample_team')
  );

-- Policy: Insert (Create)
-- Authenticated users (usually Sales) can create requests for themselves
CREATE POLICY "Insert samples policy" 
  ON public.sample_requests 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    sales_person_id = auth.uid()
  );

-- Policy: Update
-- Sales update their own pending requests. Sample Team/Admins/Heads can update any.
CREATE POLICY "Update samples policy" 
  ON public.sample_requests 
  FOR UPDATE 
  TO authenticated 
  USING (
    (sales_person_id = auth.uid() AND status = 'pending') OR 
    public.get_my_role() IN ('admin', 'head', 'sample_team')
  )
  WITH CHECK (
    (sales_person_id = auth.uid() AND status = 'pending') OR 
    public.get_my_role() IN ('admin', 'head', 'sample_team')
  );

-- Policy: Delete
-- Only Admins and Heads can delete requests
CREATE POLICY "Delete samples policy" 
  ON public.sample_requests 
  FOR DELETE 
  TO authenticated 
  USING (
    public.get_my_role() IN ('admin', 'head')
  );

-- 4. Setup Storage for Sample Images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('sample-uploads', 'sample-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT TO public USING ( bucket_id = 'sample-uploads' );

CREATE POLICY "Authenticated users can upload sample images"
ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'sample-uploads' );

CREATE POLICY "Authenticated users can update sample images"
ON storage.objects FOR UPDATE TO authenticated USING ( bucket_id = 'sample-uploads' );

CREATE POLICY "Authenticated users can delete sample images"
ON storage.objects FOR DELETE TO authenticated USING ( bucket_id = 'sample-uploads' );
