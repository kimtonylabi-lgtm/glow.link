'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { getPendingShippingOrders } from './actions'
import { format } from 'date-fns'
import { Loader2, Truck, CheckCircle2, ChevronRight } from 'lucide-react'
import { ShipmentModal } from '@/app/dashboard/sales/order/shipment-modal'

// Basic layout config for table to adapt cleanly
export function ShippingClient() {
    const [orders, setOrders] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

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

    // 모달 닫힐 때 데이터 새로고침
    useEffect(() => {
        if (!isDialogOpen) {
            fetchData()
        }
    }, [isDialogOpen])

    const handleOpenDialog = (order: any) => {
        setSelectedOrder(order)
        setIsDialogOpen(true)
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
                                        <TableHead className="w-[120px]">발주번호(PO)</TableHead>
                                        <TableHead>고객사 & 제품명</TableHead>
                                        <TableHead className="w-[100px]">납기일</TableHead>
                                        <TableHead className="w-[150px]">수량현황(출하/발주)</TableHead>
                                        <TableHead className="w-[150px]">입고처</TableHead>
                                        <TableHead className="w-[100px]">상태</TableHead>
                                        <TableHead className="w-[120px] text-right">관리</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orders.map((order) => {
                                        return (
                                            <TableRow key={order.id} className="cursor-default hover:bg-muted/30">
                                                <TableCell className="font-mono text-xs">{order.po_number || '-'}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col min-w-0 leading-tight">
                                                        <span className="font-semibold text-foreground truncate text-sm">
                                                            {order.client_name}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground mt-0.5 truncate">
                                                            {order.product_name}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {order.due_date ? format(new Date(order.due_date), 'yyyy-MM-dd') : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-mono text-sm">
                                                        <span className="text-emerald-500 font-bold">{order.total_shipped_quantity.toLocaleString()}</span>
                                                        <span className="text-muted-foreground mx-1">/</span>
                                                        <span className="text-foreground">{order.total_ordered_quantity.toLocaleString()}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-xs text-muted-foreground truncate max-w-[150px]" title={order.receiving_destination || '-'}>
                                                        {order.receiving_destination || '-'}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {order.is_fully_shipped ? (
                                                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                                                            출하 완료
                                                        </Badge>
                                                    ) : order.total_shipped_quantity > 0 ? (
                                                        <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 whitespace-nowrap">
                                                            부분 출하
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="bg-indigo-500/10 text-indigo-500 border-indigo-500/20 whitespace-nowrap">
                                                            출하 대기
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button size="sm" onClick={() => handleOpenDialog(order)} className="bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold text-xs h-8">
                                                        <Truck className="w-3.5 h-3.5 mr-1.5" /> 출하 지시
                                                    </Button>
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

            <ShipmentModal
                order={selectedOrder}
                isOpen={isDialogOpen}
                onOpenChange={setIsDialogOpen}
            />
        </div>
    )
}
