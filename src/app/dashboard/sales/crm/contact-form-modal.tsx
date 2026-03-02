'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { addCustomerContact } from './actions'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2, Users } from 'lucide-react'

// is_primary removed - always registers as regular contact (false)
const contactSchema = z.object({
    name: z.string().min(1, '이름은 필수입니다.'),
    position: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email('올바른 이메일 형식이 아닙니다.').optional().or(z.literal('')),
})

type ContactFormValues = z.infer<typeof contactSchema>

interface ContactFormModalProps {
    clientId: string
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function ContactFormModal({ clientId, isOpen, onOpenChange, onSuccess }: ContactFormModalProps) {
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm({
        resolver: zodResolver(contactSchema),
        defaultValues: {
            name: '',
            position: '',
            phone: '',
            email: '',
        },
    })

    async function onSubmit(data: ContactFormValues) {
        setIsLoading(true)
        // Always insert as is_primary: false — user sets primary from the contacts tab
        const result = await addCustomerContact(clientId, { ...data, is_primary: false })

        if (result.success) {
            toast.success('담당자 추가 완료', { description: `${data.name}님이 담당자로 등록되었습니다.` })
            form.reset()
            onSuccess()
            onOpenChange(false)
        } else {
            toast.error('추가 실패', { description: result.error })
        }
        setIsLoading(false)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px] bg-card/95 backdrop-blur-3xl border-border/40 rounded-3xl p-8 shadow-2xl">
                <DialogHeader className="mb-4">
                    <DialogTitle className="text-xl font-black flex items-center gap-2 text-primary">
                        <Users className="h-5 w-5" /> 담당자 추가
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pb-12 sm:pb-0">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider">이름 (필수)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="담당자 성함을 입력하세요" {...field} className="h-11 bg-muted/30 border-border/50 rounded-xl" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="position"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider">부서 / 직급</FormLabel>
                                    <FormControl>
                                        <Input placeholder="예: 구매팀 과장" {...field} className="h-11 bg-muted/30 border-border/50 rounded-xl" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider">연락처</FormLabel>
                                        <FormControl>
                                            <Input placeholder="010-0000-0000" {...field} className="h-11 bg-muted/30 border-border/50 rounded-xl" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-wider">이메일</FormLabel>
                                        <FormControl>
                                            <Input placeholder="example@glowlink.com" {...field} className="h-11 bg-muted/30 border-border/50 rounded-xl" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button type="submit" disabled={isLoading} className="w-full h-12 bg-primary text-primary-foreground font-black rounded-xl shadow-lg shadow-primary/20">
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : '담당자 저장 및 추가'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
