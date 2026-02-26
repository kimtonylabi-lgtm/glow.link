-- Create system_settings table
CREATE TABLE public.system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS: Only admins can manage system settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on settings"
ON public.system_settings
FOR ALL
USING ( public.get_my_role() = 'admin' );

CREATE POLICY "Everyone can view settings"
ON public.system_settings
FOR SELECT
USING ( true );

-- Insert default settings
INSERT INTO public.system_settings (key, value, description)
VALUES 
('product_categories', '["Bottle", "Pump", "Jar", "Cap"]'::jsonb, 'Common product categories'),
('business_info', '{"company_name": "GlowLink", "currency": "KRW"}'::jsonb, 'General business information');
