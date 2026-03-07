'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyRoleForAction } from '@/lib/supabase/queries'
import { revalidatePath } from 'next/cache'

// ─────────────────────────────────────────────────────────────
// 수주 1건의 누적 출하 현황 조회 (히스토리 + 잔량 계산)
// ─────────────────────────────────────────────────────────────
export async function getShipmentsWithSummary(orderId: string) {
    const supabase = await createClient()

    const [shipmentsRes, orderRes] = await Promise.all([
        supabase
            .from('shipping_orders')
            .select('id, shipping_date, shipped_quantity, delivery_address, shipping_method, shipping_memo, status, created_at')
            .eq('order_id', orderId)
            .order('shipping_date', { ascending: true }),

        supabase
            .from('orders')
            .select('id, total_quantity, status, po_number, receiving_destination, clients(company_name), order_items(quantity, products(name))')
            .eq('id', orderId)
            .single() as any
    ])

    if ((orderRes as any).error) {
        return { success: false, error: '수주 정보를 불러올 수 없습니다.' }
    }

    const order = (orderRes as any).data as any
    const shipments = shipmentsRes.data || []

    const totalOrderQty: number = order.total_quantity || order.order_items?.reduce((s: number, i: any) => s + (i.quantity || 0), 0) || 0
    const totalShipped: number = shipments.reduce((acc: number, s: any) => acc + (s.shipped_quantity || 0), 0)
    const remainingQty: number = totalOrderQty - totalShipped

    return {
        success: true,
        data: {
            order,
            shipments,
            totalOrderQty,
            totalShipped,
            remainingQty,
        }
    }
}

// ─────────────────────────────────────────────────────────────
// 신규 출하 등록
// ─────────────────────────────────────────────────────────────
export async function createShipment(payload: {
    orderId: string
    shippedQuantity: number
    shippingDate: string
    deliveryAddress?: string
    shippingMethod: string
    shippingMemo?: string
    forceComplete?: boolean
}) {
    // [보안] 서버 액션은 DB 직접 조회로 최신 권한 확인
    const { authorized, userId } = await verifyRoleForAction(['admin', 'head', 'support', 'sales'])
    if (!authorized) {
        return { success: false, error: '권한이 없습니다.' }
    }

    if (!payload.shippedQuantity || payload.shippedQuantity <= 0) {
        return { success: false, error: '출하 수량은 1 이상이어야 합니다.' }
    }

    const supabase = await createClient()

    // [정공법] orders.total_quantity 직접 참조 (단, 마이그레이션 적용 전까지는 any 캐스팅)
    const { data: order, error: orderErr } = await supabase
        .from('orders')
        .select('total_quantity, status')
        .eq('id', payload.orderId)
        .single() as any

    if (orderErr || !order) {
        return { success: false, error: '수주 정보를 찾을 수 없습니다.' }
    }

    // 누적 출하량 계산
    const { data: existShipments } = await supabase
        .from('shipping_orders')
        .select('shipped_quantity')
        .eq('order_id', payload.orderId)

    const totalAlreadyShipped = (existShipments || []).reduce(
        (acc: number, s: any) => acc + (s.shipped_quantity || 0), 0
    )
    const newTotal = totalAlreadyShipped + payload.shippedQuantity

    const { error: insertErr } = await supabase
        .from('shipping_orders')
        .insert({
            order_id: payload.orderId,
            shipped_quantity: payload.shippedQuantity,
            shipping_date: payload.shippingDate,
            delivery_address: payload.deliveryAddress || '',
            shipping_method: payload.shippingMethod,
            shipping_memo: payload.shippingMemo || '',
            handler_id: userId,
            status: 'shipped',
            // [방어] carrier_name/contact 등 존재하지 않는 컬럼 제거하여 500 에러 해결
            tracking_number: '',
        })

    if (insertErr) {
        console.error('[createShipment] DB Error:', insertErr)
        return {
            success: false,
            error: `출하 등록 실패: ${insertErr.message} (${insertErr.details || 'no details'})`
        }
    }

    // [강제 종료] 잔량이 남아도 forceComplete 옵션이 true 라면 상태를 'shipped' 로 강제로 오버라이드.
    // 일반 계정은 orders 테이블 업데이트 권한(RLS)이 제한될 수 있으므로 Admin 클라이언트 사용.
    if (payload.forceComplete) {
        const adminSupabase = createAdminClient()
        await adminSupabase
            .from('orders')
            .update({ status: 'shipped' })
            .eq('id', payload.orderId)
    }

    // DB 트리거가 orders.status를 자동으로 갱신함
    revalidatePath('/dashboard/sales/order')
    revalidatePath('/dashboard/support/shipping')

    return { success: true }
}

// ─────────────────────────────────────────────────────────────
// 출하 내역 삭제 (취소)
// DB 트리거가 자동으로 orders.status를 롤백함
// ─────────────────────────────────────────────────────────────
export async function deleteShipment(shipmentId: string) {
    const { authorized } = await verifyRoleForAction(['admin', 'head', 'support'])
    if (!authorized) {
        return { success: false, error: '출하 취소 권한이 없습니다. (지원팀/관리자만 가능)' }
    }

    const supabase = await createClient()

    const { error } = await supabase
        .from('shipping_orders')
        .delete()
        .eq('id', shipmentId)

    if (error) {
        return { success: false, error: '출하 취소에 실패했습니다.' }
    }

    revalidatePath('/dashboard/sales/order')
    revalidatePath('/dashboard/support/shipping')

    return { success: true }
}

// ─────────────────────────────────────────────────────────────
// orders.total_quantity 업데이트 (발주 확정 시 호출)
// 기존 confirmOrderToDelivery 액션에서 함께 호출해 주세요
// ─────────────────────────────────────────────────────────────
export async function updateOrderTotalQuantity(orderId: string, totalQuantity: number) {
    const supabase = await createClient()
    const { error } = await (supabase as any)
        .from('orders')
        .update({ total_quantity: totalQuantity })
        .eq('id', orderId)

    if (error) {
        console.error('[updateOrderTotalQuantity] Error:', error)
        return { success: false }
    }
    return { success: true }
}
