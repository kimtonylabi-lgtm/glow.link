import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { Header } from '@/components/dashboard/Header'
import { Profile } from '@/types/auth'
import { RealtimeListener } from '@/components/dashboard/realtime-listener'
import { DashboardMain } from '@/components/dashboard/dashboard-main'
import { SidebarProvider } from '@/components/dashboard/SidebarContext'
import { DashboardLayoutClient } from '@/components/dashboard/dashboard-layout-client'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch user profile to determine role
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

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
                        <div className="relative z-30 flex items-center bg-card/60 backdrop-blur-xl border-b border-border/40 lg:border-none lg:bg-transparent print:hidden">
                            <div className="flex-1 lg:w-full">
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
