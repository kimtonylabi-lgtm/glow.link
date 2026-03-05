'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useDebounce } from '@/hooks/use-debounce'
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

import { Edit2, Trash2, Search, Undo2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { OrderDetailModal } from "./order-detail-modal"
import { cancelOrderConfirmation } from "./order-actions"
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

type Order = {
    id: string
    client_id: string
    sales_person_id: string
    order_date: string
    due_date: string | null
    total_amount: number
    status: 'draft' | 'confirmed' | 'production' | 'shipped'
    po_number?: string
    memo: string | null
    warehouse: string | null
    created_at: string
    clients: { company_name: string } | null
    profiles: { full_name: string | null } | null
    order_items?: {
        products?: {
            name: string
        } | null
    }[]
}

export function OrderList({ orders, userRole, tabType = 'order' }: { orders: Order[], userRole: string, tabType?: 'order' | 'delivery' }) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const canManage = ['admin', 'head', 'support'].includes(userRole)
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '')
    const debouncedSearchTerm = useDebounce(searchTerm, 300)
    const [isPending, startTransition] = useTransition()
    const isFirstRender = useRef(true)

    const [cancelModalOpen, setCancelModalOpen] = useState(false)
    const [orderToCancel, setOrderToCancel] = useState<Order | null>(null)
    const [cancelReason, setCancelReason] = useState('')
    const [isCancelling, setIsCancelling] = useState(false)

    const handleCancelSubmit = async () => {
        if (!orderToCancel) return
        if (!cancelReason.trim()) {
            toast.error('취소 사유를 입력해주세요.')
            return
        }

        setIsCancelling(true)
        try {
            const res = await cancelOrderConfirmation(orderToCancel.id, cancelReason)
            if (res.success) {
                toast.success('발주 확정이 취소되었으며 수주 관리로 롤백되었습니다.')
                setCancelModalOpen(false)
                setOrderToCancel(null)
                setCancelReason('')
                router.refresh()
            } else {
                toast.error(res.error || '이관 취소에 실패했습니다.')
            }
        } catch (e) {
            toast.error('오류가 발생했습니다.')
        } finally {
            setIsCancelling(false)
        }
    }

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false
            return
        }

        const currentQ = searchParams.get('q') || ''
        if (currentQ === debouncedSearchTerm) return

        startTransition(() => {
            const params = new URLSearchParams(searchParams.toString())
            if (debouncedSearchTerm) {
                params.set('q', debouncedSearchTerm)
            } else {
                params.delete('q')
            }
            params.delete('page')
            params.set('tab', tabType)
            router.replace(`${pathname}?${params.toString()}`, { scroll: false })
        })
    }, [debouncedSearchTerm, pathname, router, searchParams])

    const statusConfig = {
        'draft': { label: '수주 대기', color: 'bg-muted/50 text-muted-foreground border-border/50' },
        'confirmed': { label: '수주 확정', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20 shadow-[0_0_10px_theme(colors.blue.500)/20]' },
        'production': { label: '생산 진행', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20 shadow-[0_0_10px_theme(colors.indigo.500)/20]' },
        'shipped': { label: '출하 완료', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_10px_theme(colors.emerald.500)/20]' }
    }

    return (
        <div className="space-y-4">
            {/* Search Bar - Moved OUTSIDE Card to match quotation-list.tsx exactly */}
            <div className="flex justify-between items-center bg-card/40 backdrop-blur-xl border border-border/40 p-3 rounded-2xl shadow-sm">
                <div className="flex-1 max-w-md relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="고객사명, 제품명 또는 PO No. 검색..."
                        className="pl-9 h-10 bg-background/50 border-border/50 focus-visible:ring-primary/30"
                        onChange={(e) => setSearchTerm(e.target.value)}
                        value={searchTerm}
                    />
                </div>
                {searchParams.get('q') && searchParams.get('tab') === tabType && (
                    <div className="text-sm text-primary font-medium px-4">
                        총 {orders.length}건의 검색 결과
                    </div>
                )}
            </div>

            <div className={`rounded-2xl border border-border/40 bg-card/40 backdrop-blur-xl w-full shadow-xl relative transition-opacity duration-300 ${isPending ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                {/* Glow Effect Top */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

                <div className="overflow-x-auto">
                    <Table className="min-w-[1000px]">
                        <TableHeader className="bg-muted/30">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-[120px] font-semibold">진행상태</TableHead>
                                <TableHead className="font-semibold text-center w-[120px]">발주번호(PO)</TableHead>
                                <TableHead className="font-semibold">고객사</TableHead>
                                <TableHead className="font-semibold">제품명</TableHead>
                                <TableHead className="font-semibold">담당자</TableHead>
                                <TableHead className="font-semibold text-right">수주총액</TableHead>
                                <TableHead className="font-semibold whitespace-nowrap">수주일</TableHead>
                                <TableHead className="font-semibold whitespace-nowrap">납기일</TableHead>
                                <TableHead className="font-semibold text-center whitespace-nowrap">관리</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                                        조회된 내역이 없습니다.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                orders.map((order) => {
                                    const config = statusConfig[order.status]
                                    return (
                                        <TableRow key={order.id} className="group hover:bg-muted/20 transition-colors cursor-pointer">
                                            <TableCell>
                                                <Badge variant="outline" className={config.color}>
                                                    {config.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center font-mono opacity-80 text-sm">
                                                {order.po_number || '-'}
                                            </TableCell>
                                            <TableCell className="group-hover:text-primary transition-colors">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-foreground">
                                                        {order.clients?.company_name || '알 수 없음'}
                                                    </span>
                                                    {order.warehouse && (
                                                        <span className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                                                            <span className="opacity-50">↳</span> 입고처: {order.warehouse}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-foreground">
                                                        {order.order_items?.[0]?.products?.name || '제품 없음'}
                                                    </span>
                                                    {(order.order_items?.length || 0) > 1 && (
                                                        <span className="text-[10px] text-muted-foreground mt-0.5">
                                                            외 {order.order_items!.length - 1}건
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {order.profiles?.full_name || '알 수 없음'}
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-bold">
                                                ₩ {order.total_amount.toLocaleString('ko-KR')}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground whitespace-nowrap text-sm relative">
                                                {/* Line connection effect for recent items */}
                                                <div className="absolute left-0 top-0 bottom-0 w-px bg-border/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <div className="pl-3">
                                                    {format(new Date(order.order_date), 'yyyy-MM-dd', { locale: ko })}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground whitespace-nowrap text-sm">
                                                {order.due_date ? format(new Date(order.due_date), 'yyyy-MM-dd', { locale: ko }) : '-'}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-1 transition-opacity">
                                                    {tabType === 'order' ? (
                                                        <>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-8 w-8"
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    setSelectedOrder(order)
                                                                    setIsDetailModalOpen(true)
                                                                }}
                                                            >
                                                                <Edit2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive">
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-8 text-[11px] font-semibold px-2 border border-slate-700/50 hover:bg-slate-800 text-slate-300 hover:text-slate-100"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setOrderToCancel(order)
                                                                setCancelReason('')
                                                                setCancelModalOpen(true)
                                                            }}
                                                        >
                                                            <Undo2 className="h-3 w-3 mr-1" /> 확정 취소
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                <OrderDetailModal
                    isOpen={isDetailModalOpen}
                    onOpenChange={setIsDetailModalOpen}
                    order={selectedOrder}
                    readOnly={tabType === 'delivery'}
                />

                <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="text-xl">이관 확정 취소</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <p className="text-sm text-muted-foreground">
                                발주 확정을 취소하고 수주 대기 상태로 되돌립니다.<br />
                                돌아간 주문 내역은 담당자가 다시 수정하고, 이관할 수 있습니다.
                            </p>
                            <div className="space-y-2 mt-2">
                                <label className="text-sm font-semibold">
                                    취소 사유 (필수) <span className="text-destructive">*</span>
                                </label>
                                <Textarea
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    placeholder="단가 조정 대상, 공장 캐파 부족 등 사유를 입력하세요."
                                    className="resize-none min-h-[100px]"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setCancelModalOpen(false)}>
                                닫기
                            </Button>
                            <Button onClick={handleCancelSubmit} disabled={isCancelling} variant="destructive">
                                {isCancelling ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Undo2 className="w-4 h-4 mr-2" />}
                                취소 원복 실행
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}

