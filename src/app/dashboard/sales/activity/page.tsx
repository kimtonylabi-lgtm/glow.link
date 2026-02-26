import { createClient } from '@/lib/supabase/server'
import { Client } from '@/types/crm'
import { ActivityWithRelations } from '@/types/crm'
import { ActivityContainer } from './activity-container'

export const dynamic = 'force-dynamic'

interface Props {
    searchParams: Promise<{ client?: string }>
}

export default async function ActivityPage({ searchParams }: Props) {
    const supabase = await createClient()
    const params = await searchParams
    const clientIdFilter = params.client

    // Fetch Clients for the Combobox and Filter
    // Only fetching their names and ids to be lightweight
    const { data: clientsData } = await supabase
        .from('clients')
        .select('id, company_name')
        .order('company_name', { ascending: true })

    const clients = (clientsData || []) as Client[]

    // Fetch Activities
    // Fetch up to 50 activities safely. Inner join clients and profiles to get names.
    let query = supabase
        .from('activities')
        .select(`
      *,
      clients:client_id (company_name),
      profiles:user_id (full_name)
    `)
        .order('activity_date', { ascending: false })
        .limit(50)

    if (clientIdFilter && clientIdFilter !== 'all') {
        query = query.eq('client_id', clientIdFilter)
    }

    const { data: activitiesData, error } = await query

    if (error) {
        console.error('Error fetching activities:', error)
    }

    const activities = (activitiesData || []) as ActivityWithRelations[]

    return (
        <div className="p-4 md:p-6 lg:p-8 relative min-h-[80vh]">
            {/* Decorative Background Blob */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

            <ActivityContainer clients={clients} initialActivities={activities} />
        </div>
    )
}
