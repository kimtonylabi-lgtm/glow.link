'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { orderSchema, type OrderFormValues } from '@/lib/validations/product-order'
import { addOrder } from './actions'
import { toast } from 'sonner'
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
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'
import {
    Calendar as CalendarIcon,
    Check,
    ChevronsUpDown,
    Plus,
    Trash2,
    ShoppingCart,
    Loader2
} from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { CreatableCombobox } from '@/components/ui/creatable-combobox'

interface OrderFormProps {
    clients: { id: string; company_name: string }[]
    products: { id: string; name: string; base_price: number }[]
    clientProducts: { id: string; name: string }[]
    onSuccess?: () => void
}

export function OrderForm({ clients, products, clientProducts, onSuccess }: OrderFormProps) {
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false)

    const form = useForm<OrderFormValues>({
        resolver: zodResolver(orderSchema),
        defaultValues: {
            client_name: '',
            due_date: undefined,
            items: [{ product_name: '', client_product_name: '', quantity: 1, unit_price: 0 }],
            memo: '',
        },
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items",
    })

    // Reset form when opening/closing sheet
    useEffect(() => {
        if (!isOpen) {
            form.reset({
                client_name: '',
                due_date: undefined,
                items: [{ product_name: '', client_product_name: '', quantity: 1, unit_price: 0 }],
                memo: '',
            })
        }
    }, [isOpen, form])

    async function onSubmit(data: OrderFormValues) {
        setIsLoading(true)
        try {
            const result = await addOrder(data)

            if (result.success) {
                if (result.newMasterItems) {
                    toast.success('신규 마스터 등록 및 수주 완료', {
                        description: (
                            <div className="mt-2 text-xs flex flex-col gap-1">
                                <p>아래 항목들이 마스터 데이터에 자동 등록되었습니다:</p>
                                <ul className="list-disc pl-4">
                                    {result.newMasterItems.map((item, i) => (
                                        <li key={i}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        ),
                        duration: 5000,
                    });
                } else {
                    toast.success('등록 완료', { description: '성공적으로 등록되었습니다.' })
                }

                setIsOpen(false)
                form.reset()
                router.refresh()
                onSuccess?.()
            } else {
                toast.error('등록 실패', { description: result.error || '수주 등록에 실패했습니다.' })
            }
        } catch (error) {
            console.error('Submit error:', error);
            toast.error('서버 오류가 발생했습니다.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button className="shadow-[0_0_15px_theme(colors.primary.DEFAULT)/30] hover:shadow-[0_0_20px_theme(colors.primary.DEFAULT)/50] transition-all">
                    <Plus className="mr-2 h-4 w-4" />
                    수주 등록
                </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-[700px] overflow-y-auto bg-card/95 backdrop-blur-2xl border-l-border/50 p-6">
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-2xl text-primary">신규 수주/납기 등록</SheetTitle>
                    <SheetDescription>
                        수주 정보를 입력하십시오. 새로운 고객사나 제품은 텍스트를 입력하여 즉시 등록할 수 있습니다.
                    </SheetDescription>
                </SheetHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-20 sm:pb-0 overflow-x-hidden">
                        {/* Master Info */}
                        <div className="space-y-4 p-4 rounded-xl bg-muted/20 border border-border/40">
                            <h3 className="font-semibold text-lg border-b border-border/40 pb-2">기본 정보</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {/* Client Selection */}
                                <FormField
                                    control={form.control}
                                    name="client_name"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>고객사명 *</FormLabel>
                                            <FormControl>
                                                <CreatableCombobox
                                                    options={clients.map(c => ({ name: c.company_name }))}
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    placeholder="고객사 선택 또는 직접 입력..."
                                                    emptyMessage="새로운 고객사명 입력 시 자동 등록됨"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Due Date */}
                                <FormField
                                    control={form.control}
                                    name="due_date"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>납기 예정일</FormLabel>
                                            <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant={"outline"}
                                                            className={cn(
                                                                "w-full pl-3 text-left font-normal bg-background/50 border-border/50",
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
                                                            setIsDatePopoverOpen(false) // Auto-close
                                                        }}
                                                        disabled={(date) =>
                                                            date < new Date("1900-01-01")
                                                        }
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Items Area */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center px-1">
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                    <ShoppingCart className="w-5 h-5 text-primary" />
                                    품목 리스트 ({fields.length})
                                </h3>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => append({ product_name: '', client_product_name: '', quantity: 1, unit_price: 0 })}
                                    className="border-primary/50 text-primary hover:bg-primary/10"
                                >
                                    <Plus className="w-4 h-4 mr-1" /> 품목 추가
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {fields.map((field, index) => (
                                    <div key={field.id} className="p-4 rounded-xl bg-card border border-border/50 shadow-md relative group animate-in slide-in-from-right duration-300">
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/20 rounded-l-xl" />
                                        {fields.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => remove(index)}
                                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/30 transition-all opacity-0 group-hover:opacity-100 z-10"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Product Selection */}
                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.product_name`}
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-col">
                                                        <FormLabel className="text-xs text-muted-foreground font-semibold">마스터 제품명 *</FormLabel>
                                                        <FormControl>
                                                            <CreatableCombobox
                                                                options={products.map(p => ({ name: p.name }))}
                                                                value={field.value}
                                                                onChange={(val: string) => {
                                                                    field.onChange(val);
                                                                    // Auto-fill price if existing product selected
                                                                    const existing = products.find(p => p.name === val);
                                                                    if (existing) {
                                                                        form.setValue(`items.${index}.unit_price`, existing.base_price);
                                                                    }
                                                                }}
                                                                placeholder="제품 선택 또는 입력..."
                                                                className="h-9 text-xs"
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Client Product Name */}
                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.client_product_name`}
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-col">
                                                        <FormLabel className="text-xs text-muted-foreground font-semibold">고객사별 제품명 (선택)</FormLabel>
                                                        <FormControl>
                                                            <CreatableCombobox
                                                                options={clientProducts.map(cp => ({ name: cp.name }))}
                                                                value={field.value || ''}
                                                                onChange={field.onChange}
                                                                placeholder="고객사 전용 품명..."
                                                                className="h-9 text-xs"
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <div className="grid grid-cols-2 gap-4 md:col-span-2 mt-2">
                                                <FormField
                                                    control={form.control}
                                                    name={`items.${index}.quantity`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-xs text-muted-foreground font-semibold">수량</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    min={1}
                                                                    {...field}
                                                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                                                    className="h-10 text-sm bg-muted/10 border-border/40"
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name={`items.${index}.unit_price`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-xs text-muted-foreground font-semibold">단가</FormLabel>
                                                            <FormControl>
                                                                <div className="relative">
                                                                    <Input
                                                                        type="number"
                                                                        {...field}
                                                                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                                                        className="h-10 text-sm pr-7 bg-muted/10 border-border/40 font-mono"
                                                                    />
                                                                    <span className="absolute right-2 top-2.5 text-xs text-muted-foreground">원</span>
                                                                </div>
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <FormField
                            control={form.control}
                            name="memo"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-semibold">비고 (메모)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="특이사항이나 배송 요청사항을 입력하세요."
                                            className="resize-none bg-muted/20 border-border/40 focus:border-primary/50"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="pt-4 flex flex-col gap-3">
                            <div className="flex justify-between items-center px-4 py-4 bg-primary/5 rounded-xl border border-primary/20 shadow-inner">
                                <span className="text-sm font-semibold opacity-80">최종 수주 합계 금액</span>
                                <span className="text-2xl font-black text-primary tracking-tight">
                                    {form.watch('items')
                                        .reduce((sum, item) => sum + (item.quantity * item.unit_price || 0), 0)
                                        .toLocaleString()}원
                                </span>
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading}
                                size="lg"
                                className="w-full h-14 text-lg font-bold shadow-[0_10px_25px_theme(colors.primary.DEFAULT)/30] hover:shadow-[0_15px_30px_theme(colors.primary.DEFAULT)/50] hover:-translate-y-0.5 transition-all active:scale-95"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        수주 데이터 기록 중...
                                    </>
                                ) : (
                                    '최종 수주 확정 및 등록'
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    )
}
