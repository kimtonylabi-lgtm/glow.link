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
    Zap,
    PieChart,
    LayoutDashboard
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
    Tabs,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs'
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
            if (result.success) {
                setTargetAmount(result.target || 0)
                setActualAmount(result.actual || 0)
                setPercentage(result.percentage || 0)
                setPipelineStats(result.pipelineStats || {})
                setPredictions(result.predictions || [])
            } else {
                toast.error(`영업 데이터를 불러오지 못했습니다: ${result.error}`)
            }
        } catch (error: any) {
            console.error('Fetch Error:', error)
            toast.error(`영업 데이터를 불러오지 못했습니다: ${error.message || '알 수 없는 오류'}`)
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
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-card/40 backdrop-blur-3xl border border-border/40 p-6 md:p-8 rounded-[2.5rem] shadow-2xl ring-1 ring-white/10 overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent opacity-50" />

                <div className="flex flex-col md:flex-row items-center gap-5 relative z-10 text-center md:text-left">
                    <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30 shadow-[0_0_20px_theme(colors.primary.DEFAULT)/30] shrink-0">
                        <Target className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3">
                            <h1 className="text-2xl md:text-3xl font-black tracking-tighter bg-gradient-to-r from-foreground to-foreground/50 bg-clip-text text-transparent break-keep">
                                영업기획 대시보드
                            </h1>
                            <Badge variant="outline" className="text-[10px] py-0.5 px-2 border-primary/30 text-primary font-black uppercase tracking-widest animate-pulse bg-primary/5">v2.3 HOTFIX</Badge>
                        </div>
                        <p className="text-xs md:text-sm font-medium text-muted-foreground mt-1 tracking-tight break-keep">KST 실시간 수주 실적 및 목표 달성률을 분석합니다.</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-5 relative z-10">

                    <div className="flex items-center gap-2 bg-background/50 p-2 rounded-2xl border border-border/40 shadow-inner w-full sm:w-auto justify-center">
                        <Button variant="ghost" size="icon" onClick={prevMonth} className="hover:bg-primary/10 rounded-xl h-10 w-10 shrink-0">
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <div className="flex-1 sm:w-32 text-center font-mono font-black text-xl tracking-tighter">
                            {format(currentMonth, 'yyyy. MM')}
                        </div>
                        <Button variant="ghost" size="icon" onClick={nextMonth} className="hover:bg-primary/10 rounded-xl h-10 w-10 shrink-0">
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                    </div>

                    <div className="w-full sm:w-auto">
                        <MonthlyGoalModal onSuccess={() => fetchData()} />
                    </div>
                </div>
            </div>

            {/* AI Demand Prediction Banner */}
            {predictions.length > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-[2rem] p-6 backdrop-blur-xl relative overflow-hidden group shadow-lg shadow-amber-500/5 transition-all hover:shadow-amber-500/10 min-h-[6rem] h-auto">
                    <div className="absolute -top-4 -right-4 opacity-5 group-hover:scale-125 transition-transform duration-1000">
                        <Zap className="w-32 h-32 text-amber-500" />
                    </div>
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30 shrink-0">
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
                        <Button size="sm" variant="outline" className="w-full md:w-auto border-amber-500/50 text-amber-500 hover:bg-amber-500/20 h-10 px-5 rounded-xl font-black text-[10px] tracking-widest uppercase shadow-lg shadow-amber-500/10" asChild>
                            <Link href="/dashboard/sales/crm">CRM 분석 도구 열기</Link>
                        </Button>
                    </div>
                </div>
            )}

            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* 1. Gauge Chart Section (Achievement) */}
                <Card className="lg:col-span-12 xl:col-span-5 bg-card/40 backdrop-blur-3xl border border-border/40 rounded-[2.5rem] shadow-2xl ring-1 ring-white/5 overflow-hidden group">
                    <CardHeader className="pb-2">
                        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-4">
                            <div className="text-center md:text-left">
                                <CardTitle className="text-xl font-black flex items-center justify-center md:justify-start gap-2">
                                    <TrendingUp className="w-5 h-5 text-primary" />
                                    Real-time Achievement
                                </CardTitle>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">당월 수주 달성률</p>
                            </div>
                            <div className="text-center md:text-right">
                                <span className={cn(
                                    "text-3xl font-black font-mono tracking-tighter",
                                    isOverAchieved ? "text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]" : "text-primary"
                                )}>
                                    {percentage}%
                                </span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center relative">
                        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-50" />
                        {isLoading ? (
                            <Loader2 className="w-10 h-10 animate-spin text-primary/20" />
                        ) : targetAmount > 0 ? (
                            <>
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadialBarChart
                                        cx="50%"
                                        cy="80%"
                                        innerRadius="100%"
                                        outerRadius="140%"
                                        startAngle={180}
                                        endAngle={0}
                                        barSize={20}
                                        data={chartData}
                                    >
                                        <defs>
                                            <linearGradient id="activeGradient" x1="0" y1="0" x2="1" y2="0">
                                                <stop offset="0%" stopColor="#8b5cf6" />
                                                <stop offset="100%" stopColor="#3b82f6" />
                                            </linearGradient>
                                            <linearGradient id="successGradient" x1="0" y1="0" x2="1" y2="0">
                                                <stop offset="0%" stopColor="#10b981" />
                                                <stop offset="100%" stopColor="#34d399" />
                                            </linearGradient>
                                        </defs>
                                        <RadialBar
                                            background={{ fill: 'rgba(255,255,255,0.05)' }}
                                            dataKey="value"
                                            cornerRadius={15}
                                            animationBegin={0}
                                            animationDuration={1500}
                                            animationEasing="ease-out"
                                        />
                                    </RadialBarChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center mt-20">
                                    <p className="text-xs font-bold text-muted-foreground uppercase opacity-50 mb-1">Target Amount</p>
                                    <p className="text-lg font-black font-mono tracking-tighter">
                                        ₩ {targetAmount.toLocaleString()}
                                    </p>
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
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 2. Monthly Target & Management Row Merge */}
                <div className="lg:col-span-12 xl:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-8">
                    {/* Target Amount Component (Monthly) */}
                    <Card className="bg-card/40 backdrop-blur-3xl border border-border/40 rounded-[2.5rem] shadow-2xl ring-1 ring-white/5 overflow-hidden group h-full">
                        <CardHeader>
                            <CardTitle className="text-xl font-black flex items-center gap-2">
                                <LayoutDashboard className="w-5 h-5 text-primary" />
                                Sales Target
                            </CardTitle>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                                목표 매출액 (개인)
                            </p>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col gap-4">
                                <div className="p-6 rounded-[2rem] bg-muted/20 border border-border/20 group-hover:border-primary/30 transition-all flex flex-col items-center sm:items-start text-center sm:text-left">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-3 block">Current Month Goal</Label>
                                    <div className="flex flex-col sm:flex-row items-center sm:items-end gap-1 sm:gap-2">
                                        <span className="text-3xl font-black font-mono tracking-tighter">₩ {targetAmount.toLocaleString()}</span>
                                        <span className="text-xs font-bold text-muted-foreground mb-1.5 uppercase opacity-30 tracking-widest">KRW</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                    <div className="w-1.5 h-10 bg-primary/40 rounded-full" />
                                    <p className="text-[11px] text-muted-foreground font-medium leading-relaxed opacity-80">
                                        매월 영업 전략에 맞춰 설정된 매출 목표입니다. <br />
                                        실시간 수주 데이터를 기반으로 집계됩니다.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Management Tools (Compressed) */}
                    <div className="bg-gradient-to-br from-primary via-primary/80 to-blue-600 rounded-[2.5rem] p-8 text-primary-foreground shadow-2xl shadow-primary/20 group h-full relative overflow-hidden flex flex-col justify-between items-center sm:items-start text-center sm:text-left">
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="space-y-2 w-full">
                            <h3 className="text-xl font-black tracking-tighter">Management Tools</h3>
                            <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">영업 기획 핵심 도구</p>
                        </div>
                        <div className="grid grid-cols-1 gap-3 mt-6 w-full">
                            <Button variant="secondary" className="w-full h-12 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-black/10 hover:scale-[1.02] active:scale-[0.98] transition-all text-[10px] sm:text-xs gap-2 group whitespace-nowrap overflow-hidden" asChild>
                                <Link href="/dashboard/sales/crm">
                                    <Users className="w-3.5 h-3.5 group-hover:scale-110 transition-transform shrink-0" />
                                    <span className="truncate">CRM 분석실</span>
                                </Link>
                            </Button>
                            <Button variant="secondary" className="w-full h-12 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-black/10 hover:scale-[1.02] active:scale-[0.98] transition-all text-[10px] sm:text-xs gap-2 group whitespace-nowrap overflow-hidden" asChild>
                                <Link href="/dashboard/sales/reports">
                                    <FileText className="w-3.5 h-3.5 group-hover:scale-110 transition-transform shrink-0" />
                                    <span className="truncate">실적 리포트</span>
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* 3. Full Width Kanban Section */}
                <div className="lg:col-span-12 pt-4">
                    <div className="flex items-center justify-between mb-8 px-4">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-black tracking-tighter uppercase italic flex items-center gap-3">
                                <div className="w-2 h-8 bg-primary rounded-full" />
                                Sales Pipeline Kanban
                            </h2>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">영업 활동 기반의 파이프라인 단계별 현황</p>
                        </div>
                        <div className="text-[10px] font-black px-4 py-2 bg-primary/10 border border-primary/20 text-primary rounded-full uppercase tracking-widest animate-pulse">
                            View Only Mode
                        </div>
                    </div>

                    <div className="bg-card/20 backdrop-blur-3xl rounded-[3rem] border border-border/40 p-1 shadow-2xl overflow-hidden min-h-[600px]">
                        <SalesKanban initialActivities={initialActivities} />
                    </div>
                </div>
            </div>
        </div>
    )
}
