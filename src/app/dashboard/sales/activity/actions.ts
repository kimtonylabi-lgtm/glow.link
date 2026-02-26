'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { activitySchema, type ActivityFormValues } from '@/lib/validations/activity'

export async function addActivity(data: ActivityFormValues) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { error: '인증되지 않은 사용자입니다.' }
        }

        const parsedData = activitySchema.safeParse(data)

        if (!parsedData.success) {
            return { error: '입력값이 올바르지 않습니다.' }
        }

        const insertPayload = {
            ...parsedData.data,
            activity_date: parsedData.data.activity_date.toISOString(),
            user_id: user.id
        }

        const { error: insertError } = await supabase
            .from('activities')
            .insert(insertPayload as any)

        if (insertError) {
            return { error: insertError.message }
        }

        revalidatePath('/dashboard/sales/activity')
        return { success: true }
    } catch (err: unknown) {
        if (err instanceof Error) {
            return { error: err.message }
        }
        return { error: 'Unknown API error' }
    }
}

export async function updateActivity(id: string, data: ActivityFormValues) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { error: '인증되지 않은 사용자입니다.' }
        }

        const parsedData = activitySchema.safeParse(data)

        if (!parsedData.success) {
            return { error: '입력값이 올바르지 않습니다.' }
        }

        const updatePayload = {
            ...parsedData.data,
            activity_date: parsedData.data.activity_date.toISOString(),
        }

        const { error: updateError } = await supabase
            .from('activities')
            .update(updatePayload as any)
            .eq('id', id)

        if (updateError) {
            return { error: updateError.message }
        }

        revalidatePath('/dashboard/sales/activity')
        return { success: true }
    } catch (err: unknown) {
        if (err instanceof Error) {
            return { error: err.message }
        }
        return { error: 'Unknown API error' }
    }
}

export async function deleteActivity(id: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { error: '인증되지 않은 사용자입니다.' }
        }

        const { error: deleteError } = await supabase
            .from('activities')
            .delete()
            .eq('id', id)

        if (deleteError) {
            return { error: deleteError.message }
        }

        revalidatePath('/dashboard/sales/activity')
        return { success: true }
    } catch (err: unknown) {
        if (err instanceof Error) {
            return { error: err.message }
        }
        return { error: 'Unknown API error' }
    }
}
