import * as z from 'zod';

export const designSpecSchema = z.object({
    part_name: z.string().min(1, { message: '부품명을 입력해주세요.' }),
    injection_material: z.string().min(1, { message: '원료명을 입력해주세요.' }),
    injection_color: z.string().min(1, { message: '색상(사출)을 입력해주세요.' }),
    coating: z.string(),
    printing: z.string(),
});

export const sampleRequestSchema = z.object({
    client_id: z.string().uuid({ message: '고객사를 선택해주세요.' }),
    product_name: z.string().min(2, { message: '제품명을 상세히 입력해주세요. (최소 2자)' }),
    quantity: z.number().min(1, { message: '수량은 1개 이상이어야 합니다.' }),
    shipping_address: z.string().optional(),
    contact_person: z.string().min(2, { message: '고객사 담당자명을 입력해주세요.' }),
    special_instructions: z.string().optional(),
    sample_type: z.enum(['random', 'ct', 'design']),
    completion_date: z.date().optional(),
    cat_no: z.string().optional(),
    film_color: z.string().optional(),
    rubber_color: z.string().optional(),
    design_specs: z.array(designSpecSchema).optional(),
}).superRefine((data, ctx) => {
    if (data.sample_type === 'design') {
        if (!data.completion_date) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "완료요청일을 선택해주세요.",
                path: ["completion_date"],
            });
        }
        if (!data.design_specs || data.design_specs.length === 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "최소 1개의 디자인 스팩을 지정해주세요.",
                path: ["design_specs"],
            });
        }
    }
});

export type SampleRequestFormValues = z.infer<typeof sampleRequestSchema>;
