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
import { getClientDetail, getClientOrders, getClientSamples, getClientHistory, setPrimaryContact } from './actions'
import { ContactFormModal } from './contact-form-modal'
import { toast } from 'sonner'
import { OrderList } from '../order/order-list'

interface Props {
    clientId: string | null
    onBack?: () => void // For mobile back navigation
}

export function ClientDetailView({ clientId, onBack }: Props) {
    const router = useRouter()
    const [client, setClient] = useState<any>(null)
    const [isContactModalOpen, setIsContactModalOpen] = useState(false)
    const [activeTab, setActiveTab] = useState('info')
    const [orders, setOrders] = useState<any[]>([])
    const [samples, setSamples] = useState<any[]>([])
    const [history, setHistory] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [userRole, setUserRole] = useState<string>('sales')
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

    const primaryContact = client.contacts?.find((c: any) => c.is_primary) || client.contacts?.[0]

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500 bg-card/10 backdrop-blur-md">
            {/* Compact Page Header with Tabs Integrated */}
            <div className="pt-6 px-6 border-b border-border/40 bg-card/60 backdrop-blur-3xl sticky top-0 md:top-0 z-20 overflow-visible">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
                    <div className="flex items-center gap-4">
                        {onBack && (
                            <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden rounded-full shrink-0">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        )}
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-black tracking-tighter break-keep text-foreground">
                                    {client.company_name}
                                </h1>
                                <div className="flex items-center gap-2">
                                    <CustomBadge variant={client.tier} />
                                    <CustomBadge variant={client.status === 'active' ? 'active' : 'inactive'} />
                                </div>
                            </div>
                            <p className="text-[11px] text-muted-foreground font-bold flex items-center gap-2">
                                <span className="text-foreground/60">{client.business_number || 'Business No.'}</span>
                                <span className="w-1 h-1 rounded-full bg-border" />
                                <span className="text-foreground/80">담당: {client.sales_person?.full_name || '미지정'}</span>
                            </p>
                        </div>
                    </div>

                    {/* Integrated Tab Menu */}
                    <TabsList className="flex h-10 p-1 bg-muted/40 border border-border/40 rounded-xl">
                        <TabsTrigger value="info" className="rounded-lg text-[11px] h-8 font-black gap-1.5 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            정보
                        </TabsTrigger>
                        <TabsTrigger value="contacts" className="rounded-lg text-[11px] h-8 font-black gap-1.5 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            담당자
                        </TabsTrigger>
                        <TabsTrigger value="orders" className="rounded-lg text-[11px] h-8 font-black gap-1.5 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            수주
                        </TabsTrigger>
                        <TabsTrigger value="samples" className="rounded-lg text-[11px] h-8 font-black gap-1.5 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            샘플
                        </TabsTrigger>
                        <TabsTrigger value="history" className="rounded-lg text-[11px] h-8 font-black gap-1.5 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            기록
                        </TabsTrigger>
                    </TabsList>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar pt-6">
                {/* Tab Contents */}
                <TabsContent value="info" className="mt-0 h-full w-full space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                        <Card className="bg-card/40 border-border/40 rounded-2xl overflow-hidden shadow-sm">
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-y-6 gap-x-8">
                                    <InfoItem
                                        label="고객사 담당자"
                                        value={primaryContact ? `${primaryContact.name}${primaryContact.position ? ` (${primaryContact.position})` : ''}` : '미등록'}
                                        icon={<User className="h-4 w-4" />}
                                        span2
                                    />
                                    <InfoItem
                                        label="연락처"
                                        value={primaryContact?.phone || '미등록'}
                                        icon={<Phone className="h-4 w-4" />}
                                        span2
                                    />
                                    <InfoItem
                                        label="이메일"
                                        value={primaryContact?.email || '미등록'}
                                        icon={<Mail className="h-4 w-4" />}
                                        span2
                                    />
                                    <InfoItem
                                        label="주소"
                                        value={client.address || '미등록'}
                                        icon={<MapPin className="h-4 w-4" />}
                                        span2
                                    />
                                    <InfoItem
                                        label="등록일"
                                        value={client.created_at ? format(new Date(client.created_at), 'yyyy-MM-dd') : '미등록'}
                                        icon={<Clock className="h-4 w-4" />}
                                    />

                                    <div className="col-span-full border-t border-border/10 pt-6 mt-2">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-[0.2em] block mb-2">비고 (메모)</label>
                                        <div className="bg-muted/10 border border-border/20 p-6 rounded-2xl min-h-[80px] shadow-inner text-pretty">
                                            <p className="text-[13px] text-foreground/80 leading-relaxed font-medium">
                                                {client.memo || '기록된 특이사항이 없습니다.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                    </div>
                </TabsContent>

                <TabsContent value="orders" className="mt-0 h-full w-full">
                    <div className="bg-card/30 border border-border/40 rounded-2xl overflow-hidden shadow-sm">
                        <div className="p-0">
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
                    </div>
                </TabsContent>

                <TabsContent value="samples" className="mt-0 h-full w-full">
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

                <TabsContent value="contacts" className="mt-0 h-full w-full space-y-4">
                    <Card className="bg-slate-900 border-none rounded-2xl overflow-hidden text-slate-100 shadow-xl">
                        <CardHeader className="pb-3 border-b border-white/5 bg-white/5 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-black flex items-center gap-2 text-emerald-400">
                                <Users className="h-4 w-4" /> 고객사 담당자 (External Contacts)
                            </CardTitle>
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 rounded-lg text-xs font-black"
                                onClick={() => setIsContactModalOpen(true)}
                            >
                                담당자 추가
                            </Button>
                        </CardHeader>
                        <CardContent className="p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {client.contacts && client.contacts.length > 0 ? (
                                client.contacts.map((contact: any) => (
                                    <div key={contact.id} className="p-5 rounded-3xl bg-white/5 border border-white/5 space-y-3 group hover:bg-white/10 transition-all shadow-sm relative overflow-hidden">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <div className="font-black text-base text-white flex items-center gap-2">
                                                    {contact.name}
                                                    {contact.is_primary && <Badge className="bg-emerald-500 text-slate-950 border-none text-[8px] h-4 font-black">PRIMARY</Badge>}
                                                </div>
                                                <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{contact.position || '직책 미지정'}</div>
                                            </div>
                                            {/* Primary Contact Toggle Button */}
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation()
                                                    if (contact.is_primary) return
                                                    const res = await setPrimaryContact(client.id, contact.id, contact.name)
                                                    if (res.success) {
                                                        // Re-fetch client data to sync info tab
                                                        const updated = await getClientDetail(client.id)
                                                        if (updated.success && updated.data) setClient(updated.data)
                                                        toast.success(`${contact.name} 을(를) 주 담당자로 지정했습니다.`)
                                                    } else {
                                                        toast.error('지정 실패', { description: res.error })
                                                    }
                                                }}
                                                className={cn(
                                                    "p-1.5 rounded-full transition-all",
                                                    contact.is_primary
                                                        ? "text-amber-400 cursor-default"
                                                        : "text-slate-600 hover:text-amber-400 hover:bg-white/10"
                                                )}
                                                title={contact.is_primary ? '현재 주 담당자' : '주 담당자로 지정'}
                                            >
                                                <Star className={cn("h-4 w-4", contact.is_primary && "fill-amber-400")} />
                                            </button>
                                        </div>
                                        <div className="space-y-2 pt-2 border-t border-white/5">
                                            <div className="flex items-center gap-3 text-xs text-slate-300 font-medium">
                                                <Phone className="h-3.5 w-3.5 text-slate-500" /> {contact.phone || '-'}
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-slate-300 font-medium">
                                                <Mail className="h-3.5 w-3.5 text-slate-500" /> {contact.email || '-'}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full text-center py-20 opacity-30 italic text-sm flex flex-col items-center gap-4">
                                    <Users className="h-12 w-12" />
                                    등록된 담당자가 없습니다. 상단의 버튼을 눌러 담당자를 추가하세요.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history" className="mt-0 h-full w-full pb-10">
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
                                                Action by: {log.performer?.full_name || 'System'}
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
            </div>

            <ContactFormModal
                clientId={clientId}
                isOpen={isContactModalOpen}
                onOpenChange={setIsContactModalOpen}
                onSuccess={() => {
                    // Refetch data or just refresh router
                    router.refresh()
                    fetchDetail() // Explicitly refetch detail to update standard contact list
                }}
            />
        </Tabs>
    )
}

function InfoItem({ label, value, icon, fullWidth = false, span2 = false }: { label: string; value: string | null | undefined; icon?: React.ReactNode; fullWidth?: boolean; span2?: boolean }) {
    return (
        <div className={cn(
            "space-y-1 group min-w-0 col-span-1",
            fullWidth && "col-span-full",
            span2 && "md:col-span-2"
        )}>
            <label className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-[0.2em] block truncate">
                {label}
            </label>
            <div className="flex items-center gap-2 min-w-0">
                {icon && <div className="p-1.5 rounded-lg bg-muted/40 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300 ring-1 ring-border/5 group-hover:ring-primary/20 shrink-0">{icon}</div>}
                <p className="text-[14px] font-black tracking-tight text-foreground/90 transition-colors group-hover:text-primary truncate whitespace-nowrap">
                    {value || '미등록'}
                </p>
            </div>
        </div>
    )
}
