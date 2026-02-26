'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { getAllSettings, updateSystemSetting } from './actions'
import { Loader2, Settings2, Plus, Trash2, Save } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function SettingsClient() {
    const [settings, setSettings] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    // Draft states
    const [newCategory, setNewCategory] = useState('')
    const [bizName, setBizName] = useState('')

    const fetchData = async () => {
        setIsLoading(true)
        try {
            const data = await getAllSettings()
            setSettings(data || [])

            // Populate defaults from data
            const biz = data?.find(s => s.key === 'business_info')
            if (biz) setBizName(biz.value.company_name || '')
        } catch (error) {
            toast.error('설정을 불러오지 못했습니다.')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleAddCategory = async () => {
        if (!newCategory.trim()) return

        const catSetting = settings.find(s => s.key === 'product_categories')
        const currentCats = catSetting?.value || []

        if (currentCats.includes(newCategory)) {
            toast.error('이미 존재하는 카테고리입니다.')
            return
        }

        const updatedCats = [...currentCats, newCategory]

        setIsSaving(true)
        const res = await updateSystemSetting('product_categories', updatedCats)
        if (res.success) {
            toast.success('카테고리가 추가되었습니다.')
            setNewCategory('')
            fetchData()
        } else {
            toast.error(res.error)
        }
        setIsSaving(false)
    }

    const handleRemoveCategory = async (cat: string) => {
        const catSetting = settings.find(s => s.key === 'product_categories')
        const updatedCats = (catSetting?.value || []).filter((c: string) => c !== cat)

        setIsSaving(true)
        const res = await updateSystemSetting('product_categories', updatedCats)
        if (res.success) {
            toast.success('카테고리가 삭제되었습니다.')
            fetchData()
        } else {
            toast.error(res.error)
        }
        setIsSaving(false)
    }

    const handleSaveBizInfo = async () => {
        setIsSaving(true)
        const res = await updateSystemSetting('business_info', { company_name: bizName })
        if (res.success) {
            toast.success('사업 정보가 저장되었습니다.')
            fetchData()
        } else {
            toast.error(res.error)
        }
        setIsSaving(false)
    }

    if (isLoading) {
        return <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-muted-foreground" /></div>
    }

    const categories = settings.find(s => s.key === 'product_categories')?.value || []

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-10">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary/80 to-primary bg-clip-text text-transparent flex items-center gap-2">
                    <Settings2 className="w-8 h-8 text-primary" />
                    시스템 설정 (System Settings)
                </h1>
                <p className="text-muted-foreground">공통 코드 및 비즈니스 기본 정보를 관리합니다.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Categories */}
                <Card className="bg-card/40 backdrop-blur-xl border border-border/40">
                    <CardHeader>
                        <CardTitle>제품 카테고리 관리</CardTitle>
                        <CardDescription>수주 및 제품 등록 시 사용되는 공통 카테고리 목록입니다.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-2 min-h-[40px] p-2 rounded-lg border border-dashed border-border/60">
                            {categories.map((cat: string) => (
                                <Badge key={cat} variant="secondary" className="pl-3 pr-1 py-1 gap-1">
                                    {cat}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-4 w-4 rounded-full p-0 hover:bg-destructive hover:text-destructive-foreground"
                                        onClick={() => handleRemoveCategory(cat)}
                                        disabled={isSaving}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </Badge>
                            ))}
                            {categories.length === 0 && <span className="text-xs text-muted-foreground italic">카테고리가 없습니다.</span>}
                        </div>

                        <div className="flex gap-2">
                            <Input
                                placeholder="새 카테고리 입력"
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                            />
                            <Button variant="outline" size="icon" onClick={handleAddCategory} disabled={isSaving || !newCategory.trim()}>
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Business Info */}
                <Card className="bg-card/40 backdrop-blur-xl border border-border/40">
                    <CardHeader>
                        <CardTitle>기본 사업 정보</CardTitle>
                        <CardDescription>시스템 전반에 표시될 회사 정보를 설정합니다.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="bizName">회사명 (Company Name)</Label>
                            <Input
                                id="bizName"
                                value={bizName}
                                onChange={(e) => setBizName(e.target.value)}
                                placeholder="GlowLink"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>기본 통화</Label>
                            <Input value="KRW" disabled className="bg-muted/50" />
                        </div>
                    </CardContent>
                    <CardFooter className="border-t border-border/20 pt-4">
                        <Button className="w-full" onClick={handleSaveBizInfo} disabled={isSaving}>
                            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                            변경 사항 저장
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            <Card className="bg-card/40 backdrop-blur-xl border border-border/40">
                <CardHeader>
                    <CardTitle className="text-sm font-medium">데이터 무결성 참고</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">
                        카테고리 이름을 변경하거나 삭제할 경우, 기존에 해당 카테고리로 등록된 제품이나 수주 데이터에는 영향이 없으나 검색/필터링 시 누락될 수 있습니다.
                        시스템 관리자는 신중하게 변경하시기 바랍니다.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
