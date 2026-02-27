'use client'

import { useState, useEffect, useTransition } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Check, ChevronsUpDown, Search, Briefcase, ShoppingCart, FlaskConical, History as HistoryIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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
import { getClientHistory } from '../actions'
import { Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Client {
    id: string
    company_name: string
}

interface ClientHistoryViewProps {
    clients: Client[]
}

export function ClientHistoryView({ clients }: ClientHistoryViewProps) {
    const [open, setOpen] = useState(false)
    const [selectedClientId, setSelectedClientId] = useState<string>("")
    const [history, setHistory] = useState<any>(null)
    const [isPending, startTransition] = useTransition()

    const selectedClient = clients.find((c) => c.id === selectedClientId)

    useEffect(() => {
        if (selectedClientId) {
            startTransition(async () => {
                const res = await getClientHistory(selectedClientId)
                setHistory(res)
            })
        }
    }, [selectedClientId])

    // Combine all history into a single sorted timeline
    const timeline = history ? [
        ...history.activities.map((a: any) => ({ ...a, eventType: 'activity', date: a.activity_date })),
        ...history.orders.map((o: any) => ({ ...o, eventType: 'order', date: o.order_date })),
        ...history.samples.map((s: any) => ({ ...s, eventType: 'sample', date: s.request_date }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : []

    const eventIcons: Record<string, any> = {
        activity: { icon: Briefcase, color: "text-blue-600", bgColor: "bg-blue-50", label: "영업활동" },
        order: { icon: ShoppingCart, color: "text-emerald-600", bgColor: "bg-emerald-50", label: "수주" },
        sample: { icon: FlaskConical, color: "text-purple-600", bgColor: "bg-purple-50", label: "샘플요청" }
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col items-center gap-4 bg-muted/30 p-8 rounded-2xl border border-border/40 print:hidden">
                <p className="text-sm font-medium text-muted-foreground">보고서를 생성할 고객사를 선택하세요</p>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="w-[300px] justify-between h-12 text-lg shadow-xl"
                        >
                            {selectedClientId
                                ? selectedClient?.company_name
                                : "고객사 검색 및 선택..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                        <Command>
                            <CommandInput placeholder="업체명 검색..." />
                            <CommandList>
                                <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
                                <CommandGroup>
                                    {clients.map((client) => (
                                        <CommandItem
                                            key={client.id}
                                            value={client.company_name}
                                            onSelect={() => {
                                                setSelectedClientId(client.id)
                                                setOpen(false)
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    selectedClientId === client.id ? "opacity-100" : "opacity-0"
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
            </div>

            {isPending && (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" />
                </div>
            )}

            {!isPending && selectedClient && history && (
                <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="border-l-4 border-slate-950 pl-6 py-2">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">{selectedClient.company_name} 히스토리 보고서</h2>
                        <p className="text-slate-500 font-medium">누적 영업 데이터 및 진행 이력 리포트</p>
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                        <div className="border border-slate-100 p-6 rounded-xl bg-slate-50/50">
                            <p className="text-xs font-bold text-slate-500 uppercase mb-1">총 수주</p>
                            <p className="text-2xl font-black">{history.orders.length}건</p>
                        </div>
                        <div className="border border-slate-100 p-6 rounded-xl bg-slate-50/50">
                            <p className="text-xs font-bold text-slate-500 uppercase mb-1">총 제안/활동</p>
                            <p className="text-2xl font-black">{history.activities.length}건</p>
                        </div>
                        <div className="border border-slate-100 p-6 rounded-xl bg-slate-50/50">
                            <p className="text-xs font-bold text-slate-500 uppercase mb-1">총 샘플 발송</p>
                            <p className="text-2xl font-black">{history.samples.length}건</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <HistoryIcon className="w-4 h-4" />
                            Timeline History
                        </h3>

                        <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-slate-200 before:via-slate-200 before:to-transparent">
                            {timeline.length === 0 ? (
                                <p className="text-center py-10 text-slate-400 text-sm italic">기록된 히스토리가 없습니다.</p>
                            ) : (
                                timeline.map((item, idx) => {
                                    const config = eventIcons[item.eventType]
                                    const Icon = config.icon
                                    return (
                                        <div key={idx} className="relative flex items-start gap-6 pl-12 break-inside-avoid">
                                            <div className={cn(
                                                "absolute left-0 w-10 h-10 rounded-full border-4 border-white flex items-center justify-center shadow-sm z-10",
                                                config.bgColor
                                            )}>
                                                <Icon className={cn("w-4 h-4", config.color)} />
                                            </div>

                                            <div className="flex-1 bg-white border border-slate-100 p-6 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <Badge variant="outline" className={cn("text-[10px] font-bold border-none mb-1", config.bgColor, config.color)}>
                                                            {config.label}
                                                        </Badge>
                                                        <h4 className="font-bold text-slate-900 leading-tight">
                                                            {item.eventType === 'order' ? '수주 발생' : item.title || item.product_name}
                                                        </h4>
                                                    </div>
                                                    <span className="text-[11px] font-bold text-slate-400 uppercase">
                                                        {format(new Date(item.date), 'yyyy. MM. dd', { locale: ko })}
                                                    </span>
                                                </div>

                                                {item.eventType === 'order' && (
                                                    <p className="text-xl font-black text-emerald-600 tracking-tight">
                                                        ₩ {item.total_amount.toLocaleString()}
                                                    </p>
                                                )}

                                                {item.content && (
                                                    <p className="text-sm text-slate-500 mt-2 line-clamp-2">
                                                        {item.content}
                                                    </p>
                                                )}

                                                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                                                    <span className="text-[10px] text-slate-400 font-medium">관리자: {item.profiles?.full_name || '시스템'}</span>
                                                    {item.status && (
                                                        <span className="text-[10px] font-bold text-slate-500 px-2 py-0.5 bg-slate-100 rounded">
                                                            상태: {item.status}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
