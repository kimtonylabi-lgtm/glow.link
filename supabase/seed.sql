-- GlowLink Test Accounts Seed Script
-- NOTICE: You must run this directly in the Supabase SQL Editor.
-- These queries bypass the normal auth.signUp flow to force create user accounts for testing purposes only.

-- Required extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
DECLARE
  admin_uid UUID;
  head_uid UUID;
  sales_uid UUID;
  sample_uid UUID;
BEGIN
  -- 1. Create or Get Admin User
  SELECT id INTO admin_uid FROM auth.users WHERE email = 'admin@glow.link';
  IF admin_uid IS NULL THEN
    admin_uid := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, aud, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, confirmation_token, recovery_token, email_change_token_new, email_change)
    VALUES (admin_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'admin@glow.link', crypt('test1234', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{"full_name": "시스템 관리자"}', now(), now(), 'authenticated', '', '', '', '');
  END IF;
  
  -- 2. Create or Get Head User
  SELECT id INTO head_uid FROM auth.users WHERE email = 'head@glow.link';
  IF head_uid IS NULL THEN
    head_uid := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, aud, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, confirmation_token, recovery_token, email_change_token_new, email_change)
    VALUES (head_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'head@glow.link', crypt('test1234', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{"full_name": "영업부서장"}', now(), now(), 'authenticated', '', '', '', '');
  END IF;
  
  -- 3. Create or Get Sales User
  SELECT id INTO sales_uid FROM auth.users WHERE email = 'sales@glow.link';
  IF sales_uid IS NULL THEN
    sales_uid := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, aud, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, confirmation_token, recovery_token, email_change_token_new, email_change)
    VALUES (sales_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'sales@glow.link', crypt('test1234', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{"full_name": "김영업 사원"}', now(), now(), 'authenticated', '', '', '', '');
  END IF;
  
  -- 4. Create or Get Sample Team User
  SELECT id INTO sample_uid FROM auth.users WHERE email = 'sample@glow.link';
  IF sample_uid IS NULL THEN
    sample_uid := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, aud, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, confirmation_token, recovery_token, email_change_token_new, email_change)
    VALUES (sample_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'sample@glow.link', crypt('test1234', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{"full_name": "이샘플 주임"}', now(), now(), 'authenticated', '', '', '', '');
  END IF;

  -- 5. Force update the roles in the profiles table
  -- (Since the trigger already created them with default 'sales' role)
  UPDATE public.profiles SET role = 'admin' WHERE id = admin_uid;
  UPDATE public.profiles SET role = 'head' WHERE id = head_uid;
  UPDATE public.profiles SET role = 'sales' WHERE id = sales_uid;
  UPDATE public.profiles SET role = 'sample_team' WHERE id = sample_uid;

  -- 6. Insert Mock CRM Clients
  INSERT INTO public.clients (company_name, business_number, contact_person, email, phone, address, memo, tier, status, managed_by) VALUES
  ('코스맥스', '123-45-67890', '김이사', 'kim@cosmax.test', '010-1111-2222', '경기도 화성시', '주요 ODM 파트너', 'S', 'active', sales_uid),
  ('한국콜마', '234-56-78901', '이팀장', 'lee@kolmar.test', '010-3333-4444', '세종특별자치시', '친환경 패키징 우선 제안', 'S', 'active', sales_uid),
  ('아모레퍼시픽', '345-67-89012', '박담당', 'park@amore.test', '010-5555-6666', '서울 용산구', 'VIP 응대 필수', 'S', 'active', admin_uid),
  ('LG생활건강', '456-78-90123', '최과장', 'choi@lgcare.test', '010-7777-8888', '서울 종로구', '대규모 수주 예상', 'A', 'active', head_uid),
  ('롬앤', '567-89-01234', '정대리', 'jung@romand.test', '010-9999-0000', '서울 마포구', '색조 용기 리뉴얼 논의', 'A', 'active', sales_uid),
  ('클리오', '678-90-12345', '강주임', 'kang@clio.test', '010-1234-5678', '서울 성동구', '신제품 패키지 샘플 발송 요망', 'B', 'active', sales_uid),
  ('이니스프리', '789-01-23456', '조사원', 'cho@innisfree.test', '010-2345-6789', '서울 용산구', '미팅 일정 조율 중', 'B', 'active', NULL),
  ('에스쁘아', '890-12-34567', '윤대표', 'yoon@espoir.test', '010-3456-7890', '서울 강남구', '단가 협상 중', 'C', 'active', sales_uid),
  ('에뛰드', '901-23-45678', '임실장', 'lim@etude.test', '010-4567-8901', '서울 용산구', '거래 재개 요청', 'C', 'inactive', NULL),
  ('라네즈', '012-34-56789', '한매니저', 'han@laneige.test', '010-5678-9012', '서울 용산구', '장기 미거래', 'C', 'inactive', head_uid);

  -- 7. Insert Mock CRM Activities
  INSERT INTO public.activities (client_id, user_id, type, title, content, activity_date)
  SELECT id, sales_uid, 'meeting', '초기 인사 및 제안 준비', '친환경 용기 샘플을 지참하여 방문 미팅 진행. 긍정적 검토 약속 받음.', NOW() - INTERVAL '5 days' FROM public.clients WHERE company_name = '코스맥스' LIMIT 1;

  INSERT INTO public.activities (client_id, user_id, type, title, content, activity_date)
  SELECT id, sales_uid, 'call', '단가 협의 전화', '기본 단가 및 MOQ 관련하여 1차 구두 협의 완료', NOW() - INTERVAL '3 days' FROM public.clients WHERE company_name = '한국콜마' LIMIT 1;

  INSERT INTO public.activities (client_id, user_id, type, title, content, activity_date)
  SELECT id, admin_uid, 'email', '회사소개서 발송', '최신 2026년도 지속가능성 뷰티 포트폴리오 첨부 발송', NOW() - INTERVAL '7 days' FROM public.clients WHERE company_name = '아모레퍼시픽' LIMIT 1;

  INSERT INTO public.activities (client_id, user_id, type, title, content, activity_date)
  SELECT id, head_uid, 'meal', '경영진 오찬', '연간 계약 갱신 건으로 식사 자리 마련. 내년도 물량 확보 확정적.', NOW() - INTERVAL '1 days' FROM public.clients WHERE company_name = 'LG생활건강' LIMIT 1;

  INSERT INTO public.activities (client_id, user_id, type, title, content, activity_date)
  SELECT id, sales_uid, 'other', '샘플 택배 발송', '요청받은 신형 에어리스 펌프 샘플 10종 발송 완료', NOW() - INTERVAL '2 hours' FROM public.clients WHERE company_name = '롬앤' LIMIT 1;

  -- 8. Insert Mock Sample Requests
  INSERT INTO public.sample_requests (client_id, sales_person_id, product_name, quantity, status, shipping_address, request_date)
  SELECT id, sales_uid, '크림 용기 50ml (A타입)', 10, 'pending', address, NOW() - INTERVAL '1 hours' FROM public.clients WHERE company_name = '코스맥스' LIMIT 1;
  
  INSERT INTO public.sample_requests (client_id, sales_person_id, product_name, quantity, status, shipping_address, request_date)
  SELECT id, sales_uid, '친환경 펌프형 공병', 5, 'processing', address, NOW() - INTERVAL '2 days' FROM public.clients WHERE company_name = '한국콜마' LIMIT 1;
  
  INSERT INTO public.sample_requests (client_id, sales_person_id, product_name, quantity, status, shipping_address, request_date)
  SELECT id, admin_uid, '투명 립스틱 스틱형 (샘플판)', 20, 'pending', address, NOW() - INTERVAL '3 hours' FROM public.clients WHERE company_name = '아모레퍼시픽' LIMIT 1;

  INSERT INTO public.sample_requests (client_id, sales_person_id, product_name, quantity, status, shipping_address, request_date)
  SELECT id, head_uid, '유리 앰플 10ml', 50, 'shipped', address, NOW() - INTERVAL '5 days' FROM public.clients WHERE company_name = 'LG생활건강' LIMIT 1;

  INSERT INTO public.sample_requests (client_id, sales_person_id, product_name, quantity, status, shipping_address, request_date)
  SELECT id, sales_uid, '컬러 섀도우 팔레트 공용기', 15, 'processing', address, NOW() - INTERVAL '1 days' FROM public.clients WHERE company_name = '롬앤' LIMIT 1;

  -- 9. Insert Mock Products
  INSERT INTO public.products (name, item_code, category, price)
  VALUES 
    ('에센셜 유리병 30ml', 'BTL-E30', 'bottle', 1500),
    ('프리미엄 세럼병 50ml', 'BTL-P50', 'bottle', 2200),
    ('에어리스 펌프 (화이트)', 'PMP-A01', 'pump', 850),
    ('메탈 펌프헤드', 'PMP-M01', 'pump', 1200),
    ('더블월 크림자 50g', 'JAR-D50', 'jar', 3500),
    ('투명 아크릴자 100g', 'JAR-T100', 'jar', 2800),
    ('알루미늄 캡 24파이', 'CAP-AL24', 'cap', 450),
    ('우드 패턴 캡', 'CAP-W01', 'cap', 600),
    ('토너 용기 150ml', 'BTL-T150', 'bottle', 1800),
    ('미스트 스프레이 펌프', 'PMP-S01', 'pump', 950)
  ON CONFLICT (item_code) DO NOTHING;

  -- 10. Insert Mock Orders
  -- For Orders we need temporary variables to capture generated order IDs to insert items
  DECLARE
    order1_id UUID := gen_random_uuid();
    order2_id UUID := gen_random_uuid();
    order3_id UUID := gen_random_uuid();
    p1_id UUID; p2_id UUID; p3_id UUID; p4_id UUID;
    c1_id UUID; c2_id UUID; c3_id UUID;
  BEGIN
    -- Get some product IDs
    SELECT id INTO p1_id FROM public.products WHERE item_code = 'BTL-E30';
    SELECT id INTO p2_id FROM public.products WHERE item_code = 'PMP-A01';
    SELECT id INTO p3_id FROM public.products WHERE item_code = 'JAR-D50';
    SELECT id INTO p4_id FROM public.products WHERE item_code = 'CAP-AL24';

    -- Get some client IDs
    SELECT id INTO c1_id FROM public.clients WHERE company_name = '코스맥스';
    SELECT id INTO c2_id FROM public.clients WHERE company_name = '한국콜마';
    SELECT id INTO c3_id FROM public.clients WHERE company_name = '아모레퍼시픽';

    -- Insert Orders and Items
    INSERT INTO public.orders (id, client_id, sales_person_id, due_date, total_amount, status, memo)
    VALUES (order1_id, c1_id, sales_uid, NOW() + INTERVAL '30 days', 11750000, 'confirmed', '1차 양산 발주건');
    
    INSERT INTO public.order_items (order_id, product_id, quantity, unit_price, subtotal)
    VALUES 
      (order1_id, p1_id, 5000, 1500, 7500000),
      (order1_id, p2_id, 5000, 850, 4250000);

    INSERT INTO public.orders (id, client_id, sales_person_id, due_date, total_amount, status, memo)
    VALUES (order2_id, c2_id, sales_uid, NOW() + INTERVAL '45 days', 17500000, 'production', '프리미엄 라인업');

    INSERT INTO public.order_items (order_id, product_id, quantity, unit_price, subtotal)
    VALUES (order2_id, p3_id, 5000, 3500, 17500000);

    INSERT INTO public.orders (id, client_id, sales_person_id, due_date, total_amount, status, memo)
    VALUES (order3_id, c3_id, admin_uid, NOW() + INTERVAL '14 days', 900000, 'shipped', '긴급 물량 처리');

    INSERT INTO public.order_items (order_id, product_id, quantity, unit_price, subtotal)
    VALUES (order3_id, p4_id, 2000, 450, 900000);
  END;
  
END $$;
