-- CRM 360 Expansion: Contacts and Logs

-- 1. Create customer_contacts table
CREATE TABLE public.customer_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position TEXT,
  phone TEXT,
  email TEXT,
  is_primary BOOLEAN DEFAULT false,
  memo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 2. Create customer_history_logs table
CREATE TABLE public.customer_history_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  log_type TEXT NOT NULL, -- 'contact_added', 'contact_changed', 'managed_by_changed', 'info_updated', etc.
  content TEXT NOT NULL,
  performer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 3. Enable RLS
ALTER TABLE public.customer_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_history_logs ENABLE ROW LEVEL SECURITY;

-- 4. Set up RLS Policies

-- customer_contacts: Follow client access logic
CREATE POLICY "View customer contacts policy" 
  ON public.customer_contacts FOR SELECT TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.clients 
      WHERE clients.id = customer_contacts.client_id 
      AND (managed_by = auth.uid() OR managed_by IS NULL OR public.get_my_role() IN ('admin', 'head'))
    )
  );

CREATE POLICY "Manage customer contacts policy" 
  ON public.customer_contacts FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.clients 
      WHERE clients.id = customer_contacts.client_id 
      AND (managed_by = auth.uid() OR public.get_my_role() IN ('admin', 'head'))
    )
  );

-- customer_history_logs: Follow client access logic
CREATE POLICY "View customer history logs policy" 
  ON public.customer_history_logs FOR SELECT TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.clients 
      WHERE clients.id = customer_history_logs.client_id 
      AND (managed_by = auth.uid() OR managed_by IS NULL OR public.get_my_role() IN ('admin', 'head'))
    )
  );

CREATE POLICY "Manage customer history logs policy" 
  ON public.customer_history_logs FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.clients 
      WHERE clients.id = customer_history_logs.client_id 
      AND (managed_by = auth.uid() OR public.get_my_role() IN ('admin', 'head'))
    )
  );

-- 5. Data Migration: Move existing contacts from clients to customer_contacts
INSERT INTO public.customer_contacts (client_id, name, email, phone, is_primary)
SELECT id, contact_person, email, phone, true
FROM public.clients
WHERE contact_person IS NOT NULL OR email IS NOT NULL OR phone IS NOT NULL;

-- 6. Add trigger for managed_by change logging
CREATE OR REPLACE FUNCTION public.log_managed_by_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.managed_by IS DISTINCT FROM NEW.managed_by THEN
    INSERT INTO public.customer_history_logs (client_id, log_type, content, performer_id)
    VALUES (
      NEW.id, 
      'managed_by_changed', 
      '내부 담당자가 변경되었습니다.',
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_log_managed_by_change
  AFTER UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.log_managed_by_change();
