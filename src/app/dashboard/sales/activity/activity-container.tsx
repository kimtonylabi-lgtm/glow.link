'use client'

import { useState } from 'react'
import { ActivityWithRelations, Client, Product, ClientProduct } from '@/types/crm'
import { ActivityForm } from './activity-form'
import { Timeline } from './timeline'
import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'

interface Props {
    clients: Client[]
    products: Product[]
    clientProducts: ClientProduct[]
    initialActivities: ActivityWithRelations[]
}

export function ActivityContainer({ clients, products, clientProducts, initialActivities }: Props) {
    const [editingActivity, setEditingActivity] = useState<ActivityWithRelations | null>(null)
    const [isFormOpen, setIsFormOpen] = useState(false)

    const handleEdit = (activity: ActivityWithRelations) => {
        setEditingActivity(activity)
        setIsFormOpen(true)
    }

    const handleFormSuccess = () => {
        setEditingActivity(null)
        setIsFormOpen(false)
    }

    const handleOpenChange = (open: boolean) => {
        setIsFormOpen(open)
        if (!open) setEditingActivity(null)
    }

    return (
        <div className="flex flex-col gap-8">
            <div className="flex justify-between items-center bg-card/40 backdrop-blur-xl border border-border/40 p-6 rounded-2xl shadow-sm">
                <div>
                    <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        영업 활동 기록 (Activity)
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">고객사와의 소통 내역을 타임라인으로 관리하세요.</p>
                </div>

                <Dialog open={isFormOpen} onOpenChange={handleOpenChange}>
                    <DialogTrigger asChild>
                        <Button className="h-12 px-6 font-black rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all gap-2">
                            <PlusCircle className="w-5 h-5" />
                            <span>새 활동 등록</span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card/95 backdrop-blur-2xl border-border/50 p-0 shadow-2xl">
                        <DialogHeader className="p-6 pb-0">
                            <DialogTitle className="text-xl font-black">
                                {editingActivity ? '활동 내역 수정' : '새로운 영업 활동 기록'}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="p-6">
                            <ActivityForm
                                clients={clients}
                                products={products}
                                clientProducts={clientProducts}
                                activity={editingActivity}
                                onSuccess={handleFormSuccess}
                            />
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="w-full">
                <Timeline
                    clients={clients}
                    activities={initialActivities}
                    onEdit={handleEdit}
                />
            </div>
        </div>
    )
}
