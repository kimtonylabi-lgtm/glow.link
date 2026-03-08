// Common Component for Sales Sample view
'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { sampleRequestSchema, type SampleRequestFormValues } from '@/lib/validations/sample'
import { addSampleRequest } from './actions'
import { Client } from '@/types/crm'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Loader2, Check, ChevronsUpDown, Calendar as CalendarIcon, Plus, Trash2, Box, PenTool } from 'lucide-react'

interface SampleFormProps {
    clients: Client[]
}

export function SampleForm({ clients }: SampleFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false)

    const form = useForm<SampleRequestFormValues>({
        resolver: zodResolver(sampleRequestSchema),
        defaultValues: {
            sample_type: 'random',
            client_id: '',
            product_name: '',
            quantity: 1,
            contact_person: '',
            special_instructions: '',
            design_specs: [{ part_name: '', injection_material: '', injection_color: '', coating: '', printing: '' }]
        },
    })

    const sampleType = form.watch('sample_type')

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "design_specs",
    })

    // Reset irrelevant fields when switching type from 'design' to others
    useEffect(() => {
        if (sampleType !== 'design') {
            form.setValue('completion_date', undefined)
            form.setValue('cat_no', undefined)
            form.setValue('film_color', undefined)
            form.setValue('rubber_color', undefined)
        }
    }, [sampleType, form])

    async function onSubmit(data: SampleRequestFormValues) {
        setIsLoading(true)
        const result = await addSampleRequest(data)

        if (result.error) {
            toast.error('요청 실패', { description: result.error })
        } else {
            toast.success('요청 완료', { description: '샘플실로 요청이 전달되었습니다.' })
            form.reset()
        }
        setIsLoading(false)
    }

    return (
        <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-xl p-6 shadow-sm">
            <h3 className="text-2xl font-black tracking-tight mb-6 text-foreground/90">새 샘플 요청</h3>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                    {/* 1. 최상단 3단 ToggleGroup (샘플 종류) */}
                    <FormField
                        control={form.control}
                        name="sample_type"
                        render={({ field }) => (
                            <FormItem className="space-y-3">
                                <FormControl>
                                    <ToggleGroup
                                        type="single"
                                        value={field.value}
                                        onValueChange={(val: string) => {
                                            if (val) field.onChange(val)
                                        }}
                                        className="inline-flex bg-muted/30 p-1 rounded-xl w-full justify-start h-14 space-x-1"
                                    >
                                        <ToggleGroupItem value="random" aria-label="Toggle random" className="flex-1 rounded-lg h-full data-[state=on]:bg-background data-[state=on]:text-primary data-[state=on]:shadow-sm data-[state=on]:font-bold transition-all">
                                            <Box className="w-4 h-4 mr-2" />
                                            랜덤 샘플
                                        </ToggleGroupItem>
                                        <ToggleGroupItem value="ct" aria-label="Toggle ct" className="flex-1 rounded-lg h-full data-[state=on]:bg-background data-[state=on]:text-primary data-[state=on]:shadow-sm data-[state=on]:font-bold transition-all">
                                            <Check className="w-4 h-4 mr-2" />
                                            CT 샘플 (테스트)
                                        </ToggleGroupItem>
                                        <ToggleGroupItem value="design" aria-label="Toggle design" className="flex-1 rounded-lg h-full data-[state=on]:bg-background data-[state=on]:text-primary data-[state=on]:shadow-sm data-[state=on]:font-bold transition-all">
                                            <PenTool className="w-4 h-4 mr-2" />
                                            디자인 샘플 (확인용)
                                        </ToggleGroupItem>
                                    </ToggleGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 rounded-2xl bg-muted/10 border border-border/40">
                            {/* Client Selection (Combobox) */}
                            <FormField
                                control={form.control}
                                name="client_id"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel className="font-semibold text-muted-foreground text-xs">고객사 *</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className={cn(
                                                            "w-full justify-between bg-background border-border/40 hover:bg-background h-10 shadow-sm",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value
                                                            ? clients.find((client) => client.id === field.value)?.company_name
                                                            : "고객사 검색"}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[300px] p-0 bg-card/95 backdrop-blur-md border border-border/50">
                                                <Command>
                                                    <CommandInput placeholder="고객사명 검색..." />
                                                    <CommandList>
                                                        <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
                                                        <CommandGroup>
                                                            {clients.map((client) => (
                                                                <CommandItem
                                                                    value={client.company_name}
                                                                    key={client.id}
                                                                    onSelect={() => form.setValue("client_id", client.id)}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            client.id === field.value ? "opacity-100 text-primary" : "opacity-0"
                                                                        )}
                                                                    />
                                                                    {client.company_name}
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="contact_person"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-semibold text-muted-foreground text-xs">고객사 담당자 *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="담당자 성함 입력" {...field} className="bg-background border-border/40 h-10 shadow-sm" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="product_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-semibold text-muted-foreground text-xs">제품명 *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="예: 50ml 아크릴 크림" {...field} className="bg-background border-border/40 h-10 shadow-sm" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="quantity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-semibold text-muted-foreground text-xs">{sampleType === 'design' ? '필요수량(Qnty) *' : '요청 수량 *'}</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min="1"
                                                {...field}
                                                value={field.value as number | string}
                                                onChange={e => field.onChange(Number(e.target.value))}
                                                className="bg-background border-border/40 h-10 shadow-sm"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* 2. 조건부 UI (디자인 샘플) */}
                        {sampleType === 'design' && (
                            <div className="space-y-6 pt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {/* 상단 헤더 정보 */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 rounded-2xl bg-primary/5 border border-primary/10">
                                    <FormField
                                        control={form.control}
                                        name="completion_date"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel className="font-semibold text-primary/80 text-xs">완료요청일 *</FormLabel>
                                                <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant={"outline"}
                                                                className={cn(
                                                                    "w-full pl-3 text-left font-normal bg-background border-border/50 h-10",
                                                                    !field.value && "text-muted-foreground"
                                                                )}
                                                            >
                                                                {field.value ? (
                                                                    format(field.value, "PP", { locale: ko })
                                                                ) : (
                                                                    <span>날짜 선택</span>
                                                                )}
                                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0 bg-card border border-border/50" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value}
                                                            onSelect={(date) => {
                                                                field.onChange(date)
                                                                setIsDatePopoverOpen(false)
                                                            }}
                                                            disabled={(date) => date < new Date()}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="cat_no"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-semibold text-primary/80 text-xs">Cat No.</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="입력" {...field} className="bg-background border-border/50 h-10" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="film_color"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-semibold text-primary/80 text-xs text-nowrap">견본/색상 (필름)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="필름 내용 입력" {...field} className="bg-background border-border/50 h-10" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="rubber_color"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-semibold text-primary/80 text-xs text-nowrap">견본/색상 (라바)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="라바 내용 입력" {...field} className="bg-background border-border/50 h-10" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* 중단 스펙 테이블 (Dynamic Grid) - 주문 상세 폼 UI 재활용 */}
                                <div className="space-y-4 pt-2">
                                    <div className="flex justify-between items-center px-1">
                                        <h3 className="font-bold text-lg flex items-center gap-2">
                                            <Box className="w-5 h-5 text-primary" />
                                            디자인 스펙 리스트
                                        </h3>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => append({ part_name: '', injection_material: '', injection_color: '', coating: '', printing: '' })}
                                            className="border-primary/50 text-primary hover:bg-primary/10 shadow-sm h-9"
                                        >
                                            <Plus className="w-4 h-4 mr-1" /> 부품 추가
                                        </Button>
                                    </div>

                                    {form.formState.errors.design_specs?.root?.message && (
                                        <p className="text-sm font-medium text-destructive px-1">{form.formState.errors.design_specs.root.message}</p>
                                    )}

                                    <div className="space-y-4">
                                        {fields.map((field, index) => (
                                            <div key={field.id} className="p-4 rounded-xl bg-card border border-border/60 shadow-md relative group animate-in slide-in-from-right duration-300">
                                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary/40 rounded-l-xl" />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => remove(index)}
                                                    className="absolute -top-2.5 -right-2.5 h-7 w-7 rounded-full bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/30 transition-all opacity-0 group-hover:opacity-100 z-10 shadow-sm"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>

                                                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                                                    <FormField
                                                        control={form.control}
                                                        name={`design_specs.${index}.part_name`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="text-xs text-muted-foreground font-semibold">부품명 *</FormLabel>
                                                                <FormControl>
                                                                    <Input placeholder="용기, 캡 등" {...field} className="h-10 text-sm bg-muted/10 border-border/40" />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name={`design_specs.${index}.injection_material`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="text-xs text-muted-foreground font-semibold">사출 (원료명) *</FormLabel>
                                                                <FormControl>
                                                                    <Input placeholder="PETG, ABS 등" {...field} className="h-10 text-sm bg-muted/10 border-border/40" />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name={`design_specs.${index}.injection_color`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="text-xs text-muted-foreground font-semibold">사출 (색상) *</FormLabel>
                                                                <FormControl>
                                                                    <Input placeholder="투명, 흰색 등" {...field} className="h-10 text-sm bg-muted/10 border-border/40" />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name={`design_specs.${index}.coating`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="text-xs text-muted-foreground font-semibold">증착 및 코팅</FormLabel>
                                                                <FormControl>
                                                                    <Input placeholder="유/무광, 은증착 등" {...field} className="h-10 text-sm bg-muted/10 border-border/40" />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name={`design_specs.${index}.printing`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="text-xs text-muted-foreground font-semibold">인쇄 및 박</FormLabel>
                                                                <FormControl>
                                                                    <Input placeholder="먹1도, 금박 등" {...field} className="h-10 text-sm bg-muted/10 border-border/40" />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        <FormField
                            control={form.control}
                            name="special_instructions"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-semibold text-muted-foreground text-xs">특이사항 (메모)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="요구사항이나 배송지, 특기사항 등 (필요 시 작성)"
                                            {...field}
                                            className="bg-background border-border/40 min-h-[100px] resize-none shadow-sm"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="pt-2">
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 shadow-[0_10px_25px_theme(colors.primary.DEFAULT)/30] hover:shadow-[0_15px_30px_theme(colors.primary.DEFAULT)/50] transition-all"
                        >
                            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : '요청서 즉시 제출'}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    )
}
