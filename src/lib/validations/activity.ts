import * as z from 'zod';

export const activitySchema = z.object({
    client_name: z.string().min(1, { message: '고객사명을 입력해주세요.' }),
    product_name: z.string().optional(),
    client_product_name: z.string().optional(),
    type: z.enum(['meeting', 'call', 'email', 'meal', 'other']).default('meeting'),
    pipeline_status: z.enum(['lead', 'sample_sent', 'quote_submitted', 'negotiating', 'confirmed', 'dropped']).optional(),
    title: z.string().min(1, { message: '활동 제목을 입력해주세요.' }),
    content: z.string().optional().nullable(),
    activity_date: z.date({ message: '활동 일자를 선택해주세요.' })
});

export type ActivityFormValues = z.infer<typeof activitySchema>;
