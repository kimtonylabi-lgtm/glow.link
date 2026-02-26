import * as z from 'zod';

export const clientSchema = z.object({
    company_name: z.string().min(2, '회사명은 최소 2글자 이상 입력해주세요.'),
    business_number: z.string().optional().nullable(),
    contact_person: z.string().optional().nullable(),
    email: z.string().email('유효한 이메일 주소를 입력해주세요.').optional().or(z.literal('')).nullable(),
    phone: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    memo: z.string().optional().nullable(),
    tier: z.enum(['S', 'A', 'B', 'C']).default('C'),
    status: z.enum(['active', 'inactive']).default('active'),
});

export type ClientFormValues = z.infer<typeof clientSchema>;
