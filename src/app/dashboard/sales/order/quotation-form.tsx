'use client'

import { useState } from 'react'
import { Plus, Info, Scale, Trash2, Settings2, Receipt, AlertTriangle } from 'lucide-react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { quotationSchema, type QuotationFormValues } from '@/lib/validations/quotation'
import { cn } from '@/lib/utils'
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

export function QuotationForm({ clients, products, clientProducts }: any) {
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<QuotationFormValues>({
        resolver: zodResolver(quotationSchema),
        defaultValues: {
            client_name: '',
            is_vat_included: true,
            due_date: null,
            items: [
                {
                    product_name: '',
                    quantity: 10000,
                    unit_price: 0,
                    post_processings: []
                }
            ],
            memo: ''
        }
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items"
    })

    const isVatIncluded = form.watch('is_vat_included') ?? true;

    const calculateSubtotal = () => {
        const items = form.watch('items') ?? []
        return items.reduce((sum, item) => sum + ((item?.quantity ?? 0) * (item?.unit_price ?? 0)), 0)
    }

    const subtotal = calculateSubtotal()
    const vat = isVatIncluded ? 0 : subtotal * 0.1
    const total = subtotal + vat

    async function onSubmit(data: QuotationFormValues) {
        console.log('Quotation Data:', data)
        // Server action will be called here
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Header Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Receipt className="w-24 h-24" />
                    </div>

                    <FormField
                        control={form.control}
                        name="client_name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-sm font-bold flex items-center gap-2">
                                    <Scale className="w-4 h-4 text-primary" />
                                    고객사 명칭
                                </FormLabel>
                                <FormControl>
                                    <CreatableCombobox
                                        options={clients.map((c: any) => ({ name: c.company_name }))}
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="고객사 선택 또는 신규 입력..."
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormItem className="flex flex-col justify-end">
                        <FormLabel className="text-sm font-bold mb-3 flex items-center gap-2">
                            <Settings2 className="w-4 h-4 text-primary" />
                            부가세(VAT) 설정
                        </FormLabel>
                        <div className="flex items-center gap-4 bg-muted/30 p-2.5 rounded-lg border border-border/40">
                            <span className={cn("text-xs transition-colors", !isVatIncluded && "text-primary font-bold")}>별도</span>
                            <FormField
                                control={form.control}
                                name="is_vat_included"
                                render={({ field }) => (
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            className="data-[state=checked]:bg-primary"
                                        />
                                    </FormControl>
                                )}
                            />
                            <span className={cn("text-xs transition-colors", isVatIncluded && "text-primary font-bold")}>포함</span>
                            <Info className="w-3.5 h-3.5 text-muted-foreground ml-auto cursor-help" />
                        </div>
                    </FormItem>
                </div>

                {/* Items List */}
                <div className="space-y-6">
                    <div className="flex justify-between items-center bg-muted/10 p-4 rounded-xl border-l-4 border-l-primary">
                        <div>
                            <h3 className="text-lg font-bold">견적 품목 상세</h3>
                            <p className="text-xs text-muted-foreground">후가공 및 수량별 단가를 입력하세요.</p>
                        </div>
                        <Button
                            type="button"
                            size="sm"
                            onClick={() => append({ product_name: '', quantity: 10000, unit_price: 0, post_processings: [] })}
                            className="h-9 font-bold px-4 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/50"
                        >
                            <Plus className="w-4 h-4 mr-1" /> 품목 추가
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        {fields.map((field, index) => (
                            <div key={field.id} className="relative group">
                                <div className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/40 transition-all duration-300 shadow-lg hover:shadow-primary/5">
                                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                                        {/* Product & Client Product */}
                                        <div className="lg:col-span-2 space-y-4">
                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.product_name`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs font-bold text-muted-foreground">마스터 제품명</FormLabel>
                                                        <FormControl>
                                                            <CreatableCombobox
                                                                options={products.map((p: any) => ({ name: p.name }))}
                                                                value={field.value}
                                                                onChange={(val: string) => {
                                                                    field.onChange(val)
                                                                    const prod = products.find((p: any) => p.name === val)
                                                                    if (prod) form.setValue(`items.${index}.unit_price`, prod.price)
                                                                }}
                                                                className="bg-muted/20"
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Post Processing Area */}
                                            <div className="space-y-3 pt-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">추가 후가공</span>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 text-[10px] py-0 px-2 text-primary hover:bg-primary/10"
                                                        onClick={() => {
                                                            const current = form.getValues(`items.${index}.post_processings`)
                                                            form.setValue(`items.${index}.post_processings`, [...current, { type: '코팅', spec: '' }])
                                                        }}
                                                    >
                                                        + 공정 추가
                                                    </Button>
                                                </div>

                                                <div className="flex flex-wrap gap-2">
                                                    {(form.watch(`items.${index}.post_processings`) || []).map((_, pIdx) => (
                                                        <div key={pIdx} className="flex items-center gap-1 bg-muted/40 p-1.5 rounded-lg border border-border/50 animate-in fade-in zoom-in duration-200">
                                                            <FormField
                                                                control={form.control}
                                                                name={`items.${index}.post_processings.${pIdx}.type`}
                                                                render={({ field }) => (
                                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                        <FormControl>
                                                                            <SelectTrigger className="h-7 min-w-[70px] text-[10px] border-none bg-transparent p-0 px-1 shadow-none focus:ring-0">
                                                                                <SelectValue />
                                                                            </SelectTrigger>
                                                                        </FormControl>
                                                                        <SelectContent>
                                                                            {['증착', '코팅', '인쇄', '조립', '기타'].map(t => (
                                                                                <SelectItem key={t} value={t} className="text-[10px]">{t}</SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                )}
                                                            />
                                                            <div className="h-3 w-px bg-border/50" />
                                                            <FormField
                                                                control={form.control}
                                                                name={`items.${index}.post_processings.${pIdx}.spec`}
                                                                render={({ field }) => (
                                                                    <FormControl>
                                                                        <input
                                                                            {...field}
                                                                            placeholder="사양 입력"
                                                                            className="h-7 text-[10px] bg-transparent border-none focus:outline-none w-20 px-1 font-medium"
                                                                        />
                                                                    </FormControl>
                                                                )}
                                                            />
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-5 w-5 text-muted-foreground hover:text-red-500"
                                                                onClick={() => {
                                                                    const current = form.getValues(`items.${index}.post_processings`)
                                                                    form.setValue(`items.${index}.post_processings`, current.filter((_, i) => i !== pIdx))
                                                                }}
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Quantity & Price */}
                                        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.quantity`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs font-bold text-muted-foreground">수량 (PCS)</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Input
                                                                    type="number"
                                                                    {...field}
                                                                    onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                                                                    className={cn(
                                                                        "font-mono font-bold transition-colors",
                                                                        field.value < MOQ_LIMIT ? "border-amber-500/50 bg-amber-500/5 text-amber-600 focus-visible:ring-amber-500" : "bg-muted/10"
                                                                    )}
                                                                />
                                                                <span className="absolute right-3 top-2.5 text-[10px] text-muted-foreground">PCS</span>
                                                            </div>
                                                        </FormControl>
                                                        {field.value < MOQ_LIMIT && (
                                                            <div className="mt-1.5 flex items-center gap-1.5 text-amber-600 font-bold animate-pulse">
                                                                <AlertTriangle className="w-3.5 h-3.5" />
                                                                <span className="text-[10px]">MOQ 미달: 단가 확인 필요</span>
                                                            </div>
                                                        )}
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.unit_price`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs font-bold text-muted-foreground">단가 (원)</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Input
                                                                    type="number"
                                                                    {...field}
                                                                    onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                                                    className="font-mono font-bold bg-muted/10"
                                                                />
                                                                <span className="absolute right-3 top-2.5 text-[10px] text-muted-foreground font-mono">₩</span>
                                                            </div>
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />

                                            <div className="col-span-2 mt-2 pt-4 border-t border-border/40 flex justify-between items-end">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] text-muted-foreground font-bold tracking-tight">항목 소계 (공급액)</p>
                                                    <p className="text-xl font-black text-primary">
                                                        {(form.watch(`items.${index}.quantity`) * form.watch(`items.${index}.unit_price`)).toLocaleString()}
                                                        <span className="text-xs font-bold ml-1">원</span>
                                                    </p>
                                                </div>
                                                {fields.length > 1 && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => remove(index)}
                                                        className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 h-8 px-2"
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-1.5" />
                                                        삭제
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Summary & Action Area */}
                <div className="sticky bottom-0 z-30 pt-10 pb-4 mt-10">
                    <div className="p-8 rounded-3xl bg-card border-2 border-primary/20 shadow-2xl backdrop-blur-3xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-10" />

                        <div className="flex flex-col md:flex-row justify-between gap-10">
                            <div className="flex-1 space-y-4">
                                <FormLabel className="font-bold flex items-center gap-2">
                                    <Info className="w-4 h-4 text-primary" />
                                    특이사항 및 조건
                                </FormLabel>
                                <FormField
                                    control={form.control}
                                    name="memo"
                                    render={({ field }) => (
                                        <FormControl>
                                            <Textarea
                                                placeholder="리드타임, 유효기간, 포장 조건 등 특이사항을 기록하세요."
                                                className="min-h-[100px] border-none bg-muted/30 focus-visible:ring-primary/30"
                                                {...field}
                                            />
                                        </FormControl>
                                    )}
                                />
                            </div>

                            <div className="w-full md:w-80 space-y-5">
                                <div className="space-y-3 p-4 rounded-xl bg-muted/20 border border-border/50">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">공급가액 총액</span>
                                        <span className="font-mono">{subtotal.toLocaleString()}원</span>
                                    </div>
                                    <div className="flex justify-between text-xs items-center">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-muted-foreground">부가가치세 (10%)</span>
                                            {isVatIncluded && <Badge variant="secondary" className="text-[8px] h-4 py-0 px-1">포함됨</Badge>}
                                        </div>
                                        <span className="font-mono">{vat.toLocaleString()}원</span>
                                    </div>
                                    <div className="h-px bg-border/40" />
                                    <div className="flex justify-between items-end">
                                        <span className="font-bold">최종 거래 합계</span>
                                        <div className="text-right">
                                            <p className="text-3xl font-black text-primary tracking-tighter">
                                                {total.toLocaleString()}
                                                <span className="text-sm ml-1">원</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    size="lg"
                                    disabled={isLoading}
                                    className="w-full h-16 text-lg font-black bg-primary hover:bg-primary/90 shadow-[0_10px_30px_rgba(theme(colors.primary.DEFAULT),0.3)] hover:shadow-[0_15px_40px_rgba(theme(colors.primary.DEFAULT),0.4)] transition-all hover:-translate-y-1 active:translate-y-0"
                                >
                                    {isLoading ? '저장 중...' : '견적서 저장 및 이력 생성'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </Form>
    )
}
