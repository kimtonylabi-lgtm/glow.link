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

    // 1. 독립적인 로드 쿼리들 (마스터 데이타 및 유저 인증) 병렬 실행 예약
    const clientsPromise = supabase.from('clients').select('id, company_name').eq('status', 'active')
    const productsPromise = supabase.from('products').select('*')
    const clientProductsPromise = (supabase.from('client_products' as any) as any).select('*')
    const authPromise = supabase.auth.getUser()

    // 2. 검색 연관성 매칭 쿼리 병렬 최적화
    let matchingClientIds: string[] = []
    let matchingQuoteIdsFromProducts: string[] = []
    let matchingOrderIdsFromProducts: string[] = []

    if (searchQuery) {
        // Find matching clients and products in parallel
        const [matchedClientsRes, matchedProductsRes] = await Promise.all([
            supabase.from('clients').select('id').ilike('company_name', `%${searchQuery}%`),
            supabase.from('products').select('id').ilike('name', `%${searchQuery}%`)
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

    // 4. Build Query for Orders (Data Diet 적용: 불필요한 post_processing 생략)
    let orderQuery = (supabase.from('orders') as any).select(`
        id, client_id, sales_person_id, order_date, due_date, total_amount, status, po_number, created_at, memo,
        clients (company_name),
        profiles (full_name),
        order_items (
            id,
            quantity,
            products ( name )
        )
    `).order('created_at', { ascending: false })

    if (searchQuery) {
        const orderClientMatch = matchingClientIds.length > 0 ? `client_id.in.(${matchingClientIds.join(',')})` : ''
        const orderProductMatch = matchingOrderIdsFromProducts.length > 0 ? `id.in.(${matchingOrderIdsFromProducts.join(',')})` : ''
        const poNumberMatch = `po_number.ilike.%${searchQuery}%`

        const orOrderConditions = [orderClientMatch, orderProductMatch, poNumberMatch].filter(Boolean).join(',')
        if (orOrderConditions) {
            orderQuery = orderQuery.or(orOrderConditions).limit(30) // 브라우저 폭탄 방어
        } else {
            orderQuery = orderQuery.eq('id', '00000000-0000-0000-0000-000000000000').limit(0)
        }
    } else {
        orderQuery = orderQuery.limit(20) // 기본 조회 한도 제한
    }

    // 5. Ultimate Parallel Resolution (Promise.all 파괴적 결합 성능)
    const [
        quotationsRes,
        ordersRes,
        clientsRes,
        productsRes,
        clientProductsRes,
        authRes
    ] = await Promise.all([
        quoteQuery,
        orderQuery,
        clientsPromise,
        productsPromise,
        clientProductsPromise,
        authPromise
    ])

    const quotations = quotationsRes.data || []
    const orders = ordersRes.data || []
    const clients = clientsRes.data || []
    const products = productsRes.data || []
    const clientProducts = clientProductsRes.data || []

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
                orderContent={<OrderList orders={orders} userRole={userRole} />}
                deliveryContent={
                    <div className="p-20 text-center rounded-3xl border border-dashed border-border/40 bg-muted/5">
                        <Truck className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p className="text-muted-foreground font-medium">납기 관리 데이터 로딩 중...</p>
                    </div>
                }
            />
        </div>
    )
}
