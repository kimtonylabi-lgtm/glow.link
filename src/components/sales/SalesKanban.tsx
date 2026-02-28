'use client'

import { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { ActivityWithRelations, PipelineStatus } from '@/types/crm'
import { updateActivityStatus } from '@/app/dashboard/sales/activity/actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Users, Phone, Mail, Coffee, Clipboard, GripVertical, Calendar, User } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

const COLUMNS: { id: PipelineStatus; title: string; color: string }[] = [
    { id: 'lead', title: '잠재 고객 (Lead)', color: 'bg-slate-500/10 border-slate-500/50' },
    { id: 'sample_sent', title: '샘플 발송', color: 'bg-blue-500/10 border-blue-500/50' },
    { id: 'quote_submitted', title: '견적 제출', color: 'bg-purple-500/10 border-purple-500/50' },
    { id: 'negotiating', title: '단가 네고', color: 'bg-orange-500/10 border-orange-500/50' },
    { id: 'confirmed', title: '수주 확정', color: 'bg-emerald-500/10 border-emerald-500/50' },
    { id: 'dropped', title: '드랍 (Dropped)', color: 'bg-red-500/10 border-red-500/50' },
]

const getIcon = (type: string) => {
    switch (type) {
        case 'meeting': return <Users className="h-4 w-4 text-purple-400" />
        case 'call': return <Phone className="h-4 w-4 text-cyan-400" />
        case 'email': return <Mail className="h-4 w-4 text-blue-400" />
        case 'meal': return <Coffee className="h-4 w-4 text-orange-400" />
        default: return <Clipboard className="h-4 w-4 text-slate-400" />
    }
}

interface SalesKanbanProps {
    initialActivities: ActivityWithRelations[]
}

export function SalesKanban({ initialActivities }: SalesKanbanProps) {
    const [activities, setActivities] = useState<ActivityWithRelations[]>(initialActivities)

    useEffect(() => {
        setActivities(initialActivities)
    }, [initialActivities])

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result

        if (!destination) return
        if (destination.droppableId === source.droppableId && destination.index === source.index) return

        const newStatus = destination.droppableId as PipelineStatus

        // Optimistic Update
        const updatedActivities = activities.map(item =>
            item.id === draggableId ? { ...item, pipeline_status: newStatus } : item
        )
        setActivities(updatedActivities)

        // Backend Update
        const res = await updateActivityStatus(draggableId, newStatus)
        if (res.error) {
            toast.error('상태 업데이트 실패', { description: res.error })
            setActivities(initialActivities) // Revert on error
        } else {
            toast.success('상태가 업데이트되었습니다.')
        }
    }

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-6 overflow-x-auto pb-6 min-h-[70vh] scrollbar-hide">
                {COLUMNS.map((column) => (
                    <div key={column.id} className="flex-shrink-0 w-80 flex flex-col gap-4">
                        <div className={`p-3 rounded-xl border ${column.color} backdrop-blur-md flex items-center justify-between`}>
                            <h3 className="font-bold text-sm tracking-tight">{column.title}</h3>
                            <Badge variant="outline" className="bg-background/50 border-none">
                                {activities.filter(a => a.pipeline_status === column.id).length}
                            </Badge>
                        </div>

                        <Droppable droppableId={column.id}>
                            {(provided) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className="flex-grow flex flex-col gap-3 min-h-[200px]"
                                >
                                    {activities
                                        .filter(a => a.pipeline_status === column.id)
                                        .map((activity, index) => (
                                            <Draggable key={activity.id} draggableId={activity.id} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className={`bg-card/40 backdrop-blur-xl border border-border/40 rounded-2xl p-4 shadow-lg transition-all
                                                            ${snapshot.isDragging ? 'rotate-3 scale-105 border-primary/50 shadow-primary/20' : 'hover:border-primary/30'}
                                                        `}
                                                    >
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div className="text-[10px] font-bold text-primary tracking-widest uppercase">
                                                                {activity.clients?.company_name || 'UNKNOWN'}
                                                            </div>
                                                            <GripVertical className="h-4 w-4 text-muted-foreground/30" />
                                                        </div>
                                                        <h4 className="text-sm font-semibold mb-3 line-clamp-2">
                                                            {activity.title}
                                                        </h4>

                                                        <div className="flex flex-wrap gap-2 mb-3">
                                                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/5 text-[10px] text-primary/80 border border-primary/10">
                                                                {getIcon(activity.type)}
                                                                {activity.type}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-between text-[10px] text-muted-foreground/60 mt-4 pt-3 border-t border-border/20">
                                                            <div className="flex items-center gap-1">
                                                                <Calendar className="h-3 w-3" />
                                                                {format(new Date(activity.activity_date), 'MM.dd', { locale: ko })}
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <User className="h-3 w-3" />
                                                                {activity.profiles?.full_name || 'N/A'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </div>
                ))}
            </div>
        </DragDropContext>
    )
}
