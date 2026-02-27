import * as z from 'zod';

export const sampleRequestSchema = z.object({
    client_id: z.string().uuid({ message: '고객사를 선택해주세요.' }),
    product_name: z.string().min(2, { message: '제품명을 상세히 입력해주세요. (최소 2자)' }),
    quantity: z.number().min(1, { message: '수량은 1개 이상이어야 합니다.' }),
    shipping_address: z.string().min(5, { message: '배송지 주소를 정확히 입력해주세요.' }),
    contact_person: z.string().min(2, { message: '고객사 담당자명을 입력해주세요.' }),
    special_instructions: z.string().min(1, { message: '특이사항을 입력해주세요. (없으면 "없음" 입력)' }),
    sample_type: z.enum(['random', 'ct', 'design']),
});

export type SampleRequestFormValues = z.infer<typeof sampleRequestSchema>;
