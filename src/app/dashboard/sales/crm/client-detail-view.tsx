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
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { getClientDetail, getClientOrders, getClientSamples, getClientHistory } from './actions'
import { toast } from 'sonner'

interface Props {
    clientId: string | null
    onBack?: () => void // For mobile back navigation
}

export function ClientDetailView({ clientId, onBack }: Props) {
    const [client, setClient] = useState<any>(null)
    const [activeTab, setActiveTab] = useState('info')
    const [orders, setOrders] = useState<any[]>([])
    const [samples, setSamples] = useState<any[]>([])
    const [history, setHistory] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isDetailLoading, setIsDetailLoading] = useState(false)

    // Reset and fetch when ID changes
    useEffect(() => {
        if (!clientId) {
            setClient(null)
            return
        }
        fetchDetail()
        setActiveTab('info') // Reset tab when switching clients
    }, [clientId])

    useEffect(() => {
        if (!clientId || !client) return
        if (activeTab === 'orders') fetchOrders()
        if (activeTab === 'samples') fetchSamples()
        if (activeTab === 'history') fetchHistory()
    }, [activeTab, clientId, client])

    const fetchDetail = async () => {
        if (!clientId) return
        setIsDetailLoading(true)
        const res = await getClientDetail(clientId)
        if (res.success) {
            setClient(res.data)
        } else {
            toast.error('고객 정보를 불러오지 못했습니다.', {
                description: res.error
            })
        }
        setIsDetailLoading(false)
    }

    const fetchOrders = async () => {
        if (!clientId) return
        setIsLoading(true)
        const res = await getClientOrders(clientId)
        if (res.success) {
            setOrders(res.data)
        } else {
            toast.error('수주 이력을 불러오지 못했습니다.', { description: res.error })
        }
        setIsLoading(false)
    }

    const fetchSamples = async () => {
        if (!clientId) return
        setIsLoading(true)
        const res = await getClientSamples(clientId)
        if (res.success) {
            setSamples(res.data)
        } else {
            toast.error('샘플 이력을 불러오지 못했습니다.', { description: res.error })
        }
        setIsLoading(false)
    }

    const fetchHistory = async () => {
        if (!clientId) return
        setIsLoading(true)
        const res = await getClientHistory(clientId)
        if (res.success) {
            setHistory(res.data)
        } else {
            toast.error('히스토리를 불러오지 못했습니다.', { description: res.error })
        }
        setIsLoading(false)
    }

    if (!clientId) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center animate-in fade-in duration-500">
                <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mb-6 border border-border/50">
                    <Building2 className="w-10 h-10 opacity-20" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">고객사를 선택하세요</h3>
                <p className="max-w-[280px] text-sm leading-relaxed opacity-60">
                    좌측 리스트에서 고객사를 선택하시면 360도 통합 상세 정보를 이곳에서 확인할 수 있습니다.
                </p>
            </div>
        )
    }

    if (isDetailLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
            </div>
        )
    }

    if (!client) return null

    return (
        <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-500 overflow-hidden bg-card/10 backdrop-blur-md">
            {/* Page Header (Internal) */}
            <div className="p-6 border-b border-border/40 bg-card/40 backdrop-blur-xl sticky top-0 z-20 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {onBack && (
                        <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    )}
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-black tracking-tighter break-keep">
                                {client.company_name}
                            </h1>
                            <Badge className={cn(
                                "font-black text-[10px] h-5",
                                client.tier === 'S' ? "bg-amber-500" :
                                    client.tier === 'A' ? "bg-purple-500" :
                                        "bg-blue-500"
                            )}>
                                Tier {client.tier}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground font-medium">{client.business_number || 'No Business No.'}</span>
                            <span className="w-1 h-1 rounded-full bg-border" />
                            <span className={cn("text-[10px] font-bold uppercase tracking-widest", client.status === 'active' ? "text-green-500" : "text-muted-foreground")}>
                                {client.status === 'active' ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid grid-cols-4 h-11 p-1 bg-muted/40 border border-border/40 rounded-xl mb-6">
                        <TabsTrigger value="info" className="rounded-lg text-xs font-bold gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            <Building2 className="h-3.5 w-3.5" /> 정보
                        </TabsTrigger>
                        <TabsTrigger value="orders" className="rounded-lg text-xs font-bold gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            <ShoppingCart className="h-3.5 w-3.5" /> 수주
                        </TabsTrigger>
                        <TabsTrigger value="samples" className="rounded-lg text-xs font-bold gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            <TestTube2 className="h-3.5 w-3.5" /> 샘플
                        </TabsTrigger>
                        <TabsTrigger value="history" className="rounded-lg text-xs font-bold gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            <History className="h-3.5 w-3.5" /> 기록
                        </TabsTrigger>
                    </TabsList>

                    {/* Tab Contents */}
                    <TabsContent value="info" className="mt-0 space-y-6">
                        <div className="grid grid-cols-1 gap-6">
                            <Card className="bg-card/40 border-border/40 rounded-2xl overflow-hidden shadow-sm">
                                <CardHeader className="pb-3 text-primary">
                                    <CardTitle className="text-sm font-black flex items-center gap-2">
                                        <Building2 className="h-4 w-4" /> 상세 프로필
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-[0.2em] block mb-1">본사 주소</label>
                                            <p className="text-sm font-medium leading-relaxed flex items-start gap-2">
                                                <MapPin className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                                                {client.address || '주소 정보가 없습니다.'}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-[0.2em] block mb-1">내부 전담 매니저</label>
                                            <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-lg border border-border/30 w-fit">
                                                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                                                    <User className="h-3 w-3 text-primary" />
                                                </div>
                                                <span className="text-xs font-bold">{client.managed_by_profile?.full_name || '미배정'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-[0.2em] block mb-1">비고 / 참고사항</label>
                                            <div className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl min-h-[80px]">
                                                <p className="text-xs text-muted-foreground italic leading-relaxed">
                                                    {client.memo || '특이사항이 기록되지 않았습니다.'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-none rounded-2xl overflow-hidden text-slate-100 shadow-lg">
                                <CardHeader className="pb-3 text-emerald-400">
                                    <CardTitle className="text-sm font-black flex items-center gap-2">
                                        <Users className="h-4 w-4" /> 외부 파트너 담당자
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {client.contacts && client.contacts.length > 0 ? (
                                        client.contacts.map((contact: any) => (
                                            <div key={contact.id} className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-2 group hover:bg-white/10 transition-all">
                                                <div className="flex justify-between items-start">
                                                    <div className="font-bold text-xs">{contact.name} <span className="text-[10px] text-slate-400 font-normal ml-1">{contact.position}</span></div>
                                                    {contact.is_primary && <Badge className="bg-emerald-500 text-white text-[8px] px-1 h-3.5">PRIMARY</Badge>}
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                                        <Phone className="h-2.5 w-2.5" /> {contact.phone}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                                        <Mail className="h-2.5 w-2.5" /> {contact.email}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-span-2 text-center py-6 opacity-40 italic text-[10px]">등록된 담당자가 없습니다.</div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="orders" className="mt-0">
                        <div className="space-y-3">
                            {isLoading ? (
                                <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary/30" /></div>
                            ) : orders.length > 0 ? (
                                orders.map((order) => (
                                    <div key={order.id} className="p-4 rounded-xl bg-card border border-border/40 hover:border-primary/30 transition-all group flex items-center justify-between shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 border border-emerald-500/20">
                                                <ShoppingCart className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <div className="text-[9px] font-black text-muted-foreground tracking-tighter uppercase mb-0.5">Order No. {order.id.slice(0, 8)}</div>
                                                <div className="text-sm font-black">₩ {order.total_amount.toLocaleString()}</div>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-1.5">
                                            <Badge variant="outline" className="text-[9px] h-4 px-1 border-emerald-500/30 text-emerald-600 bg-emerald-500/5">
                                                {order.status.toUpperCase()}
                                            </Badge>
                                            <span className="text-[9px] text-muted-foreground font-medium">{format(new Date(order.order_date), 'yyyy.MM.dd')}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/40 space-y-2">
                                    <ShoppingCart className="h-10 w-10 opacity-10" />
                                    <p className="text-xs font-bold tracking-tight">수주 이력이 없습니다.</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="samples" className="mt-0">
                        <div className="space-y-3">
                            {isLoading ? (
                                <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary/30" /></div>
                            ) : samples.length > 0 ? (
                                samples.map((sample) => (
                                    <div key={sample.id} className="p-4 rounded-xl bg-card border border-border/40 hover:bg-muted/30 transition-all flex items-center justify-between shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 border border-blue-500/20">
                                                <TestTube2 className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-black">{sample.product_name}</div>
                                                <div className="text-[10px] text-muted-foreground font-bold mt-0.5">
                                                    {sample.quantity} EA <span className="mx-1 opacity-30">|</span> {format(new Date(sample.request_date), 'yyyy. MM. dd')}
                                                </div>
                                            </div>
                                        </div>
                                        <Badge className={cn(
                                            "text-[9px] h-4 px-1 tracking-tight",
                                            sample.status === 'shipped' ? "bg-blue-500/80" : "bg-amber-500/80"
                                        )}>
                                            {sample.status}
                                        </Badge>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/40 space-y-2">
                                    <TestTube2 className="h-10 w-10 opacity-10" />
                                    <p className="text-xs font-bold tracking-tight">요청 내역이 없습니다.</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="history" className="mt-0 pb-10">
                        {isLoading ? (
                            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary/30" /></div>
                        ) : history.length > 0 ? (
                            <div className="relative border-l border-border/60 ml-3 pl-6 space-y-8 mt-2">
                                {history.map((log) => (
                                    <div key={log.id} className="relative group">
                                        <div className="absolute -left-[30.5px] top-1.5 w-2 h-2 rounded-full bg-primary ring-4 ring-background" />
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black font-mono text-muted-foreground">
                                                    {format(new Date(log.created_at), 'yyyy.MM.dd HH:mm')}
                                                </span>
                                                <Badge variant="outline" className="text-[8px] h-3.5 px-1 border-primary/20 text-primary/70 font-black tracking-widest uppercase">
                                                    {log.log_type.replace('_', ' ')}
                                                </Badge>
                                            </div>
                                            <div className="p-3 rounded-xl bg-muted/20 border border-border/30">
                                                <p className="text-xs font-medium leading-relaxed">{log.content}</p>
                                                <p className="text-[9px] text-muted-foreground/40 mt-2 font-bold uppercase">
                                                    Managed by: {log.performer?.full_name || 'System'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/40 space-y-2">
                                <History className="h-10 w-10 opacity-10" />
                                <p className="text-xs font-bold tracking-tight">이력이 없습니다.</p>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
