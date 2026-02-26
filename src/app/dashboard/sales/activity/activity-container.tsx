'use client'

import { useState } from 'react'
import { ActivityWithRelations, Client } from '@/types/crm'
import { ActivityForm } from './activity-form'
import { Timeline } from './timeline'

interface Props {
    clients: Client[]
    initialActivities: ActivityWithRelations[]
}

export function ActivityContainer({ clients, initialActivities }: Props) {
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Form */}
            <div className="lg:col-span-4 xl:col-span-3">
                <div className="sticky top-6">
                    <ActivityForm
                        clients={clients}
                        activity={editingActivity}
                        onSuccess={handleFormSuccess}
                    />
                </div>
            </div>

            {/* Right Column: Timeline Feed */}
            <div className="lg:col-span-8 xl:col-span-9">
                <Timeline
                    clients={clients}
                    activities={initialActivities}
                    onEdit={handleEdit}
                />
            </div>
        </div>
    )
}
