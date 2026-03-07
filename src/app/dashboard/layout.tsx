import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { Header } from '@/components/dashboard/Header'
import { Profile } from '@/types/auth'
import { RealtimeListener } from '@/components/dashboard/realtime-listener'
import { DashboardMain } from '@/components/dashboard/dashboard-main'
import { SidebarProvider } from '@/components/dashboard/SidebarContext'
import { DashboardLayoutClient } from '@/components/dashboard/dashboard-layout-client'
import { getCurrentUserWithProfile } from '@/lib/supabase/queries'

// [최적화] force-dynamic 제거: cookies() 사용으로 Next.js가 자동으로 dynamic 처리
// React cache()를 적용한 getCurrentUserWithProfile로 DB 중복 호출 차단

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // [핵심 최적화] 동일 요청 내 getUser() + getProfile() 이중 DB 왕복 → 캐시로 1번으로 통합
    const { user, profile } = await getCurrentUserWithProfile()

    if (!user) {
        redirect('/login')
    }

    // Redirect to pending if no profile (race condition defense) or if role is pending
    if (!profile || profile.role === 'pending') {
        return redirect('/pending')
    }

    const currentProfile: Profile = profile as unknown as Profile

    return (
        <SidebarProvider>
            <DashboardLayoutClient>
                <div className="flex h-screen overflow-hidden bg-background text-foreground relative selection:bg-primary/30 print:h-auto print:overflow-visible print:bg-white print:text-black">
                    <RealtimeListener />

                    {/* Background ambient lighting */}
                    <div className="absolute top-[-20%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-primary/5 blur-[120px] pointer-events-none -z-10 print:hidden" />
                    <div className="absolute bottom-[-20%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-accent/5 blur-[120px] pointer-events-none -z-10 print:hidden" />

                    {/* Unified Sidebar (Fixed on Mobile, Relative on Desktop) */}
                    <Sidebar userRole={currentProfile.role} />

                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden z-10 print:h-auto print:overflow-visible print:block">

                        {/* Top Header Wrap */}
                        <div className="relative z-30 flex items-center bg-card/60 backdrop-blur-xl border-b border-border/40 md:border-none md:bg-transparent print:hidden">
                            <div className="flex-1 md:w-full">
                                <Header profile={currentProfile} />
                            </div>
                        </div>

                        {/* Scrollable Children Wrapped in Client Component for path-based classes */}
                        <DashboardMain>
                            {children}
                        </DashboardMain>
                    </div>
                </div>
            </DashboardLayoutClient>
        </SidebarProvider>
    )
}
