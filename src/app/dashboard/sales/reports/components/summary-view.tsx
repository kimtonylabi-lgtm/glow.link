'use client'

import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, Users, FlaskConical, Briefcase } from "lucide-react"

interface SummaryViewProps {
    data: {
        totalRevenue: number
        activityCount: number
        sampleCount: number
    }
}

export function SummaryView({ data }: SummaryViewProps) {
    const items = [
        {
            label: "총 수주 매출",
            value: `₩ ${data.totalRevenue.toLocaleString('ko-KR')}`,
            icon: TrendingUp,
            color: "text-blue-600",
            bgColor: "bg-blue-50"
        },
        {
            label: "영업 활동수",
            value: `${data.activityCount}건`,
            icon: Briefcase,
            color: "text-purple-600",
            bgColor: "bg-purple-50"
        },
        {
            label: "샘플 발송수",
            value: `${data.sampleCount}건`,
            icon: FlaskConical,
            color: "text-emerald-600",
            bgColor: "bg-emerald-50"
        }
    ]

    return (
        <div className="grid grid-cols-3 gap-6 break-inside-avoid">
            {items.map((item, idx) => (
                <div key={idx} className="flex flex-col gap-2 p-6 border-2 border-slate-100 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-md ${item.bgColor} print:bg-slate-50`}>
                            <item.icon className={`w-5 h-5 ${item.color}`} />
                        </div>
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-tight">{item.label}</span>
                    </div>
                    <p className="text-3xl font-black text-slate-950 tracking-tight">{item.value}</p>
                </div>
            ))}
        </div>
    )
}
