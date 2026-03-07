'use client'

import { useState, useEffect } from 'react'
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { getPendingShippingOrders } from './actions'
import { format } from 'date-fns'
import { Loader2, Truck, CheckCircle2, ChevronRight, Search, Calendar as CalendarIcon, CornerDownRight } from 'lucide-react'
import { ShipmentModal } from '@/app/dashboard/sales/order/shipment-modal'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'

// Basic layout config for table to adapt cleanly
export function ShippingClient() {
    const [orders, setOrders] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    // Filter states
    const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined })
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'partial' | 'completed'>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [calendarOpen, setCalendarOpen] = useState(false)

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

    // Derived Counts
    const counts = {
        total: orders.length,
        pending: orders.filter((o) => !o.is_fully_shipped && o.total_shipped_quantity === 0).length,
        partial: orders.filter((o) => !o.is_fully_shipped && o.total_shipped_quantity > 0).length,
        completed: orders.filter((o) => o.is_fully_shipped).length,
    }

    // Filter Logic
    const filteredOrders = orders.filter((order) => {
        // Status
        if (statusFilter === 'pending' && (order.is_fully_shipped || order.total_shipped_quantity > 0)) return false
        if (statusFilter === 'partial' && (order.is_fully_shipped || order.total_shipped_quantity === 0)) return false
        if (statusFilter === 'completed' && !order.is_fully_shipped) return false

        // Search
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            const matchPo = order.po_number?.toLowerCase().includes(query)
            const matchClient = order.client_name?.toLowerCase().includes(query)
            const matchProduct = order.product_name?.toLowerCase().includes(query)
            if (!matchPo && !matchClient && !matchProduct) return false
        }

        // Date Range
        if (dateRange.from || dateRange.to) {
            if (!order.due_date) return false
            const due = new Date(order.due_date)
            due.setHours(0, 0, 0, 0)
            if (dateRange.from && due < dateRange.from) return false
            if (dateRange.to) {
                const toDate = new Date(dateRange.to)
                toDate.setHours(23, 59, 59, 999)
                if (due > toDate) return false
            }
        }
        return true
    })

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const isDueSoon = (dueDateStr: string | null, isFullyShipped: boolean) => {
        if (!dueDateStr || isFullyShipped) return false
        const dueDate = new Date(dueDateStr)
        dueDate.setHours(0, 0, 0, 0)
        const diffTime = dueDate.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays >= 0 && diffDays <= 7
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-card/40 backdrop-blur-xl border border-border/40 p-4 rounded-xl">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
                        출하 지시 (Shipping Instructions)
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">확정된 수주의 출하 및 분할 납품을 관리합니다.</p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row gap-3 bg-card/40 border border-border/40 p-3 rounded-xl items-center justify-between">
                <div className="flex flex-1 items-center gap-3 w-full overflow-x-auto">
                    {/* Date Picker */}
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={`h-10 justify-start text-left font-normal bg-slate-900 border-border/50 text-slate-300 w-[240px] shrink-0 ${!dateRange.from && !dateRange.to && 'text-muted-foreground'}`}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange.from ? (
                                    dateRange.to ? (
                                        <>
                                            {format(dateRange.from, 'yyyy.MM.dd')} - {format(dateRange.to, 'yyyy.MM.dd')}
                                        </>
                                    ) : (
                                        format(dateRange.from, 'yyyy.MM.dd')
                                    )
                                ) : (
                                    <span>기간 선택</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 z-[9999]" align="start">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={dateRange?.from}
                                selected={{ from: dateRange?.from, to: dateRange?.to }}
                                onSelect={(range) => {
                                    setDateRange({ from: range?.from, to: range?.to })
                                }}
                                numberOfMonths={2}
                            />
                        </PopoverContent>
                    </Popover>

                    {/* Status Toggles */}
                    <div className="flex bg-slate-900 p-1 rounded-lg border border-border/50 shrink-0 h-10 items-center">
                        <Button
                            onClick={() => setStatusFilter('all')}
                            variant={statusFilter === 'all' ? 'default' : 'ghost'}
                            className={`h-8 rounded-md px-3 text-sm transition-all ${statusFilter === 'all' ? 'bg-emerald-500 hover:bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            전체 <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-black/20 text-[10px]">{counts.total}</span>
                        </Button>
                        <Button
                            onClick={() => setStatusFilter('pending')}
                            variant={statusFilter === 'pending' ? 'default' : 'ghost'}
                            className={`h-8 rounded-md px-3 text-sm transition-all ${statusFilter === 'pending' ? 'bg-indigo-500 hover:bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            미출고 <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-black/20 text-[10px]">{counts.pending}</span>
                        </Button>
                        <Button
                            onClick={() => setStatusFilter('partial')}
                            variant={statusFilter === 'partial' ? 'default' : 'ghost'}
                            className={`h-8 rounded-md px-3 text-sm transition-all ${statusFilter === 'partial' ? 'bg-amber-500 hover:bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            파샬출고 <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-black/20 text-[10px]">{counts.partial}</span>
                        </Button>
                        <Button
                            onClick={() => setStatusFilter('completed')}
                            variant={statusFilter === 'completed' ? 'default' : 'ghost'}
                            className={`h-8 rounded-md px-3 text-sm transition-all ${statusFilter === 'completed' ? 'bg-slate-600 hover:bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            출고완료 <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-black/20 text-[10px]">{counts.completed}</span>
                        </Button>
                    </div>
                </div>

                {/* Search Input */}
                <div className="relative w-full md:w-72 shrink-0">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="발주번호, 거래처, 제품명..."
                        className="h-10 pl-9 bg-slate-900 border-border/50 text-slate-100 focus-visible:ring-emerald-500/30"
                    />
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
                                        <TableHead>고객사</TableHead>
                                        <TableHead>제품명</TableHead>
                                        <TableHead className="w-[100px]">납기일</TableHead>
                                        <TableHead className="w-[150px]">수량현황(출하/발주)</TableHead>
                                        <TableHead className="w-[150px]">입고처</TableHead>
                                        <TableHead className="w-[100px]">상태</TableHead>
                                        <TableHead className="w-[120px] text-right">관리</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredOrders.map((order) => {
                                        const dueSoon = isDueSoon(order.due_date, order.is_fully_shipped)
                                        return (
                                            <TableRow key={order.id} className={cn(
                                                "cursor-default transition-colors",
                                                dueSoon ? "bg-red-500/5 hover:bg-red-500/10" : "hover:bg-muted/30"
                                            )}>
                                                <TableCell className={cn(
                                                    "font-mono text-xs",
                                                    dueSoon && "text-red-400 font-bold"
                                                )}>{order.po_number || '-'}</TableCell>
                                                <TableCell className="font-semibold text-foreground truncate text-sm">
                                                    {order.client_name}
                                                </TableCell>
                                                <TableCell className="max-w-[280px] py-4">
                                                    <div className="flex flex-col items-start gap-1">
                                                        <span className="text-[15px] font-bold text-slate-50 leading-snug break-all px-1" title={order.product_name}>
                                                            {order.product_name}
                                                        </span>
                                                        {(order.client_product_name || order.order_items?.[0]?.client_product_name) && (
                                                            <div className="flex items-start gap-1.5 pl-1.5 opacity-85">
                                                                <CornerDownRight className="w-3.5 h-3.5 mt-0.5 text-slate-500 shrink-0" />
                                                                <span
                                                                    className="text-[13px] text-slate-400 font-medium leading-tight break-all"
                                                                    title={order.client_product_name || order.order_items?.[0]?.client_product_name}
                                                                >
                                                                    {order.client_product_name || order.order_items?.[0]?.client_product_name}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className={cn(
                                                    "text-sm",
                                                    dueSoon && "text-red-400 font-bold"
                                                )}>
                                                    <div className="flex flex-col gap-1">
                                                        {order.due_date ? format(new Date(order.due_date), 'yyyy-MM-dd') : '-'}
                                                        {dueSoon && (
                                                            <Badge variant="outline" className="w-fit bg-red-500/10 text-red-500 border-red-500/30 text-[10px] px-1 h-4 animate-pulse">
                                                                🚨 임박
                                                            </Badge>
                                                        )}
                                                    </div>
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
