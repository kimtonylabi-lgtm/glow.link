'use client'

import { cn } from '@/lib/utils'

interface ReportContainerProps {
    children: React.ReactNode
    title: string
    subtitle?: string
}

export function ReportContainer({ children, title, subtitle }: ReportContainerProps) {
    return (
        <div className="flex flex-col items-center w-full gap-8 py-2 md:py-4 animate-in fade-in slide-in-from-bottom-4 duration-700 print:py-0">
            {/* Report Page */}
            <div className={cn(
                "w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-900 shadow-2xl relative transition-all duration-500",
                "print:shadow-none print:w-full print:max-w-none print:min-h-0 print:p-0 print:m-0 print:block print:pt-0 print:mt-0",
                "p-[20mm] flex flex-col gap-8 rounded-sm"
            )}>
                {/* Header Decoration */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-primary print:hidden" />

                {/* Formal Header */}
                <div className="border-b-2 border-slate-950 pb-6 flex justify-between items-end print:pb-4">
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter text-slate-950 uppercase mb-1 print:text-2xl print:leading-tight">
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="text-slate-500 font-medium text-lg italic">{subtitle}</p>
                        )}
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                        <div className="w-12 h-12 bg-slate-950 flex items-center justify-center mb-2">
                            <span className="text-white font-bold text-xl">GL</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Official Internal Report
                        </p>
                    </div>
                </div>

                {/* Content area */}
                <div className="flex-1 flex flex-col gap-10 print:gap-6">
                    {children}
                </div>

                {/* Footer */}
                <div className="mt-auto pt-8 border-t border-slate-100 flex justify-between items-center text-slate-400 text-[10px]">
                    <p>© 2026 GLOWLINK CO., LTD. ALL RIGHTS RESERVED.</p>
                    <p>본 문서는 대외비이며 내부 보고용으로만 사용 가능합니다.</p>
                </div>
            </div>

            {/* Print Guide Message */}
            <div className="text-muted-foreground text-sm flex items-center gap-2 px-4 py-2 bg-muted/30 rounded-full border border-border/40 print:hidden">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                인쇄 시 여백이 포함된 A4 규격으로 출력됩니다 (Ctrl + P)
            </div>

            <style jsx global>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 15mm;
                    }
                    body {
                        background: white !important;
                        color: black !important;
                    }
                    .print-hidden {
                        display: none !important;
                    }
                    /* Prevent table rows and blocks from breaking across pages */
                    .break-inside-avoid {
                        break-inside: avoid;
                        page-break-inside: avoid;
                    }
                    /* Remove headers/footers added by browser */
                    header, footer, nav, aside {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    )
}
