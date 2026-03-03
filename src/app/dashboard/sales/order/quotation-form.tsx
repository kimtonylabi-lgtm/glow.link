'use client'

import React, { useState, useMemo } from 'react'
import { Plus, Trash2, Receipt, AlertTriangle, Layers, Settings2, Minimize2, ChevronDown } from 'lucide-react'
import { useForm, useFieldArray, Control, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { quotationSchema, type QuotationFormValues, type BomItemValues, type PostProcessingValues } from '@/lib/validations/quotation'
import { saveQuotation } from './quotation-actions'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CreatableCombobox } from '@/components/ui/creatable-combobox'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

const MOQ_LIMIT = 10000;

const formatNumber = (val: any) => {
    if (val === '' || val === undefined || val === null) return ''
    return Number(val).toLocaleString()
}

const parseNumber = (val: string) => {
    return val.replace(/,/g, '') === '' ? '' : Number(val.replace(/,/g, ''))
}

function PostProcessingRow({ productIndex, bomIndex, ppIndex, control, remove }: { productIndex: number, bomIndex: number, ppIndex: number, control: Control<any>, remove: (index: number) => void }) {
    return (
        <div className="flex items-center gap-1 bg-primary/5 p-0.5 px-1 rounded border border-primary/10 mb-1 group/pp animate-in fade-in slide-in-from-left-1">
            <FormField
                control={control}
                name={`items.${productIndex}.bom_items.${bomIndex}.post_processings.${ppIndex}.type`}
                render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger className="h-6 w-16 text-[10px] bg-transparent border-none shadow-none focus:ring-0 p-0 px-1 font-bold">
                                <SelectValue />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {['증착', '코팅', '인쇄', '조립', '기타'].map(t => (
                                <SelectItem key={t} value={t} className="text-[10px] font-bold">{t}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            />
            <FormField
                control={control}
                name={`items.${productIndex}.bom_items.${bomIndex}.post_processings.${ppIndex}.spec`}
                render={({ field }) => (
                    <FormControl>
                        <input
                            {...field}
                            placeholder="사양"
                            className="h-6 text-[10px] bg-transparent border-none focus:outline-none w-16 px-1 text-muted-foreground font-medium"
                        />
                    </FormControl>
                )}
            />
            <FormField
                control={control}
                name={`items.${productIndex}.bom_items.${bomIndex}.post_processings.${ppIndex}.unit_price`}
                render={({ field }) => (
                    <FormControl>
                        <input
                            type="text"
                            value={formatNumber(field.value)}
                            onChange={(e) => {
                                const val = parseNumber(e.target.value)
                                field.onChange(val)
                            }}
                            placeholder="단가"
                            className="h-6 text-[10px] bg-transparent border-none focus:outline-none w-12 px-1 text-right font-mono font-bold text-primary"
                        />
                    </FormControl>
                )}
            />
            <button
                type="button"
                onClick={() => remove(ppIndex)}
                className="opacity-0 group-hover/pp:opacity-100 transition-opacity p-0.5 hover:text-red-500"
            >
                <Trash2 className="w-3 h-3" />
            </button>
        </div>
    )
}

function BomItemRow({ productIndex, bomIndex, control, removeProductBom }: { productIndex: number, bomIndex: number, control: Control<any>, removeProductBom: (index: number) => void }) {
    const { fields: ppFields, append: ppAppend, remove: ppRemove } = useFieldArray({
        control,
        name: `items.${productIndex}.bom_items.${bomIndex}.post_processings`
    })

    const basePrice = useWatch({ control, name: `items.${productIndex}.bom_items.${bomIndex}.base_unit_price` }) || 0
    const pps = useWatch({ control, name: `items.${productIndex}.bom_items.${bomIndex}.post_processings` }) || []

    const ppTotal = pps.reduce((sum: number, pp: any) => sum + (Number(pp.unit_price) || 0), 0)
    const lineTotal = (Number(basePrice) || 0) + ppTotal

    return (
        <tr className="border-b border-border/40 hover:bg-muted/30 transition-colors group/bom">
            <td className="py-1 px-2 w-[180px]">
                <FormField
                    control={control}
                    name={`items.${productIndex}.bom_items.${bomIndex}.part_name`}
                    render={({ field }) => (
                        <FormControl>
                            <input
                                {...field}
                                placeholder="부품명 (캡, 용기...)"
                                className="w-full bg-transparent text-xs font-bold focus:outline-none focus:text-primary"
                            />
                        </FormControl>
                    )}
                />
            </td>
            <td className="py-1 px-2 w-[120px]">
                <FormField
                    control={control}
                    name={`items.${productIndex}.bom_items.${bomIndex}.base_unit_price`}
                    render={({ field }) => (
                        <FormControl>
                            <input
                                type="text"
                                value={formatNumber(field.value)}
                                onChange={(e) => field.onChange(parseNumber(e.target.value))}
                                placeholder="단가"
                                className="w-full bg-transparent text-xs font-mono font-bold text-right focus:outline-none"
                            />
                        </FormControl>
                    )}
                />
            </td>
            <td className="py-1 px-2 min-w-[200px]">
                <div className="flex flex-wrap items-center gap-1">
                    {ppFields.map((field, ppIdx) => (
                        <PostProcessingRow
                            key={field.id}
                            productIndex={productIndex}
                            bomIndex={bomIndex}
                            ppIndex={ppIdx}
                            control={control}
                            remove={ppRemove}
                        />
                    ))}
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[9px] font-black uppercase text-primary hover:bg-primary/10 border border-dashed border-primary/30"
                        onClick={() => ppAppend({ type: '기타', spec: '', unit_price: '' })}
                    >
                        + 공정
                    </Button>
                </div>
            </td>
            <td className="py-1 px-2 w-[100px] text-right font-mono text-xs font-black text-primary">
                {lineTotal.toLocaleString()}
            </td>
            <td className="py-1 px-2 w-[40px] text-center">
                <button
                    type="button"
                    onClick={() => removeProductBom(bomIndex)}
                    className="text-muted-foreground/30 hover:text-red-500 transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </td>
        </tr>
    )
}

function ProductGroup({ productIndex, control, remove, products }: any) {
    const { fields: bomFields, append: bomAppend, remove: bomRemove } = useFieldArray({
        control,
        name: `items.${productIndex}.bom_items`
    })

    const quantity = useWatch({ control, name: `items.${productIndex}.quantity` }) || 0
    const bomItems = useWatch({ control, name: `items.${productIndex}.bom_items` }) || []

    const perUnitCost = bomItems.reduce((acc: number, bom: any) => {
        const base = Number(bom.base_unit_price) || 0
        const pp = (bom.post_processings || []).reduce((s: number, p: any) => s + (Number(p.unit_price) || 0), 0)
        return acc + base + pp
    }, 0)

    const isMoqLow = (Number(quantity) || 0) < MOQ_LIMIT

    return (
        <div className="border border-border/60 rounded-lg overflow-hidden bg-card/30 mb-4 animate-in fade-in slide-in-from-bottom-2">
            {/* Product Header */}
            <div className="bg-muted/40 p-2 flex items-center gap-4 border-b border-border/40">
                <div className="flex-1 flex items-center gap-4">
                    <FormField
                        control={control}
                        name={`items.${productIndex}.product_name`}
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormControl>
                                    <CreatableCombobox
                                        options={products.map((p: any) => ({ name: p.name }))}
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="완제품 명칭 입력 (Master Product)"
                                        className="h-8 text-sm font-black border-none bg-transparent shadow-none focus:ring-0"
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    <div className="h-4 w-px bg-border/60" />
                    <div className="flex items-center gap-3">
                        <FormField
                            control={control}
                            name={`items.${productIndex}.quantity`}
                            render={({ field }) => (
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap">견적수량</span>
                                    <input
                                        type="text"
                                        value={formatNumber(field.value)}
                                        onChange={(e) => field.onChange(parseNumber(e.target.value))}
                                        className={cn(
                                            "w-24 h-7 text-xs font-mono font-black text-right rounded border border-border/40 bg-background px-2 focus:ring-1 focus:ring-primary",
                                            isMoqLow && "border-amber-500/50 bg-amber-50 text-amber-600"
                                        )}
                                    />
                                    <span className="text-[10px] text-muted-foreground mr-2 text-primary font-bold">PCS</span>
                                </div>
                            )}
                        />
                        {isMoqLow && (
                            <Badge variant="outline" className="h-6 bg-amber-50 text-amber-600 border-amber-200 gap-1 text-[10px] animate-pulse">
                                <AlertTriangle className="w-3 h-3" /> MOQ 미달
                            </Badge>
                        )}
                        <Badge variant="secondary" className="h-6 gap-1 text-[10px]">
                            <span className="text-muted-foreground">합계단가:</span>
                            <span className="font-mono font-black text-primary">{perUnitCost.toLocaleString()}원</span>
                        </Badge>
                    </div>
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                    onClick={() => remove(productIndex)}
                >
                    <Trash2 className="w-4 h-4" />
                </Button>
            </div>

            {/* BOM Table */}
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-muted/20 text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                        <th className="py-1.5 px-2 border-b">부품명(BOM)</th>
                        <th className="py-1.5 px-2 text-right border-b">부품단가</th>
                        <th className="py-1.5 px-2 border-b">후가공 공정 및 사양 (공정별 단가)</th>
                        <th className="py-1.5 px-2 text-right border-b">부품합계</th>
                        <th className="py-1.5 px-2 border-b text-center">작업</th>
                    </tr>
                </thead>
                <tbody>
                    {bomFields.map((field, bIdx) => (
                        <BomItemRow
                            key={field.id}
                            productIndex={productIndex}
                            bomIndex={bIdx}
                            control={control}
                            removeProductBom={bomRemove}
                        />
                    ))}
                    <tr>
                        <td colSpan={5} className="p-1">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="w-full h-8 border border-dashed border-border/60 hover:bg-primary/5 hover:text-primary text-[10px] font-bold"
                                onClick={() => bomAppend({ part_name: '', base_unit_price: '' as any, post_processings: [] })}
                            >
                                <Plus className="w-3 h-3 mr-1" /> BOM 부품 추가
                            </Button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    )
}

export function QuotationForm({ clients, products, clientProducts }: any) {
    const [isLoading, setIsLoading] = useState(false)
    const { toast } = useToast()
    const router = useRouter()

    const form = useForm<QuotationFormValues>({
        resolver: zodResolver(quotationSchema),
        defaultValues: {
            client_name: '',
            is_vat_included: true,
            due_date: null,
            items: [
                {
                    product_name: '',
                    quantity: '' as any,
                    bom_items: [
                        { part_name: '', base_unit_price: '' as any, post_processings: [] }
                    ]
                }
            ],
            memo: ''
        }
    })

    const { fields: productFields, append: productAppend, remove: productRemove } = useFieldArray({
        control: form.control,
        name: "items"
    })

    const isVatIncluded = form.watch('is_vat_included') ?? true;
    const allItems = form.watch('items') || []

    const subtotal = useMemo(() => {
        return allItems.reduce((total, product) => {
            const qty = Number(product.quantity) || 0
            const unitCost = (product.bom_items || []).reduce((acc, bom) => {
                const base = Number(bom.base_unit_price) || 0
                const pp = (bom.post_processings || []).reduce((s, p) => s + (Number(p.unit_price) || 0), 0)
                return acc + base + pp
            }, 0)
            return total + (qty * unitCost)
        }, 0)
    }, [allItems])

    const vat = isVatIncluded ? 0 : subtotal * 0.1
    const total = subtotal + vat

    async function onSubmit(data: QuotationFormValues) {
        setIsLoading(true)
        try {
            const result = await saveQuotation(data)
            if (result.success) {
                toast({ title: '견적 저장 완료', description: '견적서가 성공적으로 저장되었습니다.' })
                router.refresh()
            } else {
                toast({ title: '저장 실패', description: result.error, variant: 'destructive' })
            }
        } catch (e) {
            console.error(e)
            toast({ title: '오류 발생', description: '처리 중 오류가 발생했습니다.', variant: 'destructive' })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Header Context - Super Compact */}
                <div className="flex items-center gap-4 bg-card/40 p-3 rounded-xl border border-border/50 backdrop-blur-md sticky top-0 z-40">
                    <FormField
                        control={form.control}
                        name="client_name"
                        render={({ field }) => (
                            <FormItem className="w-80">
                                <FormControl>
                                    <CreatableCombobox
                                        options={clients.map((c: any) => ({ name: c.company_name }))}
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="고객사 선택..."
                                        className="h-9 font-bold"
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    <div className="h-6 w-px bg-border/50" />

                    <div className="flex items-center gap-2 bg-muted/30 px-3 py-1 rounded-full border border-border/40">
                        <span className={cn("text-[10px] font-bold transition-colors uppercase", !isVatIncluded && "text-primary")}>VAT 별도</span>
                        <FormField
                            control={form.control}
                            name="is_vat_included"
                            render={({ field }) => (
                                <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        className="h-4 w-7 data-[state=checked]:bg-primary"
                                    />
                                </FormControl>
                            )}
                        />
                        <span className={cn("text-[10px] font-bold transition-colors uppercase", isVatIncluded && "text-primary")}>VAT 포함</span>
                    </div>

                    <div className="ml-auto flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase leading-none">Total Amount</p>
                            <p className="text-xl font-black text-primary tracking-tighter">
                                {total.toLocaleString()}
                                <span className="text-xs ml-0.5">원</span>
                            </p>
                        </div>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="h-10 px-6 font-black bg-primary/95 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                        >
                            {isLoading ? '저장...' : '견적 저장'}
                        </Button>
                    </div>
                </div>

                {/* Main Content Areas */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    <div className="lg:col-span-9 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Layers className="w-4 h-4 text-primary" />
                                <h3 className="text-sm font-black uppercase tracking-widest">Manufacturing BOM List</h3>
                                <Badge variant="outline" className="text-[9px] font-bold h-5 px-1.5 opacity-60">Base MOQ: 10,000</Badge>
                            </div>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs font-bold border-primary/30 text-primary hover:bg-primary/5"
                                onClick={() => productAppend({ product_name: '', quantity: '' as any, bom_items: [{ part_name: '', base_unit_price: '' as any, post_processings: [] }] })}
                            >
                                <Plus className="w-3 h-3 mr-1" /> 신규 제품군 추가
                            </Button>
                        </div>

                        {productFields.map((field, idx) => (
                            <ProductGroup
                                key={field.id}
                                productIndex={idx}
                                control={form.control}
                                remove={productRemove}
                                products={products}
                            />
                        ))}
                    </div>

                    <div className="lg:col-span-3 space-y-4">
                        <div className="p-4 rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm sticky top-20">
                            <h4 className="text-xs font-black uppercase mb-4 flex items-center gap-2">
                                <Settings2 className="w-3.5 h-3.5 text-primary" />
                                견적 요약 (VAT {isVatIncluded ? '포함' : '별도'})
                            </h4>
                            <div className="space-y-3">
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">공급가액</span>
                                    <span className="font-mono font-bold">{subtotal.toLocaleString()}원</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">부가세 (10%)</span>
                                    <span className="font-mono font-bold text-amber-600">{vat.toLocaleString()}원</span>
                                </div>
                                <div className="h-px bg-border/40" />
                                <div className="flex justify-between items-end">
                                    <span className="text-sm font-black">합계</span>
                                    <span className="text-lg font-black text-primary">{total.toLocaleString()}원</span>
                                </div>
                            </div>

                            <div className="mt-8 space-y-2">
                                <FormLabel className="text-[10px] font-black uppercase text-muted-foreground ml-1">특이사항 (Memo)</FormLabel>
                                <FormField
                                    control={form.control}
                                    name="memo"
                                    render={({ field }) => (
                                        <FormControl>
                                            <Textarea
                                                placeholder="제작 사양, 납기, 물류 조건 등..."
                                                className="min-h-[120px] text-xs bg-muted/20 border-border/40 focus-visible:ring-primary/20"
                                                {...field}
                                                value={field.value || ''}
                                            />
                                        </FormControl>
                                    )}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </Form>
    )
}
