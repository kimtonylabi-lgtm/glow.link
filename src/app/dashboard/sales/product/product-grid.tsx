'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, PackageSearch, ImageIcon, Search, LayoutGrid, List as ListIcon, Edit2, Trash2 } from "lucide-react"
import { ProductFormValues } from '@/lib/validations/product-order'
import Image from 'next/image'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from '@/lib/utils'

type Product = ProductFormValues & {
    id: string
    image_url: string | null
    created_at: string
}

export function ProductGrid({ initialProducts, userRole }: { initialProducts: Product[], userRole: string }) {
    const [products, setProducts] = useState<Product[]>(initialProducts)
    const [searchQuery, setSearchQuery] = useState('')
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

    const canManage = ['admin', 'head', 'support'].includes(userRole)

    useEffect(() => {
        const query = searchQuery.toLowerCase()
        const filtered = initialProducts.filter(p =>
            p.name.toLowerCase().includes(query) ||
            p.item_code.toLowerCase().includes(query)
        )
        setProducts(filtered)
    }, [searchQuery, initialProducts])

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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">제품 관리</h2>
                    <p className="text-muted-foreground text-sm">자사 보유 패키징 제품의 기준 단가와 속성을 관리합니다.</p>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="제품명 또는 품번 검색"
                            className="pl-9 bg-background/50 border-border/50"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex border border-border/50 rounded-lg p-1 bg-background/50">
                        <Button
                            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setViewMode('grid')}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setViewMode('list')}
                        >
                            <ListIcon className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {products.length === 0 ? (
                <Card className="bg-card/40 backdrop-blur-xl border-border/40 py-12">
                    <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <PackageSearch className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <p className="text-lg font-medium">검색 결과가 없습니다</p>
                            <p className="text-sm text-muted-foreground">다른 검색어를 입력하거나 새 제품을 등록해 주세요.</p>
                        </div>
                    </CardContent>
                </Card>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {products.map((product) => (
                        <Card key={product.id} className="group overflow-hidden bg-card/40 backdrop-blur-xl border-border/40 hover:border-primary/50 hover:shadow-[0_0_20px_theme(colors.primary.DEFAULT)/15] transition-all duration-300 relative">
                            {/* Role based Actions overlay */}
                            {canManage && (
                                <div className="absolute top-2 left-2 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button size="icon" variant="secondary" className="h-7 w-7 rounded-full shadow-lg">
                                        <Edit2 className="h-3 w-3" />
                                    </Button>
                                    <Button size="icon" variant="destructive" className="h-7 w-7 rounded-full shadow-lg">
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            )}

                            <div className="aspect-[4/3] relative bg-muted/30 flex items-center justify-center border-b border-border/40">
                                {product.image_url ? (
                                    <div className="relative w-full h-[80%]">
                                        <Image
                                            src={product.image_url}
                                            alt={product.name}
                                            fill
                                            className="object-contain p-2 transition-transform duration-500 group-hover:scale-110"
                                            sizes="100px"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-muted-foreground/30">
                                        <ImageIcon className="w-10 h-10 mb-1" />
                                        <span className="text-[10px]">NO IMAGE</span>
                                    </div>
                                )}

                                <div className="absolute top-2 right-2">
                                    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", categoryColor[product.category])}>
                                        {categoryLabel[product.category]}
                                    </Badge>
                                </div>
                            </div>

                            <CardContent className="p-3 z-10 relative">
                                <p className="text-[10px] font-mono text-muted-foreground/70 mb-0.5">{product.item_code}</p>
                                <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">{product.name}</h3>
                                <div className="mt-2 flex justify-between items-end">
                                    <p className="text-base font-bold font-mono text-primary">
                                        ₩ {product.price.toLocaleString('ko-KR')}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="rounded-xl border border-border/40 bg-card/40 backdrop-blur-xl overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="w-[80px]">이미지</TableHead>
                                <TableHead>품번</TableHead>
                                <TableHead>제품명</TableHead>
                                <TableHead>카테고리</TableHead>
                                <TableHead className="text-right">기준 단가</TableHead>
                                {canManage && <TableHead className="text-center">관리</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.map((product) => (
                                <TableRow key={product.id} className="hover:bg-muted/30 transition-colors group">
                                    <TableCell>
                                        <div className="w-10 h-10 rounded border border-border/50 bg-muted/50 relative overflow-hidden flex items-center justify-center">
                                            {product.image_url ? (
                                                <Image
                                                    src={product.image_url}
                                                    alt={product.name}
                                                    fill
                                                    className="object-contain p-1"
                                                />
                                            ) : (
                                                <ImageIcon className="w-4 h-4 text-muted-foreground/30" />
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">{product.item_code}</TableCell>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={cn("text-[10px]", categoryColor[product.category])}>
                                            {categoryLabel[product.category]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-mono font-bold text-primary">
                                        ₩ {product.price.toLocaleString('ko-KR')}
                                    </TableCell>
                                    {canManage && (
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="icon" variant="ghost" className="h-8 w-8">
                                                    <Edit2 className="h-3.5 h-3.5" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive">
                                                    <Trash2 className="h-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    )
}
