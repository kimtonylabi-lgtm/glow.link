export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    email: string
                    role: 'admin' | 'head' | 'sales' | 'sample_team' | 'support'
                    full_name: string | null
                    department: string | null
                    created_at: string
                }
                Insert: {
                    id: string
                    email: string
                    role?: 'admin' | 'head' | 'sales' | 'sample_team' | 'support'
                    full_name?: string | null
                    department?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    role?: 'admin' | 'head' | 'sales' | 'sample_team' | 'support'
                    full_name?: string | null
                    department?: string | null
                    created_at?: string
                }
                Relationships: []
            }
            clients: {
                Row: {
                    id: string
                    company_name: string
                    business_number: string | null
                    contact_person: string | null
                    email: string | null
                    phone: string | null
                    address: string | null
                    memo: string | null
                    tier: 'S' | 'A' | 'B' | 'C'
                    status: 'active' | 'inactive'
                    managed_by: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    company_name: string
                    business_number?: string | null
                    contact_person?: string | null
                    email?: string | null
                    phone?: string | null
                    address?: string | null
                    memo?: string | null
                    tier?: 'S' | 'A' | 'B' | 'C'
                    status?: 'active' | 'inactive'
                    managed_by?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    company_name?: string
                    business_number?: string | null
                    contact_person?: string | null
                    email?: string | null
                    phone?: string | null
                    address?: string | null
                    memo?: string | null
                    tier?: 'S' | 'A' | 'B' | 'C'
                    status?: 'active' | 'inactive'
                    managed_by?: string | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "clients_managed_by_fkey"
                        columns: ["managed_by"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            activities: {
                Row: {
                    id: string
                    client_id: string
                    user_id: string
                    type: 'meeting' | 'call' | 'email' | 'meal' | 'other'
                    title: string
                    content: string | null
                    activity_date: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    client_id: string
                    user_id: string
                    type?: 'meeting' | 'call' | 'email' | 'meal' | 'other'
                    title: string
                    content?: string | null
                    activity_date?: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    client_id?: string
                    user_id?: string
                    type?: 'meeting' | 'call' | 'email' | 'meal' | 'other'
                    title?: string
                    content?: string | null
                    activity_date?: string
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "activities_client_id_fkey"
                        columns: ["client_id"]
                        isOneToOne: false
                        referencedRelation: "clients"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "activities_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            sample_requests: {
                Row: {
                    id: string
                    client_id: string
                    sales_person_id: string
                    product_name: string
                    quantity: number
                    status: 'pending' | 'processing' | 'shipped'
                    shipping_address: string | null
                    completion_image_url: string | null
                    request_date: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    client_id: string
                    sales_person_id: string
                    product_name: string
                    quantity?: number
                    status?: 'pending' | 'processing' | 'shipped'
                    shipping_address?: string | null
                    completion_image_url?: string | null
                    request_date?: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    client_id?: string
                    sales_person_id?: string
                    product_name?: string
                    quantity?: number
                    status?: 'pending' | 'processing' | 'shipped'
                    shipping_address?: string | null
                    completion_image_url?: string | null
                    request_date?: string
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "sample_requests_client_id_fkey"
                        columns: ["client_id"]
                        isOneToOne: false
                        referencedRelation: "clients"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "sample_requests_sales_person_id_fkey"
                        columns: ["sales_person_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            products: {
                Row: {
                    id: string
                    name: string
                    item_code: string
                    category: 'bottle' | 'pump' | 'jar' | 'cap'
                    price: number
                    image_url: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    item_code: string
                    category: 'bottle' | 'pump' | 'jar' | 'cap'
                    price?: number
                    image_url?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    item_code?: string
                    category?: 'bottle' | 'pump' | 'jar' | 'cap'
                    price?: number
                    image_url?: string | null
                    created_at?: string
                }
                Relationships: []
            }
            orders: {
                Row: {
                    id: string
                    client_id: string
                    sales_person_id: string
                    order_date: string
                    due_date: string | null
                    total_amount: number
                    status: 'draft' | 'confirmed' | 'production' | 'shipped'
                    memo: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    client_id: string
                    sales_person_id: string
                    order_date?: string
                    due_date?: string | null
                    total_amount?: number
                    status?: 'draft' | 'confirmed' | 'production' | 'shipped'
                    memo?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    client_id?: string
                    sales_person_id?: string
                    order_date?: string
                    due_date?: string | null
                    total_amount?: number
                    status?: 'draft' | 'confirmed' | 'production' | 'shipped'
                    memo?: string | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "orders_client_id_fkey"
                        columns: ["client_id"]
                        isOneToOne: false
                        referencedRelation: "clients"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "orders_sales_person_id_fkey"
                        columns: ["sales_person_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            order_items: {
                Row: {
                    id: string
                    order_id: string
                    product_id: string
                    quantity: number
                    unit_price: number
                    subtotal: number
                }
                Insert: {
                    id?: string
                    order_id: string
                    product_id: string
                    quantity?: number
                    unit_price?: number
                    subtotal?: number
                }
                Update: {
                    id?: string
                    order_id?: string
                    product_id?: string
                    quantity?: number
                    unit_price?: number
                    subtotal?: number
                }
                Relationships: [
                    {
                        foreignKeyName: "order_items_order_id_fkey"
                        columns: ["order_id"]
                        isOneToOne: false
                        referencedRelation: "orders"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "order_items_product_id_fkey"
                        columns: ["product_id"]
                        isOneToOne: false
                        referencedRelation: "products"
                        referencedColumns: ["id"]
                    }
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            get_my_role: {
                Args: Record<PropertyKey, never>
                Returns: 'admin' | 'head' | 'sales' | 'sample_team' | 'support'
            }
        }
        Enums: {
            user_role: 'admin' | 'head' | 'sales' | 'sample_team' | 'support'
            product_category: 'bottle' | 'pump' | 'jar' | 'cap'
            order_status: 'draft' | 'confirmed' | 'production' | 'shipped'
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
