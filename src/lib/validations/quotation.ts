import { z } from 'zod';

export const postProcessingSchema = z.object({
    type: z.enum(['증착', '코팅', '인쇄', '조립', '기타']),
    spec: z.string().min(1, '상세 내용을 입력하세요'),
    unit_price: z.union([z.number(), z.literal('')]).optional().default(''),
});

export const bomItemSchema = z.object({
    part_name: z.string().min(1, '부품명을 입력하세요'),
    base_unit_price: z.union([z.number(), z.literal('')]).optional().default(''),
    post_processings: z.array(postProcessingSchema).default([]),
});

export const quotationItemSchema = z.object({
    product_name: z.string().min(1, '제품명을 입력하세요'),
    client_product_name: z.string().optional(),
    quantity: z.union([z.number(), z.literal('')]).default(10000),
    bom_items: z.array(bomItemSchema).min(1, '최소 하나 이상의 BOM 항목을 입력하세요'),
});

export const quotationSchema = z.object({
    client_name: z.string().min(1, '고객사를 선택하거나 직접 입력하세요'),
    due_date: z.date().optional().nullable(),
    items: z.array(quotationItemSchema).min(1, '최소 하나 이상의 제품을 입력하세요'),
    is_vat_included: z.boolean().default(true),
    memo: z.string().optional().default(''),
});

export type PostProcessingValues = z.infer<typeof postProcessingSchema>;
export type BomItemValues = z.infer<typeof bomItemSchema>;
export type QuotationItemValues = z.infer<typeof quotationItemSchema>;
export type QuotationFormValues = z.infer<typeof quotationSchema>;
