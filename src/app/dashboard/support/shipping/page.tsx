import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Construction } from "lucide-react"

export default function SupportShippingPage() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] p-8 text-center animate-in fade-in duration-500">
            <Card className="bg-card/40 backdrop-blur-xl border border-border/40 max-w-md w-full">
                <CardHeader>
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/20">
                        <Construction className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">준비 중인 기능입니다</CardTitle>
                    <CardDescription>
                        출하 지시 (Shipping) 관리 모듈은 추후 업데이트를 통해 추가됩니다.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        물류 연동 API 명세서 확정 후 개발이 진행될 예정입니다.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
