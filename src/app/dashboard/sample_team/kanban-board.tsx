'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { SampleRequestWithRelations, SampleStatus } from '@/types/crm'
import { updateSampleStatus } from '../sales/sample/actions'
import { uploadSampleImageAndUpdateStatus } from './actions'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Loader2, Package, UploadCloud, Truck, Play, Clock, ArrowRight } from 'lucide-react'

interface KanbanBoardProps {
    samples: SampleRequestWithRelations[]
}

const KANBAN_COLUMNS: { id: SampleStatus, label: string, icon: any, color: string, glow: string }[] = [
    {
        id: 'pending',
        label: '대기중',
        icon: Clock,
        color: 'text-yellow-400',
        glow: 'shadow-[0_0_15px_rgba(234,179,8,0.3)] border-yellow-500/50'
    },
    {
        id: 'processing',
        label: '제작중',
        icon: Play,
        color: 'text-blue-400',
        glow: 'shadow-[0_0_15px_rgba(59,130,246,0.3)] border-blue-500/50'
    },
    {
        id: 'shipped',
        label: '발송완료',
        icon: Truck,
        color: 'text-green-400',
        glow: 'shadow-[0_0_15px_rgba(34,197,94,0.3)] border-green-500/50'
    },
]

export function KanbanBoard({ samples }: KanbanBoardProps) {
    const [isUpdating, setIsUpdating] = useState(false)
    const [uploadModalOpen, setUploadModalOpen] = useState(false)
    const [selectedSample, setSelectedSample] = useState<SampleRequestWithRelations | null>(null)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)

    const handleStatusChange = async (sample: SampleRequestWithRelations, newStatus: SampleStatus) => {
        // If transitioning to shipped, open the upload modal instead of direct DB update
        if (newStatus === 'shipped') {
            setSelectedSample(sample)
            setUploadModalOpen(true)
            return
        }

        // Normal direct status updates
        setIsUpdating(true)
        const result = await updateSampleStatus(sample.id, newStatus)

        if (result.error) {
            toast.error('상태 변경 실패', { description: result.error })
        } else {
            toast.success('상태 변경 완료', { description: '샘플 진행 상태가 업데이트 되었습니다.' })
        }
        setIsUpdating(false)
    }

    const handleFileUploadAndShip = async () => {
        if (!selectedSample || !selectedFile) return

        setIsUpdating(true)
        const formData = new FormData()
        formData.append('file', selectedFile)

        const result = await uploadSampleImageAndUpdateStatus(selectedSample.id, formData)

        if (result.error) {
            toast.error('발송 처리 실패', { description: result.error })
        } else {
            toast.success('발송 처리 완료', { description: '사진이 업로드되고 발송 완료 처리되었습니다.' })
            setUploadModalOpen(false)
            setSelectedFile(null)
            setSelectedSample(null)
        }
        setIsUpdating(false)
    }

    return (
        <>
            <div className="flex-1 w-full overflow-x-auto pb-6">
                <div className="flex gap-6 min-w-max h-full">
                    {KANBAN_COLUMNS.map((column) => {
                        const ColumnIcon = column.icon
                        // Filter and sort FIFO (oldest first according to user request)
                        const columnSamples = samples
                            .filter(s => s.status === column.id)
                            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

                        return (
                            <div
                                key={column.id}
                                className={`w-[320px] md:w-[350px] flex-shrink-0 flex flex-col bg-card/20 backdrop-blur-md border rounded-2xl overflow-hidden p-4 ${column.glow} transition-all`}
                            >
                                {/* Column Header */}
                                <div className="flex justify-between items-center mb-4 pb-4 border-b border-border/40">
                                    <h3 className={`text-lg font-bold flex items-center gap-2 ${column.color}`}>
                                        <ColumnIcon className="h-5 w-5" /> {column.label}
                                    </h3>
                                    <span className="bg-background/80 text-muted-foreground text-xs font-semibold px-2.5 py-1 rounded-full border border-border/50">
                                        {columnSamples.length}건
                                    </span>
                                </div>

                                {/* Cards Container */}
                                <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                                    {columnSamples.length === 0 ? (
                                        <div className="h-24 flex items-center justify-center text-muted-foreground/50 text-sm border border-dashed border-border/40 rounded-xl">
                                            해당하는 요청이 없습니다.
                                        </div>
                                    ) : (
                                        columnSamples.map((sample) => (
                                            <div
                                                key={sample.id}
                                                className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow group"
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-background/50 px-2 py-1 rounded-md">
                                                        {sample.clients?.company_name || '알 수 없음'}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {format(new Date(sample.request_date), 'MM/dd')}
                                                    </div>
                                                </div>

                                                <h4 className="text-foreground font-medium text-base mb-1 line-clamp-2" title={sample.product_name}>
                                                    {sample.product_name}
                                                </h4>

                                                <div className="flex items-center text-sm text-foreground mb-4">
                                                    <span className="text-muted-foreground mr-1">수량:</span> {sample.quantity}개
                                                </div>

                                                {sample.shipping_address && (
                                                    <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded max-h-16 overflow-y-auto mb-4">
                                                        배송지: {sample.shipping_address}
                                                    </div>
                                                )}

                                                <div className="flex justify-between items-center mt-2 border-t border-border/30 pt-3">
                                                    <div className="text-xs text-muted-foreground">
                                                        요청자: {sample.profiles?.full_name || '알 수 없음'}
                                                    </div>

                                                    {/* Next Stage Button */}
                                                    {column.id === 'pending' && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 border-blue-500/30"
                                                            onClick={() => handleStatusChange(sample, 'processing')}
                                                            disabled={isUpdating}
                                                        >
                                                            진행하기 <ArrowRight className="ml-1 h-3 w-3" />
                                                        </Button>
                                                    )}
                                                    {column.id === 'processing' && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 text-green-400 hover:text-green-300 hover:bg-green-500/10 border-green-500/30"
                                                            onClick={() => handleStatusChange(sample, 'shipped')}
                                                            disabled={isUpdating}
                                                        >
                                                            발송처리 <Truck className="ml-1 h-3 w-3" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Image Upload Modal for 'Shipped' status */}
            <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
                <DialogContent className="sm:max-w-[425px] bg-card/95 backdrop-blur-3xl border-border/50 shadow-[0_0_30px_theme(colors.green.500)/20]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-green-400">
                            <UploadCloud className="h-5 w-5" /> 발송 완료 처리
                        </DialogTitle>
                        <DialogDescription>
                            영업팀이 확인할 수 있도록 포장 또는 제품의 완성 사진을 업로드해주세요.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="bg-muted/30 p-3 rounded-md text-sm mb-2">
                            <span className="font-semibold text-foreground">{selectedSample?.clients?.company_name}</span> - {selectedSample?.product_name}
                        </div>

                        <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                            className="bg-background/50 border-border/50 cursor-pointer file:cursor-pointer file:bg-primary/20 file:text-primary file:border-0 file:rounded file:px-2 file:py-1 file:mr-3 hover:file:bg-primary/30"
                        />
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setUploadModalOpen(false)} disabled={isUpdating}>
                            취소
                        </Button>
                        <Button
                            onClick={handleFileUploadAndShip}
                            disabled={!selectedFile || isUpdating}
                            className="bg-green-600 hover:bg-green-500 text-white shadow-[0_0_15px_theme(colors.green.500)/40]"
                        >
                            {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : '업로드 및 발송 완료'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
