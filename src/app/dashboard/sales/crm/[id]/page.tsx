import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ClientDetailView } from './client-detail-view'
import { getClientDetail } from '../actions'

export const dynamic = 'force-dynamic'

interface Props {
    params: {
        id: string
    }
}

export default async function ClientDetailPage({ params }: Props) {
    const { id } = params

    const result = await getClientDetail(id)

    if (!result.success || !result.data) {
        return notFound()
    }

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto pb-20">
            <ClientDetailView initialClient={result.data} />
        </div>
    )
}
