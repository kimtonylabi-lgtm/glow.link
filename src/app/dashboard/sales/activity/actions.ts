'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { activitySchema, type ActivityFormValues } from '@/lib/validations/activity'

async function upsertMasterItem(supabase: any, table: string, name: string, nameColumn: string = 'name') {
    const trimmedName = name.trim()
    if (!trimmedName) return null

    // Check if exists
    const { data: existing } = await supabase
        .from(table)
        .select('id')
        .eq(nameColumn, trimmedName)
        .maybeSingle()

    if (existing) {
        return { id: existing.id, isNew: false, name: trimmedName }
    }

    // Insert new
    const { data: inserted, error } = await supabase
        .from(table)
        .insert({ [nameColumn]: trimmedName })
        .select('id')
        .single()

    if (error) {
        // Handle race conditions (another user inserted at the same time)
        const { data: retry } = await supabase
            .from(table)
            .select('id')
            .eq(nameColumn, trimmedName)
            .single()
        return { id: retry?.id, isNew: false, name: trimmedName }
    }

    return { id: inserted.id, isNew: true, name: trimmedName }
}

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

        // 1. Upsert Master Data
        const clientResult = await upsertMasterItem(supabase, 'clients', parsedData.data.client_name, 'company_name')
        const productResult = parsedData.data.product_name
            ? await upsertMasterItem(supabase, 'products', parsedData.data.product_name)
            : null
        const clientProductResult = parsedData.data.client_product_name
            ? await upsertMasterItem(supabase, 'client_products', parsedData.data.client_product_name)
            : null

        // 2. Prepare Activity Payload
        const insertPayload = {
            client_id: clientResult?.id,
            product_id: productResult?.id,
            client_product_id: clientProductResult?.id,
            type: parsedData.data.type,
            pipeline_status: parsedData.data.pipeline_status,
            title: parsedData.data.title.trim(),
            content: parsedData.data.content,
            activity_date: parsedData.data.activity_date.toISOString(),
            user_id: user.id
        }

        const { error: insertError } = await supabase
            .from('activities')
            .insert(insertPayload)

        if (insertError) {
            return { error: insertError.message }
        }

        // Identify newly created master items for toast feedback
        const newMasterItems = []
        if (clientResult?.isNew) newMasterItems.push('고객사')
        if (productResult?.isNew) newMasterItems.push('제품명')
        if (clientProductResult?.isNew) newMasterItems.push('고객사 제품명')

        revalidatePath('/dashboard/sales/activity')
        return { success: true, newMasterItems }
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

        // 1. Upsert Master Data
        const clientResult = await upsertMasterItem(supabase, 'clients', parsedData.data.client_name, 'company_name')
        const productResult = parsedData.data.product_name
            ? await upsertMasterItem(supabase, 'products', parsedData.data.product_name)
            : null
        const clientProductResult = parsedData.data.client_product_name
            ? await upsertMasterItem(supabase, 'client_products', parsedData.data.client_product_name)
            : null

        const updatePayload = {
            client_id: clientResult?.id,
            product_id: productResult?.id,
            client_product_id: clientProductResult?.id,
            type: parsedData.data.type,
            pipeline_status: parsedData.data.pipeline_status,
            title: parsedData.data.title.trim(),
            content: parsedData.data.content,
            activity_date: parsedData.data.activity_date.toISOString(),
        }

        const { error: updateError } = await supabase
            .from('activities')
            .update(updatePayload)
            .eq('id', id)

        if (updateError) {
            return { error: updateError.message }
        }

        const newMasterItems = []
        if (clientResult?.isNew) newMasterItems.push('고객사명')
        if (productResult?.isNew) newMasterItems.push('제품명')
        if (clientProductResult?.isNew) newMasterItems.push('고객사 제품명')

        revalidatePath('/dashboard/sales/activity')
        return { success: true, newMasterItems }
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
export async function updateActivityStatus(id: string, status: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { error: '인증되지 않은 사용자입니다.' }
        }

        const { error: updateError } = await supabase
            .from('activities')
            .update({ pipeline_status: status } as any)
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
