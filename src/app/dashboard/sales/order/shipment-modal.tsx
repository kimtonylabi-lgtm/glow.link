'use client'

import { useState, useEffect, useTransition } from 'react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Truck, Package, History, Plus, Trash2,
    Loader2, AlertTriangle, CheckCircle2, CalendarIcon, Archive, Car
} from 'lucide-react'
import { getShipmentsWithSummary, createShipment, deleteShipment } from '@/app/dashboard/support/shipping/shipping-actions'
import { useRouter } from 'next/navigation'

interface ShipmentModalProps {
    order: {
        id: string
        po_number?: string
        total_quantity?: number
        total_ordered_quantity?: number
        total_shipped_quantity?: number
        product_name?: string
        clients?: { company_name: string } | null
        order_items?: { products?: { name: string } | null }[]
        receiving_destination?: string | null
    } | null
    isOpen: boolean
    onOpenChange: (open: boolean) => void
}

export function ShipmentModal({ order, isOpen, onOpenChange }: ShipmentModalProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    // 데이터 상태
    const [summary, setSummary] = useState<{
        shipments: any[]
        totalOrderQty: number
        totalShipped: number
        remainingQty: number
    } | null>(null)
    const [isLoadingData, setIsLoadingData] = useState(false)

    // 폼 상태
    const [shippedQuantity, setShippedQuantity] = useState('')
    const [shippingDate, setShippingDate] = useState('')
    const [calendarOpen, setCalendarOpen] = useState(false)
    const [deliveryAddress, setDeliveryAddress] = useState('')
    const [shippingMemo, setShippingMemo] = useState('')
    const [shippingMethod, setShippingMethod] = useState('택배 발송')
    const [forceComplete, setForceComplete] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // 모달 열릴 때 데이터 로드 + 잔량 자동입력
    useEffect(() => {
        if (isOpen && order?.id) {
            setIsLoadingData(true)
            getShipmentsWithSummary(order.id).then((res) => {
                if (res.success && res.data) {
                    setSummary(res.data)
                    const remaining = res.data.remainingQty
                    setShippedQuantity(remaining > 0 ? String(remaining) : '0')
                    setDeliveryAddress(res.data.order?.receiving_destination || '')
                }
                setIsLoadingData(false)
            })
            setShippingDate(format(new Date(), 'yyyy-MM-dd'))
        } else {
            setSummary(null)
            setShippedQuantity('')
            setDeliveryAddress('')
            setShippingMemo('')
            setShippingMethod('택배 발송')
            setForceComplete(false)
        }
    }, [isOpen, order])

    const handleSubmit = async () => {
        const qty = parseInt(shippedQuantity.replace(/,/g, ''))
        if (isNaN(qty) || qty <= 0) {
            toast.error('출하 수량은 1 이상이어야 합니다.')
            return
        }
        if (!shippingDate) {
            toast.error('출하일자를 선택해주세요.')
            return
        }
        if (!deliveryAddress.trim()) {
            toast.error('도착지(입고처)를 입력해주세요.')
            return
        }

        setIsSubmitting(true)
        try {
            const res = await createShipment({
                orderId: order!.id,
                shippedQuantity: qty,
                shippingDate,
                deliveryAddress: deliveryAddress.trim() || undefined,
                shippingMethod,
                shippingMemo: shippingMemo || undefined,
                forceComplete
            })

            if (res.success) {
                toast.success('출하 등록이 완료되었습니다.')
                onOpenChange(false) // [추가] 등록 성공 시 모달 자동 닫기
                startTransition(() => router.refresh())
            } else {
                toast.error(res.error || '출하 등록에 실패했습니다.')
            }
        } catch {
            toast.error('시스템 오류가 발생했습니다.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (shipmentId: string) => {
        if (!confirm('이 출하 내역을 취소하시겠습니까?\n출하 취소 시 수주 상태가 자동으로 되돌아갑니다.')) return

        const res = await deleteShipment(shipmentId)
        if (res.success) {
            toast.success('출하 내역이 취소되었습니다.')
            const refreshed = await getShipmentsWithSummary(order!.id)
            if (refreshed.success && refreshed.data) {
                setSummary(refreshed.data)
                setShippedQuantity(String(Math.max(0, refreshed.data.remainingQty)))
            }
            startTransition(() => router.refresh())
        } else {
            toast.error(res.error || '출하 취소에 실패했습니다.')
        }
    }

    if (!order) return null

    const companyName = order.clients?.company_name || '알 수 없음'
    const productName = order.order_items?.[0]?.products?.name || order.product_name || '-'
    const totalQty = summary?.totalOrderQty ?? order.total_quantity ?? order.total_ordered_quantity ?? 0
    const totalShipped = summary?.totalShipped ?? order.total_shipped_quantity ?? 0
    const remainingQty = summary?.remainingQty ?? Math.max(0, totalQty - totalShipped)
    const isFullyShipped = totalQty > 0 && totalShipped >= totalQty
    const progressPct = totalQty > 0 ? Math.min(100, Math.round((totalShipped / totalQty) * 100)) : 0

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="!max-w-none !w-[1000px] !min-w-[1000px] max-h-[95vh] overflow-hidden bg-slate-950 border-border/40 p-0 flex flex-col">
                {/* 헤더 */}
                <DialogHeader className="sticky top-0 z-10 bg-slate-900 border-b border-border/40 px-6 py-4 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                            <Truck className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-bold text-slate-100 m-0">
                                출하 지시 등록
                            </DialogTitle>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {companyName} · {productName} · PO {order.po_number || '-'}
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                {/* 본문: 가로 2단 분리 (좌: 현황+히스토리 / 우: 입력폼) */}
                <div className="flex-1 flex overflow-hidden">

                    {/* 좌측 영역 */}
                    <div className="w-1/2 p-5 flex flex-col gap-4 overflow-y-auto pr-3">
                        {/* 수량 현황 카드 */}
                        <div className="rounded-xl border border-border/40 bg-slate-900/60 p-4 space-y-3 shrink-0">
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <Package className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">발주 총수량</span>
                                </div>
                                <span className="font-bold font-mono text-slate-200">{totalQty.toLocaleString()} EA</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    <span className="text-muted-foreground">누적 출하</span>
                                </div>
                                <span className="font-bold font-mono text-emerald-400">{totalShipped.toLocaleString()} EA</span>
                            </div>

                            {/* 진행 바 */}
                            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${isFullyShipped ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                    style={{ width: `${progressPct}%` }}
                                />
                            </div>

                            {/* 잔량 배지 */}
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">{progressPct}% 출하 완료</span>
                                {isFullyShipped ? (
                                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">
                                        <CheckCircle2 className="w-3 h-3 mr-1" /> 완료
                                    </Badge>
                                ) : (
                                    <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs font-mono">
                                        잔량 {remainingQty.toLocaleString()} EA
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {/* 출하 히스토리 */}
                        <div className="flex-1 flex flex-col min-h-0 rounded-xl border border-border/40 overflow-hidden">
                            <div className="flex items-center gap-2 p-3 bg-slate-800/60 border-b border-border/40 shrink-0">
                                <History className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-semibold text-slate-200">출하 이력</span>
                            </div>

                            {isLoadingData ? (
                                <div className="flex-1 flex items-center justify-center py-6">
                                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : !summary?.shipments.length ? (
                                <div className="flex-1 flex items-center justify-center p-6 text-sm text-muted-foreground bg-slate-900/40">
                                    출하 내역이 없습니다.
                                </div>
                            ) : (
                                <div className="overflow-y-auto flex-1">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-800/40 text-slate-400 text-xs sticky top-0 backdrop-blur z-10">
                                            <tr>
                                                <th className="px-3 py-2 text-left font-medium">일자</th>
                                                <th className="px-3 py-2 text-right font-medium">수량</th>
                                                <th className="px-3 py-2 text-left font-medium">방식</th>
                                                <th className="px-3 py-2 text-center font-medium w-10">삭제</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/20">
                                            {summary.shipments.map((s) => (
                                                <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                                                    <td className="px-3 py-2 font-mono text-xs text-slate-300">
                                                        {s.shipping_date ? format(new Date(s.shipping_date), 'MM-dd') : '-'}
                                                    </td>
                                                    <td className="px-3 py-2 text-right font-mono font-bold text-emerald-400 text-xs">
                                                        {(s.shipped_quantity || 0).toLocaleString()}
                                                    </td>
                                                    <td className="px-3 py-2 text-[11px] text-muted-foreground">
                                                        {s.shipping_method || '-'}
                                                    </td>
                                                    <td className="px-3 py-2 text-center">
                                                        <button
                                                            onClick={() => handleDelete(s.id)}
                                                            className="p-1 rounded hover:bg-red-500/10 text-slate-500 hover:text-red-400"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 우측 영역 (구분선 포함) */}
                    <div className="w-1/2 p-5 border-l border-border/30 flex flex-col bg-slate-900/20 overflow-y-auto">
                        <div className="flex items-center gap-2 mb-4 justify-between shrink-0">
                            <div className="flex items-center gap-2">
                                <Plus className="w-4 h-4 text-amber-400" />
                                <span className="text-sm font-semibold text-slate-200 whitespace-nowrap">신규 출하 폼</span>
                            </div>
                            <div className="flex items-center space-x-2 bg-slate-900 px-2 py-1.5 rounded-md border border-border/50">
                                <Checkbox
                                    id="forceComplete"
                                    checked={forceComplete}
                                    onCheckedChange={(checked) => setForceComplete(checked as boolean)}
                                    className="border-amber-500/50 data-[state=checked]:bg-amber-500 data-[state=checked]:text-amber-950 w-3.5 h-3.5"
                                />
                                <label
                                    htmlFor="forceComplete"
                                    className="text-[11px] font-medium leading-none text-slate-300 cursor-pointer whitespace-nowrap"
                                >
                                    잔량 상관없이 완료
                                </label>
                            </div>
                        </div>

                        {/* 입력 폼 래퍼 (가로 2단. 우측영역 안에서 또 2단) */}
                        <div className="grid grid-cols-2 gap-x-3 gap-y-4">
                            {/* 출하일자 */}
                            <div className="space-y-1.5 col-span-1">
                                <Label className="text-xs text-slate-400">출하일자 *</Label>
                                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-between font-mono text-xs h-9 bg-slate-900 border-border/50 text-slate-100 px-3"
                                        >
                                            {shippingDate || <span className="text-slate-500">선택</span>}
                                            <CalendarIcon className="w-4 h-4 text-slate-500" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 z-[9999]" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={shippingDate ? new Date(shippingDate) : undefined}
                                            onSelect={(date) => {
                                                if (date) {
                                                    setShippingDate(format(date, 'yyyy-MM-dd'))
                                                    setCalendarOpen(false)
                                                }
                                            }}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* 수량 */}
                            <div className="space-y-1.5 col-span-1">
                                <Label className="text-xs text-slate-400 flex justify-between whitespace-nowrap">
                                    <span>수량 * </span>
                                    <span className="text-amber-400/60 font-normal">잔량입력됨</span>
                                </Label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={shippedQuantity}
                                    onChange={(e) => setShippedQuantity(e.target.value)}
                                    className="h-9 bg-slate-900 border-border/50 text-slate-100 font-mono text-right text-sm"
                                    placeholder="입력"
                                />
                            </div>

                            {/* 도착지 */}
                            <div className="space-y-1.5 col-span-2">
                                <Label className="text-xs text-slate-400">도착지 (입고처) *</Label>
                                <Input
                                    value={deliveryAddress}
                                    onChange={(e) => setDeliveryAddress(e.target.value)}
                                    className="h-9 bg-slate-900 border-border/50 text-slate-100 text-sm"
                                    placeholder="도달지/창고/업체명"
                                />
                            </div>

                            {/* 방식 토글 */}
                            <div className="space-y-1.5 col-span-2">
                                <Label className="text-xs text-slate-400">출고 방식 *</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    <div
                                        onClick={() => setShippingMethod('택배 발송')}
                                        className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border cursor-pointer transition-all ${shippingMethod === '택배 발송' ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-slate-900 border-border/50 text-slate-400'}`}
                                    >
                                        <Package className="w-4 h-4" />
                                        <span className="text-[11px] font-semibold">택배 발송</span>
                                    </div>
                                    <div
                                        onClick={() => setShippingMethod('컨테이너 출고')}
                                        className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border cursor-pointer transition-all ${shippingMethod === '컨테이너 출고' ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-slate-900 border-border/50 text-slate-400'}`}
                                    >
                                        <Archive className="w-4 h-4" />
                                        <span className="text-[11px] font-semibold">컨테이너</span>
                                    </div>
                                    <div
                                        onClick={() => setShippingMethod('납품차량 출고')}
                                        className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border cursor-pointer transition-all ${shippingMethod === '납품차량 출고' ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-slate-900 border-border/50 text-slate-400'}`}
                                    >
                                        <Car className="w-4 h-4" />
                                        <span className="text-[11px] font-semibold">납품차량</span>
                                    </div>
                                </div>
                            </div>

                            {/* 메모 */}
                            <div className="space-y-1.5 col-span-2">
                                <Label className="text-xs text-slate-400">메모</Label>
                                <Input
                                    value={shippingMemo}
                                    onChange={(e) => setShippingMemo(e.target.value)}
                                    className="h-9 bg-slate-900 border-border/50 text-slate-100 text-sm"
                                    placeholder="특이사항"
                                />
                            </div>
                        </div>

                        {/* 버튼 (우측 패널 최하단) */}
                        <div className="flex justify-end gap-2 mt-auto pt-6">
                            <Button
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                className="bg-slate-900 border-border/50 text-slate-300 h-9 px-4"
                            >
                                닫기
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting || isLoadingData}
                                className={`font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 px-5 h-9`}
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                                ) : (
                                    <Truck className="w-4 h-4 mr-1.5" />
                                )}
                                출하 등록
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
