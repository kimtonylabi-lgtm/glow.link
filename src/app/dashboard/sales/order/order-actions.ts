'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveOrderDetails(orderId: string, poNumber: string) {
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

        const { error } = await supabase
            .from('orders')
            .update({ po_number: poNumber } as any)
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
