'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { getPendingShippingOrders, processShipping } from './actions'
import { format } from 'date-fns'
import { Loader2, Truck, CheckCircle2, ChevronRight, PackageCheck } from 'lucide-react'

// Basic layout config for table to adapt cleanly
export function ShippingClient() {
    const [orders, setOrders] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    // Form states
    const [shipQuantity, setShipQuantity] = useState<string>('')
    const [trackingNumber, setTrackingNumber] = useState<string>('')
    const [shippingMemo, setShippingMemo] = useState<string>('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const fetchData = async () => {
        setIsLoading(true)
        try {
            const data = await getPendingShippingOrders()
            // We only care about showing orders that are not fully shipped yet, or recently shipped
            setOrders(data || [])
        } catch (error) {
            toast.error('출하 데이터를 불러오지 못했습니다.')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleOpenDialog = (order: any) => {
        setSelectedOrder(order)
        const remaining = order.total_ordered_quantity - order.total_shipped_quantity
        setShipQuantity(remaining > 0 ? remaining.toString() : '0')
        setTrackingNumber('')
        setShippingMemo('')
        setIsDialogOpen(true)
    }

    const handleSubmitShipping = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedOrder) return

        const qty = parseInt(shipQuantity)
        if (isNaN(qty) || qty <= 0) {
            toast.error('유효한 출하 수량을 입력해주세요.')
            return
        }

        setIsSubmitting(true)
        try {
            const res = await processShipping(selectedOrder.id, qty, trackingNumber, shippingMemo)
            if (res.success) {
                toast.success('성공적으로 출하 지시가 등록되었습니다.')
                setIsDialogOpen(false)
                fetchData()
            } else {
                toast.error(res.error || '출하 등록 실패')
            }
        } catch (error) {
            toast.error('시스템 오류가 발생했습니다.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-10">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-card/40 backdrop-blur-xl border border-border/40 p-4 rounded-xl">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
                        출하 지시 (Shipping Instructions)
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">확정된 수주의 출하 및 분할 납품을 관리합니다.</p>
                </div>
            </div>

            <Card className="bg-card/40 backdrop-blur-xl border border-border/40">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Truck className="w-5 h-5 text-primary" />
                        출하 대기 목록
                    </CardTitle>
                    <CardDescription>진행 중인 모든 오더와 수량 상태를 보여줍니다.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
                    ) : orders.length === 0 ? (
                        <div className="text-center p-8 text-muted-foreground">현재 처리할 출하 대기건이 없습니다.</div>
                    ) : (
                        <div className="rounded-md border border-border/40 overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead>수주 번호</TableHead>
                                        <TableHead>고객사</TableHead>
                                        <TableHead>납기일</TableHead>
                                        <TableHead>수량 현황</TableHead>
                                        <TableHead>상태</TableHead>
                                        <TableHead className="text-right">액션</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orders.map((order) => {
                                        const remaining = order.total_ordered_quantity - order.total_shipped_quantity

                                        return (
                                            <TableRow key={order.id} className="cursor-default hover:bg-muted/30">
                                                <TableCell className="font-mono text-xs">{order.id.split('-')[0]}</TableCell>
                                                <TableCell className="font-medium">{order.client_name}</TableCell>
                                                <TableCell>{order.due_date ? format(new Date(order.due_date), 'yyyy-MM-dd') : '-'}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col text-sm">
                                                        <span>발주: <b>{order.total_ordered_quantity.toLocaleString()}</b> EA</span>
                                                        <span className="text-muted-foreground">출하완료: {order.total_shipped_quantity.toLocaleString()} EA</span>
                                                        {remaining > 0 && <span className="text-destructive font-semibold">미출하: {remaining.toLocaleString()} EA</span>}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {order.is_fully_shipped ? (
                                                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                                                            <CheckCircle2 className="w-3 h-3 mr-1" /> 출하완료
                                                        </Badge>
                                                    ) : order.total_shipped_quantity > 0 ? (
                                                        <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">부분출하 (진행중)</Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">출하 대기</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {!order.is_fully_shipped && (
                                                        <Button size="sm" onClick={() => handleOpenDialog(order)}>
                                                            출하 지시 <ChevronRight className="w-4 h-4 ml-1" />
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>출하 지시서 작성</DialogTitle>
                        <DialogDescription>
                            실제 현장에서 출하된 수량과 물류 정보를 입력해주세요.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedOrder && (
                        <form onSubmit={handleSubmitShipping}>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label>대상 오더 요약</Label>
                                    <div className="text-sm p-3 bg-muted/50 rounded-md border border-border/50">
                                        <p>고객사: {selectedOrder.client_name}</p>
                                        <p className="text-destructive font-medium mt-1">
                                            미출하 잔여 수량: {(selectedOrder.total_ordered_quantity - selectedOrder.total_shipped_quantity).toLocaleString()} EA
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="quantity">금번 출하 수량 (EA)</Label>
                                    <Input
                                        id="quantity"
                                        type="number"
                                        min="1"
                                        max={selectedOrder.total_ordered_quantity - selectedOrder.total_shipped_quantity}
                                        value={shipQuantity}
                                        onChange={(e) => setShipQuantity(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tracking">송장 번호 (Tracking Number)</Label>
                                    <Input
                                        id="tracking"
                                        placeholder="운송장 번호를 입력하세요"
                                        value={trackingNumber}
                                        onChange={(e) => setTrackingNumber(e.target.value)}
                                        autoComplete="off"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="memo">비고 (선택)</Label>
                                    <Input
                                        id="memo"
                                        placeholder="특이사항 메모"
                                        value={shippingMemo}
                                        onChange={(e) => setShippingMemo(e.target.value)}
                                        autoComplete="off"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>취소</Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    <PackageCheck className="w-4 h-4 mr-2" />
                                    지시 완료
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

        </div>
    )
}
