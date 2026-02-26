'use client'

import { useState, useEffect } from 'react'
import { getDashboardData } from './actions'
import { format, subDays } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Calendar as CalendarIcon, DollarSign, Package, FlaskConical, Trophy, Loader2 } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { DateRange } from "react-day-picker"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { Badge } from '@/components/ui/badge'

const COLORS = ['#A855F7', '#3B82F6', '#10B981', '#F59E0B']

const STATUS_MAP: Record<string, { label: string; color: string }> = {
    draft: { label: '임시저장', color: 'bg-muted text-muted-foreground' },
    confirmed: { label: '수주확정', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    production: { label: '생산중', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
    shipped: { label: '발송완료', color: 'bg-primary/10 text-primary border-primary/20' }
}

export function HeadDashboardClient({ recentOrders }: { recentOrders: any[] }) {
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 30),
        to: new Date()
    })

    const [isLoading, setIsLoading] = useState(true)
    const [data, setData] = useState<{
        kpis: { totalRevenue: number; orderCount: number; processingSamples: number; topSalesperson: string };
        charts: { categoryData: any[]; monthlyData: any[] };
    } | null>(null)

    const fetchData = async () => {
        if (!dateRange?.from || !dateRange?.to) return

        setIsLoading(true)
        try {
            const result = await getDashboardData(
                format(dateRange.from, 'yyyy-MM-dd'),
                format(dateRange.to, 'yyyy-MM-dd')
            )
            setData(result)
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [dateRange])

    // Custom Empty States
    const renderEmptyState = (message: string) => (
        <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground border border-dashed border-border/50 rounded-lg bg-card/20">
            <span className="mb-2 text-2xl">📊</span>
            <p className="font-medium">집계된 데이터가 없습니다.</p>
            <p className="text-sm opacity-70">{message}</p>
        </div>
    )

    return (
        <div className="space-y-6 pb-10">
            {/* Header & Date Range Picker */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">통합 지표 분석</h1>
                    <p className="text-muted-foreground mt-2">
                        영업/수주/샘플 현황을 시각화하여 비즈니스 인사이트를 도출합니다.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                id="date"
                                variant={"outline"}
                                className={cn(
                                    "w-[260px] justify-start text-left font-normal bg-card/50",
                                    !dateRange && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange?.from ? (
                                    dateRange.to ? (
                                        <>
                                            {format(dateRange.from, "yy/MM/dd")} -{" "}
                                            {format(dateRange.to, "yy/MM/dd")}
                                        </>
                                    ) : (
                                        format(dateRange.from, "yy/MM/dd")
                                    )
                                ) : (
                                    <span>기간 설정</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={dateRange?.from}
                                selected={dateRange}
                                onSelect={setDateRange}
                                numberOfMonths={2}
                            />
                        </PopoverContent>
                    </Popover>
                    <Button variant="outline" className="h-10 w-10 p-0" onClick={fetchData} disabled={isLoading}>
                        <Loader2 className={cn("h-4 w-4", isLoading && "animate-spin")} />
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Revenue */}
                <Card className="bg-card/40 backdrop-blur-xl border border-border/40 hover:border-primary/30 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">총 수주(매출)액</CardTitle>
                        <DollarSign className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono">
                            {data?.kpis.totalRevenue.toLocaleString('ko-KR') || 0} <span className="text-base text-muted-foreground font-sans">원</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">확정/생산/발송 상태 합계</p>
                    </CardContent>
                </Card>

                {/* Order Count */}
                <Card className="bg-card/40 backdrop-blur-xl border border-border/40 hover:border-primary/30 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">유효 수주 건수</CardTitle>
                        <Package className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono">
                            {data?.kpis.orderCount.toLocaleString('ko-KR') || 0} <span className="text-base text-muted-foreground font-sans">건</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">해당 기간 내 접수된 유효건</p>
                    </CardContent>
                </Card>

                {/* Processing Samples */}
                <Card className="bg-card/40 backdrop-blur-xl border border-border/40 hover:border-primary/30 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">진행 중(가공) 샘플</CardTitle>
                        <FlaskConical className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono">
                            {data?.kpis.processingSamples.toLocaleString('ko-KR') || 0} <span className="text-base text-muted-foreground font-sans">건</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">현재 제작중인 샘플(Processing)</p>
                    </CardContent>
                </Card>

                {/* Top Salesperson */}
                <Card className="bg-card/40 backdrop-blur-xl border border-border/40 hover:border-primary/30 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">기간 내 영업 왕 🏆</CardTitle>
                        <Trophy className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">
                            {isLoading ? '...' : (data?.kpis.topSalesperson || '-')}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">가장 많은 수주액 달성자</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Line Chart */}
                <Card className="lg:col-span-2 bg-card/40 backdrop-blur-xl border border-border/40">
                    <CardHeader>
                        <CardTitle>월별 매출 추이 (최근 6개월)</CardTitle>
                        <CardDescription>과거 6개월 동안의 누적 확정 수주 합계입니다. 선택하신 기간의 마지막 달을 기준으로 합니다.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!data || data.charts.monthlyData.every(d => d.revenue === 0) ? (
                            renderEmptyState("해당 기간의 매출 통계가 존재하지 않습니다.")
                        ) : (
                            <div className="h-[300px] w-full mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={data.charts.monthlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" vertical={false} />
                                        <XAxis dataKey="month" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis
                                            stroke="#ffffff50"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) => `${(value / 10000).toLocaleString()}만`}
                                            domain={[0, 'auto']}
                                        />
                                        <RechartsTooltip
                                            contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px', color: '#fff' }}
                                            formatter={(value: any) => [`${(value || 0).toLocaleString()} 원`, '매출액']}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke="#A855F7"
                                            strokeWidth={3}
                                            dot={{ r: 4, fill: '#A855F7', strokeWidth: 0 }}
                                            activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2 }}
                                            animationDuration={1500}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Pie Chart */}
                <Card className="bg-card/40 backdrop-blur-xl border border-border/40">
                    <CardHeader>
                        <CardTitle>카테고리별 판매 비중</CardTitle>
                        <CardDescription>검색 기간 내 카테고리별 매출 비중입니다.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!data || data.charts.categoryData.length === 0 ? (
                            renderEmptyState("해당 기간 내 카테고리 데이터가 없습니다.")
                        ) : (
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={data.charts.categoryData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={5}
                                            dataKey="value"
                                            animationDuration={1500}
                                        >
                                            {data.charts.categoryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip
                                            contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px', color: '#fff' }}
                                            formatter={(value: any) => [`${(value || 0).toLocaleString()} 원`, 'Subtotal']}
                                        />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Recent Orders List */}
            <Card className="bg-card/40 backdrop-blur-xl border border-border/40 overflow-hidden">
                <CardHeader>
                    <CardTitle>최근 수주 내역</CardTitle>
                    <CardDescription>시스템에 등재된 최신 5건의 주문 내역입니다.</CardDescription>
                </CardHeader>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase bg-muted/40 border-y border-border/40">
                            <tr>
                                <th className="px-6 py-3">주문일</th>
                                <th className="px-6 py-3">고객사</th>
                                <th className="px-6 py-3">담당자</th>
                                <th className="px-6 py-3">총 금액</th>
                                <th className="px-6 py-3">상태</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">
                                        등록된 주문 내용이 없습니다.
                                    </td>
                                </tr>
                            ) : (
                                recentOrders.map((order) => {
                                    const statusInfo = STATUS_MAP[order.status] || { label: order.status, color: 'bg-muted text-muted-foreground' }
                                    return (
                                        <tr key={order.id} className="border-b border-border/30 hover:bg-muted/10 transition-colors">
                                            <td className="px-6 py-4 font-mono text-muted-foreground">
                                                {format(new Date(order.order_date), 'yyyy-MM-dd')}
                                            </td>
                                            <td className="px-6 py-4 font-medium">
                                                {order.clients?.company_name || '알 수 없음'}
                                            </td>
                                            <td className="px-6 py-4 text-muted-foreground">
                                                {order.profiles?.full_name || '알 수 없음'}
                                            </td>
                                            <td className="px-6 py-4 font-bold font-mono">
                                                {order.total_amount.toLocaleString('ko-KR')} 원
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="outline" className={cn("border", statusInfo.color)}>
                                                    {statusInfo.label}
                                                </Badge>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

        </div>
    )
}
