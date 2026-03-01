'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { ActivityWithRelations, Client } from '@/types/crm'
import { deleteActivity } from './actions'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Users, Phone, Mail, Coffee, Clipboard, MoreVertical, Pencil, Trash2, ArrowRight, Calendar as CalendarIcon, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
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

const getBadgeStyles = (type: string) => {
    switch (type) {
        case 'meeting':
            return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
        case 'call':
            return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
        case 'email':
            return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
        case 'meal':
            return 'bg-orange-500/10 text-orange-400 border-orange-500/20'
        default:
            return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
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

const getTypeText = (type: string) => {
    switch (type) {
        case 'meeting': return '미팅'
        case 'call': return '전화'
        case 'email': return '이메일'
        case 'meal': return '식사'
        default: return '기타'
    }
}

export function Timeline({ activities, clients, onEdit }: TimelineProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const selectedClientId = searchParams.get('client') || 'all'
    const selectedDateStr = searchParams.get('date')
    const selectedDate = selectedDateStr ? new Date(selectedDateStr) : null

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

    const handleDateSelect = (date: Date | undefined) => {
        const params = new URLSearchParams(searchParams)
        if (date) {
            params.set('date', format(date, 'yyyy-MM-dd'))
        } else {
            params.delete('date')
        }
        router.push(`?${params.toString()}`)
    }

    const resetFilters = () => {
        router.push(window.location.pathname)
    }

    const filteredActivities = activities.filter(a => {
        if (selectedDate) {
            return format(new Date(a.activity_date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
        }
        return true
    })

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
        <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 flex flex-col">
                {/* Header & Filter */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <h3 className="text-xl font-black flex items-center gap-2">
                        활동 타임라인 <ArrowRight className="h-5 w-5 text-primary" /> 피드
                        {(selectedClientId !== 'all' || selectedDate) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={resetFilters}
                                className="ml-2 text-xs text-primary font-bold hover:bg-primary/10 gap-1 animate-in fade-in slide-in-from-left-2"
                            >
                                <RefreshCw className="h-3 w-3" /> 필터 초기화
                            </Button>
                        )}
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
                    {filteredActivities.length === 0 ? (
                        <div className="pl-8 text-muted-foreground text-sm py-10">
                            {selectedDate
                                ? `${format(selectedDate, 'PPP', { locale: ko })}에 등록된 활동이 없습니다.`
                                : '등록된 활동 내역이 없습니다.'}
                        </div>
                    ) : (
                        filteredActivities.map((activity) => (
                            <div key={activity.id} className="relative pl-8 md:pl-10 group transition-all">
                                {/* Timeline Dot/Icon */}
                                <div className={cn("absolute -left-[18px] top-1 p-2 rounded-full bg-background border z-10 transition-transform group-hover:scale-110", getGlow(activity.type))}>
                                    {getIcon(activity.type)}
                                </div>

                                {/* Card */}
                                <div className="bg-card/30 backdrop-blur-md border border-border/40 rounded-xl p-4 md:p-5 hover:bg-card/50 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="text-xs text-primary/80 font-semibold mb-1 tracking-wider uppercase">
                                                {activity.clients?.company_name || '알 수 없음'}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-base font-bold text-foreground leading-tight">
                                                    {activity.title}
                                                </h4>
                                                <Badge variant="outline" className={cn("text-[10px] py-0 px-1.5 h-5 font-bold", getBadgeStyles(activity.type))}>
                                                    {getTypeText(activity.type)}
                                                </Badge>
                                            </div>
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

                                    <div className="flex flex-wrap items-center text-xs text-muted-foreground/70 gap-y-2 gap-x-4 mt-4 pt-4 border-t border-border/20">
                                        <div className="flex items-center gap-1.5">
                                            <CalendarIcon className="h-3.5 w-3.5" />
                                            {format(new Date(activity.activity_date), 'PPP', { locale: ko })}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Users className="h-3.5 w-3.5" />
                                            {activity.profiles?.full_name || '알 수 없는 담당자'}
                                        </div>
                                        {(activity.next_action || activity.next_action_date) && (
                                            <div className="flex items-center gap-2 ml-auto p-2 px-3 rounded-lg bg-primary/5 border border-primary/10 text-primary group/next">
                                                <span className="font-black text-[10px] uppercase tracking-tighter mr-1 opacity-70">Next:</span>
                                                <span className="font-bold">{activity.next_action || '일정 확인'}</span>
                                                {activity.next_action_date && (
                                                    <span className="text-[10px] bg-primary/10 px-1.5 rounded ml-1">
                                                        {format(new Date(activity.next_action_date), 'MM.dd(eee)', { locale: ko })}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Sidebar Calendar Filter */}
            <div className="lg:w-80 flex flex-col gap-6">
                <Card className="bg-card/40 backdrop-blur-xl border border-border/40 overflow-hidden shadow-2xl ring-1 ring-white/5">
                    <CardHeader className="p-4 pb-0">
                        <CardTitle className="text-sm font-black flex items-center gap-2 uppercase tracking-tighter text-primary/80">
                            <CalendarIcon className="h-4 w-4" /> 날짜별 필터
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-2">
                        <Calendar
                            mode="single"
                            selected={selectedDate || undefined}
                            onSelect={handleDateSelect}
                            className="rounded-md border-none"
                            locale={ko}
                        />
                    </CardContent>
                </Card>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-purple-500/5 to-transparent border border-primary/20">
                    <h4 className="text-xs font-black uppercase text-primary/70 mb-3 tracking-widest flex items-center gap-2">
                        <RefreshCw className="h-3 w-3" /> Quick Insight
                    </h4>
                    <p className="text-xs leading-relaxed font-medium">
                        타임라인에서 고객과의 상세 소통 이력을 관리하세요. 날짜 필터를 통해 특정 시점의 업무를 빠르게 조회할 수 있습니다.
                    </p>
                </div>
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
