'use client'

import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Clock,
    CheckCircle2,
    FileText,
    History,
    ChevronRight,
    ArrowRightLeft
} from "lucide-react"
import { finalizeQuotation } from "./quotation-actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function QuotationList({ quotations }: { quotations: any[] }) {
    const router = useRouter()

    const handleFinalize = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (!confirm('이 견적을 최종 확정하고 수주로 전환하시겠습니까?')) return

        const result = await finalizeQuotation(id)
        if (result.success) {
            toast.success('수주 확정 완료', { description: '성공적으로 수주 관리로 전환되었습니다.' })
            router.refresh()
        } else {
            toast.error('확정 실패', { description: result.error })
        }
    }

    return (
        <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-xl overflow-hidden shadow-xl">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent border-b-border/40">
                        <TableHead className="w-[100px]">버전</TableHead>
                        <TableHead>상태</TableHead>
                        <TableHead>고객사</TableHead>
                        <TableHead>제품명</TableHead>
                        <TableHead>MOQ</TableHead>
                        <TableHead className="text-right">견적 총액</TableHead>
                        <TableHead className="text-right">작업</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {quotations.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                                <FileText className="w-10 h-10 mx-auto mb-2 opacity-20" />
                                <p>등록된 견적 내역이 없습니다.</p>
                            </TableCell>
                        </TableRow>
                    ) : (
                        quotations.map((quote) => (
                            <TableRow
                                key={quote.id}
                                className="group hover:bg-muted/30 transition-all cursor-pointer border-b-border/40"
                                onClick={() => router.push(`/dashboard/sales/order/quotations/${quote.id}`)}
                            >
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 font-mono">
                                            v{quote.version_no}
                                        </Badge>
                                        {quote.is_current && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_theme(colors.emerald.500)]" />
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {quote.status === 'finalized' ? (
                                        <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1.5">
                                            <CheckCircle2 className="w-3 h-3" /> 확정됨
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 gap-1.5">
                                            <Clock className="w-3 h-3" /> 견적 단계
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell className="font-bold group-hover:text-primary transition-colors">
                                    {quote.clients?.company_name}
                                </TableCell>
                                <TableCell className="text-foreground font-medium">
                                    {quote.quotation_items?.[0]?.products?.name || '-'}
                                </TableCell>
                                <TableCell className="text-muted-foreground font-mono">
                                    {Number(quote.quotation_items?.[0]?.quantity || 0).toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right font-mono font-bold text-primary">
                                    ₩{quote.total_amount.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {quote.status !== 'finalized' && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 text-[11px] font-bold border-emerald-500/30 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-lg hover:shadow-emerald-500/20"
                                                onClick={(e) => handleFinalize(quote.id, e)}
                                            >
                                                최종 확정 <ChevronRight className="w-3 h-3 ml-1" />
                                            </Button>
                                        )}
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary">
                                            <History className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
