'use client'

import { useState } from 'react'
import { ActivityWithRelations, Client, Product, ClientProduct } from '@/types/crm'
import { ActivityForm } from './activity-form'
import { Timeline } from './timeline'
import { ToDoWidget } from './to-do-widget'
import { Button } from '@/components/ui/button'
import { Plus, LayoutGrid, List } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ActivityContainerProps {
    initialActivities: ActivityWithRelations[]
    clients: Client[]
    products: Product[]
    clientProducts: ClientProduct[]
}

import { useRouter, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar as CalendarIcon, RefreshCw } from 'lucide-react'

export function ActivityContainer({
    initialActivities,
    clients,
    products,
    clientProducts
}: ActivityContainerProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedActivity, setSelectedActivity] = useState<ActivityWithRelations | null>(null)
    const [followUpActivity, setFollowUpActivity] = useState<ActivityWithRelations | null>(null)

    const selectedDateStr = searchParams.get('date')
    const selectedDate = selectedDateStr ? new Date(selectedDateStr) : null

    const handleEdit = (activity: ActivityWithRelations) => {
        setSelectedActivity(activity)
        setFollowUpActivity(null)
        setIsModalOpen(true)
    }

    const handleFollowUp = (activity: ActivityWithRelations) => {
        setFollowUpActivity(activity)
        setSelectedActivity(null)
        setIsModalOpen(true)
    }

    const handleAddNew = () => {
        setSelectedActivity(null)
        setFollowUpActivity(null)
        setIsModalOpen(true)
    }

    const handleSuccess = () => {
        setIsModalOpen(false)
        setSelectedActivity(null)
        setFollowUpActivity(null)
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

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:justify-between items-center md:items-start gap-6 bg-card/30 backdrop-blur-md p-6 rounded-3xl border border-border/40 shadow-xl text-center md:text-left">
                <div>
                    <h2 className="text-2xl md:text-3xl font-black tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent break-keep leading-tight">
                        영업 활동 관리
                    </h2>
                    <p className="text-sm md:text-base text-muted-foreground font-medium mt-1 break-keep">고객사와의 모든 접점을 기록하고 다음 액션을 계획하세요.</p>
                </div>

                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogTrigger asChild>
                        <Button
                            onClick={handleAddNew}
                            className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground h-12 px-6 rounded-2xl font-black shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Plus className="h-5 w-5" /> 새 활동 등록
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl bg-card/95 backdrop-blur-2xl border-border/50 shadow-2xl overflow-y-auto max-h-[90vh]">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black">
                                {selectedActivity ? '활동 기록 수정' : followUpActivity ? '팔로우업 활동 등록' : '새 활동 등록'}
                            </DialogTitle>
                            <DialogDescription className="font-medium">
                                {followUpActivity
                                    ? <span className="text-primary font-bold">[{followUpActivity.clients?.company_name}]의 이전 액션: {followUpActivity.next_action}</span>
                                    : '고객과의 미팅, 통화, 이메일 등 모든 영업 활동을 상세히 기록하세요.'
                                }
                            </DialogDescription>
                        </DialogHeader>
                        <ActivityForm
                            clients={clients}
                            products={products}
                            clientProducts={clientProducts}
                            activity={selectedActivity}
                            followUpBase={followUpActivity}
                            onSuccess={handleSuccess}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-10 gap-8 items-start">
                <div className="xl:col-span-7">
                    <Timeline
                        activities={initialActivities}
                        clients={clients}
                        onEdit={handleEdit}
                        onFollowUp={handleFollowUp}
                    />
                </div>

                <div className="xl:col-span-3 space-y-6 sticky top-8">
                    <ToDoWidget
                        activities={initialActivities}
                        onItemClick={handleFollowUp}
                    />

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
                                className="rounded-md border-none w-full"
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
            </div>
        </div>
    )
}
