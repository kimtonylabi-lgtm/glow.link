import * as z from 'zod';

export const activitySchema = z.object({
    client_id: z.string().uuid({ message: '고객사를 선택해주세요.' }),
    type: z.enum(['meeting', 'call', 'email', 'meal', 'other']).default('meeting'),
    title: z.string().min(2, { message: '활동 제목을 입력해주세요. (최소 2자)' }),
    content: z.string().optional().nullable(),
    activity_date: z.date({ message: '활동 일자를 선택해주세요.' })
});

export type ActivityFormValues = z.infer<typeof activitySchema>;
