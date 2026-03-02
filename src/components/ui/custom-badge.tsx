import { cn } from "@/lib/utils"

interface CustomBadgeProps {
    variant: 'S' | 'A' | 'B' | 'C' | 'active' | 'inactive'
    children?: React.ReactNode
    className?: string
}

export function CustomBadge({ variant, children, className }: CustomBadgeProps) {
    const getVariants = (type: string) => {
        switch (type) {
            case 'S':
                return 'bg-purple-500/20 text-purple-400 border border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.5)]'
            case 'A':
                return 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.5)]'
            case 'B':
                return 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
            case 'active':
                return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
            case 'inactive':
                return 'bg-slate-500/20 text-slate-400 border border-slate-500/50'
            case 'C':
            default:
                return 'bg-slate-500/20 text-slate-400 border border-slate-500/50'
        }
    }

    const getDefaultLabel = (type: string) => {
        if (['S', 'A', 'B', 'C'].includes(type)) return `${type} 등급`
        if (type === 'active') return 'ACTIVE'
        if (type === 'inactive') return 'INACTIVE'
        return type
    }

    return (
        <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-black whitespace-nowrap tracking-wider uppercase", getVariants(variant), className)}>
            {children || getDefaultLabel(variant)}
        </span>
    )
}
