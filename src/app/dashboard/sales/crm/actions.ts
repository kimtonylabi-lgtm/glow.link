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

        // STEP 1: Insert client - get back the new client id
        const insertPayload = {
            ...parsedData.data,
            sales_person_id: parsedData.data.sales_person_id || user.id
        }

        const { data: newClient, error: insertError } = await supabase
            .from('clients')
            .insert(insertPayload as any)
            .select()
            .single()

        if (insertError || !newClient) {
            return { error: insertError?.message || '고객사 등록에 실패했습니다.' }
        }

        const clientId = newClient.id
        const contactName = parsedData.data.contact_person
        const contactPhone = parsedData.data.phone
        const contactEmail = parsedData.data.email

        // STEP 2: If contact info exists, insert primary contact into customer_contacts
        if (contactName) {
            const { error: contactError } = await supabase
                .from('customer_contacts' as any)
                .insert({
                    client_id: clientId,
                    name: contactName,
                    phone: contactPhone || null,
                    email: contactEmail || null,
                    is_primary: true,
                    created_by: user.id,
                })

            if (contactError) {
                console.error('[CRM] customer_contacts insert error:', contactError)
                // Non-fatal — client is already created, just log warning
            }

            // STEP 3: Log creation history
            await supabase
                .from('customer_history_logs' as any)
                .insert({
                    client_id: clientId,
                    log_type: 'contact_added',
                    content: `신규 고객사가 등록되고 ${contactName}이(가) 주 담당자로 지정되었습니다.`,
                    created_by: user.id,
                })
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

        const updatePayload = {
            ...parsedData.data,
            sales_person_id: parsedData.data.sales_person_id || null
        }

        const { error: updateError } = await supabase
            .from('clients')
            .update(updatePayload as any)
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

export async function getClientDetail(id: string) {
    try {
        const supabase = await createClient()

        // 1. Fetch basic client info and sales_person profile (explicit join)
        const { data: client, error: clientError } = await supabase
            .from('clients')
            .select(`
                *,
                sales_person:profiles!sales_person_id(full_name)
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

        // Log: Contact added (Focused logging)
        await supabase.from('customer_history_logs' as any).insert({
            client_id: clientId,
            log_type: 'contact_added',
            content: `신규 담당자 [${data.name}] 등록됨 (직책: ${data.position || '미지정'})`,
            performed_by: user.id
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

        // Log: Contact removed (Focused logging)
        await supabase.from('customer_history_logs' as any).insert({
            client_id: clientId,
            log_type: 'contact_removed',
            content: `담당자 [${contactName}] 삭제됨`,
            performed_by: user.id
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
                performer:profiles!performed_by(full_name)
            `)
            .eq('client_id', clientId)
            .in('log_type', ['contact_added', 'contact_updated', 'contact_removed'])
            .order('created_at', { ascending: false })

        if (error) {
            console.error('[CRM] History fetch error:', error)
            return { error: error.message }
        }
        return { success: true, data: logs }
    } catch (err: any) {
        console.error('[CRM] History fetch error:', err)
        return { error: err.message || '서버 오류' }
    }
}

export async function getSalesReps() {
    try {
        const supabase = await createClient()
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('id, full_name, role')
            .in('role', ['sales', 'head', 'admin'])
            .order('full_name', { ascending: true })

        if (error) return { error: error.message }
        return { success: true, data: profiles }
    } catch (err: any) {
        return { error: err.message }
    }
}

export async function updateCustomerContact(clientId: string, contactId: string, data: any) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: '인증 필요' }

        const { error } = await supabase
            .from('customer_contacts' as any)
            .update(data)
            .eq('id', contactId)

        if (error) return { error: error.message }

        // Log: Contact updated (Focused logging)
        await supabase.from('customer_history_logs' as any).insert({
            client_id: clientId,
            log_type: 'contact_updated',
            content: `담당자 [${data.name}] 정보 수정됨`,
            performed_by: user.id
        })

        revalidatePath('/dashboard/sales/crm')
        return { success: true }
    } catch (err: any) {
        return { error: err.message }
    }
}
