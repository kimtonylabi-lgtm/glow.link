import { createClient } from '@/lib/supabase/server'
import { Client, SampleRequestWithRelations } from '@/types/crm'
import { SampleForm } from './sample-form'
import { SampleList } from './sample-list'
import { getCurrentUser } from '@/lib/supabase/queries'

// [최적화] force-dynamic 제거 - Supabase 호출로 자동 dynamic 처리

export default async function SamplePage() {
    const supabase = await createClient()

    // [최적화] layout.tsx와 동일 요청 → cache()로 DB 재조회 없이 즉시 반환
    const user = await getCurrentUser()

    // Fetch Clients for the Combobox (Auto-fill address needed)
    const { data: clientsData } = await supabase
        .from('clients')
        .select('id, company_name, address')
        .order('company_name', { ascending: true })

    const clients = (clientsData || []) as Client[]

    // Fetch My Sample Requests
    const { data: samplesData, error } = await supabase
        .from('sample_requests')
        .select(`
      *,
      clients:client_id (company_name, address),
      profiles:sales_person_id (full_name)
    `)
        .eq('sales_person_id', user?.id || '')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching sample requests:', error)
    }

    const samples = (samplesData || []) as SampleRequestWithRelations[]

    return (
        <div className="p-4 md:p-6 lg:p-8 relative min-h-[80vh] flex flex-col gap-10">
            {/* Decorative Lights */}
            <div className="absolute top-20 left-10 w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />
            <div className="absolute bottom-20 right-10 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

            {/* Top: List & Status (100% Width) */}
            <div className="w-full">
                <SampleList samples={samples} />
            </div>

            {/* Bottom: Register Form (100% Width) */}
            <div className="w-full">
                <SampleForm clients={clients} />
            </div>
        </div>
    )
}
