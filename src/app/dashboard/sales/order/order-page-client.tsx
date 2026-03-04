'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, ShoppingCart, Truck } from 'lucide-react'
import { QuotationFormSheet } from './quotation-form-sheet'

type OrderPageClientProps = {
    activeTab: string
    clients: { id: string; company_name: string }[]
    products: Record<string, unknown>[]
    clientProducts: Record<string, unknown>[]
    quotationContent: React.ReactNode
    orderContent: React.ReactNode
    deliveryContent: React.ReactNode
}

export function OrderPageClient({
    activeTab,
    clients,
    products,
    clientProducts,
    quotationContent,
    orderContent,
    deliveryContent
}: OrderPageClientProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()

    const handleTabChange = (value: string) => {
        startTransition(() => {
            const params = new URLSearchParams(searchParams.toString())
            params.set('tab', value)
            params.delete('page') // Reset page on tab change
            // Replace instead of Push, and scroll: false to prevent flickering
            router.replace(`${pathname}?${params.toString()}`, { scroll: false })
        })
    }

    const tabInfo = {
        quotation: {
            title: '견적 관리 (Quotation Master)',
            desc: '등록된 모든 견적(Quotation)의 진행 상태와 금액을 마스터 단위로 관리합니다.'
        },
        order: {
            title: '수주 현황 (Order Master)',
            desc: '등록된 모든 수주(Order)의 진행 상태와 총액을 마스터 단위로 관리합니다.'
        },
        delivery: {
            title: '납기 현황 (Delivery Master)',
            desc: '등록된 모든 납기(Delivery) 및 출하/배차 상태를 관리합니다.'
        }
    }
    const currentTabInfo = tabInfo[activeTab as keyof typeof tabInfo] || tabInfo.order

    return (
        <>
            {/* Loading Indicator */}
            {isPending && (
                <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40 animate-pulse z-50 shadow-[0_0_10px_theme(colors.primary.DEFAULT)]" />
            )}
            <div className={`flex flex-col space-y-6 transition-opacity duration-300 ${isPending ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                {/* Header Area */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 relative z-10 w-full">
                    <div>
                        <h2 className="text-3xl font-black tracking-tight bg-gradient-to-r from-primary via-primary/80 to-primary/40 bg-clip-text text-transparent transition-all">
                            {currentTabInfo.title}
                        </h2>
                        <p className="text-muted-foreground text-sm mt-1 transition-all">{currentTabInfo.desc}</p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* 조건부 렌더링: URL이 확실히 quotation일 때만 렌더링되므로 탭 이동 시 즉각 삭제됨 */}
                        {activeTab === 'quotation' && (
                            <QuotationFormSheet
                                clients={clients}
                                products={products}
                                clientProducts={clientProducts}
                            />
                        )}
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full relative z-10">
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

                    <TabsContent value="quotation" className="animate-in fade-in slide-in-from-bottom-4 duration-500 m-0">
                        {quotationContent}
                    </TabsContent>

                    <TabsContent value="order" className="animate-in fade-in slide-in-from-bottom-4 duration-500 m-0">
                        {orderContent}
                    </TabsContent>

                    <TabsContent value="delivery" className="animate-in fade-in slide-in-from-bottom-4 duration-500 m-0">
                        {deliveryContent}
                    </TabsContent>
                </Tabs>
            </div>
        </>
    )
}
