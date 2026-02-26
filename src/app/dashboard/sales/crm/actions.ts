'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { clientSchema } from '@/lib/validations/client'
import type { ClientFormValues } from '@/lib/validations/client'

export async function addClient(data: ClientFormValues) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { error: '인증되지 않은 사용자입니다.' }
        }

        // Validate using Zod on the server side as well
        const parsedData = clientSchema.safeParse(data)

        if (!parsedData.success) {
            return { error: '입력값이 올바르지 않습니다.' }
        }

        // Insert into DB
        const insertPayload = {
            ...parsedData.data,
            managed_by: user.id
        }

        const { error: insertError } = await supabase
            .from('clients')
            .insert(insertPayload as any)

        if (insertError) {
            return { error: insertError.message }
        }

        revalidatePath('/dashboard/sales/crm')
        return { success: true }
    } catch (err: unknown) {
        if (err instanceof Error) {
            return { error: err.message }
        }
        return { error: 'Unknown API error' }
    }
}

export async function updateClient(id: string, data: ClientFormValues) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { error: '인증되지 않은 사용자입니다.' }
        }

        const parsedData = clientSchema.safeParse(data)

        if (!parsedData.success) {
            return { error: '입력값이 올바르지 않습니다.' }
        }

        const { error: updateError } = await supabase
            .from('clients')
            .update(parsedData.data as any)
            .eq('id', id)

        if (updateError) {
            return { error: updateError.message }
        }

        revalidatePath('/dashboard/sales/crm')
        return { success: true }
    } catch (err: unknown) {
        if (err instanceof Error) {
            return { error: err.message }
        }
        return { error: 'Unknown API error' }
    }
}

export async function deleteClient(id: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { error: '인증되지 않은 사용자입니다.' }
        }

        const { error: deleteError } = await supabase
            .from('clients')
            .delete()
            .eq('id', id)

        if (deleteError) {
            // RLS might block this if they are not Admin or Head
            return { error: deleteError.message }
        }

        revalidatePath('/dashboard/sales/crm')
        return { success: true }
    } catch (err: unknown) {
        if (err instanceof Error) {
            return { error: err.message }
        }
        return { error: 'Unknown API error' }
    }
}
