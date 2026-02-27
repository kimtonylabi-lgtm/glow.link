// Common Component for Sales Sample view
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { sampleRequestSchema, type SampleRequestFormValues } from '@/lib/validations/sample'
import { addSampleRequest } from './actions'
import { Client, SampleRequestWithRelations } from '@/types/crm'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Loader2, Check, ChevronsUpDown } from 'lucide-react'

interface SampleFormProps {
    clients: Client[]
}

export function SampleForm({ clients }: SampleFormProps) {
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<SampleRequestFormValues>({
        resolver: zodResolver(sampleRequestSchema),
        defaultValues: {
            client_id: '',
            product_name: '',
            quantity: 1,
            shipping_address: '',
            contact_person: '',
            special_instructions: '',
            sample_type: 'random',
        },
    })

    async function onSubmit(data: any /* SampleRequestFormValues inferred */) {
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
        <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-6 text-foreground">새 샘플 요청</h3>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    {/* Client Selection (Combobox) */}
                    <FormField
                        control={form.control}
                        name="client_id"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>고객사</FormLabel>
                                <Popover>
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
                                                    : "고객사 검색 및 선택"}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full p-0 bg-card/95 backdrop-blur-md border border-border/50">
                                        <Command>
                                            <CommandInput placeholder="고객사 이름 검색..." />
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

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="contact_person"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>고객사 담당자</FormLabel>
                                    <FormControl>
                                        <Input placeholder="담당자 성함" {...field} className="bg-background/50 border-border/50" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="sample_type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>샘플 종류</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="bg-background/50 border-border/50">
                                                <SelectValue placeholder="종류 선택" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="random">랜덤 발송</SelectItem>
                                            <SelectItem value="ct">CT (내용물 테스트용)</SelectItem>
                                            <SelectItem value="design">디자인 (인쇄/후가공 확인용)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="product_name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>제품명 / 스펙</FormLabel>
                                <FormControl>
                                    <Input placeholder="예: 50ml 아크릴 더블크림" {...field} className="bg-background/50 border-border/50" />
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
                                <FormLabel>요청 수량</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        min="1"
                                        {...field}
                                        value={field.value as number | string}
                                        onChange={e => field.onChange(Number(e.target.value))}
                                        className="bg-background/50 border-border/50"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="shipping_address"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>배송지 주소</FormLabel>
                                <FormControl>
                                    <Input placeholder="정확한 발송지 입력" {...field} className="bg-background/50 border-border/50" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="special_instructions"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>특이사항</FormLabel>
                                <FormControl>
                                    <Input placeholder="특이사항 작성 (없으면 '없음' 입력)" {...field} className="bg-background/50 border-border/50" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-primary/90 hover:bg-primary shadow-[0_0_15px_theme(colors.primary.DEFAULT)/30] transition-all"
                    >
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : '요청서 제출'}
                    </Button>
                </form>
            </Form>
        </div>
    )
}
