'use client'

import { AlertCircle as AlertIcon, Phone, Crown, TrendingUp } from 'lucide-react'
import { ActivityWithRelations } from '@/types/crm'
import { SalesKanban } from '@/components/sales/SalesKanban'

interface Props {
    activities: ActivityWithRelations[]
    churnRiskClients?: any[]
    vipClients?: any[]
}

export function PlanningClient({ activities: initialActivities, churnRiskClients = [], vipClients = [] }: Props) {
    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10 px-4 pt-4 animate-in fade-in duration-700">
            {/* 1. Sales Pipeline Kanban (최상단 배치) */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-black tracking-tighter uppercase italic flex items-center gap-3">
                            <div className="w-2 h-8 bg-primary rounded-full" />
                            Sales Pipeline Kanban
                        </h2>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">영업 활동 기반의 파이프라인 단계별 현황</p>
                    </div>
                </div>

                <div className="bg-card/20 backdrop-blur-3xl rounded-[2.5rem] border border-border/40 p-1 shadow-2xl overflow-hidden min-h-[600px]">
                    <SalesKanban initialActivities={initialActivities} />
                </div>
            </div>

            {/* 2. 하단 심층 분석 패널: 이탈위험 + VIP ABC */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 이탈 위험 거래처 */}
                <div className="bg-card/40 backdrop-blur-xl border border-border/40 rounded-[2rem] overflow-hidden shadow-xl">
                    <div className="flex items-center gap-3 px-6 py-4 bg-orange-500/5 border-b border-orange-500/10">
                        <AlertIcon className="w-4 h-4 text-orange-500" />
                        <div>
                            <h3 className="font-black text-xs text-orange-500 uppercase tracking-wide">🚨 이탈 위험 거래처</h3>
                            <p className="text-[9px] text-muted-foreground/60 font-medium mt-0.5">최근 3개월 미발주</p>
                        </div>
                        <span className="ml-auto text-[10px] font-black bg-orange-500/10 text-orange-500 border border-orange-500/20 px-2 py-0.5 rounded-full">{churnRiskClients.length}개사</span>
                    </div>
                    <div className="divide-y divide-border/20 max-h-[400px] overflow-y-auto">
                        {churnRiskClients.length === 0 ? (
                            <div className="flex flex-col items-center py-12 text-muted-foreground opacity-30">
                                <p className="text-xs">이탈 위험 거래처가 없습니다 🎉</p>
                            </div>
                        ) : churnRiskClients.map((c: any) => (
                            <div key={c.id} className="flex items-center px-5 py-3 group hover:bg-muted/20 transition-colors">
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm text-slate-200 truncate">{c.company_name}</p>
                                    <p className="text-[11px] text-muted-foreground">{c.contact_person || '담당자 없음'} · {c.phone || '-'}</p>
                                </div>
                                <button
                                    className="shrink-0 ml-3 flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 transition-colors"
                                    onClick={() => window.location.href = `/dashboard/sales/activity?client_id=${c.id}`}
                                >
                                    <Phone className="w-3 h-3" /> 활동 기록
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* VIP ABC 분석표 */}
                <div className="bg-card/40 backdrop-blur-xl border border-border/40 rounded-[2rem] overflow-hidden shadow-xl">
                    <div className="flex items-center gap-3 px-6 py-4 bg-amber-500/5 border-b border-amber-500/10">
                        <Crown className="w-4 h-4 text-amber-400" />
                        <div>
                            <h3 className="font-black text-xs text-amber-400 uppercase tracking-wide">👑 VIP ABC 분석표</h3>
                            <p className="text-[9px] text-muted-foreground/60 font-medium mt-0.5">최근 1년 누적 매출 기준</p>
                        </div>
                        <span className="ml-auto text-[10px] font-black bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">TOP {vipClients.length}</span>
                    </div>
                    <div className="divide-y divide-border/20 max-h-[400px] overflow-y-auto">
                        {vipClients.length === 0 ? (
                            <div className="flex flex-col items-center py-12 text-muted-foreground opacity-30">
                                <TrendingUp className="w-6 h-6 mb-2 opacity-20" />
                                <p className="text-xs">최근 1년 수주 데이터가 없습니다</p>
                            </div>
                        ) : vipClients.map((c: any, idx: number) => {
                            const tier = idx < 3 ? { label: 'S', color: 'bg-yellow-400/20 text-yellow-400 border-yellow-400/30' }
                                : idx < Math.ceil(vipClients.length * 0.2) ? { label: 'A', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' }
                                    : idx < Math.ceil(vipClients.length * 0.5) ? { label: 'B', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' }
                                        : { label: 'C', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' }
                            return (
                                <div key={c.id} className="flex items-center px-5 py-3 hover:bg-muted/20 transition-colors">
                                    <span className="text-[10px] font-black text-muted-foreground/40 w-5 shrink-0">{idx + 1}</span>
                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border mx-2 shrink-0 ${tier.color}`}>{tier.label}</span>
                                    <p className="font-bold text-sm text-slate-200 flex-1 truncate">{c.company_name}</p>
                                    <p className="text-[11px] font-mono font-bold text-amber-400 shrink-0 ml-2">₩{c.annual_revenue.toLocaleString()}</p>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}
