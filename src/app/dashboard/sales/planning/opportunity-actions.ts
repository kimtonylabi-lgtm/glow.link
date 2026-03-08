'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type OpportunityStage = 'lead' | 'sample_sent' | 'quote_submitted' | 'negotiating' | 'confirmed' | 'dropped'

export interface CreateOpportunityInput {
    client_id: string
    title: string
    stage: OpportunityStage
    expected_amount: number
    probability: number
    expected_close_date?: string
    memo?: string
}

// 수주 기회 생성
export async function createOpportunity(input: CreateOpportunityInput) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: '인증이 필요합니다.' }

    const { error } = await (supabase.from('opportunities' as any) as any)
        .insert({ ...input, sales_person_id: user.id })

    if (error) {
        console.error('createOpportunity error:', error)
        return { success: false, error: '수주 기회 등록에 실패했습니다.' }
    }

    revalidatePath('/dashboard/sales/planning')
    return { success: true }
}

// 스테이지 이동 (드래그 앤 드롭)
export async function updateOpportunityStage(id: string, stage: OpportunityStage) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: '인증이 필요합니다.' }

    const { error } = await (supabase.from('opportunities' as any) as any)
        .update({ stage, updated_at: new Date().toISOString() })
        .eq('id', id)

    if (error) {
        console.error('updateOpportunityStage error:', error)
        return { success: false, error: '스테이지 업데이트에 실패했습니다.' }
    }

    revalidatePath('/dashboard/sales/planning')
    return { success: true }
}

// 수주 기회 삭제
export async function deleteOpportunity(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: '인증이 필요합니다.' }

    const { error } = await (supabase.from('opportunities' as any) as any)
        .delete()
        .eq('id', id)

    if (error) return { success: false, error: '삭제에 실패했습니다.' }

    revalidatePath('/dashboard/sales/planning')
    return { success: true }
}
