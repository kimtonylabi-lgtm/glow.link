'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import React from "react"

interface ActivityTimelineProps {
    activities: {
        id: string
        type: string
        title: string
        clientName: string
        userName: string
        date: string
        content?: string
    }[]
}

const typeMap: Record<string, { label: string; color: string }> = {
    'meeting': { label: '미팅', color: 'bg-blue-50 text-blue-700' },
    'call': { label: '전화', color: 'bg-emerald-50 text-emerald-700' },
    'email': { label: '이메일', color: 'bg-purple-50 text-purple-700' },
    'meal': { label: '식사', color: 'bg-orange-50 text-orange-700' },
    'other': { label: '기타', color: 'bg-slate-50 text-slate-700' }
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
    return (
        <div className="flex flex-col gap-4 print:break-before-page print:block print:pt-10">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-l-4 border-slate-800 pl-3">상세 영업활동 내역</h3>
            <div className="rounded-lg border border-slate-100 overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="w-[100px] text-xs font-bold text-slate-500 uppercase">일자</TableHead>
                            <TableHead className="w-[80px] text-xs font-bold text-slate-500 uppercase">유형</TableHead>
                            <TableHead className="text-xs font-bold text-slate-500 uppercase">고객사</TableHead>
                            <TableHead className="text-xs font-bold text-slate-500 uppercase">활동 제목</TableHead>
                            <TableHead className="w-[100px] text-right text-xs font-bold text-slate-500 uppercase">담당자</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {activities.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-slate-400 text-sm">
                                    해당 기간의 활동 내역이 없습니다.
                                </TableCell>
                            </TableRow>
                        ) : (
                            activities.map((item) => (
                                <React.Fragment key={item.id}>
                                    {/* 첫 번째 줄: 요약 정보 (하단 테두리 제거) */}
                                    <TableRow className="border-none hover:bg-transparent print:break-inside-avoid">
                                        <TableCell className="text-[10px] font-mono text-slate-500 align-top pt-4">
                                            {format(new Date(item.date), 'MM/dd HH:mm', { locale: ko })}
                                        </TableCell>
                                        <TableCell className="align-top pt-3.5">
                                            <Badge variant="outline" className={`text-[10px] font-bold border-none ${typeMap[item.type]?.color || 'bg-slate-50'}`}>
                                                {typeMap[item.type]?.label || item.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm font-bold text-slate-800 align-top pt-4">
                                            {item.clientName}
                                        </TableCell>
                                        <TableCell className="text-sm text-slate-700 font-medium align-top pt-4">
                                            {item.title}
                                        </TableCell>
                                        <TableCell className="text-right text-sm font-medium text-slate-500 align-top pt-4">
                                            {item.userName}
                                        </TableCell>
                                    </TableRow>

                                    {/* 두 번째 줄: 상세 내용 (배경색, 작은 폰트, 하단 테두리 추가) */}
                                    <TableRow className="bg-slate-50/50 border-b border-slate-100 hover:bg-slate-50/50 print:break-inside-avoid">
                                        <TableCell colSpan={5} className="py-3 px-4">
                                            <div className="text-xs text-slate-500 leading-relaxed whitespace-pre-wrap">
                                                {item.content || <span className="italic opacity-50">(상세 내용 없음)</span>}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                </React.Fragment>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
