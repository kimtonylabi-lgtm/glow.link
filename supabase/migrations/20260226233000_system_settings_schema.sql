-- 1. Create the system_settings table
CREATE TABLE public.system_settings (
    key VARCHAR(50) PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Add an updated_at trigger
CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Row Level Security Policies
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- 3.a. Only Admins can insert/update/delete
CREATE POLICY "Admins have full access to settings"
ON public.system_settings
FOR ALL
USING ( public.get_my_role() = 'admin' );

-- 3.b. Everyone else can only READ settings (so the app can use them)
CREATE POLICY "Everyone can view settings"
ON public.system_settings
FOR SELECT
USING ( auth.uid() IS NOT NULL );

-- 4. Initial Seed for Settings (Optional default)
INSERT INTO public.system_settings (key, value, description)
VALUES 
('PRODUCT_CATEGORIES', '["bottle", "pump", "jar", "cap"]'::jsonb, '사용 가능한 제품 카테고리 목록'),
('APP_CONFIG', '{"maintenanceMode": false, "contactEmail": "admin@glowlink.com"}'::jsonb, '전역 애플리케이션 설정 사항')
ON CONFLICT (key) DO NOTHING;
