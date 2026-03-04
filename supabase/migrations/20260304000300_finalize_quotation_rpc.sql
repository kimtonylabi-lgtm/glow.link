-- 1. order_items 테이블에 후가공(post_processing) 컬럼명 추가 (존재하지 않으면 추가)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'post_processing') THEN
        ALTER TABLE public.order_items ADD COLUMN post_processing JSONB DEFAULT '[]'::jsonb NOT NULL;
    END IF;
END $$;

-- 2. 견적서를 수주로 완벽하게 변환하는 원자적 RPC(Stored Procedure) 함수
CREATE OR REPLACE FUNCTION finalize_quotation_to_order(p_quotation_id UUID)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_quote record;
    v_order_id uuid;
    v_item record;
BEGIN
    -- 1. 견적서 기본 정보 획득 및 락 확보 (동시성 제어)
    SELECT * INTO v_quote
    FROM public.quotations
    WHERE id = p_quotation_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION '견적서를 찾을 수 없습니다. (ID: %)', p_quotation_id;
    END IF;

    IF v_quote.status = 'finalized' THEN
        RAISE EXCEPTION '이미 수주 확정된 견적서입니다.';
    END IF;

    -- 2. 오류 방어: 품목 존재 여부 확인
    IF NOT EXISTS (SELECT 1 FROM public.quotation_items WHERE quotation_id = p_quotation_id) THEN
        RAISE EXCEPTION '부품 코스트가 기입되지 않은 빈 견적서입니다.';
    END IF;

    -- 3. orders (수주 마스터) 테이블 Insert
    INSERT INTO public.orders (
        client_id,
        sales_person_id,
        total_amount,
        status,
        quotation_id
    ) VALUES (
        v_quote.client_id,
        v_quote.sales_person_id,
        v_quote.total_amount,
        'confirmed',
        v_quote.id
    ) RETURNING id INTO v_order_id;

    -- 4. order_items 복사 (post_processing 포함)
    FOR v_item IN (SELECT * FROM public.quotation_items WHERE quotation_id = p_quotation_id)
    LOOP
        INSERT INTO public.order_items (
            order_id,
            product_id,
            quantity,
            unit_price,
            subtotal,
            post_processing
        ) VALUES (
            v_order_id,
            v_item.product_id,
            v_item.quantity,
            v_item.unit_price,
            v_item.quantity * v_item.unit_price,
            v_item.post_processing
        );
    END LOOP;

    -- 5. 견적서 마스터 status 업데이트
    UPDATE public.quotations
    SET status = 'finalized'
    WHERE id = p_quotation_id;

    -- 완료되면 신규 Order ID 반환
    RETURN json_build_object('success', true, 'order_id', v_order_id);

EXCEPTION WHEN OTHERS THEN
    -- 트랜잭션 에러 발생 시 모든 변경사항 롤백 후 원인 반환
    RAISE EXCEPTION '수주 트랜잭션 실패: %', SQLERRM;
END;
$$;
