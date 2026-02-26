'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: '인증되지 않았습니다.' }
    }

    const fullName = formData.get('fullName') as string
    const department = formData.get('department') as string

    const { error } = await supabase
        .from('profiles')
        .update({
            full_name: fullName,
            department: department
        })
        .eq('id', user.id)

    if (error) {
        console.error('Failed to update profile:', error)
        return { success: false, error: '프로필 업데이트에 실패했습니다.' }
    }

    revalidatePath('/dashboard/settings')
    revalidatePath('/dashboard', 'layout') // to refresh header
    return { success: true }
}
