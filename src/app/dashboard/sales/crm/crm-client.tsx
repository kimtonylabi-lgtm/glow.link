'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ClientWithProfile } from '@/types/crm'
import { deleteClient } from './actions'
import { ClientForm } from './client-form'
import { ClientDetailView } from './client-detail-view'
import { toast } from 'sonner'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CustomBadge } from '@/components/ui/custom-badge'
import {
    MoreHorizontal,
    Plus,
    Search,
    Pencil,
    Trash2,
    Building2,
    Filter,
    ChevronRight,
    TrendingUp,
    LayoutGrid
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CrmClientProps {
    initialData: ClientWithProfile[]
}

export function CrmClient({ initialData }: CrmClientProps) {
    const router = useRouter()
    const [data, setData] = useState<ClientWithProfile[]>(initialData)
    const [selectedId, setSelectedId] = useState<string | null>(null)

    // Sync state with server data (after router.refresh)
    useEffect(() => {
        setData(initialData)
    }, [initialData])

    // Search & Filter
    const [searchQuery, setSearchQuery] = useState('')
    const [tierFilter, setTierFilter] = useState<string>('all')

    // UI States
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [editingClient, setEditingClient] = useState<ClientWithProfile | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    // Filtering Logic
    const filteredData = useMemo(() => {
        return data.filter(client => {
            const matchesSearch = client.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (client.contact_person || '').toLowerCase().includes(searchQuery.toLowerCase())
            const matchesTier = tierFilter === 'all' || client.tier === tierFilter
            return matchesSearch && matchesTier
        })
    }, [data, searchQuery, tierFilter])

    const handleCreateNew = () => {
        setEditingClient(null)
        setIsSheetOpen(true)
    }

    const handleEdit = (client: ClientWithProfile) => {
        setEditingClient(client)
        setIsSheetOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (!deletingId) return
        setIsDeleting(true)

        const result = await deleteClient(deletingId)

        if (result.error) {
            toast.error('삭제 실패', { description: result.error })
        } else {
            toast.success('삭제 완료', { description: '고객 정보가 삭제되었습니다.' })
            setData(prev => prev.filter(c => c.id !== deletingId))
            if (selectedId === deletingId) setSelectedId(null)
        }

        setIsDeleting(false)
        setDeletingId(null)
    }

    const handleFormSuccess = () => {
        setIsSheetOpen(false)
        router.refresh()
    }

    return (
        <div className="flex h-[calc(100vh-140px)] -mt-2 overflow-hidden gap-4 animate-in fade-in duration-700">
            {/* Left Panel: Master List */}
            <div className={cn(
                "flex-col bg-card/20 backdrop-blur-xl border border-border/40 rounded-3xl overflow-hidden shadow-sm flex",
                "w-full md:w-[350px] lg:w-[400px]",
                selectedId ? "hidden md:flex" : "flex"
            )}>
                {/* Search & Header */}
                <div className="p-5 border-b border-border/40 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <LayoutGrid className="w-5 h-5 text-primary" />
                            <h2 className="text-lg font-black tracking-tighter">고객 리스트</h2>
                        </div>
                        <Button variant="ghost" size="icon" onClick={handleCreateNew} className="rounded-full hover:bg-primary/10 hover:text-primary">
                            <Plus className="w-5 h-5" />
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="고객사 이름 또는 담당자..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 bg-muted/30 border-border/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 rounded-xl h-10 text-sm"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Select value={tierFilter} onValueChange={setTierFilter}>
                                <SelectTrigger className="bg-muted/30 border-border/50 rounded-xl h-8 text-xs font-bold">
                                    <div className="flex items-center gap-2">
                                        <Filter className="w-3 h-3" />
                                        <SelectValue placeholder="등급 필터" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="bg-card/95 backdrop-blur-xl">
                                    <SelectItem value="all">전체 등급</SelectItem>
                                    <SelectItem value="S">S 클래스</SelectItem>
                                    <SelectItem value="A">A 클래스</SelectItem>
                                    <SelectItem value="B">B 클래스</SelectItem>
                                </SelectContent>
                            </Select>
                            <span className="text-[10px] font-black text-muted-foreground/60 uppercase ml-auto">{filteredData.length} Partners</span>
                        </div>
                    </div>
                </div>

                {/* Scrollable List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                    {filteredData.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-30 text-center p-8">
                            <Building2 className="w-12 h-12 mb-3" />
                            <p className="text-sm font-bold">고객사를 찾을 수 없습니다.</p>
                        </div>
                    ) : (
                        filteredData.map((client) => (
                            <div
                                key={client.id}
                                onClick={() => setSelectedId(client.id)}
                                className={cn(
                                    "py-2 px-3 rounded-xl cursor-pointer transition-all border group relative flex items-center justify-between gap-2",
                                    selectedId === client.id
                                        ? "bg-primary/10 border-primary/40 shadow-sm shadow-primary/5"
                                        : "bg-transparent border-transparent hover:bg-muted/50 hover:border-border/60"
                                )}
                            >
                                {/* Main content: company name + tier badge */}
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <h3 className={cn(
                                        "font-black tracking-tight text-sm truncate",
                                        selectedId === client.id ? "text-primary" : "text-foreground"
                                    )}>
                                        {client.company_name}
                                    </h3>
                                    <CustomBadge variant={client.tier} className="shrink-0 text-[9px] px-1.5 h-4" />
                                </div>

                                {/* Right side: sales person name + dropdown */}
                                <div className="flex items-center gap-1 shrink-0">
                                    {client.sales_person?.full_name && (
                                        <span className="text-[10px] text-muted-foreground/60 font-bold hidden lg:block">
                                            {client.sales_person.full_name}
                                        </span>
                                    )}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <MoreHorizontal className="w-3.5 h-3.5" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-card/95 backdrop-blur-xl border-border/40">
                                            <DropdownMenuItem onClick={() => handleEdit(client)} className="cursor-pointer font-bold text-xs gap-2">
                                                <Pencil className="w-3.5 h-3.5" /> 수정
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => setDeletingId(client.id)} className="cursor-pointer font-bold text-xs text-red-500 gap-2 focus:text-red-500">
                                                <Trash2 className="w-3.5 h-3.5" /> 삭제
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    <ChevronRight className={cn(
                                        "w-3.5 h-3.5 transition-all shrink-0",
                                        selectedId === client.id ? "text-primary" : "text-muted-foreground/30"
                                    )} />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Right Panel: Detail View */}
            <div className={cn(
                "flex-1 bg-card/20 backdrop-blur-xl border border-border/40 rounded-3xl overflow-hidden shadow-sm relative",
                !selectedId && "hidden md:flex",
                selectedId ? "flex" : "hidden md:flex"
            )}>
                <ClientDetailView
                    clientId={selectedId}
                    onBack={() => setSelectedId(null)}
                />
            </div>

            {/* Modal Components */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="w-[400px] sm:max-w-[500px] overflow-y-auto bg-card/95 backdrop-blur-2xl border-l-border/50">
                    <SheetHeader>
                        <SheetTitle className="text-2xl font-black text-primary">{editingClient ? '고객 정보 수정' : '새 고객 등록'}</SheetTitle>
                        <SheetDescription className="font-medium">
                            {editingClient ? '고객사의 상세 정보를 업데이트합니다.' : '새로운 파트너 고객사를 시스템에 등록합니다.'}
                        </SheetDescription>
                    </SheetHeader>
                    <ClientForm client={editingClient} onSuccess={handleFormSuccess} />
                </SheetContent>
            </Sheet>

            <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
                <AlertDialogContent className="bg-card/95 backdrop-blur-xl border-border/50 rounded-3xl shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-black text-xl">정말 삭제하시겠습니까?</AlertDialogTitle>
                        <AlertDialogDescription className="font-medium">
                            이 작업은 되돌릴 수 없습니다. 해당 고객사의 모든 기록이 데이터베이스에서 영구적으로 삭제됩니다.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel disabled={isDeleting} className="rounded-xl font-bold">취소</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => { e.preventDefault(); handleDeleteConfirm(); }}
                            className="bg-red-500 hover:bg-red-600 text-white rounded-xl font-black shadow-lg shadow-red-500/20"
                            disabled={isDeleting}
                        >
                            {isDeleting ? '삭제 중...' : '확인 및 삭제'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
