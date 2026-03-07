/**
 * @file page-skeleton.tsx
 * @description 페이지 공통 스켈레톤 로딩 컴포넌트
 *
 * [깜빡임 방지 UX 설계]
 * CSS animation-delay: 300ms 적용
 * → 네트워크가 빠를 때(0~300ms): 스켈레톤이 아예 안 보임
 * → 네트워크가 느릴 때(>300ms): 스켈레톤이 서서히 나타남
 * → 사용자 눈이 편안해지고 '번쩍' 깜빡임 제거
 */
'use client'

// 헤더 높이 스켈레톤 (이름, 태그 등)
export function SkeletonLine({ className = '' }: { className?: string }) {
    return (
        <div
            className={`rounded-md bg-muted/60 animate-pulse ${className}`}
            style={{ animationDelay: '300ms' }}
        />
    )
}

// 카드 형태 스켈레톤
export function SkeletonCard() {
    return (
        <div
            className="rounded-xl border border-border/40 bg-card/40 p-4 space-y-3 animate-pulse"
            style={{ animationDelay: '300ms', animationFillMode: 'backwards' }}
        >
            <SkeletonLine className="h-4 w-3/4" />
            <SkeletonLine className="h-3 w-1/2" />
            <SkeletonLine className="h-3 w-5/6" />
        </div>
    )
}

// 테이블 헤더 스켈레톤
export function SkeletonTableHeader() {
    return (
        <div
            className="flex gap-4 px-4 py-3 border-b border-border/40 animate-pulse"
            style={{ animationDelay: '300ms', animationFillMode: 'backwards' }}
        >
            {[40, 20, 20, 20].map((w, i) => (
                <SkeletonLine key={i} className={`h-3 w-[${w}%]`} />
            ))}
        </div>
    )
}

// 테이블 행 스켈레톤
export function SkeletonTableRow() {
    return (
        <div
            className="flex gap-4 px-4 py-4 border-b border-border/20 animate-pulse"
            style={{ animationDelay: '300ms', animationFillMode: 'backwards' }}
        >
            <SkeletonLine className="h-4 w-[40%]" />
            <SkeletonLine className="h-4 w-[20%]" />
            <SkeletonLine className="h-4 w-[20%]" />
            <SkeletonLine className="h-4 w-[20%]" />
        </div>
    )
}

// 전체 테이블 스켈레톤 (헤더 + N개 행)
export function SkeletonTable({ rows = 5 }: { rows?: number }) {
    return (
        <div className="rounded-xl border border-border/40 bg-card/40 overflow-hidden">
            <SkeletonTableHeader />
            {Array.from({ length: rows }).map((_, i) => (
                <SkeletonTableRow key={i} />
            ))}
        </div>
    )
}

// 페이지 상단 타이틀 + 버튼 줄 스켈레톤
export function SkeletonPageHeader() {
    return (
        <div
            className="flex items-center justify-between mb-6 animate-pulse"
            style={{ animationDelay: '300ms', animationFillMode: 'backwards' }}
        >
            <div className="space-y-2">
                <SkeletonLine className="h-7 w-48" />
                <SkeletonLine className="h-4 w-72" />
            </div>
            <SkeletonLine className="h-9 w-28 rounded-lg" />
        </div>
    )
}
