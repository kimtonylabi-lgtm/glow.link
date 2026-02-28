'use client'

import { motion, Variants } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowRight, Sparkles, Globe, Calendar, Package, ExternalLink, MapPin } from 'lucide-react'
import { NewsItem } from '@/lib/news'

// Animation Variants
const fadeIn: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
}

const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
}

interface LandingPageClientProps {
    newsData: {
        industry: NewsItem[];
        trends: NewsItem[];
        exhibitionNews: NewsItem[];
    };
    upcomingExhibitions: any[];
}

export default function LandingPageClient({ newsData, upcomingExhibitions }: LandingPageClientProps) {
    return (
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/30">

            {/* Dynamic Background Neon Blobs */}
            <div className="fixed top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary/10 blur-[150px] pointer-events-none -z-10" />
            <div className="fixed bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-accent/10 blur-[150px] pointer-events-none -z-10" />

            {/* Navigation */}
            <header className="fixed top-0 w-full z-50 backdrop-blur-md border-b border-border/40 bg-background/50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-card border border-primary/40 flex items-center justify-center shadow-[0_0_15px_theme(colors.primary.DEFAULT)/40]">
                            <span className="font-bold text-primary text-sm">GL</span>
                        </div>
                        <span className="font-bold text-xl tracking-tight">GlowLink</span>
                    </div>
                    <Link href="/login">
                        <Button className="bg-primary hover:bg-primary/80 text-primary-foreground shadow-[0_0_15px_theme(colors.primary.DEFAULT)/40] transition-all hover:shadow-[0_0_25px_theme(colors.primary.DEFAULT)/60]">
                            대시보드 입장 <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                    </Link>
                </div>
            </header>

            <main className="pt-24 pb-20">
                {/* 1. Hero Section */}
                <section className="container mx-auto px-4 pt-20 pb-32 text-center relative">
                    <motion.div initial="hidden" animate="visible" variants={fadeIn} className="max-w-4xl mx-auto space-y-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-4 shadow-[0_0_15px_rgba(var(--primary),0.1)]">
                            <Sparkles className="w-4 h-4" />
                            <span>✨ Make the Impossible, Possible</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Beyond Limits</span>, Connect the Future
                        </h1>
                        <div className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed space-y-4">
                            <p className="text-foreground font-semibold text-2xl tracking-tight">"불가능한 일은 없다, 아직 일어나지 않은 일일 뿐..."</p>
                            <p className="text-lg">
                                화장품 용기 제조의 한계를 돌파하는 태성산업의 완벽한 통합 영업/제작 관리 솔루션. GlowLink와 함께 새로운 미래를 선도하세요.
                            </p>
                        </div>
                    </motion.div>
                </section>

                {/* 2. Industry Insight Section */}
                <section className="container mx-auto px-4 py-16 border-t border-border/30">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeIn} className="mb-12">
                        <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                            <Globe className="w-8 h-8 text-primary" />
                            Industry Insight (업계 동향)
                        </h2>
                        <p className="text-muted-foreground">화장품 용기 및 친환경 패키징 최신 소식</p>
                    </motion.div>

                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6"
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                    >
                        {newsData.industry.map((item, idx) => (
                            <motion.div key={idx} variants={fadeIn}>
                                <NewsCard item={item} />
                            </motion.div>
                        ))}
                    </motion.div>
                </section>

                {/* 3. Latest Beauty Trends Section */}
                <section className="container mx-auto px-4 py-16 border-t border-border/30">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeIn} className="mb-12">
                        <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                            <Sparkles className="w-8 h-8 text-accent" />
                            Latest Beauty Trends (최신 트렌드)
                        </h2>
                        <p className="text-muted-foreground">2026 글로벌 뷰티 시장의 변화</p>
                    </motion.div>

                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6"
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                    >
                        {newsData.trends.map((item, idx) => (
                            <motion.div key={idx} variants={fadeIn}>
                                <NewsCard item={item} />
                            </motion.div>
                        ))}
                    </motion.div>
                </section>

                {/* 4. Exhibition News & Upcoming Section */}
                <section className="container mx-auto px-4 py-16 border-t border-border/30">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        {/* Exhibition News */}
                        <div className="lg:col-span-2">
                            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeIn} className="mb-8">
                                <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                                    <Calendar className="w-8 h-8 text-primary" />
                                    Exhibition News (박람회 소식)
                                </h2>
                                <p className="text-muted-foreground">국내외 주요 전시회 보도자료</p>
                            </motion.div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {newsData.exhibitionNews.map((item, idx) => (
                                    <motion.div key={idx} initial="hidden" whileInView="visible" variants={fadeIn} viewport={{ once: true }}>
                                        <NewsCard item={item} />
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Upcoming Exhibitions */}
                        <div className="lg:col-span-1">
                            <motion.div
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, margin: "-100px" }}
                                variants={fadeIn}
                                className="mb-8 p-6 rounded-2xl bg-primary/5 border border-primary/20 backdrop-blur-xl"
                            >
                                <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 text-primary">
                                    <Calendar className="w-6 h-6" />
                                    Upcoming Exhibitions
                                </h3>

                                <div className="space-y-4">
                                    {upcomingExhibitions.map((ex) => (
                                        <div key={ex.id} className="p-4 rounded-xl bg-card/50 border border-border/40 hover:border-primary/40 transition-all group">
                                            <div className="text-sm font-semibold text-primary mb-1">{ex.startDate} ~ {ex.endDate}</div>
                                            <div className="font-bold group-hover:text-primary transition-colors mb-2">{ex.name}</div>
                                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                <MapPin className="w-3 h-3" /> {ex.location}
                                            </div>
                                        </div>
                                    ))}
                                    {upcomingExhibitions.length === 0 && (
                                        <div className="text-center py-8 text-muted-foreground">예정된 박람회가 없습니다.</div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t border-border/20 py-8 text-center text-muted-foreground bg-background/80 backdrop-blur-md">
                <p>© 2026 GlowLink Portal. All rights reserved.</p>
            </footer>
        </div>
    )
}

function NewsCard({ item }: { item: NewsItem }) {
    return (
        <Card className="h-full border-border/40 bg-card/60 backdrop-blur-xl hover:border-primary/50 transition-all group relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-[40px] group-hover:bg-primary/20 transition-colors" />
            <CardHeader className="pb-2">
                <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
                    {item.title}
                </CardTitle>
                <CardDescription className="text-xs pt-1">
                    {new Date(item.pubDate).toLocaleDateString()}
                </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground flex-grow">
                <p className="line-clamp-3 mb-4">{item.description}</p>
                <a href={item.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary text-xs font-semibold hover:underline">
                    자세히 보기 <ExternalLink className="w-3 h-3" />
                </a>
            </CardContent>
        </Card>
    )
}
