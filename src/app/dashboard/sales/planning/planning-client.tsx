'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { getSalesPlanning, upsertTargetAmount } from './actions'
import { toast } from 'sonner'
import { format, subMonths, addMonths } from 'date-fns'
import {
    ChevronLeft,
    ChevronRight,
    Loader2,
    Target,
    TrendingUp,
    Info,
    LayoutTemplate,
    AlertCircle,
    ArrowRight,
    FileText,
    Users,
    Zap
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

import { ActivityWithRelations } from '@/types/crm'
import { SalesKanban } from '@/components/sales/SalesKanban'

interface Props {
    activities: ActivityWithRelations[]
}

import {
    ResponsiveContainer,
    RadialBarChart,
    RadialBar,
    PolarAngleAxis,
} from 'recharts'
import { MonthlyGoalModal } from './MonthlyGoalModal'

export function PlanningClient({ activities: initialActivities }: Props) {
    // KST Time Logic
    const getKSTNow = () => {
        const now = new Date()
        return new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }))
    }

    const kstNow = getKSTNow()
    const initialMonthStr = format(kstNow, 'yyyy-MM')

    const [currentMonth, setCurrentMonth] = useState<Date>(kstNow)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    // Data states
    const [targetAmount, setTargetAmount] = useState<number>(0)
    const [actualAmount, setActualAmount] = useState<number>(0)
    const [percentage, setPercentage] = useState<number>(0)
    const [pipelineStats, setPipelineStats] = useState<Record<string, number>>({})
    const [predictions, setPredictions] = useState<any[]>([])

    const monthStr = format(currentMonth, 'yyyy-MM')

    const fetchData = async () => {
        setIsLoading(true)
        try {
            const result = await getSalesPlanning(monthStr)
            setTargetAmount(result.target)
            setActualAmount(result.actual)
            setPercentage(result.percentage)
            setPipelineStats(result.pipelineStats)
            setPredictions(result.predictions)
        } catch (error) {
            console.error(error)
            toast.error('영업 데이터를 불러오지 못했습니다.')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [monthStr])

    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

    const isOverAchieved = percentage >= 100
    const chartValue = Math.min(percentage, 100)

    // Gauge Chart Data
    const chartData = [
        {
            name: 'Achievement',
            value: chartValue,
            fill: isOverAchieved ? 'url(#successGradient)' : 'url(#activeGradient)',
        },
    ]

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-20 px-4 pt-4 animate-in fade-in duration-700">
            {/* Header / Month Navigation */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-6 bg-card/40 backdrop-blur-3xl border border-border/40 p-8 rounded-[2.5rem] shadow-2xl ring-1 ring-white/10 overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent opacity-50" />

                <div className="flex items-center gap-5 relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30 shadow-[0_0_20px_theme(colors.primary.DEFAULT)/30]">
                        <Target className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black tracking-tighter bg-gradient-to-r from-foreground to-foreground/50 bg-clip-text text-transparent">
                                영업기획 대시보드
                            </h1>
                            <Badge variant="outline" className="text-[10px] py-0.5 px-2 border-primary/30 text-primary font-black uppercase tracking-widest animate-pulse bg-primary/5">v2.2 PRO</Badge>
                        </div>
                        <p className="text-sm font-medium text-muted-foreground mt-1 tracking-tight">KST 실시간 수주 실적 및 목표 달성률을 분석합니다.</p>
                    </div>
                </div>

                <div className="flex items-center gap-5 relative z-10">
                    <div className="flex items-center gap-2 bg-background/50 p-2 rounded-2xl border border-border/40 shadow-inner">
                        <Button variant="ghost" size="icon" onClick={prevMonth} className="hover:bg-primary/10 rounded-xl h-10 w-10">
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <div className="w-32 text-center font-mono font-black text-xl tracking-tighter">
                            {format(currentMonth, 'yyyy. MM')}
                        </div>
                        <Button variant="ghost" size="icon" onClick={nextMonth} className="hover:bg-primary/10 rounded-xl h-10 w-10">
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                    </div>

                    <MonthlyGoalModal onSuccess={fetchData} />
                </div>
            </div>

            {/* AI Demand Prediction Banner */}
            {predictions.length > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-[2rem] p-5 backdrop-blur-xl relative overflow-hidden group shadow-lg shadow-amber-500/5 transition-all hover:shadow-amber-500/10 h-24">
                    <div className="absolute -top-4 -right-4 opacity-5 group-hover:scale-125 transition-transform duration-1000">
                        <Zap className="w-32 h-32 text-amber-500" />
                    </div>
                    <div className="flex items-center justify-between h-full relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                                <AlertCircle className="w-6 h-6 text-amber-500" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-amber-500 tracking-tight flex items-center gap-2 uppercase">
                                    AI Smart Insight: Re-order Alert
                                </h3>
                                <p className="text-xs text-amber-500/80 font-medium mt-0.5">
                                    <span className="font-bold underline decoration-amber-500/50">[{predictions[0].company_name}]</span>의 발주 주기가 도래했습니다. 수주 확률 <span className="text-amber-400 font-bold">87%</span>
                                </p>
                            </div>
                        </div>
                        <Button size="sm" variant="outline" className="border-amber-500/50 text-amber-500 hover:bg-amber-500/20 h-10 px-5 rounded-xl font-black text-[10px] tracking-widest uppercase shadow-lg shadow-amber-500/10" asChild>
                            <Link href="/dashboard/sales/crm">CRM 분석 도구 열기</Link>
                        </Button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Target Summary Card */}
                        <Card className="bg-card/30 backdrop-blur-3xl border border-border/40 rounded-[2.5rem] shadow-xl overflow-hidden group hover:border-primary/30 transition-all">
                            <CardHeader className="p-8 pb-4">
                                <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                    <Target className="w-4 h-4 text-primary" /> Monthly Sales Target
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 pt-0">
                                {isLoading ? (
                                    <div className="h-32 flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary/20" /></div>
                                ) : targetAmount > 0 ? (
                                    <div className="space-y-6">
                                        <div className="space-y-1">
                                            <div className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Target for {monthStr}</div>
                                            <div className="text-4xl font-mono font-black tracking-tighter flex items-baseline gap-2">
                                                <span>₩</span>
                                                <span className="bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">{targetAmount.toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10 space-y-3">
                                            <div className="flex justify-between text-[10px] font-black uppercase text-primary/70">
                                                <span>Live Progress</span>
                                                <span>{percentage}%</span>
                                            </div>
                                            <Progress value={Math.min(percentage, 100)} className="h-2.5 bg-background shadow-inner" indicatorClassName="bg-gradient-to-r from-primary to-purple-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]" />
                                            <p className="text-[10px] font-medium text-muted-foreground leading-relaxed italic">
                                                *목표 설정 모달에서 월별 목표를 언제든 수정할 수 있습니다.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-10 gap-5 text-center px-4">
                                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                            <Info className="w-6 h-6" />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="font-black text-lg">목표가 설정되지 않았습니다.</h4>
                                            <p className="text-xs text-muted-foreground font-medium leading-relaxed">이번 달 매출 목표를 먼저 등록해야<br />달성률 분석을 시작할 수 있습니다.</p>
                                        </div>
                                        <MonthlyGoalModal onSuccess={fetchData} />
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Gauge Chart Achievement Card */}
                        <Card className={cn(
                            "bg-card/40 backdrop-blur-3xl border border-border/40 rounded-[2.5rem] shadow-2xl transition-all duration-1000 overflow-hidden relative",
                            isOverAchieved ? "ring-2 ring-emerald-500/50 shadow-emerald-500/20" : "ring-1 ring-white/5"
                        )}>
                            {isOverAchieved && (
                                <div className="absolute top-0 right-0 p-3 bg-emerald-500 text-black text-[10px] font-black uppercase tracking-tighter rounded-bl-2xl animate-pulse z-20">
                                    Target Smashed! ✨
                                </div>
                            )}
                            <CardHeader className="p-8 pb-0">
                                <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                    <TrendingUp className={cn("w-4 h-4", isOverAchieved ? "text-emerald-500" : "text-blue-500")} /> Real-time Achievement
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 flex flex-col items-center relative h-64">
                                {isLoading ? (
                                    <div className="h-full flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary/20" /></div>
                                ) : targetAmount > 0 ? (
                                    <>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadialBarChart
                                                innerRadius="80%"
                                                outerRadius="110%"
                                                data={chartData}
                                                startAngle={210}
                                                endAngle={-30}
                                            >
                                                <defs>
                                                    <linearGradient id="activeGradient" x1="0" y1="0" x2="1" y2="0">
                                                        <stop offset="0%" stopColor="#8b5cf6" />
                                                        <stop offset="100%" stopColor="#3b82f6" />
                                                    </linearGradient>
                                                    <linearGradient id="successGradient" x1="0" y1="0" x2="1" y2="0">
                                                        <stop offset="0%" stopColor="#10b981" />
                                                        <stop offset="100%" stopColor="#d4af37" />
                                                    </linearGradient>
                                                </defs>
                                                <PolarAngleAxis
                                                    type="number"
                                                    domain={[0, 100]}
                                                    angleAxisId={0}
                                                    tick={false}
                                                />
                                                <RadialBar
                                                    background={{ fill: 'rgba(255,255,255,0.05)' }}
                                                    dataKey="value"
                                                    cornerRadius={30}
                                                />
                                            </RadialBarChart>
                                        </ResponsiveContainer>

                                        <div className="absolute inset-0 flex flex-col items-center justify-center pt-10">
                                            <span className={cn(
                                                "text-6xl font-mono font-black tracking-tighter",
                                                isOverAchieved ? "text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" : "text-primary"
                                            )}>
                                                {percentage}%
                                            </span>
                                            <div className="mt-2 text-center">
                                                <div className="text-[10px] font-black text-muted-foreground uppercase opacity-60 tracking-widest leading-none">Actual Results</div>
                                                <div className="text-lg font-mono font-black tracking-tight mt-1">₩ {actualAmount.toLocaleString()}</div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-10 space-y-4">
                                        <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center text-muted-foreground/40 animate-pulse">
                                            <AlertCircle className="w-8 h-8" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-black uppercase tracking-widest text-muted-foreground/60">No Active Target</p>
                                            <p className="text-[10px] font-medium text-muted-foreground/40">달성률을 분석하려면 이번 달 목표를 먼저 설정하세요.</p>
                                        </div>
                                        <MonthlyGoalModal onSuccess={fetchData} />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* v2.2 Dashboard Feature: Repositioned Pipeline Kanban */}
                    <div className="pt-4 border-t border-border/40">
                        <div className="flex items-center justify-between mb-8 px-2">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30 shadow-lg shadow-purple-500/10">
                                    <LayoutTemplate className="w-6 h-6 text-purple-400" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black tracking-tighter uppercase italic">Sales Pipeline Kanban</h2>
                                    <p className="text-xs font-semibold text-muted-foreground mt-1">실시간 영업 활동 데이터가 반영된 파이프라인 정적 뷰입니다.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {Object.entries(pipelineStats).slice(0, 3).map(([key, count]) => (
                                    <div key={key} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card border border-border/40 shadow-sm text-[10px] font-black uppercase">
                                        <span className="text-muted-foreground">{key}</span>
                                        <span className="text-primary">{count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <SalesKanban initialActivities={initialActivities} />
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-8">
                    <Card className="bg-primary/5 border-primary/30 border-2 rounded-[2rem] overflow-hidden relative shadow-2xl shadow-primary/5">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-[80px]" />
                        <CardHeader className="p-6 pb-2 relative z-10">
                            <CardTitle className="text-xs font-black uppercase tracking-[0.3em] flex items-center gap-2 text-primary">
                                <Zap className="w-3.5 h-3.5 fill-primary" /> Strategy Insight
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 pt-2 space-y-5 relative z-10">
                            <div className="text-sm leading-relaxed font-bold tracking-tight">
                                {targetAmount === 0 ? (
                                    <p className="text-muted-foreground/50">목표가 설정되지 않았습니다.</p>
                                ) : percentage < 50 ? (
                                    <p>현재 페이스가 다소 느립니다. <span className="text-amber-500 font-extrabold underline decoration-amber-500/30">견적({pipelineStats.quote || 0}건)</span> 단계의 발주 전환에 집중하세요.</p>
                                ) : percentage < 100 ? (
                                    <p>승기를 잡았습니다! <span className="text-emerald-500 font-extrabold">네고({pipelineStats.negotiation || 0}건)</span> 중인 대형 딜 클로징으로 이번 달 실적을 확정하세요.</p>
                                ) : (
                                    <p className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-amber-500 font-black text-lg">Goal Achieved! ✨ 전사적 성과 보상 및 익월 리드 확보에 전념하세요.</p>
                                )}
                            </div>
                            <div className="p-4 bg-black/40 rounded-2xl border border-primary/20 shadow-inner">
                                <div className="text-[10px] font-black text-primary uppercase mb-2 tracking-widest opacity-60">AI Recommendation</div>
                                <div className="text-xs leading-snug font-medium text-foreground/90">
                                    최근 <span className="text-emerald-400 font-bold">샘플 요약 분석</span> 결과, 샘플 발송 후 7일 이내 후속 미팅 시 성사율이 <span className="underline decoration-emerald-400 font-bold italic">2.4배</span> 상승합니다.
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card/40 border-border/40 rounded-[2rem] shadow-xl overflow-hidden">
                        <CardHeader className="p-6 pb-2">
                            <CardTitle className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-[0.2em]">Management Tools</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 flex flex-col gap-3">
                            <Button variant="outline" size="lg" asChild className="justify-start text-xs font-black border-border/50 hover:border-primary/50 transition-all h-14 rounded-2xl bg-background/30 hover:bg-primary/5 group">
                                <Link href="/dashboard/sales/crm">
                                    <Users className="mr-3 h-5 w-5 text-blue-400 group-hover:scale-110 transition-transform" />
                                    <span>고객사 등급 상세분석 <ArrowRight className="ml-auto w-3.5 h-3.5 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" /></span>
                                </Link>
                            </Button>
                            <Button variant="outline" size="lg" asChild className="justify-start text-xs font-black border-border/50 hover:border-primary/50 transition-all h-14 rounded-2xl bg-background/30 hover:bg-primary/5 group">
                                <Link href="/dashboard/sales/reports">
                                    <FileText className="mr-3 h-5 w-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                                    <span>영업 실적 분석실 <ArrowRight className="ml-auto w-3.5 h-3.5 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" /></span>
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
