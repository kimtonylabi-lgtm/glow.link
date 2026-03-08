/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog'
import {
    Plus, GripVertical, Trash2, ArrowRight, Trophy, ChevronDown
} from 'lucide-react'
import {
    createOpportunity, updateOpportunityStage, deleteOpportunity,
    type OpportunityStage, type CreateOpportunityInput
} from '@/app/dashboard/sales/planning/opportunity-actions'

// 기존 SalesKanban UI와 동일한 COLUMNS 정의
const COLUMNS: { id: OpportunityStage; title: string; color: string; headerColor: string }[] = [
    { id: 'lead', title: '잠재 고객 (Lead)', color: 'bg-slate-500/10 border-slate-500/50', headerColor: 'text-slate-400' },
    { id: 'sample_sent', title: '샘플 발송', color: 'bg-blue-500/10 border-blue-500/50', headerColor: 'text-blue-400' },
    { id: 'quote_submitted', title: '견적 제출', color: 'bg-purple-500/10 border-purple-500/50', headerColor: 'text-purple-400' },
    { id: 'negotiating', title: '단가 네고', color: 'bg-orange-500/10 border-orange-500/50', headerColor: 'text-orange-400' },
    { id: 'confirmed', title: '수주 확정', color: 'bg-emerald-500/10 border-emerald-500/50', headerColor: 'text-emerald-400' },
    { id: 'dropped', title: '드랍 (Dropped)', color: 'bg-red-500/10 border-red-500/50', headerColor: 'text-red-400' },
]

interface Props {
    opportunities: any[]
    clients: { id: string; company_name: string }[]
}

export function OpportunitiesKanban({ opportunities: initial, clients }: Props) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [items, setItems] = useState<any[]>(initial)
    const [draggingId, setDraggingId] = useState<string | null>(null)
    const [showAddModal, setShowAddModal] = useState(false)
    const [addingStage, setAddingStage] = useState<OpportunityStage>('lead')

    // 예상 매출 합계 (confirmed 제외 모든 활성 건)
    const totalPipelineRevenue = items
        .filter(o => o.stage !== 'dropped')
        .reduce((sum, o) => sum + (Number(o.expected_amount) * (o.probability / 100)), 0)

    // ── 드래그 앤 드롭 ──
    const handleDragStart = (e: React.DragEvent, id: string) => {
        e.dataTransfer.setData('opportunityId', id)
        setDraggingId(id)
    }
    const handleDragEnd = () => setDraggingId(null)

    const handleDrop = (e: React.DragEvent, targetStage: OpportunityStage) => {
        e.preventDefault()
        const id = e.dataTransfer.getData('opportunityId')
        const item = items.find(o => o.id === id)
        if (!item || item.stage === targetStage) return

        // 낙관적 업데이트
        setItems(prev => prev.map(o => o.id === id ? { ...o, stage: targetStage } : o))

        startTransition(async () => {
            const result = await updateOpportunityStage(id, targetStage)
            if (!result.success) {
                toast.error(result.error)
                setItems(prev => prev.map(o => o.id === id ? { ...o, stage: item.stage } : o)) // 롤백
            } else {
                if (targetStage === 'confirmed') toast.success('🎉 수주 확정! 이 건으로 수주를 등록하세요.')
                router.refresh()
            }
        })
    }

    const handleDelete = async (id: string) => {
        if (!confirm('이 수주 기회를 삭제하시겠습니까?')) return
        setItems(prev => prev.filter(o => o.id !== id))
        const result = await deleteOpportunity(id)
        if (!result.success) {
            toast.error(result.error)
            router.refresh()
        }
    }

    const handleCreateOrder = (opp: any) => {
        const params = new URLSearchParams({
            tab: 'order',
            client_id: opp.clients?.id || '',
            client_name: opp.clients?.company_name || '',
            amount: String(opp.expected_amount || 0),
        })
        router.push(`/dashboard/sales/order?${params.toString()}`)
    }

    return (
        <div className="space-y-4">
            {/* 헤더: 파이프라인 예상 매출 요약 */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-1">
                <div>
                    <h2 className="text-lg font-black tracking-tighter flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-amber-400" />
                        수주 기회 파이프라인
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        가중 예상 매출 합계:{' '}
                        <span className="text-primary font-black font-mono">
                            ₩{Math.round(totalPipelineRevenue).toLocaleString()}
                        </span>
                        <span className="text-muted-foreground/50 ml-1">(금액 × 확률 합산)</span>
                    </p>
                </div>
                <Button
                    size="sm"
                    className="h-8 text-xs font-bold gap-1.5 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
                    variant="ghost"
                    onClick={() => { setAddingStage('lead'); setShowAddModal(true) }}
                >
                    <Plus className="w-3.5 h-3.5" /> 수주 기회 추가
                </Button>
            </div>

            {/* 칸반 보드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 min-h-[400px]">
                {COLUMNS.map((col) => {
                    const colItems = items.filter(o => o.stage === col.id)
                    const colExpected = colItems.reduce((sum, o) =>
                        sum + (Number(o.expected_amount) * (o.probability / 100)), 0)

                    return (
                        <div key={col.id} className="flex flex-col gap-3"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => handleDrop(e, col.id)}
                        >
                            {/* 컬럼 헤더 */}
                            <div className={`p-3 rounded-xl border ${col.color} flex items-center justify-between`}>
                                <div className="min-w-0">
                                    <h3 className={`font-black text-[10px] tracking-widest uppercase truncate ${col.headerColor}`}>
                                        {col.title}
                                    </h3>
                                    {colExpected > 0 && (
                                        <p className="text-[9px] text-muted-foreground/60 font-mono mt-0.5">
                                            ₩{Math.round(colExpected).toLocaleString()}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Badge variant="outline" className="bg-background/50 border-none font-black text-[10px] shrink-0">
                                        {colItems.length}
                                    </Badge>
                                    <button
                                        className="w-5 h-5 rounded-md hover:bg-primary/20 flex items-center justify-center transition-colors shrink-0"
                                        onClick={() => { setAddingStage(col.id); setShowAddModal(true) }}
                                        title="이 단계에 추가"
                                    >
                                        <Plus className="w-3 h-3 text-muted-foreground" />
                                    </button>
                                </div>
                            </div>

                            {/* 카드 목록 */}
                            <div className="flex-grow flex flex-col gap-3 min-h-[120px]">
                                {colItems.map((opp) => (
                                    <div
                                        key={opp.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, opp.id)}
                                        onDragEnd={handleDragEnd}
                                        className={`bg-card/60 backdrop-blur-xl border rounded-xl p-3 shadow-sm transition-all cursor-grab active:cursor-grabbing hover:border-primary/30 hover:-translate-y-0.5 ${draggingId === opp.id ? 'opacity-40 scale-95' : 'border-border/40'}`}
                                    >
                                        {/* 거래처명 */}
                                        <div className="text-[10px] font-black text-primary tracking-widest uppercase truncate mb-1">
                                            {opp.clients?.company_name || 'UNKNOWN'}
                                        </div>

                                        {/* 영업건 제목 */}
                                        <h4 className="text-xs font-bold mb-2 line-clamp-2 leading-tight text-foreground">
                                            {opp.title}
                                        </h4>

                                        {/* 예상금액 + 확률 */}
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <span className="text-[11px] font-black font-mono text-emerald-400">
                                                ₩{Number(opp.expected_amount || 0).toLocaleString()}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground">×</span>
                                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-black border-primary/20 text-primary bg-primary/5">
                                                {opp.probability}%
                                            </Badge>
                                        </div>

                                        {/* 기여 매출 */}
                                        <div className="text-[10px] text-muted-foreground/60 mb-2">
                                            기여: ₩{Math.round(Number(opp.expected_amount) * (opp.probability / 100)).toLocaleString()}
                                        </div>

                                        {/* 마감일 */}
                                        {opp.expected_close_date && (
                                            <div className="text-[10px] text-muted-foreground/50 mb-2">
                                                예상 수주일: {format(new Date(opp.expected_close_date), 'MM/dd(eee)', { locale: ko })}
                                            </div>
                                        )}

                                        {/* 수주확정 시 퀵버튼 */}
                                        {opp.stage === 'confirmed' && (
                                            <Button
                                                size="sm"
                                                className="w-full h-7 text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 mt-1 gap-1"
                                                variant="ghost"
                                                onClick={() => handleCreateOrder(opp)}
                                            >
                                                <ArrowRight className="w-3 h-3" /> 이 건으로 수주 등록
                                            </Button>
                                        )}

                                        {/* 드래그 핸들 + 삭제 */}
                                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/10">
                                            <GripVertical className="w-3 h-3 text-muted-foreground/30" />
                                            <button
                                                className="w-5 h-5 rounded flex items-center justify-center hover:bg-red-500/10 text-muted-foreground/30 hover:text-red-400 transition-colors"
                                                onClick={() => handleDelete(opp.id)}
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {/* 빈 드롭 영역 */}
                                {colItems.length === 0 && (
                                    <div className={`flex-1 rounded-xl border-2 border-dashed ${col.color} opacity-40 min-h-[80px] flex items-center justify-center`}>
                                        <p className="text-[10px] text-muted-foreground">드래그하여 이동</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* 수주 기회 추가 모달 */}
            <AddOpportunityModal
                open={showAddModal}
                defaultStage={addingStage}
                clients={clients}
                onClose={() => setShowAddModal(false)}
                onCreated={(newItem) => {
                    setItems(prev => [newItem, ...prev])
                    setShowAddModal(false)
                    router.refresh()
                }}
            />
        </div>
    )
}

// ── 추가 모달 ──
function AddOpportunityModal({
    open, defaultStage, clients, onClose, onCreated
}: {
    open: boolean
    defaultStage: OpportunityStage
    clients: { id: string; company_name: string }[]
    onClose: () => void
    onCreated: (item: any) => void
}) {
    const [isPending, startTransition] = useTransition()
    const [form, setForm] = useState<CreateOpportunityInput>({
        client_id: '',
        title: '',
        stage: defaultStage,
        expected_amount: 0,
        probability: 50,
        expected_close_date: '',
        memo: '',
    })

    const handleSubmit = () => {
        if (!form.client_id || !form.title) {
            toast.error('거래처와 영업건 제목은 필수입니다.')
            return
        }
        startTransition(async () => {
            const result = await createOpportunity({ ...form, stage: defaultStage })
            if (result.success) {
                toast.success('수주 기회가 등록되었습니다.')
                const newItem = {
                    id: crypto.randomUUID(),
                    ...form,
                    stage: defaultStage,
                    clients: clients.find(c => c.id === form.client_id),
                }
                onCreated(newItem)
            } else {
                toast.error(result.error)
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-card border-border/40">
                <DialogHeader>
                    <DialogTitle className="font-black tracking-tight">
                        수주 기회 추가
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                            {COLUMNS.find(c => c.id === defaultStage)?.title}
                        </span>
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div>
                        <Label className="text-xs font-bold">거래처 *</Label>
                        <select
                            className="mt-1 w-full rounded-lg border border-border/50 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            value={form.client_id}
                            onChange={e => setForm(prev => ({ ...prev, client_id: e.target.value }))}
                        >
                            <option value="">거래처 선택...</option>
                            {clients.map(c => (
                                <option key={c.id} value={c.id}>{c.company_name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <Label className="text-xs font-bold">영업건 제목 *</Label>
                        <Input
                            className="mt-1"
                            placeholder="예: ABC사 2026 신제품 패키지"
                            value={form.title}
                            onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label className="text-xs font-bold">예상 수주액 (₩)</Label>
                            <Input
                                className="mt-1 font-mono"
                                type="number"
                                placeholder="0"
                                value={form.expected_amount || ''}
                                onChange={e => setForm(prev => ({ ...prev, expected_amount: Number(e.target.value) }))}
                            />
                        </div>
                        <div>
                            <Label className="text-xs font-bold">수주 확률 (%)</Label>
                            <Input
                                className="mt-1 font-mono"
                                type="number"
                                min={0}
                                max={100}
                                value={form.probability}
                                onChange={e => setForm(prev => ({ ...prev, probability: Number(e.target.value) }))}
                            />
                        </div>
                    </div>
                    <div>
                        <Label className="text-xs font-bold">예상 수주 마감일</Label>
                        <Input
                            className="mt-1"
                            type="date"
                            value={form.expected_close_date || ''}
                            onChange={e => setForm(prev => ({ ...prev, expected_close_date: e.target.value }))}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} disabled={isPending}>취소</Button>
                    <Button onClick={handleSubmit} disabled={isPending || !form.client_id || !form.title}
                        className="font-bold">
                        {isPending ? '등록 중...' : '등록'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
