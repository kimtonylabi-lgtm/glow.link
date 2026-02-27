'use client'

import { motion, Variants } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { INDUSTRY_INSIGHTS, EXHIBITION_SCHEDULE } from '@/lib/constants'
import { ArrowRight, Sparkles, Globe, Calendar, Package } from 'lucide-react'

// Animation Variants
const fadeIn: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
}

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 }
  }
}

export default function LandingPage() {
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
            <div className="pt-8">
              <Link href="/login">
                <Button size="lg" className="h-14 px-8 text-lg bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity border-none shadow-[0_0_30px_theme(colors.primary.DEFAULT)/50] hover:shadow-[0_0_50px_theme(colors.accent.DEFAULT)/60]">
                  GlowLink 시작하기 <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </section>

        {/* 2. Industry Insight Section */}
        <section className="container mx-auto px-4 py-24 border-t border-border/30">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeIn} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 flex items-center justify-center gap-3">
              <Globe className="w-8 h-8 text-primary" />
              Industry Insight
            </h2>
            <p className="text-muted-foreground text-lg">국내 주요 용기 및 ODM 업체의 2026 핵심 동향</p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {/* 용기 업체 */}
            <motion.div variants={fadeIn} className="md:col-span-1 border border-border/40 rounded-2xl bg-card/40 backdrop-blur-xl p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-primary">
                <Package className="w-5 h-5" /> 용기 제조 동향
              </h3>
              <div className="space-y-4">
                {INDUSTRY_INSIGHTS.containers.map((item, idx) => (
                  <Card key={idx} className="bg-background/40 border-border/30 backdrop-blur-md">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-primary/20 text-primary">{item.highlight}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground pb-4">
                      {item.description}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>

            {/* ODM 업체 */}
            <motion.div variants={fadeIn} className="md:col-span-2 border border-border/40 rounded-2xl bg-card/40 backdrop-blur-xl p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-accent">
                <Sparkles className="w-5 h-5" /> ODM / 충진 동향
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {INDUSTRY_INSIGHTS.odm.map((item, idx) => (
                  <Card key={idx} className="bg-background/40 border-border/30 backdrop-blur-md h-full">
                    <CardHeader className="pb-2">
                      <div className="flex flex-col gap-2 relative">
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                        <span className="w-fit text-xs font-semibold px-2 py-1 rounded-full bg-accent/20 text-accent">{item.highlight}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground pb-4 mt-2">
                      {item.description}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* 3. Exhibition Schedule Section */}
        <section className="container mx-auto px-4 py-24 border-t border-border/30">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeIn} className="mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 flex items-center gap-3">
              <Calendar className="w-8 h-8 text-primary" />
              2026 Exhibition Schedule
            </h2>
            <p className="text-muted-foreground text-lg">주요 글로벌 뷰티 박람회 일정 (스크롤하여 확인하세요)</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="flex overflow-x-auto pb-8 snap-x snap-mandatory hide-scrollbar gap-6"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {EXHIBITION_SCHEDULE.map((event, idx) => (
              <div key={idx} className="snap-center shrink-0 w-[300px] md:w-[400px]">
                <Card className="h-full border-border/40 bg-card/60 backdrop-blur-xl hover:border-primary/50 transition-colors group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[50px] group-hover:bg-primary/30 transition-colors" />
                  <CardHeader>
                    <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-foreground to-muted-foreground mb-2">
                      {event.month}
                    </div>
                    <CardTitle className="text-2xl text-primary">{event.name}</CardTitle>
                    <CardDescription className="text-base font-medium text-foreground">{event.location}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-muted-foreground relative z-10">
                    {event.description}
                  </CardContent>
                </Card>
              </div>
            ))}
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/20 py-8 text-center text-muted-foreground bg-background/80 backdrop-blur-md">
        <p>© 2026 GlowLink. All rights reserved.</p>
      </footer>
    </div>
  )
}
