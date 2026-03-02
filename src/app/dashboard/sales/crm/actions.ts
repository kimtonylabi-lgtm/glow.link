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

        const { data: newClient, error: insertError } = await supabase
            .from('clients')
            .insert(insertPayload as any)
            .select()
            .single()

        if (insertError) {
            return { error: insertError.message }
        }

        // Log: Initial registration
        await supabase.from('customer_history_logs' as any).insert({
            client_id: newClient.id,
            log_type: 'client_created',
            content: '고객사가 신규 등록되었습니다.',
            performer_id: user.id
        })

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

        // Log: Information update
        await supabase.from('customer_history_logs' as any).insert({
            client_id: id,
            log_type: 'info_updated',
            content: '고객사 기본 정보가 수정되었습니다.',
            performer_id: user.id
        })

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

export async function getClientDetail(id: string) {
    try {
        const supabase = await createClient()

        // 1. Fetch basic client info and managed_by profile
        const { data: client, error: clientError } = await supabase
            .from('clients')
            .select(`
                *,
                managed_by_profile:profiles(full_name)
            `)
            .eq('id', id)
            .single()

        if (clientError) {
            console.error('[CRM] Client fetch error:', clientError)
            return { error: clientError.message }
        }

        // 2. Fetch contacts separately to avoid "relationship not found" schema cache issues
        const { data: contacts, error: contactsError } = await supabase
            .from('customer_contacts' as any)
            .select('*')
            .eq('client_id', id)
            .order('is_primary', { ascending: false })

        if (contactsError) {
            console.error('[CRM] Contacts fetch error:', contactsError)
            return { error: contactsError.message }
        }

        return {
            success: true,
            data: {
                ...client,
                contacts: contacts || []
            }
        }
    } catch (err: any) {
        console.error('[CRM] Server error:', err)
        return { error: err.message || '서버 오류' }
    }
}

export async function addCustomerContact(clientId: string, data: any) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: '인증 필요' }

        const { error } = await supabase
            .from('customer_contacts' as any)
            .insert({ ...data, client_id: clientId })

        if (error) return { error: error.message }

        // Log
        await supabase.from('customer_history_logs' as any).insert({
            client_id: clientId,
            log_type: 'contact_added',
            content: `새 담당자(${data.name})가 추가되었습니다.`,
            performer_id: user.id
        })

        revalidatePath('/dashboard/sales/crm')
        return { success: true }
    } catch (err: any) {
        return { error: err.message }
    }
}

export async function deleteCustomerContact(clientId: string, contactId: string, contactName: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: '인증 필요' }

        const { error } = await supabase
            .from('customer_contacts' as any)
            .delete()
            .eq('id', contactId)

        if (error) return { error: error.message }

        // Log
        await supabase.from('customer_history_logs' as any).insert({
            client_id: clientId,
            log_type: 'contact_removed',
            content: `담당자(${contactName})가 삭제되었습니다.`,
            performer_id: user.id
        })

        revalidatePath('/dashboard/sales/crm')
        return { success: true }
    } catch (err: any) {
        return { error: err.message }
    }
}

export async function getClientOrders(clientId: string) {
    try {
        const supabase = await createClient()
        const { data: orders, error } = await supabase
            .from('orders')
            .select('*')
            .eq('client_id', clientId)
            .order('order_date', { ascending: false })

        if (error) return { error: error.message }
        return { success: true, data: orders }
    } catch (err: any) {
        return { error: err.message || '서버 오류' }
    }
}

export async function getClientSamples(clientId: string) {
    try {
        const supabase = await createClient()
        const { data: samples, error } = await supabase
            .from('sample_requests')
            .select('*')
            .eq('client_id', clientId)
            .order('request_date', { ascending: false })

        if (error) return { error: error.message }
        return { success: true, data: samples }
    } catch (err: any) {
        return { error: err.message || '서버 오류' }
    }
}

export async function getClientHistory(clientId: string) {
    try {
        const supabase = await createClient()
        const { data: logs, error } = await supabase
            .from('customer_history_logs' as any)
            .select(`
                *,
                performer:profiles(full_name)
            `)
            .eq('client_id', clientId)
            .order('created_at', { ascending: false })

        if (error) return { error: error.message }
        return { success: true, data: logs }
    } catch (err: any) {
        console.error('[CRM] History fetch error:', err)
        return { error: err.message || '서버 오류' }
    }
}
