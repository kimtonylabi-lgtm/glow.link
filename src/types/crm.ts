export type ClientTier = 'S' | 'A' | 'B' | 'C';
export type ClientStatus = 'active' | 'inactive';

export interface Client {
    id: string;
    company_name: string;
    business_number: string | null;
    contact_person: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    memo: string | null;
    tier: ClientTier;
    status: ClientStatus;
    managed_by: string | null;
    sales_person_id: string | null;
    created_at: string;
}

// A combined type optionally returning the profile relation
export interface ClientWithProfile extends Client {
    sales_person?: {
        full_name: string | null;
    };
    managed_by_profile?: {
        full_name: string | null;
    };
    total_revenue?: number;
    conversion_rate?: number;
}

export interface Product {
    id: string;
    name: string;
    item_code: string | null;
    category: 'bottle' | 'pump' | 'jar' | 'cap';
    price: number;
    image_url: string | null;
    created_at: string;
}

export interface ClientProduct {
    id: string;
    name: string;
    created_at: string;
}

export type ActivityType = 'meeting' | 'call' | 'email' | 'meal' | 'other';
export type PipelineStatus = 'lead' | 'sample_sent' | 'quote_submitted' | 'negotiating' | 'confirmed' | 'dropped';

export interface Activity {
    id: string;
    client_id: string;
    product_id: string | null;
    client_product_id: string | null;
    user_id: string;
    type: ActivityType;
    pipeline_status: PipelineStatus | null;
    title: string;
    content: string | null;
    activity_date: string;
    next_action: string | null;
    next_action_date: string | null;
    created_at: string;
}

export interface ActivityWithRelations extends Activity {
    clients?: {
        company_name: string;
    };
    products?: {
        name: string;
    };
    client_products?: {
        name: string;
    };
    profiles?: {
        full_name: string | null;
    };
}

export type SampleStatus = 'pending' | 'processing' | 'shipped';

export interface SampleRequest {
    id: string;
    client_id: string;
    sales_person_id: string;
    product_name: string;
    quantity: number;
    status: SampleStatus;
    shipping_address: string | null;
    completion_image_url: string | null;
    request_date: string;
    created_at: string;

    // New fields for Sample Form UI Overhaul
    design_specs: any | null; // JSONB
    completion_date: string | null; // DATE
    cat_no: string | null;
    has_sample: boolean;
    has_film: boolean;
    has_laba: boolean;
    sample_type: 'random' | 'ct' | 'design';
    sample_no: string;
    contact_person?: string | null;
    special_instructions?: string | null;
}

export interface SampleRequestWithRelations extends SampleRequest {
    clients?: {
        company_name: string;
        address: string | null;
    };
    profiles?: {
        full_name: string | null;
    };
}
