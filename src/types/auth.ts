export type UserRole = 'admin' | 'head' | 'sales' | 'sample_team' | 'support';

export interface Profile {
    id: string;
    email: string;
    role: UserRole;
    full_name: string | null;
    department: string | null;
    created_at: string;
}
