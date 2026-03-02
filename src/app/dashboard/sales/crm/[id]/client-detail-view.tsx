'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Building2,
    ShoppingCart,
    TestTube2,
    History,
    User,
    Users,
    Phone,
    Mail,
    MapPin,
    ChevronRight,
    ArrowLeft,
    Clock,
    FileText,
    ExternalLink,
    Loader2
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { getClientOrders, getClientSamples, getClientHistory } from '../actions'
import { toast } from 'sonner'

interface Props {
    initialClient: any
}

export function ClientDetailView({ initialClient }: Props) {
    const [activeTab, setActiveTab] = useState('info')
    const [orders, setOrders] = useState<any[]>([])
    const [samples, setSamples] = useState<any[]>([])
    const [history, setHistory] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (activeTab === 'orders') fetchOrders()
        if (activeTab === 'samples') fetchSamples()
        if (activeTab === 'history') fetchHistory()
    }, [activeTab])

    const fetchOrders = async () => {
        setIsLoading(true)
        const res = await getClientOrders(initialClient.id)
        if (res.success) setOrders(res.data)
        setIsLoading(false)
    }

    const fetchSamples = async () => {
        setIsLoading(true)
        const res = await getClientSamples(initialClient.id)
        if (res.success) setSamples(res.data)
        setIsLoading(false)
    }

    const fetchHistory = async () => {
        setIsLoading(true)
        const res = await getClientHistory(initialClient.id)
        if (res.success) setHistory(res.data)
        setIsLoading(false)
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="rounded-full">
                        <Link href="/dashboard/sales/crm">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black tracking-tighter break-keep">
                                {initialClient.company_name}
                            </h1>
                            <Badge className={cn(
                                "font-black",
                                initialClient.tier === 'S' ? "bg-amber-500" :
                                    initialClient.tier === 'A' ? "bg-purple-500" :
                                        "bg-blue-500"
                            )}>
                                Tier {initialClient.tier}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground font-medium mt-1">고객사 360도 통합 관리 뷰</p>
                    </div>
                </div>
            </div>

            {/* Main Tabs UI */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-2 md:grid-cols-4 h-auto p-1 bg-card/40 backdrop-blur-xl border border-border/40 rounded-2xl">
                    <TabsTrigger value="info" className="rounded-xl py-3 font-bold gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <Building2 className="h-4 w-4" /> 기본 정보
                    </TabsTrigger>
                    <TabsTrigger value="orders" className="rounded-xl py-3 font-bold gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <ShoppingCart className="h-4 w-4" /> 수주 이력
                    </TabsTrigger>
                    <TabsTrigger value="samples" className="rounded-xl py-3 font-bold gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <TestTube2 className="h-4 w-4" /> 샘플 이력
                    </TabsTrigger>
                    <TabsTrigger value="history" className="rounded-xl py-3 font-bold gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <History className="h-4 w-4" /> 히스토리
                    </TabsTrigger>
                </TabsList>

                {/* Tab Content 1: Basic Info */}
                <TabsContent value="info" className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="md:col-span-2 bg-card/40 backdrop-blur-xl border-border/40 rounded-3xl overflow-hidden">
                            <CardHeader>
                                <CardTitle className="text-lg font-black flex items-center gap-2">
                                    <Building2 className="h-5 w-5 text-primary" /> 고객사 프로필
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest block mb-1">사업자 번호</label>
                                        <p className="font-mono font-bold">{initialClient.business_number || '미등록'}</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest block mb-1">상태</label>
                                        <Badge variant={initialClient.status === 'active' ? 'default' : 'secondary'}>
                                            {initialClient.status === 'active' ? '정상 거래중' : '거래 중지'}
                                        </Badge>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest block mb-1">주소</label>
                                        <p className="text-sm font-medium leading-relaxed">{initialClient.address || '주소 정보가 없습니다.'}</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest block mb-1">내부 담당자</label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                                                <User className="h-4 w-4 text-primary" />
                                            </div>
                                            <span className="font-bold">{initialClient.managed_by_profile?.full_name || '미배정'}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest block mb-1">노트 / 메모</label>
                                        <p className="text-sm text-muted-foreground italic leading-relaxed">
                                            {initialClient.memo || '고객사에 대한 메모가 없습니다.'}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-primary via-primary/80 to-blue-600 border-none rounded-3xl overflow-hidden text-primary-foreground shadow-2xl shadow-primary/20">
                            <CardHeader>
                                <CardTitle className="text-lg font-black flex items-center gap-2">
                                    <Users className="h-5 w-5" /> 고객사 담당자
                                </CardTitle>
                                <CardDescription className="text-primary-foreground/70 font-medium">연락 가능한 주요 파트너 목록</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {initialClient.contacts && initialClient.contacts.length > 0 ? (
                                    initialClient.contacts.map((contact: any) => (
                                        <div key={contact.id} className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 space-y-2 group hover:bg-white/20 transition-all">
                                            <div className="flex justify-between items-start">
                                                <div className="font-black text-sm">{contact.name} <span className="text-[10px] opacity-60 font-normal ml-1">{contact.position}</span></div>
                                                {contact.is_primary && <Badge className="bg-amber-400 text-amber-950 text-[9px] px-1.5 h-4">주담당자</Badge>}
                                            </div>
                                            <div className="flex items-center gap-2 text-[11px] opacity-80">
                                                <Phone className="h-3 w-3" /> {contact.phone}
                                            </div>
                                            <div className="flex items-center gap-2 text-[11px] opacity-80">
                                                <Mail className="h-3 w-3" /> {contact.email}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-6 opacity-60 italic text-sm">등록된 담당자가 없습니다.</div>
                                )}
                                <Button variant="secondary" size="sm" className="w-full rounded-xl font-black text-xs h-10 mt-2">
                                    담당자 추가하기
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Tab Content 2: Orders */}
                <TabsContent value="orders" className="mt-6">
                    <Card className="bg-card/40 backdrop-blur-xl border-border/40 rounded-3xl overflow-hidden min-h-[400px]">
                        <CardHeader>
                            <CardTitle className="text-xl font-black flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <ShoppingCart className="h-6 w-6 text-primary" /> 수주 이력
                                </div>
                                <span className="text-sm font-mono text-muted-foreground">{orders.length} 건</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary/30" /></div>
                            ) : orders.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {orders.map((order) => (
                                        <div key={order.id} className="p-5 rounded-2xl bg-muted/20 border border-border/20 hover:border-primary/40 transition-all group relative">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="space-y-1">
                                                    <div className="text-[10px] font-black text-primary uppercase tracking-widest">Order ID: {order.id.slice(0, 8)}</div>
                                                    <div className="font-black text-lg">₩ {order.total_amount.toLocaleString()}</div>
                                                </div>
                                                <Badge variant={order.status === 'shipped' ? 'default' : 'secondary'} className="uppercase text-[9px] tracking-widest bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                                                    {order.status}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                                                <Clock className="h-3.5 w-3.5" /> {format(new Date(order.order_date), 'yyyy년 MM월 dd일')}
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-border/20 flex justify-between items-center">
                                                <span className="text-[10px] text-muted-foreground">Detailed Info</span>
                                                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-3">
                                    <ShoppingCart className="h-12 w-12 opacity-20" />
                                    <p className="font-bold">수주 이력이 존재하지 않습니다.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab Content 3: Samples */}
                <TabsContent value="samples" className="mt-6">
                    <Card className="bg-card/40 backdrop-blur-xl border-border/40 rounded-3xl overflow-hidden min-h-[400px]">
                        <CardHeader>
                            <CardTitle className="text-xl font-black flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <TestTube2 className="h-6 w-6 text-primary" /> 샘플 요청 이력
                                </div>
                                <span className="text-sm font-mono text-muted-foreground">{samples.length} 건</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary/30" /></div>
                            ) : samples.length > 0 ? (
                                <div className="space-y-4">
                                    {samples.map((sample) => (
                                        <div key={sample.id} className="flex items-center justify-between p-5 rounded-2xl bg-muted/20 border border-border/20 hover:bg-muted/30 transition-all">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0 text-primary">
                                                    <TestTube2 className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <div className="font-black text-base">{sample.product_name}</div>
                                                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                                                        <span className="font-bold">{sample.quantity}개 요청</span>
                                                        <span className="opacity-40">|</span>
                                                        <span>{format(new Date(sample.request_date), 'yyyy. MM. dd')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <Badge className={cn(
                                                    "uppercase text-[9px] tracking-widest",
                                                    sample.status === 'shipped' ? "bg-blue-500" : "bg-amber-500"
                                                )}>
                                                    {sample.status}
                                                </Badge>
                                                <Button variant="ghost" size="icon" className="rounded-full">
                                                    <ExternalLink className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-3">
                                    <TestTube2 className="h-12 w-12 opacity-20" />
                                    <p className="font-bold">샘플 요청 이력이 존재하지 않습니다.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab Content 4: History (Timeline) */}
                <TabsContent value="history" className="mt-6">
                    <Card className="bg-card/40 backdrop-blur-xl border-border/40 rounded-3xl overflow-hidden min-h-[400px]">
                        <CardHeader>
                            <CardTitle className="text-xl font-black flex items-center gap-2">
                                <History className="h-6 w-6 text-primary" /> 변경 히스토리 (Timeline)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary/30" /></div>
                            ) : history.length > 0 ? (
                                <div className="relative border-l-2 border-border/40 ml-4 md:ml-6 pl-8 space-y-10 pb-10">
                                    {history.map((log) => (
                                        <div key={log.id} className="relative group">
                                            {/* dot */}
                                            <div className="absolute -left-[41px] top-1.5 w-6 h-6 rounded-full bg-card border-2 border-primary flex items-center justify-center z-10 group-hover:scale-110 transition-transform">
                                                <div className="w-2 h-2 rounded-full bg-primary" />
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                                                    <span className="text-xs font-black font-mono text-muted-foreground bg-muted p-1 px-2 rounded-lg">
                                                        {format(new Date(log.created_at), 'yyyy. MM. dd HH:mm')}
                                                    </span>
                                                    <Badge variant="outline" className="text-[9px] px-1.5 h-4 border-primary/30 text-primary font-black uppercase tracking-widest">
                                                        {log.log_type.replace('_', ' ')}
                                                    </Badge>
                                                </div>
                                                <div className="p-4 rounded-2xl bg-card border border-border/40 shadow-sm">
                                                    <p className="text-sm font-medium leading-relaxed">{log.content}</p>
                                                    <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest">
                                                        <User className="h-3 w-3" /> Performed by: {log.performer?.full_name || 'System'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-3">
                                    <Clock className="h-12 w-12 opacity-20" />
                                    <p className="font-bold">기록된 히스토리가 아직 없습니다.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
