'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { quotationSchema, type QuotationFormValues } from '@/lib/validations/quotation'

export async function saveQuotation(data: QuotationFormValues, id?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: '인증이 필요합니다.' }

    const validated = quotationSchema.safeParse(data)
    if (!validated.success) return { success: false, error: '입력값이 올바르지 않습니다.' }

    try {
        // 1. Resolve Client ID
        const { data: client } = await supabase
            .from('clients')
            .select('id')
            .eq('company_name', data.client_name)
            .maybeSingle()

        if (!client) return { success: false, error: '존재하지 않는 고객사입니다.' }

        // calculate amounts
        const supply_price = data.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
        const vat_amount = data.is_vat_included ? 0 : supply_price * 0.1
        const total_amount = supply_price + vat_amount

        let quotationId: string;
        let versionNo = 1;

        if (id) {
            // It's a revision - get previous version info
            const { data: prev } = await supabase
                .from('quotations')
                .select('version_no, id')
                .eq('id', id)
                .single()

            if (prev) {
                versionNo = prev.version_no + 1
                // Set old as not current
                await supabase.from('quotations').update({ is_current: false }).eq('id', id)
            }
        }

        // 2. Insert Quotation Master
        const { data: quote, error: quoteError } = await supabase
            .from('quotations')
            .insert({
                client_id: client.id,
                sales_person_id: user.id,
                version_no: versionNo,
                parent_id: id || null,
                supply_price,
                vat_amount,
                total_amount,
                is_vat_included: data.is_vat_included,
                memo: data.memo,
                status: 'draft',
                is_current: true
            })
            .select('id')
            .single()

        if (quoteError) throw quoteError
        quotationId = quote.id

        // 3. Insert Items
        const itemsToInsert = []
        for (const item of data.items) {
            const { data: prod } = await supabase
                .from('products')
                .select('id')
                .eq('name', item.product_name)
                .maybeSingle()

            if (!prod) continue // Should ideally upsert if logic allows, but keep simple for now

            itemsToInsert.push({
                quotation_id: quotationId,
                product_id: prod.id,
                quantity: item.quantity,
                unit_price: item.unit_price,
                post_processing: item.post_processings
            })
        }

        const { error: itemsError } = await supabase
            .from('quotation_items')
            .insert(itemsToInsert)

        if (itemsError) throw itemsError

        revalidatePath('/dashboard/sales/order')
        return { success: true, id: quotationId }
    } catch (error) {
        console.error('Quotation Save Error:', error)
        return { success: false, error: '저장 중 오류가 발생했습니다.' }
    }
}

export async function finalizeQuotation(id: string) {
    const supabase = await createClient()

    try {
        // 1. Fetch Quotation and Items
        const { data: quote, error: quoteError } = await (supabase
            .from('quotations')
            .select('*, quotation_items(*)')
            .eq('id', id)
            .single() as any)

        if (quoteError || !quote) throw quoteError || new Error('Quotation not found')

        // 2. Create Order (Transaction-like)
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                client_id: quote.client_id,
                sales_person_id: quote.sales_person_id,
                total_amount: quote.total_amount,
                status: 'confirmed',
                quotation_id: quote.id
            })
            .select('id')
            .single()

        if (orderError) throw orderError

        // 3. Create Order Items
        const orderItems = quote.quotation_items.map((qi: any) => ({
            order_id: order.id,
            product_id: qi.product_id,
            quantity: qi.quantity,
            unit_price: qi.unit_price,
            subtotal: qi.quantity * qi.unit_price
        }))

        const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
        if (itemsError) throw itemsError

        // 4. Update Quotation Status
        await supabase.from('quotations').update({ status: 'finalized' }).eq('id', id)

        revalidatePath('/dashboard/sales/order')
        return { success: true }
    } catch (error) {
        console.error('Finalize Error:', error)
        return { success: false, error: '최종 확정 처리 중 오류가 발생했습니다.' }
    }
}
