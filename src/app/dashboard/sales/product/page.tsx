import { createClient } from '@/lib/supabase/server'
import { ProductGrid } from './product-grid'
import { ProductForm } from './product-form'

export const dynamic = 'force-dynamic'

export default async function ProductPage() {
    const supabase = await createClient()

    const { data: productsData, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

    const { data: { user } } = await supabase.auth.getUser()

    let userRole = 'sales'
    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()
        userRole = profile?.role || 'sales'
    }
    const products = productsData || []

    return (
        <div className="p-4 md:p-6 lg:p-8 relative min-h-[80vh]">
            {/* Decorative Lights */}
            <div className="absolute top-20 right-10 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />
            <div className="absolute bottom-20 left-10 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

            <div className="flex justify-end mb-6 sticky top-4 z-20">
                <ProductForm />
            </div>

            <ProductGrid initialProducts={products} userRole={userRole} />
        </div>
    )
}
