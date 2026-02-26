-- 1. Create Enum for Activity Type
CREATE TYPE public.activity_type AS ENUM ('meeting', 'call', 'email', 'meal', 'other');

-- 2. Create Activities Table
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type public.activity_type DEFAULT 'meeting'::public.activity_type NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  activity_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 3. Set up Row Level Security (RLS)
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Policy: Select (Read)
-- Sales read their own activities. Admins & Heads read all.
CREATE POLICY "View activities policy" 
  ON public.activities 
  FOR SELECT 
  TO authenticated 
  USING (
    user_id = auth.uid() OR 
    public.get_my_role() IN ('admin', 'head')
  );

-- Policy: Insert (Create)
-- Authenticated users can create activities for themselves
CREATE POLICY "Insert activities policy" 
  ON public.activities 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    user_id = auth.uid()
  );

-- Policy: Update
-- Users can update their own activities. Admins/Heads can update any.
CREATE POLICY "Update activities policy" 
  ON public.activities 
  FOR UPDATE 
  TO authenticated 
  USING (
    user_id = auth.uid() OR 
    public.get_my_role() IN ('admin', 'head')
  )
  WITH CHECK (
    user_id = auth.uid() OR 
    public.get_my_role() IN ('admin', 'head')
  );

-- Policy: Delete
-- Users can delete their own activities. Admins/Heads can delete any.
CREATE POLICY "Delete activities policy" 
  ON public.activities 
  FOR DELETE 
  TO authenticated 
  USING (
    user_id = auth.uid() OR 
    public.get_my_role() IN ('admin', 'head')
  );
