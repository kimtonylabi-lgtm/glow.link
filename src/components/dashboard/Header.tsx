'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types/auth'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { LogOut, User, Bell, Menu } from 'lucide-react'

// Mapping the role enum to a readable label
const ROLE_LABELS: Record<string, string> = {
    admin: '관리자',
    head: '부서장',
    sales: '영업사원',
    sample_team: '샘플제작팀',
    support: '지원팀',
}

interface HeaderProps {
    profile: Profile | null
    onMenuClick?: () => void
}

export function Header({ profile, onMenuClick }: HeaderProps) {
    const router = useRouter()
    const supabase = createClient()
    const [isLoggingOut, setIsLoggingOut] = useState(false)

    const handleLogout = async () => {
        setIsLoggingOut(true)
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    const roleLabel = profile ? ROLE_LABELS[profile.role] : '권한 확인중'
    const displayName = profile?.full_name || 'GlowLink 사용자'
    const initials = displayName.slice(0, 2).toUpperCase()

    return (
        <header className="h-16 flex items-center justify-between px-4 md:px-6 bg-card/60 backdrop-blur-xl border-b border-border/40 sticky top-0 z-30 print:hidden">

            {/* Mobile Menu Button - Hidden on Desktop */}
            <div className="flex md:hidden items-center">
                <Button variant="ghost" size="icon" onClick={onMenuClick} className="mr-2 text-muted-foreground hover:text-primary">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle Sidebar</span>
                </Button>
            </div>

            {/* Path Breadcrumb / Title Area */}
            <div className="flex-1 flex items-center">
                <h1 className="text-sm md:text-base font-semibold text-foreground tracking-tight hidden md:block">
                    GlowLink Dashboard
                </h1>
            </div>

            {/* Actions & Profile */}
            <div className="flex items-center gap-3 md:gap-4">

                {/* Notifications (Mock) */}
                <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-primary transition-colors">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-2 right-2 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary shadow-[0_0_10px_theme(colors.primary.DEFAULT)/80]"></span>
                    </span>
                </Button>

                {/* User Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-9 rounded-full pl-2 pr-4 flex items-center gap-3 border border-border/40 bg-background/50 hover:bg-muted/50 transition-all hover:border-primary/40 group">
                            <Avatar className="h-6 w-6">
                                <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold ring-1 ring-primary/40">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col items-start translate-y-[1px]">
                                <span className="text-xs font-semibold leading-none text-foreground group-hover:text-primary transition-colors">
                                    {displayName}
                                </span>
                                <span className="text-[10px] text-muted-foreground mt-1 font-medium bg-primary/10 px-1.5 rounded-sm text-primary/80">
                                    {roleLabel}
                                </span>
                            </div>
                        </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent className="w-56 bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{displayName}</p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    {profile?.email}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-border/50" />
                        <DropdownMenuItem className="gap-2 cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors focus:bg-primary/10 focus:text-primary">
                            <User className="h-4 w-4" />
                            <span>내 권한: {roleLabel}</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-border/50" />
                        <DropdownMenuItem
                            className="gap-2 cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-400/10 focus:text-red-300 focus:bg-red-400/10 transition-colors"
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                        >
                            <LogOut className="h-4 w-4" />
                            <span>{isLoggingOut ? '로그아웃 중...' : '로그아웃'}</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
