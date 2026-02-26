import { cn } from "@/lib/utils"

interface CustomBadgeProps {
    variant: 'S' | 'A' | 'B' | 'C'
    className?: string
}

export function CustomBadge({ variant, className }: CustomBadgeProps) {
    const getVariants = (tier: string) => {
        switch (tier) {
            case 'S':
                return 'bg-purple-500/20 text-purple-400 border border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.5)]'
            case 'A':
                return 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.5)]'
            case 'B':
                return 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
            case 'C':
            default:
                return 'bg-slate-500/20 text-slate-400 border border-slate-500/50'
        }
    }

    return (
        <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap", getVariants(variant), className)}>
            {variant} 등급
        </span>
    )
}
