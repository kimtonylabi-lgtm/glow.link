'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, Settings2, Plus, X, Save } from 'lucide-react'
import { getSystemSettings, updateSystemSetting } from './actions'

export function SettingsClient() {
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [settings, setSettings] = useState<any[]>([])

    // State specifically for categorise
    const [categories, setCategories] = useState<string[]>([])
    const [newCategory, setNewCategory] = useState('')

    const fetchData = async () => {
        setIsLoading(true)
        try {
            const res = await getSystemSettings()
            if (res.success && res.data) {
                setSettings(res.data)

                // Parse out categories if they exist
                const catSetting = res.data.find(s => s.key === 'PRODUCT_CATEGORIES')
                if (catSetting && Array.isArray(catSetting.value)) {
                    setCategories(catSetting.value)
                }
            } else {
                toast.error(res.error || '설정을 불러오는데 실패했습니다.')
            }
        } catch (error) {
            toast.error('오류 발생')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleAddCategory = () => {
        if (!newCategory.trim()) return
        if (categories.includes(newCategory.trim())) {
            toast.error('이미 존재하는 카테고리입니다.')
            return
        }
        setCategories([...categories, newCategory.trim()])
        setNewCategory('')
    }

    const handleRemoveCategory = (catToRemove: string) => {
        setCategories(categories.filter(c => c !== catToRemove))
    }

    const handleSaveCategories = async () => {
        setIsSaving(true)
        try {
            const res = await updateSystemSetting('PRODUCT_CATEGORIES', categories, false) // false = replace array, don't merge object
            if (res.success) {
                toast.success('제품 카테고리가 업데이트 되었습니다.')
                fetchData() // refresh
            } else {
                toast.error(res.error)
            }
        } catch (error) {
            toast.error('저장 중 오류 발생')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-card/40 backdrop-blur-xl border border-border/40 p-4 rounded-xl">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Settings2 className="w-6 h-6 text-primary" />
                        시스템 설정
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">GlowLink 공통 코드 및 환경 변수를 관리합니다. (Admin 전용)</p>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-card/40 backdrop-blur-xl border border-border/40">
                        <CardHeader>
                            <CardTitle>제품 카테고리 (공통 코드)</CardTitle>
                            <CardDescription>
                                견적 및 제품 등록 시 선택할 수 있는 대분류 카테고리를 관리합니다. JSON 배열 형태로 저장됩니다.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex flex-wrap gap-2 p-4 bg-muted/30 rounded-lg border border-border/40 min-h-[100px] items-start content-start">
                                {categories.length === 0 ? (
                                    <span className="text-sm text-muted-foreground italic">등록된 카테고리가 없습니다.</span>
                                ) : (
                                    categories.map((cat, idx) => (
                                        <Badge key={idx} variant="secondary" className="px-3 py-1 text-sm bg-background border border-border/50">
                                            {cat}
                                            <button
                                                onClick={() => handleRemoveCategory(cat)}
                                                className="ml-2 text-muted-foreground hover:text-destructive focus:outline-none"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </Badge>
                                    ))
                                )}
                            </div>

                            <div className="flex items-end gap-2">
                                <div className="space-y-2 flex-1">
                                    <Label htmlFor="newCat">새 카테고리 추가</Label>
                                    <Input
                                        id="newCat"
                                        placeholder="예: Tube"
                                        value={newCategory}
                                        onChange={(e) => setNewCategory(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault()
                                                handleAddCategory()
                                            }
                                        }}
                                    />
                                </div>
                                <Button type="button" variant="secondary" onClick={handleAddCategory}>
                                    <Plus className="w-4 h-4 mr-1" /> 추가
                                </Button>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-muted/20 border-t border-border/40 flex justify-end p-4">
                            <Button onClick={handleSaveCategories} disabled={isSaving}>
                                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                카테고리 저장
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* Placeholder for future JSON settings */}
                    <Card className="bg-card/40 backdrop-blur-xl border border-border/40 opacity-75">
                        <CardHeader>
                            <CardTitle>고급 환경설정 (App Config)</CardTitle>
                            <CardDescription>
                                개발 중인 기능입니다. 향후 시스템 유지보수 모드, 캐시 정책 등을 JSON 형태로 제어할 수 있습니다.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-black/50 p-4 rounded-md font-mono text-xs text-green-400 overflow-x-auto">
                                <pre>
                                    {`{
  "maintenanceMode": false,
  "defaultLocale": "ko-KR",
  "logRetentionDays": 30
}`}
                                </pre>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-muted/20 border-t border-border/40 flex justify-end p-4">
                            <Button disabled variant="outline">수정 불가</Button>
                        </CardFooter>
                    </Card>
                </div>
            )}
        </div>
    )
}
