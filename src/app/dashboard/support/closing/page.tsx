import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Construction } from "lucide-react"

export default function SupportClosingPage() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] p-8 text-center animate-in fade-in duration-500">
            <Card className="bg-card/40 backdrop-blur-xl border border-border/40 max-w-md w-full">
                <CardHeader>
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/20">
                        <Construction className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">준비 중인 기능입니다</CardTitle>
                    <CardDescription>
                        매출 마감 (Sales Closing) 모듈은 현재 기획 단계에 있습니다.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        전자세금계산서 및 ERP 연동 기능과 함께 추후 오픈될 예정입니다.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
