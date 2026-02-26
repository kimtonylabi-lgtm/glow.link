'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getSystemSettings() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, data: null, error: 'Unauthorized' }

    const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('key')

    if (error) {
        return { success: false, data: null, error: '설정을 불러오지 못했습니다.' }
    }

    return { success: true, data }
}

export async function updateSystemSetting(key: string, value: any, merge: boolean = true) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    // Must be admin
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || profile.role !== 'admin') {
        return { success: false, error: '관리자만 시스템 설정을 변경할 수 있습니다.' }
    }

    let finalValue = value

    // If merge logic requested for JSONB (useful for partial config updates)
    if (merge) {
        const { data: existing } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', key)
            .single()

        if (existing && typeof existing.value === 'object' && typeof value === 'object' && !Array.isArray(value) && !Array.isArray(existing.value)) {
            finalValue = { ...existing.value, ...value }
        }
    }

    const { error } = await supabase
        .from('system_settings')
        .upsert({
            key,
            value: finalValue
        }, { onConflict: 'key' })

    if (error) {
        console.error('Failed to update system settings:', error)
        return { success: false, error: '설정 저장 중 오류가 발생했습니다.' }
    }

    revalidatePath('/dashboard/admin/settings')
    return { success: true }
}
