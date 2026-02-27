'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'
import { UserRole } from '@/types/auth'

interface MobileSidebarProps {
    userRole: UserRole
}

export function MobileSidebar({ userRole }: MobileSidebarProps) {
    const [isOpen, setIsOpen] = useState(false)
    const pathname = usePathname()

    // Automatically close sidebar when pathname changes (Bug #5)
    useEffect(() => {
        setIsOpen(false)
    }, [pathname])

    return (
        <div className="md:hidden flex items-center pl-4 py-3">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary transition-colors">
                        <Menu className="h-6 w-6" />
                        <span className="sr-only">Toggle menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 bg-transparent border-none w-64 shadow-[20px_0_50px_rgba(0,0,0,0.5)]">
                    <SheetTitle className="sr-only">내비게이션 메뉴</SheetTitle>
                    <Sidebar userRole={userRole} />
                </SheetContent>
            </Sheet>
        </div>
    )
}
