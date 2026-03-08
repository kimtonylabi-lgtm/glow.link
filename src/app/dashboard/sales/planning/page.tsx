/* eslint-disable @typescript-eslint/no-explicit-any */
import { PlanningClient } from './planning-client'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function SalesPlanningPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // 90일 전 / 1년 전 기준일
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

    const [activitiesRes, opportunitiesRes, churnRiskClientsRes, vipClientsRes] = await Promise.all([
        // 1. 기존 activities (SalesKanban에서 사용)
        supabase
            .from('activities')
            .select(`
                *,
                clients (id, company_name),
                products (id, name),
                client_products (id, name),
                profiles (id, full_name, role)
            `)
            .order('activity_date', { ascending: false }),

        // 2. opportunities (신규 칸반 데이터)
        (supabase.from('opportunities' as any) as any)
            .select(`
                id, title, stage, expected_amount, probability, expected_close_date, memo, created_at,
                clients ( id, company_name ),
                profiles ( id, full_name )
            `)
            .order('created_at', { ascending: false }),

        // 3. 이탈 위험 거래처: 최근 90일 수주 없는 담당 거래처
        supabase
            .from('clients')
            .select(`
                id, company_name, tier, contact_person, phone,
                orders ( id, order_date )
            `)
            .eq('status', 'active')
            .order('company_name'),

        // 4. VIP ABC 분석: 최근 1년 누적 매출 기준
        supabase
            .from('clients')
            .select(`
                id, company_name, tier,
                orders ( id, total_amount, order_date )
            `)
            .eq('status', 'active')
            .order('company_name'),
    ])

    // 이탈 위험: 최근 90일 수주가 없는 거래처
    const churnRiskClients = (churnRiskClientsRes.data || []).filter((c: any) => {
        const recentOrders = (c.orders || []).filter(
            (o: any) => new Date(o.order_date) >= ninetyDaysAgo
        )
        return recentOrders.length === 0
    })

    // VIP 분석: 최근 1년 누적 매출 계산 후 정렬
    const vipClients = (vipClientsRes.data || [])
        .map((c: any) => {
            const annualRevenue = (c.orders || [])
                .filter((o: any) => new Date(o.order_date) >= oneYearAgo)
                .reduce((sum: number, o: any) => sum + (Number(o.total_amount) || 0), 0)
            return { ...c, annual_revenue: annualRevenue }
        })
        .filter((c: any) => c.annual_revenue > 0)
        .sort((a: any, b: any) => b.annual_revenue - a.annual_revenue)
        .slice(0, 20) // 상위 20개사

    return (
        <div className="animate-in fade-in duration-500">
            <PlanningClient
                activities={(activitiesRes.data as any) || []}
                opportunities={(opportunitiesRes.data as any) || []}
                churnRiskClients={churnRiskClients as any[]}
                vipClients={vipClients as any[]}
            />
        </div>
    )
}
