'use server'

import { createClient } from '@/lib/supabase/server'
import { startOfMonth, subMonths, format, endOfMonth } from 'date-fns'

export async function getDashboardData(startDateStr: string, endDateStr: string) {
    const supabase = await createClient()

    // Base query for confirmed orders
    const getConfirmedOrdersBase = () => supabase
        .from('orders')
        .select('id, total_amount, order_date, sales_person_id, status')
        .in('status', ['confirmed', 'production', 'shipped'])
        .gte('order_date', startDateStr)
        .lte('order_date', endDateStr)

    // 1. Total Revenue & Order Count
    const { data: ordersData, error: ordersError } = await getConfirmedOrdersBase()

    let totalRevenue = 0
    let topSalesId = null
    let salesMap: Record<string, number> = {}

    if (ordersData) {
        ordersData.forEach(order => {
            totalRevenue += order.total_amount
            if (order.sales_person_id) {
                salesMap[order.sales_person_id] = (salesMap[order.sales_person_id] || 0) + order.total_amount
            }
        })

        if (Object.keys(salesMap).length > 0) {
            topSalesId = Object.keys(salesMap).reduce((a, b) => salesMap[a] > salesMap[b] ? a : b)
        }
    }

    // 2. Top Salesperson Name
    let topSalesName = '데이터 없음'
    if (topSalesId) {
        const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', topSalesId).single()
        if (profile) topSalesName = profile.full_name || '이름 없음'
    }

    // 3. Processing Samples
    const { count: processingSamples } = await supabase
        .from('sample_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'processing')
        .gte('request_date', startDateStr)
        .lte('request_date', endDateStr)

    // 4. Category Sales Share (Pie Chart)
    // We need to join order_items, products and orders.
    // Since Supabase JS might be tricky for deeply nested joins with filtering on parent, we can fetch all relevant order_items
    const confirmedOrderIds = ordersData?.map(o => o.id) || []

    let categoryData: { name: string, value: number }[] = []

    if (confirmedOrderIds.length > 0) {
        const { data: orderItems } = await supabase
            .from('order_items')
            .select(`
                subtotal,
                products ( category )
            `)
            .in('order_id', confirmedOrderIds)

        const catMap: Record<string, number> = {}
        orderItems?.forEach(item => {
            // @ts-ignore - Supabase type inference for joined tables can be tricky
            const cat = item.products?.category || 'unknown'
            catMap[cat] = (catMap[cat] || 0) + item.subtotal
        })

        categoryData = Object.entries(catMap).map(([name, value]) => ({ name, value }))
    }

    // 5. Monthly Revenue Trend (Line Chart) - Last 6 months from endDate
    const endDateObj = new Date(endDateStr)
    const sixMonthsAgo = startOfMonth(subMonths(endDateObj, 5))
    const sixMonthsAgoStr = format(sixMonthsAgo, 'yyyy-MM-dd')

    const { data: monthlyOrders } = await supabase
        .from('orders')
        .select('total_amount, order_date')
        .in('status', ['confirmed', 'production', 'shipped'])
        .gte('order_date', sixMonthsAgoStr)
        .lte('order_date', format(endOfMonth(endDateObj), 'yyyy-MM-dd'))

    const monthMap: Record<string, number> = {}

    // Initialize last 6 months with 0
    for (let i = 5; i >= 0; i--) {
        const m = subMonths(endDateObj, i)
        monthMap[format(m, 'yy년 MM월')] = 0
    }

    monthlyOrders?.forEach(order => {
        const monthKey = format(new Date(order.order_date), 'yy년 MM월')
        if (monthMap[monthKey] !== undefined) {
            monthMap[monthKey] += order.total_amount
        }
    })

    const monthlyData = Object.entries(monthMap).map(([month, revenue]) => ({ month, revenue }))

    return {
        kpis: {
            totalRevenue,
            orderCount: ordersData?.length || 0,
            processingSamples: processingSamples || 0,
            topSalesperson: topSalesName
        },
        charts: {
            categoryData,
            monthlyData
        }
    }
}
