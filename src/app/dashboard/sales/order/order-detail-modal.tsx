'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { toast } from 'sonner'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { saveOrderDetails } from './order-actions'
import { Loader2, Save } from 'lucide-react'

// Number formatter with comma
const formatNumber = (val: string | number) => {
    if (!val) return ''
    const num = typeof val === 'string' ? parseInt(val.replace(/,/g, '')) : val
    if (isNaN(num)) return ''
    return num.toLocaleString()
}

export function OrderDetailModal({
    order,
    isOpen,
    onOpenChange
}: {
    order: any
    isOpen: boolean
    onOpenChange: (open: boolean) => void
}) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [poNumber, setPoNumber] = useState('')

    // Parsed BOM
    const [bomItems, setBomItems] = useState<any[]>([])

    useEffect(() => {
        if (isOpen && order) {
            setPoNumber(order.po_number || '')

            // Extract BOM from the first order item's post_processing
            const firstItem = order.order_items?.[0]
            if (firstItem) {
                let parsed = []
                try {
                    parsed = typeof firstItem.post_processing === 'string'
                        ? JSON.parse(firstItem.post_processing)
                        : (firstItem.post_processing || [])
                } catch (e) { parsed = [] }

                // Map and apply grouping
                const mappedBoms = parsed.map((bom: any) => {
                    const coatPlat = [bom.metalizing, bom.coating].filter(Boolean).join(' / ')
                    const printBox = [bom.printing].filter(Boolean).join(' / ')
                    const quantity = firstItem.quantity || 1
                    const unitPrice = (Number(bom.base_unit_price) || 0) + (Number(bom.post_processing_unit_price) || 0)

                    return {
                        ...bom,
                        mapped_coating: coatPlat,
                        mapped_printing: printBox,
                        display_quantity: formatNumber(quantity),
                        display_price: formatNumber(unitPrice),
                        raw_quantity: quantity,
                        raw_price: unitPrice
                    }
                })
                setBomItems(mappedBoms)
            } else {
                setBomItems([])
            }
        }
    }, [isOpen, order])

    const handleSave = async () => {
        if (!poNumber.trim()) {
            toast.error('발주 No.를 입력해주세요.')
            return
        }

        setIsLoading(true)
        try {
            // [PO 중복 방어] Server action handles the uniqueness catch, but we can also handle the error nicely.
            // We'll pass the poNumber to the action
            const res = await saveOrderDetails(order.id, poNumber.trim())
            if (res.success) {
                toast.success('발주 정보가 저장되었습니다.')
                onOpenChange(false)
                router.refresh()
            } else {
                toast.error(res.error || '저장에 실패했습니다.')
            }
        } catch (error) {
            toast.error('저장 중 오휴가 발생했습니다.')
        } finally {
            setIsLoading(false)
        }
    }

    if (!order) return null

    const clientName = order.clients?.company_name || '-'
    const orderDate = format(new Date(order.order_date), 'yyyy-MM-dd')
    const productName = order.order_items?.[0]?.products?.name || '-'

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-[900px] overflow-y-auto bg-card/95 backdrop-blur-3xl border-l-border/50 p-6 sm:p-8">
                <SheetHeader className="mb-6 pb-4 border-b border-border/40">
                    <SheetTitle className="text-2xl font-black tracking-tight text-primary flex items-center gap-2">
                        발주 상세 내역
                    </SheetTitle>
                </SheetHeader>

                <div className="space-y-8 pb-20">
                    {/* Top Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/20 p-5 rounded-2xl border border-border/40">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-muted-foreground">발주처</label>
                            <Input readOnly value={clientName} className="bg-background/50 border-border/40 font-bold" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-muted-foreground">발주일</label>
                            <Input readOnly value={orderDate} className="bg-background/50 border-border/40" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-muted-foreground">태성측 제품명</label>
                            <Input readOnly value={productName} className="bg-background/50 border-border/40 font-bold" />
                        </div>
                        <div className="space-y-1 relative">
                            <label className="text-xs font-bold text-primary">발주 No. (PO Number)</label>
                            <Input
                                value={poNumber}
                                onChange={(e) => setPoNumber(e.target.value)}
                                placeholder="PO 번호를 입력하세요"
                                className="bg-background border-primary/30 focus-visible:ring-primary/50 shadow-sm font-mono"
                            />
                        </div>
                    </div>

                    {/* BOM Table */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-bold text-foreground">부품 사양 및 발주 내역 (BOM)</h4>
                        <div className="rounded-xl border border-border/40 overflow-hidden bg-background">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-muted-foreground bg-muted/30 uppercase border-b border-border/40">
                                        <tr>
                                            <th className="px-3 py-3 font-semibold whitespace-nowrap">부품명</th>
                                            <th className="px-3 py-3 font-semibold whitespace-nowrap">사출 원료명</th>
                                            <th className="px-3 py-3 font-semibold whitespace-nowrap">사출 색상</th>
                                            <th className="px-3 py-3 font-semibold whitespace-nowrap border-l border-border/30 bg-primary/5 text-primary">증착 및 코팅</th>
                                            <th className="px-3 py-3 font-semibold whitespace-nowrap bg-primary/5 text-primary">인쇄 및 박</th>
                                            <th className="px-3 py-3 font-semibold whitespace-nowrap text-right">발주수량</th>
                                            <th className="px-3 py-3 font-semibold whitespace-nowrap text-right">단가</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/20">
                                        {bomItems.map((bom, idx) => (
                                            <tr key={idx} className="hover:bg-muted/10 transition-colors">
                                                <td className="px-3 py-2.5 font-medium">{bom.part_name || '-'}</td>
                                                <td className="px-3 py-2.5">{bom.material || '-'}</td>
                                                <td className="px-3 py-2.5">{bom.color || '-'}</td>
                                                <td className="px-3 py-2.5 border-l border-border/30 bg-primary/5">{bom.mapped_coating || '-'}</td>
                                                <td className="px-3 py-2.5 bg-primary/5">{bom.mapped_printing || '-'}</td>
                                                <td className="px-3 py-2.5 text-right">
                                                    <Input
                                                        value={bom.display_quantity}
                                                        onChange={(e) => {
                                                            const newItems = [...bomItems]
                                                            newItems[idx].display_quantity = formatNumber(e.target.value)
                                                            setBomItems(newItems)
                                                        }}
                                                        className="h-8 w-24 ml-auto text-right font-mono bg-transparent border-border/50 px-2"
                                                    />
                                                </td>
                                                <td className="px-3 py-2.5 text-right">
                                                    <Input
                                                        value={bom.display_price}
                                                        onChange={(e) => {
                                                            const newItems = [...bomItems]
                                                            newItems[idx].display_price = formatNumber(e.target.value)
                                                            setBomItems(newItems)
                                                        }}
                                                        className="h-8 w-24 ml-auto text-right font-mono bg-transparent border-border/50 px-2"
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                        {bomItems.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="text-center py-8 text-muted-foreground/60 text-xs">
                                                    세부 품목 내역이 없습니다. (단일 상품)
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6">
                        <Button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="w-full h-12 text-base font-black bg-primary hover:bg-primary/90 shadow-xl hover:shadow-primary/20 transition-all"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                            발주 상세 내역 저장
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
