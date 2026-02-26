'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getSalesPlanning(targetMonth: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    // 1. Get user's target amount for the month
    const { data: planData } = await supabase
        .from('sales_plans')
        .select('target_amount')
        .eq('sales_person_id', user.id)
        .eq('target_month', targetMonth)
        .single()

    const target = planData?.target_amount || 0

    // 2. Calculate actual revenue (Confirmed, Production, Shipped statuses)
    // We filter orders created in this month
    const startDate = `${targetMonth}-01T00:00:00Z`

    // Calculate the end date of the month
    const [year, month] = targetMonth.split('-').map(Number)
    const endDateObj = new Date(year, month, 0) // Last day of the month
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(endDateObj.getDate()).padStart(2, '0')}T23:59:59Z`

    const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('sales_person_id', user.id)
        .in('status', ['confirmed', 'production', 'shipped'])
        .gte('order_date', startDate)
        .lte('order_date', endDate)

    if (ordersError) {
        console.error('Error fetching orders for planning:', ordersError)
        throw new Error('Failed to fetch actual sales.')
    }

    const actual = ordersData.reduce((sum, order) => sum + (order.total_amount || 0), 0)

    // Calculate percentage
    const percentage = target > 0 ? Math.min(Math.round((actual / target) * 100), 1000) : 0 // Cap visual at 1000% purely for safety

    return {
        target,
        actual,
        percentage
    }
}

export async function upsertTargetAmount(targetMonth: string, amount: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Unauthorized' }
    }

    const { error } = await supabase
        .from('sales_plans')
        .upsert({
            sales_person_id: user.id,
            target_month: targetMonth,
            target_amount: amount
        }, {
            onConflict: 'sales_person_id,target_month'
        })

    if (error) {
        console.error('Failed to upsert sales plan:', error)
        return { success: false, error: '목표 금액을 저장하는데 실패했습니다.' }
    }

    revalidatePath('/dashboard/sales/planning')
    return { success: true }
}
