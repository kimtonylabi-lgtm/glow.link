'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { sampleRequestSchema, type SampleRequestFormValues } from '@/lib/validations/sample'

// 영업팀: 새로운 샘플 요청 등록
export async function addSampleRequest(data: SampleRequestFormValues) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { error: '인증되지 않은 사용자입니다.' }
        }

        const parsedData = sampleRequestSchema.safeParse(data)

        if (!parsedData.success) {
            return { error: '입력값이 올바르지 않습니다.' }
        }

        const {
            client_id,
            product_name,
            quantity,
            contact_person,
            cat_no,
            has_sample,
            has_film,
            has_laba,
            shipping_address,
            special_instructions,
            sample_type,
            sample_no,
            completion_date,
            design_specs
        } = parsedData.data

        const insertPayload: any = {
            client_id,
            product_name,
            quantity,
            contact_person,
            sample_no,
            cat_no,
            has_sample,
            has_film,
            has_laba,
            shipping_address,
            special_instructions,
            sample_type,
            sales_person_id: user.id,
            design_specs: (sample_type === 'design' && design_specs && design_specs.length > 0) ? design_specs : null
        }

        if (sample_type === 'design' && completion_date) {
            insertPayload.completion_date = new Date(completion_date).toISOString().split('T')[0]
        }

        const { error: insertError } = await supabase
            .from('sample_requests')
            .insert(insertPayload)

        if (insertError) {
            return { error: insertError.message }
        }

        revalidatePath('/dashboard/sales/sample')
        revalidatePath('/dashboard/sample_team')
        return { success: true }
    } catch (err: unknown) {
        if (err instanceof Error) {
            return { error: err.message }
        }
        return { error: 'Unknown API error' }
    }
}

// 샘플팀: 샘플 상태 업데이트 (이미지 URL 옵션)
export async function updateSampleStatus(id: string, newStatus: string, imageUrl?: string | null) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { error: '인증되지 않은 사용자입니다.' }
        }

        const updatePayload: any = { status: newStatus }
        if (imageUrl !== undefined) {
            updatePayload.completion_image_url = imageUrl
        }

        const { error: updateError } = await supabase
            .from('sample_requests')
            .update(updatePayload)
            .eq('id', id)

        if (updateError) {
            return { error: updateError.message }
        }

        revalidatePath('/dashboard/sales/sample')
        revalidatePath('/dashboard/sample_team')
        return { success: true }
    } catch (err: unknown) {
        if (err instanceof Error) {
            return { error: err.message }
        }
        return { error: 'Unknown API error' }
    }
}

export async function getNextSampleNo() {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('get_next_sample_seq')

    if (error) {
        console.error('Error fetching next sequence:', error)
        return { success: false, nextNo: 'D-AUTO' }
    }

    const nextVal = (data || 0) + 1
    return { success: true, nextNo: `D${String(nextVal).padStart(6, '0')}` }
}
