import { createClient } from '@/lib/supabase/server'
import { ReportsClient } from './reports-client'

// [최적화] force-dynamic 제거 - Supabase 호출로 자동 dynamic 처리

export default async function ReportsPage() {
    const supabase = await createClient()
    const { data: clients } = await supabase
        .from('clients')
        .select('id, company_name')
        .order('company_name', { ascending: true })

    return (
        <div className="p-4 md:p-6 lg:p-8 relative min-h-[80vh]">
            {/* Decorative Lights */}
            <div className="absolute top-20 right-10 w-[300px] h-[300px] bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />
            <div className="absolute bottom-20 left-10 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

            <ReportsClient clients={clients || []} />
        </div>
    )
}
