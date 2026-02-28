import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { Header } from '@/components/dashboard/Header'
import { Profile } from '@/types/auth'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'
import { RealtimeListener } from '@/components/dashboard/realtime-listener'
import { MobileSidebar } from '@/components/dashboard/mobile-sidebar'

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
        <div className="flex h-screen overflow-hidden bg-background text-foreground relative selection:bg-primary/30 print:h-auto print:overflow-visible print:bg-white print:text-black">
            <RealtimeListener />

            {/* Background ambient lighting */}
            <div className="absolute top-[-20%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-primary/5 blur-[120px] pointer-events-none -z-10 print:hidden" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-accent/5 blur-[120px] pointer-events-none -z-10 print:hidden" />

            {/* Desktop Sidebar (Hidden on Mobile) */}
            <aside className="hidden md:block h-full shrink-0 z-20 print:hidden">
                <Sidebar userRole={currentProfile.role} />
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden z-10 print:h-auto print:overflow-visible print:block">

                {/* Mobile Sidebar & Header Wrap */}
                <div className="relative z-30 flex items-center bg-card/60 backdrop-blur-xl border-b border-border/40 md:border-none md:bg-transparent print:hidden">

                    {/* Mobile Sidebar (Handles auto-close on navigation) */}
                    <MobileSidebar userRole={currentProfile.role} />

                    <div className="flex-1 md:w-full">
                        <Header profile={currentProfile} />
                    </div>
                </div>

                {/* Scrollable Children */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar print:p-0 print:overflow-visible print:h-auto print:block">
                    {children}
                </main>
            </div>
        </div>
    )
}
