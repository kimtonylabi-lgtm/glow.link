'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { CustomBadge } from '@/components/ui/custom-badge'
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
    Loader2,
    Star
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { getClientOrders, getClientSamples, getClientHistory } from '../actions'
import { toast } from 'sonner'
import { OrderList } from '../../order/order-list'
import Link from 'next/link'

interface Props {
    initialClient: any
}

export function ClientDetailView({ initialClient }: Props) {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState('info')
    const [orders, setOrders] = useState<any[]>([])
    const [samples, setSamples] = useState<any[]>([])
    const [history, setHistory] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const userRole = 'sales' // Standard role for this view

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

    const primaryContact = initialClient.contacts?.find((c: any) => c.is_primary) || initialClient.contacts?.[0]

    return (
        <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto w-full">
            {/* Page Header (Standalone Version) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="rounded-full hover:bg-white/10 shrink-0">
                        <Link href="/dashboard/sales/crm">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black tracking-tighter break-keep">
                                {initialClient.company_name}
                            </h1>
                            <div className="flex items-center gap-2">
                                <CustomBadge variant={initialClient.tier} />
                                <CustomBadge variant={initialClient.status === 'active' ? 'active' : 'inactive'} />
                            </div>
                        </div>
                        <p className="text-muted-foreground font-medium mt-1">고객사 360도 통합 관리 뷰</p>
                    </div>
                </div>
            </div>

            {/* Main Content Area with Fixed Height & Isolated Scroll */}
            <div className="bg-card/20 backdrop-blur-xl border border-border/40 rounded-3xl overflow-hidden shadow-sm h-[85vh] md:h-[800px] flex flex-col">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col overflow-hidden">
                    {/* Integrated Tab Header (Sticky & Stable) */}
                    <div className="pt-6 px-6 border-b border-border/40 bg-card/60 backdrop-blur-3xl sticky top-0 z-20">
                        <TabsList className="flex h-10 p-1 bg-muted/40 border border-border/40 rounded-xl w-fit mb-4">
                            <TabsTrigger value="info" className="rounded-lg text-[11px] h-8 font-black gap-1.5 px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                기본 정보
                            </TabsTrigger>
                            <TabsTrigger value="orders" className="rounded-lg text-[11px] h-8 font-black gap-1.5 px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                수주 이력
                            </TabsTrigger>
                            <TabsTrigger value="samples" className="rounded-lg text-[11px] h-8 font-black gap-1.5 px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                샘플 이력
                            </TabsTrigger>
                            <TabsTrigger value="history" className="rounded-lg text-[11px] h-8 font-black gap-1.5 px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                히스토리
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Isolated Scroll Area */}
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                        {/* Tab Content 1: Basic Info */}
                        <TabsContent value="info" className="mt-0 h-full w-full space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Card className="md:col-span-2 bg-card/40 border-border/40 rounded-2xl overflow-hidden shadow-sm">
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
                                                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest block mb-1">주 담당자</label>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                                                        <User className="h-4 w-4 text-primary" />
                                                    </div>
                                                    <span className="font-bold">{primaryContact?.name || '미배정'} {primaryContact?.position && `(${primaryContact.position})`}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest block mb-1">주소</label>
                                                <p className="text-sm font-medium leading-relaxed">{initialClient.address || '주소 정보가 없습니다.'}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <InfoSubItem label="연락처" value={primaryContact?.phone} icon={<Phone className="h-3.5 w-3.5" />} />
                                            <InfoSubItem label="이메일" value={primaryContact?.email} icon={<Mail className="h-3.5 w-3.5" />} />
                                            <div>
                                                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest block mb-1">노트 / 메모</label>
                                                <p className="text-sm text-muted-foreground italic leading-relaxed">
                                                    {initialClient.memo || '기록된 메모가 없습니다.'}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-slate-900 border-none rounded-2xl overflow-hidden text-slate-100 shadow-xl">
                                    <CardHeader>
                                        <CardTitle className="text-lg font-black flex items-center gap-2">
                                            <Users className="h-5 w-5 text-emerald-400" /> 담당자 목록
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar p-6 pt-0">
                                        {initialClient.contacts && initialClient.contacts.length > 0 ? (
                                            initialClient.contacts.map((contact: any) => (
                                                <div key={contact.id} className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2 group hover:bg-white/10 transition-all">
                                                    <div className="flex justify-between items-start">
                                                        <div className="font-black text-sm text-white">{contact.name} <span className="text-[10px] opacity-60 font-normal ml-1">{contact.position}</span></div>
                                                        {contact.is_primary && <Badge className="bg-emerald-500 text-emerald-950 text-[8px] h-4 font-black">주담당자</Badge>}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                                            <Phone className="h-3 w-3" /> {contact.phone || '-'}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                                                            <Mail className="h-3 w-3" /> {contact.email || '-'}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-6 opacity-40 italic text-sm">등록된 담당자가 없습니다.</div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* Tab Content 2: Orders (Sync with Optimized Table) */}
                        <TabsContent value="orders" className="mt-0 h-full w-full">
                            <div className="bg-card/30 border border-border/40 rounded-2xl overflow-hidden shadow-sm">
                                {isLoading ? (
                                    <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary/30" /></div>
                                ) : (
                                    <OrderList
                                        orders={orders}
                                        userRole={userRole}
                                        viewMode="customer"
                                    />
                                )}
                            </div>
                        </TabsContent>

                        {/* Tab Content 3: Samples */}
                        <TabsContent value="samples" className="mt-0 h-full w-full">
                            <div className="space-y-3">
                                {isLoading ? (
                                    <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary/30" /></div>
                                ) : samples.length > 0 ? (
                                    samples.map((sample) => (
                                        <div key={sample.id} className="p-5 rounded-2xl bg-muted/20 border border-border/20 hover:bg-muted/30 transition-all flex items-center justify-between shadow-sm">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-600">
                                                    <TestTube2 className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <div className="font-black text-base">{sample.product_name}</div>
                                                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2 font-bold">
                                                        <span>{sample.quantity}개 요청</span>
                                                        <span className="opacity-40">|</span>
                                                        <span>{format(new Date(sample.request_date), 'yyyy. MM. dd')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Badge className={cn(
                                                "uppercase text-[9px] tracking-widest px-2 h-5",
                                                sample.status === 'shipped' ? "bg-blue-500" : "bg-amber-500"
                                            )}>
                                                {sample.status}
                                            </Badge>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/30 space-y-3">
                                        <TestTube2 className="h-12 w-12 opacity-10" />
                                        <p className="font-bold">샘플 요청 이력이 없습니다.</p>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        {/* Tab Content 4: History */}
                        <TabsContent value="history" className="mt-0 h-full w-full pb-10">
                            {isLoading ? (
                                <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary/30" /></div>
                            ) : history.length > 0 ? (
                                <div className="relative border-l-2 border-border/40 ml-4 md:ml-6 pl-8 space-y-10 pb-10 mt-6">
                                    {history.map((log) => (
                                        <div key={log.id} className="relative group">
                                            <div className="absolute -left-[41px] top-1.5 w-6 h-6 rounded-full bg-card border-2 border-primary flex items-center justify-center z-10 group-hover:scale-110 transition-transform shadow-sm">
                                                <div className="w-2 h-2 rounded-full bg-primary" />
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs font-black font-mono text-muted-foreground bg-muted p-1 px-2 rounded-lg">
                                                        {format(new Date(log.created_at), 'yyyy. MM. dd HH:mm')}
                                                    </span>
                                                    <Badge variant="outline" className="text-[9px] px-1.5 h-4 border-primary/30 text-primary font-black uppercase tracking-widest">
                                                        {log.log_type.replace('_', ' ')}
                                                    </Badge>
                                                </div>
                                                <div className="p-4 rounded-2xl bg-card border border-border/40 shadow-sm group-hover:bg-muted/5 transition-colors">
                                                    <p className="text-sm font-medium leading-relaxed">{log.content}</p>
                                                    <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest">
                                                        <User className="h-3 w-3" /> {log.performer?.full_name || 'System'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/30 space-y-3">
                                    <Clock className="h-12 w-12 opacity-10" />
                                    <p className="font-bold">기록된 히스토리가 없습니다.</p>
                                </div>
                            )}
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </div>
    )
}

function InfoSubItem({ label, value, icon }: { label: string; value: string | null; icon: React.ReactNode }) {
    return (
        <div>
            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest block mb-1">{label}</label>
            <div className="flex items-center gap-2 text-sm font-bold">
                <span className="text-muted-foreground">{icon}</span>
                {value || '미등록'}
            </div>
        </div>
    )
}
