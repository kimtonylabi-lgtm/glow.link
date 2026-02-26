import { Loader2 } from 'lucide-react'

export default function DashboardLoading() {
    return (
        <div className="h-full w-full min-h-[60vh] flex flex-col items-center justify-center opacity-80 animate-in fade-in duration-700">
            <div className="relative flex items-center justify-center">
                {/* Outer Glow Ring */}
                <div className="absolute w-20 h-20 rounded-full border border-primary/30 animate-ping opacity-75" />

                {/* Inner Spinner */}
                <div className="w-12 h-12 rounded-full border-t-2 border-r-2 border-primary animate-spin" />

                {/* Center Core */}
                <div className="absolute w-6 h-6 rounded-full bg-primary/20 backdrop-blur-sm" />
            </div>
            <p className="mt-8 text-sm font-medium text-muted-foreground animate-pulse tracking-widest">
                데이터를 동기화 중입니다...
            </p>
        </div>
    )
}
