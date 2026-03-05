/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server'
import { QuotationList } from './quotation-list'
import { OrderList } from './order-list'
import { Truck } from 'lucide-react'
import { OrderPageClient } from './order-page-client'

export const dynamic = 'force-dynamic'

export default async function OrderPage(props: { searchParams: Promise<{ tab?: string; q?: string }> }) {
    const searchParams = await props.searchParams
    const activeTab = searchParams?.tab || 'quotation'
    const searchQuery = searchParams?.q || ''
    const supabase = await createClient()

    // 1. 독립적인 로드 쿼리들 병렬 실행 예약
    const clientsPromise = supabase.from('clients').select('id, company_name').eq('status', 'active')
    const authPromise = supabase.auth.getUser()

    // 2. 검색 연관성 매칭 쿼리 병렬 최적화
    let matchingClientIds: string[] = []
    let matchingQuoteIdsFromProducts: string[] = []
    let matchingOrderIdsFromProducts: string[] = []

    if (searchQuery) {
        // Find matching clients and products in parallel, applying strict limit to prevent DB overload
        const [matchedClientsRes, matchedProductsRes] = await Promise.all([
            supabase.from('clients').select('id').ilike('company_name', `%${searchQuery}%`).limit(50),
            supabase.from('products').select('id').ilike('name', `%${searchQuery}%`).limit(50)
        ])

        if (matchedClientsRes.data) matchingClientIds = matchedClientsRes.data.map((c: any) => c.id)

        if (matchedProductsRes.data && matchedProductsRes.data.length > 0) {
            const productIds = matchedProductsRes.data.map((p: any) => p.id)

            // Quotation Items and Order Items parallel lookup
            const [quoteItemsRes, orderItemsRes] = await Promise.all([
                (supabase.from('quotation_items' as any) as any).select('quotation_id').in('product_id', productIds),
                (supabase.from('order_items' as any) as any).select('order_id').in('product_id', productIds)
            ])
            if (quoteItemsRes.data) matchingQuoteIdsFromProducts = quoteItemsRes.data.map((item: any) => item.quotation_id)
            if (orderItemsRes.data) matchingOrderIdsFromProducts = orderItemsRes.data.map((item: any) => item.order_id)
        }
    }

    // 3. Build Query for Quotations
    let quoteQuery = (supabase.from('quotations' as any) as any).select(`
        id, version_no, status, total_amount, is_current, created_at, client_id,
        clients (company_name),
        quotation_items (
            quantity,
            products (name)
        )
    `).eq('is_current', true).order('created_at', { ascending: false })

    if (searchQuery) {
        // Construct OR filter
        const clientMatch = matchingClientIds.length > 0 ? `client_id.in.(${matchingClientIds.join(',')})` : ''
        const productMatch = matchingQuoteIdsFromProducts.length > 0 ? `id.in.(${matchingQuoteIdsFromProducts.join(',')})` : ''

        const orConditions = [clientMatch, productMatch].filter(Boolean).join(',')

        if (orConditions) {
            quoteQuery = quoteQuery.or(orConditions).limit(30) // 서버단 Limit 렌더링 방어
        } else {
            // A trick to filter by an impossible ID when no matches
            quoteQuery = quoteQuery.eq('id', '00000000-0000-0000-0000-000000000000').limit(0)
        }
    } else {
        // No search query: Limit to 5 non-finalized
        quoteQuery = quoteQuery.neq('status', 'finalized').limit(5)
    }

    // 4. Build Query for Orders (Separated by Pipeline Status)
    const buildOrderQuery = (statuses: string[]) => {
        let q = (supabase.from('orders') as any).select(`
            id, client_id, sales_person_id, order_date, due_date, total_amount, status, po_number, created_at, memo, receiving_destination,
            clients (company_name),
            profiles (full_name),
            order_items (
                id,
                quantity,
                client_product_name,
                products ( name )
            )
        `).in('status', statuses).order('created_at', { ascending: false })

        if (searchQuery) {
            const orderClientMatch = matchingClientIds.length > 0 ? `client_id.in.(${matchingClientIds.join(',')})` : ''
            const orderProductMatch = matchingOrderIdsFromProducts.length > 0 ? `id.in.(${matchingOrderIdsFromProducts.join(',')})` : ''
            const poNumberMatch = `po_number.ilike.%${searchQuery}%`

            const orOrderConditions = [orderClientMatch, orderProductMatch, poNumberMatch].filter(Boolean).join(',')
            if (orOrderConditions) {
                q = q.or(orOrderConditions).limit(30)
            } else {
                q = q.eq('id', '00000000-0000-0000-0000-000000000000').limit(0)
            }
        } else {
            q = q.limit(20)
        }
        return q
    }

    const pendingOrderPromise = buildOrderQuery(['draft', 'confirmed'])
    const deliveryOrderPromise = buildOrderQuery(['production', 'shipped'])

    // 5. Ultimate Parallel Resolution
    const [
        quotationsRes,
        pendingOrdersRes,
        deliveryOrdersRes,
        clientsRes,
        authRes
    ] = await Promise.all([
        quoteQuery,
        pendingOrderPromise,
        deliveryOrderPromise,
        clientsPromise,
        authPromise
    ])

    const quotations = quotationsRes.data || []
    const pendingOrders = pendingOrdersRes.data || []
    const deliveryOrders = deliveryOrdersRes.data || []
    const clients = clientsRes.data || []
    // Provide empty fallback arrays for props to prevent front-end errors
    const products: any[] = []
    const clientProducts: any[] = []

    const user = authRes.data?.user
    let userRole = 'sales'
    if (user?.id) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (profile?.role) userRole = profile.role
    }

    return (
        <div className="p-4 md:p-6 lg:p-8 relative min-h-[80vh]">
            <OrderPageClient
                activeTab={activeTab}
                clients={clients || []}
                products={products || []}
                clientProducts={clientProducts || []}
                quotationContent={<QuotationList quotations={quotations} />}
                orderContent={<OrderList orders={pendingOrders} userRole={userRole} tabType="order" />}
                deliveryContent={<OrderList orders={deliveryOrders} userRole={userRole} tabType="delivery" />}
            />
        </div>
    )
}
