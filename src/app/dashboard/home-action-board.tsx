'use client'

import { useRouter } from 'next/navigation'
import { format, differenceInDays } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
    AlertTriangle, Truck, FileText, ChevronRight,
    PlusCircle, Package
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface HomeActionBoardProps {
    name: string
    urgentOrders: any[]
    pendingShipping: any[]
    draftQuotationCount: number
}

export function HomeActionBoard({ name, urgentOrders, pendingShipping, draftQuotationCount }: HomeActionBoardProps) {
    const router = useRouter()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const getDDayBadge = (dueDateStr: string) => {
        const due = new Date(dueDateStr)
        due.setHours(0, 0, 0, 0)
        const diff = differenceInDays(due, today)
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
                        {format(new Date(), 'yyyy년 MM월 dd일 (eee)', { locale: ko })} · 오늘 처리할 업무를 확인하세요.
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

            {/* 상단 뱃지 3종 */}
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
