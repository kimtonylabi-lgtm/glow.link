'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Storage upload and db update
export async function uploadSampleImageAndUpdateStatus(
    id: string,
    formData: FormData
) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { error: '인증되지 않은 사용자입니다.' }
        }

        const file = formData.get('file') as File
        if (!file) {
            return { error: '업로드할 파일이 없습니다.' }
        }

        const fileExt = file.name.split('.').pop()
        const fileName = `${id}-${Math.random()}.${fileExt}`
        const filePath = `completed/${fileName}`

        // 1. Upload to storage
        const { error: uploadError, data } = await supabase.storage
            .from('sample-uploads')
            .upload(filePath, file)

        if (uploadError) {
            return { error: `이미지 업로드 실패: ${uploadError.message}` }
        }

        // 2. Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('sample-uploads')
            .getPublicUrl(filePath)

        // 3. Update sample_request status and image URL
        const { error: updateError } = await supabase
            .from('sample_requests')
            .update({
                status: 'shipped',
                completion_image_url: publicUrl
            })
            .eq('id', id)

        if (updateError) {
            return { error: `DB 업데이트 실패: ${updateError.message}` }
        }

        revalidatePath('/dashboard/sample_team')
        revalidatePath('/dashboard/sales/sample')
        return { success: true, url: publicUrl }

    } catch (err: unknown) {
        if (err instanceof Error) {
            return { error: err.message }
        }
        return { error: 'Unknown server error' }
    }
}
