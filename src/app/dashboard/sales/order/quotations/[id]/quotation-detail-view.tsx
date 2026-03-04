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

export function QuotationDetailView({ quote, versions, clients, products }: { quote: any, versions: any[], clients?: any[], products?: any[] }) {
    const router = useRouter()

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

            {/* Back Button */}
            <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground hover:text-primary transition-colors h-8"
                onClick={() => router.back()}
            >
                <ChevronLeft className="w-4 h-4" /> 목록으로 돌아가기
            </Button>

            {/* Header info */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3 border-b border-border/40 pb-4">
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <Badge variant="outline" className="text-xs font-mono px-2 py-1 bg-primary/5 border-primary/20 text-primary">
                            Quotation v{quote.version_no}
                        </Badge>
                        <span className="text-muted-foreground text-xs">{format(new Date(quote.created_at), 'PPP', { locale: ko })}</span>
                    </div>
                    <h2 className="text-3xl font-black tracking-tighter text-foreground">
                        {quote.clients?.company_name || '고객사 정보 없음'} <span className="text-primary/40 font-light ml-2">견적서 상세</span>
                    </h2>
                </div>

                <div className="flex flex-col items-end gap-3">
                    <div className="flex flex-col items-end gap-1">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Amount</p>
                        <p className="text-4xl font-black text-primary tracking-tighter">
                            ₩{(Number(quote.total_amount) || 0).toLocaleString()}
                        </p>
                    </div>
                    <QuotationFormSheet
                        clients={clients}
                        products={products}
                        initialData={initialData}
                        parentId={quote.id}
                        triggerButton={
                            <Button className="h-9 px-4 font-bold bg-primary/20 text-primary hover:bg-primary hover:text-white transition-colors border border-primary/30">
                                팔로우업(v{quote.version_no + 1}) 작성
                            </Button>
                        }
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left: Item Detail & Specs */}
                <div className="xl:col-span-2 space-y-4">
                    <section className="space-y-3">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <FileCheck className="w-5 h-5 text-primary" />
                            견적 품목 상세
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                            {quote.quotation_items?.length > 0 ? quote.quotation_items.map((item: any) => (
                                <Card key={item.id} className="bg-card/30 border-border/40 overflow-hidden group hover:border-primary/30 transition-all shadow-sm">
                                    <CardContent className="p-0">
                                        <div className="flex flex-col md:flex-row">
                                            <div className="p-4 flex-1 space-y-3">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Product Name</p>
                                                        <h4 className="text-xl font-bold group-hover:text-primary transition-colors">{item.products?.name || '부품명 정보 없음'}</h4>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Unit Price</p>
                                                        <p className="text-lg font-mono font-bold">₩{(Number(item.unit_price) || 0).toLocaleString()}</p>
                                                    </div>
                                                </div>

                                                {/* Post processings display */}
                                                {item.post_processing && Array.isArray(item.post_processing) && item.post_processing.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 pt-2">
                                                        {item.post_processing.map((pp: any, i: number) => (
                                                            <Badge key={i} variant="secondary" className="bg-muted/50 text-[10px] py-0.5 border-border/50">
                                                                <span className="text-primary mr-1 bg-primary/10 px-1 rounded">{pp.type}</span>
                                                                {pp.spec}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="bg-muted/20 border-l border-border/40 p-4 flex flex-col justify-center items-center md:w-32 gap-1">
                                                <p className="text-[10px] text-muted-foreground font-bold">Quantity</p>
                                                <p className="text-xl font-black tracking-tighter">{(Number(item.quantity) || 0).toLocaleString()} <span className="text-xs font-medium">PCS</span></p>
                                                {Number(item.quantity) < 10000 && (
                                                    <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[8px] h-4">MOQ 미달</Badge>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )) : (
                                <p className="text-muted-foreground text-sm italic py-10 text-center border border-dashed rounded-2xl">등록된 부품 내역이 없습니다.</p>
                            )}
                        </div>
                    </section>

                    {quote.memo && (
                        <section className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10 space-y-2 shadow-inner">
                            <h4 className="text-xs font-bold text-amber-600 flex items-center gap-1.5 uppercase tracking-wide">
                                <AlertCircle className="w-3.5 h-3.5" /> Special Memo / Remark
                            </h4>
                            <p className="text-sm leading-relaxed text-muted-foreground italic whitespace-pre-wrap">"{quote.memo}"</p>
                        </section>
                    )}
                </div>

                {/* Right: History & Timeline */}
                <div className="space-y-4">
                    <Card className="bg-card/40 backdrop-blur-xl border-border/40 shadow-xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl -z-10" />

                        <CardHeader className="border-b border-border/40 bg-muted/20 py-3">
                            <CardTitle className="text-sm font-black flex items-center gap-2 uppercase tracking-widest text-primary/80">
                                <HistoryIcon className="w-4 h-4" />
                                Price Variation Timeline
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-6">
                            <div className="relative pl-8 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-primary/50 before:via-primary/20 before:to-transparent">
                                {versions?.map((v: any, idx: number) => {
                                    const isCurrent = v.id === quote.id
                                    const prevVersion = versions[idx - 1]

                                    return (
                                        <div key={v.id} className={cn(
                                            "relative group",
                                            isCurrent ? "scale-105 origin-left transition-transform" : "opacity-60 hover:opacity-100 transition-opacity"
                                        )}>
                                            <div className={cn(
                                                "absolute -left-[27px] top-1 w-4 h-4 rounded-full border-2 bg-background transition-all",
                                                isCurrent ? "border-primary shadow-[0_0_10px_theme(colors.primary.DEFAULT)] scale-125" : "border-muted-foreground/30"
                                            )} />

                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <p className={cn("text-xs font-black", isCurrent ? "text-primary" : "text-muted-foreground")}>v{v.version_no}</p>
                                                    <p className="text-[10px] text-muted-foreground">{format(new Date(v.created_at), 'yy. MM. dd', { locale: ko })}</p>
                                                </div>

                                                <div className="space-y-2">
                                                    {v.quotation_items?.map((qi: any) => {
                                                        const prevQi = prevVersion?.quotation_items?.find((p: any) => p.product_id === qi.product_id)
                                                        const diff = prevQi ? Number(qi.unit_price) - Number(prevQi.unit_price) : 0

                                                        return (
                                                            <div key={qi.id} className="flex justify-between items-center bg-muted/10 p-2.5 rounded-lg border border-border/10">
                                                                <span className="text-[10px] font-bold truncate max-w-[100px]">{qi.products?.name || '부품명 정보 없음'}</span>
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-[11px] font-mono font-bold">₩{(Number(qi.unit_price) || 0).toLocaleString()}</span>
                                                                    {diff !== 0 && (
                                                                        <div className={cn(
                                                                            "flex items-center text-[9px] font-black italic",
                                                                            diff > 0 ? "text-rose-500" : "text-emerald-500"
                                                                        )}>
                                                                            {diff > 0 ? <TrendingUp className="w-2.5 h-2.5 mr-0.5" /> : <TrendingDown className="w-2.5 h-2.5 mr-0.5" />}
                                                                            {Math.abs(diff).toLocaleString()}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>

                                                <div className="flex justify-between items-end pt-1">
                                                    <p className="text-[10px] text-muted-foreground">Total Supply</p>
                                                    <p className="text-sm font-black text-foreground">₩{(Number(v.total_amount) || 0).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            <Separator className="bg-border/40" />

                            <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10 text-center space-y-4">
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    고객사와 협의된 최종 견적을 확정하여 <br />
                                    <span className="text-primary font-bold">수주 파이프라인</span>으로 넘기시겠습니까?
                                </p>
                                <Button className="w-full bg-primary hover:bg-primary/90 font-black h-12 shadow-xl hover:shadow-primary/20 transition-all active:scale-95">
                                    최종 견적 확정 (수주) <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
