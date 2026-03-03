import { z } from 'zod';

export const postProcessingSchema = z.object({
    type: z.enum(['증착', '코팅', '인쇄', '조립', '기타']),
    spec: z.string().min(1, '상세 내용을 입력하세요'),
});

export const quotationItemSchema = z.object({
    product_name: z.string().min(1, '제품명을 입력하세요'),
    client_product_name: z.string().optional(),
    quantity: z.number().min(1, '수량을 입력하세요'),
    unit_price: z.number().min(0, '단가를 입력하세요'),
    post_processings: z.array(postProcessingSchema).default([]),
});

export const quotationSchema = z.object({
    client_name: z.string().min(1, '고객사를 선택하거나 직접 입력하세요'),
    due_date: z.date().optional(),
    items: z.array(quotationItemSchema).min(1, '최소 하나 이상의 품목을 입력하세요'),
    is_vat_included: z.boolean().default(true),
    memo: z.string().optional(),
});

export type QuotationItemFormValues = z.infer<typeof quotationItemSchema>;
export type QuotationFormValues = z.infer<typeof quotationSchema>;
