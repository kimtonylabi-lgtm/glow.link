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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
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
    const [orderDate, setOrderDate] = useState('')
    const [orderDateOpen, setOrderDateOpen] = useState(false)
    const [clientName, setClientName] = useState('')
    const [exportType, setExportType] = useState<'내수' | '수출'>('내수')
    const [orderQuantity, setOrderQuantity] = useState('')
    const [expectedShipDate, setExpectedShipDate] = useState('')
    const [expectedShipDateOpen, setExpectedShipDateOpen] = useState(false)
    const [taeSungProductName, setTaeSungProductName] = useState('')
    const [clientProductName, setClientProductName] = useState('')
    const [warehouse, setWarehouse] = useState('')
    const [catNo, setCatNo] = useState('')
    const [hasSample, setHasSample] = useState(false)
    const [hasFilm, setHasFilm] = useState(false)
    const [hasLaba, setHasLaba] = useState(false)
    const [remarks, setRemarks] = useState('')

    // Parsed BOM
    const [bomItems, setBomItems] = useState<any[]>([])

    useEffect(() => {
        if (isOpen && order) {
            setPoNumber(order.po_number || '')
            setClientName(order.clients?.company_name || '')

            // 날짜 데이터 초기값 자동 바인딩 (수주일/작성일 ➔ 발주일, 납기일 ➔ 출고예정일)
            if (order.order_date) {
                setOrderDate(format(new Date(order.order_date), 'yyyy-MM-dd'))
            } else if (order.created_at) {
                setOrderDate(format(new Date(order.created_at), 'yyyy-MM-dd'))
            } else {
                setOrderDate('')
            }

            if (order.due_date) {
                setExpectedShipDate(format(new Date(order.due_date), 'yyyy-MM-dd'))
            } else {
                setExpectedShipDate('')
            }

            const firstItem = order.order_items?.[0]
            if (firstItem) {
                setOrderQuantity(formatNumber(firstItem.quantity || ''))
                setTaeSungProductName(firstItem.products?.name || '')

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
            const res = await saveOrderDetails(
                order.id,
                poNumber.trim(),
                orderDate,
                expectedShipDate
            )
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
                    {/* Excel Form Table 3.0 (Grid Layout) */}
                    <div className="w-full border-t border-l border-slate-700 bg-slate-900 rounded-sm overflow-hidden text-sm flex flex-col font-sans">

                        {/* Row 1: grid-cols-3 (1:1:1) */}
                        <div className="w-full grid grid-cols-3">
                            <div className="flex border-r border-b border-slate-700 h-10">
                                <div className="w-[85px] bg-slate-800 text-slate-300 flex items-center justify-center text-[12px] font-semibold flex-shrink-0 border-r border-slate-700">발주No.</div>
                                <Input value={poNumber} onChange={(e) => setPoNumber(e.target.value)} placeholder="PO 번호 입력" className="flex-1 h-full border-0 rounded-none bg-transparent shadow-none focus-visible:ring-0 px-3 text-slate-100 font-mono" />
                            </div>
                            <div className="flex border-r border-b border-slate-700 h-10">
                                <div className="w-[85px] bg-slate-800 text-slate-300 flex items-center justify-center text-[12px] font-semibold flex-shrink-0 border-r border-slate-700">발주일</div>
                                <Popover open={orderDateOpen} onOpenChange={setOrderDateOpen}>
                                    <PopoverTrigger asChild>
                                        <Button variant={"ghost"} className="flex-1 h-full justify-between font-mono font-normal hover:bg-slate-800 focus-visible:ring-0 px-3 rounded-none hover:text-slate-100 text-slate-100 data-[state=open]:bg-slate-800">
                                            {orderDate ? orderDate : <span className="text-slate-600">yyyy-mm-dd</span>}
                                            <span className="text-slate-500 text-xs opacity-80">📅</span>
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 z-[9999] border-slate-700 shadow-xl" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={orderDate ? new Date(orderDate) : undefined}
                                            onSelect={(date) => {
                                                if (date) {
                                                    setOrderDate(format(date, 'yyyy-MM-dd'))
                                                    setOrderDateOpen(false)
                                                }
                                            }}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="flex border-r border-b border-slate-700 h-10 bg-slate-900/50">
                                <div className="w-[85px] bg-slate-800 text-slate-300 flex items-center justify-center text-[12px] font-semibold flex-shrink-0 border-r border-slate-700">출고예정일</div>
                                <Popover open={expectedShipDateOpen} onOpenChange={setExpectedShipDateOpen}>
                                    <PopoverTrigger asChild>
                                        <Button variant={"ghost"} className="flex-1 h-full justify-between font-mono font-normal hover:bg-slate-800 focus-visible:ring-0 px-3 rounded-none hover:text-slate-100 text-slate-100 data-[state=open]:bg-slate-800">
                                            {expectedShipDate ? expectedShipDate : <span className="text-slate-600">yyyy-mm-dd</span>}
                                            <span className="text-slate-500 text-xs opacity-80">📅</span>
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 z-[9999] border-slate-700 shadow-xl" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={expectedShipDate ? new Date(expectedShipDate) : undefined}
                                            onSelect={(date) => {
                                                if (date) {
                                                    setExpectedShipDate(format(date, 'yyyy-MM-dd'))
                                                    setExpectedShipDateOpen(false)
                                                }
                                            }}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        {/* Row 2: grid-cols-10 (4:3:3) */}
                        <div className="w-full grid grid-cols-10">
                            <div className="col-span-4 flex border-r border-b border-slate-700 h-10 relative">
                                <div className="w-[85px] bg-slate-800 text-slate-300 flex items-center justify-center text-[12px] font-semibold flex-shrink-0 border-r border-slate-700">발주처</div>
                                <Input value={clientName} onChange={(e) => setClientName(e.target.value)} className="flex-1 h-full border-0 rounded-none bg-transparent shadow-none focus-visible:ring-0 text-slate-100 px-3 font-semibold" />
                                <div className="w-[84px] border-l border-slate-700 flex flex-row h-full">
                                    <button onClick={() => setExportType('내수')} className={`flex-1 text-[11px] font-bold transition-colors border-r border-slate-700/50 ${exportType === '내수' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}>내수</button>
                                    <button onClick={() => setExportType('수출')} className={`flex-1 text-[11px] font-bold transition-colors ${exportType === '수출' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}>수출</button>
                                </div>
                            </div>
                            <div className="col-span-3 flex border-r border-b border-slate-700 h-10">
                                <div className="w-[85px] bg-slate-800 text-slate-300 flex items-center justify-center text-[12px] font-semibold flex-shrink-0 border-r border-slate-700">발주수량</div>
                                <Input value={orderQuantity} onChange={(e) => setOrderQuantity(formatNumber(e.target.value))} className="flex-1 h-full border-0 rounded-none bg-transparent shadow-none focus-visible:ring-0 text-center font-mono text-slate-100" />
                            </div>
                            <div className="col-span-3 flex border-r border-b border-slate-700 h-10">
                                <div className="w-[85px] bg-slate-800 text-slate-300 flex items-center justify-center text-[12px] font-semibold flex-shrink-0 border-r border-slate-700">입고처</div>
                                <Input value={warehouse} onChange={(e) => setWarehouse(e.target.value)} className="flex-1 h-full border-0 rounded-none bg-transparent shadow-none focus-visible:ring-0 text-slate-100 px-3" />
                            </div>
                        </div>

                        {/* Row 3: grid-cols-4 (2:1:1) */}
                        <div className="w-full grid grid-cols-4">
                            <div className="col-span-2 flex border-r border-b border-slate-700 h-10">
                                <div className="w-[85px] bg-slate-800 text-slate-300 flex flex-col items-center justify-center text-[12px] font-semibold flex-shrink-0 border-r border-slate-700 leading-tight">
                                    <span>제품명</span>
                                    <span className="text-[10px] text-slate-500 font-normal">(태성측)</span>
                                </div>
                                <Input value={taeSungProductName} onChange={(e) => setTaeSungProductName(e.target.value)} className="flex-1 h-full border-0 rounded-none bg-transparent shadow-none focus-visible:ring-0 text-slate-100 px-3 font-semibold" />
                            </div>
                            <div className="col-span-1 flex border-r border-b border-slate-700 h-10">
                                <div className="w-[85px] bg-slate-800 text-slate-300 flex items-center justify-center text-[12px] font-semibold flex-shrink-0 border-r border-slate-700">Cat No.</div>
                                <Input value={catNo} onChange={(e) => setCatNo(e.target.value)} placeholder="카탈로그 번호" className="flex-1 h-full border-0 rounded-none bg-transparent shadow-none focus-visible:ring-0 text-slate-100 px-2 text-[13px]" />
                            </div>
                            <div className="col-span-1 flex border-r border-b border-slate-700 h-10">
                                <div className="w-[85px] bg-slate-800 text-slate-300 flex items-center justify-center text-[12px] font-semibold flex-shrink-0 border-r border-slate-700">견본유무</div>
                                <div className="flex-1 flex flex-row h-full p-1.5 gap-1 items-center">
                                    <button onClick={() => setHasSample(true)} className={`flex-1 h-full rounded text-[11px] font-bold transition-colors ${hasSample ? 'bg-slate-600 text-white' : 'text-slate-500 hover:bg-slate-800 border border-slate-700'}`}>있음</button>
                                    <button onClick={() => setHasSample(false)} className={`flex-1 h-full rounded text-[11px] font-bold transition-colors ${!hasSample ? 'bg-slate-600 text-white' : 'text-slate-500 hover:bg-slate-800 border border-slate-700'}`}>없음</button>
                                </div>
                            </div>
                        </div>

                        {/* Row 4: grid-cols-4 (2:1:1) */}
                        <div className="w-full grid grid-cols-4">
                            <div className="col-span-2 flex border-r border-b border-slate-700 h-10">
                                <div className="w-[85px] bg-slate-800 text-slate-300 flex flex-col items-center justify-center text-[12px] font-semibold flex-shrink-0 border-r border-slate-700 leading-tight">
                                    <span>제품명</span>
                                    <span className="text-[10px] text-slate-500 font-normal">(업체측)</span>
                                </div>
                                <Input value={clientProductName} onChange={(e) => setClientProductName(e.target.value)} placeholder="입력하세요" className="flex-1 h-full border-0 rounded-none bg-transparent shadow-none focus-visible:ring-0 text-slate-100 px-3" />
                            </div>
                            <div className="col-span-1 flex border-r border-b border-slate-700 h-10">
                                <div className="w-[85px] bg-slate-800 text-slate-300 flex items-center justify-center text-[12px] font-semibold flex-shrink-0 border-r border-slate-700">필름유무</div>
                                <div className="flex-1 flex flex-row h-full p-1.5 gap-1 items-center bg-slate-900/40">
                                    <button onClick={() => setHasFilm(true)} className={`flex-1 h-full rounded-sm text-[11px] font-bold transition-colors ${hasFilm ? 'bg-slate-600 text-white' : 'text-slate-500 hover:bg-slate-800 border border-slate-700'}`}>있음</button>
                                    <button onClick={() => setHasFilm(false)} className={`flex-1 h-full rounded-sm text-[11px] font-bold transition-colors ${!hasFilm ? 'bg-slate-600 text-white' : 'text-slate-500 hover:bg-slate-800 border border-slate-700'}`}>없음</button>
                                </div>
                            </div>
                            <div className="col-span-1 flex border-r border-b border-slate-700 h-10">
                                <div className="w-[85px] bg-slate-800 text-slate-300 flex items-center justify-center text-[12px] font-semibold flex-shrink-0 border-r border-slate-700">라바유무</div>
                                <div className="flex-1 flex flex-row h-full p-1.5 gap-1 items-center bg-slate-900/40">
                                    <button onClick={() => setHasLaba(true)} className={`flex-1 h-full rounded-sm text-[11px] font-bold transition-colors ${hasLaba ? 'bg-slate-600 text-white' : 'text-slate-500 hover:bg-slate-800 border border-slate-700'}`}>있음</button>
                                    <button onClick={() => setHasLaba(false)} className={`flex-1 h-full rounded-sm text-[11px] font-bold transition-colors ${!hasLaba ? 'bg-slate-600 text-white' : 'text-slate-500 hover:bg-slate-800 border border-slate-700'}`}>없음</button>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* BOM Table Section */}
                    <div className="w-full border border-slate-700 bg-slate-900 rounded-sm overflow-hidden text-sm mt-4">
                        <table className="w-full text-center border-collapse">
                            <thead className="bg-slate-800 text-slate-300 border-b border-slate-700">
                                <tr>
                                    <th className="font-semibold py-2 px-3 border-r border-slate-700 w-[20%]" rowSpan={2}>부품명</th>
                                    <th className="font-semibold py-2 px-3 border-r border-slate-700 w-[30%]" colSpan={2}>사출</th>
                                    <th className="font-semibold py-2 px-3 border-r border-slate-700 w-[25%]" rowSpan={2}>증착 및 코팅</th>
                                    <th className="font-semibold py-2 px-3 w-[25%]" rowSpan={2}>인쇄 및 박</th>
                                </tr>
                                <tr>
                                    <th className="font-semibold py-1.5 px-3 border-r border-t border-slate-700 text-slate-400 bg-slate-800/80 w-[15%]">원료명</th>
                                    <th className="font-semibold py-1.5 px-3 border-r border-t border-slate-700 text-slate-400 bg-slate-800/80 w-[15%]">색상</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {bomItems.length > 0 ? bomItems.map((bom, idx) => (
                                    <tr key={idx} className="hover:bg-slate-800/50 transition-colors text-slate-100">
                                        <td className="p-0 border-r border-slate-700">
                                            <Input value={bom.part_name} onChange={(e) => { const newBoms = [...bomItems]; newBoms[idx].part_name = e.target.value; setBomItems(newBoms); }} className="h-9 border-0 rounded-none bg-transparent shadow-none focus-visible:ring-0 text-center font-semibold text-slate-100" />
                                        </td>
                                        <td className="p-0 border-r border-slate-700">
                                            <Input value={bom.material} onChange={(e) => { const newBoms = [...bomItems]; newBoms[idx].material = e.target.value; setBomItems(newBoms); }} className="h-9 border-0 rounded-none bg-transparent shadow-none focus-visible:ring-0 text-center text-slate-300 text-[13px]" />
                                        </td>
                                        <td className="p-0 border-r border-slate-700">
                                            <Input value={bom.color} onChange={(e) => { const newBoms = [...bomItems]; newBoms[idx].color = e.target.value; setBomItems(newBoms); }} className="h-9 border-0 rounded-none bg-transparent shadow-none focus-visible:ring-0 text-center text-slate-300 text-[13px]" />
                                        </td>
                                        <td className="p-0 border-r border-slate-700">
                                            <Input value={bom.mapped_coating} onChange={(e) => { const newBoms = [...bomItems]; newBoms[idx].mapped_coating = e.target.value; setBomItems(newBoms); }} className="h-9 border-0 rounded-none bg-transparent shadow-none focus-visible:ring-0 text-center text-slate-300 text-[13px]" />
                                        </td>
                                        <td className="p-0">
                                            <Input value={bom.mapped_printing} onChange={(e) => { const newBoms = [...bomItems]; newBoms[idx].mapped_printing = e.target.value; setBomItems(newBoms); }} className="h-9 border-0 rounded-none bg-transparent shadow-none focus-visible:ring-0 text-center text-slate-300 text-[13px]" />
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-slate-500 font-medium text-center">BOM 내역이 없습니다.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <button
                        onClick={() => setBomItems([...bomItems, { part_name: '', material: '', color: '', mapped_coating: '', mapped_printing: '' }])}
                        className="text-emerald-400 hover:text-emerald-300 text-sm font-semibold flex items-center gap-1 transition-colors"
                    >
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
