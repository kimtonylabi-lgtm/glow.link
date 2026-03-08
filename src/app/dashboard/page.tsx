/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/queries'
import { HomeActionBoard } from './home-action-board'

export default async function DashboardHome() {
    const user = await getCurrentUser()
    const supabase = await createClient()
    const name = user?.user_metadata?.full_name || '사용자'

    // ─────────────────────────────────────────────────────────────
    // 3종 실무 데이터 병렬 로드 (RLS 자동 적용 — 추가 필터 불필요)
    // ─────────────────────────────────────────────────────────────
    const today = new Date()
    const sevenDaysLater = new Date(today)
    sevenDaysLater.setDate(today.getDate() + 7)

    const todayStr = today.toISOString()
    const sevenDaysLaterStr = sevenDaysLater.toISOString()

    const [urgentOrdersRes, pendingShippingRes, draftQuotationsRes] = await Promise.all([
        // ① D-7 납기임박 수주 리스트
        supabase
            .from('orders')
            .select(`
                id, po_number, due_date, status,
                clients ( company_name ),
                order_items ( quantity, products ( name ) )
            `)
            .in('status', ['confirmed', 'production'] as any[])
            .gte('due_date', todayStr)
            .lte('due_date', sevenDaysLaterStr)
            .order('due_date', { ascending: true })
            .limit(10),

        // ② 출하 대기: production/confirmed 상태이면서 출하 이력이 없거나 미출하인 건
        supabase
            .from('orders')
            .select(`
                id, po_number, due_date, status, total_quantity,
                clients ( company_name ),
                order_items ( quantity, products ( name ) ),
                shipping_orders ( shipped_quantity, status )
            `)
            .in('status', ['confirmed', 'production', 'partially_shipped'] as any[])
            .order('due_date', { ascending: true })
            .limit(15),

        // ③ 미승인 견적 건수
        (supabase.from('quotations' as any) as any)
            .select('id', { count: 'exact', head: true })
            .eq('status', 'draft')
            .eq('is_current', true),
    ])

    const urgentOrders = urgentOrdersRes.data || []

    // 출하 대기: is_fully_shipped 아닌 것만
    const pendingShipping = (pendingShippingRes.data || []).filter((o: any) => {
        const totalOrdered = o.total_quantity || o.order_items?.reduce((s: number, i: any) => s + (i.quantity || 0), 0) || 0
        const totalShipped = o.shipping_orders?.reduce((s: number, sh: any) => s + (sh.shipped_quantity || 0), 0) || 0
        return o.status !== 'shipped' && totalShipped < totalOrdered
    })

    const draftQuotationCount = draftQuotationsRes.count || 0

    return (
        <HomeActionBoard
            name={name}
            urgentOrders={urgentOrders as any[]}
            pendingShipping={pendingShipping as any[]}
            draftQuotationCount={draftQuotationCount}
        />
    )
}
