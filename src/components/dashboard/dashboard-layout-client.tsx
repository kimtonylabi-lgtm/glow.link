'use client'

import React, { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useSidebar } from './SidebarContext'
import { cn } from '@/lib/utils'

export function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
    const { isMobileOpen, setIsMobileOpen } = useSidebar()
    const pathname = usePathname()

    // Automatically close mobile sidebar when path changes
    useEffect(() => {
        setIsMobileOpen(false)
    }, [pathname, setIsMobileOpen])

    return (
        <>
            {/* Backdrop for Mobile Sidebar Overlay */}
            <div
                className={cn(
                    "fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-500 md:hidden",
                    isMobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
                onClick={() => setIsMobileOpen(false)}
            />

            {children}
        </>
    )
}
