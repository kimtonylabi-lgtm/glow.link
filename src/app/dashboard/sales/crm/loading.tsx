/**
 * [깜빡임 방지] CRM 페이지 로딩 스켈레톤
 * animation-delay 300ms → 빠른 통신 시 스켈레톤이 보이지 않음
 */
import { SkeletonPageHeader, SkeletonTable, SkeletonLine } from '@/components/dashboard/page-skeleton'

export default function CrmLoading() {
    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
            <SkeletonPageHeader />

            {/* 검색/필터 바 */}
            <div
                className="flex gap-3 animate-pulse"
                style={{ animationDelay: '300ms', animationFillMode: 'backwards' }}
            >
                <SkeletonLine className="h-9 flex-1 max-w-sm rounded-lg" />
                <SkeletonLine className="h-9 w-24 rounded-lg" />
                <SkeletonLine className="h-9 w-24 rounded-lg" />
            </div>

            {/* 메인 테이블 */}
            <SkeletonTable rows={8} />
        </div>
    )
}
