'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { getSalesPlanning, upsertTargetAmount } from './actions'
import { toast } from 'sonner'
import { format, subMonths, addMonths } from 'date-fns'
import { ChevronLeft, ChevronRight, Loader2, Target, TrendingUp, Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export function PlanningClient() {
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    // Data states
    const [targetAmount, setTargetAmount] = useState<string>('')
    const [actualAmount, setActualAmount] = useState<number>(0)
    const [percentage, setPercentage] = useState<number>(0)

    const monthStr = format(currentMonth, 'yyyy-MM')

    const fetchData = async () => {
        setIsLoading(true)
        try {
            const result = await getSalesPlanning(monthStr)
            setTargetAmount(result.target > 0 ? result.target.toString() : '')
            setActualAmount(result.actual)
            setPercentage(result.percentage)
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

    // Handle comma formatting for input
    const handleTargetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/,/g, '')
        if (/^\d*$/.test(rawValue)) {
            setTargetAmount(rawValue)
        }
    }

    const displayTarget = targetAmount ? Number(targetAmount).toLocaleString() : ''
    const isOverAchieved = percentage >= 100

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-10">
            {/* Header / Month Navigation */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-card/40 backdrop-blur-xl border border-border/40 p-4 rounded-xl">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
                        영업기획 (Sales Planning)
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">월별 목표를 설정하고 달성률을 추적하세요.</p>
                </div>

                <div className="flex items-center gap-4 bg-background/50 p-1 rounded-lg border border-border/50">
                    <Button variant="ghost" size="icon" onClick={prevMonth}>
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div className="w-24 text-center font-mono font-bold text-lg">
                        {monthStr}
                    </div>
                    <Button variant="ghost" size="icon" onClick={nextMonth}>
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Target Registration Card */}
                <Card className="bg-card/40 backdrop-blur-xl border border-border/40">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="w-5 h-5 text-primary" />
                            목표 매출액 설정
                        </CardTitle>
                        <CardDescription>이번 달 영업 목표 금액을 원화 단위로 입력합니다.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
                        ) : (
                            <form onSubmit={handleSaveTarget} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="targetAmount">목표액 (원)</Label>
                                    <div className="relative">
                                        <Input
                                            id="targetAmount"
                                            value={displayTarget}
                                            onChange={handleTargetChange}
                                            placeholder="예: 100,000,000"
                                            className="font-mono text-lg pr-12 bg-background/50 h-12"
                                            autoComplete="off"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">원</div>
                                    </div>
                                </div>
                                <Button type="submit" disabled={isSaving || !targetAmount} className="w-full h-12 text-md">
                                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                    {targetAmount ? '목표 저장 및 수정' : '목표 등록'}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>

                {/* Progress Status Card */}
                <Card className={cn(
                    "bg-card/40 backdrop-blur-xl border transition-all duration-500",
                    isOverAchieved ? "border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.15)]" : "border-border/40"
                )}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className={cn("w-5 h-5", isOverAchieved ? "text-emerald-500" : "text-blue-500")} />
                            현재 달성 현황
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1">
                            실시간 누적 수주액 대비 목표 달성률입니다.
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Info className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="font-semibold text-primary">집계 기준 (수주액 기준)</p>
                                        <p className="text-sm">해당 월에 접수된 '수주 확정' 이상의 전체 주문 금액</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        {isLoading ? (
                            <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
                        ) : (
                            <>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <span className="text-sm text-muted-foreground">누적 수주액</span>
                                        <span className={cn(
                                            "text-3xl font-bold font-mono tracking-tight",
                                            isOverAchieved ? "text-emerald-500" : "text-foreground"
                                        )}>
                                            {actualAmount.toLocaleString()} <span className="text-lg text-muted-foreground font-sans">원</span>
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">목표: {Number(targetAmount || 0).toLocaleString()} 원</span>
                                        <span className={cn(
                                            "font-bold font-mono",
                                            isOverAchieved ? "text-emerald-500" : "text-primary"
                                        )}>{percentage}%</span>
                                    </div>
                                </div>

                                <div className="relative pt-2">
                                    <Progress
                                        value={Math.min(percentage, 100)}
                                        className="h-4"
                                        indicatorClassName={isOverAchieved ? "bg-emerald-500" : "bg-gradient-to-r from-primary/50 to-primary"}
                                    />
                                    {isOverAchieved && (
                                        <div className="absolute -top-6 right-0 text-xs font-bold text-emerald-500 animate-bounce">
                                            목표 100% 초과 달성! 🎉
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
