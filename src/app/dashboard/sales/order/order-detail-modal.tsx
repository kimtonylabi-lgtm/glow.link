'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { toast } from 'sonner'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { saveOrderDetails } from './order-actions'
import { Loader2, Save, X, Plus } from 'lucide-react'

const formatNumber = (val: string | number) => {
    if (!val) return ''
    const num = typeof val === 'string' ? parseInt(val.replace(/,/g, '')) : val
    if (isNaN(num)) return ''
    return num.toLocaleString()
}

export function OrderDetailModal({
    order,
    isOpen,
    onOpenChange
}: {
    order: any
    isOpen: boolean
    onOpenChange: (open: boolean) => void
}) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    // Form States
    const [poNumber, setPoNumber] = useState('')
    const [exportType, setExportType] = useState<'내수' | '수출'>('내수')
    const [orderQuantity, setOrderQuantity] = useState('')
    const [expectedShipDate, setExpectedShipDate] = useState('')
    const [clientProductName, setClientProductName] = useState('')
    const [warehouse, setWarehouse] = useState('')
    const [catNo, setCatNo] = useState('')
    const [printName, setPrintName] = useState('')
    const [hasSample, setHasSample] = useState(false)
    const [hasFilm, setHasFilm] = useState(false)
    const [hasLaba, setHasLaba] = useState(false)
    const [remarks, setRemarks] = useState('')

    // Parsed BOM
    const [bomItems, setBomItems] = useState<any[]>([])

    useEffect(() => {
        if (isOpen && order) {
            setPoNumber(order.po_number || '')

            const firstItem = order.order_items?.[0]
            if (firstItem) {
                setOrderQuantity(formatNumber(firstItem.quantity || ''))

                let parsed = []
                try {
                    parsed = typeof firstItem.post_processing === 'string'
                        ? JSON.parse(firstItem.post_processing)
                        : (firstItem.post_processing || [])
                } catch (e) { parsed = [] }

                const mappedBoms = parsed.map((bom: any) => {
                    const coatPlat = [bom.metalizing, bom.coating].filter(Boolean).join(' / ')
                    const printBox = [bom.printing].filter(Boolean).join(' / ')

                    return {
                        ...bom,
                        mapped_coating: coatPlat,
                        mapped_printing: printBox,
                    }
                })
                setBomItems(mappedBoms)
            } else {
                setBomItems([])
                setOrderQuantity('')
            }
        }
    }, [isOpen, order])

    const handleSave = async () => {
        if (!poNumber.trim()) {
            toast.error('발주 No.를 입력해주세요.')
            return
        }

        setIsLoading(true)
        try {
            const res = await saveOrderDetails(order.id, poNumber.trim())
            if (res.success) {
                toast.success('발주 정보가 저장되었습니다.')
                onOpenChange(false)
                router.refresh()
            } else {
                toast.error(res.error || '저장에 실패했습니다.')
            }
        } catch (error) {
            toast.error('저장 중 오류가 발생했습니다.')
        } finally {
            setIsLoading(false)
        }
    }

    if (!order) return null

    const clientName = order.clients?.company_name || '-'
    const orderDate = format(new Date(order.order_date), 'yyyy-MM-dd')
    const taeSungProductName = order.order_items?.[0]?.products?.name || '-'

    // Reusable Toggle Button
    const ToggleBtn = ({ active, label, onClick }: { active: boolean, label: string, onClick: () => void }) => (
        <button
            onClick={onClick}
            className={`flex-1 text-xs font-medium py-1.5 transition-colors border-border/40 ${active ? 'bg-primary/20 text-primary' : 'bg-transparent text-muted-foreground hover:bg-muted/50'}`}
        >
            {label}
        </button>
    )

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-[1000px] overflow-y-auto bg-slate-950 border-l-border/50 p-0 hide-scrollbar [&>button]:hidden">

                {/* Custom Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-slate-900 sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                            <Save className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <SheetTitle className="text-lg font-bold text-slate-100 flex items-center gap-2 m-0 p-0">
                                발주 상세 입력
                                <span className="text-muted-foreground font-normal text-sm ml-2">— BOM / 특이사항 / 작업사진</span>
                            </SheetTitle>
                        </div>
                    </div>
                    <button onClick={() => onOpenChange(false)} className="text-muted-foreground hover:text-foreground">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Excel Form Table */}
                    <div className="w-full border border-slate-700 bg-slate-900 rounded-sm overflow-hidden text-sm">
                        <table className="w-full border-collapse">
                            <tbody>
                                {/* Row 1: 발주일 */}
                                <tr className="border-b border-slate-700">
                                    <td className="w-24 bg-slate-800 text-slate-300 font-semibold px-4 py-2 border-r border-slate-700 text-center">발주일</td>
                                    <td colSpan={5} className="p-0">
                                        <div className="flex items-center w-full px-3 py-2 text-slate-100 font-mono">
                                            {orderDate}
                                            <span className="ml-auto text-slate-500">📅</span>
                                        </div>
                                    </td>
                                </tr>

                                {/* Row 2: 발주No */}
                                <tr className="border-b border-slate-700">
                                    <td className="w-24 bg-slate-800 text-slate-300 font-semibold px-4 py-2 border-r border-slate-700 text-center">발주No.</td>
                                    <td colSpan={5} className="p-0">
                                        <Input
                                            value={poNumber}
                                            onChange={(e) => setPoNumber(e.target.value)}
                                            placeholder="PO 번호 입력"
                                            className="h-10 border-0 rounded-none bg-transparent shadow-none focus-visible:ring-0 font-mono text-slate-100 px-3"
                                        />
                                    </td>
                                </tr>

                                {/* Row 3: 발주처 / 수량 / 출고 */}
                                <tr className="border-b border-slate-700">
                                    <td className="w-24 bg-slate-800 text-slate-300 font-semibold px-4 py-2 border-r border-slate-700 text-center">발주처</td>
                                    <td className="w-[30%] p-0 border-r border-slate-700">
                                        <div className="flex items-stretch h-10 w-full">
                                            <div className="flex-1 flex items-center px-3 font-semibold text-slate-100">{clientName}</div>
                                            <div className="w-20 border-l border-slate-700 flex flex-col divide-y divide-slate-700 border-x">
                                                <ToggleBtn active={exportType === '내수'} label="내수" onClick={() => setExportType('내수')} />
                                                <ToggleBtn active={exportType === '수출'} label="수출" onClick={() => setExportType('수출')} />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="w-24 bg-slate-800 text-slate-300 font-semibold px-4 py-2 border-r border-slate-700 text-center">발주수량</td>
                                    <td className="p-0 border-r border-slate-700 w-32">
                                        <Input
                                            value={orderQuantity}
                                            onChange={(e) => setOrderQuantity(formatNumber(e.target.value))}
                                            className="h-full border-0 rounded-none bg-transparent shadow-none focus-visible:ring-0 text-center font-mono text-slate-100"
                                        />
                                    </td>
                                    <td className="w-24 bg-slate-800 text-slate-300 font-semibold px-2 py-2 border-r border-slate-700 text-center text-[13px] leading-tight">
                                        <div className="flex flex-col">
                                            <span>출고</span>
                                            <span>예정일</span>
                                        </div>
                                    </td>
                                    <td className="p-0 text-center border-l border-slate-700">
                                        <div className="flex items-center justify-between w-full px-3 py-2 text-slate-400 font-mono text-sm">
                                            <Input
                                                value={expectedShipDate}
                                                onChange={(e) => setExpectedShipDate(e.target.value)}
                                                placeholder="년 - 월 - 일"
                                                className="h-full border-0 rounded-none bg-transparent shadow-none focus-visible:ring-0 text-center flex-1 text-slate-100 p-0 placeholder:text-slate-600"
                                            />
                                            <span>📅</span>
                                        </div>
                                    </td>
                                </tr>

                                {/* Row 4: 제품명 구분 */}
                                <tr className="border-b border-slate-700">
                                    <td className="bg-slate-800 text-slate-300 font-semibold border-r border-slate-700 text-center p-0" rowSpan={2}>제품명</td>
                                    <td className="p-0 border-r border-slate-700">
                                        <div className="flex items-center h-10 grid grid-cols-4">
                                            <div className="col-span-1 bg-slate-800 text-slate-300 flex items-center justify-center h-full border-r border-slate-700 font-semibold text-[13px]">태성측</div>
                                            <div className="col-span-3 px-3 flex items-center text-slate-100 h-full">{taeSungProductName}</div>
                                        </div>
                                    </td>
                                    <td className="bg-slate-800 text-slate-300 font-semibold px-4 py-2 border-r border-slate-700 text-center w-24">입고처</td>
                                    <td colSpan={3} className="p-0">
                                        <Input
                                            value={warehouse}
                                            onChange={(e) => setWarehouse(e.target.value)}
                                            placeholder="입고처"
                                            className="h-10 border-0 rounded-none bg-transparent shadow-none focus-visible:ring-0 text-slate-100 px-3"
                                        />
                                    </td>
                                </tr>
                                <tr className="border-b border-slate-700">
                                    <td className="p-0 border-r border-slate-700">
                                        <div className="flex items-center h-10 grid grid-cols-4">
                                            <div className="col-span-1 bg-slate-800 text-slate-300 flex items-center justify-center h-full border-r border-slate-700 font-semibold text-[13px]">업체측</div>
                                            <div className="col-span-3 px-0 h-full">
                                                <Input
                                                    value={clientProductName}
                                                    onChange={(e) => setClientProductName(e.target.value)}
                                                    placeholder="업체측 제품명"
                                                    className="h-full border-0 rounded-none bg-transparent shadow-none focus-visible:ring-0 text-slate-100 px-3"
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="bg-slate-800 text-slate-300 font-semibold px-4 py-2 border-r border-slate-700 text-center">Cat No.</td>
                                    <td colSpan={3} className="p-0">
                                        <Input
                                            value={catNo}
                                            onChange={(e) => setCatNo(e.target.value)}
                                            placeholder="카탈로그 번호"
                                            className="h-10 border-0 rounded-none bg-transparent shadow-none focus-visible:ring-0 text-slate-100 px-3"
                                        />
                                    </td>
                                </tr>

                                {/* Row 5: 인쇄명 및 세부 */}
                                <tr className="border-slate-700">
                                    <td className="w-24 bg-slate-800 text-slate-300 font-semibold px-4 py-2 border-r border-slate-700 text-center">인쇄명</td>
                                    <td className="p-0 border-r border-slate-700 h-10 w-[30%]">
                                        <Input
                                            value={printName}
                                            onChange={(e) => setPrintName(e.target.value)}
                                            placeholder="인쇄 방식"
                                            className="h-full border-0 rounded-none bg-transparent shadow-none focus-visible:ring-0 text-slate-100 px-3"
                                        />
                                    </td>
                                    <td className="w-24 bg-slate-800 text-slate-300 font-semibold px-2 py-2 border-r border-slate-700 text-center text-sm">
                                        견본유무
                                    </td>
                                    <td className="p-0 border-r border-slate-700">
                                        <div className="flex h-full p-1 gap-1">
                                            <button onClick={() => setHasSample(true)} className={`flex-1 rounded-sm text-[12px] font-medium transition-colors ${hasSample ? 'bg-slate-700 text-slate-100 border border-slate-500' : 'bg-transparent text-slate-500 border border-slate-700 hover:text-slate-300'}`}>있음</button>
                                            <button onClick={() => setHasSample(false)} className={`flex-1 rounded-sm text-[12px] font-medium transition-colors ${!hasSample ? 'bg-slate-700 text-slate-100 border border-slate-500' : 'bg-transparent text-slate-500 border border-slate-700 hover:text-slate-300'}`}>없음</button>
                                        </div>
                                    </td>
                                    <td colSpan={2} className="p-0 border-r border-slate-700 h-10">
                                        <div className="flex h-full">
                                            <div className="flex-1 flex flex-col border-r border-slate-700">
                                                <div className="flex-1 flex border-b border-slate-700">
                                                    <div className="w-20 bg-slate-800 text-slate-300 font-semibold text-center text-[13px] flex items-center justify-center border-r border-slate-700">필름유무</div>
                                                    <div className="flex-1 flex p-1 gap-1">
                                                        <button onClick={() => setHasFilm(true)} className={`flex-1 rounded-sm text-[12px] font-medium transition-colors ${hasFilm ? 'bg-slate-700 text-slate-100 border border-slate-500' : 'bg-transparent text-slate-500 border border-slate-700 hover:text-slate-300'}`}>있음</button>
                                                        <button onClick={() => setHasFilm(false)} className={`flex-1 rounded-sm text-[12px] font-medium transition-colors ${!hasFilm ? 'bg-slate-700 text-slate-100 border border-slate-500' : 'bg-transparent text-slate-500 border border-slate-700 hover:text-slate-300'}`}>없음</button>
                                                    </div>
                                                </div>
                                                <div className="flex-1 flex">
                                                    <div className="w-20 bg-slate-800 text-slate-300 font-semibold text-center text-[13px] flex items-center justify-center border-r border-slate-700">라바유무</div>
                                                    <div className="flex-1 flex p-1 gap-1">
                                                        <button onClick={() => setHasLaba(true)} className={`flex-1 rounded-sm text-[12px] font-medium transition-colors ${hasLaba ? 'bg-slate-700 text-slate-100 border border-slate-500' : 'bg-transparent text-slate-500 border border-slate-700 hover:text-slate-300'}`}>있음</button>
                                                        <button onClick={() => setHasLaba(false)} className={`flex-1 rounded-sm text-[12px] font-medium transition-colors ${!hasLaba ? 'bg-slate-700 text-slate-100 border border-slate-500' : 'bg-transparent text-slate-500 border border-slate-700 hover:text-slate-300'}`}>없음</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* BOM Table Section */}
                    <div className="w-full border border-slate-700 bg-slate-900 rounded-sm overflow-hidden text-sm mt-4">
                        <table className="w-full text-center border-collapse">
                            <thead className="bg-slate-800 text-slate-300 border-b border-slate-700">
                                <tr>
                                    <th className="font-semibold py-2 px-3 border-r border-slate-700 w-[18%]" rowSpan={2}>부품명</th>
                                    <th className="font-semibold py-2 px-3 border-r border-slate-700 w-[30%]" colSpan={2}>사출</th>
                                    <th className="font-semibold py-2 px-3 border-r border-slate-700 w-[22%]" rowSpan={2}>증착 및 코팅</th>
                                    <th className="font-semibold py-2 px-3 border-r border-slate-700 w-[22%]" rowSpan={2}>인쇄 및 박</th>
                                    <th className="font-semibold py-2 px-3 w-[8%]" rowSpan={2}>-</th>
                                </tr>
                                <tr>
                                    <th className="font-semibold py-1.5 px-3 border-r border-t border-slate-700 text-slate-400 bg-slate-800/80 w-[15%]">원료명</th>
                                    <th className="font-semibold py-1.5 px-3 border-r border-t border-slate-700 text-slate-400 bg-slate-800/80 w-[15%]">색상</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {bomItems.length > 0 ? bomItems.map((bom, idx) => (
                                    <tr key={idx} className="hover:bg-slate-800/50 transition-colors text-slate-100">
                                        <td className="py-2.5 px-3 border-r border-slate-700 truncate">{bom.part_name || '-'}</td>
                                        <td className="py-2.5 px-3 border-r border-slate-700 text-slate-300 text-[13px]">{bom.material || '-'}</td>
                                        <td className="py-2.5 px-3 border-r border-slate-700 text-slate-300 text-[13px]">{bom.color || '-'}</td>
                                        <td className="py-2.5 px-3 border-r border-slate-700 text-slate-300 text-[13px]">{bom.mapped_coating || '-'}</td>
                                        <td className="py-2.5 px-3 border-r border-slate-700 text-slate-300 text-[13px]">{bom.mapped_printing || '-'}</td>
                                        <td className="py-2.5 px-3"></td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-slate-500 font-medium text-center">
                                            BOM 내역이 없습니다. (단일 상품)
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <button className="text-emerald-400 hover:text-emerald-300 text-sm font-semibold flex items-center gap-1 transition-colors">
                        <Plus className="w-4 h-4" /> BOM 행 추가
                    </button>

                    {/* Footer Remarks & Save */}
                    <div className="space-y-2 mt-4">
                        <label className="text-sm font-semibold text-slate-300">특이사항</label>
                        <textarea
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            placeholder="특이사항을 입력하세요."
                            className="w-full h-24 bg-slate-900 border border-slate-700 rounded-md p-3 text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50 placeholder:text-slate-600 resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-8">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="w-full h-12 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300"
                        >
                            취소
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="w-full h-12 text-base font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                            발주 상세 저장
                        </Button>
                    </div>

                </div>
            </SheetContent>
        </Sheet>
    )
}
