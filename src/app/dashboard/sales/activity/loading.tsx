/**
 * [깜빡임 방지] 영업활동 페이지 로딩 스켈레톤
 * animation-delay 300ms → 빠른 통신 시 스켈레톤이 보이지 않음
 */
import { SkeletonPageHeader, SkeletonCard, SkeletonLine } from '@/components/dashboard/page-skeleton'

export default function ActivityLoading() {
    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
            <SkeletonPageHeader />

            {/* 상단 탭 */}
            <div
                className="flex gap-2 animate-pulse"
                style={{ animationDelay: '300ms', animationFillMode: 'backwards' }}
            >
                <SkeletonLine className="h-9 w-24 rounded-lg" />
                <SkeletonLine className="h-9 w-24 rounded-lg" />
                <SkeletonLine className="h-9 w-24 rounded-lg" />
            </div>

            {/* 활동 카드 목록 */}
            <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <SkeletonCard key={i} />
                ))}
            </div>
        </div>
    )
}
