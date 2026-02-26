'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getClosingData(monthStr: string) {
    const supabase = await createClient()

    // check if it's already closed
    const { data: closingInfo } = await supabase
        .from('monthly_closings')
        .select('*')
        .eq('closing_month', monthStr)
        .single()

    // parse dates for filtering
    const [year, month] = monthStr.split('-').map(Number)
    const startDate = `${year}-${String(month).padStart(2, '0')}-01T00:00:00Z`
    const endDateObj = new Date(year, month, 0)
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(endDateObj.getDate()).padStart(2, '0')}T23:59:59Z`

    // Aggregate shipped orders IN THIS MONTH as revenue
    const { data: shippedOrders, error: shipError } = await supabase
        .from('shipping_orders')
        .select(`
            shipped_quantity,
            shipping_date,
            order_id,
            orders ( total_amount, order_items(quantity, unit_price) )
        `)
        .eq('status', 'shipped')
        .gte('shipping_date', startDate)
        .lte('shipping_date', endDate)

    if (shipError) {
        console.error('Failed to get closing data:', shipError)
        return { isClosed: false, totalRevenue: 0, closingInfo: null, error: 'Failed to fetch data' }
    }

    // Since a shipping order doesn't store price, approximate the revenue based on proportion
    let totalRevenue = 0
    shippedOrders?.forEach((ship: any) => {
        const orderData = ship.orders
        if (orderData) {
            const sumQty = orderData.order_items.reduce((s: number, i: any) => s + (i.quantity || 0), 0)
            if (sumQty > 0) {
                // revenue portion of this shipment
                const fraction = ship.shipped_quantity / sumQty
                totalRevenue += (orderData.total_amount || 0) * fraction
            }
        }
    })

    return {
        isClosed: closingInfo?.status === 'closed',
        totalRevenue: closingInfo ? closingInfo.total_revenue : Math.round(totalRevenue),
        closingInfo,
        shippedCount: shippedOrders?.length || 0
    }
}

export async function executeMonthClose(monthStr: string, totalRevenue: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Unauthorized' }
    }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || !['admin', 'head'].includes(profile.role)) {
        return { success: false, error: '관리자 또는 부서장만 마감할 수 있습니다.' }
    }

    const { error } = await supabase
        .from('monthly_closings')
        .upsert({
            closing_month: monthStr,
            total_revenue: totalRevenue,
            status: 'closed',
            closed_by: user.id,
            closed_at: new Date().toISOString()
        }, {
            onConflict: 'closing_month'
        })

    if (error) {
        console.error('Closing failed:', error)
        return { success: false, error: '마감 처리 중 오류가 발생했습니다.' }
    }

    revalidatePath('/dashboard/support/closing')
    return { success: true }
}

export async function reopenMonth(monthStr: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Unauthorized' }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || profile.role !== 'admin') {
        return { success: false, error: '마감 취소는 시스템 관리자(Admin)만 가능합니다.' }
    }

    const { error } = await supabase
        .from('monthly_closings')
        .update({ status: 'open' })
        .eq('closing_month', monthStr)

    if (error) {
        return { success: false, error: '마감 취소 실패' }
    }

    revalidatePath('/dashboard/support/closing')
    return { success: true }
}
