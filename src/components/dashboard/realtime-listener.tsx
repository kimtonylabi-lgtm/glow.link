'use client'

import { useRealtimeNotifications } from '@/hooks/use-realtime-notifications'

export function RealtimeListener() {
    useRealtimeNotifications()
    return null
}
