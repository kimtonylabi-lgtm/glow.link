'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { ActivityWithRelations, Client } from '@/types/crm'
import { deleteActivity } from './actions'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users, Phone, Mail, Coffee, Clipboard, MoreVertical, Pencil, Trash2, ArrowRight } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useRouter, useSearchParams } from 'next/navigation'

interface TimelineProps {
    activities: ActivityWithRelations[]
    clients: Client[]
    onEdit: (activity: ActivityWithRelations) => void
}

const getIcon = (type: string) => {
    switch (type) {
        case 'meeting':
            return <Users className="h-5 w-5 text-purple-400" />
        case 'call':
            return <Phone className="h-5 w-5 text-cyan-400" />
        case 'email':
            return <Mail className="h-5 w-5 text-blue-400" />
        case 'meal':
            return <Coffee className="h-5 w-5 text-orange-400" />
        default:
            return <Clipboard className="h-5 w-5 text-slate-400" />
    }
}

const getGlow = (type: string) => {
    switch (type) {
        case 'meeting':
            return 'shadow-[0_0_15px_rgba(168,85,247,0.4)] border-purple-500/50'
        case 'call':
            return 'shadow-[0_0_15px_rgba(6,182,212,0.4)] border-cyan-500/50'
        case 'email':
            return 'shadow-[0_0_15px_rgba(59,130,246,0.4)] border-blue-500/50'
        case 'meal':
            return 'shadow-[0_0_15px_rgba(249,115,22,0.4)] border-orange-500/50'
        default:
            return 'shadow-[0_0_15px_rgba(148,163,184,0.4)] border-slate-500/50'
    }
}

export function Timeline({ activities, clients, onEdit }: TimelineProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const selectedClientId = searchParams.get('client') || 'all'

    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const handleFilterChange = (val: string) => {
        const params = new URLSearchParams(searchParams)
        if (val === 'all') {
            params.delete('client')
        } else {
            params.set('client', val)
        }
        router.push(`?${params.toString()}`)
    }

    const handleDelete = async () => {
        if (!deleteId) return
        setIsDeleting(true)
        const result = await deleteActivity(deleteId)
        if (result.error) {
            toast.error('삭제 실패', { description: result.error })
        } else {
            toast.success('삭제 완료', { description: '활동 내역이 삭제되었습니다.' })
        }
        setIsDeleting(false)
        setDeleteId(null)
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header & Filter */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                    최신 활동 <ArrowRight className="h-5 w-5 text-primary" /> 피드
                </h3>
                <Select value={selectedClientId} onValueChange={handleFilterChange}>
                    <SelectTrigger className="w-[200px] bg-card/60 backdrop-blur-md border-border/50 shadow-[0_0_10px_theme(colors.primary.DEFAULT)/10]">
                        <SelectValue placeholder="모든 고객사" />
                    </SelectTrigger>
                    <SelectContent className="bg-card/95 backdrop-blur-xl border-border/50">
                        <SelectItem value="all">전체 내역 보기</SelectItem>
                        {clients.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Timeline List */}
            <div className="relative border-l-2 border-primary/20 ml-3 md:ml-6 space-y-8 pb-10">
                {activities.length === 0 ? (
                    <div className="pl-8 text-muted-foreground text-sm">
                        등록된 활동 내역이 없습니다. 새로운 활동을 기록해 보세요.
                    </div>
                ) : (
                    activities.map((activity) => (
                        <div key={activity.id} className="relative pl-8 md:pl-10 group transition-all">
                            {/* Timeline Dot/Icon */}
                            <div className={`absolute -left-[18px] top-1 p-2 rounded-full bg-background border ${getGlow(activity.type)} z-10 transition-transform group-hover:scale-110`}>
                                {getIcon(activity.type)}
                            </div>

                            {/* Card */}
                            <div className="bg-card/30 backdrop-blur-md border border-border/40 rounded-xl p-4 md:p-5 hover:bg-card/50 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="text-xs text-primary/80 font-semibold mb-1 tracking-wider uppercase">
                                            {activity.clients?.company_name || '알 수 없음'}
                                        </div>
                                        <h4 className="text-base font-medium text-foreground leading-tight">
                                            {activity.title}
                                        </h4>
                                    </div>

                                    {/* Action Menu */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-card/95 backdrop-blur-xl border-border/50">
                                            <DropdownMenuItem onClick={() => onEdit(activity)} className="cursor-pointer">
                                                <Pencil className="mr-2 h-4 w-4" /> 수정
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setDeleteId(activity.id)} className="cursor-pointer text-red-400 focus:text-red-300">
                                                <Trash2 className="mr-2 h-4 w-4" /> 삭제
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                {activity.content && (
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-2 mb-3">
                                        {activity.content}
                                    </p>
                                )}

                                <div className="flex items-center text-xs text-muted-foreground/70 gap-3 mt-4">
                                    <span>
                                        {format(new Date(activity.activity_date), 'PPP', { locale: ko })}
                                    </span>
                                    <span>•</span>
                                    <span>{activity.profiles?.full_name || '알 수 없는 담당자'}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Delete Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="bg-card/95 backdrop-blur-xl border-border/50 shadow-[0_0_20px_theme(colors.red.500)/20]">
                    <AlertDialogHeader>
                        <AlertDialogTitle>활동 내역 삭제</AlertDialogTitle>
                        <AlertDialogDescription>
                            정말 삭제하시겠습니까? 이 활동 내역은 다시 복구할 수 없습니다.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting} className="bg-background/50 border-border/50">취소</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleDelete();
                            }}
                            disabled={isDeleting}
                            className="bg-red-500/80 hover:bg-red-500 text-white"
                        >
                            삭제
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
