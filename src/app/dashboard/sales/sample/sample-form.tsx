// Common Component for Sales Sample view
'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { sampleRequestSchema, SampleRequestFormValues } from '@/lib/validations/sample'
import { addSampleRequest, getNextSampleNo } from './actions'
import { Client } from '@/types/crm'
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
import { toast } from 'sonner'
import {
    Loader2,
    Box,
    Check,
    ChevronsUpDown,
    Calendar as CalendarIcon,
    PenTool,
    Trash2,
    Save,
    Plus
} from 'lucide-react'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'

interface SampleFormProps {
    clients: Client[]
    onSuccess?: () => void
}

export function SampleForm({ clients, onSuccess }: SampleFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false)
    const [sampleNo, setSampleNo] = useState('D......')

    const form = useForm<SampleRequestFormValues>({
        resolver: zodResolver(sampleRequestSchema) as any,
        defaultValues: {
            sample_type: 'random',
            client_id: '',
            product_name: '',
            quantity: undefined as any,
            contact_person: '',
            sample_no: '',
            cat_no: '',
            has_sample: false,
            has_film: false,
            has_laba: false,
            shipping_address: '',
            special_instructions: '',
            design_specs: [
                {
                    part_name: '',
                    injection_material: '',
                    injection_color: '',
                    coating: '',
                    printing: ''
                }
            ] as any
        },
    })

    const sampleType = form.watch('sample_type')

    const [refreshTrigger, setRefreshTrigger] = useState(0);

    useEffect(() => {
        async function fetchNo() {
            const res = await getNextSampleNo(sampleType);
            if (res.success && res.nextNo) {
                setSampleNo(res.nextNo);
                form.setValue('sample_no', res.nextNo);
            }
        }
        fetchNo();
    }, [sampleType, form, refreshTrigger]);

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "design_specs",
    })

    // Removed auto-reset of fields to keep data enabled for all types

    async function onSubmit(data: SampleRequestFormValues) {
        setIsLoading(true);
        console.log("Submitting Data:", data);
        const result = await addSampleRequest(data);

        if (result.error) {
            toast.error('요청 실패', { description: result.error });
            console.error("Submission Error:", result.error);
        } else {
            toast.success('샘플 요청이 등록되었습니다', {
                description: '샘플실로 요청이 정상적으로 전달되었습니다.',
                position: 'top-center'
            });
            form.reset({
                ...form.getValues(),
                product_name: '',
                quantity: undefined,
                cat_no: '',
                special_instructions: '',
                has_sample: false,
                has_film: false,
                has_laba: false,
            });
            setRefreshTrigger(prev => prev + 1);
            onSuccess?.();
            // window.location.reload(); // Removed to allow smooth next entry
        }
        setIsLoading(false);
    }

    function onError(errors: any) {
        console.error("Form Validation Errors:", errors);

        // 상세 에러 메시지 추출
        let errorMsg = '필수 항목을 모두 정확히 입력해주세요.';
        if (errors.completion_date) errorMsg = errors.completion_date.message;
        else if (errors.design_specs) errorMsg = errors.design_specs.message;
        else if (errors.product_name) errorMsg = errors.product_name.message;

        toast.error('입력 오류', {
            description: errorMsg,
            position: 'top-right'
        });
    }

    return (
        <div className="bg-slate-950 text-slate-100 flex flex-col h-full max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-primary/20 bg-slate-900 sticky top-0 z-10 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg border border-primary/20">
                        <Box className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-100 m-0">새 샘플 요청</h2>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-slate-800">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-8">

                        {/* 1. 최상단 3단 ToggleGroup (샘플 종류) */}
                        <FormField
                            control={form.control}
                            name="sample_type"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                    <FormControl>
                                        <ToggleGroup
                                            type="single"
                                            value={field.value}
                                            onValueChange={(val: string) => {
                                                if (val) field.onChange(val)
                                            }}
                                            className="grid grid-cols-3 bg-slate-900/50 p-1 rounded-xl border border-white/5"
                                        >
                                            <ToggleGroupItem value="random" className="rounded-lg py-2 data-[state=on]:bg-primary/20 data-[state=on]:text-primary data-[state=on]:border-primary/30 transition-all font-semibold">
                                                <Box className="w-4 h-4 mr-2" />
                                                랜덤 샘플
                                            </ToggleGroupItem>
                                            <ToggleGroupItem value="ct" className="rounded-lg py-2 data-[state=on]:bg-primary/20 data-[state=on]:text-primary data-[state=on]:border-primary/30 transition-all font-semibold">
                                                <Check className="w-4 h-4 mr-2" />
                                                CT 샘플
                                            </ToggleGroupItem>
                                            <ToggleGroupItem value="design" className="rounded-lg py-2 data-[state=on]:bg-primary/20 data-[state=on]:text-primary data-[state=on]:border-primary/30 transition-all font-semibold">
                                                <PenTool className="w-4 h-4 mr-2" />
                                                디자인 샘플
                                            </ToggleGroupItem>
                                        </ToggleGroup>
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        {/* 2. Dynamic Grid Layout - REFACTORED TO USER SPEC */}
                        <div className="w-full border border-slate-700 bg-slate-900 rounded-sm overflow-hidden text-sm flex flex-col font-sans shadow-xl">

                            {/* [Row 1]: 샘플번호 | 고객사 | 담당자 | 요청수량 - ADJUSTED RATIOS */}
                            <div className="w-full grid grid-cols-1 md:grid-cols-12 border-b border-slate-700">
                                {/* 번호 (2/12) */}
                                <div className="md:col-span-2 flex border-r border-slate-700 h-11 bg-slate-900/50">
                                    <div className="w-[60px] bg-slate-800 text-slate-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0 border-r border-slate-700 uppercase tracking-tighter">번호</div>
                                    <FormField
                                        control={form.control}
                                        name="sample_no"
                                        render={({ field }) => (
                                            <Input {...field} readOnly className="flex-1 h-full border-0 rounded-none bg-slate-900/30 shadow-none focus-visible:ring-0 px-2 text-primary font-mono font-bold text-[12px]" />
                                        )}
                                    />
                                </div>

                                {/* 고객사 (4/12) */}
                                <div className="md:col-span-4 flex border-r border-slate-700 h-11">
                                    <div className="w-[70px] bg-slate-800 text-slate-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0 border-r border-slate-700 uppercase tracking-tighter text-center">고객사</div>
                                    <FormItem className="flex-1 h-full relative">
                                        <FormField
                                            control={form.control}
                                            name="client_id"
                                            render={({ field }) => {
                                                const [open, setOpen] = useState(false);
                                                const [query, setQuery] = useState("");

                                                return (
                                                    <Popover open={open} onOpenChange={setOpen}>
                                                        <PopoverTrigger asChild>
                                                            <Button variant="ghost" className="w-full h-full flex justify-between items-center px-3 rounded-none hover:bg-slate-800 text-slate-100 font-semibold focus-visible:ring-0 text-[13px] truncate">
                                                                <span className="truncate">{field.value ? (clients.find(c => c.id === field.value)?.company_name || field.value) : "고객사 검색/입력"}</span>
                                                                <ChevronsUpDown className="w-4 h-4 opacity-50 shrink-0 ml-1" />
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-[400px] p-0 bg-slate-950 border-slate-700 shadow-2xl z-[100]">
                                                            <Command className="bg-transparent">
                                                                <CommandInput
                                                                    placeholder="고객사명 검색..."
                                                                    value={query}
                                                                    onValueChange={setQuery}
                                                                    className="h-10 border-0 focus-visible:ring-0"
                                                                />
                                                                <CommandList className="max-h-[300px]">
                                                                    <CommandEmpty className="p-2">
                                                                        <Button
                                                                            variant="ghost"
                                                                            className="w-full justify-start text-primary font-bold hover:bg-primary/10"
                                                                            onClick={() => {
                                                                                field.onChange(query);
                                                                                setOpen(false);
                                                                            }}
                                                                        >
                                                                            <Plus className="w-4 h-4 mr-2" />
                                                                            &quot;{query}&quot; (신규 등록)
                                                                        </Button>
                                                                    </CommandEmpty>
                                                                    <CommandGroup>
                                                                        {clients.map(c => (
                                                                            <CommandItem
                                                                                key={c.id}
                                                                                value={c.company_name}
                                                                                onSelect={() => {
                                                                                    field.onChange(c.id);
                                                                                    setOpen(false);
                                                                                }}
                                                                                className="hover:bg-slate-800 text-slate-300"
                                                                            >
                                                                                <Check className={cn("mr-2 h-4 w-4", c.id === field.value ? "opacity-100 text-primary" : "opacity-0")} />
                                                                                {c.company_name}
                                                                            </CommandItem>
                                                                        ))}
                                                                    </CommandGroup>
                                                                </CommandList>
                                                            </Command>
                                                        </PopoverContent>
                                                    </Popover>
                                                )
                                            }}
                                        />
                                        <FormMessage className="absolute -bottom-5 left-2 text-[10px]" />
                                    </FormItem>
                                </div>

                                {/* 담당자 (3/12) */}
                                <div className="md:col-span-3 flex border-r border-slate-700 h-11">
                                    <div className="w-[70px] bg-slate-800 text-slate-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0 border-r border-slate-700 uppercase tracking-tighter">담당자</div>
                                    <FormItem className="flex-1 h-full relative">
                                        <FormField
                                            control={form.control}
                                            name="contact_person"
                                            render={({ field }) => (
                                                <Input {...field} className="h-full border-0 rounded-none bg-transparent shadow-none focus-visible:ring-0 px-3 text-slate-100 font-medium placeholder:text-slate-600 text-[13px]" placeholder="이름" />
                                            )}
                                        />
                                        <FormMessage className="absolute -bottom-5 left-0 text-[10px] bg-slate-900 px-1 z-10" />
                                    </FormItem>
                                </div>

                                {/* 수량 (3/12) */}
                                <div className="md:col-span-3 flex h-11 bg-primary/5">
                                    <div className="w-[70px] bg-slate-800 text-slate-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0 border-r border-slate-700 uppercase tracking-tighter">수량</div>
                                    <FormItem className="flex-1 h-full relative">
                                        <FormField
                                            control={form.control}
                                            name="quantity"
                                            render={({ field }) => (
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    {...field}
                                                    value={field.value ?? ""}
                                                    onChange={e => field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value))}
                                                    className="h-full border-0 rounded-none bg-transparent shadow-none focus-visible:ring-0 text-center text-primary font-bold text-[16px] px-1"
                                                    placeholder="수량"
                                                />
                                            )}
                                        />
                                        <FormMessage className="absolute -bottom-5 right-0 text-[10px] font-bold text-red-400 bg-slate-950 px-1 z-10 whitespace-nowrap" />
                                    </FormItem>
                                </div>
                            </div>

                            {/* [Row 2 (2 Columns, 2:1 ratio)]: 제품명 | 완료요청일 */}
                            <div className="w-full grid grid-cols-1 md:grid-cols-3">
                                <div className="md:col-span-2 flex border-r border-b border-slate-700 h-11">
                                    <div className="w-[85px] bg-slate-800 text-slate-400 flex items-center justify-center text-[11px] font-bold flex-shrink-0 border-r border-slate-700 uppercase tracking-tighter">제품명</div>
                                    <FormItem className="flex-1 h-full relative">
                                        <FormField
                                            control={form.control}
                                            name="product_name"
                                            render={({ field }) => (
                                                <Input {...field} className="h-full border-0 rounded-none bg-transparent shadow-none focus-visible:ring-0 px-4 text-slate-100 font-bold placeholder:text-slate-600 text-[14px]" placeholder="제품명을 상세히 입력하세요" />
                                            )}
                                        />
                                        <FormMessage className="absolute -bottom-5 left-4 text-[10px]" />
                                    </FormItem>
                                </div>
                                <div className="flex border-b border-slate-700 h-11">
                                    <div className="w-[85px] bg-slate-800 text-slate-400 flex items-center justify-center text-[11px] font-bold flex-shrink-0 border-r border-slate-700 text-center px-1 tracking-tighter">완료요청일</div>
                                    <FormItem className="flex-1 h-full relative">
                                        <FormField
                                            control={form.control}
                                            name="completion_date"
                                            render={({ field }) => (
                                                <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
                                                    <PopoverTrigger asChild>
                                                        <Button variant="ghost" className="w-full h-full flex justify-between px-4 rounded-none hover:bg-slate-800 text-slate-100 focus-visible:ring-0">
                                                            {field.value ? format(field.value, 'yyyy-MM-dd') : <span className="text-slate-600">날짜 선택</span>}
                                                            <CalendarIcon className="w-4 h-4 opacity-50" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0 z-[9999] border-slate-700">
                                                        <Calendar mode="single" selected={field.value} onSelect={(d) => { if (d) { field.onChange(d); setIsDatePopoverOpen(false); } }} />
                                                    </PopoverContent>
                                                </Popover>
                                            )}
                                        />
                                        <FormMessage className="absolute -bottom-5 right-4 text-[10px]" />
                                    </FormItem>
                                </div>
                            </div>

                            {/* [Row 3 (4 Columns)]: Cat No. | 견본유무 | 필름유무 | 라바유무 - DESIGN ONLY */}
                            {sampleType === 'design' && (
                                <div className="w-full grid grid-cols-1 md:grid-cols-4 border-t border-slate-700">
                                    <div className="flex border-r border-slate-700 md:border-b-0 border-b h-11">
                                        <div className="w-[85px] bg-slate-800 text-slate-400 flex items-center justify-center text-[11px] font-bold flex-shrink-0 border-r border-slate-700 text-center px-1 tracking-tighter">CAT NO.</div>
                                        <FormItem className="flex-1 h-full relative">
                                            <FormField
                                                control={form.control}
                                                name="cat_no"
                                                render={({ field }) => (
                                                    <Input {...field} className="h-full border-0 rounded-none bg-transparent shadow-none focus-visible:ring-0 px-3 text-slate-300 text-[13px]" placeholder="카탈로그 번호" />
                                                )}
                                            />
                                            <FormMessage className="absolute -bottom-5 left-0 text-[9px]" />
                                        </FormItem>
                                    </div>
                                    <div className="flex border-r border-slate-700 md:border-b-0 border-b h-11">
                                        <div className="w-[85px] bg-slate-800 text-slate-400 flex items-center justify-center text-[11px] font-bold flex-shrink-0 border-r border-slate-700 text-center px-1">견본유무</div>
                                        <FormField
                                            control={form.control}
                                            name="has_sample"
                                            render={({ field }) => (
                                                <div className="flex-1 flex p-1.5 gap-1 items-center bg-slate-900/50">
                                                    <button type="button" onClick={() => field.onChange(true)} className={`flex-1 h-full rounded text-[11px] font-bold transition-all ${field.value ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:bg-slate-800 border border-slate-700/50'}`}>있음</button>
                                                    <button type="button" onClick={() => field.onChange(false)} className={`flex-1 h-full rounded text-[11px] font-bold transition-all ${!field.value ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:bg-slate-800 border border-slate-700/50'}`}>없음</button>
                                                </div>
                                            )}
                                        />
                                    </div>
                                    <div className="flex border-r border-slate-700 md:border-b-0 border-b h-11">
                                        <div className="w-[85px] bg-slate-800 text-slate-400 flex items-center justify-center text-[11px] font-bold flex-shrink-0 border-r border-slate-700 text-center px-1">필름유무</div>
                                        <FormField
                                            control={form.control}
                                            name="has_film"
                                            render={({ field }) => (
                                                <div className="flex-1 flex p-1.5 gap-1 items-center bg-slate-900/50">
                                                    <button type="button" onClick={() => field.onChange(true)} className={`flex-1 h-full rounded text-[11px] font-bold transition-all ${field.value ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:bg-slate-800 border border-slate-700/50'}`}>있음</button>
                                                    <button type="button" onClick={() => field.onChange(false)} className={`flex-1 h-full rounded text-[11px] font-bold transition-all ${!field.value ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:bg-slate-800 border border-slate-700/50'}`}>없음</button>
                                                </div>
                                            )}
                                        />
                                    </div>
                                    <div className="flex h-11">
                                        <div className="w-[85px] bg-slate-800 text-slate-400 flex items-center justify-center text-[11px] font-bold flex-shrink-0 border-r border-slate-700 text-center px-1">라바유무</div>
                                        <FormField
                                            control={form.control}
                                            name="has_laba"
                                            render={({ field }) => (
                                                <div className="flex-1 flex p-1.5 gap-1 items-center bg-slate-900/50">
                                                    <button type="button" onClick={() => field.onChange(true)} className={`flex-1 h-full rounded text-[11px] font-bold transition-all ${field.value ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:bg-slate-800 border border-slate-700/50'}`}>있음</button>
                                                    <button type="button" onClick={() => field.onChange(false)} className={`flex-1 h-full rounded text-[11px] font-bold transition-all ${!field.value ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:bg-slate-800 border border-slate-700/50'}`}>없음</button>
                                                </div>
                                            )}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* BOM Table Section (Cloned from reference image) */}
                        {sampleType === 'design' && (
                            <div className="space-y-4 animate-in fade-in duration-500">
                                <div className="w-full border border-slate-700 bg-slate-900 rounded-sm overflow-hidden text-sm shadow-xl">
                                    <table className="w-full text-center border-collapse">
                                        <thead className="bg-slate-800 text-slate-400 border-b border-slate-700">
                                            <tr>
                                                <th className="font-bold py-3 px-3 border-r border-slate-700 w-[20%]" rowSpan={2}>부품명</th>
                                                <th className="font-bold py-2 px-3 border-r border-slate-700" colSpan={2}>사출</th>
                                                <th className="font-bold py-3 px-3 border-r border-slate-700 w-[25%]" rowSpan={2}>증착 및 코팅</th>
                                                <th className="font-bold py-3 px-3 w-[20%]" rowSpan={2}>인쇄 및 박</th>
                                                <th className="w-[50px] border-l border-slate-700" rowSpan={2}></th>
                                            </tr>
                                            <tr>
                                                <th className="font-bold py-2 px-3 border-r border-t border-slate-700 text-[11px] bg-slate-800/50">원료명</th>
                                                <th className="font-bold py-2 px-3 border-r border-t border-slate-700 text-[11px] bg-slate-800/50">색상</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-700 bg-slate-900">
                                            {fields.map((field, idx) => (
                                                <tr key={field.id} className="group hover:bg-slate-800/40 transition-colors">
                                                    <td className="p-0 border-r border-slate-700">
                                                        <Input {...form.register(`design_specs.${idx}.part_name`)} className="h-11 border-0 rounded-none bg-transparent shadow-none focus-visible:ring-0 text-center font-bold text-slate-100" />
                                                    </td>
                                                    <td className="p-0 border-r border-slate-700">
                                                        <Input {...form.register(`design_specs.${idx}.injection_material`)} className="h-11 border-0 rounded-none bg-transparent shadow-none focus-visible:ring-0 text-center text-slate-300 text-[13px]" />
                                                    </td>
                                                    <td className="p-0 border-r border-slate-700">
                                                        <Input {...form.register(`design_specs.${idx}.injection_color`)} className="h-11 border-0 rounded-none bg-transparent shadow-none focus-visible:ring-0 text-center text-slate-300 text-[13px]" />
                                                    </td>
                                                    <td className="p-0 border-r border-slate-700">
                                                        <Input {...form.register(`design_specs.${idx}.coating`)} className="h-11 border-0 rounded-none bg-transparent shadow-none focus-visible:ring-0 text-center text-slate-300 text-[13px]" />
                                                    </td>
                                                    <td className="p-0">
                                                        <Input {...form.register(`design_specs.${idx}.printing`)} className="h-11 border-0 rounded-none bg-transparent shadow-none focus-visible:ring-0 text-center text-slate-300 text-[13px]" />
                                                    </td>
                                                    <td className="p-0 border-l border-slate-700 align-middle">
                                                        <button type="button" onClick={() => remove(idx)} className="w-full h-11 flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => append({ part_name: '', injection_material: '', injection_color: '', coating: '', printing: '' })}
                                    className="text-primary hover:text-primary/80 text-sm font-bold flex items-center gap-1.5 transition-colors pl-1"
                                >
                                    <Plus className="w-4 h-4" /> BOM 행 추가
                                </button>
                            </div>
                        )}

                        {/* Special Instructions */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">특이사항 (메모)</label>
                            <FormItem className="space-y-1">
                                <FormField
                                    control={form.control}
                                    name="special_instructions"
                                    render={({ field }) => (
                                        <Textarea
                                            {...field}
                                            placeholder="요구사항이나 배송지, 특기사항 등 (필요 시 작성)"
                                            className="w-full h-28 bg-slate-900 border border-slate-700 rounded-md p-4 text-slate-100 text-[14px] focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-slate-600 resize-none shadow-inner"
                                        />
                                    )}
                                />
                                <FormMessage />
                            </FormItem>
                        </div>

                        {/* Submit Actions */}
                        <div className="flex justify-end gap-3 pt-6 border-t border-white/5 sticky bottom-0 bg-slate-950 pb-4">
                            <Button type="button" variant="ghost" onClick={() => onSuccess?.()} className="px-6 h-12 text-slate-500 hover:text-slate-300 hover:bg-slate-900 border border-slate-800">
                                취소
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="px-10 h-12 text-base font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 rounded-md min-w-[160px]"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                ) : (
                                    <Save className="w-5 h-5 mr-2" />
                                )}
                                샘플 요청 등록
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    )
}
