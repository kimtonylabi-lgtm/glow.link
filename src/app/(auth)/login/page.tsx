'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { login, signup } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from 'sonner'
import { Loader2, ArrowRight, UserPlus } from 'lucide-react'

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)

        const formData = new FormData(e.currentTarget)
        const result = await login(formData)

        if (result?.error) {
            toast.error('로그인 실패', {
                description: result.error,
            })
        } else {
            toast.success('로그인 성공!', {
                description: '대시보드로 이동합니다.',
            })
            router.push('/dashboard')
        }

        setIsLoading(false)
    }

    const handleSignupSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)

        const formData = new FormData(e.currentTarget)
        const result = await signup(formData)

        if (result?.error) {
            toast.error('회원가입 실패', {
                description: result.error,
            })
        } else if (result?.verificationRequired) {
            toast.success('회원가입 완료!', {
                description: '이메일 인증이 필요합니다. 메일함을 확인해 주세요.',
            })
        } else {
            toast.success('회원가입 성공!', {
                description: '관리자 승인 후 로그인 가능합니다.',
            })
        }

        setIsLoading(false)
    }

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
            {/* Background Neon Effects */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="z-10 w-full max-w-md px-4">
                {/* Logo Placeholder (Neon Box) */}
                <div className="flex justify-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-card border border-primary/30 flex items-center justify-center shadow-[0_0_20px_theme(colors.primary.DEFAULT)/30]">
                        <span className="text-2xl font-bold text-primary">GL</span>
                    </div>
                </div>

                <Tabs defaultValue="login" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-muted/50 mb-4">
                        <TabsTrigger value="login">로그인</TabsTrigger>
                        <TabsTrigger value="signup">회원가입</TabsTrigger>
                    </TabsList>

                    <TabsContent value="login">
                        <Card className="border-border/50 shadow-2xl backdrop-blur-xl bg-card">
                            <CardHeader className="space-y-1 text-center">
                                <CardTitle className="text-2xl font-bold tracking-tight">GlowLink 접속</CardTitle>
                                <CardDescription className="text-muted-foreground">
                                    이메일과 비밀번호를 입력하여 로그인하세요.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleLoginSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">이메일</Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            placeholder="name@example.com"
                                            required
                                            className="bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/30 transition-all duration-300"
                                            disabled={isLoading}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="password">비밀번호</Label>
                                        </div>
                                        <Input
                                            id="password"
                                            name="password"
                                            type="password"
                                            required
                                            className="bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/30 transition-all duration-300"
                                            disabled={isLoading}
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full relative overflow-hidden group bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 hover:shadow-[0_0_20px_theme(colors.primary.DEFAULT)/50]"
                                        disabled={isLoading}
                                    >
                                        <div className="relative flex items-center justify-center gap-2">
                                            {isLoading ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <>
                                                    로그인 <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                                </>
                                            )}
                                        </div>
                                    </Button>
                                </form>
                            </CardContent>
                            <CardFooter className="flex justify-center">
                                <p className="text-sm text-muted-foreground">
                                    테스트 계정이 필요하신가요? 관리자에게 문의하세요.
                                </p>
                            </CardFooter>
                        </Card>
                    </TabsContent>

                    <TabsContent value="signup">
                        <Card className="border-border/50 shadow-2xl backdrop-blur-xl bg-card">
                            <CardHeader className="space-y-1 text-center">
                                <CardTitle className="text-2xl font-bold tracking-tight">계정 생성</CardTitle>
                                <CardDescription className="text-muted-foreground">
                                    GlowLink 신규 직원 가입을 진행합니다.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSignupSubmit} className="space-y-3">
                                    <div className="space-y-1">
                                        <Label htmlFor="signup-name">이름 (Full Name)</Label>
                                        <Input
                                            id="signup-name"
                                            name="full_name"
                                            placeholder="익명"
                                            required
                                            className="bg-background/50 border-border/50"
                                            disabled={isLoading}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="signup-department">부서 (Department)</Label>
                                        <Select name="department" defaultValue="영업부">
                                            <SelectTrigger className="bg-background/50 border-border/50">
                                                <SelectValue placeholder="부서를 선택하세요" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="영업부">영업부</SelectItem>
                                                <SelectItem value="샘플팀">샘플팀</SelectItem>
                                                <SelectItem value="지원팀">지원팀</SelectItem>
                                                <SelectItem value="관리팀">관리팀</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {/* Radix Select with name prop automatically adds a hidden input, 
                                            but adding one explicitly can be safer if there's any hydration mismatch.
                                            Actually, let's keep it clean since Radix handles it. */}
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="signup-email">이메일</Label>
                                        <Input
                                            id="signup-email"
                                            name="email"
                                            type="email"
                                            placeholder="name@example.com"
                                            required
                                            className="bg-background/50 border-border/50"
                                            disabled={isLoading}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="signup-password">비밀번호</Label>
                                        <Input
                                            id="signup-password"
                                            name="password"
                                            type="password"
                                            required
                                            className="bg-background/50 border-border/50"
                                            disabled={isLoading}
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <><UserPlus className="h-4 w-4 mr-2" /> 회원가입</>
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
