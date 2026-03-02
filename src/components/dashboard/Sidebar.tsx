'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserRole } from '@/types/auth'
import { cn } from '@/lib/utils'
import { useSidebar } from './SidebarContext'
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
    PackageSearch,
    ChevronLeft,
    ChevronRight
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

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
    { title: '수주/납기', href: '/dashboard/sales/order', icon: ShoppingCart, roles: ['admin', 'head', 'sales'] },
    { title: '샘플요청', href: '/dashboard/sales/sample', icon: FlaskConical, roles: ['admin', 'head', 'sales'] },
    { title: '업무보고 (Reports)', href: '/dashboard/sales/reports', icon: FileText, roles: ['admin', 'head', 'sales'] },

    // Sample Team workspace
    { title: '목록 (칸반 보드)', href: '/dashboard/sample_team', icon: Inbox, roles: ['admin', 'head', 'sample_team'] },

    // Support workspace
    { title: '출하 지시', href: '/dashboard/support/shipping', icon: Truck, roles: ['admin', 'head', 'support'] },
    { title: '매출 마감', href: '/dashboard/support/closing', icon: CheckSquare, roles: ['admin', 'head', 'support'] },

    // Global User Details
    { title: '내 정보 및 설정', href: '/dashboard/settings', icon: Settings, roles: ['admin', 'head', 'sales', 'sample_team', 'support'] },
]

// Custom Streamlined Neon Wing Toggle Icon (Exported for Header use)
export const CustomToggleIcon = ({ className, isOpen }: { className?: string, isOpen?: boolean }) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("transition-all duration-500 ease-in-out", className, isOpen ? "rotate-180" : "")}
    >
        {/* Streamlined sharp wing shape (Pointing RIGHT by default) */}
        <path
            d="M8 4C14 8 14 16 8 20"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-40"
        />
        <path
            d="M14 4C20 8 20 16 14 20"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
)

export function Sidebar({ userRole }: { userRole: UserRole }) {
    const pathname = usePathname()
    const { isCollapsed, toggleSidebar, isMobileOpen, toggleMobileSidebar } = useSidebar()

    // Filter nav items based on user role
    const filteredNavItems = navItems.filter(item => item.roles.includes(userRole))

    return (
        <TooltipProvider delayDuration={0}>
            <div className={cn(
                "h-full flex flex-col bg-card/40 backdrop-blur-3xl border-r border-border/40 transition-all duration-500 ease-in-out",
                // Mobile layout: Fixed overlay
                "fixed inset-y-0 left-0 z-50 w-64 lg:relative lg:translate-x-0 print:hidden",
                isMobileOpen ? "translate-x-0 shadow-[20px_0_50px_rgba(0,0,0,0.5)]" : "-translate-x-full",
                // Desktop layout: Collapsible
                isCollapsed ? "lg:w-20" : "lg:w-64"
            )}>
                {/* Brand area */}
                <div className="h-16 flex items-center px-4 border-b border-border/40 shrink-0 justify-between gap-2 overflow-hidden">
                    <Link href="/dashboard" className={cn(
                        "flex items-center gap-2 group transition-opacity duration-300",
                        isCollapsed ? "lg:opacity-0 lg:pointer-events-none" : "opacity-100"
                    )}>
                        <div className="w-8 h-8 rounded-lg bg-card border border-primary/40 flex items-center justify-center shadow-[0_0_10px_theme(colors.primary.DEFAULT)/30] group-hover:shadow-[0_0_15px_theme(colors.primary.DEFAULT)/50] transition-shadow shrink-0">
                            <span className="font-bold text-primary text-sm">GL</span>
                        </div>
                        <span className="font-bold text-lg tracking-tight group-hover:text-primary transition-colors hover:text-shadow-[0_0_10px_theme(colors.primary.DEFAULT)/50] whitespace-nowrap overflow-hidden">
                            GlowLink
                        </span>
                    </Link>

                    {/* Desktop Toggle Button (Internal) - Hidden on Mobile */}
                    <button
                        onClick={toggleSidebar}
                        className={cn(
                            "hidden lg:flex p-2 rounded-xl transition-all active:scale-90 group/toggle shrink-0",
                            "text-primary/70 hover:text-blue-400 hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]",
                            "bg-primary/5 hover:bg-blue-500/10 border border-primary/20 hover:border-blue-400/50",
                            isCollapsed ? "mx-auto" : ""
                        )}
                        title={isCollapsed ? "펼치기" : "접기"}
                    >
                        <CustomToggleIcon className="w-6 h-6" isOpen={!isCollapsed} />
                    </button>

                    {/* Mobile Close Button (Internal - Wing Style) - Only visible when open on mobile */}
                    <button
                        onClick={toggleMobileSidebar}
                        className="lg:hidden p-2 rounded-xl text-primary/70 border border-primary/20 bg-primary/5"
                    >
                        <CustomToggleIcon className="w-6 h-6" isOpen={true} />
                    </button>
                </div>

                {/* Navigation Links */}
                <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Link
                                href="/dashboard"
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                                    isCollapsed ? "justify-center px-2" : "",
                                    pathname === '/dashboard'
                                        ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_theme(colors.primary.DEFAULT)/15]"
                                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                )}
                            >
                                <LayoutDashboard className={cn(
                                    "w-5 h-5 shrink-0",
                                    pathname === '/dashboard' ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                                )} />
                                {!isCollapsed && <span className="animate-in fade-in slide-in-from-left-2 duration-300">홈</span>}
                            </Link>
                        </TooltipTrigger>
                        {isCollapsed && <TooltipContent side="right">홈</TooltipContent>}
                    </Tooltip>

                    {!isCollapsed && (
                        <div className="pt-4 pb-2 px-3 text-[10px] font-black text-muted-foreground/60 tracking-widest uppercase animate-in fade-in duration-300">
                            Main Menu
                        </div>
                    )}
                    {isCollapsed && <div className="h-px bg-border/20 my-4" />}

                    {filteredNavItems.map((item) => {
                        const isActive = pathname.startsWith(item.href)

                        return (
                            <Tooltip key={item.href}>
                                <TooltipTrigger asChild>
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                                            isCollapsed ? "justify-center px-2" : "",
                                            isActive
                                                ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_theme(colors.primary.DEFAULT)/15]"
                                                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                        )}
                                    >
                                        <item.icon className={cn(
                                            "w-5 h-5 shrink-0",
                                            isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                                        )} />
                                        {!isCollapsed && <span className="animate-in fade-in slide-in-from-left-2 duration-300">{item.title}</span>}
                                    </Link>
                                </TooltipTrigger>
                                {isCollapsed && <TooltipContent side="right">{item.title}</TooltipContent>}
                            </Tooltip>
                        )
                    })}
                </div>
            </div>
        </TooltipProvider>
    )
}
