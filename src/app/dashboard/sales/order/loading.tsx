/**
 * [깜빡임 방지] 수주/납기 페이지 로딩 스켈레톤
 * animation-delay 300ms → 빠른 통신 시 스켈레톤이 보이지 않음
 */
import { SkeletonPageHeader, SkeletonTable, SkeletonLine } from '@/components/dashboard/page-skeleton'

export default function OrderLoading() {
    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
            <SkeletonPageHeader />

            {/* 탭 바 */}
            <div
                className="flex gap-2 border-b border-border/40 pb-0 animate-pulse"
                style={{ animationDelay: '300ms', animationFillMode: 'backwards' }}
            >
                <SkeletonLine className="h-9 w-28 rounded-t-lg" />
                <SkeletonLine className="h-9 w-28 rounded-t-lg" />
                <SkeletonLine className="h-9 w-28 rounded-t-lg" />
            </div>

            {/* 주 테이블 */}
            <SkeletonTable rows={7} />

            {/* 보조 테이블 */}
            <SkeletonTable rows={4} />
        </div>
    )
}
