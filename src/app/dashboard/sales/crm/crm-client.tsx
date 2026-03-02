'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ClientWithProfile } from '@/types/crm'
import { deleteClient } from './actions'
import { ClientForm } from './client-form'
import { toast } from 'sonner'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
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
import { MoreHorizontal, Plus, Search, Pencil, Trash2, Building2, Eye } from 'lucide-react'

interface CrmClientProps {
    initialData: ClientWithProfile[]
}

export function CrmClient({ initialData }: CrmClientProps) {
    const router = useRouter()
    const [data, setData] = useState<ClientWithProfile[]>(initialData)

    // States for Search & Filter
    const [searchQuery, setSearchQuery] = useState('')
    const [tierFilter, setTierFilter] = useState<string>('all')

    // Sheet & Dialog states
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [editingClient, setEditingClient] = useState<ClientWithProfile | null>(null)

    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    // Filter Logic (Client-side fast filtering)
    const filteredData = data.filter(client => {
        const matchesSearch = client.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (client.contact_person || '').toLowerCase().includes(searchQuery.toLowerCase())
        const matchesTier = tierFilter === 'all' || client.tier === tierFilter
        return matchesSearch && matchesTier
    })

    // CRUD Handlers
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
            // Optimistically update local state instead of full reload for speed
            setData(prev => prev.filter(c => c.id !== deletingId))
        }

        setIsDeleting(false)
        setDeletingId(null)
    }

    const handleFormSuccess = () => {
        setIsSheetOpen(false)
        // Router refresh for seamless UX
        router.refresh()
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">CRM (고객 관리)</h2>
                    <p className="text-sm text-muted-foreground mt-1">현황 및 파트너십을 관리합니다.</p>
                </div>

                <Button onClick={handleCreateNew} className="shadow-[0_0_15px_theme(colors.primary.DEFAULT)/30] hover:shadow-[0_0_20px_theme(colors.primary.DEFAULT)/50] transition-all">
                    <Plus className="mr-2 h-4 w-4" /> 고객 추가
                </Button>
            </div>

            {/* Filters Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card/40 border border-border/50 p-3 rounded-xl backdrop-blur-xl">
                <div className="flex items-center w-full sm:w-[350px] relative">
                    <Search className="absolute left-3 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="회사명 또는 담당자 검색..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-background/50 border-border/50 focus:border-primary/50"
                    />
                </div>
                <div className="w-full sm:w-[150px]">
                    <Select value={tierFilter} onValueChange={setTierFilter}>
                        <SelectTrigger className="bg-background/50">
                            <SelectValue placeholder="등급 필터" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">전체 등급</SelectItem>
                            <SelectItem value="S">S 등급</SelectItem>
                            <SelectItem value="A">A 등급</SelectItem>
                            <SelectItem value="B">B 등급</SelectItem>
                            <SelectItem value="C">C 등급</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Data Table */}
            <div className="rounded-xl border border-border/50 bg-card/20 backdrop-blur-xl overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/40 hover:bg-muted/40">
                        <TableRow className="border-border/50">
                            <TableHead className="w-[200px] text-primary">회사명</TableHead>
                            <TableHead>등급/상태</TableHead>
                            <TableHead className="hidden sm:table-cell">누적 매출</TableHead>
                            <TableHead className="hidden sm:table-cell">샘플 전환율</TableHead>
                            <TableHead>담당자</TableHead>
                            <TableHead className="hidden md:table-cell">연락처/이메일</TableHead>
                            <TableHead className="hidden lg:table-cell">영업담당</TableHead>
                            <TableHead className="text-right">관리</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <Building2 className="h-8 w-8 opacity-20" />
                                        <p>등록된 고객사가 없습니다.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredData.map((client) => (
                                <TableRow
                                    key={client.id}
                                    className="group hover:bg-primary/5 border-border/30 transition-colors backdrop-blur-sm"
                                >
                                    <TableCell className="font-medium">
                                        <Link
                                            href={`/dashboard/sales/crm/${client.id}`}
                                            className="flex flex-col group/link"
                                        >
                                            <span className="text-foreground group-hover/link:text-primary transition-colors">{client.company_name}</span>
                                            {client.business_number && (
                                                <span className="text-xs text-muted-foreground">{client.business_number}</span>
                                            )}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <CustomBadge variant={client.tier} />
                                            <span className={client.status === 'active' ? "text-green-400 text-xs mt-0.5" : "text-slate-500 text-xs mt-0.5"}>
                                                {client.status === 'active' ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell">
                                        <div className="text-sm font-semibold text-emerald-400">
                                            ₩{(client.total_revenue || 0).toLocaleString()}
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell">
                                        <div className="flex flex-col gap-1 w-24">
                                            <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                                                <span>전환율</span>
                                                <span className="text-primary">{client.conversion_rate || 0}%</span>
                                            </div>
                                            <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary transition-all duration-500"
                                                    style={{ width: `${client.conversion_rate || 0}%` }}
                                                />
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{client.contact_person || '-'}</TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        <div className="flex flex-col text-sm">
                                            <span>{client.phone || '-'}</span>
                                            <span className="text-xs text-muted-foreground">{client.email || ''}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                                        {client.managed_by_name || '미배정'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0 hover:text-primary">
                                                    <span className="sr-only">메뉴 열기</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-card/95 backdrop-blur-md border-border/50">
                                                <DropdownMenuLabel>액션</DropdownMenuLabel>
                                                <DropdownMenuItem asChild className="cursor-pointer">
                                                    <Link href={`/dashboard/sales/crm/${client.id}`} className="flex items-center w-full">
                                                        <Eye className="mr-2 h-4 w-4 text-primary" /> 360도 상세 보기
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleEdit(client)} className="cursor-pointer">
                                                    <Pencil className="mr-2 h-4 w-4 text-blue-400" /> 정보 수정
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => setDeletingId(client.id)}
                                                    className="cursor-pointer text-red-500 focus:bg-red-500/10 focus:text-red-500"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" /> 삭제
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Create / Edit Sheet */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="w-[400px] sm:max-w-[500px] overflow-y-auto bg-card/95 backdrop-blur-2xl border-l-border/50">
                    <SheetHeader>
                        <SheetTitle className="text-2xl text-primary">{editingClient ? '고객 정보 수정' : '새 고객 등록'}</SheetTitle>
                        <SheetDescription>
                            {editingClient ? '고객사의 상세 정보를 업데이트합니다.' : '새로운 파트너 고객사를 시스템에 등록합니다.'}
                        </SheetDescription>
                    </SheetHeader>
                    <ClientForm client={editingClient} onSuccess={handleFormSuccess} />
                </SheetContent>
            </Sheet>

            {/* Delete Confirmation Alert */}
            <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
                <AlertDialogContent className="bg-card border-border/50">
                    <AlertDialogHeader>
                        <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
                        <AlertDialogDescription>
                            이 작업은 되돌릴 수 없습니다. 해당 고객사의 모든 기록이 데이터베이스에서 영구적으로 삭제됩니다.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => { e.preventDefault(); handleDeleteConfirm(); }}
                            className="bg-red-500 hover:bg-red-600 text-white"
                            disabled={isDeleting}
                        >
                            {isDeleting ? '삭제 중...' : '삭제'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    )
}
