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

interface OrderFormProps {
    clients: { id: string; company_name: string }[]
    products: { id: string; name: string; base_price: number }[]
    onSuccess?: () => void
}

export function OrderForm({ clients, products, onSuccess }: OrderFormProps) {
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isClientPopoverOpen, setIsClientPopoverOpen] = useState(false)
    const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false)

    const form = useForm<OrderFormValues>({
        resolver: zodResolver(orderSchema),
        defaultValues: {
            client_id: '',
            due_date: undefined,
            items: [{ product_id: '', quantity: 1, unit_price: 0 }],
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
                client_id: '',
                due_date: undefined,
                items: [{ product_id: '', quantity: 1, unit_price: 0 }],
                memo: '',
            })
        }
    }, [isOpen, form])

    async function onSubmit(data: OrderFormValues) {
        setIsLoading(true)
        try {
            const result = await addOrder(data)

            if (result.success) {
                toast.success('등록 완료', { description: '성공적으로 등록되었습니다.' })
                setIsOpen(false)
                form.reset()
                router.refresh()
                onSuccess?.()
            } else {
                toast.error('등록 실패', { description: result.error || '수주 등록에 실패했습니다.' })
            }
        } catch (error) {
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
            <SheetContent className="w-full sm:max-w-[600px] overflow-y-auto bg-card/95 backdrop-blur-2xl border-l-border/50 p-6">
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-2xl text-primary">신규 수주/납기 등록</SheetTitle>
                    <SheetDescription>
                        수주 정보를 입력하고 상세 품목을 추가하십시오.
                    </SheetDescription>
                </SheetHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-20 sm:pb-0 overflow-x-hidden">
                        {/* Master Info */}
                        <div className="space-y-4 p-4 rounded-xl bg-muted/20 border border-border/40">
                            <h3 className="font-semibold text-lg">기본 정보</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Client Selection */}
                                <FormField
                                    control={form.control}
                                    name="client_id"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>고객사 *</FormLabel>
                                            <Popover open={isClientPopoverOpen} onOpenChange={setIsClientPopoverOpen}>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            className={cn(
                                                                "w-full justify-between bg-background/50 border-border/50",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value
                                                                ? clients.find((client) => client.id === field.value)?.company_name
                                                                : "고객사 검색..."}
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-card/95 backdrop-blur-md">
                                                    <Command>
                                                        <CommandInput placeholder="고객사 이름 검색..." />
                                                        <CommandList>
                                                            <CommandEmpty>결과 없음</CommandEmpty>
                                                            <CommandGroup>
                                                                {clients.map((client) => (
                                                                    <CommandItem
                                                                        key={client.id}
                                                                        value={client.company_name}
                                                                        onSelect={() => {
                                                                            form.setValue("client_id", client.id)
                                                                            setIsClientPopoverOpen(false) // Auto-close
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                "mr-2 h-4 w-4",
                                                                                client.id === field.value ? "opacity-100" : "opacity-0"
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
                            <div className="flex justify-between items-center">
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                    <ShoppingCart className="w-5 h-5 text-primary" />
                                    품목 리스트 ({fields.length})
                                </h3>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => append({ product_id: '', quantity: 1, unit_price: 0 })}
                                    className="border-primary/50 text-primary hover:bg-primary/10"
                                >
                                    <Plus className="w-4 h-4 mr-1" /> 품목 추가
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {fields.map((field, index) => (
                                    <div key={field.id} className="p-4 rounded-xl bg-card border border-border/50 shadow-sm relative group animate-in slide-in-from-right duration-300">
                                        {fields.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => remove(index)}
                                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/30 transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        )}

                                        <div className="grid grid-cols-1 gap-4">
                                            {/* Product Selection */}
                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.product_id`}
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-col">
                                                        <FormLabel className="text-xs text-muted-foreground">제품</FormLabel>
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <FormControl>
                                                                    <Button
                                                                        variant="outline"
                                                                        role="combobox"
                                                                        className={cn(
                                                                            "w-full justify-between bg-muted/20 text-xs h-9",
                                                                            !field.value && "text-muted-foreground"
                                                                        )}
                                                                    >
                                                                        {field.value
                                                                            ? products.find((p) => p.id === field.value)?.name
                                                                            : "제품 선택..."}
                                                                        <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                                                                    </Button>
                                                                </FormControl>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-card/95 backdrop-blur-md">
                                                                <Command>
                                                                    <CommandInput placeholder="제품명 검색..." className="h-9 text-xs" />
                                                                    <CommandList>
                                                                        <CommandEmpty>결과 없음</CommandEmpty>
                                                                        <CommandGroup>
                                                                            {products.map((p) => (
                                                                                <CommandItem
                                                                                    key={p.id}
                                                                                    value={p.name}
                                                                                    onSelect={() => {
                                                                                        form.setValue(`items.${index}.product_id`, p.id)
                                                                                        form.setValue(`items.${index}.unit_price`, p.base_price)
                                                                                    }}
                                                                                    className="text-xs"
                                                                                >
                                                                                    <Check
                                                                                        className={cn(
                                                                                            "mr-2 h-3 w-3",
                                                                                            p.id === field.value ? "opacity-100" : "opacity-0"
                                                                                        )}
                                                                                    />
                                                                                    {p.name} ({p.base_price.toLocaleString()}원)
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

                                            <div className="grid grid-cols-2 gap-3">
                                                <FormField
                                                    control={form.control}
                                                    name={`items.${index}.quantity`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-xs text-muted-foreground">수량</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    min={1}
                                                                    {...field}
                                                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                                                    className="h-9 text-xs"
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
                                                            <FormLabel className="text-xs text-muted-foreground">단가</FormLabel>
                                                            <FormControl>
                                                                <div className="relative">
                                                                    <Input
                                                                        type="number"
                                                                        {...field}
                                                                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                                                        className="h-9 text-xs pr-7"
                                                                    />
                                                                    <span className="absolute right-2 top-2 text-[10px] text-muted-foreground">원</span>
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
                                    <FormLabel>비고 (메모)</FormLabel>
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
                            <div className="flex justify-between items-center px-2 py-3 bg-primary/5 rounded-lg border border-primary/20">
                                <span className="text-sm font-medium">총 합계 금액</span>
                                <span className="text-lg font-bold text-primary">
                                    {form.watch('items')
                                        .reduce((sum, item) => sum + (item.quantity * item.unit_price || 0), 0)
                                        .toLocaleString()}원
                                </span>
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-12 shadow-[0_0_20px_theme(colors.primary.DEFAULT)/30] hover:shadow-[0_0_30px_theme(colors.primary.DEFAULT)/50] transition-all"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        등록 중...
                                    </>
                                ) : (
                                    '최종 등록 완료'
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    )
}
