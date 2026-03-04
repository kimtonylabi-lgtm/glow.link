'use client'

import React from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
    Clock,
    TrendingDown,
    TrendingUp,
    ArrowRight,
    History as HistoryIcon,
    FileCheck,
    AlertCircle,
    ChevronLeft
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { QuotationFormSheet } from '../../quotation-form-sheet'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { finalizeQuotation } from '../../quotation-actions'

export function QuotationDetailView({ quote, versions, clients, products }: { quote: any, versions: any[], clients?: any[], products?: any[] }) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    const handleFinalize = () => {
        startTransition(async () => {
            const res = await finalizeQuotation(quote.id)
            if (res.success) {
                toast.success('수주가 확정되었습니다.')
                router.push('/dashboard/sales/order')
            } else {
                toast.error(res.error || '수주 확정 실패')
            }
        })
    }

    const initialData = quote ? {
        client_name: quote.clients?.company_name || '',
        is_vat_included: quote.is_vat_included,
        items: quote.quotation_items?.map((item: any) => ({
            product_name: item.products?.name || '',
            quantity: item.quantity,
            bom_items: typeof item.post_processing === 'string' ? JSON.parse(item.post_processing) : item.post_processing || []
        })) || [],
        memo: quote.memo || ''
    } : undefined;

    if (!quote) return (
        <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground">
            <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
            <p>견적 정보를 불러올 수 없습니다.</p>
        </div>
    )

    return (
        <div className="p-4 lg:p-6 space-y-6 relative overflow-hidden bg-background/50 animate-in fade-in duration-700">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10" />

            {/* Warning Banner for Past Versions */}
            {!quote.is_current && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-lg p-3 flex justify-between items-center z-20 relative font-bold text-sm shadow-sm backdrop-blur-md">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span>⚠️ 과거 버전(v{quote.version_no})을 열람 중입니다. 고객 안내에 주의해 주세요.</span>
                    </div>
                    <Button
                        size="sm"
                        variant="default"
                        className="bg-rose-500 hover:bg-rose-600 text-white shrink-0"
                        onClick={() => {
                            const latest = versions[versions.length - 1];
                            if (latest) router.push(`/dashboard/sales/order/quotations/${latest.id}`);
                        }}
                    >
                        최신 버전으로 돌아가기
                    </Button>
                </div>
            )}

            {/* Back Button */}
            <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground hover:text-primary transition-colors h-8"
                onClick={() => router.push('/dashboard/sales/order')}
            >
                <ChevronLeft className="w-4 h-4" /> 목록으로 돌아가기
            </Button>

            {/* Header info */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3 border-b border-border/40 pb-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs font-mono px-2 py-0.5 bg-primary/5 border-primary/20 text-primary">
                            Quotation v{quote.version_no}
                        </Badge>
                        <span className="text-muted-foreground text-xs">{format(new Date(quote.created_at), 'PPP', { locale: ko })}</span>
                    </div>
                    <h2 className="text-3xl font-black tracking-tighter text-foreground leading-none">
                        {quote.clients?.company_name || '고객사 정보 없음'}
                    </h2>
                </div>

                <div className="flex flex-col items-end gap-2 mt-4 md:mt-0">
                    <div className="flex flex-col items-end gap-0">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-tight">Total Amount</p>
                        <p className="text-4xl font-black text-primary tracking-tighter leading-none">
                            ₩{(Number(quote.total_amount) || 0).toLocaleString()}
                        </p>
                    </div>
                    <QuotationFormSheet
                        clients={clients}
                        products={products}
                        initialData={initialData}
                        parentId={quote.id}
                        triggerButton={
                            <Button className="h-8 px-4 font-bold bg-primary/20 text-primary hover:bg-primary hover:text-white transition-colors border border-primary/30 mt-1">
                                팔로우업(v{quote.version_no + 1}) 작성
                            </Button>
                        }
                    />
                </div>
            </div>

            <div className="space-y-4">
                {/* High Density Item Specs Grid */}
                <section className="space-y-2">
                    <h3 className="text-sm font-bold flex items-center gap-1.5 text-foreground">
                        <FileCheck className="w-4 h-4 text-primary" />
                        견적 품목 상세
                    </h3>
                    <div className="space-y-2">
                        {quote.quotation_items?.length > 0 ? quote.quotation_items.map((item: any) => (
                            <div key={item.id} className="bg-card/40 border border-border/40 rounded-lg overflow-hidden shadow-sm">
                                <div className="flex justify-between items-center p-2 bg-muted/40 border-b border-border/40">
                                    <div className="flex items-center gap-3">
                                        <h4 className="text-sm font-black text-primary">{item.products?.name || '부품명 정보 없음'}</h4>
                                        <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-none text-[10px] px-2 py-0 h-5 my-auto">
                                            MOQ: {(Number(item.quantity) || 0).toLocaleString()}개
                                        </Badge>
                                    </div>
                                    <div className="text-xs font-mono font-black tabular-nums">
                                        단가합: ₩{(Number(item.unit_price) || 0).toLocaleString()}
                                    </div>
                                </div>

                                {/* Excel-like High Density Table */}
                                <div className="overflow-x-auto w-full">
                                    <table className="w-full text-[11px] table-fixed min-w-[600px]">
                                        <thead className="bg-muted/10 text-muted-foreground border-b border-border/20">
                                            <tr>
                                                <th className="w-[20%] p-1.5 text-left font-semibold truncate">부품명</th>
                                                <th className="w-[15%] p-1.5 text-left font-semibold truncate">재질</th>
                                                <th className="w-[15%] p-1.5 text-left font-semibold truncate">색상</th>
                                                <th className="w-[25%] p-1.5 text-left font-semibold truncate">후가공(증착/코팅/인쇄)</th>
                                                <th className="w-[12%] p-1.5 text-right font-semibold truncate">부품단가</th>
                                                <th className="w-[13%] p-1.5 text-right font-semibold truncate">가공단가</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(() => {
                                                const bomData = typeof item.post_processing === 'string' ? JSON.parse(item.post_processing) : item.post_processing || [];
                                                return bomData.map((bom: any, i: number) => (
                                                    <tr key={i} className="border-b border-border/5 hover:bg-muted/5 transition-colors">
                                                        <td className="p-1.5 truncate font-medium text-foreground">{bom.part_name || '-'}</td>
                                                        <td className="p-1.5 truncate text-foreground/80">{bom.material || '-'}</td>
                                                        <td className="p-1.5 truncate text-foreground/80">{bom.color || '-'}</td>
                                                        <td className="p-1.5 truncate">
                                                            <div className="flex flex-wrap gap-1">
                                                                {bom.metalizing && <span className="bg-primary/10 text-primary px-1 rounded-[3px] text-[9px] truncate">{bom.metalizing}</span>}
                                                                {bom.coating && <span className="bg-primary/10 text-primary px-1 rounded-[3px] text-[9px] truncate">{bom.coating}</span>}
                                                                {bom.printing && <span className="bg-primary/10 text-primary px-1 rounded-[3px] text-[9px] truncate">{bom.printing}</span>}
                                                            </div>
                                                        </td>
                                                        <td className="p-1.5 text-right font-mono truncate text-foreground/80">₩{(Number(bom.base_unit_price) || 0).toLocaleString()}</td>
                                                        <td className="p-1.5 text-right font-mono truncate text-foreground/80">₩{(Number(bom.post_processing_unit_price) || 0).toLocaleString()}</td>
                                                    </tr>
                                                ));
                                            })()}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )) : (
                            <p className="text-muted-foreground text-xs italic py-4 text-center border border-dashed border-border/40 rounded-lg bg-card/10">등록된 부품 내역이 없습니다.</p>
                        )}
                    </div>
                </section>

                {quote.memo && (
                    <section className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 space-y-1 shadow-inner">
                        <h4 className="text-[10px] font-bold text-amber-600 flex items-center gap-1 uppercase tracking-wide">
                            <AlertCircle className="w-3 h-3" /> Special Memo / Remark
                        </h4>
                        <p className="text-xs leading-relaxed text-muted-foreground italic whitespace-pre-wrap">{quote.memo}</p>
                    </section>
                )}

                {/* Horizontal History / Timeline */}
                <section className="pt-2">
                    <Card className="bg-card/40 backdrop-blur-xl border-border/40 shadow-sm overflow-hidden border-none rounded-xl">
                        <div className="border-b border-border/40 bg-muted/10 p-2.5 px-3 flex items-center gap-2">
                            <HistoryIcon className="w-4 h-4 text-primary" />
                            <CardTitle className="text-[11px] font-black uppercase tracking-widest text-primary/80">
                                Price Variation Timeline
                            </CardTitle>
                        </div>
                        <CardContent className="p-3 bg-muted/5">
                            <div className="flex flex-row overflow-x-auto gap-3 pb-2 snap-x hide-scrollbar">
                                {versions?.map((v: any, idx: number) => {
                                    const isCurrent = v.id === quote.id
                                    const prevVersion = versions[idx - 1]

                                    const primaryItem = v.quotation_items?.[0]
                                    const unitPrice = Number(primaryItem?.unit_price) || 0
                                    const prevItem = prevVersion?.quotation_items?.find((p: any) => p.product_id === primaryItem?.product_id)
                                    const diff = prevItem ? unitPrice - (Number(prevItem.unit_price) || 0) : 0

                                    return (
                                        <div
                                            key={v.id}
                                            onClick={() => router.push(`/dashboard/sales/order/quotations/${v.id}`)}
                                            className={cn(
                                                "min-w-[160px] max-w-[200px] flex-1 shrink-0 p-3 rounded-lg border transition-all cursor-pointer snap-start relative group",
                                                isCurrent
                                                    ? "border-primary/50 bg-primary/5 shadow-sm shadow-primary/10"
                                                    : "border-border/50 bg-card hover:bg-muted/40 hover:border-border"
                                            )}
                                        >
                                            {isCurrent && <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_theme(colors.emerald.500)]" />}
                                            <div className="flex justify-between items-center mb-1.5">
                                                <Badge variant="outline" className={cn(
                                                    "text-[9px] px-1 py-0 h-4 font-mono leading-none border-border/40",
                                                    isCurrent ? "text-primary border-primary/30 bg-primary/10" : "text-muted-foreground bg-muted/20"
                                                )}>
                                                    v{v.version_no}
                                                </Badge>
                                                <span className="text-[9px] text-muted-foreground tabular-nums opacity-80">{format(new Date(v.created_at), 'MM.dd', { locale: ko })}</span>
                                            </div>

                                            <div className="space-y-1">
                                                <p className="text-[10px] text-muted-foreground truncate font-medium group-hover:text-foreground transition-colors">{primaryItem?.products?.name || '제품명 없음'}</p>
                                                <div className="flex items-baseline justify-between mb-0.5">
                                                    <p className={cn(
                                                        "text-xl font-black tracking-tighter tabular-nums leading-none",
                                                        isCurrent ? "text-foreground" : "text-foreground/70"
                                                    )}>
                                                        <span className="text-[10px] font-medium mr-0.5 opacity-60">단가</span>
                                                        ₩{unitPrice.toLocaleString()}
                                                    </p>
                                                </div>

                                                <div className="flex items-center justify-between mt-1 pt-1 border-t border-border/30">
                                                    {diff !== 0 ? (
                                                        <div className={cn(
                                                            "text-[9px] font-black italic flex items-center tabular-nums",
                                                            diff > 0 ? "text-rose-500" : "text-emerald-500"
                                                        )}>
                                                            {diff > 0 ? <TrendingUp className="w-2.5 h-2.5 mr-0.5" /> : <TrendingDown className="w-2.5 h-2.5 mr-0.5" />}
                                                            {Math.abs(diff).toLocaleString()}
                                                        </div>
                                                    ) : (
                                                        <div className="text-[9px] text-muted-foreground opacity-50 italic">-</div>
                                                    )}
                                                    <p className="text-[9px] font-mono text-muted-foreground opacity-80">
                                                        MOQ {Number(primaryItem?.quantity || 0).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </section>
                {/* Finalize Button Area */}
                {quote.is_current && (
                    <section className="pt-1 pb-1">
                        <div className="bg-primary/5 rounded-xl p-3 border border-primary/10 text-center space-y-2 flex flex-col justify-center items-center">
                            <p className="text-xs text-muted-foreground leading-snug">
                                견적을 확정하여 <span className="text-primary font-bold">수주 파이프라인</span>으로 넘기시겠습니까?
                            </p>
                            <Button
                                onClick={handleFinalize}
                                disabled={isPending || quote.status === 'finalized'}
                                className="w-full bg-primary hover:bg-primary/90 font-black h-10 shadow-lg hover:shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isPending ? '처리 중...' : (quote.status === 'finalized' ? '수주 확정 완료' : '최종 견적 확정 (수주)')}
                                <ArrowRight className="w-3.5 h-3.5 ml-2" />
                            </Button>
                        </div>
                    </section>
                )}
            </div>
        </div>
    )
}
