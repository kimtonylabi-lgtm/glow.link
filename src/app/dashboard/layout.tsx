import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { Header } from '@/components/dashboard/Header'
import { Profile } from '@/types/auth'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'
import { RealtimeListener } from '@/components/dashboard/realtime-listener'

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

    // Default to 'sales' if profile is not found (fallback)
    const currentProfile: Profile = profile as unknown as Profile || {
        id: user.id,
        email: user.email || '',
        role: 'sales',
        full_name: user.user_metadata?.full_name || null,
        department: null,
        created_at: new Date().toISOString()
    }

    return (
        <div className="flex h-screen overflow-hidden bg-background text-foreground relative selection:bg-primary/30">
            <RealtimeListener />

            {/* Background ambient lighting */}
            <div className="absolute top-[-20%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-primary/5 blur-[120px] pointer-events-none -z-10" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-accent/5 blur-[120px] pointer-events-none -z-10" />

            {/* Desktop Sidebar (Hidden on Mobile) */}
            <aside className="hidden md:block h-full shrink-0 z-20">
                <Sidebar userRole={currentProfile.role} />
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden z-10">

                {/* Mobile Sidebar & Header Wrap */}
                <div className="relative z-30 flex items-center bg-card/60 backdrop-blur-xl border-b border-border/40 md:border-none md:bg-transparent">

                    {/* Mobile Sidebar Sheet */}
                    <div className="md:hidden flex items-center pl-4 py-3">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary transition-colors">
                                    <Menu className="h-6 w-6" />
                                    <span className="sr-only">Toggle menu</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="p-0 bg-transparent border-none w-64 shadow-[20px_0_50px_rgba(0,0,0,0.5)]">
                                <SheetTitle className="sr-only">내비게이션 메뉴</SheetTitle>
                                <Sidebar userRole={currentProfile.role} />
                            </SheetContent>
                        </Sheet>
                    </div>

                    <div className="flex-1 md:w-full">
                        <Header profile={currentProfile} />
                    </div>
                </div>

                {/* Scrollable Children */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                    {children}
                </main>
            </div>
        </div>
    )
}
