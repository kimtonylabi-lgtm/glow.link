'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { clientSchema, type ClientFormValues } from '@/lib/validations/client'
import { addClient, updateClient, getSalesReps } from './actions'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Loader2 } from 'lucide-react'
import { Client } from '@/types/crm'

interface ClientFormProps {
    client?: Client | null
    onSuccess?: () => void
}

export function ClientForm({ client, onSuccess }: ClientFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [salesReps, setSalesReps] = useState<any[]>([])
    const isEditing = !!client

    const form = useForm({
        resolver: zodResolver(clientSchema),
        defaultValues: {
            company_name: client?.company_name || '',
            business_number: client?.business_number || '',
            contact_person: client?.contact_person || '',
            email: client?.email || '',
            phone: client?.phone || '',
            address: client?.address || '',
            memo: client?.memo || '',
            tier: client?.tier || 'C',
            status: client?.status || 'active',
            sales_person_id: client?.sales_person_id || '',
        },
    })

    useEffect(() => {
        async function fetchReps() {
            const res = await getSalesReps()
            if (res.success) setSalesReps(res.data)
        }
        fetchReps()
    }, [])

    async function onSubmit(data: ClientFormValues) {
        setIsLoading(true)

        let result
        if (isEditing && client.id) {
            result = await updateClient(client.id, data)
        } else {
            result = await addClient(data)
        }

        if (result.error) {
            toast.error(isEditing ? '수정 실패' : '등록 실패', {
                description: result.error,
            })
        } else {
            toast.success(isEditing ? '수정 완료' : '등록 완료', {
                description: '고객 정보가 저장되었습니다.',
            })
            form.reset()
            onSuccess?.()
        }

        setIsLoading(false)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4 pb-10 sm:pb-0 overflow-x-hidden">

                <FormField
                    control={form.control}
                    name="company_name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-black text-muted-foreground uppercase tracking-wider">고객사</FormLabel>
                            <FormControl>
                                <Input placeholder="정확한 사명을 입력하세요" {...field} className="bg-muted/30 border-border/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 rounded-xl h-11" />
                            </FormControl>
                            <FormMessage className="text-[10px] font-bold" />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="contact_person"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>담당자명</FormLabel>
                                <FormControl>
                                    <Input placeholder="홍길동" {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="business_number"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>사업자번호</FormLabel>
                                <FormControl>
                                    <Input placeholder="123-45-67890" {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>이메일</FormLabel>
                                <FormControl>
                                    <Input placeholder="email@example.com" {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>연락처</FormLabel>
                                <FormControl>
                                    <Input placeholder="010-0000-0000" {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>고객사 주소</FormLabel>
                            <FormControl>
                                <Input placeholder="서울특별시 강남구..." {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="tier"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>등급</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="등급 선택" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-card backdrop-blur-md">
                                        <SelectItem value="S">S등급 (핵심)</SelectItem>
                                        <SelectItem value="A">A등급 (우수)</SelectItem>
                                        <SelectItem value="B">B등급 (일반)</SelectItem>
                                        <SelectItem value="C">C등급 (잠재)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>상태</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="상태 선택" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-card backdrop-blur-md">
                                        <SelectItem value="active">거래중 (Active)</SelectItem>
                                        <SelectItem value="inactive">휴면 (Inactive)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="sales_person_id"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>내부 전담 매니저 (Sales Rep)</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="사원 선택" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-card backdrop-blur-md">
                                    {salesReps.map((rep) => (
                                        <SelectItem key={rep.id} value={rep.id}>
                                            {rep.full_name} ({rep.role})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="memo"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>비고 (메모)</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="특이사항이나 영업 이력을 입력하세요."
                                    className="resize-none h-24 focus:border-primary/50 focus:ring-primary/30"
                                    {...field}
                                    value={field.value || ''}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="pt-4 flex justify-end">
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full relative group overflow-hidden bg-primary/90 hover:bg-primary hover:shadow-[0_0_15px_theme(colors.primary.DEFAULT)/50] transition-all"
                    >
                        {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : isEditing ? '정보 수정' : '고객 등록'}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
