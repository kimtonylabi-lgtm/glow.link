'use client'

import { format, isToday, isThisWeek } from 'date-fns'
import { ko } from 'date-fns/locale'
import { ActivityWithRelations } from '@/types/crm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Target, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ToDoWidgetProps {
    activities: ActivityWithRelations[]
    onItemClick?: (activity: ActivityWithRelations) => void
}

export function ToDoWidget({ activities, onItemClick }: ToDoWidgetProps) {
    // Filter activities with next_action_date
    const todoItems = activities.filter(a => a.next_action_date)
        .sort((a, b) => new Date(a.next_action_date!).getTime() - new Date(b.next_action_date!).getTime())

    const todayItems = todoItems.filter(a => isToday(new Date(a.next_action_date!)))

    const now = new Date()
    const thisWeekItems = todoItems.filter(a => {
        const date = new Date(a.next_action_date!)
        return isThisWeek(date, { locale: ko }) && !isToday(date)
    })

    const Section = ({ title, items, color }: { title: string, items: ActivityWithRelations[], color: string }) => (
        <div className="space-y-3">
            <h5 className={cn("text-[10px] font-black uppercase tracking-widest flex items-center gap-2", color)}>
                {title} <span className="opacity-40">({items.length})</span>
            </h5>
            {items.length === 0 ? (
                <div className="text-[11px] text-muted-foreground/50 py-2 pl-2 border-l border-border/10 italic">
                    리스트가 비어있습니다.
                </div>
            ) : (
                <div className="space-y-2">
                    {items.map(item => (
                        <div
                            key={item.id}
                            onClick={() => onItemClick?.(item)}
                            className="group relative flex flex-col gap-1 p-3 rounded-xl bg-card/30 border border-border/20 hover:border-primary/30 hover:bg-card/50 transition-all cursor-pointer overflow-hidden"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-primary/70 truncate max-w-[120px]">
                                    {item.clients?.company_name}
                                </span>
                                <Badge variant="outline" className="text-[9px] h-4 px-1 border-none bg-primary/10 text-primary">
                                    {format(new Date(item.next_action_date!), 'MM.dd(eee)', { locale: ko })}
                                </Badge>
                            </div>
                            <div className="text-[12px] font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                                {item.next_action || '일정 확인'}
                            </div>
                            <div className="absolute right-[-10px] bottom-[-10px] opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                                <Target size={60} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )

    return (
        <Card className="bg-card/40 backdrop-blur-xl border border-border/40 overflow-hidden shadow-2xl ring-1 ring-white/5">
            <CardHeader className="p-5 pb-2">
                <CardTitle className="text-sm font-black flex items-center gap-2 uppercase tracking-tighter text-primary">
                    <Target className="h-4 w-4" /> 🎯 다음 할 일 (To-Do)
                </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-4 space-y-8">
                <Section
                    title="오늘 해야 할 일"
                    items={todayItems}
                    color="text-orange-500"
                />
                <Section
                    title="이번 주 할 일"
                    items={thisWeekItems}
                    color="text-cyan-500"
                />

                <div className="pt-4 border-t border-border/10">
                    <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-between group cursor-help">
                        <div className="text-[10px] font-medium text-muted-foreground leading-tight">
                            기록된 '다음 액션'을 기반으로<br />리마인더를 제공합니다.
                        </div>
                        <CheckCircle2 className="h-5 w-5 text-primary/20 group-hover:text-primary transition-colors" />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
