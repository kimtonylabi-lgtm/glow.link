import * as z from 'zod';

export const designSpecSchema = z.object({
    part_name: z.string().min(1, { message: '부품명을 입력해주세요.' }),
    injection_material: z.string().min(1, { message: '원료명을 입력해주세요.' }),
    injection_color: z.string().min(1, { message: '색상(사출)을 입력해주세요.' }),
    coating: z.string(),
    printing: z.string(),
});

const baseSchema = z.object({
    client_id: z.string().min(1, { message: '고객사를 선택해주세요.' }),
    product_name: z.string().min(2, { message: '제품명을 상세히 입력해주세요. (최소 2자)' }),
    quantity: z.number().min(1, { message: '수량을 입력해주세요.' }),
    contact_person: z.string().min(1, { message: '담당자 성함을 입력해주세요.' }),
    sample_no: z.string().optional(),
    shipping_address: z.string().optional(),
    special_instructions: z.string().optional(),
});

export const sampleRequestSchema = z.discriminatedUnion('sample_type', [
    baseSchema.extend({
        sample_type: z.literal('random'),
        cat_no: z.any().optional(),
        has_sample: z.boolean().optional(),
        has_film: z.boolean().optional(),
        has_laba: z.boolean().optional(),
        completion_date: z.any().optional(),
        design_specs: z.any().optional(),
    }),
    baseSchema.extend({
        sample_type: z.literal('ct'),
        cat_no: z.any().optional(),
        has_sample: z.boolean().optional(),
        has_film: z.boolean().optional(),
        has_laba: z.boolean().optional(),
        completion_date: z.any().optional(),
        design_specs: z.any().optional(),
    }),
    baseSchema.extend({
        sample_type: z.literal('design'),
        cat_no: z.string().optional(),
        has_sample: z.boolean().optional(),
        has_film: z.boolean().optional(),
        has_laba: z.boolean().optional(),
        completion_date: z.date().nullable().refine((val) => val !== null, { message: "완료요청일을 선택해주세요." }),
        design_specs: z.array(designSpecSchema).min(1, { message: "최소 1개의 디자인 스팩을 지정해주세요." }),
    }),
]);

export type SampleRequestFormValues = z.infer<typeof sampleRequestSchema>;
