import { SettingsClient } from './settings-client'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminSettingsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    // Role check
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || profile.role !== 'admin') {
        redirect('/dashboard')
    }

    return (
        <div className="animate-in fade-in duration-500">
            <SettingsClient />
        </div>
    )
}
