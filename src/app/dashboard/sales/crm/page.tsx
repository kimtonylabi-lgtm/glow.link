import { createClient } from '@/lib/supabase/server'
import { CrmClient } from './crm-client'
import { ClientWithProfile } from '@/types/crm'

export const dynamic = 'force-dynamic'

export default async function CrmPage() {
    const supabase = await createClient()

    // Fetch clients including the related profile for the 'managed_by' field
    // Supabase automatically understands the foreign key reference
    const { data: clients, error } = await supabase
        .from('v_sales_analysis' as any)
        .select(`
      *,
      profiles:managed_by (full_name)
    `)
        .order('total_revenue', { ascending: false })

    if (error) {
        console.error('Error fetching clients:', error)
    }

    // Typecast the result cleanly
    const initialData = (clients as any || []) as ClientWithProfile[]

    return (
        <div className="p-4 md:p-6 lg:p-8">
            <CrmClient initialData={initialData} />
        </div>
    )
}
