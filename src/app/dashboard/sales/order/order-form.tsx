'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import { Plus, Loader2, AlertCircle, Trash2, CalendarIcon, Check } from "lucide-react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { toast } from "sonner"

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Textarea } from '@/components/ui/textarea'

import { orderSchema, OrderFormValues } from '@/lib/validations/product-order'
import { addOrder } from './actions'
import { cn } from '@/lib/utils'

export function OrderForm({ clients, products }: { clients: { id: string, company_name: string }[], products: any[] }) {
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const form = useForm<OrderFormValues>({
        resolver: zodResolver(orderSchema),
        defaultValues: {
            client_id: "",
            due_date: undefined,
            memo: "",
            items: [
                { product_id: "", quantity: 1, unit_price: 0 }
            ],
        },
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items",
    })

    // Watch values for auto calculation
    const watchItems = form.watch("items")

    // Real-time calculation of subtotal and total amount
    const totalAmount = useMemo(() => {
        return watchItems.reduce((acc, item) => {
            const qty = item.quantity || 0
            const price = item.unit_price || 0
            return acc + (qty * price)
        }, 0)
    }, [watchItems])

    // Auto-fill price when product is selected
    const handleProductSelect = (index: number, productId: string) => {
        const selectedProduct = products.find(p => p.id === productId)
        if (selectedProduct) {
            form.setValue(`items.${index}.product_id`, productId)
            form.setValue(`items.${index}.unit_price`, parseFloat(selectedProduct.price)) // auto-fill default price
        }
    }

    async function onSubmit(data: OrderFormValues) {
        setIsLoading(true)

        try {
            const result = await addOrder(data)

            if (result.success) {
                toast.success('수주가 성공적으로 등록되었습니다.')
                setIsOpen(false)
                form.reset()
                router.refresh()
            } else {
                toast.error(result.error || '수주 등록에 실패했습니다.')
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
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_theme(colors.primary.DEFAULT)/50] transition-shadow">
                    <Plus className="w-4 h-4 mr-2" />
                    수주 등록
                </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto w-full sm:max-w-2xl border-l border-border/40 bg-background/95 backdrop-blur-xl">
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-xl font-bold bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
                        신규 수주 등록
                    </SheetTitle>
                    <SheetDescription className="text-muted-foreground">
                        고객사를 선택하고 여러 제품을 장바구니처럼 담아 1건의 수주 마스터를 생성합니다.
                    </SheetDescription>
                </SheetHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-10">
                        {/* Master Info */}
                        <div className="space-y-4 p-4 rounded-xl bg-muted/20 border border-border/40">
                            <h3 className="font-semibold text-lg">기본 정보</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="client_id"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>고객사 *</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            className={cn(
                                                                "w-full justify-between bg-card/50",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value
                                                                ? clients.find((client) => client.id === field.value)?.company_name
                                                                : "고객사 검색"}
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[300px] p-0">
                                                    <Command>
                                                        <CommandInput placeholder="고객사 이름 검색..." />
                                                        <CommandList>
                                                            <CommandEmpty>결과가 없습니다.</CommandEmpty>
                                                            <CommandGroup>
                                                                {clients.map((client) => (
                                                                    <CommandItem
                                                                        value={client.company_name}
                                                                        key={client.id}
                                                                        onSelect={() => {
                                                                            form.setValue("client_id", client.id)
                                                                        }}
                                                                    >
                                                                        {client.company_name}
                                                                        <Check
                                                                            className={cn(
                                                                                "ml-auto h-4 w-4",
                                                                                client.id === field.value
                                                                                    ? "opacity-100"
                                                                                    : "opacity-0"
                                                                            )}
                                                                        />
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
                                    name="due_date"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>납기일 (선택)</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant={"outline"}
                                                            className={cn(
                                                                "w-full pl-3 text-left font-normal bg-card/50",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value ? (
                                                                format(field.value, "PPP", { locale: ko })
                                                            ) : (
                                                                <span>날짜 선택</span>
                                                            )}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={field.onChange}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="memo"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>메모</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="주문 관련 특이사항 등 메모" className="resize-none bg-card/50" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Order Items (Dynamic Details) */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="font-semibold text-lg">주문 내역</h3>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => append({ product_id: "", quantity: 1, unit_price: 0 })}
                                    className="border-primary/50 text-primary hover:bg-primary/10"
                                >
                                    <Plus className="w-4 h-4 mr-1" /> 품목 추가
                                </Button>
                            </div>

                            {form.formState.errors.items?.root && (
                                <p className="text-sm font-medium text-destructive">{form.formState.errors.items.root.message}</p>
                            )}

                            <div className="space-y-4">
                                {fields.map((field, index) => (
                                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start p-3 bg-card/40 border border-border/40 rounded-lg relative">

                                        <div className="md:col-span-12 flex justify-between absolute -top-3 -right-2">
                                            {fields.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    className="w-6 h-6 rounded-full shadow-lg h-6 w-6"
                                                    onClick={() => remove(index)}
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            )}
                                        </div>

                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.product_id`}
                                            render={({ field: selectField }) => (
                                                <FormItem className="md:col-span-5 flex flex-col pt-2">
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <FormControl>
                                                                <Button
                                                                    variant="outline"
                                                                    role="combobox"
                                                                    className={cn(
                                                                        "w-full justify-between bg-card/50",
                                                                        !selectField.value && "text-muted-foreground"
                                                                    )}
                                                                >
                                                                    {selectField.value
                                                                        ? products.find((p) => p.id === selectField.value)?.name
                                                                        : "제품 선택"}
                                                                </Button>
                                                            </FormControl>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-[300px] p-0">
                                                            <Command>
                                                                <CommandInput placeholder="제품명 검색..." />
                                                                <CommandList>
                                                                    <CommandEmpty>결과가 없습니다.</CommandEmpty>
                                                                    <CommandGroup>
                                                                        {products.map((product) => (
                                                                            <CommandItem
                                                                                value={product.name}
                                                                                key={product.id}
                                                                                onSelect={() => handleProductSelect(index, product.id)}
                                                                            >
                                                                                <span className="truncate">{product.name}</span>
                                                                                <span className="ml-2 text-xs text-muted-foreground">({product.item_code})</span>
                                                                                <Check
                                                                                    className={cn(
                                                                                        "ml-auto h-4 w-4",
                                                                                        product.id === selectField.value
                                                                                            ? "opacity-100"
                                                                                            : "opacity-0"
                                                                                    )}
                                                                                />
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
                                            name={`items.${index}.quantity`}
                                            render={({ field: inputField }) => (
                                                <FormItem className="md:col-span-2 pt-2">
                                                    <FormControl>
                                                        <div className="relative">
                                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">수량</span>
                                                            <Input
                                                                type="number"
                                                                className="pl-9 h-10 text-right pr-2"
                                                                min="1"
                                                                {...inputField}
                                                                onChange={e => inputField.onChange(Number(e.target.value))}
                                                            />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.unit_price`}
                                            render={({ field: inputField }) => (
                                                <FormItem className="md:col-span-3 pt-2">
                                                    <FormControl>
                                                        <div className="relative">
                                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">단가</span>
                                                            <Input
                                                                type="text"
                                                                className="pl-9 h-10 text-right pr-2 font-mono text-sm"
                                                                min="0"
                                                                // Convert to comma format for display, but keep number for form value
                                                                value={inputField.value.toLocaleString('ko-KR')}
                                                                // Remove commas when user types and parse as float
                                                                onChange={e => {
                                                                    const val = e.target.value.replace(/,/g, '')
                                                                    inputField.onChange(val === '' ? 0 : Number(val))
                                                                }}
                                                            />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="md:col-span-2 pt-2 flex flex-col justify-center h-10">
                                            <div className="text-right text-sm">
                                                <span className="text-muted-foreground text-xs block mb-1 leading-none">소계</span>
                                                <span className="font-bold font-mono text-primary truncate leading-none">
                                                    {((watchItems[index]?.quantity || 0) * (watchItems[index]?.unit_price || 0)).toLocaleString('ko-KR')}
                                                </span>
                                            </div>
                                        </div>

                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Total Footer */}
                        <div className="sticky bottom-0 bg-background/95 backdrop-blur-xl border-t border-border/40 p-4 -mx-6 rounded-b-xl flex justify-between items-center z-10">
                            <div>
                                <p className="text-sm text-muted-foreground">총 주문 금액 (VAT 별도)</p>
                                <p className="text-3xl font-bold font-mono bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
                                    {totalAmount.toLocaleString('ko-KR')} <span className="text-lg text-foreground font-sans">원</span>
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                                    취소
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_theme(colors.primary.DEFAULT)/30]"
                                >
                                    {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    수주 저장
                                </Button>
                            </div>
                        </div>

                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    )
}
