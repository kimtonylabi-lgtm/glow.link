'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { productSchema, ProductFormValues } from '@/lib/validations/product-order'
import { z } from 'zod'

export async function addProduct(data: ProductFormValues, imageFile: File | null) {
    const supabase = await createClient()

    // 1. Zod Validation
    const result = productSchema.safeParse(data)
    if (!result.success) {
        return {
            success: false,
            error: '입력값이 올바르지 않습니다.',
            details: result.error.flatten().fieldErrors
        }
    }

    try {
        // 2. Check Item Code Uniqueness Real-time
        const { data: existingClient } = await supabase
            .from('products')
            .select('id')
            .eq('item_code', result.data.item_code)
            .single()

        if (existingClient) {
            return {
                success: false,
                error: '이미 존재하는 품번(Item Code)입니다.',
            }
        }

        let imageUrl = null

        // 3. Upload Image if provided
        if (imageFile) {
            const fileExt = imageFile.name.split('.').pop()
            const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
            const filePath = `products/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('product-images')
                .upload(filePath, imageFile, {
                    cacheControl: '3600',
                    upsert: false
                })

            if (uploadError) {
                console.error("Storage upload error:", uploadError)
                return { success: false, error: '이미지 업로드에 실패했습니다.' }
            }

            const { data: { publicUrl } } = supabase.storage
                .from('product-images')
                .getPublicUrl(filePath)

            imageUrl = publicUrl
        }

        // 4. Insert into DB
        const { error: insertError } = await supabase
            .from('products')
            .insert({
                name: result.data.name,
                item_code: result.data.item_code,
                category: result.data.category,
                price: result.data.price,
                image_url: imageUrl
            })

        if (insertError) {
            console.error('Insert error:', insertError)
            return {
                success: false,
                error: '제품 등록에 실패했습니다.',
                details: insertError
            }
        }

        revalidatePath('/dashboard/sales/product')
        return { success: true }

    } catch (error) {
        console.error('Server action error:', error)
        return {
            success: false,
            error: '서버 오류가 발생했습니다.'
        }
    }
}

export async function checkItemCodeUnique(itemCode: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from('products')
        .select('id')
        .eq('item_code', itemCode)
        .single()
    return !!data
}
