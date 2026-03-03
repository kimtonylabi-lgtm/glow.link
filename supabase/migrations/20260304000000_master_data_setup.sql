-- Migration for Master Data Table

-- 1. Create Master Data Table
CREATE TABLE IF NOT EXISTS public.master_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL, -- 'part', 'material', 'metalizing', 'coating'
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    UNIQUE(category, name)
);

-- 2. Enable RLS
ALTER TABLE public.master_data ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
CREATE POLICY "Master data viewable by authenticated users" 
    ON public.master_data FOR SELECT TO authenticated USING (true);

CREATE POLICY "Master data manageable by admin and head" 
    ON public.master_data FOR ALL TO authenticated 
    USING (public.get_my_role() IN ('admin', 'head'));

-- 4. Seed Data
INSERT INTO public.master_data (category, name) VALUES
('part', '캡'), ('part', '용기'), ('part', '어깨'), ('part', '버튼'), ('part', '오버캡'),
('material', 'PP'), ('material', 'ABS'), ('material', 'PETG'), ('material', 'Glass'), ('material', 'AL'),
('metalizing', '유광골드'), ('metalizing', '무광골드'), ('metalizing', '유광실버'), ('metalizing', '무광실버'), ('metalizing', '적색'),
('coating', 'UV 유광'), ('coating', 'UV 무광'), ('coating', '고무코팅'), ('coating', '투명코팅')
ON CONFLICT (category, name) DO NOTHING;
