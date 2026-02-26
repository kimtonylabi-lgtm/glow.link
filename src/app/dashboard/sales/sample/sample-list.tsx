'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { SampleRequestWithRelations } from '@/types/crm'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Image as ImageIcon, PackageSearch } from 'lucide-react'
import Image from 'next/image'

interface SampleListProps {
    samples: SampleRequestWithRelations[]
}

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'pending':
            return <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.5)]">대기중</Badge>
        case 'processing':
            return <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.5)]">제작중</Badge>
        case 'shipped':
            return <Badge className="bg-green-500/20 text-green-400 border border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.5)]">발송완료</Badge>
        default:
            return <Badge variant="outline">알 수 없음</Badge>
    }
}

export function SampleList({ samples }: SampleListProps) {
    const [selectedImage, setSelectedImage] = useState<string | null>(null)

    return (
        <>
            <div className="bg-card/30 backdrop-blur-xl border border-border/50 rounded-xl overflow-hidden shadow-[0_0_30px_theme(colors.primary.DEFAULT)/5]">
                <div className="p-6 border-b border-border/50 flex justify-between items-center bg-card/40">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <PackageSearch className="h-5 w-5 text-primary" /> 나의 샘플 요청 현황
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    {samples.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
                            <PackageSearch className="h-12 w-12 mb-4 opacity-20" />
                            아직 요청한 샘플 내역이 없습니다.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow className="border-border/50 hover:bg-transparent">
                                    <TableHead className="font-semibold text-foreground">고객사</TableHead>
                                    <TableHead className="font-semibold text-foreground">제품명</TableHead>
                                    <TableHead className="font-semibold text-foreground text-center">수량</TableHead>
                                    <TableHead className="font-semibold text-foreground text-center">요청일</TableHead>
                                    <TableHead className="font-semibold text-foreground text-center">상태</TableHead>
                                    <TableHead className="font-semibold text-foreground text-center">첨부사진</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {samples.map((sample) => (
                                    <TableRow key={sample.id} className="border-border/50 hover:bg-card/60 transition-colors">
                                        <TableCell className="font-medium whitespace-nowrap">
                                            {sample.clients?.company_name}
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate" title={sample.product_name}>
                                            {sample.product_name}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {sample.quantity}개
                                        </TableCell>
                                        <TableCell className="text-center text-muted-foreground whitespace-nowrap">
                                            {format(new Date(sample.request_date), 'MM-dd HH:mm', { locale: ko })}
                                        </TableCell>
                                        <TableCell className="text-center whitespace-nowrap">
                                            {getStatusBadge(sample.status)}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {sample.completion_image_url ? (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setSelectedImage(sample.completion_image_url!)}
                                                    className="h-8 shadow-[0_0_10px_theme(colors.primary.DEFAULT)/20] hover:shadow-[0_0_15px_theme(colors.primary.DEFAULT)/40] transition-all bg-primary/10 hover:bg-primary/20 text-primary"
                                                >
                                                    <ImageIcon className="h-4 w-4 mr-2" /> 사진 보기
                                                </Button>
                                            ) : (
                                                <span className="text-xs text-muted-foreground opacity-50">-</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </div>

            {/* Image Modal */}
            <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
                <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-card/95 backdrop-blur-3xl border-border/50">
                    <DialogHeader className="p-4 border-b border-border/50 pb-4">
                        <DialogTitle className="text-lg">발송 완료 샘플 사진</DialogTitle>
                    </DialogHeader>
                    <div className="relative w-full aspect-square bg-black/50 flex items-center justify-center">
                        {selectedImage && (
                            <Image
                                src={selectedImage}
                                alt="Sample Completion"
                                fill
                                className="object-contain"
                                unoptimized
                            />
                        )}
                    </div>
                    <div className="p-4 bg-muted/30 text-sm text-center text-muted-foreground">
                        샘플실에서 등록된 실물 확인용 사진입니다.
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
