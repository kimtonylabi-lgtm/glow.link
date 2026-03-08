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
import { Image as ImageIcon, PackageSearch, Plus } from 'lucide-react'
import Image from 'next/image'
import { SampleForm } from './sample-form'
import { useRouter } from 'next/navigation'

interface SampleListProps {
    initialSamples: SampleRequestWithRelations[]
    clients: any[]
}

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'pending':
            return <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.3)]">대기중</Badge>
        case 'processing':
            return <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.3)]">제작중</Badge>
        case 'shipped':
            return <Badge className="bg-green-500/20 text-green-400 border border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.3)]">발송완료</Badge>
        default:
            return <Badge variant="outline">알 수 없음</Badge>
    }
}

const getSampleTypeBadge = (type: string) => {
    switch (type) {
        case 'random':
            return <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 whitespace-nowrap px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-tighter shadow-[0_0_5px_rgba(59,130,246,0.2)]">랜덤</Badge>
        case 'ct':
            return <Badge className="bg-orange-500/20 text-orange-400 border border-orange-500/30 whitespace-nowrap px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-tighter shadow-[0_0_5px_rgba(249,115,22,0.2)]">CT</Badge>
        case 'design':
            return <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/30 whitespace-nowrap px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-tighter shadow-[0_0_8px_rgba(168,85,247,0.33)]">디자인</Badge>
        default:
            return <Badge variant="outline" className="whitespace-nowrap px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-tighter">ETC</Badge>
    }
}

export function SampleList({ initialSamples, clients }: SampleListProps) {
    const router = useRouter()
    const [selectedImage, setSelectedImage] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [isFormOpen, setIsFormOpen] = useState(false)

    const filteredSamples = initialSamples.filter(sample =>
        sample.clients?.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sample.product_name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <>
            <div className="bg-card/30 backdrop-blur-xl border border-border/50 rounded-xl overflow-hidden shadow-[0_0_30px_theme(colors.primary.DEFAULT)/5]">
                <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row justify-between items-center bg-card/40 gap-4">
                    <div className="flex items-center gap-4 shrink-0">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <PackageSearch className="h-5 w-5 text-primary" /> 나의 샘플 요청 현황
                        </h3>
                        <Button
                            onClick={() => setIsFormOpen(true)}
                            size="sm"
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg shadow-lg shadow-primary/20"
                        >
                            <Plus className="h-4 w-4 mr-1" /> 새 샘플 요청
                        </Button>
                    </div>
                    <div className="relative w-full sm:max-w-xs">
                        <input
                            type="text"
                            placeholder="고객사, 제품명 검색..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all font-medium"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {filteredSamples.length === 0 ? (
                        <div className="p-10 text-center text-muted-foreground flex flex-col items-center">
                            <PackageSearch className="h-10 w-10 mb-3 opacity-20" />
                            {searchTerm ? '검색 결과가 없습니다.' : '아직 요청한 샘플 내역이 없습니다.'}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow className="border-border/50 hover:bg-transparent h-10">
                                    <TableHead className="font-semibold text-foreground px-3 text-xs w-[100px]">번호</TableHead>
                                    <TableHead className="font-semibold text-foreground px-3 text-xs text-center w-[60px]">구분</TableHead>
                                    <TableHead className="font-semibold text-foreground px-3 text-xs">고객사</TableHead>
                                    <TableHead className="font-semibold text-foreground px-3 text-xs">제품명</TableHead>
                                    <TableHead className="font-semibold text-foreground px-3 text-xs text-center">수량</TableHead>
                                    <TableHead className="font-semibold text-foreground px-3 text-xs text-center">요청일</TableHead>
                                    <TableHead className="font-semibold text-foreground px-3 text-xs text-center">상태</TableHead>
                                    <TableHead className="font-semibold text-foreground px-3 text-xs text-center">첨부사진</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredSamples.map((sample) => (
                                    <TableRow key={sample.id} className="border-border/50 hover:bg-card/60 transition-colors h-11">
                                        <TableCell className="font-mono text-primary font-bold whitespace-nowrap px-3 py-1 text-xs">
                                            {sample.sample_no || '-'}
                                        </TableCell>
                                        <TableCell className="text-center px-2 py-1">
                                            {getSampleTypeBadge(sample.sample_type)}
                                        </TableCell>
                                        <TableCell className="font-semibold whitespace-nowrap px-3 py-1 text-sm">
                                            {sample.clients?.company_name}
                                        </TableCell>
                                        <TableCell className="max-w-[150px] md:max-w-[250px] lg:max-w-[350px] truncate px-3 py-1 text-sm" title={sample.product_name}>
                                            {sample.product_name}
                                        </TableCell>
                                        <TableCell className="text-center px-3 py-1 text-sm whitespace-nowrap font-medium">
                                            {sample.quantity}개
                                        </TableCell>
                                        <TableCell className="text-center text-muted-foreground whitespace-nowrap px-3 py-1 text-[13px]">
                                            {format(new Date(sample.request_date), 'MM-dd HH:mm', { locale: ko })}
                                        </TableCell>
                                        <TableCell className="text-center whitespace-nowrap px-3 py-1">
                                            {getStatusBadge(sample.status)}
                                        </TableCell>
                                        <TableCell className="text-center px-3 py-1">
                                            {sample.completion_image_url ? (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setSelectedImage(sample.completion_image_url!)}
                                                    className="h-7 px-2 text-[11px] shadow-[0_0_10px_theme(colors.primary.DEFAULT)/10] hover:shadow-[0_0_15px_theme(colors.primary.DEFAULT)/30] transition-all bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
                                                >
                                                    <ImageIcon className="h-3.5 w-3.5 mr-1" /> 사진
                                                </Button>
                                            ) : (
                                                <span className="text-xs text-muted-foreground opacity-30">-</span>
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
            {/* New Sample Request Modal */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="sm:max-w-[900px] p-0 overflow-hidden bg-slate-950 border-border/40">
                    <SampleForm
                        clients={clients}
                        onSuccess={() => {
                            setIsFormOpen(false)
                            router.refresh()
                        }}
                    />
                </DialogContent>
            </Dialog>
        </>
    )
}
