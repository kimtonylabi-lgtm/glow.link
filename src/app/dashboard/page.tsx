import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Calendar, TrendingUp } from 'lucide-react'
import { DemandPredictionAlert } from '@/components/sales/DemandPredictionAlert'

export default async function DashboardHome() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const name = user?.user_metadata?.full_name || '사용자'

    // Fetch demand prediction data
    const { data: predictions } = await supabase
        .from('v_sales_analysis' as any)
        .select('client_id, company_name, predicted_interval, last_order_date')
        .limit(10)

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">환영합니다, {name}님! 👋</h1>
                <p className="text-muted-foreground">
                    GlowLink 대시보드에 오신 것을 환영합니다. 좌측 메뉴를 통해 업무를 시작해 보세요.
                </p>
            </div>

            {predictions && predictions.length > 0 && (
                <DemandPredictionAlert predictions={predictions as any} />
            )}

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-card/40 backdrop-blur-xl border-border/40">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">오늘의 일정</CardTitle>
                        <Calendar className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0건</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            예정된 미팅 및 업무
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-card/40 backdrop-blur-xl border-border/40">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">진행 중인 프로젝트</CardTitle>
                        <Sparkles className="h-4 w-4 text-accent" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0건</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            현재 활성화된 항목
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-card/40 backdrop-blur-xl border-border/40">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">최근 알림</CardTitle>
                        <TrendingUp className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">새로운 알림 없음</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            시스템 및 업무 업데이트
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
