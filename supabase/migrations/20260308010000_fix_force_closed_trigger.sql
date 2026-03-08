-- ============================================================
-- [Critical Fix] is_force_closed 강제완료 트리거 Fall-through 버그 수정
-- 문제: is_force_closed = true 시 'shipped'로 업데이트 후 RETURN 없이
--       하위 잔량 로직을 타서 'partially_shipped'로 덮어쓰는 버그
-- 해결: 최상단에 is_force_closed 체크 후 즉시 RETURN NEW로 탈출
-- ============================================================

-- shipping_orders 테이블에 is_force_closed 컬럼 추가 (없을 경우에만)
ALTER TABLE public.shipping_orders
  ADD COLUMN IF NOT EXISTS is_force_closed BOOLEAN NOT NULL DEFAULT false;

-- 트리거 함수 재정의 (is_force_closed 최우선 처리 + RETURN NEW 즉시 탈출)
CREATE OR REPLACE FUNCTION public.sync_order_shipping_status()
RETURNS TRIGGER AS $$
DECLARE
    v_order_id      UUID;
    v_order_qty     INTEGER;
    v_shipped_qty   INTEGER;
BEGIN
    v_order_id := COALESCE(NEW.order_id, OLD.order_id);

    -- ✅ [최우선 처리] is_force_closed = true → 즉시 'shipped' 고정 후 함수 종료
    -- 이 블록 이후 잔량 계산 로직에 절대 진입하지 않도록 RETURN NEW로 강제 탈출
    IF TG_OP != 'DELETE' AND NEW.is_force_closed = true THEN
        UPDATE public.orders
        SET status = 'shipped'
        WHERE id = v_order_id
          AND status != 'shipped';

        RETURN NEW;  -- 🚨 핵심: 여기서 반드시 즉시 종료 (아래 로직 진입 차단)
    END IF;

    -- 수주 마스터 정보 조회
    SELECT total_quantity INTO v_order_qty
    FROM public.orders WHERE id = v_order_id;

    -- 누적 출하수량 합산
    SELECT COALESCE(SUM(shipped_quantity), 0) INTO v_shipped_qty
    FROM public.shipping_orders WHERE order_id = v_order_id;

    -- 자동 상태 전환
    IF v_order_qty > 0 AND v_shipped_qty >= v_order_qty THEN
        -- 발주 수량 이상 출하 → 완료
        UPDATE public.orders
        SET status = 'shipped'
        WHERE id = v_order_id AND status != 'shipped';

    ELSIF v_shipped_qty > 0 THEN
        -- 일부 출하됨 → 부분출하 (단, 이미 shipped 상태면 건드리지 않음)
        UPDATE public.orders
        SET status = 'partially_shipped'
        WHERE id = v_order_id
          AND status NOT IN ('shipped', 'partially_shipped');

    ELSE
        -- 출하 내역 전부 삭제된 경우 → 생산 상태로 복구
        UPDATE public.orders
        SET status = 'production'
        WHERE id = v_order_id
          AND status IN ('partially_shipped', 'shipped');
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 트리거 재등록 (INSERT, UPDATE, DELETE 모두 감지)
DROP TRIGGER IF EXISTS trg_sync_order_shipping_status ON public.shipping_orders;

CREATE TRIGGER trg_sync_order_shipping_status
AFTER INSERT OR UPDATE OR DELETE
ON public.shipping_orders
FOR EACH ROW EXECUTE FUNCTION public.sync_order_shipping_status();
