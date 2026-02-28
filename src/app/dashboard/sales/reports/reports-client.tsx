'use client'

import { useState, useEffect, useTransition } from 'react'
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Printer, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { ReportContainer } from "./components/report-container"
import { SummaryView } from "./components/summary-view"
import { PerformanceCharts } from "./components/performance-charts"
import { ActivityTimeline } from "./components/activity-table"
import { ClientHistoryView } from "./components/client-history-view"
import { getReportData, ReportData, ReportPeriod } from "./actions"
import { toast } from "sonner"

interface Client {
    id: string
    company_name: string
}

export function ReportsClient({ clients }: { clients: Client[] }) {
    const [period, setPeriod] = useState<ReportPeriod>('daily')
    const [date, setDate] = useState<Date>(new Date())
    const [data, setData] = useState<ReportData | null>(null)
    const [isPending, startTransition] = useTransition()

    const fetchReport = (p: ReportPeriod, d: Date) => {
        startTransition(async () => {
            try {
                const result = await getReportData(p, d.toISOString())
                setData(result)
            } catch (error) {
                console.error(error)
                toast.error("데이터를 불러오는 중 오류가 발생했습니다.")
            }
        })
    }

    useEffect(() => {
        fetchReport(period, date)
    }, [period, date])

    const handlePrint = () => {
        window.print()
    }

    const getDynamicTitle = () => {
        if (period === 'daily') {
            return `일일 업무보고서 (${format(date, 'yyyy. MM. dd')})`
        } else if (period === 'weekly') {
            const start = startOfWeek(date, { weekStartsOn: 1 })
            const end = endOfWeek(date, { weekStartsOn: 1 })
            return `주간 업무보고서 (${format(start, 'MM.dd')} ~ ${format(end, 'MM.dd')})`
        } else {
            return `월간 업무보고서 (${format(date, 'yyyy년 MM월')})`
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent italic uppercase">Reporting Center</h2>
                    <p className="text-muted-foreground text-sm">경영진 보고용 정규 양식 및 실적 통계를 제공합니다.</p>
                </div>
                <Button onClick={handlePrint} className="gap-2 shadow-lg shadow-primary/20">
                    <Printer className="w-4 h-4" />
                    보고서 인쇄 / PDF 저장
                </Button>
            </div>

            <Tabs defaultValue="period" className="w-full">
                <TabsList className="grid w-[400px] grid-cols-2 bg-background/50 border border-border/40 print:hidden">
                    <TabsTrigger value="period">기간별 보고</TabsTrigger>
                    <TabsTrigger value="client">고객사별 히스토리</TabsTrigger>
                </TabsList>

                <TabsContent value="period" className="mt-6 space-y-6">
                    <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-xl border border-border/40">
                        <div className="flex bg-background rounded-lg border border-border/40 p-1">
                            <Button
                                variant={period === 'daily' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setPeriod('daily')}
                                className="h-8 text-xs px-4"
                            >
                                일일
                            </Button>
                            <Button
                                variant={period === 'weekly' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setPeriod('weekly')}
                                className="h-8 text-xs px-4"
                            >
                                주간
                            </Button>
                            <Button
                                variant={period === 'monthly' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setPeriod('monthly')}
                                className="h-8 text-xs px-4"
                            >
                                월간
                            </Button>
                        </div>

                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    size="sm"
                                    className={cn(
                                        "h-8 justify-start text-left font-normal w-[200px] bg-background",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                                    {date ? format(date, "PPP", { locale: ko }) : <span>날짜 선택</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={(d) => d && setDate(d)}
                                    initialFocus
                                    locale={ko}
                                />
                            </PopoverContent>
                        </Popover>

                        {isPending && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                    </div>

                    {data && (
                        <ReportContainer
                            title={getDynamicTitle()}
                            subtitle="GlowLink Sales Operation & Performance Report"
                        >
                            <SummaryView data={data.summary} />
                            <PerformanceCharts
                                revenueData={data.revenueByDate}
                                performanceData={data.salesPerformance}
                            />
                            <ActivityTimeline activities={data.activityTimeline} />
                        </ReportContainer>
                    )}
                </TabsContent>

                <TabsContent value="client" className="mt-6">
                    <ClientHistoryView clients={clients} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
