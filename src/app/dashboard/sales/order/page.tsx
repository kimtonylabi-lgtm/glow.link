import { createClient } from '@/lib/supabase/server'
import { QuotationForm } from './quotation-form'
import { QuotationList } from './quotation-list'
import { OrderList } from './order-list'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, ShoppingCart, Truck } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function OrderPage() {
    const supabase = await createClient()

    // 1. Fetch Quotations
    const { data: quotationsData } = await (supabase
        .from('quotations' as any) as any)
        .select(`
            *,
            clients (company_name)
        `)
        .eq('is_current', true)
        .order('created_at', { ascending: false })

    // 2. Fetch Orders
    const { data: ordersData } = await supabase
        .from('orders')
        .select(`
            *,
            clients (company_name),
            profiles (full_name)
        `)
        .order('created_at', { ascending: false })

    // 3. Fetch Master Data for Form
    const { data: clients } = await supabase.from('clients').select('id, company_name').eq('status', 'active')
    const { data: products } = await supabase.from('products').select('*')
    const { data: clientProducts } = await (supabase.from('client_products' as any) as any).select('*')

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id || '').single()
    const userRole = profile?.role || 'sales'

    const quotations = quotationsData || []
    const orders = ordersData || []

    return (
        <div className="p-4 md:p-6 lg:p-8 relative min-h-[80vh] space-y-6">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 relative z-10">
                <div>
                    <h2 className="text-3xl font-black tracking-tight bg-gradient-to-r from-primary via-primary/80 to-primary/40 bg-clip-text text-transparent">
                        수주 / 매출 관리 파이프라인
                    </h2>
                    <p className="text-muted-foreground text-sm mt-1">견적부터 수주, 납품까지 영업의 전체 흐름을 한눈에 관리합니다.</p>
                </div>

                <div className="flex items-center gap-3">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button className="h-11 px-6 font-bold shadow-[0_0_20px_theme(colors.primary.DEFAULT)/30] rounded-xl hover:shadow-[0_0_25px_theme(colors.primary.DEFAULT)/50] transition-all">
                                <Plus className="w-5 h-5 mr-2" />
                                신규 견적 작성
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="w-full sm:max-w-[900px] overflow-y-auto bg-card/95 backdrop-blur-3xl border-l-primary/20">
                            <SheetHeader className="mb-8">
                                <SheetTitle className="text-2xl font-black text-primary">신규 견적서 발행</SheetTitle>
                            </SheetHeader>
                            <QuotationForm
                                clients={clients || []}
                                products={products || []}
                                clientProducts={clientProducts || []}
                            />
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            <Tabs defaultValue="quotation" className="w-full relative z-10">
                <TabsList className="bg-card/50 border border-border/40 p-1 h-14 rounded-2xl mb-6 backdrop-blur-md">
                    <TabsTrigger value="quotation" className="flex-1 rounded-xl h-full data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all font-bold gap-2">
                        <FileText className="w-4 h-4" /> 견적 관리
                    </TabsTrigger>
                    <TabsTrigger value="order" className="flex-1 rounded-xl h-full data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all font-bold gap-2">
                        <ShoppingCart className="w-4 h-4" /> 수주 관리
                    </TabsTrigger>
                    <TabsTrigger value="delivery" className="flex-1 rounded-xl h-full data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all font-bold gap-2">
                        <Truck className="w-4 h-4" /> 납기 관리
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="quotation" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <QuotationList quotations={quotations} />
                </TabsContent>

                <TabsContent value="order" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <OrderList orders={orders} userRole={userRole} />
                </TabsContent>

                <TabsContent value="delivery" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="p-20 text-center rounded-3xl border border-dashed border-border/40 bg-muted/5">
                        <Truck className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p className="text-muted-foreground font-medium">납기 관리 데이터 로딩 중...</p>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
