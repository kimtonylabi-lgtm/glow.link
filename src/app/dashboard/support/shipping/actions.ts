'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getPendingShippingOrders() {
    const supabase = await createClient()

    // Get orders that are confirmed or production
    const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
            id,
            po_number,
            receiving_destination,
            total_amount,
            status,
            order_date,
            due_date,
            total_quantity,
            clients ( company_name ),
            order_items ( quantity, products ( name ), client_product_name ),
            shipping_orders ( id, shipped_quantity, status, tracking_number, shipping_date )
        `)
        .in('status', ['confirmed', 'production', 'shipped', 'partially_shipped'] as any[])
        .order('order_date', { ascending: false })

    if (ordersError) {
        console.error('Failed to get pending shipping orders:', ordersError)
        return []
    }

    // Process data to merge items quantity and shipping totals
    return ordersData.map((order: any) => {
        const totalOrderedQuantity = order.order_items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0)
        const totalShippedQuantity = order.shipping_orders.reduce((sum: number, ship: any) => sum + (ship.shipped_quantity || 0), 0)

        // Is it fully shipped?
        const isFullyShipped = totalShippedQuantity >= totalOrderedQuantity && totalOrderedQuantity > 0

        return {
            ...order,
            client_name: order.clients?.company_name || '알 수 없음',
            product_name: order.order_items?.[0]?.products?.name || '제품 없음',
            total_ordered_quantity: order.total_quantity || totalOrderedQuantity,
            total_shipped_quantity: totalShippedQuantity,
            is_fully_shipped: isFullyShipped,
            shipping_log: order.shipping_orders || []
        }
    })
}

export async function processShipping(orderId: string, quantity: number, trackingNumber: string, shippingMemo: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Unauthorized' }
    }

    // Insert new shipping record
    const { error: insertError } = await supabase
        .from('shipping_orders')
        .insert({
            order_id: orderId,
            shipped_quantity: quantity,
            tracking_number: trackingNumber,
            shipping_memo: shippingMemo,
            handler_id: user.id,
            status: 'shipped',
            shipping_date: new Date().toISOString()
        })

    if (insertError) {
        console.error('Failed to insert shipping order:', insertError)
        return { success: false, error: '출하 등록 실패' }
    }

    // Check total shipped vs ordered to update main order status if fully shipped
    const { data: orderData } = await supabase
        .from('orders')
        .select(`id, order_items(quantity), shipping_orders(shipped_quantity)`)
        .eq('id', orderId)
        .single()

    if (orderData) {
        const totalOrdered = orderData.order_items.reduce((s: number, i: any) => s + (i.quantity || 0), 0)
        const totalShipped = orderData.shipping_orders.reduce((s: number, i: any) => s + (i.shipped_quantity || 0), 0)

        // If fully shipped, update order status to 'shipped'
        if (totalShipped >= totalOrdered && orderData) {
            await supabase
                .from('orders')
                .update({ status: 'shipped' })
                .eq('id', orderId)
        }
    }

    revalidatePath('/dashboard/support/shipping')
    return { success: true }
}
