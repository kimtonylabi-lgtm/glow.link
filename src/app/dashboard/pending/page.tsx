'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2, Clock, LogOut } from 'lucide-react'
import { useState } from 'react'

export default function PendingPage() {
    const router = useRouter()
    const supabase = createClient()
    const [isLoggingOut, setIsLoggingOut] = useState(false)

    const handleSignOut = async () => {
        setIsLoggingOut(true)
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />

            <Card className="max-w-md w-full border-border/40 shadow-2xl backdrop-blur-xl bg-card/60">
                <CardHeader className="text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/20 animate-pulse">
                        <Clock className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">승인 대기 중</CardTitle>
                    <CardDescription>
                        계정이 생성되었습니다. 관리자의 입원 승인을 기다리고 있습니다.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        GlowLink B2B 시스템 보안 정책에 따라, 신규 직원은 관리자의 승인 절차를 거친 후 대시보드 접근 권한이 부여됩니다.
                    </p>
                    <div className="p-4 bg-muted/40 rounded-lg border border-border/40 text-xs text-left">
                        <p className="font-semibold mb-1">다음 단계:</p>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                            <li>관리자가 고객님의 정보를 확인합니다.</li>
                            <li>적절한 직책(Role)이 부여됩니다.</li>
                            <li>승인 완료 시 모든 메뉴를 이용할 수 있습니다.</li>
                        </ul>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleSignOut}
                        disabled={isLoggingOut}
                    >
                        {isLoggingOut ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LogOut className="w-4 h-4 mr-2" />}
                        로그아웃 후 다시 로그인
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
