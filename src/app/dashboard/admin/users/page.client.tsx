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
import { Badge } from '@/components/ui/badge'
import { Search, ShieldAlert } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

const ROLES: { value: UserRole, label: string }[] = [
    { value: 'admin', label: 'Admin (최고 관리자)' },
    { value: 'head', label: 'Head (부서장)' },
    { value: 'sales', label: 'Sales (영업)' },
    { value: 'sample_team', label: 'Sample Team (샘플실)' },
    { value: 'support', label: 'Support (지원)' },
]

export function AdminUsersClient({ initialProfiles, currentUserId }: { initialProfiles: Profile[], currentUserId: string }) {
    const [searchQuery, setSearchQuery] = useState('')
    const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all')
    const [isUpdating, setIsUpdating] = useState<string | null>(null)
    const [profiles, setProfiles] = useState<Profile[]>(initialProfiles)

    const filteredProfiles = useMemo(() => {
        return profiles.filter(profile => {
            const matchesSearch = profile.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                profile.email?.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesRole = roleFilter === 'all' ? true : profile.role === roleFilter
            return matchesSearch && matchesRole
        })
    }, [profiles, searchQuery, roleFilter])

    const handleRoleChange = async (userId: string, newRole: UserRole) => {
        setIsUpdating(userId)
        try {
            const result = await updateUserRole(userId, newRole)
            if (result.success) {
                toast.success('직책이 성공적으로 변경되었습니다.')
                // Optimistic UI Update
                setProfiles(prev => prev.map(p => p.id === userId ? { ...p, role: newRole } : p))
            } else {
                toast.error(result.error || '직책 변경에 실패했습니다.')
            }
        } catch (error) {
            toast.error('서버 오류가 발생했습니다.')
        } finally {
            setIsUpdating(null)
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">사용자 관리 (Admin)</h1>
                <p className="text-muted-foreground mt-2">
                    시스템에 가입된 사용자의 직책(Role) 및 권한을 관리합니다. 본인의 직책은 강등시킬 수 없습니다.
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-center bg-card/50 p-4 rounded-xl border border-border/40 backdrop-blur-xl">
                <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="이름 또는 이메일 검색..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-background/50"
                    />
                </div>
                <div className="w-full sm:max-w-[200px]">
                    <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as UserRole | 'all')}>
                        <SelectTrigger className="bg-background/50">
                            <SelectValue placeholder="직책 필터" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">모든 직책 보기</SelectItem>
                            {ROLES.map(role => (
                                <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-border/40 bg-card/40 backdrop-blur-sm overflow-hidden text-sm">
                <Table>
                    <TableHeader className="bg-muted/50 border-b border-border/50">
                        <TableRow>
                            <TableHead className="font-semibold">이름</TableHead>
                            <TableHead className="font-semibold">이메일</TableHead>
                            <TableHead className="font-semibold">소속/부서</TableHead>
                            <TableHead className="font-semibold">가입일</TableHead>
                            <TableHead className="w-[200px] font-semibold">직책 (Role)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredProfiles.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                    검색 조건에 맞는 사용자가 없습니다.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredProfiles.map((profile) => (
                                <TableRow key={profile.id} className="hover:bg-muted/20 transition-colors border-b border-border/40">
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            {profile.full_name || '-'}
                                            {profile.id === currentUserId && (
                                                <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20 h-5 px-1.5">나</Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{profile.email}</TableCell>
                                    <TableCell>{profile.department || '-'}</TableCell>
                                    <TableCell className="text-muted-foreground">{format(new Date(profile.created_at), 'yyyy-MM-dd', { locale: ko })}</TableCell>
                                    <TableCell>
                                        {profile.id === currentUserId ? (
                                            <div className="flex items-center text-muted-foreground text-xs gap-1.5 px-3 py-2 bg-muted/30 rounded-md border border-border/40 cursor-not-allowed w-[180px]">
                                                <ShieldAlert className="w-3.5 h-3.5 text-orange-500" />
                                                최고 관리자 (수정 불가)
                                            </div>
                                        ) : (
                                            <div className="w-[180px]">
                                                <Select
                                                    value={profile.role}
                                                    onValueChange={(val) => handleRoleChange(profile.id, val as UserRole)}
                                                    disabled={isUpdating === profile.id}
                                                >
                                                    <SelectTrigger className={`h-8 bg-background/50 ${isUpdating === profile.id ? 'opacity-50' : ''}`}>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {ROLES.map(role => (
                                                            <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
