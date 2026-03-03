import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { QuotationDetailView } from './quotation-detail-view'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

async function QuotationDataFetcher({ id }: { id: string }) {
    const supabase = await createClient()

    // 1. Fetch current quotation and its items
    const { data: quote, error } = await (supabase
        .from('quotations' as any)
        .select(`
            *,
            clients (company_name),
            profiles (full_name),
            quotation_items (
                *,
                products (name)
            )
        `)
        .eq('id', id)
        .single() as any)

    if (error || !quote) {
        console.error('Fetch Quotation Detail Error:', error)
        notFound()
    }

    // 2. Fetch history (simpler approach: same client)
    const { data: history } = await (supabase
        .from('quotations' as any)
        .select(`
            *,
            quotation_items (
                *,
                products (name)
            )
        `)
        .eq('client_id', quote.client_id)
        .order('version_no', { ascending: true }) as any)

    return <QuotationDetailView quote={quote} versions={history || []} />
}

export default async function QuotationDetailPage({ params }: { params: { id: string } }) {
    return (
        <Suspense fallback={
            <div className="p-10 space-y-8 animate-pulse">
                <div className="h-10 w-1/3 bg-muted rounded-xl" />
                <div className="h-64 w-full bg-muted rounded-3xl" />
                <div className="grid grid-cols-3 gap-8">
                    <div className="col-span-2 h-96 bg-muted rounded-3xl" />
                    <div className="h-96 bg-muted rounded-3xl" />
                </div>
            </div>
        }>
            <QuotationDataFetcher id={params.id} />
        </Suspense>
    )
}
