'use client'

import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export function DashboardMain({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const isReportPage = pathname === '/dashboard/sales/reports'

    return (
        <main className={cn(
            "flex-1 overflow-y-auto custom-scrollbar print:p-0 print:overflow-visible print:h-auto print:block",
            isReportPage ? "p-0" : "p-4 md:p-8"
        )}>
            {children}
        </main>
    )
}
