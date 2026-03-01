import { createClient } from '@/lib/supabase/server'
import { OrderForm } from './order-form'
import { OrderList } from './order-list'

export const dynamic = 'force-dynamic'

export default async function OrderPage() {
    const supabase = await createClient()

    // 1. Fetch Orders with relations
    const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
            *,
            clients (company_name),
            profiles (full_name)
        `)
        .order('created_at', { ascending: false })

    if (ordersError) {
        console.error('Error fetching orders:', ordersError)
    }

    // Fetch user role for permission control
    const { data: { user } } = await supabase.auth.getUser()

    let userRole = 'sales'
    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()
        userRole = profile?.role || 'sales'
    }

    // 2. Fetch Clients for dropdown
    const { data: clientsData } = await supabase
        .from('clients')
        .select('id, company_name')
        .eq('status', 'active')
        .order('company_name', { ascending: true })

    // 3. Fetch Products for dropdown
    const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true })

    // 4. Fetch Client Products for dropdown
    const { data: clientProductsData } = await (supabase
        .from('client_products' as any) as any)
        .select('*')
        .order('name', { ascending: true })

    const orders = ordersData || []
    const clients = clientsData || []
    const products = productsData || []
    const clientProducts = clientProductsData || []

    return (
        <div className="p-4 md:p-6 lg:p-8 relative min-h-[80vh] space-y-6">
            {/* Decorative Lights */}
            <div className="absolute top-20 right-10 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />
            <div className="absolute top-60 left-10 w-[400px] h-[400px] bg-pink-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">수주 / 납기 관리</h2>
                    <p className="text-muted-foreground text-sm">고객사별 수주와 품목 상세 내역을 등록하고 납기 일정을 관리합니다.</p>
                </div>
                <div className="flex-shrink-0 z-20">
                    <OrderForm
                        clients={clients as any}
                        products={products as any}
                        clientProducts={clientProducts as any}
                    />
                </div>
            </div>

            <OrderList orders={orders} userRole={userRole} />
        </div>
    )
}
