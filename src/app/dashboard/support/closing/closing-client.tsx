'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getClosingData, executeMonthClose, reopenMonth } from './actions'
import { toast } from 'sonner'
import { format, subMonths, addMonths } from 'date-fns'
import { ChevronLeft, ChevronRight, Loader2, Lock, Unlock, AlertTriangle, FileSpreadsheet } from 'lucide-react'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from '@/lib/utils'

export function ClosingClient() {
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
    const [isLoading, setIsLoading] = useState(true)
    const [isProcessing, setIsProcessing] = useState(false)
    const [showCloseDialog, setShowCloseDialog] = useState(false)
    const [showReopenDialog, setShowReopenDialog] = useState(false)

    // Data
    const [data, setData] = useState<{
        isClosed: boolean,
        totalRevenue: number,
        shippedCount: number,
        closingInfo: any
    } | null>(null)

    const monthStr = format(currentMonth, 'yyyy-MM')

    const fetchData = async () => {
        setIsLoading(true)
        try {
            const res = await getClosingData(monthStr)
            setData(res as any)
        } catch (error) {
            toast.error('월 마감 데이터를 불러오지 못했습니다.')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [monthStr])

    const handleExecuteClose = async () => {
        if (!data) return
        setIsProcessing(true)
        try {
            const result = await executeMonthClose(monthStr, data.totalRevenue)
            if (result.success) {
                toast.success(`${monthStr} 월 마감이 완료되었습니다. 데이터가 잠금 처리됩니다.`)
                fetchData()
            } else {
                toast.error(result.error)
            }
        } catch (error) {
            toast.error('오류 발생')
        } finally {
            setIsProcessing(false)
            setShowCloseDialog(false)
        }
    }

    const handleReopen = async () => {
        setIsProcessing(true)
        try {
            const result = await reopenMonth(monthStr)
            if (result.success) {
                toast.success('마감 취소 성공. 데이터 잠금이 해제되었습니다.')
                fetchData()
            } else {
                toast.error(result.error)
            }
        } catch (error) {
            toast.error('오류 발생')
        } finally {
            setIsProcessing(false)
            setShowReopenDialog(false)
        }
    }

    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-10">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-card/40 backdrop-blur-xl border border-border/40 p-4 rounded-xl">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
                        매출 마감 (Sales Closing)
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">월별 출하 데이터를 바탕으로 매출을 집계하고 잠금 처리합니다.</p>
                </div>

                <div className="flex items-center gap-4 bg-background/50 p-1 rounded-lg border border-border/50">
                    <Button variant="ghost" size="icon" onClick={prevMonth}>
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div className="w-24 text-center font-mono font-bold text-lg">
                        {monthStr}
                    </div>
                    <Button variant="ghost" size="icon" onClick={nextMonth} disabled={currentMonth >= new Date()}>
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            <Card className={cn(
                "bg-card/40 backdrop-blur-xl border transition-all duration-500 relative overflow-hidden",
                data?.isClosed ? "border-rose-500/50" : "border-border/40"
            )}>
                {data?.isClosed && (
                    <div className="absolute top-0 right-0 p-12 bg-rose-500/10 rotate-45 translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                        <Lock className="w-16 h-16 text-rose-500/20 -rotate-45" />
                    </div>
                )}

                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        {data?.isClosed ? (
                            <><Lock className="w-5 h-5 text-rose-500" /> 마감 완료 ({monthStr})</>
                        ) : (
                            <><Unlock className="w-5 h-5 text-emerald-500" /> 마감 대기 ({monthStr})</>
                        )}
                    </CardTitle>
                    <CardDescription>
                        {data?.isClosed
                            ? "해당 월의 모든 출하 및 수주 데이터가 수정 불가 상태입니다."
                            : "집계된 출하 완료건을 토대로 마감 확정 버튼을 눌러주세요."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    {isLoading ? (
                        <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                            <div className="space-y-2">
                                <span className="text-sm text-muted-foreground font-medium">실 합계 매출액 (출하 기준)</span>
                                <div className="text-4xl font-mono font-bold tracking-tighter text-foreground">
                                    {data?.totalRevenue.toLocaleString()} <span className="text-xl font-sans text-muted-foreground">원</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <span className="text-sm text-muted-foreground font-medium">완료된 출하 지시 건수</span>
                                <div className="text-3xl font-mono font-bold">
                                    {data?.shippedCount} <span className="text-lg text-muted-foreground font-sans tracking-normal font-normal">건</span>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="bg-muted/20 border-t border-border/40 flex justify-between">
                    <Button variant="outline"><FileSpreadsheet className="w-4 h-4 mr-2" />엑셀 백업본 다운로드</Button>

                    {!isLoading && (
                        data?.isClosed ? (
                            <Button variant="outline" className="border-rose-500/50 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600" onClick={() => setShowReopenDialog(true)}>
                                마감 취소 (Admin Only)
                            </Button>
                        ) : (
                            <Button className="bg-rose-600 hover:bg-rose-700 text-white" size="lg" onClick={() => setShowCloseDialog(true)}>
                                매출 마감 확정 <Lock className="w-4 h-4 ml-2" />
                            </Button>
                        )
                    )}
                </CardFooter>
            </Card>

            <AlertDialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center text-rose-500">
                            <AlertTriangle className="w-5 h-5 mr-2" />
                            경고: 마감 확정 전 필수 확인
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2 mt-2">
                            <p><strong>{monthStr}</strong> 월을 마감하시겠습니까?</p>
                            <p>마감 처리 이후에는 해당 월에 속한 어떠한 과거 데이터(수주, 영업활동 내역 등)도 <strong>수정 및 삭제가 완전히 차단(DB Lock)</strong> 됩니다.</p>
                            <p>총 {data?.shippedCount}건 출하액 {data?.totalRevenue.toLocaleString()}원으로 확정됩니다.</p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isProcessing}>취소</AlertDialogCancel>
                        <Button variant="destructive" onClick={handleExecuteClose} disabled={isProcessing}>
                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            예, 변경 불가에 동의하며 마감합니다
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showReopenDialog} onOpenChange={setShowReopenDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>마감 취소 (Reopen)</AlertDialogTitle>
                        <AlertDialogDescription>
                            실수로 마감된 데이터를 되살립니다. 다시 원복할 경우 데이터 정합성 문제가 생길 수 있으니 정말 필요한 경우에만 관리자 권한으로 승인하세요.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isProcessing}>취소</AlertDialogCancel>
                        <Button variant="destructive" onClick={handleReopen} disabled={isProcessing}>
                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            마감 취소 강제 실행
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
