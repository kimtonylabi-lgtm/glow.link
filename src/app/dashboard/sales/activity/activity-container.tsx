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

export function ActivityContainer({
    initialActivities,
    clients,
    products,
    clientProducts
}: ActivityContainerProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedActivity, setSelectedActivity] = useState<ActivityWithRelations | null>(null)
    const [followUpActivity, setFollowUpActivity] = useState<ActivityWithRelations | null>(null)

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

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex justify-between items-center bg-card/30 backdrop-blur-md p-6 rounded-3xl border border-border/40 shadow-xl">
                <div>
                    <h2 className="text-3xl font-black tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
                        영업 활동 관리
                    </h2>
                    <p className="text-muted-foreground font-medium mt-1">고객사와의 모든 접점을 기록하고 다음 액션을 계획하세요.</p>
                </div>

                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogTrigger asChild>
                        <Button
                            onClick={handleAddNew}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground h-12 px-6 rounded-2xl font-black shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
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

            <div className="flex flex-col xl:flex-row gap-8">
                <div className="flex-1">
                    <Timeline
                        activities={initialActivities}
                        clients={clients}
                        onEdit={handleEdit}
                        onFollowUp={handleFollowUp}
                    />
                </div>

                <div className="xl:w-80 space-y-6">
                    <ToDoWidget
                        activities={initialActivities}
                        onItemClick={handleFollowUp}
                    />
                    {/* The Calendar Filter is now inside Timeline by default, but we could move it or keep it there. 
                        The user asked to add To-Do widget above/below calendar. 
                        In current timeline.tsx, the calendar is on the right side in a flex-row.
                    */}
                </div>
            </div>
        </div>
    )
}
