'use client'

import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'
import { QuotationForm } from './quotation-form'

export function QuotationFormSheet({ clients, products, clientProducts }: any) {
    const [open, setOpen] = useState(false)

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button className="h-11 px-6 font-bold shadow-[0_0_20px_theme(colors.primary.DEFAULT)/30] rounded-xl hover:shadow-[0_0_25px_theme(colors.primary.DEFAULT)/50] transition-all">
                    <Plus className="w-5 h-5 mr-2" />
                    신규 견적 작성
                </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-[95vw] lg:max-w-[1200px] overflow-y-auto bg-card/95 backdrop-blur-3xl border-l-primary/20">
                <SheetHeader className="mb-8">
                    <SheetTitle className="text-2xl font-black text-primary">신규 견적서 발행</SheetTitle>
                </SheetHeader>
                <QuotationForm
                    clients={clients || []}
                    products={products || []}
                    clientProducts={clientProducts || []}
                    onSuccess={() => setOpen(false)}
                />
            </SheetContent>
        </Sheet>
    )
}
