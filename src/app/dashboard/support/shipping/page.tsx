import { ShippingClient } from './shipping-client'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function SupportShippingPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    return (
        <div className="animate-in fade-in duration-500">
            <ShippingClient />
        </div>
    )
}
