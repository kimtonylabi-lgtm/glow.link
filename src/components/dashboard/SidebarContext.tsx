'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface SidebarContextType {
    isCollapsed: boolean
    toggleSidebar: () => void
    isMobileOpen: boolean
    setIsMobileOpen: (open: boolean) => void
    toggleMobileSidebar: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [isMobileOpen, setIsMobileOpen] = useState(false)

    // Load state from localStorage if available
    useEffect(() => {
        const saved = localStorage.getItem('sidebar-collapsed')
        if (saved !== null) {
            setIsCollapsed(saved === 'true')
        }
    }, [])

    const toggleSidebar = () => {
        setIsCollapsed(prev => {
            const next = !prev
            localStorage.setItem('sidebar-collapsed', String(next))
            return next
        })
    }

    const toggleMobileSidebar = () => {
        setIsMobileOpen(prev => !prev)
    }

    return (
        <SidebarContext.Provider value={{
            isCollapsed,
            toggleSidebar,
            isMobileOpen,
            setIsMobileOpen,
            toggleMobileSidebar
        }}>
            {children}
        </SidebarContext.Provider>
    )
}

export function useSidebar() {
    const context = useContext(SidebarContext)
    if (context === undefined) {
        throw new Error('useSidebar must be used within a SidebarProvider')
    }
    return context
}
