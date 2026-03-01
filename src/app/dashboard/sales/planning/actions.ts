'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getSalesPlanning(targetMonth: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    // 1. Parse targetMonth (yyyy-MM) to Year and Month
    const [year, month] = targetMonth.split('-').map(Number)

    // 2. Get user's target amount from NEW TABLE: monthly_sales_goals
    const { data: goalData } = await (supabase
        .from('monthly_sales_goals' as any)
        .select('target_amount')
        .eq('sales_person_id', user.id)
        .eq('target_year', year)
        .eq('target_month', month)
        .single() as any)

    const target = goalData?.target_amount || 0

    // 3. Calculate actual revenue (KST Standard)
    // KST 00:00:00 is UTC -9 hours
    const startOfMonthKST = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0))
    startOfMonthKST.setHours(startOfMonthKST.getHours() - 9) // Adjust to UTC
    const startDate = startOfMonthKST.toISOString()

    const endOfMonthKST = new Date(Date.UTC(year, month, 0, 23, 59, 59))
    endOfMonthKST.setHours(endOfMonthKST.getHours() - 9) // Adjust to UTC
    const endDate = endOfMonthKST.toISOString()

    const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('sales_person_id', user.id)
        .in('status', ['confirmed', 'production', 'shipped'])
        .not('status', 'eq', 'canceled') // Double-guard against canceled
        .gte('order_date', startDate)
        .lte('order_date', endDate)

    if (ordersError) {
        console.error('Error fetching orders for planning:', ordersError)
        throw new Error('Failed to fetch actual sales.')
    }

    const actual = ordersData.reduce((sum, order) => sum + (order.total_amount || 0), 0)

    // Calculate percentage (Protect against Divide by Zero)
    const percentage = target > 0 ? Math.round((actual / target) * 100) : 0

    // 4. Get Pipeline statistics
    const statsResult = await supabase
        .from('activities' as any)
        .select('pipeline_status')
        .eq('created_by', user.id) as any

    const activityStats = statsResult.data
    const pipelineStats: Record<string, number> = {
        lead: 0,
        quote: 0,
        negotiation: 0,
        deal_closed: 0,
        dropped: 0,
        sample_sent: 0
    }

    if (activityStats) {
        activityStats.forEach((a: any) => {
            const status = a.pipeline_status || 'lead'
            pipelineStats[status] = (pipelineStats[status] || 0) + 1
        })
    }

    // 5. Get Demand Prediction highlights
    const { data: predictions } = await supabase
        .from('v_sales_analysis' as any)
        .select('*')
        .limit(5)

    return {
        target,
        actual,
        percentage,
        pipelineStats,
        predictions: predictions || []
    }
}

export async function getYearlyGoals(year: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    const { data: goals, error } = await (supabase
        .from('monthly_sales_goals' as any)
        .select('target_month, target_amount')
        .eq('sales_person_id', user.id)
        .eq('target_year', year)
        .order('target_month', { ascending: true }) as any)

    if (error) {
        console.error('Failed to fetch yearly goals:', error)
        return []
    }

    // Map DB columns to frontend expected format { month, target_amount }
    return (goals || []).map((g: any) => ({
        month: g.target_month,
        target_amount: g.target_amount
    }))
}

export async function upsertMonthlyGoals(year: number, goals: { month: number, target_amount: any }[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: '인증되지 않은 사용자입니다.' }
    }

    try {
        const dataToUpsert = goals.map(g => ({
            sales_person_id: user.id,
            target_year: year,
            target_month: g.month,
            // 무적의 숫자 파싱: 문자열로 변환 후 콤마 제거하고 숫자로 변환
            target_amount: Number(String(g.target_amount || '0').replace(/,/g, '')),
            updated_at: new Date().toISOString()
        }))

        const { error } = await (supabase
            .from('monthly_sales_goals' as any)
            .upsert(dataToUpsert as any, {
                onConflict: 'sales_person_id,target_year,target_month'
            }) as any)

        if (error) {
            console.error('[DB Error] Failed to upsert monthly goals:', error)
            return {
                success: false,
                error: `DB 저장 실패: ${error.message} (${error.code || 'UNKNOWN_CODE'})`
            }
        }

        revalidatePath('/dashboard/sales/planning')
        return { success: true }
    } catch (err: any) {
        console.error('[Server Error] Exception in upsertMonthlyGoals:', err)
        return {
            success: false,
            error: `서버 내부 오류: ${err.message || '알 수 없는 오류'}`
        }
    }
}

export async function upsertTargetAmount(targetMonth: string, amount: number) {
    // This is legacy but let's update it to bridge to the new table for compatibility
    const [year, month] = targetMonth.split('-').map(Number)
    return await upsertMonthlyGoals(year, [{ month, target_amount: amount }])
}
