'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, PackageSearch, ImageIcon } from "lucide-react"
import { ProductFormValues } from '@/lib/validations/product-order'
import Image from 'next/image'

type Product = ProductFormValues & {
    id: string
    image_url: string | null
    created_at: string
}

export function ProductGrid({ initialProducts }: { initialProducts: Product[] }) {
    const [products, setProducts] = useState<Product[]>(initialProducts)

    const categoryLabel = {
        'bottle': '보틀',
        'pump': '펌프',
        'jar': '크림자',
        'cap': '캡'
    }

    const categoryColor = {
        'bottle': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        'pump': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
        'jar': 'bg-pink-500/10 text-pink-500 border-pink-500/20',
        'cap': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">제품 관리</h2>
                    <p className="text-muted-foreground">자사 보유 패키징 제품의 기준 단가와 속성을 관리합니다.</p>
                </div>
            </div>

            {products.length === 0 ? (
                <Card className="bg-card/40 backdrop-blur-xl border-border/40 py-12">
                    <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <PackageSearch className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <p className="text-lg font-medium">등록된 제품이 없습니다</p>
                            <p className="text-sm text-muted-foreground">우측 상단 버튼을 눌러 새 제품을 등록해 주세요.</p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {products.map((product) => (
                        <Card key={product.id} className="group overflow-hidden bg-card/40 backdrop-blur-xl border-border/40 hover:border-primary/50 hover:shadow-[0_0_20px_theme(colors.primary.DEFAULT)/15] transition-all duration-300 relative">
                            {/* Glow Effect */}
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="aspect-square relative bg-muted/30 flex items-center justify-center border-b border-border/40">
                                {product.image_url ? (
                                    <Image
                                        src={product.image_url}
                                        alt={product.name}
                                        fill
                                        className="object-cover p-1 transition-transform duration-500 group-hover:scale-105"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-muted-foreground/50">
                                        <ImageIcon className="w-12 h-12 mb-2" />
                                        <span className="text-xs">이미지 없음</span>
                                    </div>
                                )}

                                <div className="absolute top-2 right-2">
                                    <Badge variant="outline" className={categoryColor[product.category]}>
                                        {categoryLabel[product.category]}
                                    </Badge>
                                </div>
                            </div>

                            <CardContent className="p-4 z-10 relative">
                                <p className="text-xs font-mono text-muted-foreground mb-1">{product.item_code}</p>
                                <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">{product.name}</h3>
                                <div className="mt-4 flex justify-between items-end">
                                    <p className="text-xl font-bold font-mono">
                                        ₩ {product.price.toLocaleString('ko-KR')}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
