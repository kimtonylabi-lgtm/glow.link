'use client'

import React, { useState, useMemo } from 'react'
import { Plus, Trash2, CalendarIcon, CheckCircle2 } from 'lucide-react'
import { useForm, useFieldArray, Control, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { quotationSchema, type QuotationFormValues, type BomItemValues } from '@/lib/validations/quotation'
import { saveQuotation } from './quotation-actions'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CreatableCombobox } from '@/components/ui/creatable-combobox'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"

const formatNumber = (val: any) => {
    if (val === '' || val === undefined || val === null) return ''
    return Number(val).toLocaleString()
}

const parseNumber = (val: string) => {
    const clean = val.replace(/,/g, '')
    return clean === '' ? '' : Number(clean)
}

function BomRow({ index, control, remove }: { index: number, control: Control<any>, remove: (idx: number) => void }) {
    const basePrice = useWatch({ control, name: `items.0.bom_items.${index}.base_unit_price` }) || 0
    const ppPrice = useWatch({ control, name: `items.0.bom_items.${index}.post_processing_unit_price` }) || 0

    // Total price in KRW for this row is (Base + PP Unit Price) * Product Quantity? 
    // Image says focus on "1 set unit price". Row total for 1 set is (Base + PP).
    const rowUnitCost = (Number(basePrice) || 0) + (Number(ppPrice) || 0)

    return (
        <tr className="border-b border-white/5 hover:bg-white/5 transition-colors group">
            <td className="p-0 border-r border-white/10">
                <FormField
                    control={control}
                    name={`items.0.bom_items.${index}.part_name`}
                    render={({ field }) => (
                        <input {...field} placeholder="부품명" className="w-full bg-transparent h-9 px-2 text-xs focus:outline-none focus:bg-white/10" />
                    )}
                />
            </td>
            <td className="p-0 border-r border-white/10">
                <FormField
                    control={control}
                    name={`items.0.bom_items.${index}.material`}
                    render={({ field }) => (
                        <input {...field} placeholder="재질" className="w-full bg-transparent h-9 px-2 text-xs focus:outline-none focus:bg-white/10" />
                    )}
                />
            </td>
            <td className="p-0 border-r border-white/10">
                <FormField
                    control={control}
                    name={`items.0.bom_items.${index}.color`}
                    render={({ field }) => (
                        <input {...field} placeholder="색상" className="w-full bg-transparent h-9 px-2 text-xs focus:outline-none focus:bg-white/10" />
                    )}
                />
            </td>
            <td className="p-0 border-r border-white/10">
                <FormField
                    control={control}
                    name={`items.0.bom_items.${index}.metalizing`}
                    render={({ field }) => (
                        <input {...field} placeholder="증착" className="w-full bg-transparent h-9 px-2 text-xs focus:outline-none focus:bg-white/10 text-center" />
                    )}
                />
            </td>
            <td className="p-0 border-r border-white/10">
                <FormField
                    control={control}
                    name={`items.0.bom_items.${index}.coating`}
                    render={({ field }) => (
                        <input {...field} placeholder="코팅" className="w-full bg-transparent h-9 px-2 text-xs focus:outline-none focus:bg-white/10 text-center" />
                    )}
                />
            </td>
            <td className="p-0 border-r border-white/10">
                <FormField
                    control={control}
                    name={`items.0.bom_items.${index}.printing`}
                    render={({ field }) => (
                        <input {...field} placeholder="인쇄" className="w-full bg-transparent h-9 px-2 text-xs focus:outline-none focus:bg-white/10 text-center" />
                    )}
                />
            </td>
            <td className="p-0 border-r border-white/10">
                <FormField
                    control={control}
                    name={`items.0.bom_items.${index}.post_processing_unit_price`}
                    render={({ field }) => (
                        <input
                            type="text"
                            value={formatNumber(field.value)}
                            onChange={(e) => field.onChange(parseNumber(e.target.value))}
                            placeholder="후가공 단가"
                            className="w-full bg-transparent h-9 px-2 text-xs text-right focus:outline-none focus:bg-white/10 font-mono"
                        />
                    )}
                />
            </td>
            <td className="p-0">
                <div className="flex items-center">
                    <FormField
                        control={control}
                        name={`items.0.bom_items.${index}.base_unit_price`}
                        render={({ field }) => (
                            <input
                                type="text"
                                value={formatNumber(field.value)}
                                onChange={(e) => field.onChange(parseNumber(e.target.value))}
                                placeholder="단가"
                                className="flex-1 bg-transparent h-9 px-2 text-xs text-right focus:outline-none focus:bg-white/10 font-mono"
                            />
                        )}
                    />
                    <button
                        type="button"
                        onClick={() => remove(index)}
                        className="opacity-0 group-hover:opacity-100 px-2 text-muted-foreground hover:text-red-500 transition-all"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </td>
        </tr>
    )
}

export function QuotationForm({ clients, products }: any) {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const form = useForm<QuotationFormValues>({
        resolver: zodResolver(quotationSchema) as any,
        defaultValues: {
            client_name: '',
            is_vat_included: true,
            due_date: null,
            items: [
                {
                    product_name: '',
                    quantity: '' as any,
                    bom_items: [
                        { part_name: '', material: '', color: '', metalizing: '', coating: '', printing: '', post_processing_unit_price: '' as any, base_unit_price: '' as any }
                    ]
                }
            ],
            memo: ''
        }
    })

    const { fields: bomFields, append: bomAppend, remove: bomRemove } = useFieldArray({
        control: form.control,
        name: "items.0.bom_items"
    })

    const allBomItems = useWatch({ control: form.control, name: "items.0.bom_items" }) || []

    const setUnitTotal = useMemo(() => {
        return allBomItems.reduce((acc, bom) => {
            const base = Number(bom.base_unit_price) || 0
            const pp = Number(bom.post_processing_unit_price) || 0
            return acc + base + pp
        }, 0)
    }, [allBomItems])

    async function onSubmit(data: QuotationFormValues) {
        setIsLoading(true)
        try {
            const result = await saveQuotation(data)
            if (result.success) {
                toast.success('견적 저장 완료', { description: '견적서가 성공적으로 저장되었습니다.' })
                router.refresh()
            } else {
                toast.error('저장 실패', { description: result.error })
            }
        } catch (e) {
            console.error(e)
            toast.error('오류 발생', { description: '처리 중 오류가 발생했습니다.' })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-2">
                {/* Header Inputs */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-4 max-w-[800px]">
                    <FormField
                        control={form.control}
                        name="client_name"
                        render={({ field }) => (
                            <FormItem className="space-y-1.5">
                                <FormLabel className="text-[11px] font-black text-muted-foreground uppercase opacity-80">고객사</FormLabel>
                                <FormControl>
                                    <CreatableCombobox
                                        options={clients.map((c: any) => ({ name: c.company_name }))}
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="고객사명"
                                        className="h-9 bg-accent/5 focus:bg-accent/10 transition-colors border-white/10"
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="due_date"
                        render={({ field }) => (
                            <FormItem className="space-y-1.5">
                                <FormLabel className="text-[11px] font-black text-muted-foreground uppercase opacity-80">유효기간</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "w-full h-9 justify-between text-left font-normal border-white/10 bg-accent/5",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value ? format(field.value, "PPP") : "년-월-일"}
                                                <CalendarIcon className="h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value || undefined}
                                            onSelect={field.onChange}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="items.0.product_name"
                        render={({ field }) => (
                            <FormItem className="space-y-1.5">
                                <FormLabel className="text-[11px] font-black text-muted-foreground uppercase opacity-80">제품명</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="제품명 입력" className="h-9 border-white/10 bg-accent/5 focus:bg-accent/10" />
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="items.0.quantity"
                        render={({ field }) => (
                            <FormItem className="space-y-1.5">
                                <FormLabel className="text-[11px] font-black text-muted-foreground uppercase opacity-80">MOQ</FormLabel>
                                <FormControl>
                                    <Input
                                        type="text"
                                        value={formatNumber(field.value)}
                                        onChange={(e) => field.onChange(parseNumber(e.target.value))}
                                        placeholder="예: 30,000"
                                        className="h-9 border-white/10 bg-accent/5 focus:bg-accent/10 font-mono"
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>

                {/* Items Grid */}
                <div className="space-y-2 mt-8">
                    <h3 className="text-[11px] font-black text-muted-foreground uppercase opacity-80 mb-2">품목</h3>
                    <div className="border border-white/10 rounded overflow-hidden shadow-2xl shadow-black/40">
                        <table className="w-full border-collapse">
                            <thead className="bg-[#121826] text-[10px] font-black uppercase text-muted-foreground tracking-tight border-b border-white/10">
                                <tr>
                                    <th rowSpan={2} className="w-[12%] p-2 font-bold text-left border-r border-white/10">부품명</th>
                                    <th rowSpan={2} className="w-[10%] p-2 font-bold text-left border-r border-white/10">재질</th>
                                    <th rowSpan={2} className="w-[10%] p-2 font-bold text-left border-r border-white/10">색상</th>
                                    <th colSpan={4} className="p-1.5 text-center border-r border-white/10 text-[#a78bfa]">후가공</th>
                                    <th rowSpan={2} className="w-[12%] p-2 font-bold text-right">단가 (원)</th>
                                </tr>
                                <tr className="bg-[#0f141f]">
                                    <th className="w-[8%] p-1.5 font-medium border-r border-white/5 opacity-80">증착</th>
                                    <th className="w-[8%] p-1.5 font-medium border-r border-white/5 opacity-80">코팅</th>
                                    <th className="w-[8%] p-1.5 font-medium border-r border-white/5 opacity-80">인쇄</th>
                                    <th className="w-[10%] p-1.5 font-medium border-r border-white/5 text-right opacity-80">후가공 단가</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bomFields.map((field, idx) => (
                                    <BomRow key={field.id} index={idx} control={form.control} remove={bomRemove} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-[#2dd4bf] hover:text-[#2dd4bf] hover:bg-[#2dd4bf]/5 transition-all font-black text-[11px] px-0 mt-2 h-7"
                        onClick={() => bomAppend({ part_name: '', material: '', color: '', metalizing: '', coating: '', printing: '', post_processing_unit_price: '' as any, base_unit_price: '' as any })}
                    >
                        + 행 추가
                    </Button>
                </div>

                {/* Summary & Memo Footer */}
                <div className="flex flex-col items-end mt-12 mb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="text-right space-y-0.5">
                        <p className="text-[11px] font-bold text-muted-foreground uppercase opacity-60">총 단가 합계 (단가 + 후가공 단가)</p>
                        <p className="text-4xl font-black text-[#2dd4bf] tracking-tighter tabular-nums drop-shadow-[0_0_15px_rgba(45,212,191,0.2)]">
                            {setUnitTotal.toLocaleString()}<span className="text-2xl ml-1">원</span>
                        </p>
                        <p className="text-[11px] font-bold text-muted-foreground/40">{allBomItems.length}개 부품</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <FormField
                        control={form.control}
                        name="memo"
                        render={({ field }) => (
                            <FormItem className="space-y-1.5">
                                <FormLabel className="text-[11px] font-black text-muted-foreground uppercase opacity-80">비고</FormLabel>
                                <FormControl>
                                    <Textarea
                                        {...field}
                                        placeholder="특이사항, 조건 등"
                                        className="h-24 bg-card/20 border-white/10 focus:border-white/20 transition-all text-xs resize-none"
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>

                {/* Fixed Save Button at the Bottom Right UI Area (as per image) */}
                <div className="flex justify-end pt-4 pb-8">
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="h-12 px-8 bg-[#2dd4bf] hover:bg-[#2dd4bf]/90 text-black font-black text-sm rounded shadow-lg shadow-[#2dd4bf]/10 gap-2 transition-all active:scale-[0.98]"
                    >
                        {isLoading ? '저장 중...' : (
                            <>
                                <CheckCircle2 className="w-4 h-4" />
                                견적서 저장
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
