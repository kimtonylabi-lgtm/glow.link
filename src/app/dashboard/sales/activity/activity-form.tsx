'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { activitySchema, type ActivityFormValues } from '@/lib/validations/activity'
import { addActivity, updateActivity } from './actions'
import { Client } from '@/types/crm'
import { ActivityWithRelations } from '@/types/crm'
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
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import { Loader2, CalendarIcon, Check, ChevronsUpDown } from 'lucide-react'

interface ActivityFormProps {
    clients: Client[]
    activity?: ActivityWithRelations | null
    onSuccess?: () => void
}

export function ActivityForm({ clients, activity, onSuccess }: ActivityFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [isClientPopoverOpen, setIsClientPopoverOpen] = useState(false)
    const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false)
    const isEditing = !!activity

    const form = useForm({
        resolver: zodResolver(activitySchema),
        defaultValues: {
            client_id: activity?.client_id || '',
            type: activity?.type || 'meeting',
            pipeline_status: activity?.pipeline_status || 'lead',
            title: activity?.title || '',
            content: activity?.content || '',
            activity_date: activity?.activity_date ? new Date(activity.activity_date) : new Date(),
        },
    })

    // Update form values when editing activity changes (Fix for bug #2)
    useEffect(() => {
        if (activity) {
            form.reset({
                client_id: activity.client_id || '',
                type: activity.type || 'meeting',
                pipeline_status: activity.pipeline_status || 'lead',
                title: activity.title || '',
                content: activity.content || '',
                activity_date: activity.activity_date ? new Date(activity.activity_date) : new Date(),
            })
        } else {
            form.reset({
                client_id: '',
                type: 'meeting',
                pipeline_status: 'lead',
                title: '',
                content: '',
                activity_date: new Date(),
            })
        }
    }, [activity, form])

    async function onSubmit(data: any /* ActivityFormValues inferred */) {
        setIsLoading(true)

        let result
        if (isEditing && activity.id) {
            result = await updateActivity(activity.id, data)
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
            if (!isEditing) {
                form.reset({
                    client_id: '',
                    type: 'meeting',
                    title: '',
                    content: '',
                    activity_date: new Date(),
                })
            }
            onSuccess?.()
        }

        setIsLoading(false)
    }

    return (
        <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-6 text-foreground">
                {isEditing ? '활동 내역 수정' : '새 활동 기록'}
            </h3>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    {/* Client Selection (Combobox) */}
                    <FormField
                        control={form.control}
                        name="client_id"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>고객사</FormLabel>
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
                                                    : "고객사 검색 및 선택"}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-card/95 backdrop-blur-md border border-border/50">
                                        <Command>
                                            <CommandInput placeholder="고객사 이름 검색..." />
                                            <CommandList>
                                                <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
                                                <CommandGroup>
                                                    {clients.map((client) => (
                                                        <CommandItem
                                                            value={client.company_name}
                                                            key={client.id}
                                                            onSelect={() => {
                                                                form.setValue("client_id", client.id)
                                                                setIsClientPopoverOpen(false) // Auto-close UX improvement (Bug #6)
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    client.id === field.value
                                                                        ? "opacity-100 text-primary"
                                                                        : "opacity-0"
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

                    <div className="flex flex-col gap-4">
                        {/* Activity Type Selection */}
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>활동 유형</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="bg-background/50 border-border/50">
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

                        {/* Pipeline Status Selection */}
                        <FormField
                            control={form.control}
                            name="pipeline_status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>파이프라인 단계</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="bg-background/50 border-border/50">
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

                        {/* Date Picker */}
                        <FormField
                            control={form.control}
                            name="activity_date"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>활동 날짜</FormLabel>
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
                    </div>

                    {/* Title Input */}
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>제목</FormLabel>
                                <FormControl>
                                    <Input placeholder="미팅 핵심 주제 요약" {...field} className="bg-background/50 border-border/50 focus:border-primary/50" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Content Textarea */}
                    <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>상세 내용</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="회의록 정리, 협의 사항, 향후 계획 등을 자유롭게 기재하세요."
                                        className="resize-none h-32 bg-background/50 border-border/50 focus:border-primary/50"
                                        {...field}
                                        value={field.value || ''}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-primary/90 hover:bg-primary shadow-[0_0_15px_theme(colors.primary.DEFAULT)/30] hover:shadow-[0_0_20px_theme(colors.primary.DEFAULT)/60] transition-all"
                    >
                        {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : isEditing ? '활동 기록 수정' : '새 활동 등록'}
                    </Button>
                </form>
            </Form>
        </div>
    )
}
