'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { UserRole } from '@/types/auth'

export async function updateUserRole(userId: string, newRole: UserRole) {
    const supabase = await createClient()

    // 1. Get current user session to verify they are admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return { success: false, error: '인증되지 않은 사용자입니다.' }
    }

    // 2. Prevent self-demotion
    if (user.id === userId) {
        return { success: false, error: '자신의 권한은 변경할 수 없습니다. (관리자 강등 방지)' }
    }

    // 3. Get my role to ensure it is admin
    const { data: myProfile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profileError || myProfile?.role !== 'admin') {
        return { success: false, error: '관리자 권한이 필요합니다.' }
    }

    // 4. Update the user's role
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)

    if (updateError) {
        console.error('Role update error:', updateError)
        return { success: false, error: '역할 변경에 실패했습니다.' }
    }

    revalidatePath('/dashboard/admin/users')
    return { success: true }
}
