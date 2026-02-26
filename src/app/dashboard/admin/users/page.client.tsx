'use client'

import { useState, useMemo } from 'react'
import { Profile, UserRole } from '@/types/auth'
import { updateUserRole } from './actions'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Search, ShieldAlert, UserPlus, Users, Trash2, CheckCircle2, AlertTriangle, UserMinus } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

const ROLES: { value: UserRole, label: string }[] = [
    { value: 'admin', label: 'Admin (최고 관리자)' },
    { value: 'head', label: 'Head (부서장)' },
    { value: 'sales', label: 'Sales (영업)' },
    { value: 'sample_team', label: 'Sample Team (샘플실)' },
    { value: 'support', label: 'Support (지원)' },
    { value: 'pending', label: 'Approval Pending (승인 대기)' },
    { value: 'inactive', label: 'Inactive (퇴사/비활성)' },
]

export function AdminUsersClient({ initialProfiles, currentUserId }: { initialProfiles: Profile[], currentUserId: string }) {
    const [searchQuery, setSearchQuery] = useState('')
    const [isUpdating, setIsUpdating] = useState<string | null>(null)
    const [profiles, setProfiles] = useState<Profile[]>(initialProfiles)

    // Typing check for deletion
    const [deleteConfirmText, setDeleteConfirmText] = useState('')
    const [targetDeleteId, setTargetDeleteId] = useState<string | null>(null)

    // Approval state
    const [pendingApprovals, setPendingApprovals] = useState<Record<string, UserRole>>({})

    // Filtered lists
    const pendingUsers = useMemo(() => {
        return profiles.filter(p => p.role === ('pending' as UserRole))
    }, [profiles])

    const activeUsers = useMemo(() => {
        return profiles
            .filter(p => p.role !== ('pending' as UserRole) && p.role !== ('inactive' as UserRole))
            .filter(profile => {
                const matchesSearch = profile.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    profile.email?.toLowerCase().includes(searchQuery.toLowerCase())
                return matchesSearch
            })
    }, [profiles, searchQuery])

    const handleRoleChange = async (userId: string, newRole: UserRole) => {
        setIsUpdating(userId)
        try {
            const result = await updateUserRole(userId, newRole)
            if (result.success) {
                toast.success('사용자 상태가 업데이트되었습니다.')
                setProfiles(prev => prev.map(p => p.id === userId ? { ...p, role: newRole } : p))
            } else {
                toast.error(result.error || '업데이트 실패')
            }
        } catch (error) {
            toast.error('서버 오류')
        } finally {
            setIsUpdating(null)
        }
    }

    const handleApprove = async (userId: string) => {
        const role = pendingApprovals[userId]
        if (!role) {
            toast.error('직책을 먼저 선택해 주세요.')
            return
        }
        await handleRoleChange(userId, role)
    }

    const handleDeactivate = async () => {
        if (!targetDeleteId) return
        if (deleteConfirmText !== '삭제요청') {
            toast.error("'삭제요청'을 정확히 입력해 주세요.")
            return
        }

        setIsUpdating(targetDeleteId)
        try {
            const result = await updateUserRole(targetDeleteId, 'inactive')
            if (result.success) {
                toast.success('직원이 비활성화 처리되었습니다.')
                setProfiles(prev => prev.map(p => p.id === targetDeleteId ? { ...p, role: 'inactive' } : p))
                setTargetDeleteId(null)
                setDeleteConfirmText('')
            } else {
                toast.error(result.error || '처리 실패')
            }
        } catch (error) {
            toast.error('오류 발생')
        } finally {
            setIsUpdating(null)
        }
    }

    return (
        <div className="space-y-10 pb-20">
            <div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">사용자 관리 (Admin)</h1>
                <p className="text-muted-foreground mt-2">
                    신규 가입 승인 및 전사 인력의 권한을 관리합니다.
                </p>
            </div>

            {/* 1. Pending Approvals Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-semibold">🚀 승인 대기 중인 신규 가입자</h2>
                    <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary border-primary/20">
                        {pendingUsers.length}명 대기 중
                    </Badge>
                </div>

                {pendingUsers.length === 0 ? (
                    <Card className="bg-muted/30 border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                            <CheckCircle2 className="w-8 h-8 opacity-20 mb-2" />
                            <p className="text-sm">현재 승인 대기 중인 신규 가입자가 없습니다.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pendingUsers.map(user => (
                            <Card key={user.id} className="bg-card/40 backdrop-blur-xl border-border/40 overflow-hidden group hover:border-primary/40 transition-all">
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <CardTitle className="text-lg">{user.full_name || '익명 사용자'}</CardTitle>
                                            <CardDescription className="text-xs">{user.email}</CardDescription>
                                        </div>
                                        <Badge variant="outline" className="text-[10px]">{user.department || '부서미지정'}</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex items-center gap-3 pt-0">
                                    <div className="flex-1">
                                        <Select
                                            value={pendingApprovals[user.id] || ''}
                                            onValueChange={(val) => setPendingApprovals(prev => ({ ...prev, [user.id]: val as UserRole }))}
                                            disabled={isUpdating === user.id}
                                        >
                                            <SelectTrigger className="h-9 bg-background/50">
                                                <SelectValue placeholder="직책 선택..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {ROLES.filter(r => r.value !== 'pending' && r.value !== 'inactive').map(r => (
                                                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() => handleApprove(user.id)}
                                        disabled={!pendingApprovals[user.id] || isUpdating === user.id}
                                        className="h-9"
                                    >
                                        승인
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* 2. Existing Employees Section */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        <h2 className="text-xl font-semibold">정직원 목록 (Active Employees)</h2>
                    </div>
                    <div className="relative w-full sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="직원 이름 또는 이메일 검색..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-background/50 h-9"
                        />
                    </div>
                </div>

                <div className="rounded-xl border border-border/40 bg-card/40 backdrop-blur-sm overflow-hidden text-sm">
                    <Table>
                        <TableHeader className="bg-muted/50 border-b border-border/50">
                            <TableRow>
                                <TableHead className="font-semibold">이름</TableHead>
                                <TableHead className="font-semibold">소속/부서</TableHead>
                                <TableHead className="w-[180px] font-semibold">직책 (Role)</TableHead>
                                <TableHead className="text-right font-semibold">작업</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {activeUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                                        조회된 직원이 없습니다.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                activeUsers.map((profile) => (
                                    <TableRow key={profile.id} className="hover:bg-muted/20 transition-colors border-b border-border/40">
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    {profile.full_name || '-'}
                                                    {profile.id === currentUserId && (
                                                        <Badge variant="outline" className="text-[10px] h-5 px-1.5">나</Badge>
                                                    )}
                                                </div>
                                                <span className="text-[10px] text-muted-foreground font-normal">{profile.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{profile.department || '-'}</TableCell>
                                        <TableCell>
                                            <Select
                                                value={profile.role}
                                                onValueChange={(val) => handleRoleChange(profile.id, val as UserRole)}
                                                disabled={isUpdating === profile.id || profile.id === currentUserId}
                                            >
                                                <SelectTrigger className="h-8 bg-background/50">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {ROLES.filter(r => r.value !== 'pending' && r.value !== 'inactive').map(role => (
                                                        <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {profile.id !== currentUserId && (
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                                                            onClick={() => {
                                                                setTargetDeleteId(profile.id)
                                                                setDeleteConfirmText('')
                                                            }}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent className="bg-card border-border/60">
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                                                                <AlertTriangle className="w-5 h-5" />
                                                                직원 비활성화 (Deactivate)
                                                            </AlertDialogTitle>
                                                            <AlertDialogDescription className="space-y-3 pt-2">
                                                                <p className="font-bold text-foreground">
                                                                    정말 이 직원의 계정을 비활성화하시겠습니까?
                                                                </p>
                                                                <p className="text-xs">
                                                                    데이터 보존을 위해 과거 영업 기록은 유지되며 접근 권한만 영구 차단됩니다.
                                                                    진행하시려면 아래 입력창에 <span className="text-primary font-bold">'삭제요청'</span>이라고 타이핑하세요.
                                                                </p>
                                                                <Input
                                                                    value={deleteConfirmText}
                                                                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                                                                    placeholder="삭제요청 직접 입력"
                                                                    className="bg-background mt-4 border-destructive/30 focus:border-destructive"
                                                                />
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel onClick={() => setTargetDeleteId(null)}>취소</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={handleDeactivate}
                                                                disabled={deleteConfirmText !== '삭제요청' || isUpdating === profile.id}
                                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                            >
                                                                <UserMinus className="w-4 h-4 mr-2" />
                                                                최종 비활성화
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Inactive users could be in a separate tab if needed, 
                for now we just list active employees for simplicity as per requirement. */}
        </div>
    )
}
