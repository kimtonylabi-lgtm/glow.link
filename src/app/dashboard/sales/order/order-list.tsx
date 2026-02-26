'use client'

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

type Order = {
    id: string
    client_id: string
    sales_person_id: string
    order_date: string
    due_date: string | null
    total_amount: number
    status: 'draft' | 'confirmed' | 'production' | 'shipped'
    memo: string | null
    created_at: string
    clients: { company_name: string } | null
    profiles: { full_name: string | null } | null
}

export function OrderList({ orders }: { orders: Order[] }) {

    const statusConfig = {
        'draft': { label: '초안', color: 'bg-muted/50 text-muted-foreground border-border/50' },
        'confirmed': { label: '수주 확정', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20 shadow-[0_0_10px_theme(colors.blue.500)/20]' },
        'production': { label: '생산 중', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20 shadow-[0_0_10px_theme(colors.purple.500)/20]' },
        'shipped': { label: '출하 완료', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_10px_theme(colors.emerald.500)/20]' }
    }

    return (
        <Card className="bg-card/40 backdrop-blur-xl border-border/40 w-full overflow-hidden">
            {/* Glow Effect Top */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

            <CardHeader>
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
                                <TableHead className="w-[120px] font-semibold">진행 상태</TableHead>
                                <TableHead className="font-semibold">고객사</TableHead>
                                <TableHead className="font-semibold">담당자</TableHead>
                                <TableHead className="font-semibold text-right">수주 총액</TableHead>
                                <TableHead className="font-semibold hidden md:table-cell">수주일</TableHead>
                                <TableHead className="font-semibold hidden lg:table-cell">납기일</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
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
                                                {order.profiles?.full_name || '알 수 없음'}
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-bold">
                                                ₩ {order.total_amount.toLocaleString('ko-KR')}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground hidden md:table-cell text-sm relative">
                                                {/* Line connection effect for recent items */}
                                                <div className="absolute left-0 top-0 bottom-0 w-px bg-border/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <div className="pl-3">
                                                    {format(new Date(order.order_date), 'yy. MM. dd', { locale: ko })}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground hidden lg:table-cell text-sm">
                                                {order.due_date ? format(new Date(order.due_date), 'yy. MM. dd', { locale: ko }) : '-'}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}
