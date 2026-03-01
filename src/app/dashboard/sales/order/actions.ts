'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { orderSchema, OrderFormValues } from '@/lib/validations/product-order'
import { z } from 'zod'

/**
 * Helper to upsert master data (client, product, client_product)
 */
async function upsertMasterItem(
    supabase: any,
    table: string,
    nameColumn: string,
    nameValue: string,
    additionalData: any = {}
) {
    const trimmedName = nameValue.trim();
    if (!trimmedName) return { id: null, isNew: false };

    // 1. Try to find existing
    const { data: existing } = await supabase
        .from(table)
        .select('id')
        .eq(nameColumn, trimmedName)
        .maybeSingle();

    if (existing) {
        return { id: existing.id, isNew: false };
    }

    // 2. Insert new if not found
    const { data: inserted, error } = await supabase
        .from(table)
        .insert({ [nameColumn]: trimmedName, ...additionalData })
        .select('id')
        .single();

    if (error) {
        // Handle race condition: check again if someone else inserted it
        const { data: retry } = await supabase
            .from(table)
            .select('id')
            .eq(nameColumn, trimmedName)
            .maybeSingle();

        if (retry) return { id: retry.id, isNew: false };
        throw error;
    }

    return { id: inserted.id, isNew: true };
}

export async function addOrder(data: OrderFormValues) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: '인증되지 않은 사용자입니다.' }
    }

    // 1. Zod Validation
    const result = orderSchema.safeParse(data)
    if (!result.success) {
        return {
            success: false,
            error: '입력값이 올바르지 않습니다.',
            details: result.error.flatten().fieldErrors
        }
    }

    const newMasterItems: string[] = [];

    try {
        // 2. UPSERT Master Data: Client
        const { id: clientId, isNew: isNewClient } = await upsertMasterItem(
            supabase,
            'clients',
            'company_name',
            result.data.client_name
        );
        if (isNewClient) newMasterItems.push(`고객사: ${result.data.client_name}`);

        // 3. Calculate Total Amount
        const total_amount = result.data.items.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price), 0)

        // 4. Insert Master Record (Order)
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .insert({
                client_id: clientId,
                sales_person_id: user.id,
                due_date: result.data.due_date ? result.data.due_date.toISOString() : null,
                total_amount: total_amount,
                memo: result.data.memo?.trim() || null,
                status: 'draft' // Initial state
            })
            .select('id')
            .single()

        if (orderError || !orderData) {
            console.error('Order Insert error:', orderError)
            return { success: false, error: '수주 마스터 생성에 실패했습니다.' }
        }

        // 5. Process Order Items (UPSERT Products each)
        const orderItemsToInsert = [];

        for (const item of result.data.items) {
            // Upsert Product
            const { id: productId, isNew: isNewProd } = await upsertMasterItem(
                supabase,
                'products',
                'name',
                item.product_name,
                { price: item.unit_price, category: 'bottle' } // Optional initial price & default category
            );
            if (isNewProd) newMasterItems.push(`제품: ${item.product_name}`);

            // Upsert Client Product if provided
            let clientProductId = null;
            if (item.client_product_name) {
                const { id: cpId, isNew: isNewCP } = await upsertMasterItem(
                    supabase,
                    'client_products',
                    'name',
                    item.client_product_name
                );
                clientProductId = cpId;
                if (isNewCP) newMasterItems.push(`고객사 제품: ${item.client_product_name}`);
            }

            orderItemsToInsert.push({
                order_id: orderData.id,
                product_id: productId,
                client_product_id: clientProductId,
                quantity: item.quantity,
                unit_price: item.unit_price,
                subtotal: item.quantity * item.unit_price
            });
        }

        // 6. Insert Detail Records (Order Items)
        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItemsToInsert)

        if (itemsError) {
            console.error('Order Items Insert error:', itemsError)
            // Rollback master
            await supabase.from('orders').delete().eq('id', orderData.id)
            return { success: false, error: '수주 상세 항목 저장에 실패했습니다.' }
        }

        revalidatePath('/dashboard/sales/order')
        return {
            success: true,
            newMasterItems: newMasterItems.length > 0 ? newMasterItems : undefined
        }

    } catch (error) {
        console.error('Server action error:', error)
        return {
            success: false,
            error: '서버 오류가 발생했습니다.'
        }
    }
}
