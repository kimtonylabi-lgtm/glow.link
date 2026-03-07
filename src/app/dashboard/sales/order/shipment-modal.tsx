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
                    // [보완 4] 잔량 자동 입력 - 0 이하면 0으로
                    const remaining = res.data.remainingQty
                    setShippedQuantity(remaining > 0 ? String(remaining) : '0')
                    // 도착지 자동 채우기
                    setDeliveryAddress(res.data.order?.receiving_destination || '')
                }
                setIsLoadingData(false)
            })
            // 오늘 날짜 기본값
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
                // 데이터 새로고침
                const refreshed = await getShipmentsWithSummary(order!.id)
                if (refreshed.success && refreshed.data) {
                    setSummary(refreshed.data)
                    setShippedQuantity(String(Math.max(0, refreshed.data.remainingQty)))
                    setForceComplete(false)
                }
                setShippingMemo('')
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
    const productName = order.order_items?.[0]?.products?.name || '-'
    const totalQty = summary?.totalOrderQty ?? order.total_quantity ?? 0
    const totalShipped = summary?.totalShipped ?? 0
    const remainingQty = summary?.remainingQty ?? totalQty
    const isFullyShipped = totalQty > 0 && totalShipped >= totalQty

    const progressPct = totalQty > 0 ? Math.min(100, Math.round((totalShipped / totalQty) * 100)) : 0

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-950 border-border/40 p-0">
                {/* 헤더 */}
                <DialogHeader className="sticky top-0 z-10 bg-slate-900 border-b border-border/40 px-6 py-4">
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

                <div className="p-6 space-y-6">
                    {/* 수량 현황 카드 */}
                    <div className="rounded-xl border border-border/40 bg-slate-900/60 p-4 space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-muted-foreground" />
                                <span className="text-muted-foreground">발주 총수량</span>
                            </div>
                            <span className="font-bold font-mono">{totalQty.toLocaleString()} EA</span>
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
                                    <CheckCircle2 className="w-3 h-3 mr-1" /> 출하 완료
                                </Badge>
                            ) : (
                                <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs font-mono">
                                    잔량 {remainingQty.toLocaleString()} EA
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* 출하 히스토리 */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <History className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-semibold text-slate-200">출하 히스토리</span>
                        </div>

                        {isLoadingData ? (
                            <div className="flex justify-center py-6">
                                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : !summary?.shipments.length ? (
                            <div className="text-center py-6 text-sm text-muted-foreground border border-border/30 rounded-lg bg-slate-900/40">
                                아직 출하 내역이 없습니다.
                            </div>
                        ) : (
                            <div className="rounded-lg border border-border/40 overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-800/60 text-slate-400 text-xs">
                                        <tr>
                                            <th className="px-3 py-2 text-left">출하일</th>
                                            <th className="px-3 py-2 text-right">수량</th>
                                            <th className="px-3 py-2 text-left">도착지</th>
                                            <th className="px-3 py-2 text-left">출고 방식</th>
                                            <th className="px-3 py-2 text-center w-10">삭제</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/20">
                                        {summary.shipments.map((s) => (
                                            <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                                                <td className="px-3 py-2.5 font-mono text-xs text-slate-300">
                                                    {s.shipping_date ? format(new Date(s.shipping_date), 'yyyy-MM-dd') : '-'}
                                                </td>
                                                <td className="px-3 py-2.5 text-right font-mono font-bold text-emerald-400">
                                                    {(s.shipped_quantity || 0).toLocaleString()} EA
                                                </td>
                                                <td className="px-3 py-2.5 text-xs text-muted-foreground truncate max-w-[120px]">
                                                    {s.delivery_address || '-'}
                                                </td>
                                                <td className="px-3 py-2.5 text-xs text-muted-foreground">
                                                    {s.shipping_method || '-'}
                                                </td>
                                                <td className="px-3 py-2.5 text-center">
                                                    <button
                                                        onClick={() => handleDelete(s.id)}
                                                        className="p-1 rounded hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors"
                                                        title="출하 취소"
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

                    <Separator className="bg-border/30" />

                    {/* 신규 출하 등록 폼 */}
                    <div>
                        <div className="flex items-center gap-2 mb-4 justify-between">
                            <div className="flex items-center gap-2">
                                <Plus className="w-4 h-4 text-amber-400" />
                                <span className="text-sm font-semibold text-slate-200">이번 출하 등록</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="forceComplete"
                                    checked={forceComplete}
                                    onCheckedChange={(checked) => setForceComplete(checked as boolean)}
                                    className="border-amber-500/50 data-[state=checked]:bg-amber-500 data-[state=checked]:text-amber-950"
                                />
                                <label
                                    htmlFor="forceComplete"
                                    className="text-xs font-medium leading-none text-slate-300 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                >
                                    잔량 상관없이 강제 완료(종결) 처리
                                </label>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* 출하일자 */}
                            <div className="space-y-1.5 col-span-1">
                                <Label className="text-xs text-slate-400">출하일자 *</Label>
                                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-between font-mono text-sm h-10 bg-slate-900 border-border/50 text-slate-100 hover:bg-slate-800"
                                        >
                                            {shippingDate || <span className="text-slate-500">날짜 선택</span>}
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

                            {/* 출하 수량 - 잔량 자동입력 */}
                            <div className="space-y-1.5 col-span-1">
                                <Label className="text-xs text-slate-400 flex items-center gap-1">
                                    출하 수량 * <span className="text-amber-400/60 font-normal">(잔량 자동입력)</span>
                                </Label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={shippedQuantity}
                                    onChange={(e) => {
                                        setShippedQuantity(e.target.value)
                                    }}
                                    className="h-10 bg-slate-900 border-border/50 text-slate-100 font-mono text-right focus-visible:ring-amber-500/30"
                                    placeholder="수량 입력"
                                />
                            </div>

                            {/* 출고 방식 라디오/토글 */}
                            <div className="space-y-1.5 col-span-2">
                                <Label className="text-xs text-slate-400">출고 방식 *</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    <div
                                        onClick={() => setShippingMethod('택배 발송')}
                                        className={`flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${shippingMethod === '택배 발송' ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-slate-900 border-border/50 text-slate-400 hover:bg-slate-800'}`}
                                    >
                                        <Package className="w-4 h-4" />
                                        <span className="text-sm font-semibold">택배 발송</span>
                                    </div>
                                    <div
                                        onClick={() => setShippingMethod('컨테이너 출고')}
                                        className={`flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${shippingMethod === '컨테이너 출고' ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-slate-900 border-border/50 text-slate-400 hover:bg-slate-800'}`}
                                    >
                                        <Archive className="w-4 h-4" />
                                        <span className="text-sm font-semibold">컨테이너 출고</span>
                                    </div>
                                    <div
                                        onClick={() => setShippingMethod('납품차량 출고')}
                                        className={`flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${shippingMethod === '납품차량 출고' ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-slate-900 border-border/50 text-slate-400 hover:bg-slate-800'}`}
                                    >
                                        <Car className="w-4 h-4" />
                                        <span className="text-sm font-semibold">납품차량 출고</span>
                                    </div>
                                </div>
                            </div>

                            {/* 도착지 */}
                            <div className="space-y-1.5 col-span-1">
                                <Label className="text-xs text-slate-400">입고처 (도착지) *</Label>
                                <Input
                                    value={deliveryAddress}
                                    onChange={(e) => setDeliveryAddress(e.target.value)}
                                    className="h-10 bg-slate-900 border-border/50 text-slate-100 focus-visible:ring-amber-500/30"
                                    placeholder="도달지/창고/회사명 입력"
                                />
                            </div>

                            {/* 메모 */}
                            <div className="space-y-1.5 col-span-1">
                                <Label className="text-xs text-slate-400">메모</Label>
                                <Input
                                    value={shippingMemo}
                                    onChange={(e) => setShippingMemo(e.target.value)}
                                    className="h-10 bg-slate-900 border-border/50 text-slate-100 focus-visible:ring-amber-500/30"
                                    placeholder="특이사항 (선택)"
                                />
                            </div>
                        </div>

                        {/* 버튼 영역 */}
                        <div className="flex justify-end gap-3 mt-6">
                            <Button
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                className="bg-slate-900 border-border/50 text-slate-300 hover:bg-slate-800"
                            >
                                닫기
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting || isLoadingData}
                                className={`font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-900/20`}
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                    <Truck className="w-4 h-4 mr-2" />
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
