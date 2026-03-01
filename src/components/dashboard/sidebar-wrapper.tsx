'use client'

import React from 'react'
import { useSidebar } from './SidebarContext'
import { cn } from '@/lib/utils'

export function SidebarWrapper({ children }: { children: React.ReactNode }) {
    const { isCollapsed } = useSidebar()

    return (
        <aside
            className={cn(
                "hidden md:block h-full shrink-0 z-20 transition-all duration-300 ease-in-out print:hidden",
                isCollapsed ? "w-20" : "w-64"
            )}
        >
            {children}
        </aside>
    )
}
