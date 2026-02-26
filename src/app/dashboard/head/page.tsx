import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { HeadDashboardClient } from './dashboard-client'

export default async function HeadDashboardPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    // Admin & Head can access
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || !['admin', 'head'].includes(profile.role)) {
        redirect('/dashboard')
    }

    // Fetch recent orders
    // Use proper casting since Supabase relation joins are complex
    const { data: recentOrdersData, error } = await supabase
        .from('orders')
        .select(`
            id,
            order_date,
            total_amount,
            status,
            client_id,
            sales_person_id,
            clients ( company_name ),
            profiles!sales_person_id ( full_name )
        `)
        .order('order_date', { ascending: false })
        .limit(5)

    if (error) {
        console.error('Error fetching recent orders:', error)
    }

    return <HeadDashboardClient recentOrders={recentOrdersData as any[] || []} />
}
