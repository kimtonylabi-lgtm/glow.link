'use client'

import { useState } from 'react'
import { ActivityWithRelations, Client, Product, ClientProduct } from '@/types/crm'
import { ActivityForm } from './activity-form'
import { Timeline } from './timeline'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SalesKanban } from '@/components/sales/SalesKanban'
import { LayoutDashboard, ListTodo } from 'lucide-react'

interface Props {
    clients: Client[]
    products: Product[]
    clientProducts: ClientProduct[]
    initialActivities: ActivityWithRelations[]
}

export function ActivityContainer({ clients, products, clientProducts, initialActivities }: Props) {
    const [editingActivity, setEditingActivity] = useState<ActivityWithRelations | null>(null)

    const handleEdit = (activity: ActivityWithRelations) => {
        setEditingActivity(activity)
        // Scroll to top for mobile UX when editing
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleFormSuccess = () => {
        setEditingActivity(null)
    }

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Left Column: Form */}
                <div className="lg:col-span-4 xl:col-span-3 lg:w-1/4 xl:w-1/5">
                    <div className="sticky top-6">
                        <ActivityForm
                            clients={clients}
                            products={products}
                            clientProducts={clientProducts}
                            activity={editingActivity}
                            onSuccess={handleFormSuccess}
                        />
                    </div>
                </div>

                {/* Right Column: Dynamic View */}
                <div className="lg:col-span-8 xl:col-span-9 lg:w-3/4 xl:w-4/5">
                    <Tabs defaultValue="timeline" className="w-full">
                        <div className="flex justify-start mb-6">
                            <TabsList className="bg-card/40 backdrop-blur-md border border-border/40 p-1">
                                <TabsTrigger value="timeline" className="flex items-center gap-2 px-6">
                                    <ListTodo className="h-4 w-4" /> 타임라인
                                </TabsTrigger>
                                <TabsTrigger value="kanban" className="flex items-center gap-2 px-6">
                                    <LayoutDashboard className="h-4 w-4" /> 파이프라인 칸반
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="timeline" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                            <Timeline
                                clients={clients}
                                activities={initialActivities}
                                onEdit={handleEdit}
                            />
                        </TabsContent>

                        <TabsContent value="kanban" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                            <SalesKanban initialActivities={initialActivities} />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}
