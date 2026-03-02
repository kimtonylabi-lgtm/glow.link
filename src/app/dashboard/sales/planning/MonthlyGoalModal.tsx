'use client'

import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Tabs,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs'
import { getYearlyGoals, upsertMonthlyGoals } from './actions'
import { toast } from 'sonner'
import { Loader2, Calendar, Target, Save } from 'lucide-react'

interface MonthlyGoalModalProps {
    onSuccess?: () => void
}

export function MonthlyGoalModal({ onSuccess }: MonthlyGoalModalProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const router = useRouter()

    // KST Current Year
    const kstYear = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' })).getFullYear()
    const [selectedYear, setSelectedYear] = useState(kstYear.toString())

    // Goals state: Array<{ month: number, target_amount: string }>
    const [goals, setGoals] = useState<{ month: number, target_amount: string }[]>(
        Array.from({ length: 12 }, (_, i) => ({ month: i + 1, target_amount: '' }))
    )

    const years = Array.from({ length: 5 }, (_, i) => (kstYear - 1 + i).toString())

    const fetchYearlyGoals = async (year: string) => {
        setIsLoading(true)
        try {
            const data = await getYearlyGoals(parseInt(year))
            const newGoals = Array.from({ length: 12 }, (_, i) => {
                const month = i + 1
                const match = data.find((g: any) => g.month === month)
                return {
                    month,
                    target_amount: match ? match.target_amount.toString() : ''
                }
            })
            setGoals(newGoals)
        } catch (error: any) {
            console.error('Fetch Yearly Goals Error:', error)
            toast.error(`연간 목표를 불러오지 못했습니다: ${error.message || '알 수 없는 오류'}`)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (open) {
            fetchYearlyGoals(selectedYear)
        }
    }, [open, selectedYear])

    const formatNumber = (val: string) => {
        const num = val.toString().replace(/,/g, '')
        if (!num || isNaN(Number(num))) return ''
        return Number(num).toLocaleString('ko-KR')
    }

    const handleChange = (month: number, value: string) => {
        const rawValue = value.replace(/,/g, '')
        if (/^\d*$/.test(rawValue)) {
            setGoals(prev => prev.map(g =>
                g.month === month ? { ...g, target_amount: rawValue } : g
            ))
        }
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            // 콤마 제거 후 숫자 타입으로 변환 (NaN 방지)
            const parsedGoals = goals.map(goal => ({
                month: goal.month,
                target_amount: Number(goal.target_amount.replace(/,/g, '')) || 0
            }))

            const result = await upsertMonthlyGoals(parseInt(selectedYear), parsedGoals)
            if (result.success) {
                toast.success(`${selectedYear}년 목표가 저장되었습니다.`)
                // Next.js 라우터 캐시 강제 갱신
                router.refresh()
                if (onSuccess) onSuccess()
                setOpen(false)
            } else {
                toast.error(result.error || '저장 중 오류가 발생했습니다.')
            }
        } catch (error: any) {
            console.error('Save Goals Error:', error)
            toast.error(`오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`)
        } finally {
            setIsSaving(false)
        }
    }

    // 연간 총 목표액 계산 (콤마 제거 후 숫자 합산)
    const totalYearlyGoal = goals.reduce((sum, goal) => {
        const val = Number(goal.target_amount.replace(/,/g, ''))
        return sum + (isNaN(val) ? 0 : val)
    }, 0)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="h-10 px-4 font-bold border-primary/30 hover:bg-primary/5 gap-2 rounded-xl">
                    <Calendar className="w-4 h-4 text-primary" />
                    연간 목표 설정
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-7xl w-[95vw] bg-card/95 backdrop-blur-2xl border-border/40 shadow-2xl rounded-3xl overflow-hidden p-0">
                <DialogHeader className="p-8 bg-gradient-to-br from-primary/10 via-transparent to-transparent">
                    <div className="flex justify-between items-start">
                        <div>
                            <DialogTitle className="text-2xl font-black flex items-center gap-2">
                                <Target className="w-6 h-6 text-primary" />
                                연간 영업 목표 관리
                            </DialogTitle>
                            <DialogDescription className="text-sm font-medium mt-1">
                                1월부터 12월까지의 매출 목표액을 일괄 설정하고 관리하세요.
                            </DialogDescription>
                        </div>

                        <div className="flex items-center gap-4">

                            <div className="flex items-center gap-2 bg-background/50 p-1 rounded-xl border border-border/40">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground mr-2 ml-2">기준 연도</Label>
                                <Select value={selectedYear} onValueChange={setSelectedYear}>
                                    <SelectTrigger className="w-28 h-9 border-none bg-transparent font-mono font-bold focus:ring-0 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card/95 backdrop-blur-xl border-border/40">
                                        {years.map(y => (
                                            <SelectItem key={y} value={y} className="font-mono font-bold text-xs">{y}년</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="px-8 pb-8">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="w-10 h-10 animate-spin text-primary" />
                            <p className="text-sm font-bold text-muted-foreground animate-pulse">데이터 로드 중...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
                            {goals.map(goal => (
                                <div key={goal.month} className="group/item flex flex-col space-y-2 p-4 rounded-2xl bg-muted/20 border border-border/20 focus-within:border-primary/50 focus-within:bg-primary/5 transition-all shadow-sm">
                                    <Label className="text-sm font-black text-foreground/80 ml-1">
                                        {goal.month}월
                                    </Label>
                                    <div className="relative flex items-center w-full">
                                        <Input
                                            value={formatNumber(goal.target_amount || '')}
                                            onChange={(e) => handleChange(goal.month, e.target.value)}
                                            placeholder="0"
                                            className="h-11 w-full font-mono text-base font-bold bg-background/50 border-border/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 pl-3 pr-10 rounded-xl transition-all"
                                        />
                                        <span className="absolute right-3 text-sm text-primary/60 font-black pointer-events-none group-focus-within/item:text-primary transition-colors">
                                            원
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center justify-between border-t border-border/40 pt-4 mt-2">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Annual Total Target</span>
                            <span className="text-xl font-black text-primary font-mono">
                                ₩ {totalYearlyGoal.toLocaleString('ko-KR')}
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-xl font-bold">취소</Button>
                            <Button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-32 h-11 rounded-xl font-black shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                전체 저장
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
