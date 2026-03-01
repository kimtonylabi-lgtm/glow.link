'use server'

import { createClient } from '@/lib/supabase/server'
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO, format } from 'date-fns'
import { ko } from 'date-fns/locale'

export type ReportPeriod = 'daily' | 'weekly' | 'monthly'

export interface ReportData {
    summary: {
        totalRevenue: number
        activityCount: number
        sampleCount: number
        revenueChange?: number // comparison with previous period
    }
    salesPerformance: {
        name: string
        revenue: number
        activities: number
    }[]
    revenueByDate: {
        date: string
        amount: number
    }[]
    activityTimeline: {
        id: string
        type: string
        title: string
        clientName: string
        userName: string
        date: string
        content?: string
    }[]
}

/**
 * Gets the report data for a specific period or date range
 */
export async function getReportData(
    type: ReportPeriod,
    date: string // ISO string of the reference date
) {
    const supabase = await createClient()
    const refDate = parseISO(date)

    // Calculate KST range
    let start: Date
    let end: Date

    if (type === 'daily') {
        start = startOfDay(refDate)
        end = endOfDay(refDate)
    } else if (type === 'weekly') {
        start = startOfWeek(refDate, { weekStartsOn: 1 }) // Monday
        end = endOfWeek(refDate, { weekStartsOn: 1 })
    } else {
        start = startOfMonth(refDate)
        end = endOfMonth(refDate)
    }

    const startStr = start.toISOString()
    const endStr = end.toISOString()

    // Fetch data in parallel
    const [activitiesRes, ordersRes, samplesRes, profilesRes] = await Promise.all([
        supabase
            .from('activities')
            .select('*, clients(company_name), profiles(full_name)')
            .gte('activity_date', startStr)
            .lte('activity_date', endStr)
            .order('activity_date', { ascending: false }),
        supabase
            .from('orders')
            .select('*, clients(company_name), profiles(full_name)')
            .gte('order_date', startStr)
            .lte('order_date', endStr)
            .in('status', ['confirmed', 'shipped']),
        supabase
            .from('sample_requests')
            .select('*')
            .gte('request_date', startStr)
            .lte('request_date', endStr),
        supabase
            .from('profiles')
            .select('id, full_name')
            .in('role', ['sales', 'admin', 'head'])
    ])

    if (activitiesRes.error) throw activitiesRes.error
    if (ordersRes.error) throw ordersRes.error
    if (samplesRes.error) throw samplesRes.error

    const activities = activitiesRes.data || []
    const orders = ordersRes.data || []
    const samples = samplesRes.data || []
    const profiles = profilesRes.data || []

    // 1. Calculate Summary
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
    const activityCount = activities.length
    const sampleCount = samples.length

    // 2. Sales Performance Aggregation
    const performanceMap = new Map<string, { name: string; revenue: number; activities: number }>()

    // Initialize with all sales profiles to show 0s
    profiles.forEach(p => {
        performanceMap.set(p.id, { name: p.full_name || '알 수 없음', revenue: 0, activities: 0 })
    })

    orders.forEach(o => {
        const perf = performanceMap.get(o.sales_person_id)
        if (perf) perf.revenue += o.total_amount || 0
    })

    activities.forEach(a => {
        const perf = performanceMap.get(a.user_id)
        if (perf) perf.activities += 1
    })

    // 3. Revenue by Date (for chart)
    const revenueMap = new Map<string, number>()
    orders.forEach(o => {
        const day = format(new Date(o.order_date), 'yyyy-MM-dd')
        revenueMap.set(day, (revenueMap.get(day) || 0) + (o.total_amount || 0))
    })

    const revenueByDate = Array.from(revenueMap.entries())
        .map(([date, amount]) => ({ date, amount }))
        .sort((a, b) => a.date.localeCompare(b.date))

    return {
        summary: {
            totalRevenue,
            activityCount,
            sampleCount
        },
        salesPerformance: Array.from(performanceMap.values()).filter(p => p.revenue > 0 || p.activities > 0),
        revenueByDate,
        activityTimeline: activities.map(a => ({
            id: a.id,
            type: a.type,
            title: a.title,
            clientName: (a.clients as any)?.company_name || '알 수 없음',
            userName: (a.profiles as any)?.full_name || '알 수 없음',
            date: a.activity_date,
            content: a.content || undefined
        }))
    }
}

/**
 * Gets the client-specific history
 */
export async function getClientHistory(clientId: string) {
    const supabase = await createClient()

    const [activitiesRes, ordersRes, samplesRes] = await Promise.all([
        supabase
            .from('activities')
            .select('*, profiles(full_name)')
            .eq('client_id', clientId)
            .order('activity_date', { ascending: false }),
        supabase
            .from('orders')
            .select('*, profiles(full_name)')
            .eq('client_id', clientId)
            .order('order_date', { ascending: false }),
        supabase
            .from('sample_requests')
            .select('*')
            .eq('client_id', clientId)
            .order('request_date', { ascending: false })
    ])

    return {
        activities: activitiesRes.data || [],
        orders: ordersRes.data || [],
        samples: samplesRes.data || []
    }
}
