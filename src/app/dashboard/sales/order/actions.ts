'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { orderSchema, OrderFormValues } from '@/lib/validations/product-order'
import { z } from 'zod'

export async function addOrder(data: OrderFormValues) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: '인증되지 않은 사용자입니다.' }
    }

    // 1. Zod Validation
    const result = orderSchema.safeParse(data)
    if (!result.success) {
        return {
            success: false,
            error: '입력값이 올바르지 않습니다.',
            details: result.error.flatten().fieldErrors
        }
    }

    try {
        // 2. Calculate Total Amount
        const total_amount = result.data.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)

        // 3. Insert Master Record (Order)
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .insert({
                client_id: result.data.client_id,
                sales_person_id: user.id,
                due_date: result.data.due_date ? result.data.due_date.toISOString() : null,
                total_amount: total_amount,
                memo: result.data.memo,
                status: 'draft' // Initial state
            })
            .select('id')
            .single()

        if (orderError || !orderData) {
            console.error('Order Insert error:', orderError)
            return { success: false, error: '수주 마스터 생성에 실패했습니다.' }
        }

        // 4. Transform items to add order_id and subtotal
        const orderItemsToInsert = result.data.items.map(item => ({
            order_id: orderData.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            subtotal: item.quantity * item.unit_price
        }))

        // 5. Insert Detail Records (Order Items)
        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItemsToInsert)

        if (itemsError) {
            console.error('Order Items Insert error:', itemsError)
            // Rollback not naturally supported without rpc/functions, but usually deleting the master would cascade
            await supabase.from('orders').delete().eq('id', orderData.id)
            return { success: false, error: '수주 상세 항목 저장에 실패했습니다.' }
        }

        revalidatePath('/dashboard/sales/order')
        return { success: true }

    } catch (error) {
        console.error('Server action error:', error)
        return {
            success: false,
            error: '서버 오류가 발생했습니다.'
        }
    }
}
