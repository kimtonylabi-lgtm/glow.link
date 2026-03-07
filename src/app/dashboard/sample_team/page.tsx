import { createClient } from '@/lib/supabase/server'
import { SampleRequestWithRelations } from '@/types/crm'
import { KanbanBoard } from './kanban-board'
import { Package } from 'lucide-react'

// [최적화] force-dynamic 제거 - Supabase 호출로 자동 dynamic 처리

export default async function SampleTeamPage() {
    const supabase = await createClient()

    // Fetch All Sample Requests for Sample Team
    const { data: samplesData, error } = await supabase
        .from('sample_requests')
        .select(`
      *,
      clients:client_id (company_name),
      profiles:sales_person_id (full_name)
    `)
        // Sample Team usually wants everything, but sorted older first (FIFO)
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Error fetching sample requests:', error)
    }

    const samples = (samplesData || []) as SampleRequestWithRelations[]

    return (
        <div className="p-4 md:p-6 lg:p-8 relative min-h-[80vh] flex flex-col h-full overflow-hidden">
            {/* Decorative Lights */}
            <div className="absolute top-0 right-10 w-[400px] h-[400px] bg-green-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-10 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Package className="h-6 w-6 text-primary drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                        샘플실 관리 보드 (Sample Kanban)
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        영업팀의 샘플 요청 내역을 확인하고 상태를 업데이트 하세요. (오래된 요청이 상단에 위치합니다)
                    </p>
                </div>
            </div>

            {/* Main Board Container */}
            <KanbanBoard samples={samples} />
        </div>
    )
}
