'use client'

import { useState } from 'react'
import { Profile } from '@/types/auth'
import { createClient } from '@/lib/supabase/client'
import { updateProfile } from './actions'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function SettingsClient({ initialProfile, email }: { initialProfile?: Profile, email: string }) {
    const router = useRouter()
    const supabase = createClient()

    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

    // Password state
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsUpdatingProfile(true)
        const formData = new FormData(e.currentTarget)

        try {
            const result = await updateProfile(formData)
            if (result.success) {
                toast.success('프로필 정보가 성공적으로 업데이트되었습니다.')
            } else {
                toast.error(result.error || '프로필 업데이트 실패')
            }
        } catch (err) {
            toast.error('오류가 발생했습니다.')
        } finally {
            setIsUpdatingProfile(false)
        }
    }

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (password.length < 6) {
            toast.error('비밀번호는 최소 6자 이상이어야 합니다.')
            return
        }

        if (password !== confirmPassword) {
            toast.error('입력하신 두 비밀번호가 서로 일치하지 않습니다.')
            return
        }

        setIsUpdatingPassword(true)

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            })

            if (error) {
                toast.error(error.message || '비밀번호 변경에 실패했습니다.')
            } else {
                toast.success('비밀번호가 성공적으로 변경되었습니다. 보안을 위해 로그아웃됩니다.')

                // Sign out user and redirect to login
                await supabase.auth.signOut()
                router.push('/login')
                router.refresh()
            }
        } catch (err) {
            toast.error('알 수 없는 오류가 발생했습니다.')
        } finally {
            setIsUpdatingPassword(false)
            setPassword('')
            setConfirmPassword('')
        }
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto pb-10">
            <div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">사용자 설정 (Settings)</h1>
                <p className="text-muted-foreground mt-2">
                    내 프로필과 비밀번호 등 계정 정보를 관리합니다.
                </p>
            </div>

            {/* Profile Update */}
            <Card className="bg-card/40 backdrop-blur-xl border border-border/40">
                <CardHeader>
                    <CardTitle>기본 정보 수정</CardTitle>
                    <CardDescription>시스템에 표시될 이름과 소속 부서를 변경할 수 있습니다.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleProfileSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">이메일 계정 (수정 불가)</Label>
                            <Input id="email" value={email} disabled className="bg-muted/50 text-muted-foreground" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="fullName">담당자명 (이름)</Label>
                            <Input
                                id="fullName"
                                name="fullName"
                                defaultValue={initialProfile?.full_name || ''}
                                placeholder="표시될 이름을 입력하세요"
                                className="bg-background/50"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="department">소속 부서 / 직급</Label>
                            <Input
                                id="department"
                                name="department"
                                defaultValue={initialProfile?.department || ''}
                                placeholder="예: 해외영업 1팀 팀장"
                                className="bg-background/50"
                            />
                        </div>

                        <Button type="submit" disabled={isUpdatingProfile} className="w-full sm:w-auto">
                            {isUpdatingProfile ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            기본 정보 저장
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Password Update */}
            <Card className="bg-card/40 backdrop-blur-xl border border-red-500/20">
                <CardHeader>
                    <CardTitle className="text-red-500">비밀번호 변경</CardTitle>
                    <CardDescription>보안을 위해 강력한 비밀번호를 사용해 주세요. 변경 시 다시 로그인해야 합니다.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">새 비밀번호</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="새로운 비밀번호를 입력해주세요"
                                className="bg-background/50 border-red-500/20 focus-visible:ring-red-500/50"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="비밀번호를 다시 한 번 입력해주세요"
                                className="bg-background/50 border-red-500/20 focus-visible:ring-red-500/50"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={isUpdatingPassword || !password || !confirmPassword}
                            variant="destructive"
                            className="bg-red-500/20 text-red-500 hover:bg-red-500/30 border border-red-500/50 w-full sm:w-auto"
                        >
                            {isUpdatingPassword ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            비밀번호 강제 재설정
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
