import { z } from 'zod';

export const bomItemSchema = z.object({
    part_name: z.string().min(1, '부품명을 입력하세요'),
    material: z.string().optional().default(''),
    color: z.string().optional().default(''),
    metalizing: z.string().optional().default(''),
    coating: z.string().optional().default(''),
    printing: z.string().optional().default(''),
    post_processing_unit_price: z.union([z.number(), z.literal('')]).optional().default(''),
    base_unit_price: z.union([z.number(), z.literal('')]).optional().default(''),
});

export const quotationItemSchema = z.object({
    product_name: z.string().min(1, '제품명을 입력하세요'),
    quantity: z.union([z.number(), z.literal('')]).default(10000),
    bom_items: z.array(bomItemSchema).min(1, '최소 하나 이상의 부품을 입력하세요'),
});

export const quotationSchema = z.object({
    client_name: z.string().min(1, '고객사를 선택하거나 직접 입력하세요'),
    items: z.array(quotationItemSchema).min(1, '최소 하나 이상의 제품을 입력하세요'),
    is_vat_included: z.boolean().default(true),
    memo: z.string().optional().default(''),
});

export type BomItemValues = z.infer<typeof bomItemSchema>;
export type QuotationItemValues = z.infer<typeof quotationItemSchema>;
export type QuotationFormValues = z.infer<typeof quotationSchema>;
