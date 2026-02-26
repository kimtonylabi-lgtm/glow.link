import { ClosingClient } from './closing-client'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function SupportClosingPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    return (
        <div className="animate-in fade-in duration-500">
            <ClosingClient />
        </div>
    )
}
