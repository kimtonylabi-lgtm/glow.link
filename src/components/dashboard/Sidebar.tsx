'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserRole } from '@/types/auth'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    Users,
    Settings,
    BarChart3,
    Target,
    FileText,
    Briefcase,
    ShoppingCart,
    FlaskConical,
    Inbox,
    History,
    Truck,
    CheckSquare,
    PackageSearch
} from 'lucide-react'

interface NavItem {
    title: string
    href: string
    icon: React.ElementType
    roles: UserRole[]
}

const navItems: NavItem[] = [
    // Admin only
    { title: '사용자 관리', href: '/dashboard/admin/users', icon: Users, roles: ['admin'] },
    { title: '시스템 설정', href: '/dashboard/admin/settings', icon: Settings, roles: ['admin'] },

    // Head & Admin Dashboard
    { title: '통합 지표 분석 (대시보드)', href: '/dashboard/head', icon: BarChart3, roles: ['admin', 'head'] },

    // Sales workspace
    { title: '영업기획', href: '/dashboard/sales/planning', icon: Target, roles: ['admin', 'head', 'sales'] },
    { title: '영업활동', href: '/dashboard/sales/activity', icon: Briefcase, roles: ['admin', 'head', 'sales'] },
    { title: '고객관리 (CRM)', href: '/dashboard/sales/crm', icon: Users, roles: ['admin', 'head', 'sales'] },
    { title: '제품관리 (Product)', href: '/dashboard/sales/product', icon: PackageSearch, roles: ['admin', 'head', 'sales'] },
    { title: '수주/납기', href: '/dashboard/sales/order', icon: ShoppingCart, roles: ['admin', 'head', 'sales'] },
    { title: '샘플요청', href: '/dashboard/sales/sample', icon: FlaskConical, roles: ['admin', 'head', 'sales'] },

    // Sample Team workspace
    { title: '목록 (칸반 보드)', href: '/dashboard/sample_team', icon: Inbox, roles: ['admin', 'head', 'sample_team'] },

    // Support workspace
    { title: '출하 지시', href: '/dashboard/support/shipping', icon: Truck, roles: ['admin', 'head', 'support'] },
    { title: '매출 마감', href: '/dashboard/support/closing', icon: CheckSquare, roles: ['admin', 'head', 'support'] },

    // Global User Details
    { title: '내 정보 및 설정', href: '/dashboard/settings', icon: Settings, roles: ['admin', 'head', 'sales', 'sample_team', 'support'] },
]

export function Sidebar({ userRole }: { userRole: UserRole }) {
    const pathname = usePathname()

    // Filter nav items based on user role
    const filteredNavItems = navItems.filter(item => item.roles.includes(userRole))

    return (
        <div className="h-full flex flex-col bg-card/40 backdrop-blur-xl border-r border-border/40 w-64">
            {/* Brand area */}
            <div className="h-16 flex items-center px-6 border-b border-border/40 shrink-0">
                <Link href="/dashboard" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-lg bg-card border border-primary/40 flex items-center justify-center shadow-[0_0_10px_theme(colors.primary.DEFAULT)/30] group-hover:shadow-[0_0_15px_theme(colors.primary.DEFAULT)/50] transition-shadow">
                        <span className="font-bold text-primary text-sm">GL</span>
                    </div>
                    <span className="font-bold text-lg tracking-tight group-hover:text-primary transition-colors hover:text-shadow-[0_0_10px_theme(colors.primary.DEFAULT)/50]">
                        GlowLink
                    </span>
                </Link>
            </div>

            {/* Navigation Links */}
            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                <Link
                    href="/dashboard"
                    className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                        pathname === '/dashboard'
                            ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_theme(colors.primary.DEFAULT)/15]"
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                >
                    <LayoutDashboard className={cn(
                        "w-5 h-5",
                        pathname === '/dashboard' ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )} />
                    홈
                </Link>

                <div className="pt-4 pb-2 px-3 text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                    Menu
                </div>

                {filteredNavItems.map((item) => {
                    const isActive = pathname.startsWith(item.href)

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                                isActive
                                    ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_theme(colors.primary.DEFAULT)/15]"
                                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                            )}
                        >
                            <item.icon className={cn(
                                "w-5 h-5",
                                isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                            )} />
                            {item.title}
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
