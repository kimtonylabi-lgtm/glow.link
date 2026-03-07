/**
 * [깜빡임 방지] 샘플요청 페이지 로딩 스켈레톤
 * animation-delay 300ms → 빠른 통신 시 스켈레톤이 보이지 않음
 */
import { SkeletonPageHeader, SkeletonCard, SkeletonLine } from '@/components/dashboard/page-skeleton'

export default function SampleLoading() {
    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
            <SkeletonPageHeader />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* 왼쪽: 폼 스켈레톤 */}
                <div className="lg:col-span-4 xl:col-span-3 space-y-4">
                    <div
                        className="rounded-xl border border-border/40 bg-card/40 p-5 space-y-4 animate-pulse"
                        style={{ animationDelay: '300ms', animationFillMode: 'backwards' }}
                    >
                        <SkeletonLine className="h-6 w-32" />
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="space-y-1.5">
                                <SkeletonLine className="h-3 w-20" />
                                <SkeletonLine className="h-9 w-full rounded-lg" />
                            </div>
                        ))}
                        <SkeletonLine className="h-9 w-full rounded-lg mt-2" />
                    </div>
                </div>

                {/* 오른쪽: 목록 스켈레톤 */}
                <div className="lg:col-span-8 xl:col-span-9 space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
            </div>
        </div>
    )
}
