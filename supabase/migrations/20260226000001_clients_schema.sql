-- 1. Create Enums for Client
CREATE TYPE public.client_tier AS ENUM ('S', 'A', 'B', 'C');
CREATE TYPE public.client_status AS ENUM ('active', 'inactive');

-- 2. Create Clients Table
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  business_number TEXT,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  memo TEXT,
  tier public.client_tier DEFAULT 'C'::public.client_tier NOT NULL,
  status public.client_status DEFAULT 'active'::public.client_status NOT NULL,
  managed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 3. Set up Row Level Security (RLS)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Policy: Select (Read)
-- Sales read their own or unassigned (public). Admins & Heads read all.
CREATE POLICY "View clients policy" 
  ON public.clients 
  FOR SELECT 
  TO authenticated 
  USING (
    managed_by = auth.uid() OR 
    managed_by IS NULL OR 
    public.get_my_role() IN ('admin', 'head')
  );

-- Policy: Insert (Create)
-- Sales, Admin, Head can create new clients
CREATE POLICY "Insert clients policy" 
  ON public.clients 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    public.get_my_role() IN ('admin', 'head', 'sales')
  );

-- Policy: Update
-- Sales update their own. Admins/Heads update all.
CREATE POLICY "Update clients policy" 
  ON public.clients 
  FOR UPDATE 
  TO authenticated 
  USING (
    managed_by = auth.uid() OR 
    public.get_my_role() IN ('admin', 'head')
  )
  WITH CHECK (
    managed_by = auth.uid() OR 
    public.get_my_role() IN ('admin', 'head')
  );

-- Policy: Delete
-- Only Admins and Heads can delete clients
CREATE POLICY "Delete clients policy" 
  ON public.clients 
  FOR DELETE 
  TO authenticated 
  USING (
    public.get_my_role() IN ('admin', 'head')
  );
