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
    AlertCircle as AlertIcon,
    ArrowRight,
    FileText,
    Users,
    Zap,
    PieChart,
    LayoutDashboard,
    Phone,
    Crown,
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
    churnRiskClients?: any[]
    vipClients?: any[]
}

import {
    ResponsiveContainer,
    RadialBarChart,
    RadialBar,
    PolarAngleAxis,
} from 'recharts'
import { MonthlyGoalModal } from './MonthlyGoalModal'

export function PlanningClient({ activities: initialActivities, churnRiskClients = [], vipClients = [] }: Props) {
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
        <div className="space-y-4 max-w-7xl mx-auto pb-10 px-4 pt-3 animate-in fade-in duration-700">
            {/* Header / Month Navigation — Compact Strip */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2 bg-card/40 backdrop-blur-3xl border border-border/40 p-3 rounded-2xl shadow ring-1 ring-white/5 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/8 via-transparent to-transparent opacity-50" />
                <div className="flex items-center gap-3 relative z-10">
                    <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 shrink-0">
                        <Target className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-base font-black tracking-tighter bg-gradient-to-r from-foreground to-foreground/50 bg-clip-text text-transparent">
                            영업기획 대시보드
                        </h1>
                        <p className="text-[10px] text-muted-foreground">KST 실시간 수주 실적 및 목표 달성률</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 relative z-10">
                    <div className="flex items-center gap-1 bg-background/50 px-2 py-1 rounded-xl border border-border/40">
                        <Button variant="ghost" size="icon" onClick={prevMonth} className="hover:bg-primary/10 rounded-lg h-6 w-6 shrink-0">
                            <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        <div className="w-20 text-center font-mono font-black text-sm tracking-tighter">
                            {format(currentMonth, 'yyyy. MM')}
                        </div>
                        <Button variant="ghost" size="icon" onClick={nextMonth} className="hover:bg-primary/10 rounded-lg h-6 w-6 shrink-0">
                            <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                    <MonthlyGoalModal onSuccess={() => fetchData()} />
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

            {/* Main Dashboard Grid — Compact KPI Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* 1. Gauge Chart — Compact */}
                <Card className="lg:col-span-12 xl:col-span-5 bg-card/40 backdrop-blur-xl border border-border/40 rounded-2xl shadow overflow-hidden">
                    <CardHeader className="pb-1 pt-3 px-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-sm font-black flex items-center gap-1.5">
                                    <TrendingUp className="w-4 h-4 text-primary" />
                                    Real-time Achievement
                                </CardTitle>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">당월 수주 달성률</p>
                            </div>
                            <span className={cn(
                                "text-xl font-black font-mono tracking-tighter",
                                isOverAchieved ? "text-emerald-400" : "text-primary"
                            )}>
                                {percentage}%
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="h-[140px] flex items-center justify-center relative px-2 pb-2">
                        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-50" />
                        {isLoading ? (
                            <Loader2 className="w-8 h-8 animate-spin text-primary/20" />
                        ) : targetAmount > 0 ? (
                            <>
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadialBarChart
                                        cx="50%" cy="85%"
                                        innerRadius="80%" outerRadius="110%"
                                        startAngle={180} endAngle={0}
                                        barSize={10} data={chartData}
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
                                        <RadialBar background={{ fill: 'rgba(255,255,255,0.05)' }} dataKey="value" cornerRadius={8}
                                            animationBegin={0} animationDuration={1200} animationEasing="ease-out" />
                                    </RadialBarChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center mt-10">
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-50">Target</p>
                                    <p className="text-sm font-black font-mono">₩ {targetAmount.toLocaleString()}</p>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center text-center space-y-2">
                                <AlertCircle className="w-6 h-6 text-muted-foreground/30" />
                                <p className="text-xs text-muted-foreground/50">목표를 먼저 설정하세요</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 2. Sales Target + Management Tools — Compact */}
                <div className="lg:col-span-12 xl:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card className="bg-card/40 backdrop-blur-xl border border-border/40 rounded-2xl shadow overflow-hidden">
                        <CardHeader className="pb-1 pt-3 px-4">
                            <CardTitle className="text-sm font-black flex items-center gap-1.5">
                                <LayoutDashboard className="w-4 h-4 text-primary" />
                                Sales Target
                            </CardTitle>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">목표 매출액 (개인)</p>
                        </CardHeader>
                        <CardContent className="px-4 pb-3">
                            <div className="flex flex-col gap-2">
                                <div className="p-3 rounded-xl bg-muted/20 border border-border/20">
                                    <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-1 block">Current Month Goal</Label>
                                    <div className="flex items-end gap-1">
                                        <span className="text-lg font-black font-mono tracking-tighter">₩ {targetAmount.toLocaleString()}</span>
                                        <span className="text-[10px] font-bold text-muted-foreground mb-0.5 uppercase opacity-30">KRW</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="bg-gradient-to-br from-primary via-primary/80 to-blue-600 rounded-2xl p-4 text-primary-foreground shadow-xl shadow-primary/20 relative overflow-hidden flex flex-col justify-between">
                        <div className="space-y-0.5">
                            <h3 className="text-sm font-black tracking-tighter">Management Tools</h3>
                            <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest">영업 기획 핵심 도구</p>
                        </div>
                        <div className="grid grid-cols-1 gap-2 mt-3">
                            <Button variant="secondary" className="w-full h-8 rounded-lg font-black uppercase tracking-widest text-[10px] gap-1.5" asChild>
                                <Link href="/dashboard/sales/crm">
                                    <Users className="w-3 h-3 shrink-0" />
                                    <span className="truncate">CRM 분석실</span>
                                </Link>
                            </Button>
                            <Button variant="secondary" className="w-full h-8 rounded-lg font-black uppercase tracking-widest text-[10px] gap-1.5" asChild>
                                <Link href="/dashboard/sales/reports">
                                    <FileText className="w-3 h-3 shrink-0" />
                                    <span className="truncate">실적 리포트</span>
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* 복구된 Sales Pipeline Kanban */}
                <div className="lg:col-span-12 pt-2">
                    <div className="flex items-center justify-between mb-4 px-4">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-black tracking-tighter uppercase italic flex items-center gap-3">
                                <div className="w-2 h-8 bg-primary rounded-full" />
                                Sales Pipeline Kanban
                            </h2>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">영업 활동 기반의 파이프라인 단계별 현황</p>
                        </div>
                    </div>

                    <div className="bg-card/20 backdrop-blur-3xl rounded-[3rem] border border-border/40 p-1 shadow-2xl overflow-hidden min-h-[600px]">
                        <SalesKanban initialActivities={initialActivities} />
                    </div>
                </div>

                {/* ── 하단 패널: 이탈위험 + VIP ABC ── */}
                <div className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* 이탈 위험 거래처 */}
                    <div className="bg-card/40 backdrop-blur-xl border border-border/40 rounded-[2rem] overflow-hidden shadow-xl">
                        <div className="flex items-center gap-3 px-6 py-4 bg-orange-500/5 border-b border-orange-500/10">
                            <AlertIcon className="w-5 h-5 text-orange-500" />
                            <div>
                                <h3 className="font-black text-sm text-orange-500 uppercase tracking-wide">🚨 이탈 위험 거래처</h3>
                                <p className="text-[10px] text-muted-foreground/60 font-medium mt-0.5">최근 3개월 미발주</p>
                            </div>
                            <span className="ml-auto text-xs font-black bg-orange-500/10 text-orange-500 border border-orange-500/20 px-2 py-1 rounded-full">{churnRiskClients.length}개사</span>
                        </div>
                        <div className="divide-y divide-border/20 max-h-[360px] overflow-y-auto">
                            {churnRiskClients.length === 0 ? (
                                <div className="flex flex-col items-center py-10 text-muted-foreground">
                                    <p className="text-sm">이탈 위험 거래처가 없습니다 🎉</p>
                                </div>
                            ) : churnRiskClients.map((c: any) => (
                                <div key={c.id} className="flex items-center px-5 py-3.5 group hover:bg-muted/20 transition-colors">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm text-slate-200 truncate">{c.company_name}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">{c.contact_person || '담당자 없음'} · {c.phone || '-'}</p>
                                    </div>
                                    <button
                                        className="shrink-0 ml-3 flex items-center gap-1.5 text-[11px] font-black px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 transition-colors"
                                        onClick={() => window.location.href = `/dashboard/sales/activity?client_id=${c.id}`}
                                    >
                                        <Phone className="w-3 h-3" /> 영업활동 기록
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* VIP ABC 분석표 */}
                    <div className="bg-card/40 backdrop-blur-xl border border-border/40 rounded-[2rem] overflow-hidden shadow-xl">
                        <div className="flex items-center gap-3 px-6 py-4 bg-amber-500/5 border-b border-amber-500/10">
                            <Crown className="w-5 h-5 text-amber-400" />
                            <div>
                                <h3 className="font-black text-sm text-amber-400 uppercase tracking-wide">👑 VIP ABC 분석표</h3>
                                <p className="text-[10px] text-muted-foreground/60 font-medium mt-0.5">최근 1년 누적 매출 기준</p>
                            </div>
                            <span className="ml-auto text-xs font-black bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-1 rounded-full">TOP {vipClients.length}</span>
                        </div>
                        <div className="divide-y divide-border/20 max-h-[360px] overflow-y-auto">
                            {vipClients.length === 0 ? (
                                <div className="flex flex-col items-center py-10 text-muted-foreground">
                                    <TrendingUp className="w-8 h-8 mb-2 opacity-20" />
                                    <p className="text-sm">최근 1년 수주 데이터가 없습니다</p>
                                </div>
                            ) : vipClients.map((c: any, idx: number) => {
                                const tier = idx < 3 ? { label: 'S', color: 'bg-yellow-400/20 text-yellow-400 border-yellow-400/30' }
                                    : idx < Math.ceil(vipClients.length * 0.2) ? { label: 'A', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' }
                                        : idx < Math.ceil(vipClients.length * 0.5) ? { label: 'B', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' }
                                            : { label: 'C', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' }
                                return (
                                    <div key={c.id} className="flex items-center px-5 py-3 hover:bg-muted/20 transition-colors">
                                        <span className="text-xs font-black text-muted-foreground/40 w-6 shrink-0">{idx + 1}</span>
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded border mx-3 shrink-0 ${tier.color}`}>{tier.label}</span>
                                        <p className="font-bold text-sm text-slate-200 flex-1 truncate">{c.company_name}</p>
                                        <p className="text-xs font-mono font-bold text-amber-400 shrink-0 ml-2">₩{c.annual_revenue.toLocaleString()}</p>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
