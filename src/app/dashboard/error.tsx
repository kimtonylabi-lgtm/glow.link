'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCcw } from 'lucide-react'

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Dashboard Error Boundary Caught:', error)
    }, [error])

    return (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] p-8 text-center animate-in fade-in duration-500">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20 relative">
                <AlertCircle className="w-8 h-8 text-red-500" />
                <div className="absolute inset-0 rounded-full border border-red-500/50 animate-ping opacity-20" />
            </div>

            <h2 className="text-2xl font-bold tracking-tight mb-2">오류가 발생했습니다</h2>
            <p className="text-muted-foreground max-w-[500px] mb-8">
                화면을 렌더링하거나 데이터를 불러오는 도중 예상치 못한 문제가 발생했습니다.
                <br />
                네트워크 상태를 확인하시거나 아래 버튼을 눌러 다시 시도해주세요.
            </p>

            <Button
                onClick={() => reset()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-all hover:shadow-[0_0_25px_rgba(168,85,247,0.7)]"
            >
                <RefreshCcw className="w-4 h-4 mr-2" />
                다시 시도하기
            </Button>
        </div>
    )
}
