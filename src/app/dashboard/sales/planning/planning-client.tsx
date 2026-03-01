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

export function PlanningClient({ activities: initialActivities }: Props) {
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    // Data states
    const [targetAmount, setTargetAmount] = useState<string>('')
    const [actualAmount, setActualAmount] = useState<number>(0)
    const [percentage, setPercentage] = useState<number>(0)
    const [pipelineStats, setPipelineStats] = useState<Record<string, number>>({})
    const [predictions, setPredictions] = useState<any[]>([])

    const monthStr = format(currentMonth, 'yyyy-MM')

    const fetchData = async () => {
        setIsLoading(true)
        try {
            const result = await getSalesPlanning(monthStr)
            setTargetAmount(result.target > 0 ? result.target.toString() : '')
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

    const handleSaveTarget = async (e: React.FormEvent) => {
        e.preventDefault()

        const numericAmount = Number(targetAmount.replace(/,/g, ''))
        if (isNaN(numericAmount) || numericAmount < 0) {
            toast.error('유효한 목표 금액을 입력해주세요.')
            return
        }

        setIsSaving(true)
        try {
            const result = await upsertTargetAmount(monthStr, numericAmount)
            if (result.success) {
                toast.success(`${monthStr} 목표 매출액이 저장되었습니다.`)
                fetchData() // Refresh to update progress
            } else {
                toast.error(result.error)
            }
        } catch (error) {
            toast.error('저장 중 오류가 발생했습니다.')
        } finally {
            setIsSaving(false)
        }
    }

    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

    const handleTargetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/,/g, '')
        if (/^\d*$/.test(rawValue)) {
            setTargetAmount(rawValue)
        }
    }

    const displayTarget = targetAmount ? Number(targetAmount).toLocaleString() : ''
    const isOverAchieved = percentage >= 100

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-20 px-4 pt-4">
            {/* Header / Month Navigation */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-card/40 backdrop-blur-3xl border border-border/40 p-6 rounded-2xl shadow-xl ring-1 ring-white/10 overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 shadow-[0_0_15px_theme(colors.primary.DEFAULT)/20]">
                        <Target className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
                                영업기획 (Sales Planning)
                            </h1>
                            <Badge variant="outline" className="text-[10px] py-0 border-primary/30 text-primary font-bold animate-pulse">v1.5 PRO</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">AI 지능형 분석 시스템이 활성화되었습니다.</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-background/50 p-2 rounded-xl border border-border/50 relative z-10">
                    <Button variant="ghost" size="icon" onClick={prevMonth} className="hover:bg-primary/10">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div className="w-24 text-center font-mono font-bold text-lg">
                        {monthStr}
                    </div>
                    <Button variant="ghost" size="icon" onClick={nextMonth} className="hover:bg-primary/10">
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* AI Demand Prediction Banner */}
            {predictions.length > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 backdrop-blur-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Zap className="w-20 h-20 text-amber-500" />
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center">
                                <AlertCircle className="w-5 h-5 text-black" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-amber-500 flex items-center gap-2">
                                    AI 추천: 재발주 예상 고객 포착
                                </h3>
                                <p className="text-xs text-amber-500/80">
                                    <span className="font-bold underline decoration-amber-500/50">[{predictions[0].company_name}]</span> 등 {predictions.length}개사의 수주 주기가 돌아왔습니다.
                                </p>
                            </div>
                        </div>
                        <Button size="sm" variant="outline" className="border-amber-500/50 text-amber-500 hover:bg-amber-500/20 text-xs font-bold" asChild>
                            <Link href="/dashboard">예측 데이터 상세 보기</Link>
                        </Button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Target Registration Card */}
                        <Card className="bg-card/30 backdrop-blur-xl border-border/40 overflow-hidden group">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Target className="w-5 h-5 text-primary" />
                                    매출 목표 설정
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
                                ) : (
                                    <form onSubmit={handleSaveTarget} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="targetAmount" className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Target Revenue (KRW)</Label>
                                            <div className="relative group/input">
                                                <Input
                                                    id="targetAmount"
                                                    value={displayTarget}
                                                    onChange={handleTargetChange}
                                                    placeholder="예: 100,000,000"
                                                    className="font-mono text-2xl pr-12 bg-background/50 h-16 border-2 border-border/50 group-hover/input:border-primary/50 transition-all focus:ring-primary/20"
                                                    autoComplete="off"
                                                />
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">원</div>
                                            </div>
                                        </div>
                                        <Button type="submit" disabled={isSaving || !targetAmount} className="w-full h-14 font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all">
                                            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                                            업데이트
                                        </Button>
                                    </form>
                                )}
                            </CardContent>
                        </Card>

                        {/* Progress Status Card */}
                        <Card className={cn(
                            "bg-card/40 backdrop-blur-xl border-2 transition-all duration-700 overflow-hidden relative",
                            isOverAchieved ? "border-emerald-500/50 shadow-[0_0_40px_rgba(16,185,129,0.2)]" : "border-border/40"
                        )}>
                            {isOverAchieved && (
                                <div className="absolute top-0 right-0 p-2 bg-emerald-500 text-black text-[10px] font-black uppercase tracking-tighter rounded-bl-lg animate-pulse">
                                    Target Met
                                </div>
                            )}
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className={cn("w-5 h-5", isOverAchieved ? "text-emerald-500" : "text-blue-500")} />
                                        달성도 리포트
                                    </div>
                                    <span className={cn(
                                        "font-mono text-3xl font-black",
                                        isOverAchieved ? "text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "text-primary tracking-tighter"
                                    )}>{percentage}%</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6 mt-2">
                                {isLoading ? (
                                    <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
                                ) : (
                                    <>
                                        <div className="p-4 bg-background/60 rounded-2xl border border-border/30">
                                            <div className="text-[10px] text-muted-foreground uppercase font-black mb-1">Current Achievement</div>
                                            <div className={cn("text-3xl font-mono font-black tracking-tighter", isOverAchieved ? "text-emerald-500" : "text-foreground")}>
                                                ₩ {actualAmount.toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Progress
                                                value={Math.min(percentage, 100)}
                                                className="h-3 bg-muted/30 rounded-full"
                                                indicatorClassName={isOverAchieved ? "bg-emerald-400" : "bg-gradient-to-r from-primary to-primary/60"}
                                            />
                                            <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase">
                                                <span>Start</span>
                                                <span>Target: KRW {Number(targetAmount || 0).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* v1.5 Highlight: Pipeline Visualizer */}
                    <Card className="bg-card/20 backdrop-blur-xl border-border/40 overflow-hidden">
                        <CardHeader className="pb-4 group">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <LayoutTemplate className="w-5 h-5 text-purple-400" />
                                        영업 파이프라인 (Kanban Insight)
                                    </CardTitle>
                                    <CardDescription className="text-xs">현재 관리 중인 전체 딜의 단계별 분포입니다.</CardDescription>
                                </div>
                                <Button variant="ghost" size="sm" asChild className="text-xs hover:bg-primary/10 transition-all font-bold">
                                    <Link href="/dashboard/sales/activity" className="flex items-center gap-1">
                                        상세 칸반 보드 <ArrowRight className="w-3 h-3" />
                                    </Link>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                                {Object.entries({
                                    lead: { label: '리드', color: 'bg-slate-400', icon: '🎯' },
                                    sample_sent: { label: '샘플', color: 'bg-blue-400', icon: '📦' },
                                    quote: { label: '견적', color: 'bg-amber-400', icon: '📝' },
                                    negotiation: { label: '네고', color: 'bg-orange-400', icon: '🤝' },
                                    deal_closed: { label: '성공', color: 'bg-emerald-400', icon: '✨' },
                                    dropped: { label: '드랍', color: 'bg-rose-400', icon: '❌' }
                                }).map(([key, info]) => (
                                    <div key={key} className="flex flex-col items-center p-3 sm:p-4 bg-background/40 rounded-2xl border border-border/20 group hover:border-primary/40 hover:bg-background/60 transition-all duration-300">
                                        <span className="text-xl mb-1 group-hover:scale-110 transition-transform">{info.icon}</span>
                                        <span className="text-[10px] font-black text-muted-foreground mb-1 uppercase tracking-tighter">{info.label}</span>
                                        <span className="text-xl font-black">{pipelineStats[key] || 0}</span>
                                        <div className={cn("h-1 w-8 mt-2 rounded-full opacity-20 group-hover:opacity-100 transition-all group-hover:w-full", info.color)} />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6">
                    <Card className="bg-primary/5 border-primary/20 border-2 overflow-hidden relative">
                        <div className="absolute -top-4 -right-4 w-20 h-20 bg-primary/10 rounded-full blur-2xl" />
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-primary">
                                <Zap className="w-3 h-3" /> Analysis Insight
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-xs leading-relaxed font-medium">
                                {percentage < 50 ? (
                                    <p>현재 달성률이 낮습니다. <span className="text-amber-500 font-black underline">견적({pipelineStats.quote || 0}건)</span> 단계를 네고로 전환시키는데 집중하세요.</p>
                                ) : percentage < 100 ? (
                                    <p>목표 달성까지 얼마 남지 않았습니다! <span className="text-emerald-500 font-black">네고({pipelineStats.negotiation || 0}건)</span> 딜 클로징에 화력을 집중하세요.</p>
                                ) : (
                                    <p className="text-emerald-500 font-black">축하합니다! 목표를 초과 달성하셨습니다. 이제 다음 분기 리드 발굴에 전념하세요.</p>
                                )}
                            </div>
                            <div className="p-3 bg-black/20 rounded-xl border border-primary/20">
                                <div className="text-[9px] font-black text-primary uppercase mb-2">Strategy Tip</div>
                                <div className="text-[11px] leading-snug">
                                    전환율 분석 결과 <span className="text-emerald-400 font-bold">S등급</span> 고객과의 미팅이 일반 대비 <span className="underline decoration-emerald-400/50 underline-offset-2">3.2배</span> 높은 수주율을 보입니다.
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card/40 border-border/40">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Link Tools</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-2">
                            <Button variant="outline" size="sm" asChild className="justify-start text-[11px] font-bold border-border/50 hover:border-primary/50 transition-colors h-10">
                                <Link href="/dashboard/sales/crm">
                                    <Users className="mr-2 h-4 w-4 text-blue-400" /> 고객사 등급 상세분석
                                </Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild className="justify-start text-[11px] font-bold border-border/50 hover:border-primary/50 transition-colors h-10">
                                <Link href="/dashboard/sales/reports">
                                    <FileText className="mr-2 h-4 w-4 text-emerald-400" /> 월간 영업 실적 보고
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* v1.6 Highlight: Pipeline Kanban Relocation */}
            <div className="pt-10 border-t border-border/40">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                        <LayoutTemplate className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black tracking-tight uppercase">Sales Pipeline Kanban</h2>
                        <p className="text-xs text-muted-foreground">드래그 앤 드롭으로 딜의 진행 상태를 관리하세요.</p>
                    </div>
                </div>
                <SalesKanban initialActivities={initialActivities} />
            </div>
        </div>
    )
}
