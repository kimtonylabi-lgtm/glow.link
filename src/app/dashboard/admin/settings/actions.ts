'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getSystemSetting(key: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', key)
        .single()

    if (error) {
        console.error(`Failed to get setting ${key}:`, error)
        return null
    }
    return data
}

export async function updateSystemSetting(key: string, newValue: any) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Unauthorized' }

    // Check admin role
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || profile.role !== 'admin') {
        return { success: false, error: '관리자만 설정을 변경할 수 있습니다.' }
    }

    // JSONB Merge logic using RPC or raw SQL if possible, 
    // but standard upsert with merging logic handled here for simplicity or using a custom RPC
    // Since we want safety, let's use a small RPC if available or just fetch-and-merge

    // Fetch current value
    const { data: current, error: fetchError } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', key)
        .single()

    let mergedValue = newValue
    if (current && typeof current.value === 'object' && typeof newValue === 'object') {
        mergedValue = { ...current.value, ...newValue }
    }

    const { error: upsertError } = await supabase
        .from('system_settings')
        .upsert({
            key,
            value: mergedValue,
            updated_at: new Date().toISOString()
        })

    if (upsertError) {
        console.error(`Failed to update setting ${key}:`, upsertError)
        return { success: false, error: '설정 저장 실패' }
    }

    revalidatePath('/dashboard/admin/settings')
    return { success: true }
}

export async function getAllSettings() {
    const supabase = await createClient()
    const { data, error } = await supabase.from('system_settings').select('*')
    if (error) return []
    return data
}
