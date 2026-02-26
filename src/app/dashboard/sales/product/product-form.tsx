'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Plus, Loader2, Upload, AlertCircle } from "lucide-react"
import { toast } from "sonner"

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { productSchema, ProductFormValues } from '@/lib/validations/product-order'
import { addProduct, checkItemCodeUnique } from './actions'
import Image from 'next/image'

export function ProductForm() {
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isValidatingCode, setIsValidatingCode] = useState(false)

    // Image Upload State
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const router = useRouter()

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: "",
            item_code: "",
            category: "bottle",
            price: 0,
        },
    })

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error("이미지는 5MB 이하여야 합니다.")
                return
            }
            setImageFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setImagePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const resetImage = () => {
        setImageFile(null)
        setImagePreview(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    // Real-time Item Code Check
    const handleItemCodeCheck = async () => {
        const itemCode = form.getValues('item_code')
        if (itemCode.length < 3) return

        setIsValidatingCode(true)
        try {
            const isDuplicate = await checkItemCodeUnique(itemCode)
            if (isDuplicate) {
                form.setError('item_code', { type: 'manual', message: '이미 존재하는 품번입니다. 다른 품번을 사용해주세요.' })
            } else {
                form.clearErrors('item_code')
            }
        } catch (error) {
            console.error(error)
        } finally {
            setIsValidatingCode(false)
        }
    }

    async function onSubmit(data: ProductFormValues) {
        setIsLoading(true)

        // Final Double Check Unique before submission
        const isDuplicate = await checkItemCodeUnique(data.item_code)
        if (isDuplicate) {
            form.setError('item_code', { type: 'manual', message: '이미 존재하는 품번입니다.' })
            setIsLoading(false)
            return
        }

        try {
            const result = await addProduct(data, imageFile)

            if (result.success) {
                toast.success('제품이 성공적으로 등록되었습니다.')
                setIsOpen(false)
                form.reset()
                resetImage()
                router.refresh()
            } else {
                toast.error(result.error || '제품 등록에 실패했습니다.')
            }
        } catch (error) {
            toast.error('서버 오류가 발생했습니다.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_theme(colors.primary.DEFAULT)/50] transition-shadow">
                    <Plus className="w-4 h-4 mr-2" />
                    새 제품 등록
                </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto w-full sm:max-w-md border-l border-border/40 bg-background/95 backdrop-blur-xl">
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-xl font-bold bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
                        새 제품 등록
                    </SheetTitle>
                    <SheetDescription className="text-muted-foreground">
                        카탈로그에 표시될 신규 패키징 제품의 세부 정보를 입력합니다. 품번(Item Code)은 고유해야 합니다.
                    </SheetDescription>
                </SheetHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                        {/* Image Upload Area */}
                        <div className="space-y-2">
                            <FormLabel>제품 이미지</FormLabel>
                            <div
                                className={`mt-2 flex justify-center rounded-lg border border-dashed border-border/50 px-6 py-10 transition-colors ${!imagePreview && 'hover:bg-muted/30 cursor-pointer'}`}
                                onClick={() => !imagePreview && fileInputRef.current?.click()}
                            >
                                {imagePreview ? (
                                    <div className="relative w-full aspect-square rounded-md overflow-hidden bg-muted/20 border border-border/40">
                                        <Image src={imagePreview} alt="Preview" fill className="object-cover p-2" />
                                        <div className="absolute top-2 right-2 flex gap-2">
                                            <Button type="button" variant="destructive" size="sm" onClick={(e) => { e.stopPropagation(); resetImage() }}>
                                                삭제
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <Upload className="mx-auto h-12 w-12 text-muted-foreground/50" aria-hidden="true" />
                                        <div className="mt-4 flex text-sm leading-6 text-muted-foreground justify-center">
                                            <label
                                                htmlFor="file-upload"
                                                className="relative cursor-pointer rounded-md font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-background hover:text-primary/80"
                                            >
                                                <span>이미지 업로드</span>
                                                <Input
                                                    id="file-upload"
                                                    name="file-upload"
                                                    type="file"
                                                    accept="image/*"
                                                    className="sr-only"
                                                    ref={fileInputRef}
                                                    onChange={handleImageChange}
                                                />
                                            </label>
                                        </div>
                                        <p className="text-xs leading-5 text-muted-foreground/70">PNG, JPG, GIF up to 5MB</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <FormField
                            control={form.control}
                            name="item_code"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>품번 (Item Code) *</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                placeholder="예: BTL-001"
                                                className="uppercase"
                                                {...field}
                                                onChange={(e) => {
                                                    field.onChange(e.target.value.toUpperCase())
                                                }}
                                                onBlur={(e) => {
                                                    field.onBlur()
                                                    handleItemCodeCheck()
                                                }}
                                            />
                                            {isValidatingCode && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>
                                    </FormControl>
                                    <FormDescription>
                                        제품을 식별하는 고유 코드입니다. (입력 시 중복 체크)
                                    </FormDescription>
                                    {form.formState.errors.item_code?.message && (
                                        <p className="text-sm font-medium text-destructive flex items-center gap-1 mt-2">
                                            <AlertCircle className="w-4 h-4" />
                                            {form.formState.errors.item_code.message}
                                        </p>
                                    )}
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>제품명 *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="예: 프리미엄 에어리스 펌프 50ml" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>카테고리 *</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="카테고리를 선택하세요" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="bottle">보틀 (Bottle)</SelectItem>
                                            <SelectItem value="pump">펌프 (Pump)</SelectItem>
                                            <SelectItem value="jar">크림자 (Jar)</SelectItem>
                                            <SelectItem value="cap">캡 (Cap)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="price"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>기준 단가 (원) *</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₩</span>
                                            <Input
                                                type="number"
                                                className="pl-8"
                                                placeholder="0"
                                                {...field}
                                                onChange={e => field.onChange(Number(e.target.value))}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormDescription>
                                        세팅된 기준 단가는 수주 등록 시 자동으로 불러와집니다.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="pt-4 border-t border-border/40 flex justify-end gap-3">
                            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                                취소
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading || isValidatingCode || !!form.formState.errors.item_code}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_theme(colors.primary.DEFAULT)/30]"
                            >
                                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                제품 등록
                            </Button>
                        </div>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    )
}
