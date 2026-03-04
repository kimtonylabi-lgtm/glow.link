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

    // 1. Build Query for Quotations
    let matchingClientIds: string[] = []
    let matchingQuoteIdsFromProducts: string[] = []

    if (searchQuery) {
        // Find matching clients
        const { data: matchedClients } = await supabase
            .from('clients')
            .select('id')
            .ilike('company_name', `%${searchQuery}%`)
        if (matchedClients) matchingClientIds = matchedClients.map((c: any) => c.id)

        // Find matching products -> quotation_items -> quotation_id
        const { data: matchedProducts } = await supabase
            .from('products')
            .select('id')
            .ilike('name', `%${searchQuery}%`)

        if (matchedProducts && matchedProducts.length > 0) {
            const productIds = matchedProducts.map((p: any) => p.id)
            const { data: matchedItems } = await (supabase
                .from('quotation_items' as any) as any)
                .select('quotation_id')
                .in('product_id', productIds)
            if (matchedItems) matchingQuoteIdsFromProducts = matchedItems.map((item: any) => item.quotation_id)
        }
    }

    let query = (supabase.from('quotations' as any) as any).select(`
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
            query = query.or(orConditions).limit(30) // 서버단 Limit 렌더링 방어
        } else {
            // If we have a query but no matches at all, we should return empty.
            // A trick is to filter by an impossible ID
            query = query.eq('id', '00000000-0000-0000-0000-000000000000').limit(0)
        }
    } else {
        // No search query: Limit to 5 non-finalized
        query = query.neq('status', 'finalized').limit(5)
    }

    const { data: quotationsData } = await query
    const quotations = quotationsData || []

    // 2. Fetch Orders (Data Diet 적용: 불필요한 post_processing 생략)
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
        // Need to find matching order IDs from order_items' product relation
        let matchingOrderIdsFromProducts: string[] = []
        if (matchingQuoteIdsFromProducts.length > 0) { // reuse the matched products from above
            const { data: matchedOrderItems } = await (supabase
                .from('order_items' as any) as any)
                .select('order_id')
                .in('product_id', matchingQuoteIdsFromProducts) // This is using product IDs implicitly found earlier

            // To be entirely accurate, let's fetch matching products again if necessary,
            // but we already have matchedProducts list from above if searchQuery existed.
            // Wait, we didn't save productIds, we saved matchingQuoteIdsFromProducts.
            // Let's re-query products if needed, or better, we can just do a subquery or join for orders.
            // Since we don't have productIds saved from block 1, let's just do a fresh query for order_items based on products:
            const { data: matchedProducts } = await supabase.from('products').select('id').ilike('name', `%${searchQuery}%`)
            if (matchedProducts && matchedProducts.length > 0) {
                const pIds = matchedProducts.map((p: any) => p.id)
                const { data: mItems } = await (supabase.from('order_items' as any) as any).select('order_id').in('product_id', pIds)
                if (mItems) matchingOrderIdsFromProducts = mItems.map((item: any) => item.order_id)
            }
        }

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

    const { data: ordersData } = await orderQuery

    // 3. Fetch Master Data for Form
    const { data: clients } = await supabase.from('clients').select('id, company_name').eq('status', 'active')
    const { data: products } = await supabase.from('products').select('*')
    const { data: clientProducts } = await (supabase.from('client_products' as any) as any).select('*')

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id || '').single()
    const userRole = profile?.role || 'sales'

    const orders = ordersData || []

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
