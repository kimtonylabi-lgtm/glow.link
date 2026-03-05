'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveOrderDetails(
    orderId: string,
    poNumber: string,
    orderDate?: string | null,
    expectedShipDate?: string | null
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: '인증되지 않은 사용자입니다.' }
    }

    try {
        // [PO 중복 방어] Application level check
        const { count } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('po_number', poNumber)
            .neq('id', orderId)

        if (count && count > 0) {
            return { success: false, error: '이미 등록된 발주 번호입니다.' }
        }

        const updatePayload: any = { po_number: poNumber }

        // 빈 문자열 방어: "" 이면 null로 매핑, 아니면 날짜 문자열(yyyy-MM-dd) 그대로 매핑
        if (orderDate !== undefined) {
            updatePayload.order_date = orderDate ? orderDate : null
        }
        if (expectedShipDate !== undefined) {
            updatePayload.due_date = expectedShipDate ? expectedShipDate : null
        }

        const { error } = await supabase
            .from('orders')
            .update(updatePayload)
            .eq('id', orderId)

        if (error) {
            if (error.code === '23505') { // Unique violation code in Postgres
                return { success: false, error: '이미 등록된 발주 번호입니다.' }
            }
            console.error('saveOrderDetails error:', error)
            return { success: false, error: '발주 정보 업데이트에 실패했습니다.' }
        }

        revalidatePath('/dashboard/sales/order')
        return { success: true }
    } catch (error) {
        console.error('saveOrderDetails exception:', error)
        return { success: false, error: '서버 오류가 발생했습니다.' }
    }
}
