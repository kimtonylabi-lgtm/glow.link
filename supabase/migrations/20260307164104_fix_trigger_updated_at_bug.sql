-- [Fix] orders 테이블에 updated_at 컬럼이 없어 발생하는 트리거 오류 해결
-- 트리거 함수를 업데이트하여 updated_at = now() 구문을 제거합니다.

CREATE OR REPLACE FUNCTION public.sync_order_shipping_status()
RETURNS TRIGGER AS $$
DECLARE
    v_order_id      UUID;
    v_order_qty     INTEGER;
    v_shipped_qty   INTEGER;
BEGIN
    v_order_id := COALESCE(NEW.order_id, OLD.order_id);

    -- 수주 마스터 정보 조회
    SELECT total_quantity INTO v_order_qty
    FROM public.orders WHERE id = v_order_id;

    -- 누적 출하수량 합산
    SELECT COALESCE(SUM(shipped_quantity), 0) INTO v_shipped_qty
    FROM public.shipping_orders WHERE order_id = v_order_id;

    -- 자동 상태 전환
    -- [보강] 이미 'shipped' 상태인 경우(강제 완료 등), 다시 'partially_shipped'로 전환되지 않도록 방어.
    IF v_order_qty > 0 AND v_shipped_qty >= v_order_qty THEN
        UPDATE public.orders SET status = 'shipped' WHERE id = v_order_id AND status != 'shipped';
    ELSIF v_shipped_qty > 0 THEN
        UPDATE public.orders SET status = 'partially_shipped' 
        WHERE id = v_order_id 
        AND status NOT IN ('shipped', 'partially_shipped');
    ELSE
        -- 출하 내역이 모두 삭제된 경우에만 'production' 등으로 복구
        UPDATE public.orders SET status = 'production' 
        WHERE id = v_order_id 
        AND status IN ('partially_shipped', 'shipped');
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
