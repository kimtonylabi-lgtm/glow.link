'use client'

import { useState, useRef } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
import { Edit2, Trash2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { OrderDetailModal } from "./order-detail-modal"

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
    created_at: string
    clients: { company_name: string } | null
    profiles: { full_name: string | null } | null
    order_items?: {
        products?: {
            name: string
        } | null
    }[]
}

export function OrderList({ orders, userRole }: { orders: Order[], userRole: string }) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const canManage = ['admin', 'head', 'support'].includes(userRole)
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

    const handleSearch = (term: string) => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
        searchTimeoutRef.current = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString())
            if (term) {
                params.set('q', term)
            } else {
                params.delete('q')
            }
            params.delete('page')
            params.set('tab', 'order')
            router.replace(`${pathname}?${params.toString()}`, { scroll: false })
        }, 300)
    }

    const statusConfig = {
        'draft': { label: '초안', color: 'bg-muted/50 text-muted-foreground border-border/50' },
        'confirmed': { label: '수주 확정', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20 shadow-[0_0_10px_theme(colors.blue.500)/20]' },
        'production': { label: '생산 중', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20 shadow-[0_0_10px_theme(colors.purple.500)/20]' },
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
                        onChange={(e) => handleSearch(e.target.value)}
                        defaultValue={searchParams.get('q') || ''}
                    />
                </div>
                {searchParams.get('q') && searchParams.get('tab') === 'order' && (
                    <div className="text-sm text-primary font-medium px-4">
                        총 {orders.length}건의 검색 결과
                    </div>
                )}
            </div>

            <Card className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-xl w-full overflow-hidden shadow-xl">
                {/* Glow Effect Top */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

                <CardHeader className="pt-6">
                    <CardTitle className="bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">수주 현황 (Order Master)</CardTitle>
                    <CardDescription>
                        등록된 모든 수주(Order)의 진행 상태와 총액을 마스터 단위로 관리합니다.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-border/40 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-[120px] font-semibold">진행상태</TableHead>
                                    <TableHead className="font-semibold">고객사</TableHead>
                                    <TableHead className="font-semibold">제품명</TableHead>
                                    <TableHead className="font-semibold">담당자</TableHead>
                                    <TableHead className="font-semibold text-right">수주총액</TableHead>
                                    <TableHead className="font-semibold hidden md:table-cell">수주일</TableHead>
                                    <TableHead className="font-semibold hidden lg:table-cell">납기일</TableHead>
                                    {canManage && <TableHead className="font-semibold text-center w-[100px]">관리</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={canManage ? 7 : 6} className="h-24 text-center text-muted-foreground">
                                            조회된 수주 내역이 없습니다.
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
                                                <TableCell className="font-medium group-hover:text-primary transition-colors">
                                                    {order.clients?.company_name || '알 수 없음'}
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
                                                <TableCell className="text-muted-foreground hidden md:table-cell text-sm relative">
                                                    {/* Line connection effect for recent items */}
                                                    <div className="absolute left-0 top-0 bottom-0 w-px bg-border/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    <div className="pl-3">
                                                        {format(new Date(order.order_date), 'yyyy-MM-dd', { locale: ko })}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground hidden lg:table-cell text-sm">
                                                    {order.due_date ? format(new Date(order.due_date), 'yyyy-MM-dd', { locale: ko }) : '-'}
                                                </TableCell>
                                                {canManage && (
                                                    <TableCell className="text-center">
                                                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                                                        </div>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        )
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>

                <OrderDetailModal
                    isOpen={isDetailModalOpen}
                    onOpenChange={setIsDetailModalOpen}
                    order={selectedOrder}
                />
            </Card>
        </div>
    )
}
