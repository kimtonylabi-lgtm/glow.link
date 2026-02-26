'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { User } from '@supabase/supabase-js'

export function useRealtimeNotifications() {
    const supabase = createClient()
    const [user, setUser] = useState<User | null>(null)

    useEffect(() => {
        // Fetch current user
        const getUser = async () => {
            const { data } = await supabase.auth.getUser()
            setUser(data.user)
        }
        getUser()

        // Listen to auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null)
        })

        return () => subscription.unsubscribe()
    }, [supabase])

    useEffect(() => {
        if (!user) return

        // Subscribe to sample_requests changes
        // Using filter to only receive events related to this user
        const channel = supabase
            .channel('schema-db-changes')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'sample_requests',
                    filter: `sales_person_id=eq.${user.id}`,
                },
                (payload) => {
                    const newRow = payload.new
                    const oldRow = payload.old

                    // Trigger notification only if status changes to 'shipped'
                    if (newRow.status === 'shipped' && oldRow.status !== 'shipped') {
                        toast.success(`✅ [${newRow.product_name}] 샘플이 발송되었습니다!`, {
                            duration: 5000,
                            position: 'bottom-right',
                            className: 'border-primary/50 bg-card/90 backdrop-blur-md'
                        })
                    }
                }
            )
            .subscribe((status, err) => {
                if (err) {
                    console.error('Realtime subscription error:', err)
                }
            })

        return () => {
            supabase.removeChannel(channel)
        }
    }, [user, supabase])
}
