'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Target, Briefcase, Users, ShoppingCart, FlaskConical, FileText } from 'lucide-react'

const salesTabs = [
    { name: '영업기획', href: '/dashboard/sales/planning', icon: Target },
    { name: '활동관리', href: '/dashboard/sales/activity', icon: Briefcase },
    { name: 'CRM(고객)', href: '/dashboard/sales/crm', icon: Users },
    { name: '수주/매출 관리', href: '/dashboard/sales/order', icon: ShoppingCart },
    { name: '샘플요청', href: '/dashboard/sales/sample', icon: FlaskConical },
    { name: '업무보고', href: '/dashboard/sales/reports', icon: FileText },
]

export default function SalesLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()

    const isReportPage = pathname === '/dashboard/sales/reports'

    return (
        <div className={cn("flex flex-col h-full", isReportPage ? "gap-0" : "gap-6")}>
            {!isReportPage && (
                <div className="border-b border-border/40 pb-1 w-full bg-card/10 backdrop-blur-sm sticky top-0 z-20">
                    <ScrollArea className="w-full whitespace-nowrap">
                        <div className="flex w-max space-x-2 p-1">
                            {salesTabs.map((tab) => {
                                const isActive = pathname.startsWith(tab.href)
                                return (
                                    <Link
                                        key={tab.href}
                                        href={tab.href}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-2.5 rounded-t-lg transition-all relative overflow-hidden group min-w-32 justify-center",
                                            isActive
                                                ? "text-primary"
                                                : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                                        )}
                                    >
                                        {/* Glowing background hint */}
                                        {isActive && (
                                            <div className="absolute inset-0 bg-primary/10 -z-10 transition-opacity" />
                                        )}
                                        <tab.icon className={cn("w-4 h-4", isActive ? "text-primary drop-shadow-[0_0_8px_theme(colors.primary.DEFAULT)]" : "")} />
                                        <span className={cn("font-medium text-sm", isActive && "drop-shadow-[0_0_8px_theme(colors.primary.DEFAULT)]")}>
                                            {tab.name}
                                        </span>

                                        {/* Bottom Neon Line */}
                                        <div
                                            className={cn(
                                                "absolute bottom-0 left-0 w-full h-[3px] transition-all duration-300",
                                                isActive
                                                    ? "bg-primary shadow-[0_0_15px_theme(colors.primary.DEFAULT)] scale-x-100"
                                                    : "bg-transparent scale-x-0 group-hover:bg-primary/50 group-hover:scale-x-75"
                                            )}
                                        />
                                    </Link>
                                )
                            })}
                        </div>
                        <ScrollBar orientation="horizontal" className="invisible" />
                    </ScrollArea>
                </div>
            )}

            {/* Sales Modules Content */}
            <div className="flex-1 min-h-0">
                {children}
            </div>
        </div>
    )
}
