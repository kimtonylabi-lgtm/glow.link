import * as z from 'zod';

export const sampleRequestSchema = z.object({
    client_id: z.string().uuid({ message: '고객사를 선택해주세요.' }),
    product_name: z.string().min(2, { message: '제품명을 상세히 입력해주세요. (최소 2자)' }),
    quantity: z.number().min(1, { message: '수량은 1개 이상이어야 합니다.' }),
    shipping_address: z.string().min(5, { message: '배송지 주소를 정확히 입력해주세요.' }),
});

export type SampleRequestFormValues = z.infer<typeof sampleRequestSchema>;
