/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
    ArrowRightLeft,
    Search
} from "lucide-react"

import { finalizeQuotation } from "./quotation-actions"
import { toast } from "sonner"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useRef, useState, useEffect, useTransition } from "react"
import { useDebounce } from "@/hooks/use-debounce"

export function QuotationList({ quotations }: { quotations: any[] }) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '')
    const debouncedSearchTerm = useDebounce(searchTerm, 300)
    const [isPending, startTransition] = useTransition()
    const isFirstRender = useRef(true)

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
            params.set('tab', 'quotation')
            router.replace(`${pathname}?${params.toString()}`, { scroll: false })
        })
    }, [debouncedSearchTerm, pathname, router, searchParams])

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
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex justify-between items-center bg-card/40 backdrop-blur-xl border border-border/40 p-3 rounded-2xl shadow-sm">
                <div className="flex-1 max-w-md relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="고객사명 또는 제품명, 프로젝트 제목 검색..."
                        className="pl-9 h-10 bg-background/50 border-border/50 focus-visible:ring-primary/30"
                        onChange={(e) => setSearchTerm(e.target.value)}
                        value={searchTerm}
                    />
                </div>
                {searchParams.get('q') && searchParams.get('tab') === 'quotation' && (
                    <div className="text-sm text-primary font-medium px-4">
                        총 {quotations.length}건의 검색 결과
                    </div>
                )}
            </div>

            <div className={`rounded-2xl border border-border/40 bg-card/40 backdrop-blur-xl relative transition-opacity duration-300 ${isPending ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                <div className="overflow-x-auto">
                    <Table className="min-w-[1000px]">
                        <TableHeader className="bg-muted/30">
                            <TableRow className="hover:bg-transparent border-b-border/40">
                                <TableHead className="w-[100px]">버전</TableHead>
                                <TableHead>상태</TableHead>
                                <TableHead>고객사</TableHead>
                                <TableHead>제품명</TableHead>
                                <TableHead>MOQ</TableHead>
                                <TableHead className="text-right">단가</TableHead>
                                <TableHead className="text-right">작업</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {quotations.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
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
                                            ₩{Number(quote.quotation_items?.[0]?.unit_price || 0).toLocaleString()}
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
            </div>
        </div>
    )
}
