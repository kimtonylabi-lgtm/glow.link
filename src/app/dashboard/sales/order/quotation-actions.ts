'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { quotationSchema, type QuotationFormValues } from '@/lib/validations/quotation'

export async function saveQuotation(data: QuotationFormValues, id?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: '인증이 필요합니다.' }

    const validated = quotationSchema.safeParse(data)
    if (!validated.success) {
        console.error('Validation Error:', validated.error)
        return { success: false, error: '입력값이 올바르지 않습니다. 모든 필수 필드를 확인해 주세요.' }
    }

    try {
        // 1. Resolve Client ID (or insert if not exists for demo/simplicity, but here we require it)
        const { data: client } = await supabase
            .from('clients')
            .select('id')
            .eq('company_name', data.client_name)
            .maybeSingle()

        if (!client) return { success: false, error: `고객사 '${data.client_name}'를 찾을 수 없습니다.` }

        // 2. Automatic Master Data Registration
        const masterEntries: { category: string, name: string }[] = []
        data.items.forEach(item => {
            item.bom_items.forEach(bom => {
                if (bom.part_name) masterEntries.push({ category: 'part', name: bom.part_name })
                if (bom.material) masterEntries.push({ category: 'material', name: bom.material })
                if (bom.metalizing) masterEntries.push({ category: 'metalizing', name: bom.metalizing })
                if (bom.coating) masterEntries.push({ category: 'coating', name: bom.coating })
            })
        })

        if (masterEntries.length > 0) {
            await (supabase.from('master_data' as any) as any).upsert(masterEntries, { onConflict: 'category,name' })
        }

        // 3. Calculate amounts
        const supply_price = data.items.reduce((total, product) => {
            const qty = Number(product.quantity) || 0
            const unitCost = product.bom_items.reduce((acc, bom) => {
                const base = Number(bom.base_unit_price) || 0
                const pp = Number(bom.post_processing_unit_price) || 0
                return acc + base + pp
            }, 0)
            return total + (qty * unitCost)
        }, 0)

        const vat_amount = data.is_vat_included ? 0 : supply_price * 0.1
        const total_amount = supply_price + vat_amount

        let quotationId: string;
        let versionNo = 1;

        if (id) {
            const { data: prev } = await (supabase
                .from('quotations' as any)
                .select('version_no, id')
                .eq('id', id)
                .single() as any)

            if (prev) {
                versionNo = prev.version_no + 1
                await (supabase.from('quotations' as any) as any).update({ is_current: false }).eq('id', id)
            }
        }

        // 4. Insert Quotation Master
        const { data: quote, error: quoteError } = await (supabase
            .from('quotations' as any)
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
            .single() as any)

        if (quoteError) throw quoteError
        quotationId = quote.id

        // 5. Insert Items
        const itemsToInsert = []
        for (const item of data.items) {
            // Find or insert product
            let productId: string;
            const { data: prod } = await supabase
                .from('products')
                .select('id')
                .eq('name', item.product_name)
                .maybeSingle()

            if (!prod) {
                const { data: newProd, error: pError } = await (supabase
                    .from('products' as any) as any)
                    .insert({ name: item.product_name, category: 'finished' })
                    .select('id')
                    .single()
                if (pError) throw pError
                productId = newProd.id
            } else {
                productId = prod.id
            }

            const unitCost = item.bom_items.reduce((acc, bom) => {
                const base = Number(bom.base_unit_price) || 0
                const pp = Number(bom.post_processing_unit_price) || 0
                return acc + base + pp
            }, 0)

            itemsToInsert.push({
                quotation_id: quotationId,
                product_id: productId,
                quantity: Number(item.quantity) || 0,
                unit_price: unitCost,
                post_processing: JSON.stringify(item.bom_items)
            })
        }

        const { error: itemsError } = await (supabase
            .from('quotation_items' as any) as any)
            .insert(itemsToInsert)

        if (itemsError) throw itemsError

        revalidatePath('/dashboard/sales/order')
        return { success: true, id: quotationId }
    } catch (error: any) {
        console.error('Quotation Save Error:', error)
        return { success: false, error: error.message || '저장 중 오류가 발생했습니다.' }
    }
}

export async function finalizeQuotation(id: string) {
    const supabase = await createClient()

    try {
        // 1. Fetch Quotation and Items
        const { data: quote, error: quoteError } = await (supabase
            .from('quotations' as any)
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
        await (supabase.from('quotations' as any) as any).update({ status: 'finalized' }).eq('id', id)

        revalidatePath('/dashboard/sales/order')
        return { success: true }
    } catch (error) {
        console.error('Finalize Error:', error)
        return { success: false, error: '최종 확정 처리 중 오류가 발생했습니다.' }
    }
}
