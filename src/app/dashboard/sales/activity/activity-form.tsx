'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { activitySchema, type ActivityFormValues } from '@/lib/validations/activity'
import { addActivity, updateActivity } from './actions'
import { Client, Product, ClientProduct, ActivityWithRelations } from '@/types/crm'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Loader2, CalendarIcon } from 'lucide-react'
import { CreatableCombobox } from '@/components/ui/creatable-combobox'

interface ActivityFormProps {
    clients: Client[]
    products: Product[]
    clientProducts: ClientProduct[]
    activity?: ActivityWithRelations | null
    onSuccess?: () => void
}

export function ActivityForm({ clients, products, clientProducts, activity, onSuccess }: ActivityFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false)
    const [isNextDatePopoverOpen, setIsNextDatePopoverOpen] = useState(false)
    const isEditing = !!activity

    const form = useForm<ActivityFormValues>({
        resolver: zodResolver(activitySchema),
        defaultValues: {
            client_name: activity?.clients?.company_name || '',
            product_name: activity?.products?.name || '',
            client_product_name: activity?.client_products?.name || '',
            type: (activity?.type as any) || 'meeting',
            pipeline_status: (activity?.pipeline_status as any) || 'lead',
            title: activity?.title || '',
            content: activity?.content || '',
            activity_date: activity?.activity_date ? new Date(activity.activity_date) : new Date(),
            next_action: activity?.next_action || '',
            next_action_date: activity?.next_action_date ? new Date(activity.next_action_date) : null,
        },
    } as any)

    useEffect(() => {
        if (activity) {
            form.reset({
                client_name: activity.clients?.company_name || '',
                product_name: activity.products?.name || '',
                client_product_name: activity.client_products?.name || '',
                type: (activity.type as any) || 'meeting',
                pipeline_status: (activity.pipeline_status as any) || 'lead',
                title: activity.title || '',
                content: activity.content || '',
                activity_date: activity.activity_date ? new Date(activity.activity_date) : new Date(),
                next_action: activity.next_action || '',
                next_action_date: activity.next_action_date ? new Date(activity.next_action_date) : null,
            })
        } else {
            form.reset({
                client_name: '',
                product_name: '',
                client_product_name: '',
                type: 'meeting',
                pipeline_status: 'lead',
                title: '',
                content: '',
                activity_date: new Date(),
                next_action: '',
                next_action_date: null,
            })
        }
    }, [activity, form])

    async function onSubmit(data: ActivityFormValues) {
        setIsLoading(true)

        let result
        if (isEditing && activity?.id) {
            result = await updateActivity(activity.id, data as any)
        } else {
            result = await addActivity(data)
        }

        if (result.error) {
            toast.error(isEditing ? '수정 실패' : '등록 실패', {
                description: result.error,
            })
        } else {
            toast.success(isEditing ? '수정 완료' : '등록 완료', {
                description: '영업 활동 내역이 저장되었습니다.',
            })

            if (result.newMasterItems && result.newMasterItems.length > 0) {
                toast.info('마스터 데이터 등록', {
                    description: `새로운 ${result.newMasterItems.join(', ')}이 마스터 데이터에 자동 등록되었습니다.`,
                    duration: 5000,
                })
            }

            if (!isEditing) {
                form.reset({
                    client_name: '',
                    product_name: '',
                    client_product_name: '',
                    type: 'meeting',
                    pipeline_status: 'lead',
                    title: '',
                    content: '',
                    activity_date: new Date(),
                    next_action: '',
                    next_action_date: null,
                })
            }
            onSuccess?.()
        }

        setIsLoading(false)
    }

    const clientOptions = clients.map(c => ({ id: c.id, name: c.company_name }))
    const productOptions = products.map(p => ({ id: p.id, name: p.name }))
    const clientProductOptions = clientProducts.map(cp => ({ id: cp.id, name: cp.name }))

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {/* Client Selection - Full Width */}
                    <FormField
                        control={form.control}
                        name="client_name"
                        render={({ field }) => (
                            <FormItem className="flex flex-col md:col-span-2">
                                <FormLabel className="font-bold flex items-center gap-1">
                                    고객사 <span className="text-primary">*</span>
                                </FormLabel>
                                <FormControl>
                                    <CreatableCombobox
                                        options={clientOptions}
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="고객사 선택 또는 직접 입력"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Title - Full Width */}
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem className="md:col-span-2">
                                <FormLabel className="font-bold flex items-center gap-1">
                                    활동 제목 <span className="text-primary">*</span>
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="미팅 핵심 주제 요약"
                                        {...field}
                                        className="h-11 bg-background/50 border-border/50 focus:border-primary/50 text-base"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Product Selection - Half */}
                    <FormField
                        control={form.control}
                        name="product_name"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel className="font-bold">제품명 (마스터)</FormLabel>
                                <FormControl>
                                    <CreatableCombobox
                                        options={productOptions}
                                        value={field.value || ''}
                                        onChange={field.onChange}
                                        placeholder="제품명 선택 또는 입력"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Client Product Selection - Half */}
                    <FormField
                        control={form.control}
                        name="client_product_name"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel className="font-bold">고객사 제품명</FormLabel>
                                <FormControl>
                                    <CreatableCombobox
                                        options={clientProductOptions}
                                        value={field.value || ''}
                                        onChange={field.onChange}
                                        placeholder="고객사 전용 코드/품명"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Activity Type - Half */}
                    <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold">활동 유형</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="h-11 bg-background/50 border-border/50">
                                            <SelectValue placeholder="유형 선택" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-card/95 backdrop-blur-md border-border/50 z-[100]">
                                        <SelectItem value="meeting">📝 오프라인 미팅</SelectItem>
                                        <SelectItem value="call">📞 전화 상담</SelectItem>
                                        <SelectItem value="email">📧 이메일 발송</SelectItem>
                                        <SelectItem value="meal">🍽️ 회식/식사</SelectItem>
                                        <SelectItem value="other">📌 기타</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Pipeline Status - Half */}
                    <FormField
                        control={form.control}
                        name="pipeline_status"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold">파이프라인 단계</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="h-11 bg-background/50 border-border/50">
                                            <SelectValue placeholder="단계 선택" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-card/95 backdrop-blur-md border-border/50 z-[100]">
                                        <SelectItem value="lead">잠재 고객 (Lead)</SelectItem>
                                        <SelectItem value="sample_sent">샘플 발송</SelectItem>
                                        <SelectItem value="quote_submitted">견적 제출</SelectItem>
                                        <SelectItem value="negotiating">단가 네고</SelectItem>
                                        <SelectItem value="confirmed">수주 확정</SelectItem>
                                        <SelectItem value="dropped">드랍 (Dropped)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Activity Date - Half */}
                    <FormField
                        control={form.control}
                        name="activity_date"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel className="font-bold">활동 날짜</FormLabel>
                                <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "h-11 w-full pl-3 text-left font-normal bg-background/50 border-border/50",
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
                                    <PopoverContent className="w-auto p-0 bg-card/95 backdrop-blur-xl border border-border/50 z-[100]" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={(date) => {
                                                field.onChange(date)
                                                setIsDatePopoverOpen(false)
                                            }}
                                            disabled={(date) =>
                                                date > new Date() || date < new Date("1900-01-01")
                                            }
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Next Action Date - Half */}
                    <FormField
                        control={form.control}
                        name="next_action_date"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel className="font-bold">액션 예정일</FormLabel>
                                <Popover open={isNextDatePopoverOpen} onOpenChange={setIsNextDatePopoverOpen}>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "h-11 w-full pl-3 text-left font-normal bg-background/50 border-border/50",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value ? (
                                                    format(field.value, "PPP", { locale: ko })
                                                ) : (
                                                    <span>날짜 선택 (선택 사항)</span>
                                                )}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 z-[110]" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value || undefined}
                                            onSelect={(date) => {
                                                field.onChange(date)
                                                setIsNextDatePopoverOpen(false)
                                            }}
                                            disabled={(date) =>
                                                date < new Date(new Date().setHours(0, 0, 0, 0))
                                            }
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Next Action Content - Full Width */}
                    <FormField
                        control={form.control}
                        name="next_action"
                        render={({ field }) => (
                            <FormItem className="md:col-span-2">
                                <div className="flex items-center gap-2 mb-2">
                                    <FormLabel className="font-bold text-primary flex items-center gap-1">
                                        다음 액션 계획 (Next Action)
                                    </FormLabel>
                                    <div className="h-[1px] flex-1 bg-primary/20" />
                                </div>
                                <FormControl>
                                    <Input
                                        {...field}
                                        value={field.value || ''}
                                        placeholder="예: 샘플 피드백 확인 미팅"
                                        className="h-11 bg-primary/5 border-primary/20 focus:border-primary/50 text-base"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Detailed Content - Full Width */}
                    <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                            <FormItem className="md:col-span-2">
                                <FormLabel className="font-bold">상세 활동 내용</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="회의록 정리, 협의 사항, 향후 계획 등을 자유롭게 기재하세요."
                                        className="resize-none h-40 bg-background/50 border-border/50 focus:border-primary/50 text-base leading-relaxed"
                                        {...field}
                                        value={field.value || ''}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="pt-4 sticky bottom-0 bg-card py-4 md:static md:bg-transparent">
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-14 bg-primary text-lg font-black shadow-[0_0_20px_theme(colors.primary.DEFAULT)/30] hover:shadow-[0_0_25px_theme(colors.primary.DEFAULT)/50] transition-all hover:scale-[1.01] active:scale-[0.99]"
                    >
                        {isLoading ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : isEditing ? '활동 기록 수정 완료' : '새 활동 등록 완료'}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
