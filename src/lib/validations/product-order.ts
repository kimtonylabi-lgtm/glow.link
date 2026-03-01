import { z } from 'zod'

export const productSchema = z.object({
    name: z.string().min(2, { message: '제품명은 2자 이상 입력해주세요.' }),
    item_code: z.string().min(3, { message: '품번은 3자 이상 입력해주세요.' }),
    category: z.enum(['bottle', 'pump', 'jar', 'cap'], { message: '카테고리를 선택해주세요.' }),
    price: z.union([z.string(), z.number()])
        .transform((val) => {
            if (typeof val === 'number') return val;
            return Number(val.replace(/,/g, ''));
        })
        .refine((val) => !isNaN(val) && val >= 0, { message: '단가는 0원 이상이어야 합니다.' })
})

export type ProductFormValues = z.infer<typeof productSchema>

// Order Item Schema (for the dynamic form)
export const orderItemSchema = z.object({
    product_name: z.string().min(1, { message: '제품명을 입력해주세요.' }),
    client_product_name: z.string().optional(),
    quantity: z.number().min(1, { message: '수량은 1개 이상이어야 합니다.' }),
    unit_price: z.number().min(0, { message: '단가는 0원 이상이어야 합니다.' }),
})

export type OrderItemFormValues = z.infer<typeof orderItemSchema>

// Main Order Schema
export const orderSchema = z.object({
    client_name: z.string().min(1, { message: '고객사명을 입력해주세요.' }),
    due_date: z.date({ message: "납기일을 선택해주세요." }).optional(),
    memo: z.string().optional(),
    items: z.array(orderItemSchema).min(1, { message: '최소 1개 이상의 제품을 추가해주세요.' }),
})

export type OrderFormValues = z.infer<typeof orderSchema>
