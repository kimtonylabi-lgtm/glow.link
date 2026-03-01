import { PlanningClient } from './planning-client'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function SalesPlanningPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    const { data: activities } = await supabase
        .from('activities')
        .select(`
            *,
            clients (id, company_name),
            products (id, name),
            client_products (id, name),
            profiles (id, full_name, role)
        `)
        .order('activity_date', { ascending: false })

    return (
        <div className="animate-in fade-in duration-500">
            <PlanningClient activities={(activities as any) || []} />
        </div>
    )
}
