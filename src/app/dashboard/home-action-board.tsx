'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format, differenceInDays, subMonths, addMonths } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
    AlertTriangle, Truck, FileText, ChevronRight, ChevronLeft,
    PlusCircle, Package, Target, TrendingUp, Zap, AlertCircle,
    Users, LayoutDashboard
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import {
    ResponsiveContainer,
    RadialBarChart,
    RadialBar,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { getSalesPlanning } from './sales/planning/actions'
import { MonthlyGoalModal } from './sales/planning/MonthlyGoalModal'
import { toast } from 'sonner'

interface HomeActionBoardProps {
    name: string
    urgentOrders: any[]
    pendingShipping: any[]
    draftQuotationCount: number
    planningData: any
}

export function HomeActionBoard({ name, urgentOrders, pendingShipping, draftQuotationCount, planningData: initialPlanningData }: HomeActionBoardProps) {
    const router = useRouter()
    const today = new Date()

    // State for interactive KPI tracking
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
    const [isLoading, setIsLoading] = useState(false)
    const [planningData, setPlanningData] = useState(initialPlanningData)

    const monthStr = format(currentMonth, 'yyyy-MM')

    const fetchData = async () => {
        setIsLoading(true)
        try {
            const result = await getSalesPlanning(monthStr)
            if (result.success) {
                setPlanningData(result)
            }
        } catch (error) {
            toast.error('영업 데이터를 불러오지 못했습니다.')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (monthStr !== format(new Date(), 'yyyy-MM')) {
            fetchData()
        }
    }, [monthStr])

    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

    const targetAmount = planningData?.target || 0
    const actualAmount = planningData?.actual || 0
    const percentage = planningData?.percentage || 0
    const predictions = planningData?.predictions || []

    const isOverAchieved = percentage >= 100
    const chartValue = Math.min(percentage, 100)
    const chartData = [{ name: 'Achievement', value: chartValue, fill: isOverAchieved ? '#10b981' : '#3b82f6' }]

    const getDDayBadge = (dueDateStr: string) => {
        const d = new Date(dueDateStr)
        d.setHours(0, 0, 0, 0)
        const diff = differenceInDays(d, today)
        if (diff < 0) return { label: `D+${Math.abs(diff)} 초과`, color: 'bg-red-600 text-white' }
        if (diff === 0) return { label: 'D-DAY', color: 'bg-red-500 text-white animate-pulse' }
        return { label: `D-${diff}`, color: diff <= 3 ? 'bg-orange-500 text-white' : 'bg-amber-500/80 text-white' }
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10 animate-in fade-in duration-500">
            {/* 인사 헤더 + 퀵버튼 */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card/40 backdrop-blur-xl border border-border/40 p-5 rounded-2xl">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        안녕하세요, <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">{name}</span>님 👋
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {format(new Date(), 'yyyy년 MM월 dd일 (eee)', { locale: ko })} · 전사 실적 및 현황을 확인하세요.
                    </p>
                </div>
                <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline"
                        className="h-9 border-primary/30 text-primary hover:bg-primary/10 font-bold gap-1.5"
                        onClick={() => router.push('/dashboard/sales/order?tab=quotation')}>
                        <PlusCircle className="w-3.5 h-3.5" /> 견적 작성
                    </Button>
                    <Button size="sm"
                        className="h-9 bg-primary hover:bg-primary/90 font-bold gap-1.5"
                        onClick={() => router.push('/dashboard/sales/order?tab=order')}>
                        <PlusCircle className="w-3.5 h-3.5" /> 수주 등록
                    </Button>
                </div>
            </div>

            {/* KPI 달력 네비게이션 스트립 */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2 bg-card/40 backdrop-blur-3xl border border-border/40 p-3 rounded-2xl shadow overflow-hidden relative">
                <div className="flex items-center gap-3 relative z-10">
                    <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 shrink-0">
                        <Target className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-sm font-black tracking-tight">영업 실적 네비게이터</h1>
                        <p className="text-[10px] text-muted-foreground uppercase">Monthly Sales KPI Tracking</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 relative z-10">
                    <div className="flex items-center gap-1 bg-background/50 px-2 py-1 rounded-xl border border-border/40">
                        <Button variant="ghost" size="icon" onClick={prevMonth} className="hover:bg-primary/10 rounded-lg h-6 w-6">
                            <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        <div className="w-24 text-center font-mono font-black text-sm tracking-tighter">
                            {format(currentMonth, 'yyyy. MM')}
                        </div>
                        <Button variant="ghost" size="icon" onClick={nextMonth} className="hover:bg-primary/10 rounded-lg h-6 w-6">
                            <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                    <MonthlyGoalModal onSuccess={() => fetchData()} />
                </div>
            </div>

            {/* AI Insight Banner */}
            {predictions.length > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 backdrop-blur-xl relative overflow-hidden group shadow-lg shadow-amber-500/5">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30 shrink-0">
                                <AlertCircle className="w-5 h-5 text-amber-500" />
                            </div>
                            <div>
                                <h3 className="text-xs font-black text-amber-500 tracking-tight flex items-center gap-2 uppercase">AI Smart Insight</h3>
                                <p className="text-xs text-amber-500/80 font-medium mt-0.5">
                                    <span className="font-bold">[{predictions[0].company_name}]</span>의 수주 발주 주기가 도래했습니다. (확률 87%)
                                </p>
                            </div>
                        </div>
                        <Button size="sm" variant="outline" className="border-amber-500/50 text-amber-500 hover:bg-amber-500/20 rounded-xl font-bold text-[10px]" asChild>
                            <Link href="/dashboard/sales/crm">CRM 분석기 열기</Link>
                        </Button>
                    </div>
                </div>
            )}

            {/* KPI Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* 1. Gauge Chart */}
                <Card className="lg:col-span-12 xl:col-span-5 bg-card/40 backdrop-blur-xl border border-border/40 rounded-2xl shadow overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                    <CardHeader className="pb-1 pt-3 px-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-black flex items-center gap-1.5">
                                <TrendingUp className="w-4 h-4 text-primary" /> 실시간 달성률
                            </CardTitle>
                            <span className={cn("text-xl font-black font-mono tracking-tighter", isOverAchieved ? "text-emerald-400" : "text-primary")}>
                                {percentage}%
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="h-[140px] flex items-center justify-center relative px-2 pb-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadialBarChart cx="50%" cy="85%" innerRadius="80%" outerRadius="110%" startAngle={180} endAngle={0} barSize={10} data={chartData}>
                                <RadialBar background={{ fill: 'rgba(255,255,255,0.05)' }} dataKey="value" cornerRadius={8} />
                            </RadialBarChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center mt-10">
                            <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-50">Target</p>
                            <p className="text-sm font-black font-mono">₩ {targetAmount.toLocaleString()}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Target + Tools */}
                <div className="lg:col-span-12 xl:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card className="bg-card/40 backdrop-blur-xl border border-border/40 rounded-2xl shadow overflow-hidden">
                        <CardHeader className="pb-1 pt-3 px-4">
                            <CardTitle className="text-sm font-black flex items-center gap-1.5">
                                <Target className="w-4 h-4 text-primary" /> Sales Target
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-3">
                            <div className="p-3 rounded-xl bg-muted/20 border border-border/20">
                                <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-1 block">Current Month Goal</Label>
                                <span className="text-lg font-black font-mono tracking-tighter">₩ {targetAmount.toLocaleString()}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="bg-gradient-to-br from-primary via-primary/80 to-blue-600 rounded-2xl p-4 text-primary-foreground shadow-xl shadow-primary/20 flex flex-col justify-between">
                        <div className="space-y-0.5">
                            <h3 className="text-sm font-black tracking-tighter">Management Tools</h3>
                            <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest">핵심 관리 도구</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-3">
                            <Button variant="secondary" className="h-8 rounded-lg font-black uppercase tracking-widest text-[10px] gap-1.5" asChild>
                                <Link href="/dashboard/sales/crm"><Users className="w-3 h-3" /> CRM</Link>
                            </Button>
                            <Button variant="secondary" className="h-8 rounded-lg font-black uppercase tracking-widest text-[10px] gap-1.5" asChild>
                                <Link href="/dashboard/sales/reports"><FileText className="w-3 h-3" /> 리포트</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 업무 현황 뱃지 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="group cursor-pointer bg-red-500/5 border border-red-500/20 hover:border-red-500/50 rounded-2xl p-5 flex items-center gap-4 transition-all"
                    onClick={() => router.push('/dashboard/sales/order?tab=delivery')}>
                    <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">납기 임박 (D-7)</p>
                        <div className="flex items-end gap-1 mt-0.5">
                            <span className="text-3xl font-black text-red-500">{urgentOrders.length}</span>
                            <span className="text-sm text-muted-foreground mb-1">건</span>
                        </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground/30 ml-auto group-hover:text-red-500 transition-colors" />
                </div>

                <div className="group cursor-pointer bg-amber-500/5 border border-amber-500/20 hover:border-amber-500/50 rounded-2xl p-5 flex items-center gap-4 transition-all"
                    onClick={() => router.push('/dashboard/support/shipping')}>
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                        <Package className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">출하 대기</p>
                        <div className="flex items-end gap-1 mt-0.5">
                            <span className="text-3xl font-black text-amber-500">{pendingShipping.length}</span>
                            <span className="text-sm text-muted-foreground mb-1">건</span>
                        </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground/30 ml-auto group-hover:text-amber-500 transition-colors" />
                </div>

                <div className="group cursor-pointer bg-indigo-500/5 border border-indigo-500/20 hover:border-indigo-500/50 rounded-2xl p-5 flex items-center gap-4 transition-all"
                    onClick={() => router.push('/dashboard/sales/order?tab=quotation')}>
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                        <FileText className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">미승인 견적</p>
                        <div className="flex items-end gap-1 mt-0.5">
                            <span className="text-3xl font-black text-indigo-400">{draftQuotationCount}</span>
                            <span className="text-sm text-muted-foreground mb-1">건</span>
                        </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground/30 ml-auto group-hover:text-indigo-400 transition-colors" />
                </div>
            </div>

            {/* 중앙 액션 보드 50:50 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 좌: D-7 납기임박 */}
                <div className="bg-card/40 backdrop-blur-xl border border-border/40 rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 bg-red-500/5 border-b border-red-500/10">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                            <h2 className="font-bold text-sm">🚨 D-7 납기 임박</h2>
                        </div>
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground hover:text-red-400"
                            onClick={() => router.push('/dashboard/sales/order?tab=delivery')}>
                            전체보기 <ChevronRight className="w-3 h-3 ml-1" />
                        </Button>
                    </div>
                    <div className="divide-y divide-border/30 max-h-[400px] overflow-y-auto">
                        {urgentOrders.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <p className="text-sm">납기 임박 건이 없습니다 🎉</p>
                            </div>
                        ) : urgentOrders.map((order: any) => {
                            const dday = getDDayBadge(order.due_date)
                            return (
                                <div key={order.id}
                                    className="flex items-center px-5 py-3.5 hover:bg-muted/20 cursor-pointer transition-colors group"
                                    onClick={() => router.push('/dashboard/sales/order?tab=delivery')}>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm truncate">{order.clients?.company_name || '-'}</p>
                                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                                            {order.order_items?.[0]?.products?.name || '-'} · PO {order.po_number || '-'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 ml-3">
                                        <span className={cn('text-[11px] font-black px-2 py-0.5 rounded-full', dday.color)}>
                                            {dday.label}
                                        </span>
                                        <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-red-400 transition-colors" />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* 우: 출하 대기 */}
                <div className="bg-card/40 backdrop-blur-xl border border-border/40 rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 bg-amber-500/5 border-b border-amber-500/10">
                        <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-amber-500" />
                            <h2 className="font-bold text-sm">📦 출하 대기</h2>
                        </div>
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground hover:text-amber-400"
                            onClick={() => router.push('/dashboard/support/shipping')}>
                            출하 처리 <ChevronRight className="w-3 h-3 ml-1" />
                        </Button>
                    </div>
                    <div className="divide-y divide-border/30 max-h-[400px] overflow-y-auto">
                        {pendingShipping.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <p className="text-sm">출하 대기 건이 없습니다 🎉</p>
                            </div>
                        ) : pendingShipping.map((order: any) => {
                            const totalOrdered = order.total_quantity || order.order_items?.reduce((s: number, i: any) => s + (i.quantity || 0), 0) || 0
                            const totalShipped = order.shipping_orders?.reduce((s: number, sh: any) => s + (sh.shipped_quantity || 0), 0) || 0
                            const remaining = totalOrdered - totalShipped
                            return (
                                <div key={order.id}
                                    className="flex items-center px-5 py-3.5 hover:bg-muted/20 cursor-pointer transition-colors group"
                                    onClick={() => router.push('/dashboard/support/shipping')}>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm truncate">{order.clients?.company_name || '-'}</p>
                                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                                            {order.order_items?.[0]?.products?.name || '-'} · {remaining.toLocaleString()} EA 잔량
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 ml-3">
                                        <Badge variant="outline" className="text-[10px] font-bold bg-amber-500/10 text-amber-400 border-amber-500/30">
                                            {order.status === 'partially_shipped' ? '부분출하' : '미출하'}
                                        </Badge>
                                        <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-amber-400 transition-colors" />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}
