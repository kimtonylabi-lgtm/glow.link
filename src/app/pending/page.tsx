import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { LogOut, Clock } from 'lucide-react'
import { logout } from '@/app/(auth)/actions'

export const dynamic = 'force-dynamic'

export default async function PendingPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Check if user is actually pending to prevent authorized users from getting stuck here if they manually navigate
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile && profile.role !== 'pending') {
        redirect('/dashboard')
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 overflow-hidden relative selection:bg-primary/30">
            {/* Background ambient lighting */}
            <div className="absolute top-[-20%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-primary/5 blur-[120px] pointer-events-none -z-10" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-accent/5 blur-[120px] pointer-events-none -z-10" />

            <div className="max-w-md w-full space-y-8 text-center bg-card/60 backdrop-blur-xl border border-border/40 p-8 rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-500">
                <div className="flex justify-center">
                    <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center p-4 ring-1 ring-primary/20">
                        <Clock className="h-10 w-10 text-primary animate-pulse" />
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        승인 대기 중
                    </h1>
                    <p className="text-muted-foreground leading-relaxed">
                        현재 관리자의 가입 승인을 대기 중입니다.<br />
                        승인이 완료되면 대시보드 접근이 가능합니다.
                    </p>
                </div>

                <div className="pt-6">
                    <form action={logout}>
                        <Button
                            type="submit"
                            variant="outline"
                            className="w-full gap-2 border-border/40 hover:bg-red-400/10 hover:text-red-400 hover:border-red-400/40 transition-all duration-300"
                        >
                            <LogOut className="h-4 w-4" />
                            로그아웃
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    )
}
