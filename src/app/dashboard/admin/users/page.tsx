import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminUsersClient } from './page.client'
import { Profile } from '@/types/auth'

export default async function AdminUsersPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    // Checking if user is admin or head (Only admin can edit, but Head might view)
    // The requirement says Admin User Management, so let's restrict to 'admin'
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        redirect('/dashboard')
    }

    // Fetch all profiles
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching profiles:', error)
    }

    return <AdminUsersClient initialProfiles={(profiles as Profile[]) || []} currentUserId={user.id} />
}
