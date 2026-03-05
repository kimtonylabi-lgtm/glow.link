'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveOrderDetails(
    orderId: string,
    poNumber: string,
    orderDate?: string | null,
    expectedShipDate?: string | null,
    orderItemId?: string,
    bomItems?: any[]
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
            console.error('saveOrderDetails orders err:', error)
            return { success: false, error: '발주 정보 업데이트에 실패했습니다.' }
        }

        // BOM Update (Order Items)
        if (orderItemId && bomItems) {
            const { error: itemsError } = await (supabase.from('order_items') as any)
                .update({ post_processing: bomItems })
                .eq('id', orderItemId)

            if (itemsError) {
                console.error('saveOrderDetails items err:', itemsError)
                return { success: false, error: 'BOM 정보 업데이트에 실패했습니다.' }
            }
        }

        revalidatePath('/dashboard/sales/order')
        return { success: true }
    } catch (error) {
        console.error('saveOrderDetails exception:', error)
        return { success: false, error: '서버 오류가 발생했습니다.' }
    }
}

export async function confirmOrderToDelivery(
    orderId: string,
    poNumber: string,
    orderDate?: string | null,
    expectedShipDate?: string | null,
    orderItemId?: string,
    bomItems?: any[]
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: '인증되지 않은 사용자입니다.' }

    if (!poNumber?.trim() || !orderDate) {
        return { success: false, error: '발주 No. 와 발주일은 납기 이관 필수 항목입니다.' }
    }

    try {
        const { count } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('po_number', poNumber)
            .neq('id', orderId)

        if (count && count > 0) {
            return { success: false, error: '이미 등록된 발주 번호입니다.' }
        }

        const { data: currentOrder } = await (supabase.from('orders') as any)
            .select('status_history')
            .eq('id', orderId)
            .single()

        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single()

        const userName = profile?.full_name || user.email || 'System'

        const history = Array.isArray(currentOrder?.status_history) ? currentOrder.status_history : []
        const newLog = {
            date: new Date().toISOString(),
            status: 'production',
            worker: userName,
            reason: '발주 확정 및 납기 이관'
        }

        const updatePayload: any = {
            po_number: poNumber,
            order_date: orderDate,
            due_date: expectedShipDate ? expectedShipDate : null,
            status: 'production',
            status_history: [...history, newLog]
        }

        const { error } = await supabase
            .from('orders')
            .update(updatePayload)
            .eq('id', orderId)

        if (error) {
            console.error('confirmOrderToDelivery orders err:', error)
            return { success: false, error: '납기 이관 실패: ' + error.message }
        }

        // BOM Update Transaction
        if (orderItemId && bomItems) {
            const { error: itemsError } = await (supabase.from('order_items') as any)
                .update({ post_processing: bomItems })
                .eq('id', orderItemId)

            if (itemsError) {
                console.error('confirmOrderToDelivery items err:', itemsError)
                return { success: false, error: 'BOM 정보 이관 저장 실패: ' + itemsError.message }
            }
        }

        revalidatePath('/dashboard/sales/order')
        return { success: true }
    } catch (error) {
        console.error('confirmOrderToDelivery exception:', error)
        return { success: false, error: '서버 오류가 발생했습니다.' }
    }
}

export async function cancelOrderConfirmation(orderId: string, reason: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: '인증되지 않은 사용자입니다.' }
    if (!reason?.trim()) return { success: false, error: '취소 사유를 입력해주세요.' }

    try {
        const { data: currentOrder } = await (supabase.from('orders') as any)
            .select('status_history, status')
            .eq('id', orderId)
            .single()

        if ((currentOrder as any)?.status !== 'production') {
            return { success: false, error: '납기 대기(생산 진행) 중인 건만 취소할 수 있습니다.' }
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single()

        const userName = profile?.full_name || user.email || 'System'

        const history = Array.isArray(currentOrder?.status_history) ? currentOrder.status_history : []
        const newLog = {
            date: new Date().toISOString(),
            status: 'draft',
            worker: userName,
            reason: `[확정 취소] ${reason.trim()}`
        }

        const { error } = await supabase
            .from('orders')
            .update({
                status: 'draft',
                status_history: [...history, newLog]
            })
            .eq('id', orderId)

        if (error) {
            console.error('cancelOrderConfirmation error:', error)
            return { success: false, error: '이관 취소에 실패했습니다.' }
        }

        revalidatePath('/dashboard/sales/order')
        return { success: true }
    } catch (error) {
        console.error('cancelOrderConfirmation exception:', error)
        return { success: false, error: '서버 오류가 발생했습니다.' }
    }
}

export async function fetchOrderDetail(orderId: string) {
    const supabase = await createClient()

    try {
        const { data, error } = await (supabase.from('orders') as any)
            .select(`
                *,
                clients (company_name),
                profiles (full_name),
                order_items (
                    id,
                    quantity,
                    post_processing,
                    unit_price,
                    subtotal,
                    products (name)
                )
            `)
            .eq('id', orderId)
            .single()

        if (error) {
            console.error('fetchOrderDetail db error:', error)
            return { success: false, data: null }
        }

        return { success: true, data }
    } catch (e) {
        console.error('fetchOrderDetail exception:', e)
        return { success: false, data: null }
    }
}
