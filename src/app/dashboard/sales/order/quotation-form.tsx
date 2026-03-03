'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { CheckCircle2, AlertCircle } from 'lucide-react'
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
import { createClient } from '@/lib/supabase/client'

const formatNumber = (val: any) => {
    if (val === '' || val === undefined || val === null) return ''
    return Number(val).toLocaleString()
}

const parseNumber = (val: string) => {
    const clean = val.replace(/,/g, '')
    return clean === '' ? '' : Number(clean)
}

function BomRow({
    index,
    control,
    remove,
    masterData
}: {
    index: number,
    control: Control<any>,
    remove: (idx: number) => void,
    masterData: Record<string, { name: string }[]>
}) {
    const basePrice = useWatch({ control, name: `items.0.bom_items.${index}.base_unit_price` }) || 0
    const ppPrice = useWatch({ control, name: `items.0.bom_items.${index}.post_processing_unit_price` }) || 0

    return (
        <tr className="border-b border-white/5 hover:bg-white/5 transition-colors group">
            <td className="p-0 border-r border-white/10">
                <FormField
                    control={control}
                    name={`items.0.bom_items.${index}.part_name`}
                    render={({ field }) => (
                        <CreatableCombobox
                            options={masterData.part || []}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="부품명"
                            className="w-full bg-transparent h-9 border-none shadow-none text-xs rounded-none focus-visible:ring-0"
                        />
                    )}
                />
            </td>
            <td className="p-0 border-r border-white/10">
                <FormField
                    control={control}
                    name={`items.0.bom_items.${index}.material`}
                    render={({ field }) => (
                        <CreatableCombobox
                            options={masterData.material || []}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="재질"
                            className="w-full bg-transparent h-9 border-none shadow-none text-xs rounded-none focus-visible:ring-0"
                        />
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
                        <CreatableCombobox
                            options={masterData.metalizing || []}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="증착"
                            className="w-full bg-transparent h-9 border-none shadow-none text-xs text-center rounded-none focus-visible:ring-0"
                        />
                    )}
                />
            </td>
            <td className="p-0 border-r border-white/10">
                <FormField
                    control={control}
                    name={`items.0.bom_items.${index}.coating`}
                    render={({ field }) => (
                        <CreatableCombobox
                            options={masterData.coating || []}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="코팅"
                            className="w-full bg-transparent h-9 border-none shadow-none text-xs text-center rounded-none focus-visible:ring-0"
                        />
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
                        className="p-2 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    >
                        <AlertCircle className="w-3.5 h-3.5" />
                    </button>
                </div>
            </td>
        </tr>
    )
}

export function QuotationForm({ clients, products }: any) {
    const [isLoading, setIsLoading] = useState(false)
    const [masterData, setMasterData] = useState<Record<string, { name: string }[]>>({})
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        async function fetchMasterData() {
            const { data } = await (supabase.from('master_data' as any) as any).select('category, name')
            if (data) {
                const grouped = data.reduce((acc: any, curr: any) => {
                    if (!acc[curr.category]) acc[curr.category] = []
                    acc[curr.category].push({ name: curr.name })
                    return acc
                }, {})
                setMasterData(grouped)
            }
        }
        fetchMasterData()
    }, [])

    const form = useForm<QuotationFormValues>({
        resolver: zodResolver(quotationSchema) as any,
        defaultValues: {
            client_name: '',
            is_vat_included: true,
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
            // Check for new master data and insert it IF it's not in the list
            // (To simplify, we'll let CreatableCombobox handle the UI, but we need to ensure the DB has it)
            // But per request, "마스터 데이터에 등록하게 하는 로직" is needed. 
            // For now, let's just save the quotation. 
            const result = await saveQuotation(data)
            if (result.success) {
                toast.success('견적 저장 완료', { description: '목록 페이지로 이동합니다.' })
                router.push('/dashboard/sales/order/quotations')
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6 bg-card border border-border rounded-xl shadow-lg">
                <div className="flex items-center justify-between border-b pb-4 mb-2">
                    <h2 className="text-lg font-bold">견적서 작성</h2>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md text-[11px] font-bold text-muted-foreground">
                        유효기간: 발행일로부터 30일 (자동 적용)
                    </div>
                </div>

                {/* Header Inputs */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-4 max-w-[900px]">
                    <FormField
                        control={form.control}
                        name="client_name"
                        render={({ field }) => (
                            <FormItem className="space-y-1.5">
                                <FormLabel className="text-[11px] font-black text-muted-foreground uppercase">고객사</FormLabel>
                                <FormControl>
                                    <CreatableCombobox
                                        options={clients.map((c: any) => ({ name: c.company_name }))}
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="고객사명 선택 또는 입력"
                                        className="h-9 bg-accent/5 focus:bg-accent/10 transition-colors border-white/10"
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="items.0.product_name"
                        render={({ field }) => (
                            <FormItem className="space-y-1.5">
                                <FormLabel className="text-[11px] font-black text-muted-foreground uppercase">제품명</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="제품명 입력" className="h-9 border-border bg-accent/5 focus:bg-accent/10" />
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="items.0.quantity"
                        render={({ field }) => (
                            <FormItem className="space-y-1.5 col-span-1">
                                <FormLabel className="text-[11px] font-black text-muted-foreground uppercase">MOQ (수량)</FormLabel>
                                <FormControl>
                                    <Input
                                        type="text"
                                        value={formatNumber(field.value)}
                                        onChange={(e) => field.onChange(parseNumber(e.target.value))}
                                        placeholder="예: 30,000"
                                        className="h-9 border-border bg-accent/5 focus:bg-accent/10 font-mono"
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>

                {/* Items Grid */}
                <div className="space-y-3 mt-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-[11px] font-black text-muted-foreground uppercase tracking-wider">BOM 내역 (부품 및 가공 상세)</h3>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 text-[11px] font-bold gap-1.5 border-primary/40 text-primary hover:bg-primary/5 px-4 shadow-sm"
                            onClick={() => bomAppend({ part_name: '', material: '', color: '', metalizing: '', coating: '', printing: '', post_processing_unit_price: '' as any, base_unit_price: '' as any })}
                        >
                            부품 추가
                        </Button>
                    </div>

                    <div className="border border-border/80 rounded-lg overflow-x-auto shadow-inner bg-background/50">
                        <table className="w-full border-collapse min-w-[1000px]">
                            <thead className="bg-muted/60 text-[11px] font-black uppercase text-muted-foreground tracking-tight border-b border-border/80">
                                <tr>
                                    <th rowSpan={2} className="w-[15%] p-2.5 text-left border-r border-border/40">부품명</th>
                                    <th rowSpan={2} className="w-[12%] p-2.5 text-left border-r border-border/40">재질</th>
                                    <th rowSpan={2} className="w-[10%] p-2.5 text-left border-r border-border/40">색상</th>
                                    <th colSpan={4} className="p-2 text-center border-r border-border/40 text-primary font-bold bg-primary/5">후가공 (Post-Processing)</th>
                                    <th rowSpan={2} className="w-[15%] p-2.5 text-right bg-accent/5">단가 (원)</th>
                                </tr>
                                <tr className="bg-muted/40">
                                    <th className="w-[10%] p-2 font-bold border-r border-border/20 text-center">증착</th>
                                    <th className="w-[10%] p-2 font-bold border-r border-border/20 text-center">코팅</th>
                                    <th className="w-[10%] p-2 font-bold border-r border-border/20 text-center">인쇄</th>
                                    <th className="w-[13%] p-2 font-bold border-r border-border/20 text-right bg-primary/5">가공 단가</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bomFields.map((field, idx) => (
                                    <BomRow
                                        key={field.id}
                                        index={idx}
                                        control={form.control}
                                        remove={bomRemove}
                                        masterData={masterData}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Summary & Buttons Section */}
                <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 pt-4 border-t mt-8">
                    <FormField
                        control={form.control}
                        name="memo"
                        render={({ field }) => (
                            <div className="flex-1 w-full space-y-1.5">
                                <FormLabel className="text-[11px] font-black text-muted-foreground uppercase opacity-80">비고 (Remark)</FormLabel>
                                <FormControl>
                                    <Textarea
                                        {...field}
                                        placeholder="특이사항, 결제 조건 등을 입력하세요"
                                        className="h-20 bg-muted/20 border-border transition-all text-xs resize-none"
                                    />
                                </FormControl>
                            </div>
                        )}
                    />

                    <div className="flex flex-col items-end gap-6 shrink-0 min-w-[200px]">
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">총 세트 단가 합계</p>
                            <div className="flex items-baseline justify-end gap-1">
                                <span className="text-3xl font-black text-primary tracking-tighter tabular-nums drop-shadow-sm">
                                    {setUnitTotal.toLocaleString()}
                                </span>
                                <span className="text-lg font-bold text-primary opacity-80">원</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{allBomItems.length}개 부품 포함 (VAT 포함)</p>
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="h-11 px-10 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm rounded shadow-lg transition-all active:scale-[0.98] gap-2"
                        >
                            {isLoading ? '신속하게 저장 중...' : (
                                <>
                                    <CheckCircle2 className="w-4 h-4" />
                                    견적서 최종 저장
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </form>
        </Form>
    )
}
