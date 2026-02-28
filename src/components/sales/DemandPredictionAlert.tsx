'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, ArrowRight, Calendar, TrendingUp } from 'lucide-react'
import { format, addDays, isBefore, differenceInDays } from 'date-fns'
import { ko } from 'date-fns/locale'
import Link from 'next/link'

interface PredictionData {
    client_id: string
    company_name: string
    predicted_interval: string // Postgres Interval string or similar
    last_order_date: string | null
}

interface DemandPredictionAlertProps {
    predictions: PredictionData[]
}

export function DemandPredictionAlert({ predictions }: DemandPredictionAlertProps) {
    // Filter predictions where the next order is expected within 14 days
    const upcoming = predictions.filter(p => {
        if (!p.last_order_date) return false

        // Parse interval (simplistic for demo, real one might need better parsing)
        const days = 90 // Default if parsing fails
        const nextDate = addDays(new Date(p.last_order_date), days)
        const today = new Date()
        const diff = differenceInDays(nextDate, today)

        return diff >= -7 && diff <= 14 // Show if overdue by a week or upcoming in 2 weeks
    }).sort((a, b) => {
        const nextA = addDays(new Date(a.last_order_date!), 90)
        const nextB = addDays(new Date(b.last_order_date!), 90)
        return nextA.getTime() - nextB.getTime()
    })

    if (upcoming.length === 0) return null

    return (
        <Card className="bg-amber-500/10 border-amber-500/50 backdrop-blur-xl mb-6 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-amber-500">
                    <AlertTriangle className="h-5 w-5" /> 재발주 제안 타이밍 (AI 예측)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {upcoming.map((item) => {
                        const nextDate = addDays(new Date(item.last_order_date!), 90)
                        const today = new Date()
                        const diff = differenceInDays(nextDate, today)
                        const isOverdue = diff < 0

                        return (
                            <Link
                                key={item.client_id}
                                href={`/dashboard/sales/activity?client=${item.client_id}`}
                                className="group bg-background/40 hover:bg-background/60 border border-amber-500/20 rounded-xl p-3 transition-all hover:scale-[1.02] hover:shadow-lg"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-sm truncate pr-2">{item.company_name}</span>
                                    <Badge variant={isOverdue ? "destructive" : "outline"} className={!isOverdue ? "text-amber-500 border-amber-500/30" : ""}>
                                        {isOverdue ? `D+${Math.abs(diff)}` : `D-${diff}`}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                    <Calendar className="h-3 w-3" />
                                    예상일: {format(nextDate, 'PPP', { locale: ko })}
                                </div>
                                <div className="mt-3 flex items-center justify-end text-[10px] font-bold text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                    활동 기록하러 가기 <ArrowRight className="ml-1 h-3 w-3" />
                                </div>
                            </Link>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
